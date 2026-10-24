import React from 'react';
import { X, Shield, Award, Users, CheckCircle, CreditCard, QrCode, Globe, FileText, ChevronRight } from 'lucide-react';
import { ORGANISATIONAL_STRUCTURE } from '../../data/mockData';

interface OrganisationalStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrganisationalStructureModal: React.FC<OrganisationalStructureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const getRoleIcon = (scope: string) => {
    switch (scope) {
      case 'super_admin':
        return <Award size={18} color="#f59e0b" />;
      case 'dept_chief_coordinator':
        return <Shield size={18} color="#38bdf8" />;
      case 'event_coordinator':
        return <Users size={18} color="#a78bfa" />;
      case 'finance':
        return <CreditCard size={18} color="#34d399" />;
      case 'volunteer':
        return <QrCode size={18} color="#f472b6" />;
      case 'participant':
        return <CheckCircle size={18} color="#60a5fa" />;
      default:
        return <Globe size={18} color="#94a3b8" />;
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal-window admin-scrollbar"
        style={{
          maxWidth: '960px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="admin-card-top-accent" />
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: 'rgba(120, 149, 147, 0.2)',
                  color: '#BACEBB',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(120, 149, 147, 0.3)'
                }}
              >
                OFFICIAL SPECIFICATION • SECTION 3
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}
              >
                👑 3 SUPER ADMINS CONFIGURED
              </span>
            </div>
            <h2 className="font-title" style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 4px', color: '#FFFFFF' }}>
              3. Users and Organisational Structure
            </h2>
            <p style={{ color: '#A8B3C2', fontSize: '0.84rem', margin: 0 }}>
              Official administrative roles, operational responsibilities, and access boundaries for FESTRONIX 2026.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(220, 227, 229, 0.2)',
              borderRadius: '10px',
              color: '#DCE3E5',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Roles Table */}
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(220, 227, 229, 0.15)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'rgba(40, 59, 120, 0.55)', borderBottom: '1px solid rgba(120, 149, 147, 0.35)', color: '#DCE3E5' }}>
                <th style={{ padding: '12px 14px', fontWeight: 700, width: '22%' }}>Role</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, width: '42%' }}>Responsibilities</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, width: '36%' }}>Access boundary</th>
              </tr>
            </thead>
            <tbody>
              {ORGANISATIONAL_STRUCTURE.map((item, index) => {
                const isSuper = item.scopeTag === 'super_admin';
                return (
                  <tr
                    key={index}
                    style={{
                      borderBottom: '1px solid rgba(220, 227, 229, 0.08)',
                      background: isSuper ? 'rgba(245, 158, 11, 0.08)' : index % 2 === 0 ? 'rgba(16, 26, 53, 0.5)' : 'rgba(20, 31, 62, 0.5)'
                    }}
                  >
                    <td style={{ padding: '14px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#FFFFFF', fontSize: '0.86rem' }}>
                        {getRoleIcon(item.scopeTag)}
                        <span>{item.role}</span>
                      </div>
                      {isSuper && (
                        <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#fbbf24', fontWeight: 600 }}>
                          (3 Super Admins: SAC DEAN, CONNECT CLUB, VENCORPIA)
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px', color: '#DCE3E5', lineHeight: 1.5, verticalAlign: 'top' }}>
                      {item.responsibilities}
                      {item.accounts && (
                        <div style={{ marginTop: '8px', fontSize: '0.74rem', color: '#A8B3C2' }}>
                          <span style={{ color: '#789593', fontWeight: 600 }}>Configured Portals: </span>
                          {item.accounts.join(' • ')}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px', verticalAlign: 'top' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          background: isSuper ? 'rgba(245, 158, 11, 0.2)' : 'rgba(40, 59, 120, 0.4)',
                          color: isSuper ? '#fbbf24' : '#BACEBB',
                          border: isSuper ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(120, 149, 147, 0.3)'
                        }}
                      >
                        {item.accessBoundary}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            className="btn-cyber-primary"
            style={{ padding: '10px 24px', fontSize: '0.84rem' }}
          >
            Close Structure Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
