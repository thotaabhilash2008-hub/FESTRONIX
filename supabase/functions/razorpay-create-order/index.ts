import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function cleanText(value: unknown, maxLength: number): string {
  return String(value ?? '').trim().slice(0, maxLength);
}

function normalizeRoll(value: unknown): string {
  return cleanText(value, 50).toUpperCase();
}

function cleanItem(item: Record<string, unknown>, eventId: string, format: string, fee: number) {
  const teammates = Array.isArray(item.teammates) ? item.teammates.slice(0, 10).map(member => {
    const value = (member && typeof member === 'object') ? member as Record<string, unknown> : {};
    return {
      name: cleanText(value.name, 120),
      email: cleanText(value.email, 180).toLowerCase(),
      phone: cleanText(value.phone, 40),
      college: cleanText(value.college, 180),
      rollNumber: cleanText(value.rollNumber ?? value.roll_number, 50).toUpperCase(),
      deptSection: cleanText(value.deptSection ?? value.dept_section, 80).toUpperCase()
    };
  }) : [];

  return {
    eventId,
    buyerRoll: cleanText(item.buyerRoll ?? item.buyer_roll, 50).toUpperCase(),
    leaderName: cleanText(item.leaderName ?? item.leader_name, 120),
    leaderEmail: cleanText(item.leaderEmail ?? item.leader_email, 180).toLowerCase(),
    leaderPhone: cleanText(item.leaderPhone ?? item.leader_phone, 40),
    leaderCollege: cleanText(item.leaderCollege ?? item.leader_college, 180),
    leaderRoll: cleanText(item.leaderRoll ?? item.leader_roll, 50).toUpperCase(),
    format,
    fee,
    teammates,
    teamName: cleanText(item.teamName ?? item.team_name, 120),
    teamCode: cleanText(item.teamCode ?? item.team_code, 40).toUpperCase()
  };
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405);

  const keyId = cleanText(Deno.env.get('RAZORPAY_KEY_ID'), 120);
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
  if (!keyId || !keySecret) {
    return respond({ error: 'Razorpay test credentials are not configured on the backend.' }, 503);
  }
  if (!keyId.startsWith('rzp_test_')) {
    return respond({ error: 'Only Razorpay test-mode keys are enabled in this environment.' }, 503);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const requestedEvent = cleanText(body.eventId, 160);
    const items = Array.isArray(body.items) ? body.items : [];
    if (!requestedEvent || items.length < 1 || items.length > 10) {
      return respond({ error: 'A valid event and between 1 and 10 registration items are required.' }, 400);
    }

    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let event: any = null;
    let eventError: any = null;
    if (isUuid(requestedEvent)) {
      const result = await db.from('events')
        .select('id, slug, title, fee, format, capacity, registered_count, status, deadline, approval_status, is_deleted')
        .eq('id', requestedEvent)
        .maybeSingle();
      event = result.data;
      eventError = result.error;
    } else {
      const result = await db.from('events')
        .select('id, slug, title, fee, format, capacity, registered_count, status, deadline, approval_status, is_deleted')
        .eq('slug', requestedEvent)
        .maybeSingle();
      event = result.data;
      eventError = result.error;
    }
    if (eventError) return respond({ error: `Unable to validate the event: ${eventError.message}` }, 400);
    if (!event || event.is_deleted) return respond({ error: 'Event not found.' }, 404);
    if (event.status !== 'open' && event.status !== 'upcoming') return respond({ error: 'This event is not accepting registrations.' }, 400);
    if (event.approval_status && event.approval_status !== 'approved') return respond({ error: 'This event is not approved for registration.' }, 400);
    if (event.deadline && new Date(event.deadline).getTime() < Date.now()) return respond({ error: 'The registration deadline has passed.' }, 400);

    const fee = Number(event.fee) || 0;
    if (fee <= 0) return respond({ error: 'This event does not require a Razorpay payment.' }, 400);
    if (Number(event.registered_count || 0) + items.length > Number(event.capacity || 0)) {
      return respond({ error: 'There are not enough seats remaining for this order.' }, 409);
    }

    const normalizedItems = items.map(item => cleanItem(
      item && typeof item === 'object' ? item as Record<string, unknown> : {},
      event.id,
      event.format,
      fee
    ));

    // Fail before creating a Razorpay order when any participant already has
    // an active registration. This avoids taking a second payment for a pass
    // that the finalization transaction would correctly reject later.
    const requestedRolls = new Set<string>();
    const duplicateRolls = new Set<string>();
    for (const item of normalizedItems) {
      const rolls = [item.leaderRoll, ...item.teammates.map(member => member.rollNumber)];
      for (const roll of rolls) {
        const normalizedRoll = normalizeRoll(roll);
        if (!normalizedRoll) continue;
        if (requestedRolls.has(normalizedRoll)) duplicateRolls.add(normalizedRoll);
        requestedRolls.add(normalizedRoll);
      }
    }
    if (duplicateRolls.size > 0) {
      return respond({
        error: `The order contains duplicate participant roll number(s): ${Array.from(duplicateRolls).join(', ')}.`,
        code: 'DUPLICATE_ORDER_PARTICIPANT'
      }, 400);
    }

    const { data: existingRegistrations, error: existingRegistrationError } = await db.from('registrations')
      .select('id, display_id, leader_roll')
      .eq('event_id', event.id)
      .neq('payment_status', 'rejected');
    if (existingRegistrationError) {
      console.error('Razorpay duplicate preflight failed:', existingRegistrationError.message);
      return respond({ error: 'Unable to validate participant eligibility before payment. Please try again.' }, 503);
    }

    const existingRolls = new Map<string, string>();
    const registrationIds = (existingRegistrations || []).map(registration => {
      const id = cleanText(registration.id, 80);
      const roll = normalizeRoll(registration.leader_roll);
      if (roll) existingRolls.set(roll, cleanText(registration.display_id, 80));
      return id;
    }).filter(Boolean);

    if (registrationIds.length > 0) {
      const { data: existingMembers, error: existingMemberError } = await db.from('registration_members')
        .select('registration_id, roll_number')
        .in('registration_id', registrationIds);
      if (existingMemberError) {
        console.error('Razorpay member duplicate preflight failed:', existingMemberError.message);
        return respond({ error: 'Unable to validate participant eligibility before payment. Please try again.' }, 503);
      }
      for (const member of existingMembers || []) {
        const roll = normalizeRoll(member.roll_number);
        if (roll && !existingRolls.has(roll)) existingRolls.set(roll, 'an existing registration');
      }
    }

    for (const roll of requestedRolls) {
      if (existingRolls.has(roll)) {
        const existingPass = existingRolls.get(roll);
        return respond({
          error: `Participant ${roll} is already registered for ${event.title}. Use the existing pass${existingPass && existingPass !== 'an existing registration' ? ` (${existingPass})` : ''} instead of starting another payment.`,
          code: 'DUPLICATE_REGISTRATION',
          rollNumber: roll
        }, 409);
      }
    }

    const amountPaise = fee * 100 * normalizedItems.length;
    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) return respond({ error: 'The payment amount is invalid.' }, 400);

    const internalId = crypto.randomUUID();
    const receipt = `FEST26-${internalId.replaceAll('-', '').slice(0, 30)}`;
    const { data: orderRow, error: insertError } = await db.from('razorpay_orders').insert({
      id: internalId,
      receipt,
      event_id: event.id,
      amount_paise: amountPaise,
      currency: 'INR',
      status: 'creating',
      payload: { eventId: event.id, items: normalizedItems }
    }).select('id').single();
    if (insertError || !orderRow) return respond({ error: `Unable to create the payment order: ${insertError?.message || 'database error'}` }, 500);

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt,
        notes: { fest: 'FESTRONIX 2026', event_id: event.id }
      })
    });

    const razorpayBody = await razorpayResponse.json().catch(() => ({}));
    if (!razorpayResponse.ok || !razorpayBody.id) {
      await db.from('razorpay_orders').update({ status: 'failed', last_error: 'Razorpay order creation failed.', updated_at: new Date().toISOString() }).eq('id', internalId);
      return respond({ error: 'Razorpay could not create the test payment order. Please try again.' }, 502);
    }

    const { error: updateError } = await db.from('razorpay_orders').update({
      razorpay_order_id: razorpayBody.id,
      status: 'created',
      updated_at: new Date().toISOString()
    }).eq('id', internalId);
    if (updateError) return respond({ error: 'The payment order was created but could not be recorded safely.' }, 500);

    return respond({
      success: true,
      keyId,
      orderId: razorpayBody.id,
      amount: amountPaise,
      currency: 'INR',
      eventTitle: event.title,
      receipt
    });
  } catch (error) {
    console.error('Razorpay order creation failed:', error instanceof Error ? error.message : 'unknown error');
    return respond({ error: 'Unable to start the Razorpay checkout.' }, 500);
  }
});
