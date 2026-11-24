import React, { useState, useMemo } from 'react';
import { ArrowRight, Calendar, CheckCircle2, Clock, IndianRupee, Users, XCircle, Search, Building2, ArrowUpDown } from 'lucide-react';
import { FestEvent, Registration } from '../../types/festronix';
import { StorageService } from '../../services/storageService';

export interface EventOverviewItem {
  key: string;
  event: FestEvent | null;
  title: string;
  departmentCode: string;
  registrations: Registration[];
}

export const isTeamEventItem = (item: EventOverviewItem): boolean => {
  const fmt = item.event?.format;
  if (fmt === 'team' || fmt === 'duo') return true;
  if (fmt === 'individual') return false;

  // Check team size if configured on event
  if (item.event?.minTeamSize && item.event.minTeamSize > 1) return true;
  if (item.event?.maxTeamSize && item.event.maxTeamSize > 1) return true;

  // If format is not explicitly defined on event, inspect registration metadata
  return item.registrations.some(r =>
    Boolean(
      r.teamCode ||
      r.teamName ||
      (Array.isArray(r.teammates) && r.teammates.length > 0) ||
      r.format === 'team' ||
      r.format === 'duo'
    )
  );
};

interface EventOverviewGridProps {
  items: EventOverviewItem[];
  mode: 'registrations' | 'payments';
  onSelect: (eventKey: string) => void;
  isSuperAdmin?: boolean;
  userDepartment?: string;
}

const panelStyle: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(20, 31, 62, 0.96), rgba(13, 22, 45, 0.96))',
  border: '1px solid rgba(120, 149, 147, 0.24)',
  borderRadius: '14px',
  padding: '18px',
  textAlign: 'left',
  color: '#FFFFFF',
  cursor: 'pointer',
  minHeight: '190px',
  transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease'
};

export const EventOverviewGrid: React.FC<EventOverviewGridProps> = ({
  items,
  mode,
  onSelect,
  isSuperAdmin = true,
  userDepartment
}) => {
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dept' | 'name' | 'registrations' | 'revenue' | 'pending'>('dept');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // When a department coordinator logs in, strictly scope to their respective department
  const isCoord = !isSuperAdmin && Boolean(userDepartment);
  const effectiveDept = isCoord ? userDepartment!.toUpperCase() : deptFilter;

  // Extract all distinct departments present in the event dataset
  const availableDepts = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.departmentCode) set.add(i.departmentCode.trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [items]);

  // Enrich items with team vs solo registration consolidation
  const enrichedItems = useMemo(() => {
    return items.map(item => {
      const isTeam = isTeamEventItem(item);
      // For team events, consolidate companion passes so each team counts as 1 registration.
      // For solo events, keep all individual registrations.
      const displayRecords = isTeam
        ? StorageService.consolidateTeamRegistrations(item.registrations)
        : item.registrations;

      const pending = displayRecords.filter(r => r.paymentStatus === 'verification_pending').length;
      const verified = displayRecords.filter(r => r.paymentStatus === 'verified' || r.paymentStatus === 'not_applicable').length;
      const rejected = displayRecords.filter(r => r.paymentStatus === 'rejected').length;
      const totalCollected = item.registrations.filter(r => r.paymentStatus === 'verified').reduce((sum, r) => sum + Number(r.fee || 0), 0);
      const capacity = item.event?.capacity || 0;
      const fill = capacity > 0 ? Math.min(100, Math.round((displayRecords.length / capacity) * 100)) : 0;

      return {
        item,
        isTeam,
        displayRecords,
        pending,
        verified,
        rejected,
        totalCollected,
        capacity,
        fill
      };
    });
  }, [items]);

  // Filter and sort the events list
  const filteredItems = useMemo(() => {
    let result = enrichedItems;

    // 1. Department Scope / Filter
    if (isCoord) {
      result = result.filter(data => (data.item.departmentCode || '').toUpperCase() === effectiveDept);
    } else if (deptFilter !== 'all') {
      result = result.filter(data => (data.item.departmentCode || '').toUpperCase() === deptFilter.toUpperCase());
    }

    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(data =>
        data.item.title.toLowerCase().includes(q) ||
        (data.item.departmentCode && data.item.departmentCode.toLowerCase().includes(q))
      );
    }

    // 3. Sorting (Default: Department-wise)
    return [...result].sort((a, b) => {
      if (sortBy === 'dept') {
        const deptComp = (a.item.departmentCode || 'ZZZ').localeCompare(b.item.departmentCode || 'ZZZ');
        if (deptComp !== 0) return deptComp;
        return a.item.title.localeCompare(b.item.title);
      }
      if (sortBy === 'name') {
        return a.item.title.localeCompare(b.item.title);
      }
      if (sortBy === 'registrations') {
        return b.displayRecords.length - a.displayRecords.length;
      }
      if (sortBy === 'revenue') {
        return b.totalCollected - a.totalCollected;
      }
      if (sortBy === 'pending') {
        return b.pending - a.pending;
      }
      return 0;
    });
  }, [enrichedItems, isCoord, effectiveDept, deptFilter, searchQuery, sortBy]);

  return (
    <div>
      {/* Header Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h4 style={{ margin: 0, color: '#FFFFFF', fontSize: '1.15rem', fontWeight: 800 }}>
            {mode === 'payments' ? 'Event Wise Analysis' : 'Choose an Event'}
          </h4>
          <p style={{ margin: '4px 0 0', color: '#A8B3C2', fontSize: '0.8rem' }}>
            {mode === 'payments'
              ? 'Select an event to view detailed registration metrics, revenue, and pending payment approvals.'
              : 'Select an event to open its registered participants and check-in roster.'}
          </p>
        </div>

        {isCoord && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '8px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#38BDF8',
            fontSize: '0.78rem',
            fontWeight: 700
          }}>
            <Building2 size={14} />
            <span>{userDepartment} Department Events ({filteredItems.length})</span>
          </div>
        )}
      </div>

      {/* Control Bar: Search, Department Filter (Super Admin), Sort Options */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '18px',
        flexWrap: 'wrap',
        background: 'rgba(20, 31, 62, 0.7)',
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid rgba(220, 227, 229, 0.15)',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={14} color="#789593" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search events by title or department..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '8px',
              background: 'rgba(16, 26, 53, 0.9)',
              border: '1px solid rgba(220, 227, 229, 0.2)',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Super Admin: Department Filter */}
        {isSuperAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={15} color="#38BDF8" />
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(16, 26, 53, 0.9)',
                border: '1.5px solid rgba(56, 189, 248, 0.35)',
                color: '#38BDF8',
                fontSize: '0.82rem',
                fontWeight: 700
              }}
            >
              <option value="all" style={{ background: '#101B35', color: '#FFFFFF' }}>All Departments ({availableDepts.length})</option>
              {availableDepts.map(dept => {
                const count = items.filter(i => (i.departmentCode || '').toUpperCase() === dept).length;
                return (
                  <option key={dept} value={dept} style={{ background: '#101B35', color: '#FFFFFF' }}>
                    {dept} ({count} events)
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Sort Options: Department-wise, Event Name, Registrations, Revenue, Pending */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowUpDown size={15} color="#34D399" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(16, 26, 53, 0.9)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              color: '#34D399',
              fontSize: '0.82rem',
              fontWeight: 700
            }}
          >
            <option value="dept" style={{ background: '#101B35', color: '#FFFFFF' }}>Sort: Department-wise</option>
            <option value="name" style={{ background: '#101B35', color: '#FFFFFF' }}>Sort: Event Name (A-Z)</option>
            <option value="registrations" style={{ background: '#101B35', color: '#FFFFFF' }}>Sort: Most Registered</option>
            <option value="revenue" style={{ background: '#101B35', color: '#FFFFFF' }}>Sort: Highest Revenue</option>
            <option value="pending" style={{ background: '#101B35', color: '#FFFFFF' }}>Sort: Most Pending Approvals</option>
          </select>
        </div>

        {(searchQuery || (isSuperAdmin && deptFilter !== 'all')) && (
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setDeptFilter('all'); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#38BDF8',
              fontSize: '0.78rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Reset
          </button>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <div style={{ padding: '48px 20px', textAlign: 'center', background: 'rgba(20, 31, 62, 0.6)', border: '1px dashed rgba(220, 227, 229, 0.2)', borderRadius: '16px' }}>
          <Calendar size={38} color="#789593" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '1.05rem', color: '#FFFFFF', margin: '0 0 6px' }}>No events found</h4>
          <p style={{ fontSize: '0.82rem', color: '#A8B3C2', margin: 0 }}>
            {isCoord
              ? `No events found for ${userDepartment} department.`
              : 'No events match the selected department or search criteria.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '14px' }}>
          {filteredItems.map(({ item, isTeam, displayRecords, pending, verified, rejected, totalCollected, capacity, fill }) => {
            const records = item.registrations;

            return (
              <button
                key={item.key}
                type="button"
                style={panelStyle}
                onClick={() => onSelect(item.key)}
                title={
                  isTeam
                    ? `${displayRecords.length} teams registered (${records.length} total participants) · Click to view`
                    : `${records.length} participants registered · Click to view`
                }
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.7)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.22)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(120, 149, 147, 0.24)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: '5px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38BDF8', fontSize: '0.68rem', fontWeight: 800 }}>
                      {item.departmentCode || 'GENERAL'}
                    </span>
                    <h5 style={{ margin: '10px 0 4px', fontSize: '1rem', lineHeight: 1.25, color: '#FFFFFF' }}>{item.title}</h5>
                    <div style={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                      {item.event?.format ? item.event.format.toUpperCase() : isTeam ? 'TEAM' : 'INDIVIDUAL'} • {item.event?.status || 'LIVE'}
                    </div>
                  </div>
                  <ArrowRight size={18} color="#38BDF8" style={{ flex: '0 0 auto', marginTop: '3px' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '18px' }}>
                  <div>
                    <Users size={14} color="#38BDF8" />
                    <strong style={{ display: 'block', marginTop: '3px', fontSize: '1rem' }}>
                      {displayRecords.length}
                    </strong>
                    <span style={{ color: '#94A3B8', fontSize: '0.66rem' }}>
                      {isTeam ? 'Teams' : 'Registered'}
                    </span>
                  </div>
                  <div>
                    <Clock size={14} color="#FBBF24" />
                    <strong style={{ display: 'block', marginTop: '3px', fontSize: '1rem', color: pending ? '#FBBF24' : '#DCE3E5' }}>
                      {pending}
                    </strong>
                    <span style={{ color: '#94A3B8', fontSize: '0.66rem' }}>
                      Pending
                    </span>
                  </div>
                  <div>
                    <CheckCircle2 size={14} color="#34D399" />
                    <strong style={{ display: 'block', marginTop: '3px', fontSize: '1rem', color: '#34D399' }}>
                      {verified}
                    </strong>
                    <span style={{ color: '#94A3B8', fontSize: '0.66rem' }}>
                      Cleared
                    </span>
                  </div>
                </div>

                {mode === 'payments' ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(220, 227, 229, 0.1)', fontSize: '0.72rem' }}>
                    <span style={{ color: '#A8B3C2' }}>
                      <XCircle size={13} color="#F87171" style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                      {rejected} rejected
                    </span>
                    <span style={{ color: '#34D399' }}>
                      <IndianRupee size={12} style={{ verticalAlign: 'middle' }} />
                      {totalCollected.toLocaleString()} verified
                    </span>
                  </div>
                ) : (
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(220, 227, 229, 0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#A8B3C2', fontSize: '0.7rem', marginBottom: '6px' }}>
                      <span>Capacity</span>
                      <span>{displayRecords.length}{capacity ? ` / ${capacity}` : ''} {isTeam ? 'teams' : ''} ({fill}%)</span>
                    </div>
                    <div style={{ height: '5px', borderRadius: '4px', background: 'rgba(8, 12, 22, 0.8)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${fill}%`, background: 'linear-gradient(90deg, #38BDF8, #34D399)', borderRadius: '4px' }} />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
