// src/layouts/DashboardLayout.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { name: 'Overview', path: '/', icon: '📊' },
    { name: 'Jobs', path: '/jobs', icon: '💼' },
    { name: 'Wallet', path: '/wallet', icon: '💰' },
    { name: 'Profile', path: '/profile', icon: '👤' },
    { name: 'Support', path: '/support', icon: '❓' },
  ];

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setDropdownOpen(false);
    }
  };

  const goToProfile = () => {
    navigate('/profile');
    setDropdownOpen(false);
  };

  const goToSupport = () => {
    navigate('/support');
    setDropdownOpen(false);
  };

  // Generate initials: e.g., "Deuk Mose" → "DM"
  const getInitials = () => {
    if (!currentUser) return 'U';
    const first = currentUser.first_name?.charAt(0).toUpperCase() || '';
    const last = currentUser.last_name?.charAt(0).toUpperCase() || '';
    return (first + last) || 'U';
  };

  const currentNav = navItems.find(item => item.path === location.pathname)?.name || 'Dashboard';

  return (
    <div className="flex min-h-screen bg-app">
      {/* Fixed Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:z-0`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 shrink-0">
          <h1 className="text-xl font-bold text-primary-600">Earn</h1>
          <p className="text-sm text-gray-600 mt-1">Qezzy Kenya</p>
        </div>

        {/* Navigation */}
        <nav className="p-4 overflow-y-auto flex-1">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${
                    location.pathname === item.path
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar User Section (optional: can be removed if topbar is primary) */}
        <div className="shrink-0 p-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 font-medium">
                {getInitials()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {currentUser?.first_name || 'User'}
              </p>
              <p className="text-xs text-gray-500">{currentUser?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full text-left text-sm text-red-600 hover:text-red-800 font-medium py-1.5 rounded hover:bg-red-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 md:ml-64">
        {/* 🔝 Enhanced Top Bar */}
        <header className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 p-4 h-16 flex items-center justify-between">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1 rounded hover:bg-gray-100 text-gray-700 text-lg"
          >
            ☰
          </button>

          {/* Page title */}
          <h1 className="text-lg font-semibold text-gray-800 flex-1 text-center md:text-left md:ml-4">
            {currentNav}
          </h1>

          {/* ✨ Avatar + Status + Dropdown (Desktop & Mobile) */}
          <div className="relative flex items-center gap-2" ref={dropdownRef}>
            {/* Account Status Badge */}
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                currentUser?.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {currentUser?.is_active ? 'Active' : 'Inactive'}
            </span>

            {/* Avatar */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium text-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              {getInitials()}
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute top-10 right-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
                <button
                  onClick={goToProfile}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <span>👤</span> Profile
                </button>
                <button
                  onClick={goToSupport}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <span>❓</span> Support
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <span>🚪</span> Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="mt-16 flex-1">
            <div className="p-4 md:p-6 bg-amber-50 min-h-full rounded-tl-2xl">
                <Outlet />
            </div>                          
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;