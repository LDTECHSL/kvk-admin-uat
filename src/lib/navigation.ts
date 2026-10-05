import { LayoutDashboard, Users, UserCog, CalendarDays, Settings, Ticket, Dumbbell, Car, Trophy, Gamepad2, Coffee, Scissors, CreditCard, ClipboardList, Wrench, Package, UtensilsCrossed, type LucideIcon } from 'lucide-react';

export type NavLink = { label: string; path: string; icon: LucideIcon };
export type NavModule = { label: string; path: string; icon: LucideIcon; color: string; links: NavLink[] };
export const workspaceLinks: NavLink[] = [
  { label: 'Overview', path: '/main/dashboard', icon: LayoutDashboard },
  { label: 'Memberships', path: '/main/memberships', icon: Users },
  { label: 'Coupons', path: '/main/memberships/coupons', icon: Ticket },
  { label: 'Team & access', path: '/main/staff', icon: UserCog },
  { label: 'Holiday calendar', path: '/main/holidays', icon: CalendarDays },
];
const link = (base: string, slug: string, label: string, icon: LucideIcon): NavLink => ({ path: '/' + base + '/' + slug, label, icon });
const core = (base: string) => [link(base, 'dashboard', 'Overview', LayoutDashboard), link(base, 'payments', 'Payments', CreditCard)];
export const modules: NavModule[] = [
  { label: 'Gym', path: '/gym', icon: Dumbbell, color: '#7299ff', links: [...core('gym'), link('gym', 'members', 'Members', Users), link('gym', 'trainers', 'Trainers', UserCog), link('gym', 'plans', 'Membership plans', ClipboardList)] },
  { label: 'Car Wash', path: '/car-wash', icon: Car, color: '#67c8dc', links: [...core('car-wash'), link('car-wash', 'services', 'Services', Wrench), link('car-wash', 'packages', 'Packages', Package)] },
  { label: 'Badminton', path: '/badminton', icon: Trophy, color: '#c5abff', links: [...core('badminton'), link('badminton', 'courts', 'Courts', Trophy)] },
  { label: 'Gaming', path: '/gaming', icon: Gamepad2, color: '#7ed5b7', links: [...core('gaming'), link('gaming', 'games', 'Games', Gamepad2), link('gaming', 'settings', 'Station settings', Settings)] },
  { label: 'Cafe', path: '/cafe', icon: Coffee, color: '#efbd83', links: [...core('cafe'), link('cafe', 'menu', 'Menu', UtensilsCrossed)] },
  { label: 'Salon', path: '/salon', icon: Scissors, color: '#f2a9c2', links: [...core('salon'), link('salon', 'services', 'Services', Scissors), link('salon', 'settings', 'Business hours', CalendarDays)] },
];
export const settingsLink: NavLink = { label: 'Account settings', path: '/main/settings', icon: Settings };
export const searchableLinks = [...workspaceLinks.map(item => ({ ...item, group: 'Workspace' })), ...modules.flatMap(module => module.links.map(item => ({ ...item, group: module.label }))), { ...settingsLink, group: 'Workspace' }];
export function getPageInfo(path: string) {
  return searchableLinks.find(item => item.path === path) ?? { label: 'Overview', group: 'Workspace' };
}
