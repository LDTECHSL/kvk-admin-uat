import { useEffect, useRef, useState } from 'react';
import { LogOut, Menu, Maximize2, Minimize2, Settings, Search, ChevronRight, ChevronDown, PanelLeftClose, PanelLeftOpen, ArrowUpRight, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPageInfo, searchableLinks } from '@/lib/navigation';
import Dialog from '@/components/ui/dialog';
interface NavbarProps { sidebarOpen: boolean; onSidebarToggle: () => void; onMobileDrawerToggle: () => void; mobileDrawerOpen: boolean }
export default function Navbar({ sidebarOpen, onSidebarToggle, onMobileDrawerToggle, mobileDrawerOpen }: NavbarProps) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const accountRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const page = getPageInfo(pathname);
  const admin = JSON.parse(localStorage.getItem('admin') || 'null');
  const results = searchableLinks.filter(item => (item.group + ' ' + item.label).toLowerCase().includes(query.toLowerCase().trim()));
  useEffect(() => {
    const pointer = (event: MouseEvent) => { if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false); };
    const keyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(value => !value); }
      if (event.key === 'Escape') setAccountOpen(false);
    };
    const screen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('mousedown', pointer); document.addEventListener('keydown', keyboard); document.addEventListener('fullscreenchange', screen);
    return () => { document.removeEventListener('mousedown', pointer); document.removeEventListener('keydown', keyboard); document.removeEventListener('fullscreenchange', screen); };
  }, []);
  const go = (path: string) => { navigate(path); setSearchOpen(false); setQuery(''); };
  return <>
    <header className="workspace-topbar">
      <button className="icon-button desktop-toggle" onClick={onSidebarToggle} aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>{sidebarOpen ? <PanelLeftClose size={19} /> : <PanelLeftOpen size={19} />}</button>
      <button className="icon-button mobile-toggle" onClick={onMobileDrawerToggle} aria-label="Open navigation" aria-expanded={mobileDrawerOpen}><Menu size={20} /></button>
      <nav className="breadcrumb" aria-label="Breadcrumb"><span>{page.group}</span><ChevronRight size={13} /><strong>{page.label}</strong></nav>
      <div className="topbar-actions">
        <button className="search-launcher" onClick={() => setSearchOpen(true)} aria-label="Search pages"><Search size={16} /><span>Find a page...</span><kbd>Ctrl K</kbd></button>
        <button className="icon-button fullscreen-button" onClick={async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { /* Fullscreen is optional in embedded browsers. */ } }} aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>{fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
        <div className="account-control" ref={accountRef}>
          <button className="account-trigger" onClick={() => setAccountOpen(!accountOpen)} aria-expanded={accountOpen} aria-label="Account options"><span className="avatar">{admin?.firstName?.charAt(0) || 'A'}{admin?.lastName?.charAt(0)}</span><span className="account-name">{admin?.firstName || 'Admin'}<small>Administrator</small></span><ChevronDown size={14} /></button>
          {accountOpen && <div className="account-popover"><div><strong>{admin?.firstName} {admin?.lastName}</strong><small>{admin?.email}</small></div><button onClick={() => { navigate('/main/settings'); setAccountOpen(false); }}><Settings size={16} />Account settings</button><button onClick={() => { localStorage.removeItem('admin'); navigate('/', { replace: true }); }}><LogOut size={16} />Sign out</button></div>}
        </div>
      </div>
    </header>
    <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} label="Find a page" className="command-dialog">
      <div className="command-input"><Search size={20} /><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search modules, pages, settings..." aria-label="Search pages" onKeyDown={event => { if (event.key === 'Enter' && results[0]) go(results[0].path); }} /><button className="icon-button" onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={18} /></button></div>
      <div className="command-results">{results.length ? results.map(item => <button key={item.path} onClick={() => go(item.path)}><span className="command-icon"><item.icon size={18} /></span><span><strong>{item.label}</strong><small>{item.group}</small></span><ArrowUpRight size={15} /></button>) : <p className="command-empty">No pages found. Try a module name such as Gym or Cafe.</p>}</div><div className="command-footer">Navigate your workspace <span><kbd>Esc</kbd> to close</span></div>
    </Dialog>
  </>;
}
