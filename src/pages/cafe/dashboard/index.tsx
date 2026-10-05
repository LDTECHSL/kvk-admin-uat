import { useEffect, useState } from "react";
import {
  Coffee,
  Croissant,
  Wallet,
  Receipt,
  TrendingUp,
  LineChart as LineChartIcon,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getCafeDashboard } from "@/services/cafe-api";

type DashboardData = {
  totalCoffeeItems: number;
  totalBreakfastItems: number;
  todaysRevenue: number;
  todaysTransactions: number;
  monthlyRevenue: { month: string; revenue: number }[];
  dailyRevenue: { day: string; revenue: number }[];
};

const formatLkr = (amount: number) =>
  `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  gradient: string;
}) {
  return (
    <div className="metric-card group">
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-125 ${gradient}`}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
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

export default function CafeDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getCafeDashboard();

      const payload =
        response?.additionalData?.response ?? response?.response ?? response ?? null;

      if (!payload) {
        setError("Failed to load dashboard.");
        setData(null);
        return;
      }

      setData({
        totalCoffeeItems: payload.totalCoffeeItems ?? 0,
        totalBreakfastItems: payload.totalBreakfastItems ?? 0,
        todaysRevenue: payload.todaysRevenue ?? 0,
        todaysTransactions: payload.todaysTransactions ?? 0,
        monthlyRevenue: Array.isArray(payload.monthlyRevenue) ? payload.monthlyRevenue : [],
        dailyRevenue: Array.isArray(payload.dailyRevenue) ? payload.dailyRevenue : [],
      });
    } catch {
      setError("Failed to load dashboard.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-blue-700" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="page-container">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="page-container">
      <div className="space-y-6">
        <div>
          <h1 className="page-heading">
            Cafe Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of menu items, transactions, and revenue
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Coffee}
            label="Coffee Items"
            value={data.totalCoffeeItems}
            gradient="bg-amber-600"
          />
          <StatCard
            icon={Croissant}
            label="Breakfast Items"
            value={data.totalBreakfastItems}
            gradient="bg-orange-500"
          />
          <StatCard
            icon={Wallet}
            label="Today's Revenue"
            value={formatLkr(data.todaysRevenue)}
            gradient="bg-emerald-600"
          />
          <StatCard
            icon={Receipt}
            label="Today's Transactions"
            value={data.todaysTransactions}
            gradient="bg-blue-600"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="surface-panel rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-700" />
              <h3 className="text-sm font-semibold text-gray-900">
                Monthly Revenue Comparison
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.monthlyRevenue} margin={{ left: 8, right: 8 }}>
                <defs>
                  <linearGradient id="cafeBarGradient" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#cafeBarGradient)"
                  radius={[8, 8, 0, 0]}
                  animationDuration={1100}
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
                Daily Revenue (Last 14 Days)
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.dailyRevenue} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
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
                  activeDot={{ r: 5 }}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
