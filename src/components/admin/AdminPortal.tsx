import React, { useState } from 'react';
import { AdminAuthService, AdminUser, isSuperAdminRole } from '../../services/adminAuthService';
import { AdminLoginView } from './AdminLoginView';
import { DeanDashboard } from './DeanDashboard';
import { FinanceReviewerDashboard } from './FinanceReviewerDashboard';
import { VolunteerCheckinDashboard } from './VolunteerCheckinDashboard';
import { DeptCoordinatorDashboard } from './DeptCoordinatorDashboard';
import { GlitterBackground } from '../GlitterBackground';
import './admin.css';

interface AdminPortalProps {
  onBackToFest: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBackToFest }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => AdminAuthService.getCurrentAdmin());

  const handleLogout = () => {
    AdminAuthService.logout();
    setAdminUser(null);
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
        {!adminUser ? (
          <AdminLoginView
            onLoginSuccess={user => setAdminUser(user)}
            onBackToFest={onBackToFest}
          />
        ) : isSuperAdminRole(adminUser.role) ? (
          <DeanDashboard
            adminUser={adminUser}
            onLogout={handleLogout}
            onSwitchToFest={onBackToFest}
          />
        ) : adminUser.role === 'finance_reviewer' ? (
          <FinanceReviewerDashboard
            adminUser={adminUser}
            onLogout={handleLogout}
            onSwitchToFest={onBackToFest}
          />
        ) : adminUser.role === 'volunteer_checkin' ? (
          <VolunteerCheckinDashboard
            adminUser={adminUser}
            onLogout={handleLogout}
            onSwitchToFest={onBackToFest}
          />
        ) : (
          <DeptCoordinatorDashboard
            adminUser={adminUser}
            onLogout={handleLogout}
            onSwitchToFest={onBackToFest}
          />
        )}
      </div>
    </div>
  );
};
