import { hasAllModuleAccess } from '@/lib/admin-access';
import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import Navbar from '@/components/navbar';
import Sidebar from '@/components/sidebar';
import Dialog from '@/components/ui/dialog';
export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => localStorage.getItem('admin-sidebar-collapsed') !== 'true');
  const [mobileOpen, setMobileOpen] = useState(false);
  let admin = null;
  try { admin = JSON.parse(localStorage.getItem('admin') || 'null'); } catch { /* Invalid saved sessions return to login. */ }
  const canAccess = Boolean(admin?.token) && hasAllModuleAccess(admin?.modules);
  useEffect(() => { if (!canAccess) { localStorage.removeItem('admin'); window.location.href = '/'; } }, [canAccess]);
  useEffect(() => { localStorage.setItem('admin-sidebar-collapsed', String(!sidebarOpen)); }, [sidebarOpen]);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const close = () => { if (media.matches) setMobileOpen(false); };
    media.addEventListener('change', close);
    return () => media.removeEventListener('change', close);
  }, []);
  if (!canAccess) return null;
  return <div className={'admin-workspace' + (sidebarOpen ? '' : ' is-collapsed')}>
    <a className="skip-link" href="#workspace-content">Skip to content</a>
    <div className="desktop-sidebar"><Sidebar isOpen={sidebarOpen} isMobile={false} /></div>
    <Navbar sidebarOpen={sidebarOpen} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} onMobileDrawerToggle={() => setMobileOpen(true)} mobileDrawerOpen={mobileOpen} />
    <Dialog open={mobileOpen} onClose={() => setMobileOpen(false)} label="Navigation" className="navigation-dialog"><button className="drawer-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={19} /></button><Sidebar isOpen isMobile onClose={() => setMobileOpen(false)} /></Dialog>
    <main className="workspace-content" id="workspace-content" tabIndex={-1}>{children}<footer className="workspace-footer"><span>KVK Arena <span className="footer-dot">/</span> Management suite</span><span>One workspace. Every operation.</span></footer></main>
  </div>;
}
