import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { resolveRazorpayMode } from '../_shared/razorpay.ts';

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

function normalizeTeamCode(value: unknown): string {
  return cleanText(value, 40).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function isValidEmail(value: unknown): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanText(value, 180));
}

function cleanItem(
  item: Record<string, unknown>,
  event: Record<string, any>,
  team: Record<string, any> | null = null,
  roster: Record<string, unknown>[] = []
) {
  const teammates = roster.slice(0, 10).map(member => {
    const value = (member && typeof member === 'object') ? member as Record<string, unknown> : {};
    return {
      name: cleanText(value.name, 120),
      email: cleanText(value.email, 180).toLowerCase(),
      phone: cleanText(value.phone, 40),
      college: cleanText(value.college, 180),
      rollNumber: cleanText(value.rollNumber ?? value.roll_number, 50).toUpperCase(),
      deptSection: cleanText(value.deptSection ?? value.dept_section, 80).toUpperCase()
    };
  });

  return {
    eventId: event.id,
    buyerRoll: normalizeRoll(team?.leader_roll ?? item.buyerRoll ?? item.buyer_roll),
    leaderName: cleanText(team?.leader_name ?? item.leaderName ?? item.leader_name, 120),
    leaderEmail: cleanText(team?.leader_email ?? item.leaderEmail ?? item.leader_email, 180).toLowerCase(),
    leaderPhone: cleanText(team?.leader_phone ?? item.leaderPhone ?? item.leader_phone, 40),
    leaderCollege: cleanText(team?.leader_college ?? item.leaderCollege ?? item.leader_college, 180),
    leaderRoll: normalizeRoll(team?.leader_roll ?? item.leaderRoll ?? item.leader_roll),
    format: event.format,
    fee: Number(event.fee) || 0,
    teammates,
    teamName: team ? cleanText(team.team_name, 120) : '',
    teamCode: team ? cleanText(team.team_code, 40).toUpperCase() : ''
  };
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405);

  const keyId = cleanText(Deno.env.get('RAZORPAY_KEY_ID'), 120);
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
  if (!keyId || !keySecret) {
    return respond({ error: 'Razorpay credentials are not configured on the backend.' }, 503);
  }
  const mode = resolveRazorpayMode(keyId, Deno.env.get('RAZORPAY_MODE'));
  if (!mode) return respond({ error: 'Razorpay credentials are invalid or do not match the configured payment mode.' }, 503);

  try {
    const body = await request.json().catch(() => ({}));
    const requestedEvent = cleanText(body.eventId, 160);
    const items: unknown[] = Array.isArray(body.items) ? body.items : [];
    if (!requestedEvent || items.length < 1 || items.length > 10) {
      return respond({ error: 'A valid event and between 1 and 10 registration items are required.' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || serviceRoleKey;
    const db = createClient(supabaseUrl, serviceRoleKey);

    // The endpoint supports guest checkout, so gateway JWT verification is
    // disabled. If a real user access token is present, validate it ourselves
    // and use only the verified identity when linking registrations.
    const authorization = request.headers.get('authorization') || '';
    const bearerToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || '';
    const requestApiKey = request.headers.get('apikey')?.trim() || '';
    let buyerUserId: string | null = null;
    if (bearerToken && bearerToken !== anonKey && bearerToken !== requestApiKey && bearerToken !== serviceRoleKey) {
      const authClient = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });
      const { data: authData, error: authError } = await authClient.auth.getUser(bearerToken);
      if (authError || !authData.user) return respond({ error: 'Your sign-in session is invalid or expired. Sign in again and retry checkout.' }, 401);
      buyerUserId = authData.user.id;
    }

    // Each cart item carries its event ID. The first event remains the order's
    // index/anchor for compatibility with existing razorpay_orders rows.
    const requestedEventIds = Array.from(new Set(items.map(item => {
      const value = item && typeof item === 'object' ? item as Record<string, unknown> : {};
      return cleanText(value.eventId ?? value.event_id ?? requestedEvent, 160);
    })));
    if (!requestedEventIds.includes(requestedEvent)) requestedEventIds.unshift(requestedEvent);

    const eventsById = new Map<string, any>();
    const eventTitles = new Map<string, string>();
    for (const eventRef of requestedEventIds) {
      let event: any = null;
      let eventError: any = null;
      if (isUuid(eventRef)) {
        const result = await db.from('events')
          .select('id, slug, title, fee, format, capacity, registered_count, min_team_size, max_team_size, status, deadline, approval_status, is_deleted')
          .eq('id', eventRef)
          .maybeSingle();
        event = result.data;
        eventError = result.error;
      } else {
        const result = await db.from('events')
          .select('id, slug, title, fee, format, capacity, registered_count, min_team_size, max_team_size, status, deadline, approval_status, is_deleted')
          .eq('slug', eventRef)
          .maybeSingle();
        event = result.data;
        eventError = result.error;
      }
      if (eventError) return respond({ error: `Unable to validate the event: ${eventError.message}` }, 400);
      if (!event || event.is_deleted) return respond({ error: 'One of the selected events could not be found.' }, 404);
      if (event.status !== 'open' && event.status !== 'upcoming') return respond({ error: `${event.title} is not accepting registrations.` }, 400);
      if (event.approval_status !== 'approved') return respond({ error: `${event.title} is not approved for registration.` }, 400);
      if (event.deadline && new Date(event.deadline).getTime() < Date.now()) return respond({ error: `The registration deadline for ${event.title} has passed.` }, 400);
      if (!['individual', 'duo', 'team'].includes(event.format)) return respond({ error: `${event.title} has an unsupported registration format.` }, 400);
      if (!Number.isFinite(Number(event.fee)) || Number(event.fee) < 0) return respond({ error: `${event.title} has an invalid registration fee.` }, 400);
      eventsById.set(event.id, event);
      eventTitles.set(event.id, event.title);
    }

    const teamsByEventId = new Map<string, any[]>();
    const normalizedItems = [];
    for (const item of items) {
      const value = item && typeof item === 'object' ? item as Record<string, unknown> : {};
      const ref = cleanText(value.eventId ?? value.event_id ?? requestedEvent, 160);
      const event = eventsById.get(ref) || Array.from(eventsById.values()).find(candidate => candidate.slug === ref);
      if (!event) throw new Error('One of the selected events could not be validated.');
      let team: Record<string, any> | null = null;

      if (event.format !== 'individual') {
        if (!buyerUserId) return respond({ error: 'Sign in with the team leader account before paying for a team event.' }, 401);
        const requestedTeamCode = normalizeTeamCode(value.teamCode ?? value.team_code);
        if (!requestedTeamCode) return respond({ error: 'Create or verify the team reservation before starting payment.' }, 400);

        let eventTeams = teamsByEventId.get(event.id);
        if (!eventTeams) {
          const { data, error } = await db.from('teams')
            .select('team_code, team_name, event_id, leader_id, leader_name, leader_roll, leader_email, leader_phone, leader_college, members, min_team_size, max_team_size')
            .eq('event_id', event.id);
          if (error) {
            console.error('Razorpay team reservation lookup failed:', error.message);
            return respond({ error: 'Unable to validate the team reservation before payment. Please try again.' }, 503);
          }
          eventTeams = data || [];
          teamsByEventId.set(event.id, eventTeams);
        }

        team = eventTeams.find(candidate => normalizeTeamCode(candidate.team_code) === requestedTeamCode) || null;
        if (!team || String(team.event_id) !== String(event.id)) {
          return respond({ error: 'The team reservation could not be found for this event. Reopen the event and verify its team code.' }, 409);
        }
        if (String(team.leader_id || '') !== buyerUserId) {
          return respond({ error: 'Only the account that created this team can pay for its registration.' }, 403);
        }
        if (normalizeRoll(value.leaderRoll ?? value.leader_roll) !== normalizeRoll(team.leader_roll) ||
            cleanText(value.leaderEmail ?? value.leader_email, 180).toLowerCase() !== cleanText(team.leader_email, 180).toLowerCase()) {
          return respond({ error: 'The checkout leader details do not match the team reservation. Refresh your details and try again.' }, 400);
        }
        if (Number(team.min_team_size) !== Number(event.min_team_size) ||
            Number(team.max_team_size) !== Number(event.max_team_size)) {
          return respond({ error: 'The team reservation no longer matches this event’s team-size rules. Recreate the team before paying.' }, 409);
        }
      }

      let roster: Record<string, unknown>[] = [];
      if (event.format !== 'individual' && team) {
        const savedMembers = Array.isArray(team.members) ? team.members : [];
        const rosterByRoll = new Map<string, Record<string, unknown>>();
        for (const rawMember of savedMembers) {
          const member = rawMember && typeof rawMember === 'object' ? rawMember as Record<string, unknown> : {};
          const roll = normalizeRoll(member.rollNumber ?? member.roll_number);
          if (!roll || rosterByRoll.has(roll)) {
            return respond({ error: 'The saved team roster contains a missing or duplicate roll number. Update the roster before paying.' }, 409);
          }
          rosterByRoll.set(roll, member);
        }

        const submittedMembers = Array.isArray(value.teammates) ? value.teammates : [];
        const submittedRolls = new Set<string>();
        for (const rawMember of submittedMembers) {
          const member = rawMember && typeof rawMember === 'object' ? rawMember as Record<string, unknown> : {};
          const roll = normalizeRoll(member.rollNumber ?? member.roll_number);
          if (!roll) return respond({ error: 'Each teammate needs a roll number before payment.' }, 400);
          if (submittedRolls.has(roll)) return respond({ error: `Teammate roll number ${roll} appears more than once.` }, 400);
          submittedRolls.add(roll);
          // A joined member's server-saved profile wins over a copy sent by the browser.
          if (!rosterByRoll.has(roll)) rosterByRoll.set(roll, member);
        }
        roster = Array.from(rosterByRoll.values());

        const teamSize = 1 + roster.length;
        const minTeamSize = Math.max(1, Number(event.min_team_size) || 1);
        const maxTeamSize = Number(event.max_team_size);
        if (teamSize < minTeamSize) {
          return respond({ error: `This event requires at least ${minTeamSize} team members. Add or invite the remaining teammate(s) before paying.` }, 400);
        }
        if (!Number.isFinite(maxTeamSize) || teamSize > maxTeamSize) {
          return respond({ error: `This event permits a maximum of ${event.max_team_size} team members.` }, 409);
        }
      }

      const normalizedItem = cleanItem(value, event, team, roster);
      if (!normalizedItem.leaderName || !isValidEmail(normalizedItem.leaderEmail) ||
          !normalizedItem.leaderPhone || !normalizedItem.leaderRoll) {
        return respond({ error: `Complete the participant name, valid email, phone number, and roll number for ${event.title} before payment.` }, 400);
      }
      for (const member of normalizedItem.teammates) {
        if (!member.name || !member.rollNumber || !member.phone || (member.email && !isValidEmail(member.email))) {
          return respond({ error: `The saved team roster for ${event.title} contains incomplete participant details. Update the roster before payment.` }, 409);
        }
      }
      normalizedItems.push(normalizedItem);
    }

    if (normalizedItems.some(item => item.format !== 'individual') && normalizedItems.length > 1) {
      return respond({ error: 'Team event checkout must be completed separately from individual passes.' }, 400);
    }

    const participantCountsByEvent = new Map<string, number>();
    for (const item of normalizedItems) {
      // Capacity is measured in participants. The event-locked finalizer checks
      // the same full roster again after Razorpay captures the payment.
      const participantCount = item.format === 'individual' ? 1 : 1 + item.teammates.length;
      participantCountsByEvent.set(item.eventId, (participantCountsByEvent.get(item.eventId) || 0) + participantCount);
    }
    for (const [eventId, count] of participantCountsByEvent) {
      const event = eventsById.get(eventId)!;
      if (Number(event.registered_count || 0) + count > Number(event.capacity || 0)) {
        return respond({ error: `${event.title} does not have enough remaining seats for this order.` }, 409);
      }
    }

    // Fail before creating an order when any participant already has an active
    // registration. Rolls are scoped to an event so one person can buy passes
    // for two different events in the same cart.
    const requestedRolls = new Map<string, string>();
    const requestedTeamMemberCodes = new Map<string, string>();
    const duplicateRolls = new Set<string>();
    for (const item of normalizedItems) {
      const rolls = [item.leaderRoll, ...item.teammates.map(member => member.rollNumber)];
      for (let index = 0; index < rolls.length; index += 1) {
        const roll = rolls[index];
        const normalizedRoll = normalizeRoll(roll);
        if (!normalizedRoll) continue;
        const key = `${item.eventId}:${normalizedRoll}`;
        if (requestedRolls.has(key)) duplicateRolls.add(`${normalizedRoll} (${eventTitles.get(item.eventId) || 'event'})`);
        requestedRolls.set(key, normalizedRoll);
        if (index > 0 && item.teamCode) requestedTeamMemberCodes.set(key, normalizeTeamCode(item.teamCode));
      }
    }
    if (duplicateRolls.size > 0) {
      return respond({
        error: `The order contains duplicate participant roll number(s): ${Array.from(duplicateRolls).join(', ')}.`,
        code: 'DUPLICATE_ORDER_PARTICIPANT'
      }, 400);
    }

    const eventIds = Array.from(participantCountsByEvent.keys());
    const { data: existingRegistrations, error: existingRegistrationError } = await db.from('registrations')
      .select('id, display_id, event_id, leader_roll, team_code')
      .in('event_id', eventIds)
      .neq('payment_status', 'rejected');
    if (existingRegistrationError) {
      console.error('Razorpay duplicate preflight failed:', existingRegistrationError.message);
      return respond({ error: 'Unable to validate participant eligibility before payment. Please try again.' }, 503);
    }

    const existingRolls = new Map<string, string>();
    const existingTeamCodes = new Map<string, Set<string>>();
    const registrationEventById = new Map<string, string>();
    const registrationIds = (existingRegistrations || []).map(registration => {
      const id = cleanText(registration.id, 80);
      const roll = normalizeRoll(registration.leader_roll);
      const eventId = cleanText(registration.event_id, 80);
      if (id) registrationEventById.set(id, eventId);
      if (roll) {
        const key = `${eventId}:${roll}`;
        existingRolls.set(key, cleanText(registration.display_id, 80));
        const teamCodes = existingTeamCodes.get(key) || new Set<string>();
        teamCodes.add(normalizeTeamCode(registration.team_code));
        existingTeamCodes.set(key, teamCodes);
      }
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
        const eventId = registrationEventById.get(cleanText(member.registration_id, 80));
        if (roll && eventId && !existingRolls.has(`${eventId}:${roll}`)) existingRolls.set(`${eventId}:${roll}`, 'an existing registration');
      }
    }

    for (const [key, roll] of requestedRolls) {
      if (existingRolls.has(key)) {
        const requestedTeamCode = requestedTeamMemberCodes.get(key);
        const existingCodes = existingTeamCodes.get(key);
        if (requestedTeamCode && existingCodes?.size === 1 && existingCodes.has(requestedTeamCode)) continue;
        const eventId = key.split(':')[0];
        const eventTitle = eventTitles.get(eventId) || 'this event';
        const existingPass = existingRolls.get(key);
        return respond({
          error: `Participant ${roll} is already registered for ${eventTitle}. Use the existing pass${existingPass && existingPass !== 'an existing registration' ? ` (${existingPass})` : ''} instead of starting another payment.`,
          code: 'DUPLICATE_REGISTRATION',
          rollNumber: roll,
          eventId
        }, 409);
      }
    }

    const amountPaise = normalizedItems.reduce((sum, item) => sum + (Number(item.fee) || 0) * 100, 0);
    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) return respond({ error: 'The payment amount is invalid.' }, 400);

    // Persist the final, validated roster before creating a gateway order. The
    // database finalizer uses this trusted roster to issue a ticket per member
    // in the same transaction as the paid leader registration.
    for (const item of normalizedItems) {
      if (item.format === 'individual') continue;
      const { error } = await db.rpc('sync_razorpay_team_roster', {
        p_event_id: item.eventId,
        p_team_code: item.teamCode,
        p_leader_user_id: buyerUserId,
        p_leader_roll: item.leaderRoll,
        p_leader_email: item.leaderEmail,
        p_members: item.teammates
      });
      if (error) {
        console.error('Razorpay team roster sync failed:', error.message);
        return respond({ error: 'The team roster could not be safely saved before payment. Please refresh the team and try again.' }, 409);
      }
    }

    const internalId = crypto.randomUUID();
    const receipt = `FEST26-${internalId.replaceAll('-', '').slice(0, 30)}`;
    const primaryEventId = normalizedItems[0].eventId;
    const { data: orderRow, error: insertError } = await db.from('razorpay_orders').insert({
      id: internalId,
      receipt,
      event_id: primaryEventId,
      buyer_user_id: buyerUserId,
      amount_paise: amountPaise,
      currency: 'INR',
      status: 'creating',
      payload: { eventId: primaryEventId, eventIds, items: normalizedItems }
    }).select('id').single();
    if (insertError || !orderRow) return respond({ error: `Unable to create the payment order: ${insertError?.message || 'database error'}` }, 500);

    let razorpayResponse: Response;
    try {
      razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: 'INR',
          receipt,
          notes: { fest: 'FESTRONIX 2026', event_id: primaryEventId, event_count: String(eventIds.length) }
        })
      });
    } catch {
      await db.from('razorpay_orders').update({
        status: 'failed',
        last_error: 'Razorpay order creation could not reach the payment gateway.',
        updated_at: new Date().toISOString()
      }).eq('id', internalId);
      return respond({ error: 'Razorpay could not start checkout. Please try again.' }, 502);
    }

    const razorpayBody = await razorpayResponse.json().catch(() => ({}));
    if (!razorpayResponse.ok || !razorpayBody.id) {
      await db.from('razorpay_orders').update({ status: 'failed', last_error: 'Razorpay order creation failed.', updated_at: new Date().toISOString() }).eq('id', internalId);
      return respond({ error: 'Razorpay could not create the payment order. Please try again.' }, 502);
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
      mode,
      eventTitle: eventIds.length === 1 ? eventTitles.get(primaryEventId) : `${normalizedItems.length} FESTRONIX passes`,
      receipt
    });
  } catch (error) {
    console.error('Razorpay order creation failed:', error instanceof Error ? error.message : 'unknown error');
    return respond({ error: error instanceof Error ? error.message : 'Unable to start the Razorpay checkout.' }, 500);
  }
});
