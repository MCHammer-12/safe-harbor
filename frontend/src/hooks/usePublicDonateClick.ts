import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * Public donate CTA: guests → login; users with Donor role → /donor;
 * other authenticated users → staff donate modal (no silent /donor redirect).
 */
export function usePublicDonateClick() {
  const navigate = useNavigate();
  const { isAuthenticated, authSession } = useAuth();
  const [staffDonateModalOpen, setStaffDonateModalOpen] = useState(false);

  const onDonateClick = useCallback(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=%2Fdonor');
      return;
    }
    const roles = authSession.roles ?? [];
    if (roles.includes('Donor')) {
      navigate('/donor');
      return;
    }
    setStaffDonateModalOpen(true);
  }, [isAuthenticated, authSession.roles, navigate]);

  return {
    onDonateClick,
    staffDonateModalOpen,
    setStaffDonateModalOpen,
  };
}
