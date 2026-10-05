import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowUpRight, ChevronDown, Layers3, Settings } from 'lucide-react';
import { modules, workspaceLinks } from '@/lib/navigation';

interface SidebarProps { isOpen: boolean; isMobile: boolean; onClose?: () => void }
export default function Sidebar({ isOpen, isMobile, onClose }: SidebarProps) {
  const { pathname } = useLocation();
  const collapsed = !isOpen && !isMobile;
  const [expanded, setExpanded] = useState<string | null>(() => modules.find(module => pathname.startsWith(module.path + '/'))?.path ?? null);
  useEffect(() => { setExpanded(modules.find(module => pathname.startsWith(module.path + '/'))?.path ?? null); }, [pathname]);
  const admin = JSON.parse(localStorage.getItem('admin') || 'null');
  return <aside className={'workspace-sidebar' + (collapsed ? ' compact' : '')} aria-label="Main navigation">
    <NavLink to="/main/dashboard" className="workspace-brand" onClick={onClose} aria-label="KVK Arena overview">
      <span className="brand-mark"><Layers3 size={22} strokeWidth={1.7} /></span>
      {!collapsed && <span><strong>KVK<span className="brand-light"> Arena</span></strong><small>MANAGEMENT SUITE</small></span>}
    </NavLink>
    <div className="sidebar-scroll">
      {!collapsed && <p className="nav-caption">Workspace</p>}
      <nav className="nav-list">
        {workspaceLinks.map(item => <NavLink key={item.path} to={item.path} end onClick={onClose} title={collapsed ? item.label : undefined} className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <item.icon size={18} strokeWidth={1.7} /><span>{item.label}</span>
        </NavLink>)}
      </nav>
      {!collapsed && <p className="nav-caption nav-caption-spaced">Business modules <span>06</span></p>}
      <nav className="nav-list module-navigation">
        {modules.map(module => {
          const active = pathname.startsWith(module.path + '/');
          const open = expanded === module.path;
          return <div key={module.path}>
            {collapsed ? <NavLink to={module.path + '/dashboard'} className={'nav-item' + (active ? ' active' : '')} title={module.label}><module.icon size={18} style={{ color: module.color }} /></NavLink> : <>
              <button type="button" className={'nav-item module-toggle' + (active ? ' module-active' : '')} onClick={() => setExpanded(open ? null : module.path)} aria-expanded={open} aria-controls={'nav-' + module.path.slice(1)}>
                <module.icon size={18} strokeWidth={1.7} style={{ color: module.color }} /><span>{module.label}</span><ChevronDown size={14} className={open ? 'chevron-open' : ''} />
              </button>
              {open && <div className="module-subnav" id={'nav-' + module.path.slice(1)}>{module.links.map(item => <NavLink key={item.path} to={item.path} end onClick={onClose} className={({ isActive }) => 'subnav-item' + (isActive ? ' active' : '')}>{item.label}<ArrowUpRight size={13} /></NavLink>)}</div>}
            </>}
          </div>;
        })}
      </nav>
    </div>
    <div className="sidebar-footer">
      <NavLink to="/main/settings" onClick={onClose} className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')} title={collapsed ? 'Account settings' : undefined}><Settings size={18} strokeWidth={1.7} /><span>Account settings</span></NavLink>
      <div className="sidebar-profile"><span className="avatar avatar-dark">{admin?.firstName?.charAt(0) || 'A'}{admin?.lastName?.charAt(0)}</span>{!collapsed && <div><strong>{admin?.firstName || 'Administrator'} {admin?.lastName}</strong><span>Workspace administrator</span></div>}</div>
    </div>
  </aside>;
}
