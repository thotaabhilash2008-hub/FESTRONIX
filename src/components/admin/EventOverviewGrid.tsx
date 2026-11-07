import React from 'react';
import { ArrowRight, Calendar, CheckCircle2, Clock, IndianRupee, Users, XCircle } from 'lucide-react';
import { FestEvent, Registration } from '../../types/festronix';

export interface EventOverviewItem {
  key: string;
  event: FestEvent | null;
  title: string;
  departmentCode: string;
  registrations: Registration[];
}

interface EventOverviewGridProps {
  items: EventOverviewItem[];
  mode: 'registrations' | 'payments';
  onSelect: (eventKey: string) => void;
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

export const EventOverviewGrid: React.FC<EventOverviewGridProps> = ({ items, mode, onSelect }) => {
  if (items.length === 0) {
    return (
      <div style={{ padding: '48px 20px', textAlign: 'center', background: 'rgba(20, 31, 62, 0.6)', border: '1px dashed rgba(220, 227, 229, 0.2)', borderRadius: '16px' }}>
        <Calendar size={38} color="#789593" style={{ margin: '0 auto 12px' }} />
        <h4 style={{ fontSize: '1.05rem', color: '#FFFFFF', margin: '0 0 6px' }}>No events available</h4>
        <p style={{ fontSize: '0.82rem', color: '#A8B3C2', margin: 0 }}>Live event records will appear here when they are published.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '14px' }}>
        <h4 style={{ margin: 0, color: '#FFFFFF', fontSize: '1.05rem', fontWeight: 800 }}>Choose an event</h4>
        <p style={{ margin: '4px 0 0', color: '#A8B3C2', fontSize: '0.8rem' }}>
          Select an event to open its {mode === 'payments' ? 'payment reviews' : 'registered participants'}.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '14px' }}>
        {items.map(item => {
          const records = item.registrations;
          const pending = records.filter(r => r.paymentStatus === 'verification_pending').length;
          const verified = records.filter(r => r.paymentStatus === 'verified' || r.paymentStatus === 'not_applicable').length;
          const rejected = records.filter(r => r.paymentStatus === 'rejected').length;
          const totalCollected = records.filter(r => r.paymentStatus === 'verified').reduce((sum, r) => sum + Number(r.fee || 0), 0);
          const capacity = item.event?.capacity || 0;
          const fill = capacity > 0 ? Math.min(100, Math.round((records.length / capacity) * 100)) : 0;

          return (
            <button
              key={item.key}
              type="button"
              style={panelStyle}
              onClick={() => onSelect(item.key)}
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
                    {item.event?.format ? item.event.format.toUpperCase() : 'EVENT'} • {item.event?.status || 'LIVE'}
                  </div>
                </div>
                <ArrowRight size={18} color="#38BDF8" style={{ flex: '0 0 auto', marginTop: '3px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '18px' }}>
                <div><Users size={14} color="#38BDF8" /><strong style={{ display: 'block', marginTop: '3px', fontSize: '1rem' }}>{records.length}</strong><span style={{ color: '#94A3B8', fontSize: '0.66rem' }}>Registered</span></div>
                <div><Clock size={14} color="#FBBF24" /><strong style={{ display: 'block', marginTop: '3px', fontSize: '1rem', color: pending ? '#FBBF24' : '#DCE3E5' }}>{pending}</strong><span style={{ color: '#94A3B8', fontSize: '0.66rem' }}>Pending</span></div>
                <div><CheckCircle2 size={14} color="#34D399" /><strong style={{ display: 'block', marginTop: '3px', fontSize: '1rem', color: '#34D399' }}>{verified}</strong><span style={{ color: '#94A3B8', fontSize: '0.66rem' }}>Cleared</span></div>
              </div>

              {mode === 'payments' ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(220, 227, 229, 0.1)', fontSize: '0.72rem' }}>
                  <span style={{ color: '#A8B3C2' }}><XCircle size={13} color="#F87171" style={{ verticalAlign: 'middle', marginRight: '4px' }} />{rejected} rejected</span>
                  <span style={{ color: '#34D399' }}><IndianRupee size={12} style={{ verticalAlign: 'middle' }} />{totalCollected.toLocaleString()} verified</span>
                </div>
              ) : (
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(220, 227, 229, 0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#A8B3C2', fontSize: '0.7rem', marginBottom: '6px' }}>
                    <span>Capacity</span><span>{records.length}{capacity ? ` / ${capacity}` : ''} ({fill}%)</span>
                  </div>
                  <div style={{ height: '5px', borderRadius: '4px', background: 'rgba(8, 12, 22, 0.8)', overflow: 'hidden' }}><div style={{ height: '100%', width: `${fill}%`, background: 'linear-gradient(90deg, #38BDF8, #34D399)', borderRadius: '4px' }} /></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
