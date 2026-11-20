import React, { lazy, Suspense, useEffect, useState } from 'react';
import { AdminAuthService, AdminUser, isCheckinAdminRole, isDepartmentAdminRole, isFinanceAdminRole, isSuperAdminRole } from '../../services/adminAuthService';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { firebaseAuth, isFirebaseConfigured } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { AdminLoginView } from './AdminLoginView';
const DeanDashboard = lazy(() => import('./DeanDashboard').then(module => ({ default: module.DeanDashboard })));
const DeptCoordinatorDashboard = lazy(() => import('./DeptCoordinatorDashboard').then(module => ({ default: module.DeptCoordinatorDashboard })));
const FinanceReviewerDashboard = lazy(() => import('./FinanceReviewerDashboard').then(module => ({ default: module.FinanceReviewerDashboard })));
const VolunteerCheckinDashboard = lazy(() => import('./VolunteerCheckinDashboard').then(module => ({ default: module.VolunteerCheckinDashboard })));
import { GlitterBackground } from '../GlitterBackground';
import './admin.css';

interface AdminPortalProps {
  onBackToFest: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBackToFest }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  // Most portal actions are async database writes. Keep rejected actions visible
  // instead of allowing the browser to swallow the error and make the button
  // appear dead to the operator.
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      const reason = event.reason;
      // Raw RLS/PostgREST messages can expose schema details. Keep them in the
      // console for diagnosis and show operators a safe, actionable message.
      console.error('Unhandled admin portal action:', reason);
      setActionError('An action could not be completed. Check the details in your browser console or refresh and try again.');
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  useEffect(() => {
    let active = true;
    AdminAuthService.restoreCurrentAdmin()
      .then(user => {
        if (active) {
          setAdminUser(user);
          if (user) AdminAuthService.initRealtime();
        }
      })
      .catch(error => {
        console.error('Unable to restore admin session:', error);
        if (active) setAdminUser(null);
      })
      .finally(() => { if (active) setIsRestoring(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (adminUser) AdminAuthService.initRealtime();
  }, [adminUser]);

  // Roles and event assignments can change while the portal is open. Re-resolve
  // the signed-in identity on those events so the UI never keeps a stale scope
  // that the backend has already revoked.
  useEffect(() => {
    AdminAuthService.setIdentityChangeHandler(() => {
      void AdminAuthService.restoreCurrentAdmin()
        .then(fresh => {
          setAdminUser(previous => {
            if (JSON.stringify(previous) !== JSON.stringify(fresh)) {
              window.setTimeout(() => setActionError('Your role or assignments changed. The portal was refreshed with your current access.'), 0);
            }
            return fresh;
          });
        })
        .catch(error => console.warn('Admin identity refresh failed:', error));
    });
    return () => AdminAuthService.setIdentityChangeHandler(null);
  }, []);

  // Never keep rendering a cached portal identity after Supabase has signed
  // the browser out or failed to refresh its token. RLS-protected operations
  // would otherwise fail while the dashboard still looks authenticated.
  useEffect(() => {
    if (isFirebaseConfigured && firebaseAuth) {
      return onAuthStateChanged(firebaseAuth, user => {
        if (!user) {
          setAdminUser(null);
          localStorage.removeItem('festronix_admin_session_v1');
        }
      });
    }
    if (!isSupabaseConfigured()) return;
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAdminUser(null);
        localStorage.removeItem('festronix_admin_session_v1');
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await AdminAuthService.logout();
      setAdminUser(null);
    } catch (error) {
      window.alert((error as Error).message || 'Unable to end the admin session.');
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', overflowX: 'hidden', background: '#080C16' }}>
      {/* Background Glitter Starfield & Cyber Grid for Admin Console */}
      <GlitterBackground />
      <div className="glitter-stardust-layer" />
      <div className="admin-cyber-grid" />

      {/* Dynamic Ambient Glowing Orbs */}
      <div className="admin-ambient-canvas">
        <div className="admin-ambient-orb-1" />
        <div className="admin-ambient-orb-2" />
        <div className="admin-ambient-orb-3" />
      </div>

      <div style={{ position: 'relative', zIndex: 10 }}>
        {actionError && (
          <div
            role="alert"
            style={{
              position: 'fixed',
              top: '18px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2000,
              width: 'min(680px, calc(100vw - 32px))',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '14px 16px',
              border: '1px solid rgba(248,113,113,0.55)',
              borderRadius: '10px',
              background: 'rgba(55, 18, 28, 0.97)',
              color: '#FECACA',
              boxShadow: '0 16px 40px rgba(0,0,0,0.35)'
            }}
          >
            <span>{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError(null)}
              aria-label="Dismiss error"
              style={{ border: 0, background: 'transparent', color: '#FCA5A5', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        )}
        {isRestoring ? (
          <div style={{ minHeight: '65vh', display: 'grid', placeItems: 'center', color: '#DCE3E5' }}>
            Verifying admin session with the backend…
          </div>
        ) : !adminUser ? (
          <AdminLoginView
            onLoginSuccess={user => setAdminUser(user)}
            onBackToFest={onBackToFest}
          />
        ) : isSuperAdminRole(adminUser.role) ? (
          <Suspense fallback={<div style={{ minHeight: '65vh', display: 'grid', placeItems: 'center', color: '#DCE3E5' }}>Loading admin workspace…</div>}>
            <DeanDashboard
              adminUser={adminUser}
              onLogout={handleLogout}
              onSwitchToFest={onBackToFest}
            />
          </Suspense>
        ) : isFinanceAdminRole(adminUser.role) ? (
          <Suspense fallback={<div style={{ minHeight: '65vh', display: 'grid', placeItems: 'center', color: '#DCE3E5' }}>Loading finance workspace…</div>}>
            <FinanceReviewerDashboard
              adminUser={adminUser}
              onLogout={handleLogout}
              onSwitchToFest={onBackToFest}
            />
          </Suspense>
        ) : isCheckinAdminRole(adminUser.role) ? (
          <Suspense fallback={<div style={{ minHeight: '65vh', display: 'grid', placeItems: 'center', color: '#DCE3E5' }}>Loading gate check-in workspace…</div>}>
            <VolunteerCheckinDashboard
              adminUser={adminUser}
              onLogout={handleLogout}
              onSwitchToFest={onBackToFest}
            />
          </Suspense>
        ) : isDepartmentAdminRole(adminUser.role) ? (
          <Suspense fallback={<div style={{ minHeight: '65vh', display: 'grid', placeItems: 'center', color: '#DCE3E5' }}>Loading department workspace…</div>}>
            <DeptCoordinatorDashboard
              adminUser={adminUser}
              onLogout={handleLogout}
              onSwitchToFest={onBackToFest}
            />
          </Suspense>
        ) : (
          <div style={{ minHeight: '65vh', display: 'grid', placeItems: 'center', padding: '32px', color: '#FCA5A5', textAlign: 'center' }}>
            <div>
              <h2 style={{ color: '#FFFFFF', marginBottom: '8px' }}>Access denied</h2>
              <p>Your role has no configured portal. Contact the Dean SAC administrator.</p>
              <button onClick={handleLogout} style={{ marginTop: '18px', padding: '10px 18px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.45)', background: 'rgba(248,113,113,0.12)', color: '#FCA5A5', cursor: 'pointer' }}>Sign out</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
