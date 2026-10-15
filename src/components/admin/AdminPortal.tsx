import React, { useState, useEffect } from 'react';
import { AdminAuthService, AdminUser } from '../../services/adminAuthService';
import { AdminLoginView } from './AdminLoginView';
import { DeanDashboard } from './DeanDashboard';
import { DeptCoordinatorDashboard } from './DeptCoordinatorDashboard';

interface AdminPortalProps {
  onBackToFest: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBackToFest }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => AdminAuthService.getCurrentAdmin());

  const handleLogout = () => {
    AdminAuthService.logout();
    setAdminUser(null);
  };

  if (!adminUser) {
    return (
      <AdminLoginView
        onLoginSuccess={user => setAdminUser(user)}
        onBackToFest={onBackToFest}
      />
    );
  }

  if (adminUser.role === 'dean_sac') {
    return (
      <DeanDashboard
        adminUser={adminUser}
        onLogout={handleLogout}
        onSwitchToFest={onBackToFest}
      />
    );
  }

  return (
    <DeptCoordinatorDashboard
      adminUser={adminUser}
      onLogout={handleLogout}
      onSwitchToFest={onBackToFest}
    />
  );
};
