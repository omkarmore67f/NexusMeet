import React, { useState } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { createMeetingAPI } from '../services/meetingService';
import { 
  LayoutDashboard, ShieldAlert, LogOut, User as UserIcon, Menu, X, 
  Settings, ChevronLeft, ChevronRight, Search, Bell, Plus, 
  Calendar, MessageSquare, Edit3, Files, Users, BarChart3, ChevronDown, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Import brand logo image
import logoImg from '../assets/logo.png';

export const AppLayout: React.FC = () => {
  const { user, token, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState('Personal Workspace');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [startRoomLoading, setStartRoomLoading] = useState(false);

  // If not authenticated, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleStartRoom = async () => {
    setStartRoomLoading(true);
    try {
      const res = await createMeetingAPI({
        title: `${user?.name || 'Quick'}'s Collaboration`,
        settings: {
          isMutedByDefault: false,
          isCameraOffByDefault: false,
          requireWaitingRoom: false
        }
      });
      if (res.success && res.meeting) {
        navigate(`/room/${res.meeting.meetingCode}`);
      } else {
        triggerToast('Failed to create meeting room.');
      }
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Error creating meeting room.');
    } finally {
      setStartRoomLoading(false);
    }
  };

  // Nav Items with mock categories
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Meetings', path: '/', icon: Calendar, isMock: true, badge: 'Coming Soon' },
    { label: 'Calendar', path: '/', icon: Calendar, isMock: true },
    { label: 'Messages', path: '/', icon: MessageSquare, isMock: true },
    { label: 'Whiteboard', path: '/', icon: Edit3, isMock: true },
    { label: 'Files', path: '/', icon: Files, isMock: true },
    { label: 'Contacts', path: '/', icon: Users, isMock: true },
    { label: 'Analytics', path: '/', icon: BarChart3, isMock: true },
    { label: 'Settings', path: '/settings', icon: Settings }
  ];

  if (user?.role === 'admin') {
    navItems.push({ label: 'Admin Panel', path: '/admin', icon: ShieldAlert });
  }

  const handleItemClick = (e: React.MouseEvent, item: any) => {
    if (item.isMock) {
      e.preventDefault();
      triggerToast(`${item.label} suite is active inside live rooms. Start a meeting to collaborate.`);
    }
  };

  const workspaceOptions = [
    'Personal Workspace',
    'NexusMeet Team Space',
    'Design Hub',
    'Product Strategy'
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] premium-mesh-bg text-slate-900 flex overflow-hidden h-screen">
      {/* Sidebar for Desktop */}
      <motion.aside
        animate={{ width: isCollapsed ? 72 : 256 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="hidden md:flex flex-col bg-slate-50 border-r border-slate-200/70 shrink-0 justify-between relative z-30 select-none backdrop-blur-xl h-full"
      >
        <div>
          {/* Header & Workspace Switcher */}
          <div className="p-4 border-b border-slate-200/70 flex items-center justify-between">
            <div className="relative w-full">
              <button
                onClick={() => !isCollapsed && setWorkspaceOpen(!workspaceOpen)}
                className={`flex items-center gap-2.5 w-full text-left rounded-lg transition-colors p-1.5 ${
                  isCollapsed ? 'justify-center bg-transparent' : 'hover:bg-slate-200/50'
                }`}
              >
                <img 
                  src={logoImg} 
                  alt="NexusMeet Logo" 
                  className="h-10 w-10 rounded-xl shrink-0 shadow-md object-contain border border-slate-200 bg-white p-1" 
                />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 leading-none">NexusMeet</p>
                      <p className="text-[10px] text-slate-555 truncate mt-0.5">{currentWorkspace}</p>
                    </div>
                    <ChevronDown size={12} className="text-slate-400 shrink-0 ml-1" />
                  </div>
                )}
              </button>

              {/* Workspace dropdown list */}
              <AnimatePresence>
                {workspaceOpen && !isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-11 left-0 w-full bg-white border border-slate-200 rounded-xl p-1.5 shadow-xl z-50"
                  >
                    {workspaceOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setCurrentWorkspace(opt);
                          setWorkspaceOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          currentWorkspace === opt 
                            ? 'bg-brand-600 text-white' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-0.5">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path && !item.isMock;
              return (
                <Link
                  key={idx}
                  to={item.path}
                  onClick={(e) => handleItemClick(e, item)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all relative group ${
                    isActive
                      ? 'bg-brand-55 text-brand-600 border border-brand-200/50'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/40 border border-transparent'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={16} className={isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-800 transition-colors'} />
                  {!isCollapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="text-[8px] bg-brand-100 text-brand-600 border border-brand-200 px-1.5 py-0.5 rounded scale-90 shrink-0 font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profile Card & Collapse button */}
        <div className="p-4 border-t border-slate-200/70 space-y-4">
          {/* User profile */}
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="relative shrink-0">
              <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center border border-slate-300">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <UserIcon size={16} className="text-slate-600" />
                )}
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate leading-none">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">Online</p>
              </div>
            )}
          </div>

          {/* Toggle sidebar button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center justify-center p-1.5 rounded-lg border border-slate-200 bg-slate-100/50 text-slate-500 hover:text-slate-900 w-full transition-colors"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <div className="flex items-center gap-2 text-[10px] font-bold"><ChevronLeft size={12} /> Collapse</div>}
          </button>
        </div>
      </motion.aside>

      {/* Main pane layout container */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 z-30 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <img 
              src={logoImg} 
              alt="NexusMeet Logo" 
              className="h-10 w-10 rounded-xl object-contain shadow-sm border border-slate-200 bg-white p-1" 
            />
            <span className="text-lg font-bold tracking-tight text-slate-900">NexusMeet</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Notifications icon */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors relative"
              >
                <Bell size={14} />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-brand-500 rounded-full" />
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-11 w-72 bg-white border border-slate-200 rounded-xl p-4 shadow-xl z-50"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                      <span className="text-xs font-bold text-slate-900">Notifications</span>
                      <button className="text-[10px] text-brand-600 hover:underline">Mark read</button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0 mt-1" />
                        <div>
                          <p className="text-[11px] font-semibold text-slate-900">Welcome to NexusMeet!</p>
                          <p className="text-[9px] text-slate-550 mt-0.5">Explore whiteboards & calling grids</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon size={14} className="text-slate-500" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-11 w-48 bg-white border border-slate-200 rounded-xl p-1.5 shadow-xl z-50"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                      <p className="text-[9px] text-slate-555 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-955 hover:bg-slate-55 transition-colors"
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar drawer overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Dimmed backdrop background */}
              <div 
                className="md:hidden fixed inset-0 bg-slate-900/30 z-40 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="md:hidden fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 p-6 flex flex-col justify-between pt-20 shadow-2xl"
              >
                <nav className="space-y-1">
                  {navItems.map((item, idx) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path && !item.isMock;
                    return (
                      <Link
                        key={idx}
                        to={item.path}
                        onClick={(e) => {
                          handleItemClick(e, item);
                          if (!item.isMock) setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                          isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:text-slate-950'
                        }`}
                      >
                        <Icon size={18} />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="border-t border-slate-200 pt-4 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="h-full w-full object-cover rounded-full" />
                      ) : (
                        <UserIcon size={20} className="text-slate-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                      <p className="text-xs text-slate-550 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-555 hover:bg-red-50 transition-colors w-full"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Top Navigation Bar - Hidden on mobile viewports */}
        <header className="hidden md:flex h-14 bg-white border-b border-slate-200/80 items-center justify-between px-6 z-20 shrink-0 shadow-sm backdrop-blur-md">
          {/* Left: search bar */}
          <div className="flex items-center gap-4 w-96 max-w-xs sm:max-w-md">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search meetings, rooms, files..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Right: Quick actions, notifications, profiles */}
          <div className="flex items-center gap-3">
            {/* Quick start CTA */}
            <button
              onClick={handleStartRoom}
              disabled={startRoomLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-brand-500/10 transition-colors disabled:opacity-50"
            >
              {startRoomLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Plus size={12} />
              )}
              Start Room
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors relative"
              >
                <Bell size={14} />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-brand-500 rounded-full" />
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-11 w-80 bg-white border border-slate-200 rounded-xl p-4 shadow-xl z-50"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                      <span className="text-xs font-bold text-slate-900">Notifications</span>
                      <button className="text-[10px] text-brand-600 hover:underline">Mark read</button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0 mt-1" />
                        <div>
                          <p className="text-[11px] font-semibold text-slate-900">Welcome to NexusMeet!</p>
                          <p className="text-[9px] text-slate-555 mt-0.5">Explore whiteboards & instant calling</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1.5 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-slate-150 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon size={14} className="text-slate-500" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-11 w-48 bg-white border border-slate-200 rounded-xl p-1.5 shadow-xl z-50"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                      <p className="text-[9px] text-slate-555 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-55 transition-colors"
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content outlet */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 grid-overlay">
          <Outlet />
        </main>
      </div>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 bg-white border border-slate-200 text-xs text-slate-800 px-4 py-3 rounded-xl shadow-xl z-50 flex items-center gap-3 min-w-[280px]"
          >
            <div className="h-6 w-6 rounded-md bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              ⚡
            </div>
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
