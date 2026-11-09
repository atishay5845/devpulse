import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, Bell, ChartLine, ChevronDown, CircleHelp, Command, ExternalLink, FolderKanban, Gauge, LayoutDashboard, LogOut, Menu, Monitor, RadioTower, Search, Settings, ShieldCheck, X, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils/format';
import { monitorsApi } from '../api/endpoints';
import { api } from '../api/client';

const navGroups = [
  { label: 'WORKSPACE', items: [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/monitors', label: 'Monitors', icon: Monitor },
    { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
  ]},
  { label: 'INSIGHTS', items: [
    { to: '/analytics', label: 'Analytics', icon: ChartLine },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/status-pages', label: 'Status pages', icon: RadioTower },
  ]},
];

function Brand() {
  return <NavLink to="/dashboard" className="brand-lockup"><div className="brand-mark"><Zap size={19} fill="currentColor"/></div><div><div className="brand-name">devpulse<span>.</span></div><div className="brand-caption">OBSERVABILITY, SIMPLIFIED</div></div></NavLink>;
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [monitorCount, setMonitorCount] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { setMobileOpen(false); setSearchOpen(false); }, [location.pathname]);
  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(true); }
      if (event.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);
  useEffect(() => {
    monitorsApi.list().then((response) => {
      const data = response.data;
      setMonitorCount(Array.isArray(data) ? data.length : (data?.count ?? data?.results?.length ?? 0));
    }).catch(() => setMonitorCount(null));
  }, [location.pathname]);

  const title = useMemo(() => {
    if (location.pathname === '/dashboard') return 'Overview';
    if (/^\/monitors\/\d+/.test(location.pathname)) return 'Monitor details';
    if (/^\/incidents\/\d+/.test(location.pathname)) return 'Incident details';
    return location.pathname.split('/').filter(Boolean).at(-1)?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Workspace';
  }, [location.pathname]);

  const handleSearch = async (event) => {
    event.preventDefault();
    const query = search.trim();
    if (!query) return;
    try {
      let page = 1; let records = []; let hasMore = true;
      while (hasMore && page <= 10) {
        const response = await monitorsApi.list({ page });
        records = records.concat(Array.isArray(response.data) ? response.data : response.data?.results || []);
        hasMore = Boolean(response.data?.next); page += 1;
      }
      const exact = records.find((item) => item.name.toLowerCase().includes(query.toLowerCase()) || item.url.toLowerCase().includes(query.toLowerCase()));
      if (exact) navigate(`/monitors/${exact.id}`);
      else navigate('/monitors', { state: { search: query } });
    } catch { navigate('/monitors', { state: { search: query } }); }
    setSearchOpen(false);
  };

  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)}/>}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top"><Brand/><button className="mobile-close icon-button" onClick={() => setMobileOpen(false)}><X size={19}/></button></div>
        <div className="workspace-switcher"><div className="workspace-avatar">S</div><div className="workspace-copy"><strong>Personal workspace</strong><span>Account workspace</span></div><ChevronDown size={15}/></div>
        <nav className="side-nav">
          {navGroups.map((group) => <div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}><item.icon size={17}/><span>{item.label}</span>{item.label === 'Monitors' && monitorCount !== null && <span className="nav-count">{monitorCount}</span>}</NavLink>)}</div>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip"><div className="tip-icon"><ShieldCheck size={16}/></div><strong>Stay one step ahead</strong><p>Catch issues before your users do. Your monitors are always on guard.</p><button onClick={() => navigate('/monitors')}>Manage monitors <ExternalLink size={12}/></button></div>
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}><Settings size={17}/><span>Settings</span></NavLink>
          <div className="user-menu"><div className="user-avatar">{initials(user)}</div><div className="user-copy"><strong>{user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || 'Developer'}</strong><span>{user?.email || 'Your account'}</span></div><button className="user-logout" title="Sign out" onClick={logout}><LogOut size={16}/></button></div>
        </div>
      </aside>
      <main className="main-shell">
        <header className="topbar">
          <div className="topbar-left"><button className="mobile-menu icon-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20}/></button><div className="breadcrumb"><span>Workspace</span><span className="crumb-sep">/</span><strong>{title}</strong></div></div>
          <div className="topbar-actions"><button className="top-search" onClick={() => setSearchOpen(true)}><Search size={15}/><span>Search monitors...</span><kbd>Ctrl K</kbd></button><div className="top-divider"/><a className="top-icon" title="API documentation" href={`${api.defaults.baseURL}/docs/`} target="_blank" rel="noreferrer"><CircleHelp size={18}/></a><div className="top-avatar">{initials(user)}</div></div>
        </header>
        <div className="content-wrap"><Outlet/></div>
      </main>
      {searchOpen && <div className="command-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}><form className="command-dialog" onSubmit={handleSearch}><div className="command-input-row"><Search size={19}/><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your monitors by name or URL…"/><button type="button" className="kbd-close" onClick={() => setSearchOpen(false)}>ESC</button></div><div className="command-footer"><span><Command size={13}/> Quick find</span><span>Search your workspace</span></div></form></div>}
    </div>
  );
}
