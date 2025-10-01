// src/components/SidebarLayout.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo.jpg'; // ✅ logo import

const NavButton = ({ active, label, icon, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
      ${active
        ? 'bg-white/15 text-white'
        : 'text-white/80 hover:text-white hover:bg-white/10'}
    `}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const SidebarLayout = ({ currentPage, onPageChange, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const isAdmin = (user?.role || '').toLowerCase() === 'admin';

  useEffect(() => {
    const onDown = (e) => {
      if (openMenu && menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openMenu]);

  const handleChangePassword = () => {
    setOpenMenu(false);
    navigate('/change-password');
  };

  const handleLogout = async () => {
    setOpenMenu(false);
    try {
      await logout?.();
    } catch {}
    navigate('/', { replace: true });
  };

  const handlePageChange = (page) => {
    onPageChange(page);
    const q = new URLSearchParams(location.search);
    q.set('tab', page);

    const basePath = isAdmin ? '/admin' : '/main';
    navigate({ pathname: basePath, search: `?${q.toString()}` }, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-primary text-white">
      <div className="safe-area h-screen flex">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 h-full bg-white/10 backdrop-blur-xs border-r border-white/20 p-4 flex flex-col">
          
          {/* ✅ Brand with logo */}
          <div className="flex items-center gap-3 mb-6">
            <img
              src={logo}
              alt="EPH Logo"
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div>
              <div className="text-base font-bold leading-5">PPL</div>
              <div className="text-xs text-white/70">Premiere Project League</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            <NavButton
              label="Competitions"
              active={currentPage === 'competitions'}
              onClick={() => handlePageChange('competitions')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M8 13V7a4 4 0 118 0v6"/>
                </svg>
              }
            />
            <NavButton
              label="Feed"
              active={currentPage === 'feed'}
              onClick={() => handlePageChange('feed')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 11H5m14-4H5m14 8H5m14 4H5"/>
                </svg>
              }
            />
            <NavButton
              label="Profile"
              active={currentPage === 'profile'}
              onClick={() => handlePageChange('profile')}
              icon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                  <path d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              }
            />
            {isAdmin && (
              <NavButton
                label="Admin Hub"
                active={currentPage === 'admin'}
                onClick={() => handlePageChange('admin')}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                }
              />
            )}
          </nav>

          {/* ✅ Footer (user profile dropdown) */}
          <div className="mt-auto pt-4 border-t border-white/15 relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpenMenu((v) => !v)}
              className={`w-full flex items-center justify-between gap-3 px-2 py-2 rounded-lg transition-colors select-none
                ${openMenu ? 'bg-white/12' : 'hover:bg-white/10'}
              `}
              aria-haspopup="menu"
              aria-expanded={openMenu}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                    <path d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-sm font-semibold truncate">
                    {user?.name || 'User'}
                  </div>
                  <div className="text-xs text-white/70 truncate">
                    {user?.email || ''}
                  </div>
                </div>
              </div>
              <svg
                className={`w-4 h-4 text-white/70 transition-transform ${openMenu ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            {openMenu && (
              <div
                role="menu"
                className="absolute left-2 right-2 bottom-14 z-30 bg-white/10 backdrop-blur-xs border border-white/20 rounded-lg overflow-hidden shadow-lg"
              >
                <button
                  onClick={handleChangePassword}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-white/15 flex items-center gap-2"
                  role="menuitem"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  Change Password
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-white/15 text-red-300 flex items-center gap-2"
                  role="menuitem"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-20 bg-white/10 backdrop-blur-xs border-b border-white/20">
            <div className="px-4 py-3 md:px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-base md:text-lg font-bold">Dashboard</h1>
                {user?.role && (
                  <span className="px-2 py-0.5 rounded-full bg-white/15 text-[11px] md:text-xs font-semibold">
                    {(user.role || '').toUpperCase()}
                  </span>
                )}
              </div>
              <div className="text-xs md:text-sm text-white/80">
                Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default SidebarLayout;
