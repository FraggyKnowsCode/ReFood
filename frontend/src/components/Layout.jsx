import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import api from '../api';
import {
  LayoutDashboard, User, Salad, CalendarDays, Heart,
  DollarSign, Users, MessageSquare, LogOut, Globe,
  Search, Bell, ChevronDown, X, Settings, UserCircle,
  ShieldCheck, ExternalLink, ChevronRight, Menu
} from 'lucide-react';

const USER_NAV = [
  { name: 'Dashboard',   path: '/dashboard', icon: LayoutDashboard },
  { name: 'Profile',     path: '/profile',   icon: User },
  { name: 'Food Data',   path: '/food-data', icon: Salad },
  { name: 'Events',      path: '/programs',  icon: CalendarDays },
  { name: 'Donations',   path: '/donations', icon: Heart },
  { name: 'Feedback',    path: '/feedback',  icon: MessageSquare },
];

const ADMIN_NAV = [
  { name: 'Dashboard',       path: '/dashboard', icon: LayoutDashboard },
  { name: 'User Management', path: '/users',     icon: Users },
  { name: 'Events',          path: '/programs',  icon: CalendarDays },
  { name: 'Food Waste Data', path: '/food-data', icon: Salad },
  { name: 'Donations',       path: '/donations', icon: Heart },
  { name: 'Cost Management', path: '/costs',     icon: DollarSign },
  { name: 'Feedback',        path: '/feedback',  icon: MessageSquare },
  { name: 'Profile',         path: '/profile',   icon: User },
];

// ── Notification helpers ──────────────────────────────────────────────────
const NOTIF_ICONS = {
  event:    { icon: CalendarDays, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)'   },
  food:     { icon: Salad,        color: '#10b981', bg: 'rgba(16,185,129,0.15)'   },
  donation: { icon: Heart,        color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'   },
  request:  { icon: MessageSquare,color: '#a855f7', bg: 'rgba(168,85,247,0.15)'   },
  default:  { icon: Bell,         color: '#8b949e', bg: 'rgba(139,148,158,0.15)'  },
};

function getNotifIcon(type) {
  return NOTIF_ICONS[type] || NOTIF_ICONS.default;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ── Search helpers ────────────────────────────────────────────────────────
const SEARCH_SECTIONS = [
  { key: 'programs',  label: 'Events',     path: (id) => `/programs/${id}` },
  { key: 'donations', label: 'Donations',  path: () => '/donations' },
  { key: 'food',      label: 'Food Data',  path: () => '/food-data' },
  { key: 'users',     label: 'Users',      path: () => '/users' },
];

const Layout = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();

  // ── Search state ──────────────────────────────────────────────────────
  const [searchVal,     setSearchVal]     = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searching,     setSearching]     = useState(false);
  const searchRef   = useRef(null);
  const searchTimer = useRef(null);

  // ── Notification state ────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const notifRef = useRef(null);

  // ── Profile dropdown state ────────────────────────────────────────────
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // ── Mobile sidebar state ──────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navLinks  = isAdmin ? ADMIN_NAV : USER_NAV;
  const firstName = profile?.first_name || user?.email?.split('@')[0] || 'User';
  const initials  = profile
    ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`
    : (user?.email?.[0] || 'U').toUpperCase();

  // ── Logout ────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // ── Close dropdowns on outside click ─────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current  && !searchRef.current.contains(e.target))  setSearchOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  // ── Close search, notif, profile and sidebar when navigating ───────────
  useEffect(() => {
    setSearchOpen(false);
    setSearchVal('');
    setSidebarOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // ── Lock body scroll when mobile sidebar is open ────────────────────────
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // ── Global Search ─────────────────────────────────────────────────────
  const runSearch = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    setSearching(true);
    try {
      const results = [];
      const lower = q.toLowerCase();

      // Programs / events
      const { data: programs } = await supabase
        .from('reduction_programs')
        .select('id, program_name, start_date, participating_organizations')
        .ilike('program_name', `%${q}%`)
        .limit(5);
      if (programs?.length) {
        results.push({
          section: 'Events',
          icon: CalendarDays,
          color: '#3b82f6',
          items: programs.map(p => ({
            id: p.id,
            label: p.program_name,
            sub: `${p.start_date} · ${p.participating_organizations || ''}`,
            path: `/programs/${p.id}`,
          })),
        });
      }

      // Food data
      const { data: food } = await supabase
        .from('food_waste_data')
        .select('id, food_category, location, amount_wasted')
        .or(`food_category.ilike.%${q}%,location.ilike.%${q}%,cause_of_waste.ilike.%${q}%`)
        .limit(5);
      if (food?.length) {
        results.push({
          section: 'Food Data',
          icon: Salad,
          color: '#10b981',
          items: food.map(f => ({
            id: f.id,
            label: `${f.food_category} — ${f.amount_wasted} KG`,
            sub: f.location,
            path: '/food-data',
          })),
        });
      }

      // Donations
      const { data: donations } = await supabase
        .from('donations')
        .select('id, donor_name, donor_email, amount, payment_method')
        .or(`donor_name.ilike.%${q}%,donor_email.ilike.%${q}%,payment_method.ilike.%${q}%`)
        .limit(5);
      if (donations?.length) {
        results.push({
          section: 'Donations',
          icon: Heart,
          color: '#f59e0b',
          items: donations.map(d => ({
            id: d.id,
            label: `${d.donor_name} — ৳${d.amount}`,
            sub: d.payment_method,
            path: '/donations',
          })),
        });
      }

      // Users (admin only)
      if (isAdmin) {
        const { data: users } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
          .limit(5);
        if (users?.length) {
          results.push({
            section: 'Users',
            icon: Users,
            color: '#a855f7',
            items: users.map(u => ({
              id: u.id,
              label: `${u.first_name} ${u.last_name}`,
              sub: u.email,
              path: '/users',
            })),
          });
        }
      }

      // Nav links
      const navMatches = navLinks.filter(l =>
        l.name.toLowerCase().includes(lower)
      );
      if (navMatches.length) {
        results.push({
          section: 'Pages',
          icon: ExternalLink,
          color: '#8b949e',
          items: navMatches.map(l => ({
            id: l.path,
            label: l.name,
            sub: l.path,
            path: l.path,
          })),
        });
      }

      setSearchResults(results);
      setSearchOpen(results.length > 0 || true); // always show (even empty state)
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  }, [isAdmin, navLinks]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!searchVal.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    setSearchOpen(true);
    searchTimer.current = setTimeout(() => runSearch(searchVal), 350);
    return () => clearTimeout(searchTimer.current);
  }, [searchVal, runSearch]);

  // ── Notifications via Supabase Realtime ───────────────────────────────
  const addNotification = useCallback((notif) => {
    setNotifications(prev => {
      const next = [notif, ...prev].slice(0, 50);
      return next;
    });
    setUnreadCount(c => c + 1);
  }, []);

  useEffect(() => {
    // Load recent items as seed notifications (last 24h)
    const seedNotifications = async () => {
      try {
        const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const seeds = [];

        const { data: programs } = await supabase
          .from('reduction_programs')
          .select('id, program_name, created_at')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(5);
        programs?.forEach(p => seeds.push({
          id: `prog-${p.id}`,
          type: 'event',
          title: 'New Event Created',
          message: p.program_name,
          time: p.created_at,
          path: `/programs/${p.id}`,
          read: false,
        }));

        const { data: donations } = await supabase
          .from('donations')
          .select('id, donor_name, amount, created_at')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(5);
        donations?.forEach(d => seeds.push({
          id: `don-${d.id}`,
          type: 'donation',
          title: 'New Donation',
          message: `${d.donor_name} donated ৳${d.amount}`,
          time: d.created_at,
          path: '/donations',
          read: false,
        }));

        const { data: food } = await supabase
          .from('food_waste_data')
          .select('id, food_category, amount_wasted, created_at')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(5);
        food?.forEach(f => seeds.push({
          id: `food-${f.id}`,
          type: 'food',
          title: 'New Food Entry',
          message: `${f.food_category} — ${f.amount_wasted} KG`,
          time: f.created_at,
          path: '/food-data',
          read: false,
        }));

        // Sort by time desc
        seeds.sort((a, b) => new Date(b.time) - new Date(a.time));
        setNotifications(seeds);
        setUnreadCount(seeds.length);
      } catch (err) {
        console.error('Failed to seed notifications:', err);
      }
    };
    seedNotifications();

    // Realtime subscriptions
    const programsSub = supabase
      .channel('notif-programs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reduction_programs' }, (payload) => {
        addNotification({
          id: `prog-${payload.new.id}-${Date.now()}`,
          type: 'event',
          title: 'New Event Created',
          message: payload.new.program_name,
          time: payload.new.created_at || new Date().toISOString(),
          path: `/programs/${payload.new.id}`,
          read: false,
        });
      })
      .subscribe();

    const donationsSub = supabase
      .channel('notif-donations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'donations' }, (payload) => {
        addNotification({
          id: `don-${payload.new.id}-${Date.now()}`,
          type: 'donation',
          title: 'New Donation Received',
          message: `${payload.new.donor_name} donated ৳${payload.new.amount}`,
          time: payload.new.created_at || new Date().toISOString(),
          path: '/donations',
          read: false,
        });
      })
      .subscribe();

    const foodSub = supabase
      .channel('notif-food')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'food_waste_data' }, (payload) => {
        addNotification({
          id: `food-${payload.new.id}-${Date.now()}`,
          type: 'food',
          title: 'New Food Entry Logged',
          message: `${payload.new.food_category} — ${payload.new.amount_wasted} KG`,
          time: payload.new.created_at || new Date().toISOString(),
          path: '/food-data',
          read: false,
        });
      })
      .subscribe();

    const requestsSub = supabase
      .channel('notif-requests')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'food_requests' }, (payload) => {
        addNotification({
          id: `req-${payload.new.id}-${Date.now()}`,
          type: 'request',
          title: 'New Food Request',
          message: `A user requested a food item`,
          time: payload.new.created_at || new Date().toISOString(),
          path: '/food-data',
          read: false,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(programsSub);
      supabase.removeChannel(donationsSub);
      supabase.removeChannel(foodSub);
      supabase.removeChannel(requestsSub);
    };
  }, [addNotification]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleNotifClick = (notif) => {
    setNotifications(prev =>
      prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
    );
    setUnreadCount(c => Math.max(0, c - (notif.read ? 0 : 1)));
    setNotifOpen(false);
    navigate(notif.path);
  };

  return (
    <div className="app-shell">
      {/* Fixed background effects */}
      <div className="bg-glow bg-glow-tl" />
      <div className="bg-glow bg-glow-br" />
      <div className="bg-lines-bl" />
      <div className="bg-lines-tr" />

      {/* Outer dark frame/bezel */}
      <div className="app-frame">
        <div className="shell-inner">
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
          )}

          {/* ── Sidebar ── */}
          <aside className={`sidebar-card ${isAdmin ? 'sidebar-admin' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}>
            {/* Logo */}
            <div className="sidebar-logo-row">
              <Globe size={20} color={isAdmin ? '#a855f7' : '#3b82f6'} strokeWidth={2} />
              <span className="sidebar-logo-text">ReFood</span>
              {isAdmin && <span className="admin-badge" style={{ marginLeft: 'auto', marginRight: '0.35rem' }}>ADMIN</span>}
              <button
                type="button"
                className="mobile-sidebar-close"
                style={!isAdmin ? { marginLeft: 'auto' } : undefined}
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav */}
            <nav className="sidebar-nav" style={{ marginTop: '1.5rem', flex: 1 }}>
              <ul>
                {navLinks.map(link => {
                  const Icon = link.icon;
                  const active = location.pathname === link.path;
                  return (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        className={`nav-link ${active ? 'nav-link-active' : ''}`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                        <span>{link.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Logout at bottom */}
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={17} strokeWidth={1.8} />
              <span>Logout</span>
            </button>
          </aside>

          {/* ── Main area ── */}
          <div className="main-area">
            {/* Top bar */}
            <header className="top-bar">
              {/* Hamburger (mobile only) */}
              <button
                className="hamburger-btn"
                onClick={() => {
                  setSidebarOpen(s => !s);
                  setSearchOpen(false);
                  setNotifOpen(false);
                  setProfileOpen(false);
                }}
                aria-label="Toggle navigation"
              >
                <Menu size={20} />
              </button>

              {/* ── Search ── */}
              <div className="top-bar-search-wrap" ref={searchRef}>
                <div className={`top-bar-search ${searchOpen ? 'search-active' : ''}`}>
                  <Search size={15} color="var(--text-secondary)" />
                  <input
                    type="text"
                    placeholder="Search events, food, donations…"
                    value={searchVal}
                    onChange={e => {
                      setSearchVal(e.target.value);
                      if (e.target.value.trim()) {
                        setNotifOpen(false);
                        setProfileOpen(false);
                      }
                    }}
                    onFocus={() => {
                      if (searchVal.trim()) setSearchOpen(true);
                      setNotifOpen(false);
                      setProfileOpen(false);
                    }}
                  />
                  {searchVal && (
                    <button
                      onClick={() => { setSearchVal(''); setSearchOpen(false); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: 0 }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Search dropdown */}
                {searchOpen && (
                  <div className="search-dropdown fade-in">
                    {searching ? (
                      <div className="search-loading">
                        <div className="loader" style={{ width: 18, height: 18, margin: '0 auto' }} />
                        <span>Searching…</span>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="search-empty">
                        <Search size={28} color="var(--text-secondary)" />
                        <p>No results for <strong>"{searchVal}"</strong></p>
                      </div>
                    ) : (
                      searchResults.map(section => {
                        const SectionIcon = section.icon;
                        return (
                          <div key={section.section} className="search-section">
                            <div className="search-section-header">
                              <SectionIcon size={13} color={section.color} />
                              <span style={{ color: section.color }}>{section.section}</span>
                            </div>
                            {section.items.map(item => (
                              <button
                                key={item.id}
                                className="search-item"
                                onClick={() => { navigate(item.path); setSearchOpen(false); setSearchVal(''); }}
                              >
                                <div className="search-item-label">{item.label}</div>
                                {item.sub && <div className="search-item-sub">{item.sub}</div>}
                                <ChevronRight size={14} color="var(--text-secondary)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                              </button>
                            ))}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div className="top-bar-right">
                {/* ── Notification Bell ── */}
                <div className="top-bar-notif-wrap" ref={notifRef}>
                  <button
                    className="top-bar-btn"
                    title="Notifications"
                    onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); setSearchOpen(false); }}
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                  </button>

                  {/* Notification Panel */}
                  {notifOpen && (
                    <div className="notif-panel fade-in">
                      <div className="notif-panel-header">
                        <span className="notif-panel-title">
                          Notifications
                          {unreadCount > 0 && <span className="notif-count-pill">{unreadCount}</span>}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {unreadCount > 0 && (
                            <button className="notif-action-btn" onClick={markAllRead}>
                              Mark all read
                            </button>
                          )}
                          {notifications.length > 0 && (
                            <button className="notif-action-btn notif-clear-btn" onClick={clearAll}>
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="notif-list">
                        {notifications.length === 0 ? (
                          <div className="notif-empty">
                            <Bell size={32} color="var(--text-secondary)" />
                            <p>No notifications yet</p>
                            <span>New events, donations & food entries will appear here</span>
                          </div>
                        ) : (
                          notifications.map(notif => {
                            const { icon: NIcon, color, bg } = getNotifIcon(notif.type);
                            return (
                              <button
                                key={notif.id}
                                className={`notif-item ${!notif.read ? 'notif-unread' : ''}`}
                                onClick={() => handleNotifClick(notif)}
                              >
                                <div className="notif-icon-wrap" style={{ background: bg }}>
                                  <NIcon size={16} color={color} />
                                </div>
                                <div className="notif-content">
                                  <div className="notif-title">{notif.title}</div>
                                  <div className="notif-message">{notif.message}</div>
                                  <div className="notif-time">{timeAgo(notif.time)}</div>
                                </div>
                                {!notif.read && <div className="notif-unread-dot" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Profile Dropdown ── */}
                <div className="top-bar-profile-wrap" ref={profileRef}>
                  <div
                    className="top-bar-profile"
                    onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); setSearchOpen(false); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setProfileOpen(o => !o)}
                  >
                    <div className="top-bar-avatar">{initials}</div>
                    <span className="top-bar-name">{isAdmin ? 'Admin' : firstName}</span>
                    <ChevronDown
                      size={14}
                      color="var(--text-secondary)"
                      style={{ transition: 'transform 0.2s', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </div>

                  {/* Profile Menu */}
                  {profileOpen && (
                    <div className="profile-menu fade-in">
                      <div className="profile-menu-header">
                        <div className="profile-menu-avatar">{initials}</div>
                        <div>
                          <div className="profile-menu-name">
                            {profile ? `${profile.first_name} ${profile.last_name}` : firstName}
                          </div>
                          <div className="profile-menu-email">{user?.email}</div>
                        </div>
                      </div>

                      <div className="profile-menu-divider" />

                      <button className="profile-menu-item" onClick={() => { navigate('/profile'); setProfileOpen(false); }}>
                        <UserCircle size={16} />
                        <span>My Profile</span>
                      </button>

                      {isAdmin && (
                        <button className="profile-menu-item" onClick={() => { navigate('/users'); setProfileOpen(false); }}>
                          <ShieldCheck size={16} />
                          <span>User Management</span>
                        </button>
                      )}

                      <div className="profile-menu-divider" />

                      <button className="profile-menu-item profile-menu-logout" onClick={handleLogout}>
                        <LogOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Page content */}
            <main className="page-content">
              {isAdmin && (
                <div className="admin-top-bar">
                  <span>You are viewing the <strong>Admin Panel</strong></span>
                  <span className="admin-top-bar-email">{user?.email}</span>
                </div>
              )}
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
