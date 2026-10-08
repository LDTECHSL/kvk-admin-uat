import { useFeedbackState } from "@/lib/use-feedback-state";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  RefreshCw,
  Users,
  LayoutGrid,
  Wallet,
  Crown,
  TrendingUp,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  CalendarDays,
  Store,
  X,
  ExternalLink,
  Dumbbell,
  Car,
  Coffee,
  Trophy,
  Gamepad2,
  Scissors,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getEnv } from "@/env";
import { getGymDashboard } from "@/services/gym-dashboard-api";
import { getCarWashDashboard } from "@/services/car-wash-api";
import { getCafeDashboard } from "@/services/cafe-api";
import { getBadmintonDashboard } from "@/services/badminton-api";
import { getGamingDashboard } from "@/services/gaming-api";
import { getSalonDashboard } from "@/services/salon-api";
import { getStaffMembers } from "@/services/staff-api";
import { getHolidays } from "@/services/holidays-api";

type ModuleKey = "gym" | "carWash" | "cafe" | "badminton" | "gaming" | "salon";

type RevenuePoint = { month: string; revenue: number };

type ModuleData = {
  todaysRevenue: number;
  monthlyRevenue: RevenuePoint[];
};

const MODULE_META: Record<ModuleKey, { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  gym: { label: "Gym", color: "#2563eb", icon: Dumbbell },
  carWash: { label: "Car Wash", color: "#f59e0b", icon: Car },
  cafe: { label: "Cafe", color: "#f97316", icon: Coffee },
  badminton: { label: "Badminton", color: "#8b5cf6", icon: Trophy },
  gaming: { label: "Gaming", color: "#10b981", icon: Gamepad2 },
  salon: { label: "Salon", color: "#ec4899", icon: Scissors },
};

const MODULE_ORDER: ModuleKey[] = ["gym", "carWash", "cafe", "badminton", "gaming", "salon"];

const emptyModuleData: ModuleData = { todaysRevenue: 0, monthlyRevenue: [] };

const unwrap = (response: any) =>
  response?.additionalData?.response ?? response?.response ?? response ?? null;

const formatLkr = (amount: number) =>
  `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

type Holiday = {
  id: string;
  date: Date;
  description: string;
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  gradient,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  gradient: string;
}) {
  return (
    <div className="metric-card group">
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-125 ${gradient}`}
      />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="mt-0.5 truncate text-xs text-gray-400">{sub}</p>}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${gradient}`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useFeedbackState<string>("", "error");

  const [staffCount, setStaffCount] = useState(0);
  const [moduleData, setModuleData] = useState<Record<ModuleKey, ModuleData>>({
    gym: emptyModuleData,
    carWash: emptyModuleData,
    cafe: emptyModuleData,
    badminton: emptyModuleData,
    gaming: emptyModuleData,
    salon: emptyModuleData,
  });
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isCashierModalOpen, setIsCashierModalOpen] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [gym, carWash, cafe, badminton, gaming, salon, staff, holidaysThisYear, holidaysNextYear] =
        await Promise.allSettled([
          getGymDashboard(),
          getCarWashDashboard(),
          getCafeDashboard(),
          getBadmintonDashboard(),
          getGamingDashboard(),
          getSalonDashboard(),
          getStaffMembers(),
          getHolidays(new Date().getFullYear()),
          getHolidays(new Date().getFullYear() + 1),
        ]);

      const extractModule = (settled: PromiseSettledResult<any>): ModuleData => {
        if (settled.status !== "fulfilled") return emptyModuleData;
        const payload = unwrap(settled.value);
        if (!payload) return emptyModuleData;
        return {
          todaysRevenue: Number(payload.todaysRevenue ?? 0),
          monthlyRevenue: Array.isArray(payload.monthlyRevenue) ? payload.monthlyRevenue : [],
        };
      };

      setModuleData({
        gym: extractModule(gym),
        carWash: extractModule(carWash),
        cafe: extractModule(cafe),
        badminton: extractModule(badminton),
        gaming: extractModule(gaming),
        salon: extractModule(salon),
      });

      if (staff.status === "fulfilled") {
        const staffRows = Array.isArray(staff.value)
          ? staff.value
          : Array.isArray(staff.value?.response)
            ? staff.value.response
            : [];
        setStaffCount(staffRows.length);
      } else {
        setStaffCount(0);
      }

      const holidayRows: any[] = [];
      for (const settled of [holidaysThisYear, holidaysNextYear]) {
        if (settled.status === "fulfilled" && Array.isArray(settled.value)) {
          holidayRows.push(...settled.value);
        } else if (settled.status === "fulfilled" && Array.isArray(settled.value?.response)) {
          holidayRows.push(...settled.value.response);
        }
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const parsedHolidays: Holiday[] = holidayRows
        .map((h: any) => {
          const date = new Date(`${h.year}-${h.month}-${h.day}T00:00:00`);
          return {
            id: h.id ?? `${h.year}-${h.month}-${h.day}`,
            date,
            description: h.description || "Holiday",
          };
        })
        .filter((h) => !Number.isNaN(h.date.getTime()) && h.date >= today)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 7);

      setHolidays(parsedHolidays);
    } catch {
      setError("Failed to load dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  const todaysRevenueTotal = MODULE_ORDER.reduce(
    (sum, key) => sum + moduleData[key].todaysRevenue,
    0,
  );

  const highestRevenueModule = MODULE_ORDER.reduce<ModuleKey>((highest, key) =>
    moduleData[key].todaysRevenue > moduleData[highest].todaysRevenue ? key : highest,
    "gym",
  );

  const monthCount = Math.max(...MODULE_ORDER.map((key) => moduleData[key].monthlyRevenue.length), 0);
  const combinedMonthlyRevenue: RevenuePoint[] = Array.from({ length: monthCount }).map((_, index) => {
    let label = "";
    let total = 0;
    for (const key of MODULE_ORDER) {
      const point = moduleData[key].monthlyRevenue[index];
      if (point) {
        total += Number(point.revenue ?? 0);
        label = point.month;
      }
    }
    return { month: label, revenue: total };
  });

  const pieData = MODULE_ORDER.map((key) => {
    const arr = moduleData[key].monthlyRevenue;
    const thisMonth = arr.length > 0 ? Number(arr[arr.length - 1].revenue ?? 0) : 0;
    return { key, name: MODULE_META[key].label, value: thisMonth, color: MODULE_META[key].color };
  });
  const pieTotal = pieData.reduce((sum, p) => sum + p.value, 0);

  const { CASHIER_LINKS } = getEnv();

  const openCashierLink = (key: ModuleKey) => {
    const url = (CASHIER_LINKS as any)?.[key];
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading" role="status" aria-label="Loading workspace overview"><span className="sr-only">Loading dashboard...</span><div className="skeleton h-9 w-72 mb-3" /><div className="skeleton h-4 w-48 mb-8" /><div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{[0,1,2,3].map(key => <div key={key} className="skeleton h-32" />)}</div><div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6"><div className="skeleton h-80" /><div className="skeleton h-80" /></div></div>
    );
  }

  return (
    <div className="page-container">
      <div className="space-y-6">
        <div className="overview-intro">
          <div>
            <p className="eyebrow">WORKSPACE OVERVIEW</p>
            <h1>Your arena, at a glance.</h1>
            <p>{new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Colombo' }).format(new Date())} <span className="mx-2 text-slate-300">/</span> A clear view across all six experiences.</p>
          </div>
          <div className="overview-actions"><button type="button" className="action-secondary" onClick={loadAll}><RefreshCw size={14} />Refresh</button><button type="button" className="action-primary" onClick={() => setIsCashierModalOpen(true)}><Store size={15} />Open cashiers<ArrowUpRight size={14} /></button></div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Team members" value={staffCount} gradient="bg-blue-600" />
          <StatCard
            icon={LayoutGrid}
            label="Business modules"
            value={MODULE_ORDER.length}
            gradient="bg-violet-600"
          />
          <StatCard
            icon={Wallet}
            label="Total revenue today"
            value={formatLkr(todaysRevenueTotal)}
            gradient="bg-emerald-600"
          />
          <StatCard
            icon={Crown}
            label="Top-performing module"
            value={MODULE_META[highestRevenueModule].label}
            sub={formatLkr(moduleData[highestRevenueModule].todaysRevenue)}
            gradient="bg-amber-500"
          />
        </div>

        <div className="overview-module-grid" aria-label="Business modules">
          {MODULE_ORDER.map(key => {
            const meta = MODULE_META[key];
            const Icon = meta.icon;
            return <Link key={key} to={'/' + (key === 'carWash' ? 'car-wash' : key) + '/dashboard'} className="overview-module">
              <div><span style={{ color: meta.color }}><Icon size={19} /></span><ArrowUpRight size={14} /></div><strong>{meta.label}</strong><small>Today's revenue</small><p>{formatLkr(moduleData[key].todaysRevenue)}</p>
            </Link>;
          })}
        </div>

        {/* Charts: Bar + Line (combined monthly revenue) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="surface-panel rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-700" />
              <h3 className="text-sm font-semibold text-gray-900">
                Revenue performance
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={combinedMonthlyRevenue} margin={{ left: 8, right: 8 }}>
                <defs>
                  <linearGradient id="mainBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(37,99,235,0.06)" }}
                  formatter={(value) => [formatLkr(Number(value)), "Revenue"] as [string, string]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 13 }}
                />
                <Bar
                  dataKey="revenue"
                  fill="url(#mainBarGradient)"
                  radius={[8, 8, 0, 0]}
                  animationDuration={1200}
                  animationEasing="ease-out"
                  maxBarSize={56}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="surface-panel rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="mb-2 flex items-center gap-2">
              <LineChartIcon size={16} className="text-emerald-700" />
              <h3 className="text-sm font-semibold text-gray-900">
                Revenue trend
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={combinedMonthlyRevenue} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                />
                <Tooltip
                  formatter={(value) => [formatLkr(Number(value)), "Revenue"] as [string, string]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 13 }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  animationDuration={1300}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Holidays + Pie chart */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="surface-panel rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays size={16} className="text-blue-700" />
              <h3 className="text-sm font-semibold text-gray-900">Upcoming Holidays</h3>
            </div>

            {holidays.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                No upcoming holidays found.
              </p>
            ) : (
              <div className="space-y-2">
                {holidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 transition-all duration-300 hover:bg-blue-50/60"
                  >
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-blue-700 text-white">
                      <span className="text-[10px] font-semibold uppercase leading-none">
                        {holiday.date.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-base font-bold leading-none">
                        {holiday.date.getDate()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {holiday.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {holiday.date.toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="surface-panel rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="mb-2 flex items-center gap-2">
              <PieChartIcon size={16} className="text-violet-700" />
              <h3 className="text-sm font-semibold text-gray-900">
                Module-wise Revenue (This Month)
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={pieTotal > 0 ? 3 : 0}
                  animationDuration={1200}
                  animationEasing="ease-out"
                  stroke="none"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatLkr(Number(value)), "Revenue"] as [string, string]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 13 }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: "#4b5563" }}
                />
              </PieChart>
            </ResponsiveContainer>
            {pieTotal === 0 && (
              <p className="mt-1 text-center text-xs text-gray-400">No revenue recorded yet this month</p>
            )}
          </div>
        </div>
      </div>

      {isCashierModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsCashierModalOpen(false);
            }}
          >
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Cashier Systems</h2>
                  <p className="text-sm text-gray-500">
                    Open a module's cashier system in a new tab.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCashierModalOpen(false)}
                  className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-3">
                {MODULE_ORDER.map((key) => {
                  const meta = MODULE_META[key];
                  const Icon = meta.icon;
                  const hasLink = Boolean((CASHIER_LINKS as any)?.[key]);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => openCashierLink(key)}
                      disabled={!hasLink}
                      title={hasLink ? `Open ${meta.label} cashier` : "Link not configured"}
                      className="action-secondary group flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center transition-all duration-300 hover:border-blue-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                    >
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: meta.color }}
                      >
                        <Icon size={22} />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{meta.label}</span>
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <ExternalLink size={10} />
                        {hasLink ? "Open" : "Not configured"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
