import { useLocation, useNavigate } from "react-router-dom";
import {
  Settings,
  ChevronDown,
  Calendar,
  Gauge,
  LayoutGrid,
  Dumbbell,
  Car,
  Trophy,
  Gamepad2,
  Coffee,
  ShoppingBag,
  Globe,
  Banknote,
  Users,
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
      id: "retail",
      label: "RETAIL",
      icon: ShoppingBag,
      path: "/retail",
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

    // Future modules
    case "badminton":
      // return badmintonNavItems;

    case "gaming":
      // return gamingNavItems;

    case "car-wash":
      // return carWashNavItems;

    case "cafe":
      // return cafeNavItems;

    case "retail":
      // return retailNavItems;

    default:
      return mainNavItems;
  }
})();

  return (
    <aside
      className={`${
        isMobile ? "fixed inset-y-0 left-0 z-40" : "relative"
      } h-full w-full overflow-y-auto border-r border-gray-200 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.03)] transition-all duration-300 ease-in-out ${
        isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : ""
      } scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300`}
    >
      <div className="flex h-full flex-col">
        {/* Brand Header */}
        <div className="border-b border-gray-100 px-4 pb-3 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-900 text-white shadow-sm">
              <span className="text-xs font-bold">KVK</span>
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  KVK Arena
                </p>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-3">
          {/* Modules */}
          <div className="mb-4">
            <button
              onClick={() => !collapsed && setIsModulesOpen(!isModulesOpen)}
              className={`w-full rounded-xl border-gray-200 transition-all duration-200 cursor-pointer
      ${
        isModuleActive
          ? "bg-blue-50"
          : "border-gray-200 bg-white hover:border-blue-900 hover:bg-gray-50"
      }
      ${collapsed ? "p-2 flex justify-center" : "px-4 py-3"}
    `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg
          ${
            isModuleActive
              ? "bg-blue-100 text-blue-900"
              : "bg-gray-100 text-gray-600"
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
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform duration-200 ${
                      isModulesOpen ? "rotate-180" : ""
                    }`}
                  />
                )}
              </div>
            </button>

            {!collapsed && isModulesOpen && (
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2">
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
                        handleNavigation(module.path)
                        setIsModulesOpen(false)
                      }}
                      className={`group flex cursor-pointer flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all duration-150 ${
                        active
                          ? "border-blue-300 bg-blue-900 text-white shadow-sm"
                          : "border-gray-200 bg-white text-gray-700 hover:border-blue-900 hover:bg-blue-50"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          active
                            ? "bg-white/15 text-white"
                            : "bg-blue-50 text-blue-900 group-hover:bg-blue-100"
                        }`}
                      >
                        <ModuleIcon size={16} />
                      </span>

                      <span
                        className={`text-[11px] font-semibold tracking-wide ${
                          active ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {module.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {!collapsed && !isModulesOpen && isModuleActive && (
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
              <div className="h-px flex-1 bg-gray-200" />
            </div>
          )}

          {currentNavItems.map((item) => {
            const Icon = item.icon;

            const active = item.submenu
              ? isParentActive(item)
              : isActive(item.path || "");

            const submenuOpen = openMenu === item.id;

            const btnBase = `flex w-full cursor-pointer items-center ${
              collapsed ? "justify-center px-2" : "justify-between px-3"
            } rounded-xl py-1.5 transition-colors duration-150`;

            const iconWrapper = `${
              active ? "bg-blue-900 text-white" : "bg-transparent text-gray-400"
            } flex h-8 w-8 items-center justify-center rounded-lg transition`;

            return (
              <div key={item.id}>
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
                      ? "bg-blue-50 text-blue-900 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50"
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
                        className={`text-sm ${
                          active
                            ? "font-semibold text-blue-700"
                            : "text-gray-700"
                        }`}
                      >
                        {item.label}
                      </span>
                    )}
                  </div>

                  {!collapsed && item.submenu && (
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform ${
                        submenuOpen ? "rotate-180" : ""
                      }`}
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
                        className={`w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm transition ${
                          isActive(subitem.path)
                            ? "bg-blue-50 font-medium text-blue-700"
                            : "text-gray-600 hover:bg-gray-50"
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
            <div className="flex items-center gap-2 text-xs text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>System online</span>
            </div>
          )}

          {!collapsed && (
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 shadow-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
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
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                {admin?.firstName?.charAt(0)}
                {admin?.lastName?.charAt(0)}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
