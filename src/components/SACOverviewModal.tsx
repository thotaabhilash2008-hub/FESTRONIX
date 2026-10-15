import React from 'react';
import { X, Shield, DollarSign, Users, Award, RefreshCw, BarChart3, CheckCircle2, Clock } from 'lucide-react';
import { FestStats, Department, FestEvent, Registration } from '../types/festronix';
import { DEPARTMENTS } from '../data/mockData';
import { StorageService } from '../services/storageService';

interface SACOverviewModalProps {
  stats: FestStats;
  events: FestEvent[];
  registrations: Registration[];
  onClose: () => void;
  onResetData: () => void;
}

export const SACOverviewModal: React.FC<SACOverviewModalProps> = ({
  stats,
  events,
  registrations,
  onClose,
  onResetData
}) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ padding: '32px', maxWidth: '850px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: 'rgba(40, 59, 120, 0.4)', borderRadius: '8px', border: '1px solid rgba(120, 149, 147, 0.45)' }}>
              <Shield size={20} color="#BACEBB" />
            </div>
            <div>
              <h3 className="font-title" style={{ fontSize: '1.4rem', color: '#FFFFFF' }}>
                SAC EXECUTIVE DASHBOARD
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#A8B3C2' }}>
                Vardhaman College of Engineering • Student Affairs Council Central Operations
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(220, 227, 229, 0.08)',
              border: '1px solid rgba(220, 227, 229, 0.15)',
              color: '#A8B3C2',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Top KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
          <div style={{ padding: '16px', background: 'rgba(16, 26, 53, 0.85)', border: '1px solid rgba(120, 149, 147, 0.35)', borderRadius: '12px' }}>
            <div style={{ fontSize: '0.72rem', color: '#A8B3C2', textTransform: 'uppercase' }}>Total Registrations</div>
            <div className="font-title" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#BACEBB', marginTop: '4px' }}>
              {stats.totalRegistrations}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#A8B3C2' }}>
              Online: {stats.onlineCount} | Spot: {stats.spotCount}
            </div>
          </div>

          <div style={{ padding: '16px', background: 'rgba(16, 26, 53, 0.85)', border: '1px solid rgba(120, 149, 147, 0.35)', borderRadius: '12px' }}>
            <div style={{ fontSize: '0.72rem', color: '#A8B3C2', textTransform: 'uppercase' }}>Verified Collections</div>
            <div className="font-title" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#DCE3E5', marginTop: '4px' }}>
              ₹{stats.totalCollected.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#A8B3C2' }}>
              Strictly verified receipts per PRD
            </div>
          </div>

          <div style={{ padding: '16px', background: 'rgba(16, 26, 53, 0.85)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '12px' }}>
            <div style={{ fontSize: '0.72rem', color: '#A8B3C2', textTransform: 'uppercase' }}>Review Queue</div>
            <div className="font-title" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
              {stats.pendingCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#A8B3C2' }}>
              Awaiting verification
            </div>
          </div>

          <div style={{ padding: '16px', background: 'rgba(16, 26, 53, 0.85)', border: '1px solid rgba(220, 227, 229, 0.22)', borderRadius: '12px' }}>
            <div style={{ fontSize: '0.72rem', color: '#A8B3C2', textTransform: 'uppercase' }}>Gate Attendance</div>
            <div className="font-title" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
              {stats.checkedInCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#A8B3C2' }}>
              Checked-in at venue
            </div>
          </div>
        </div>

        {/* Department Breakdown */}
        <div style={{ marginBottom: '28px' }}>
          <h4 className="font-title" style={{ fontSize: '1rem', color: '#DCE3E5', marginBottom: '12px', letterSpacing: '0.05em' }}>
            DEPARTMENT SUMMARY & READINESS
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(120, 149, 147, 0.35)', color: '#BACEBB' }}>
                  <th style={{ padding: '8px' }}>Code</th>
                  <th style={{ padding: '8px' }}>Department</th>
                  <th style={{ padding: '8px' }}>Chief Coordinator</th>
                  <th style={{ padding: '8px' }}>Events</th>
                  <th style={{ padding: '8px' }}>Registrations</th>
                </tr>
              </thead>
              <tbody>
                {DEPARTMENTS.map(dept => {
                  const deptEvents = events.filter(e => e.departmentCode === dept.code);
                  const deptEventIds = deptEvents.map(e => e.id);
                  const deptRegs = registrations.filter(r => deptEventIds.includes(r.eventId));

                  return (
                    <tr key={dept.code} style={{ borderBottom: '1px solid rgba(220, 227, 229, 0.08)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 700, color: '#FFFFFF' }}>{dept.code}</td>
                      <td style={{ padding: '10px 8px', color: '#A8B3C2' }}>{dept.name}</td>
                      <td style={{ padding: '10px 8px', color: '#A8B3C2' }}>{dept.chiefCoordinator}</td>
                      <td style={{ padding: '10px 8px', color: '#DCE3E5', fontWeight: 600 }}>{deptEvents.length}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 700, color: '#BACEBB' }}>{deptRegs.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Administration & Demo Reset */}
        <div
          style={{
            padding: '16px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f87171' }}>
              Database State Controls
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9B8E7B' }}>
              Reset mock state to seed events and registrations for testing.
            </div>
          </div>

          <button
            onClick={() => {
              if (confirm('Reset all registrations and events back to defaults?')) {
                onResetData();
              }
            }}
            className="btn-cyber-danger"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
