import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCog,
  ClipboardList,
  Wallet,
  Ban,
  ChevronRight,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getGymDashboard } from "@/services/gym-dashboard-api";
import {
  reactivateMember,
  permanentlyDeleteMember,
} from "@/services/gym-members-api";

type PersonSummary = {
  id: string;
  name: string;
  membershipNumber: string;
  membershipStatus: string;
  isDeleted: boolean;
  deletedAt: string | null;
  membershipPlanTitle: string | null;
};

type DashboardData = {
  totalMembers: number;
  totalTrainers: number;
  totalMembershipPlans: number;
  todaysRevenue: number;
  monthlyRevenue: { month: string; revenue: number }[];
  activeCount: number;
  blockedCount: number;
  recentBlockedMembers: PersonSummary[];
  recentBlockedTrainers: PersonSummary[];
  deletedMembers: PersonSummary[];
  deletedTrainers: PersonSummary[];
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
  iconColor,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  gradient: string;
  iconColor: string;
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
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${gradient} ${iconColor} shadow-sm`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function PersonListCard({
  title,
  icon: Icon,
  iconColor,
  people,
  emptyLabel,
  onSeeMore,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
  people: PersonSummary[];
  emptyLabel: string;
  onSeeMore: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Icon size={16} className={iconColor} />
          {title}
        </h3>
        <button
          type="button"
          onClick={onSeeMore}
          className="flex cursor-pointer items-center gap-1 text-xs font-medium text-blue-700 transition hover:underline"
        >
          See more
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {people.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-500">
            {emptyLabel}
          </div>
        ) : (
          people.map((person) => (
            <div
              key={person.id}
              className="flex items-center justify-between px-5 py-3 transition-colors duration-200 hover:bg-gray-50/80"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-gray-900">
                  {person.name}
                </div>
                <div className="text-xs text-gray-500">
                  {person.membershipNumber}
                  {person.membershipPlanTitle ? ` · ${person.membershipPlanTitle}` : ""}
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                Blocked
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function GymDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<
    { type: "reactivate" | "delete"; kind: "Member" | "Trainer"; person: PersonSummary } | null
  >(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getGymDashboard();

      const payload =
        response?.additionalData?.response ?? response?.response ?? response ?? null;

      if (!payload) {
        setError("Failed to load dashboard.");
        setData(null);
        return;
      }

      setData({
        totalMembers: payload.totalMembers ?? 0,
        totalTrainers: payload.totalTrainers ?? 0,
        totalMembershipPlans: payload.totalMembershipPlans ?? 0,
        todaysRevenue: payload.todaysRevenue ?? 0,
        monthlyRevenue: Array.isArray(payload.monthlyRevenue) ? payload.monthlyRevenue : [],
        activeCount: payload.activeCount ?? 0,
        blockedCount: payload.blockedCount ?? 0,
        recentBlockedMembers: Array.isArray(payload.recentBlockedMembers)
          ? payload.recentBlockedMembers
          : [],
        recentBlockedTrainers: Array.isArray(payload.recentBlockedTrainers)
          ? payload.recentBlockedTrainers
          : [],
        deletedMembers: Array.isArray(payload.deletedMembers) ? payload.deletedMembers : [],
        deletedTrainers: Array.isArray(payload.deletedTrainers) ? payload.deletedTrainers : [],
      });
    } catch {
      setError("Failed to load dashboard.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivate = async (id: string) => {
    setActionError("");
    setBusyId(id);
    try {
      await reactivateMember(id);
      await loadDashboard();
    } catch {
      setActionError("Failed to reactivate. Please try again.");
    } finally {
      setBusyId(null);
      setConfirmModal(null);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    setActionError("");
    setBusyId(id);
    try {
      await permanentlyDeleteMember(id);
      await loadDashboard();
    } catch {
      setActionError("Failed to permanently delete. Please try again.");
    } finally {
      setBusyId(null);
      setConfirmModal(null);
    }
  };

  const pieData = data
    ? [
        { name: "Active", value: data.activeCount },
        { name: "Blocked", value: data.blockedCount },
      ]
    : [];

  const pieTotal = (data?.activeCount ?? 0) + (data?.blockedCount ?? 0);

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
            Gym Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of members, trainers, plans, and revenue
          </p>
        </div>

        {actionError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={UserCog}
            label="Trainers"
            value={data.totalTrainers}
            gradient="bg-blue-600"
            iconColor="text-white"
          />
          <StatCard
            icon={Users}
            label="Members"
            value={data.totalMembers}
            gradient="bg-emerald-600"
            iconColor="text-white"
          />
          <StatCard
            icon={ClipboardList}
            label="Membership Plans"
            value={data.totalMembershipPlans}
            gradient="bg-violet-600"
            iconColor="text-white"
          />
          <StatCard
            icon={Wallet}
            label="Today's Revenue"
            value={formatLkr(data.todaysRevenue)}
            gradient="bg-amber-500"
            iconColor="text-white"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="surface-panel rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md lg:col-span-2">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-700" />
              <h3 className="text-sm font-semibold text-gray-900">
                Monthly Revenue Comparison
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.monthlyRevenue} margin={{ left: 8, right: 8 }}>
                <defs>
                  <linearGradient id="revenueBarGradient" x1="0" y1="0" x2="0" y2="1">
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
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="url(#revenueBarGradient)"
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
              <Activity size={16} className="text-emerald-700" />
              <h3 className="text-sm font-semibold text-gray-900">Active vs Blocked</h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={pieTotal > 0 ? 4 : 0}
                  animationDuration={1100}
                  animationEasing="ease-out"
                  stroke="none"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: "#4b5563" }}
                />
              </PieChart>
            </ResponsiveContainer>
            {pieTotal === 0 && (
              <p className="mt-2 text-center text-xs text-gray-400">No data yet</p>
            )}
          </div>
        </div>

        {/* Blocked lists */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PersonListCard
            title="Blocked Members"
            icon={Ban}
            iconColor="text-red-500"
            people={data.recentBlockedMembers}
            emptyLabel="No blocked members"
            onSeeMore={() => navigate("/gym/members")}
          />
          <PersonListCard
            title="Blocked Trainers"
            icon={Ban}
            iconColor="text-red-500"
            people={data.recentBlockedTrainers}
            emptyLabel="No blocked trainers"
            onSeeMore={() => navigate("/gym/trainers")}
          />
        </div>

        {/* Soft-deleted lists */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {(
            [
              { label: "Deleted Members", kind: "Member" as const, list: data.deletedMembers },
              { label: "Deleted Trainers", kind: "Trainer" as const, list: data.deletedTrainers },
            ]
          ).map(({ label, kind, list }) => (
            <div
              key={kind}
              className="rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Trash2 size={16} className="text-gray-400" />
                  {label}
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {list.length}
                  </span>
                </h3>
              </div>

              <div className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
                {list.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-gray-500">
                    No soft-deleted {kind.toLowerCase()}s
                  </div>
                ) : (
                  list.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between gap-3 px-5 py-3 transition-colors duration-200 hover:bg-gray-50/80"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-gray-900">
                          {person.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {person.membershipNumber}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          title="Reactivate"
                          disabled={busyId === person.id}
                          onClick={() =>
                            setConfirmModal({ type: "reactivate", kind, person })
                          }
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-emerald-200 text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button
                          type="button"
                          title="Delete permanently"
                          disabled={busyId === person.id}
                          onClick={() => setConfirmModal({ type: "delete", kind, person })}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {confirmModal &&
        createPortal(
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && busyId !== confirmModal.person.id) {
                setConfirmModal(null);
              }
            }}
          >
            <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start gap-4 px-6 pt-6">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                    confirmModal.type === "delete"
                      ? "bg-red-50 text-red-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {confirmModal.type === "delete" ? (
                    <AlertTriangle size={20} />
                  ) : (
                    <RotateCcw size={20} />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {confirmModal.type === "delete"
                      ? `Delete ${confirmModal.kind}`
                      : `Reactivate ${confirmModal.kind}`}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {confirmModal.type === "delete"
                      ? `This permanently removes the ${confirmModal.kind.toLowerCase()} and their records. This cannot be undone.`
                      : `This ${confirmModal.kind.toLowerCase()} will be moved to Pending status, same as a newly registered ${confirmModal.kind.toLowerCase()}.`}
                  </p>
                </div>
              </div>

              <div className="mx-6 mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                <div className="font-medium text-gray-900">{confirmModal.person.name}</div>
                <div className="mt-0.5 text-gray-500">
                  {confirmModal.person.membershipNumber}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  disabled={busyId === confirmModal.person.id}
                  onClick={() => setConfirmModal(null)}
                  className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busyId === confirmModal.person.id}
                  onClick={() =>
                    confirmModal.type === "delete"
                      ? handlePermanentDelete(confirmModal.person.id)
                      : handleReactivate(confirmModal.person.id)
                  }
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60 ${
                    confirmModal.type === "delete"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {busyId === confirmModal.person.id && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  {confirmModal.type === "delete" ? "Delete" : "Reactivate"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
