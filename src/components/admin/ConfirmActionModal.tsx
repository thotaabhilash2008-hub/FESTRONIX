import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmActionModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * In-app confirmation prompt. Native window.confirm() can be silently
 * blocked by browser settings or embedded previews, so destructive admin
 * actions use this dialog instead.
 */
export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busy = false,
  error,
  onConfirm,
  onCancel,
}) => (
  <div
    role="presentation"
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(8px)',
      zIndex: 300,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}
    onClick={() => { if (!busy) onCancel(); }}
  >
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      style={{
        width: '100%',
        maxWidth: '460px',
        background: '#142042',
        border: '1px solid rgba(248, 113, 113, 0.45)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)'
      }}
      onClick={event => event.stopPropagation()}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <AlertTriangle size={20} color="#F87171" />
        <h3 style={{ color: '#FFFFFF', fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{title}</h3>
      </div>

      <p style={{ color: '#C9D2DA', fontSize: '0.86rem', lineHeight: 1.6, margin: '0 0 10px' }}>
        {message}
      </p>
      <p style={{ color: '#94A3B8', fontSize: '0.78rem', lineHeight: 1.5, margin: '0 0 18px' }}>
        This cannot be undone. Events with unresolved Razorpay payments cannot be deleted until finance reconciles them.
      </p>

      {error && (
        <div
          role="alert"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '8px',
            color: '#FCA5A5',
            fontSize: '0.8rem',
            padding: '10px 12px',
            marginBottom: '16px'
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          style={{
            background: 'none',
            border: '1px solid rgba(220, 227, 229, 0.25)',
            borderRadius: '8px',
            padding: '8px 16px',
            color: '#DCE3E5',
            fontSize: '0.82rem',
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1
          }}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          style={{
            background: 'rgba(239, 68, 68, 0.85)',
            border: '1px solid #EF4444',
            borderRadius: '8px',
            padding: '8px 18px',
            color: '#FFFFFF',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1
          }}
        >
          {busy ? 'Deleting…' : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);
