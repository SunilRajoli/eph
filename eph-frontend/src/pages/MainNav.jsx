// src/pages/MainNav.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import SidebarLayout from '../components/SidebarLayout';
import CompetitionScreen from './CompetitionScreen';
import FeedScreen from './FeedScreen';
import PerksScreen from './PerksScreen';
import ProfileScreen from './ProfileScreen';
import AdminHubScreen from './AdminHubScreen';

const MainNav = ({ initialPage = 'competitions' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(initialPage);

  // Read ?tab= from the URL and keep state in sync
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const tab = (q.get('tab') || '').toLowerCase();
    if (tab && tab !== currentPage) {
      setCurrentPage(tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // When sidebar changes, update both state and URL (so deep links work)
  const handlePageChange = (page) => {
    setCurrentPage(page);
    const q = new URLSearchParams(location.search);
    q.set('tab', page);
    navigate({ pathname: '/main', search: `?${q.toString()}` }, { replace: true });
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'competitions':
        return <CompetitionScreen />;
      case 'feed':
        return <FeedScreen />;
      case 'perks':
        return <PerksScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'admin':
        return <AdminHubScreen />;
      default:
        return <CompetitionScreen />;
    }
  };

  return (
    <SidebarLayout currentPage={currentPage} onPageChange={handlePageChange}>
      {renderCurrentPage()}
    </SidebarLayout>
  );
};

export default MainNav;
