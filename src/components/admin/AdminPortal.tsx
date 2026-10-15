import React, { useState } from 'react';
import { AdminAuthService, AdminUser } from '../../services/adminAuthService';
import { AdminLoginView } from './AdminLoginView';
import { DeanDashboard } from './DeanDashboard';
import { DeptCoordinatorDashboard } from './DeptCoordinatorDashboard';
import { GlitterBackground } from '../GlitterBackground';

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
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      {/* Background Glitter Starfield & Cyber Grid for Admin Console */}
      <GlitterBackground />
      <div className="glitter-stardust-layer" />
      <div className="cyber-grid-overlay" />

      <div style={{ position: 'relative', zIndex: 10 }}>
        {!adminUser ? (
          <AdminLoginView
            onLoginSuccess={user => setAdminUser(user)}
            onBackToFest={onBackToFest}
          />
        ) : (adminUser.role === 'dean_sac' || adminUser.role === 'connect_club' || adminUser.role === 'vencorpia') ? (
          <DeanDashboard
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
