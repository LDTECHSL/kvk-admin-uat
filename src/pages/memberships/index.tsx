import { Alert } from "@/components/ui/alert";
import { getEnv } from "@/env";
import { generateCouponCodes } from "@/services/auth-api";
import { getMembers, pay } from "@/services/members-api";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  EyeIcon,
  Gift,
  Mail,
  MoreHorizontal,
  Phone,
  RefreshCcw,
  Search,
  ShieldCheck,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import { FaWhatsapp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

type Member = {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  phone: string | null;
  status: string | number;
  gender: number;
  profilePicture: string;
  startDate: string | null;
  endDate: string | null;
  isPaid: boolean;
  membershipStatus: number;
  nicNumber: string | null;
};

type StatusFilter = "all" | "1" | "2";

type ActionMenuState = {
  member: Member;
  top: number;
  left: number;
} | null;

export default function Memberships() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isApprovalConfirmed, setIsApprovalConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageAlert, setPageAlert] = useState<{
    visible: boolean;
    variant?: "success" | "error" | "warning" | "info";
    title?: string;
    description?: string;
  }>({ visible: false });
  const [isViewingMember, setIsViewingMember] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [actionMenu, setActionMenu] = useState<ActionMenuState>(null);

  const env = getEnv();
  const COUPON_CODE_ID = env.COUPON_CODE_ID;

  const navigate = useNavigate();

  const handleToggleActionMenu = (
    event: ReactMouseEvent<HTMLButtonElement>,
    member: Member,
  ) => {
    event.stopPropagation();

    if (actionMenu?.member.id === member.id) {
      setActionMenu(null);
      return;
    }

    const buttonRect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 208;
    const menuHeight = 112;
    const viewportPadding = 12;
    const gap = 8;

    let left = buttonRect.right - menuWidth;
    left = Math.max(
      viewportPadding,
      Math.min(left, window.innerWidth - menuWidth - viewportPadding),
    );

    let top = buttonRect.bottom + gap;

    if (top + menuHeight > window.innerHeight - viewportPadding) {
      top = buttonRect.top - menuHeight - gap;
    }

    setActionMenu({ member, top, left });
  };

  const handleGenerateCoupons = async() => {

    const formData = new FormData();
    formData.append("offerRateId", COUPON_CODE_ID);

    setLoading(true);

    try{
      await generateCouponCodes(formData);
      setPageAlert({
        visible: true,
        variant: "success",
        title: "Coupons generated",
        description: "The coupon codes have been generated successfully.",
      });

      setTimeout(() => {
        navigate("/main/memberships/coupons");
      }, 1000);
    } catch (error) {
      setPageAlert({
        visible: true,
        variant: "error",
        title: "Coupon generation failed",
        description: "An error occurred while generating coupon codes. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleCloseActionMenu = () => {
    setActionMenu(null);
  };

  useEffect(() => {
    if (!actionMenu) return;

    const closeMenu = () => setActionMenu(null);

    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [actionMenu]);

  const handleOpenApproveModal = (member: Member) => {
    setSelectedMember(member);
    setIsViewingMember(false);
    setIsApprovalConfirmed(false);
  };

  const handleCloseApproveModal = () => {
    handleCloseMemberModal();
  };

  const handleApproveMember = async () => {
    if (!selectedMember || !isApprovalConfirmed) return;

    setLoading(true);

    try {
      setApprovingId(selectedMember.id);

      const formatDateTime = (date: Date) => {
        const pad = (n: number) => String(n).padStart(2, "0");

        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      };

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      const body = {
        memberId: selectedMember.id,
        isPaid: true,
        startDate: formatDateTime(startDate),
        endDate: formatDateTime(endDate),
      };

      await pay(body);
      setPageAlert({
        visible: true,
        variant: "success",
        title: "Membership approved",
        description: `The membership for ${selectedMember.firstName} ${selectedMember.lastName} has been successfully approved.`,
      });
      /*
       * Replace this section with your approve API call.
       *
       * Example:
       *
       * await approveMember(selectedMember.id);
       * await handleFetchMembers();
       */

      // Temporary local update for UI testing.
      handleFetchMembers();

      handleCloseApproveModal();
    } catch (error) {
      setPageAlert({
        visible: true,
        variant: "error",
        title: "Approval failed",
        description:
          "An error occurred while approving the membership. Please try again.",
      });
    } finally {
      setLoading(false);
      setApprovingId(null);
      setSelectedMember(null);
      setIsApprovalConfirmed(false);
    }
  };

  const handleFetchMembers = async () => {
    try {
      setIsLoading(true);

      const res = await getMembers();

      setMembers(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Failed to fetch members:", error);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleFetchMembers();
  }, []);

  const handleWhatsApp = (member: Member) => {
    if (!member.phone) {
      alert("Phone number not available.");
      return;
    }

    // Convert local Sri Lankan number to international format
    let phone = member.phone.replace(/\D/g, "");

    if (phone.startsWith("0")) {
      phone = "94" + phone.substring(1);
    }

    const message = `Hello ${member.firstName},

      Thank you for registering with KVK Arena! 🎉

      We have received your membership request.

      Our membership features include:

      ✅ Annual Membership Plan
      • Valid for one year
      • Renew after one year

      ✅ Member Benefits
      • 10% discount on every KVK Arena service

      If you have any questions, feel free to reply to this message.

      Thank you,
      KVK Arena Team`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const handleViewMember = (member: Member) => {
    setSelectedMember(member);
    setIsViewingMember(true);
    setIsApprovalConfirmed(false);
  };

  const handleCloseMemberModal = () => {
    if (approvingId) return;

    setSelectedMember(null);
    setIsViewingMember(false);
    setIsApprovalConfirmed(false);
  };

  const filteredMembers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return members.filter((member) => {
      const memberStatus = String(member.membershipStatus);

      const matchesStatus =
        statusFilter === "all" || memberStatus === statusFilter;

      const fullName =
        `${member.firstName ?? ""} ${member.lastName ?? ""}`.toLowerCase();

      const matchesSearch =
        !search ||
        fullName.includes(search) ||
        member.memberId?.toLowerCase().includes(search) ||
        member.userName?.toLowerCase().includes(search) ||
        member.email?.toLowerCase().includes(search) ||
        member.phone?.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [members, searchTerm, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMembers.length / itemsPerPage),
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedMembers = useMemo(() => {
    return filteredMembers.slice(startIndex, endIndex);
  }, [filteredMembers, startIndex, endIndex]);

  const showingFrom = filteredMembers.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, filteredMembers.length);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, itemsPerPage]);
  const pendingCount = members.filter(
    (member) => String(member.membershipStatus) === "2",
  ).length;

  const approvedCount = members.filter(
    (member) => String(member.membershipStatus) === "1",
  ).length;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""
      }`.toUpperCase();
  };

  const getStatusBadge = (status: string | number) => {
    const currentStatus = String(status);

    if (currentStatus === "1") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircle2 size={13} />
          Approved
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Pending
      </span>
    );
  };

  return (
    <main className="min-h-screen">
      {pageAlert.visible && (
        <div>
          <Alert
            variant={pageAlert.variant as any}
            title={pageAlert.title}
            description={pageAlert.description}
            onClose={() => setPageAlert((s) => ({ ...s, visible: false }))}
          />
        </div>
      )}

      {loading &&
        createPortal(
          <div className="fixed inset-0 z-[9999999999] flex items-center justify-center bg-black/60 backdrop-blur-md">
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
              <p className="text-sm text-white font-medium">Loading</p>
            </div>
          </div>,
          document.body,
        )}
      <div className="page-container">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-white shadow-sm shadow-blue-900">
                <Users size={20} />
              </div>

              <div>
                <h1 className="page-heading">
                  Memberships
                </h1>
                <p className="text-sm text-slate-500">
                  Review and manage registered arena members.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => handleGenerateCoupons()}
              className="action-primary inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              <Gift size={17} />
              Generate Coupons
            </button>

            <button
              type="button"
              onClick={handleFetchMembers}
              disabled={isLoading}
              className="action-secondary inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw
                size={16}
                className={isLoading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Total Members"
            value={members.length}
            icon={<Users size={20} />}
            iconClassName="bg-blue-50 text-blue-900"
          />

          <SummaryCard
            title="Pending Approval"
            value={pendingCount}
            icon={<MoreHorizontal size={20} />}
            iconClassName="bg-amber-50 text-amber-600"
          />

          <SummaryCard
            title="Approved Members"
            value={approvedCount}
            icon={<UserCheck size={20} />}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
        </div>

        {/* Table Container */}
        <section className="surface-panel overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Filters */}
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name, ID, username or email..."
                className="field-control h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="relative w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="field-control h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">All statuses</option>
                <option value="2">Pending</option>
                <option value="1">Approved</option>
              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="data-table w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Member
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Username
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Contact
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <TableLoadingRows />
                ) : paginatedMembers.length > 0 ? (
                  paginatedMembers.map((member) => {

                    return (
                      <tr
                        key={member.id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {member.profilePicture ? (
                              <img
                                src={member.profilePicture}
                                alt={`${member.firstName} ${member.lastName}`}
                                className="h-11 w-11 rounded-xl object-cover ring-1 ring-slate-200"
                              />
                            ) : (
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-900 to-indigo-600 text-sm font-bold text-white shadow-sm">
                                {getInitials(member.firstName, member.lastName)}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {member.firstName} {member.lastName}
                              </p>

                              <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                                {member.memberId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-slate-700">
                            @{member.userName || "N/A"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <Mail
                                size={14}
                                className="shrink-0 text-slate-400"
                              />
                              <span className="max-w-[220px] truncate">
                                {member.email || "No email"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Phone
                                size={14}
                                className="shrink-0 text-slate-400"
                              />
                              <span>{member.phone || "Not provided"}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {getStatusBadge(member.membershipStatus)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={(event) =>
                                handleToggleActionMenu(event, member)
                              }
                              className="action-secondary inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700"
                              aria-label={`Open actions for ${member.firstName} ${member.lastName}`}
                              aria-expanded={
                                actionMenu?.member.id === member.id
                              }
                              aria-haspopup="menu"
                            >
                              <MoreHorizontal size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="divide-y divide-slate-100 md:hidden">
            {isLoading ? (
              <MobileLoadingCards />
            ) : paginatedMembers.length > 0 ? (
              paginatedMembers.map((member) => {

                return (
                  <article key={member.id} className="p-4">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white">
                          {getInitials(member.firstName, member.lastName)}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-slate-900">
                            {member.firstName} {member.lastName}
                          </h3>

                          <p className="truncate text-xs font-medium text-slate-500">
                            {member.memberId}
                          </p>
                        </div>
                      </div>

                      {getStatusBadge(member.membershipStatus)}
                    </div>

                    <div className="mb-4 space-y-2 rounded-xl bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-slate-500">
                          Username
                        </span>

                        <span className="truncate text-sm font-medium text-slate-800">
                          @{member.userName || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-slate-500">
                          Email
                        </span>

                        <span className="truncate text-sm font-medium text-slate-800">
                          {member.email || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-slate-500">
                          Phone
                        </span>

                        <span className="text-sm font-medium text-slate-800">
                          {member.phone || "Not provided"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(event) => handleToggleActionMenu(event, member)}
                      className="action-secondary inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700"
                      aria-expanded={actionMenu?.member.id === member.id}
                      aria-haspopup="menu"
                    >
                      <MoreHorizontal size={18} />
                      Actions
                    </button>
                  </article>
                );
              })
            ) : (
              <EmptyState />
            )}
          </div>

          {/* Pagination Footer */}
          {!isLoading && filteredMembers.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {showingFrom}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-700">
                    {showingTo}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredMembers.length}
                  </span>{" "}
                  members
                </p>

                <div className="flex items-center gap-2">
                  <label
                    htmlFor="items-per-page"
                    className="text-xs font-medium text-slate-500"
                  >
                    Rows:
                  </label>

                  <select
                    id="items-per-page"
                    value={itemsPerPage}
                    onChange={(event) => {
                      setItemsPerPage(Number(event.target.value));
                      setCurrentPage(1);
                    }}
                    className="field-control h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((previousPage) =>
                      Math.max(previousPage - 1, 1),
                    )
                  }
                  disabled={currentPage === 1}
                  className="action-secondary inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-700"
                >
                  Previous
                </button>

                <div className="hidden items-center gap-1 sm:flex">
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .filter((page) => {
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, index, visiblePages) => {
                      const previousPage = visiblePages[index - 1];
                      const showEllipsis =
                        previousPage !== undefined && page - previousPage > 1;

                      return (
                        <div key={page} className="flex items-center gap-1">
                          {showEllipsis && (
                            <span className="flex h-9 w-9 items-center justify-center text-sm text-slate-400">
                              ...
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg px-3 text-sm font-semibold transition ${currentPage === page
                                ? "bg-blue-900 text-white shadow-sm"
                                : "border border-slate-200 bg-white text-slate-700 hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700"
                              }`}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <span className="text-sm font-semibold text-slate-600 sm:hidden">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((previousPage) =>
                      Math.min(previousPage + 1, totalPages),
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="action-secondary inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
      {actionMenu &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Close action menu"
              className="fixed inset-0 z-[9998] cursor-default bg-transparent"
              onClick={handleCloseActionMenu}
            />

            <div
              role="menu"
              aria-label={`Actions for ${actionMenu.member.firstName} ${actionMenu.member.lastName}`}
              className="surface-panel fixed z-[9999] w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-900/15"
              style={{
                top: actionMenu.top,
                left: actionMenu.left,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  handleWhatsApp(actionMenu.member);
                  handleCloseActionMenu();
                }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <FaWhatsapp size={17} />
                </span>
                Send WhatsApp
              </button>

              {String(actionMenu.member.membershipStatus) === "2" ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    handleOpenApproveModal(actionMenu.member);
                    handleCloseActionMenu();
                  }}
                  disabled={approvingId === actionMenu.member.id}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    {approvingId === actionMenu.member.id ? (
                      <RefreshCcw size={17} className="animate-spin" />
                    ) : (
                      <Check size={17} />
                    )}
                  </span>
                  {approvingId === actionMenu.member.id
                    ? "Approving"
                    : "Approve"}
                </button>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    handleViewMember(actionMenu.member);
                    handleCloseActionMenu();
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <EyeIcon size={17} />
                  </span>
                  View member
                </button>
              )}
            </div>
          </>,
          document.body,
        )}

      {selectedMember && (
        <MemberApprovalModal
          member={selectedMember}
          confirmed={isApprovalConfirmed}
          isApproving={approvingId === selectedMember.id}
          onConfirmedChange={setIsApprovalConfirmed}
          onClose={handleCloseMemberModal}
          onApprove={handleApproveMember}
          getInitials={getInitials}
          getStatusBadge={getStatusBadge}
          viewOnly={isViewingMember}
        />
      )}
    </main>
  );
}

type SummaryCardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconClassName: string;
};

type MemberApprovalModalProps = {
  member: Member;
  confirmed: boolean;
  isApproving: boolean;
  viewOnly?: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
  onClose: () => void;
  onApprove: () => void;
  getInitials: (firstName: string, lastName: string) => string;
  getStatusBadge: (status: string | number) => React.ReactNode;
};

function MemberApprovalModal({
  member,
  confirmed,
  isApproving,
  onConfirmedChange,
  onClose,
  onApprove,
  getInitials,
  getStatusBadge,
  viewOnly,
}: MemberApprovalModalProps) {
  const formatDate = (date: string | null) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getGender = (gender: number) => {
    if (gender === 1) return "Male";
    if (gender === 2) return "Female";

    return "Not specified";
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-white">
              <ShieldCheck size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                {viewOnly ? "Member Details" : "Approve Membership"}
              </h2>

              <p className="text-sm text-slate-500">
                {viewOnly
                  ? "Review the member details below."
                  : "Please review the member details below and confirm approval."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isApproving}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {/* Member Header */}
          <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              {member.profilePicture ? (
                <img
                  src={member.profilePicture}
                  alt={`${member.firstName} ${member.lastName}`}
                  className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-2 ring-white"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-900 text-lg font-bold text-white shadow-sm">
                  {getInitials(member.firstName, member.lastName)}
                </div>
              )}

              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold text-slate-900">
                  {member.firstName} {member.lastName}
                </h3>

                <p className="truncate text-sm font-medium text-slate-500">
                  {member.memberId || "Member ID not available"}
                </p>
              </div>
            </div>

            <div className="shrink-0">{getStatusBadge(member.status)}</div>
          </div>

          {/* Personal Details */}
          <section className="mb-5">
            <div className="mb-3 flex items-center gap-2">
              <User size={17} className="text-blue-900" />

              <h3 className="font-semibold text-slate-900">
                Personal information
              </h3>
            </div>

            <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 sm:grid-cols-2">
              <MemberDetail
                label="First name"
                value={member.firstName || "Not provided"}
              />

              <MemberDetail
                label="Last name"
                value={member.lastName || "Not provided"}
              />

              <MemberDetail
                label="Username"
                value={member.userName ? `@${member.userName}` : "Not provided"}
              />

              <MemberDetail label="Gender" value={getGender(member.gender)} />
            </div>
          </section>

          {/* Contact Details */}
          <section className="mb-5">
            <div className="mb-3 flex items-center gap-2">
              <Phone size={17} className="text-blue-900" />

              <h3 className="font-semibold text-slate-900">
                Contact information
              </h3>
            </div>

            <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 sm:grid-cols-2">
              <MemberDetail
                icon={<Mail size={15} />}
                label="Email address"
                value={member.email || "Not provided"}
              />

              <MemberDetail
                icon={<Phone size={15} />}
                label="Phone number"
                value={member.phone || "Not provided"}
              />
            </div>
          </section>

          {/* Membership Details */}
          <section className="mb-5">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard size={17} className="text-blue-900" />

              <h3 className="font-semibold text-slate-900">
                Membership information
              </h3>
            </div>

            <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 sm:grid-cols-2">
              <MemberDetail
                label="Member ID"
                value={member.memberId || "Not assigned"}
              />

              <MemberDetail
                label="Payment status"
                value={member.isPaid ? "Paid" : "Not paid"}
                valueClassName={
                  member.isPaid ? "text-emerald-700" : "text-amber-700"
                }
              />

              <MemberDetail
                icon={<CalendarDays size={15} />}
                label="Start date"
                value={formatDate(member.startDate)}
              />

              <MemberDetail
                icon={<CalendarDays size={15} />}
                label="End date"
                value={formatDate(member.endDate)}
              />

              {/* <MemberDetail
                label="Account status"
                value={
                  String(member.status) === "2"
                    ? "Approved"
                    : "Pending approval"
                }
              />

              <MemberDetail
                label="Membership status"
                value={String(member.membershipStatus)}
              /> */}
            </div>
          </section>

          {!viewOnly && (
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${confirmed
                  ? "border-blue-300 bg-blue-50"
                  : "border-slate-200 bg-slate-50 hover:border-blue-900"
                }`}
            >
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => onConfirmedChange(event.target.checked)}
                disabled={isApproving}
                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 accent-blue-600 disabled:cursor-not-allowed"
              />

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Confirm membership approval
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  I have reviewed the member details and confirm that this
                  membership request can be approved.
                </p>
              </div>
            </label>
          )}
        </div>

        {!viewOnly && (
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isApproving}
              className="action-secondary inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onApprove}
              disabled={!confirmed || isApproving}
              className="action-primary inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {isApproving ? (
                <>
                  <RefreshCcw size={17} className="animate-spin" />
                  Approving member
                </>
              ) : (
                <>
                  <CheckCircle2 size={17} />
                  Approve membership
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

type MemberDetailProps = {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  valueClassName?: string;
};

function MemberDetail({
  label,
  value,
  icon,
  valueClassName = "text-slate-800",
}: MemberDetailProps) {
  return (
    <div className="border-b border-slate-200 p-4 last:border-b-0 sm:border-r sm:[&:nth-child(2n)]:border-r-0">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {icon}
        {label}
      </div>

      <p className={`break-words text-sm font-semibold ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}

function SummaryCard({ title, value, icon, iconClassName }: SummaryCardProps) {
  return (
    <div className="surface-panel flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
      >
        {icon}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-0.5 text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function TableLoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index}>
          <td className="px-5 py-4">
            <div className="flex animate-pulse items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-slate-200" />
              <div className="space-y-2">
                <div className="h-3 w-32 rounded bg-slate-200" />
                <div className="h-2.5 w-24 rounded bg-slate-100" />
              </div>
            </div>
          </td>

          <td className="px-5 py-4">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
          </td>

          <td className="px-5 py-4">
            <div className="space-y-2">
              <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
            </div>
          </td>

          <td className="px-5 py-4">
            <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200" />
          </td>

          <td className="px-5 py-4">
            <div className="ml-auto h-9 w-24 animate-pulse rounded-lg bg-slate-200" />
          </td>
        </tr>
      ))}
    </>
  );
}

function MobileLoadingCards() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="animate-pulse p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-slate-200" />

            <div className="space-y-2">
              <div className="h-3 w-32 rounded bg-slate-200" />
              <div className="h-2.5 w-24 rounded bg-slate-100" />
            </div>
          </div>

          <div className="mb-4 h-28 rounded-xl bg-slate-100" />
          <div className="h-10 rounded-xl bg-slate-200" />
        </div>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Users size={26} />
      </div>

      <h3 className="font-semibold text-slate-900">No members found</h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        There are no members matching the selected search and status filters.
      </p>
    </div>
  );
}