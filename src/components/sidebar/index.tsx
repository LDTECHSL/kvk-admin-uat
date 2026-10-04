import { useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Settings,
  ChevronDown,
  ChevronsUpDown,
  Calendar,
  Gauge,
  LayoutGrid,
  Dumbbell,
  Car,
  Trophy,
  Gamepad2,
  Coffee,
  Scissors,
  Globe,
  Banknote,
  Users,
  UserCog,
  ClipboardList,
  Wrench,
  PackageCheck,
  UtensilsCrossed,
  CalendarDays,
  X,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose?: () => void;
}

interface NavSubitem {
  id: string;
  label: string;
  path: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path?: string;
  submenu: NavSubitem[] | null;
}

interface ModuleItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export default function Sidebar({ isOpen, isMobile, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const collapsed = !isOpen && !isMobile;

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isModulesOpen, setIsModulesOpen] = useState(false);

  const admin = localStorage.getItem("admin")
    ? JSON.parse(localStorage.getItem("admin") as string)
    : null;

const gymNavItems: NavItem[] = [
  {
    id: "gym-dashboard",
    label: "Dashboard",
    icon: Gauge,
    path: "/gym/dashboard",
    submenu: null,
  },
  {
    id: "gym-payments",
    label: "Payments",
    icon: Banknote,
    path: "/gym/payments",
    submenu: null,
  },
  {
    id: "gym-members",
    label: "Members",
    icon: Users,
    path: "/gym/members",
    submenu: null,
  },
  {
    id: "gym-trainers",
    label: "Trainers",
    icon: UserCog,
    path: "/gym/trainers",
    submenu: null,
  },
  {
    id: "gym-plans",
    label: "Membership Plans",
    icon: ClipboardList,
    path: "/gym/plans",
    submenu: null,
  }
];

const carWashNavItems: NavItem[] = [
  {
    id: "car-wash-dashboard",
    label: "Dashboard",
    icon: Gauge,
    path: "/car-wash/dashboard",
    submenu: null,
  },
  {
    id: "car-wash-payments",
    label: "Payments",
    icon: Banknote,
    path: "/car-wash/payments",
    submenu: null,
  },
  {
    id: "car-wash-services",
    label: "Services",
    icon: Wrench,
    path: "/car-wash/services",
    submenu: null,
  },
  {
    id: "car-wash-packages",
    label: "Packages",
    icon: PackageCheck,
    path: "/car-wash/packages",
    submenu: null,
  }
];

const cafeNavItems: NavItem[] = [
  {
    id: "cafe-dashboard",
    label: "Dashboard",
    icon: Gauge,
    path: "/cafe/dashboard",
    submenu: null,
  },
  {
    id: "cafe-payments",
    label: "Payments",
    icon: Banknote,
    path: "/cafe/payments",
    submenu: null,
  },
  {
    id: "cafe-menu",
    label: "Menu",
    icon: UtensilsCrossed,
    path: "/cafe/menu",
    submenu: null,
  }
];

const badmintonNavItems: NavItem[] = [
  {
    id: "badminton-dashboard",
    label: "Dashboard",
    icon: Gauge,
    path: "/badminton/dashboard",
    submenu: null,
  },
  {
    id: "badminton-payments",
    label: "Payments",
    icon: Banknote,
    path: "/badminton/payments",
    submenu: null,
  },
  {
    id: "badminton-courts",
    label: "Courts",
    icon: Trophy,
    path: "/badminton/courts",
    submenu: null,
  }
];

const gamingNavItems: NavItem[] = [
  {
    id: "gaming-dashboard",
    label: "Dashboard",
    icon: Gauge,
    path: "/gaming/dashboard",
    submenu: null,
  },
  {
    id: "gaming-payments",
    label: "Payments",
    icon: Banknote,
    path: "/gaming/payments",
    submenu: null,
  },
  {
    id: "gaming-games",
    label: "Games",
    icon: Gamepad2,
    path: "/gaming/games",
    submenu: null,
  },
  {
    id: "gaming-settings",
    label: "Settings",
    icon: Settings,
    path: "/gaming/settings",
    submenu: null,
  }
];

const salonNavItems: NavItem[] = [
  {
    id: "salon-dashboard",
    label: "Dashboard",
    icon: Gauge,
    path: "/salon/dashboard",
    submenu: null,
  },
  {
    id: "salon-payments",
    label: "Payments",
    icon: Banknote,
    path: "/salon/payments",
    submenu: null,
  },
  {
    id: "salon-services",
    label: "Services",
    icon: Scissors,
    path: "/salon/services",
    submenu: null,
  },
  {
    id: "salon-settings",
    label: "Settings",
    icon: Settings,
    path: "/salon/settings",
    submenu: null,
  }
];

const mainNavItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Gauge,
    path: "/main/dashboard",
    submenu: null,
  },
  {
    id: "memberships",
    label: "Memberships",
    icon: Calendar,
    path: "/main/memberships",
    submenu: null,
  },
  {
    id: "staff",
    label: "Staff",
    icon: Users,
    path: "/main/staff",
    submenu: null,
  },
  {
    id: "holidays",
    label: "Holidays",
    icon: CalendarDays,
    path: "/main/holidays",
    submenu: null,
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/main/settings",
    submenu: null,
  },
];

  const modules: ModuleItem[] = [
    {
      id: "main",
      label: "MAIN",
      icon: Globe,
      path: "/main",
    },
    {
      id: "gym",
      label: "GYM",
      icon: Dumbbell,
      path: "/gym",
    },
    {
      id: "car-wash",
      label: "CAR WASH",
      icon: Car,
      path: "/car-wash",
    },
    {
      id: "badminton",
      label: "BADMINTON",
      icon: Trophy,
      path: "/badminton",
    },
    {
      id: "gaming",
      label: "GAMING",
      icon: Gamepad2,
      path: "/gaming",
    },
    {
      id: "cafe",
      label: "CAFE",
      icon: Coffee,
      path: "/cafe",
    },
    {
      id: "salon",
      label: "SALON",
      icon: Scissors,
      path: "/salon",
    },
  ];

  const toggleMenu = (id: string) => {
    setOpenMenu((prev) => (prev === id ? null : id));
  };

  const handleNavigation = (path: string) => {
    navigate(path);

    if (isMobile && onClose) {
      onClose();
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const isParentActive = (item: NavItem) => {
    return item.submenu?.some((subitem) => isActive(subitem.path)) ?? false;
  };

  const isModuleActive = modules.some(
    (module) =>
      location.pathname === module.path ||
      location.pathname.startsWith(`${module.path}/`),
  );

  if (isMobile && !isOpen) {
    return null;
  }

  const selectedModule =
    modules.find(
      (module) =>
        location.pathname === module.path ||
        location.pathname.startsWith(`${module.path}/`),
    ) ?? null;

    const currentNavItems: NavItem[] = (() => {
  switch (selectedModule?.id) {
    case "gym":
      return gymNavItems;

    case "main":
      return mainNavItems;

    case "car-wash":
      return carWashNavItems;

    case "cafe":
      return cafeNavItems;

    case "badminton":
      return badmintonNavItems;

    case "gaming":
      return gamingNavItems;

    case "salon":
      return salonNavItems;

    default:
      return mainNavItems;
  }
})();

  return (
    <>
    <aside
      className={`${
        isMobile ? "fixed inset-y-0 left-0 z-40" : "relative"
      } h-full w-full overflow-y-auto border-r border-gray-200 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.03)] transition-all duration-300 ease-in-out ${
        isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : ""
      } scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300`}
    >
      <div className="flex h-full flex-col">
        {/* Brand Header */}
        <div className="relative px-4 pb-4 pt-4">
          <div className="flex items-center gap-3">
            <div className="sidebar-badge-pulse flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-md shadow-blue-900/20 transition-transform duration-300 hover:scale-105">
              <span className="text-xs font-extrabold tracking-wide">KVK</span>
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900">
                  KVK Arena
                </p>
                <p className="text-xs font-medium text-gray-400">Admin Panel</p>
              </div>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-3">
          {/* Modules */}
          <div className="mb-4">
            <button
              onClick={() => !collapsed && setIsModulesOpen(!isModulesOpen)}
              className={`group relative w-full overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer
      ${
        isModuleActive
          ? "border-blue-200 bg-gradient-to-r from-blue-50 via-blue-50/60 to-transparent shadow-sm"
          : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-blue-300 hover:bg-gray-50 hover:shadow-sm"
      }
      ${collapsed ? "p-2 flex justify-center" : "px-4 py-3"}
    `}
            >
              {isModuleActive && !collapsed && (
                <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-blue-700" />
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300
          ${
            isModuleActive
              ? "bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-md shadow-blue-900/20"
              : "bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-700"
          }`}
                  >
                    {selectedModule ? (
                      <selectedModule.icon size={18} />
                    ) : (
                      <LayoutGrid size={18} />
                    )}
                  </div>

                  {!collapsed && (
                    <div className="text-left">
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">
                          {selectedModule?.label ?? "Modules"}
                        </p>

                        <p className="text-xs text-gray-500">
                          {selectedModule
                            ? "Current module"
                            : "Select a service module"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {!collapsed && (
                  <ChevronsUpDown
                    size={16}
                    className="text-gray-400 transition-transform duration-300 group-hover:scale-110"
                  />
                )}
              </div>
            </button>

            {!collapsed && isModuleActive && (
              <p className="mt-1.5 px-2 text-[11px] font-medium text-blue-900">
                A module page is currently active
              </p>
            )}
          </div>

          {/* Main navigation separator */}
          {!collapsed && (
            <div className="mb-2 flex items-center gap-2 px-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">
                {selectedModule?.label || "Main"} Menu
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
            </div>
          )}

          {currentNavItems.map((item, index) => {
            const Icon = item.icon;

            const active = item.submenu
              ? isParentActive(item)
              : isActive(item.path || "");

            const submenuOpen = openMenu === item.id;

            const btnBase = `group flex w-full cursor-pointer items-center ${
              collapsed ? "justify-center px-2" : "justify-between px-3"
            } rounded-xl py-2 transition-all duration-300`;

            const iconWrapper = `${
              active
                ? "bg-white/15 text-white"
                : "bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-700"
            } flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300`;

            return (
              <div
                key={item.id}
                className="sidebar-item-animate"
                style={{ animationDelay: `${index * 35}ms` }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (item.submenu) {
                      toggleMenu(item.id);
                    } else if (item.path) {
                      handleNavigation(item.path);
                    }
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`${btnBase} ${
                    active && !collapsed
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/25"
                      : "text-gray-700 hover:translate-x-0.5 hover:bg-blue-50/70"
                  }`}
                >
                  <div
                    className={`flex items-center gap-3 ${
                      collapsed ? "justify-center" : ""
                    }`}
                  >
                    <span className={iconWrapper}>
                      <Icon size={16} />
                    </span>

                    {!collapsed && (
                      <span
                        className={`text-sm transition-colors duration-300 ${
                          active ? "font-semibold text-white" : "text-gray-700"
                        }`}
                      >
                        {item.label}
                      </span>
                    )}
                  </div>

                  {!collapsed && item.submenu && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-300 ${
                        active ? "text-white/80" : "text-gray-400"
                      } ${submenuOpen ? "rotate-180" : ""}`}
                    />
                  )}
                </button>

                {/* Normal Submenu */}
                {item.submenu && submenuOpen && !collapsed && (
                  <div className="ml-11 mt-1 space-y-1">
                    {item.submenu.map((subitem) => (
                      <button
                        type="button"
                        key={subitem.id}
                        onClick={() => handleNavigation(subitem.path)}
                        className={`w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm transition-all duration-300 ${
                          isActive(subitem.path)
                            ? "bg-blue-50 font-medium text-blue-700"
                            : "text-gray-600 hover:translate-x-0.5 hover:bg-gray-50"
                        }`}
                      >
                        {subitem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto space-y-3 border-t border-gray-100 px-4 pb-4 pt-3">
          {!collapsed && (
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>System online</span>
            </div>
          )}

          {!collapsed && (
            <div className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-semibold text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                {admin?.firstName?.charAt(0)}
                {admin?.lastName?.charAt(0)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {admin?.firstName} {admin?.lastName}
                </p>
                <p className="truncate text-xs text-gray-500">{admin?.email}</p>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="flex justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-semibold text-white shadow-sm transition-transform duration-300 hover:scale-105">
                {admin?.firstName?.charAt(0)}
                {admin?.lastName?.charAt(0)}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>

    {isModulesOpen &&
      createPortal(
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsModulesOpen(false);
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Switch Module</h2>
                <p className="text-sm text-gray-500">
                  Select a business module to manage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModulesOpen(false)}
                className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-3">
              {modules.map((module) => {
                const ModuleIcon = module.icon;

                const active =
                  location.pathname === module.path ||
                  location.pathname.startsWith(`${module.path}/`);

                return (
                  <button
                    type="button"
                    key={module.id}
                    onClick={() => {
                      handleNavigation(module.path);
                      setIsModulesOpen(false);
                    }}
                    className={`group flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                      active
                        ? "border-blue-700 bg-blue-900 text-white shadow-sm"
                        : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
                    }`}
                  >
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${
                        active
                          ? "bg-white/15 text-white"
                          : "bg-blue-50 text-blue-900 group-hover:bg-blue-100"
                      }`}
                    >
                      <ModuleIcon size={22} />
                    </span>

                    <span
                      className={`text-sm font-medium ${
                        active ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {module.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
