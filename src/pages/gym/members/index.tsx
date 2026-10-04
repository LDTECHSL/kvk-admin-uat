import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Eye, RotateCcw, Trash2, X, AlertTriangle, Loader2 } from "lucide-react";
import {
  getMembers,
  reactivateMember,
  permanentlyDeleteMember,
} from "@/services/gym-members-api";

const paymentStatusLabel = (status: number) => {
  switch (status) {
    case 1:
      return "Pending";
    case 2:
      return "Paid";
    case 3:
      return "Overdue";
    case 4:
      return "Completed";
    case 5:
      return "Cancelled";
    default:
      return "Unknown";
  }
};

const MEMBERSHIP_STATUS_OPTIONS = ["Active", "Inactive", "Blocked", "Suspended"];
const PAYMENT_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "Pending" },
  { value: "2", label: "Paid" },
  { value: "3", label: "Overdue" },
  { value: "4", label: "Completed" },
  { value: "5", label: "Cancelled" },
];

const statusBadgeClasses = (member: { isDeleted: boolean; membershipStatus: string }) => {
  if (member.isDeleted) return "bg-red-50 text-red-700";

  const status = (member.membershipStatus || "").toLowerCase();
  if (status === "blocked" || status === "suspended") return "bg-red-50 text-red-700";
  if (status === "active") return "bg-emerald-50 text-emerald-700";
  return "bg-amber-50 text-amber-700";
};

export default function GymMembers() {
  const [tab, setTab] = useState<"active" | "deleted">("active");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMember, setViewMember] = useState<any | null>(null);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<
    { type: "reactivate" | "delete"; member: any } | null
  >(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getMembers(true);

      const rows =
        response?.additionalData?.response ??
        response?.response ??
        response ??
        [];

      const mapped = Array.isArray(rows)
        ? rows
            .filter((member: any) =>
              (member.membershipNumber ?? "").startsWith("GYM-MEM"),
            )
            .map((member: any) => ({
              id: member.id,
              name: `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim(),
              firstName: member.firstName ?? "",
              lastName: member.lastName ?? "",
              membershipNumber: member.membershipNumber ?? "",
              email: member.email ?? "",
              phoneNumber: member.phoneNumber ?? "",
              dateOfBirth: member.dateOfBirth ?? "",
              membershipStatus: member.membershipStatus ?? "",
              membershipPlanTitle: member.membershipPlanTitle ?? "",
              membershipPlanPrice: member.membershipPlanPrice ?? 0,
              paymentStatus: member.paymentStatus ?? 0,
              assignedTrainer: member.assignedTrainer ?? "",
              rewardPoints: member.rewardPoints ?? 0,
              isDeleted: !!member.isDeleted,
              deletedAt: member.deletedAt ?? null,
              createdDate: member.createdDate ?? null,
            }))
        : [];

      setMembers(mapped);
    } catch {
      setMembers([]);
      setError("Failed to load members.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchTerm, tab, statusFilter, planFilter, paymentFilter]);

  const tabFiltered = members.filter((member) =>
    tab === "deleted" ? member.isDeleted : !member.isDeleted,
  );

  const planOptions = Array.from(
    new Set(
      members
        .map((member) => member.membershipPlanTitle)
        .filter((title): title is string => !!title),
    ),
  ).sort();

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredMembers = tabFiltered.filter((member) => {
    if (statusFilter !== "all" && member.membershipStatus !== statusFilter) return false;
    if (planFilter !== "all" && member.membershipPlanTitle !== planFilter) return false;
    if (paymentFilter !== "all" && String(member.paymentStatus) !== paymentFilter) return false;

    if (!normalizedSearchTerm) return true;

    return [member.name, member.membershipNumber, member.email, member.phoneNumber]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchTerm);
  });

  const hasActiveFilters =
    statusFilter !== "all" || planFilter !== "all" || paymentFilter !== "all";

  const clearFilters = () => {
    setStatusFilter("all");
    setPlanFilter("all");
    setPaymentFilter("all");
  };

  const total = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = filteredMembers.slice(start, start + pageSize);

  const activeCount = members.filter((member) => !member.isDeleted).length;
  const deletedCount = members.filter((member) => member.isDeleted).length;

  const handleReactivate = async (id: string) => {
    setActionError("");
    setBusyId(id);
    try {
      await reactivateMember(id);
      await loadMembers();
    } catch {
      setActionError("Failed to reactivate member.");
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
      await loadMembers();
    } catch {
      setActionError("Failed to permanently delete member.");
    } finally {
      setBusyId(null);
      setConfirmModal(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
              Members
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              View gym members and manage soft-deleted records
            </p>
          </div>

          <div className="w-full max-w-md">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300">
              <Search size={16} className="text-gray-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full outline-none text-sm"
                placeholder="Search by name, membership no, email, or phone..."
              />
            </div>
          </div>
        </div>

        {actionError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {actionError}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={`cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-all duration-300 ${
              tab === "active"
                ? "bg-blue-900 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setTab("deleted")}
            className={`cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-all duration-300 ${
              tab === "deleted"
                ? "bg-blue-900 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Deleted ({deletedCount})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700"
            >
              <option value="all">All</option>
              {MEMBERSHIP_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Plan
            </label>
            <select
              value={planFilter}
              onChange={(event) => setPlanFilter(event.target.value)}
              className="rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700"
            >
              <option value="all">All</option>
              {planOptions.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Payment
            </label>
            <select
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
              className="rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700"
            >
              <option value="all">All</option>
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="cursor-pointer text-sm font-medium text-blue-700 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-gray-300">
          <div className="px-4 py-3">
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-600 border-b border-gray-100">
                    <th className="py-2 px-3">MEMBER</th>
                    <th className="py-2 px-3">MEMBERSHIP NO</th>
                    <th className="py-2 px-3">PLAN</th>
                    <th className="py-2 px-3">PAYMENT</th>
                    <th className="py-2 px-3">STATUS</th>
                    <th className="py-2 px-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                        Loading members...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-red-600">
                        {error}
                      </td>
                    </tr>
                  ) : pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                        No members found.
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b border-gray-100 transition-colors duration-300 hover:bg-gray-50/80"
                      >
                        <td className="py-2 px-3 align-top">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center text-sm font-semibold">
                              {member.firstName?.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {member.name}
                              </div>
                              <div className="text-xs text-gray-500">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-3 align-top text-gray-700">
                          {member.membershipNumber}
                        </td>
                        <td className="py-2 px-3 align-top text-gray-700">
                          {member.membershipPlanTitle || "-"}
                        </td>
                        <td className="py-2 px-3 align-top">
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                            {paymentStatusLabel(member.paymentStatus)}
                          </span>
                        </td>
                        <td className="py-2 px-3 align-top">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClasses(member)}`}
                          >
                            {member.isDeleted ? "Deleted" : member.membershipStatus}
                          </span>
                        </td>
                        <td className="py-2 px-3 align-top">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              title="View"
                              onClick={() => setViewMember(member)}
                              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:bg-gray-50"
                            >
                              <Eye size={14} />
                            </button>

                            {member.isDeleted && (
                              <>
                                <button
                                  type="button"
                                  title="Reactivate"
                                  disabled={busyId === member.id}
                                  onClick={() => setConfirmModal({ type: "reactivate", member })}
                                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-emerald-200 text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                                >
                                  <RotateCcw size={14} />
                                </button>
                                <button
                                  type="button"
                                  title="Delete permanently"
                                  disabled={busyId === member.id}
                                  onClick={() => setConfirmModal({ type: "delete", member })}
                                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {total === 0 ? 0 : start + 1} to{" "}
              {Math.min(start + pageSize, total)} of {total} entries
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Rows:</label>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  className="border rounded-md px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-md border bg-white text-sm disabled:opacity-50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm hover:bg-gray-50"
              >
                Prev
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setPage(index + 1)}
                    className={`px-2 py-1 text-sm rounded-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm ${page === index + 1 ? "bg-gray-900 text-white" : "bg-white border hover:bg-gray-50"}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-md border bg-white text-sm disabled:opacity-50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewMember && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setViewMember(null);
            }
          }}
        >
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Member Details</h2>
              <button
                type="button"
                onClick={() => setViewMember(null)}
                className="cursor-pointer text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{viewMember.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Membership No</p>
                <p className="font-medium text-gray-900">{viewMember.membershipNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{viewMember.email || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{viewMember.phoneNumber || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date of Birth</p>
                <p className="font-medium text-gray-900">{viewMember.dateOfBirth || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Plan</p>
                <p className="font-medium text-gray-900">
                  {viewMember.membershipPlanTitle || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Status</p>
                <p className="font-medium text-gray-900">
                  {paymentStatusLabel(viewMember.paymentStatus)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Membership Status</p>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClasses(viewMember)}`}
                >
                  {viewMember.isDeleted ? "Deleted" : viewMember.membershipStatus}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Assigned Trainer</p>
                <p className="font-medium text-gray-900">
                  {viewMember.assignedTrainer || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Reward Points</p>
                <p className="font-medium text-gray-900">{viewMember.rewardPoints}</p>
              </div>
              {viewMember.isDeleted && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Deleted At</p>
                  <p className="font-medium text-gray-900">
                    {viewMember.deletedAt ? new Date(viewMember.deletedAt).toLocaleString() : "-"}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-gray-100 px-5 py-3">
              <button
                type="button"
                onClick={() => setViewMember(null)}
                className="cursor-pointer rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {confirmModal && createPortal(
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && busyId !== confirmModal.member.id) {
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
                  {confirmModal.type === "delete" ? "Delete Member" : "Reactivate Member"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {confirmModal.type === "delete"
                    ? "This permanently removes the member and their records. This cannot be undone."
                    : "This member will be moved to Pending status, same as a newly registered member."}
                </p>
              </div>
            </div>

            <div className="mx-6 mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
              <div className="font-medium text-gray-900">{confirmModal.member.name}</div>
              <div className="mt-0.5 text-gray-500">{confirmModal.member.membershipNumber}</div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                disabled={busyId === confirmModal.member.id}
                onClick={() => setConfirmModal(null)}
                className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyId === confirmModal.member.id}
                onClick={() =>
                  confirmModal.type === "delete"
                    ? handlePermanentDelete(confirmModal.member.id)
                    : handleReactivate(confirmModal.member.id)
                }
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60 ${
                  confirmModal.type === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {busyId === confirmModal.member.id && (
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
