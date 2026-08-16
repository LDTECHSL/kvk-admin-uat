import { getCouponCodes } from "@/services/auth-api";
import {
  ArrowLeft,
  Check,
  Copy,
  Gift,
  RefreshCcw,
  Search,
  TicketPercent,
  Users,
} from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FaWhatsapp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
/* ============================================================= TYPES ============================================================= */ type Coupon =
  {
    id: string;
    memberId: string;
    userName: string;
    phoneNumber: string | null;
    couponCode: string;
    offerRateId: string;
    offerName: string;
    isEligible: boolean;
    redeemedDate: string | null;
    isRedeemed: boolean;
  };
type CouponStatus = { label: string; className: string };
type ApiResponse<T> = T | { data: T };
type AlertState = { type: "error" | "success"; message: string } | null;
/* ============================================================= HELPERS ============================================================= */ /** * Safely converts the API response into a Coupon array. * * Supports: * Coupon[] * * and Axios-style: * { data: Coupon[] } */ function extractCouponList(
  response: ApiResponse<Coupon[]>,
): Coupon[] {
  if (Array.isArray(response)) {
    return response;
  }
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    Array.isArray(response.data)
  ) {
    return response.data;
  }
  return [];
}
/** * Converts a Sri Lankan phone number into the international * WhatsApp format. * * Examples: * 0765673415 -> 94765673415 * +94765673415 -> 94765673415 * 94765673415 -> 94765673415 */ function normalizeSriLankanPhone(
  phoneNumber: string,
): string | null {
  const cleaned = phoneNumber.replace(/\D/g, "");
  if (!cleaned) {
    return null;
  }
  if (cleaned.startsWith("94")) {
    return cleaned;
  }
  if (cleaned.startsWith("0")) {
    return `94${cleaned.substring(1)}`;
  }
  return cleaned;
}
/** * Safely formats the redeemed date. */ function formatRedeemedDate(
  date: string | null,
): string {
  if (!date) {
    return "Not redeemed";
  }
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid date";
  }
  return parsedDate.toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
/* ============================================================= PAGE ============================================================= */ export default function MembershipCoupons() {
  const navigate = useNavigate();
  /* =========================================================== STATE =========================================================== */ const [
    coupons,
    setCoupons,
  ] = useState<Coupon[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [alert, setAlert] = useState<AlertState>(null);
  /* =========================================================== FETCH COUPONS =========================================================== */ const handleFetchCoupons =
    useCallback(async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const response = await getCouponCodes();
        console.log("Coupon API response:", response);
        const couponList = extractCouponList(response as ApiResponse<Coupon[]>);
        setCoupons(couponList);
      } catch (error) {
        console.error("Failed to fetch coupon codes:", error);
        setCoupons([]);
        setErrorMessage("Unable to load coupon codes. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }, []);
  useEffect(() => {
    void handleFetchCoupons();
  }, [handleFetchCoupons]);
  /* =========================================================== ALERT =========================================================== */ useEffect(() => {
    if (!alert) {
      return;
    }
    const timer = window.setTimeout(() => {
      setAlert(null);
    }, 4000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [alert]);
  /* =========================================================== SEARCH =========================================================== */ const filteredCoupons =
    useMemo(() => {
      const search = searchTerm.trim().toLowerCase();
      if (!search) {
        return coupons;
      }
      return coupons.filter((coupon) => {
        const userName = coupon.userName?.toLowerCase() ?? "";
        const memberId = coupon.memberId?.toLowerCase() ?? "";
        const phoneNumber = coupon.phoneNumber?.toLowerCase() ?? "";
        const couponCode = coupon.couponCode?.toLowerCase() ?? "";
        const offerName = coupon.offerName?.toLowerCase() ?? "";
        return (
          userName.includes(search) ||
          memberId.includes(search) ||
          phoneNumber.includes(search) ||
          couponCode.includes(search) ||
          offerName.includes(search)
        );
      });
    }, [coupons, searchTerm]);
  /* =========================================================== PAGINATION =========================================================== */ const totalPages =
    Math.max(1, Math.ceil(filteredCoupons.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCoupons = filteredCoupons.slice(startIndex, endIndex);
  const showingFrom = filteredCoupons.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, filteredCoupons.length);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
  /* =========================================================== COPY COUPON =========================================================== */ const handleCopyCoupon =
    useCallback(async (couponCode: string) => {
      try {
        await navigator.clipboard.writeText(couponCode);
        setCopiedCoupon(couponCode);
        window.setTimeout(() => {
          setCopiedCoupon((current) =>
            current === couponCode ? null : current,
          );
        }, 2000);
        setAlert({
          type: "success",
          message: "Coupon code copied successfully.",
        });
      } catch (error) {
        console.error("Unable to copy coupon:", error);
        setAlert({ type: "error", message: "Unable to copy the coupon code." });
      }
    }, []);
  /* =========================================================== WHATSAPP =========================================================== */ const handleWhatsApp =
    useCallback((coupon: Coupon) => {
      if (!coupon.phoneNumber) {
        setAlert({ type: "error", message: "Phone number is not available." });
        return;
      }
      const phone = normalizeSriLankanPhone(coupon.phoneNumber);
      if (!phone) {
        setAlert({
          type: "error",
          message: "The member phone number is invalid.",
        });
        return;
      }
      const memberName = coupon.userName?.trim() || "Member";
      const couponCode = coupon.couponCode?.trim() || "";
      const offerName = coupon.offerName?.trim() || "Member discount";
      const message = `Hello ${memberName}, Thank you for being a valued KVK Arena member! 🎉 Here is your exclusive member coupon: 🎟 Coupon Code: ${couponCode} Offer: ${offerName} You can use this coupon to receive your KVK Arena member discount. Please present or enter this coupon when using our services. Thank you, KVK Arena Team`;
      const whatsappUrl =
        `https://wa.me/${phone}` + `?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }, []);
  /* =========================================================== STATUS =========================================================== */ const getStatus =
    (coupon: Coupon): CouponStatus => {
      if (coupon.isRedeemed) {
        return {
          label: "Redeemed",
          className: "border-slate-200 bg-slate-100 text-slate-700",
        };
      }
      if (!coupon.isEligible) {
        return {
          label: "Not Eligible",
          className: "border-red-200 bg-red-50 text-red-700",
        };
      }
      return {
        label: "Available",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    };
  /* =========================================================== SUMMARY COUNTS =========================================================== */ const totalCoupons =
    coupons.length;
  const eligibleCoupons = useMemo(
    () => coupons.filter((coupon) => coupon.isEligible).length,
    [coupons],
  );
  const redeemedCoupons = useMemo(
    () => coupons.filter((coupon) => coupon.isRedeemed).length,
    [coupons],
  );
  /* =========================================================== RETURN =========================================================== */ return (
    <main className="min-h-screen bg-slate-50">
      {" "}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {" "}
        {/* ===================================================== ALERT ===================================================== */}{" "}
        {alert && (
          <div
            role="alert"
            className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${alert.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}
          >
            {" "}
            {alert.message}{" "}
          </div>
        )}{" "}
        {/* ===================================================== PAGE HEADER ===================================================== */}{" "}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-white shadow-sm">
              {" "}
              <TicketPercent size={21} />{" "}
            </div>{" "}
            <div className="min-w-0">
              {" "}
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {" "}
                Member Coupons{" "}
              </h1>{" "}
              <p className="mt-0.5 text-sm text-slate-500">
                {" "}
                View and share exclusive coupons with eligible members.{" "}
              </p>{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex flex-col gap-2 sm:flex-row">
            {" "}
            <button
              type="button"
              onClick={() => navigate("/main/memberships")}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700"
            >
              {" "}
              <ArrowLeft size={17} /> Back to Members{" "}
            </button>{" "}
            <button
              type="button"
              onClick={() => void handleFetchCoupons()}
              disabled={isLoading}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {" "}
              <RefreshCcw
                size={16}
                className={isLoading ? "animate-spin" : undefined}
              />{" "}
              {isLoading ? "Refreshing..." : "Refresh"}{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
        {/* ===================================================== SUMMARY ===================================================== */}{" "}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {" "}
          <SummaryCard
            title="Total Coupons"
            value={totalCoupons}
            icon={<Gift size={20} />}
          />{" "}
          <SummaryCard
            title="Eligible Coupons"
            value={eligibleCoupons}
            icon={<Users size={20} />}
          />{" "}
          <SummaryCard
            title="Redeemed Coupons"
            value={redeemedCoupons}
            icon={<Check size={20} />}
          />{" "}
        </div>{" "}
        {/* ===================================================== DATA GRID ===================================================== */}{" "}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {" "}
          {/* =================================================== SEARCH =================================================== */}{" "}
          <div className="border-b border-slate-200 p-4">
            {" "}
            <div className="relative w-full sm:max-w-md">
              {" "}
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />{" "}
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search member, phone or coupon..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />{" "}
            </div>{" "}
          </div>{" "}
          {/* =================================================== ERROR =================================================== */}{" "}
          {!isLoading && errorMessage ? (
            <ErrorState
              message={errorMessage}
              onRetry={() => void handleFetchCoupons()}
            />
          ) : (
            <>
              {" "}
              {/* ============================================= DESKTOP TABLE ============================================= */}{" "}
              <div className="hidden overflow-x-auto md:block">
                {" "}
                <table className="w-full min-w-[1050px]">
                  {" "}
                  <thead>
                    {" "}
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      {" "}
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {" "}
                        Member{" "}
                      </th>{" "}
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {" "}
                        Coupon Code{" "}
                      </th>{" "}
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {" "}
                        Phone{" "}
                      </th>{" "}
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {" "}
                        Status{" "}
                      </th>{" "}
                      <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {" "}
                        Action{" "}
                      </th>{" "}
                    </tr>{" "}
                  </thead>{" "}
                  <tbody className="divide-y divide-slate-100">
                    {" "}
                    {isLoading ? (
                      <TableLoading />
                    ) : paginatedCoupons.length > 0 ? (
                      paginatedCoupons.map((coupon) => {
                        const status = getStatus(coupon);
                        return (
                          <tr
                            key={coupon.id}
                            className="transition hover:bg-slate-50/80"
                          >
                            {" "}
                            {/* Member */}{" "}
                            <td className="px-5 py-4">
                              {" "}
                              <div className="flex items-center gap-3">
                                {" "}
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-900 to-indigo-600 text-sm font-bold uppercase text-white">
                                  {" "}
                                  {coupon.userName
                                    ?.substring(0, 2)
                                    .toUpperCase() || "M"}{" "}
                                </div>{" "}
                                <div className="min-w-0">
                                  {" "}
                                  <p className="truncate font-semibold text-slate-900">
                                    {" "}
                                    {coupon.userName || "Unknown Member"}{" "}
                                  </p>{" "}
                                </div>{" "}
                              </div>{" "}
                            </td>{" "}
                            {/* Coupon */}{" "}
                            <td className="px-5 py-4">
                              {" "}
                              <CouponCode
                                couponCode={coupon.couponCode}
                                isCopied={copiedCoupon === coupon.couponCode}
                                onCopy={handleCopyCoupon}
                              />{" "}
                            </td>{" "}
                            {/* Phone */}{" "}
                            <td className="px-5 py-4">
                              {" "}
                              <span className="text-sm font-medium text-slate-700">
                                {" "}
                                {coupon.phoneNumber || "Not provided"}{" "}
                              </span>{" "}
                            </td>{" "}
                            {/* Status */}{" "}
                            <td className="px-5 py-4">
                              {" "}
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}
                              >
                                {" "}
                                {coupon.isRedeemed ? "Redeemed" : "Not Redeemed"}{" "}
                              </span>{" "}
                            </td>{" "}
                            {/* WhatsApp */}{" "}
                            <td className="px-5 py-4 text-right">
                              {" "}
                              <WhatsAppButton
                                coupon={coupon}
                                onClick={handleWhatsApp}
                              />{" "}
                            </td>{" "}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        {" "}
                        <td colSpan={7}>
                          {" "}
                          <EmptyState
                            hasSearch={searchTerm.trim().length > 0}
                          />{" "}
                        </td>{" "}
                      </tr>
                    )}{" "}
                  </tbody>{" "}
                </table>{" "}
              </div>{" "}
              {/* ============================================= MOBILE CARDS ============================================= */}{" "}
              <div className="divide-y divide-slate-100 md:hidden">
                {" "}
                {isLoading ? (
                  <MobileLoading />
                ) : paginatedCoupons.length > 0 ? (
                  paginatedCoupons.map((coupon) => {
                    const status = getStatus(coupon);
                    return (
                      <article key={coupon.id} className="p-4">
                        {" "}
                        {/* Member */}{" "}
                        <div className="mb-4 flex items-center gap-3">
                          {" "}
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-900 to-indigo-600 text-sm font-bold uppercase text-white">
                            {" "}
                            {coupon.userName?.substring(0, 2).toUpperCase() ||
                              "M"}{" "}
                          </div>{" "}
                          <div className="min-w-0">
                            {" "}
                            <h3 className="truncate font-semibold text-slate-900">
                              {" "}
                              {coupon.userName || "Unknown Member"}{" "}
                            </h3>{" "}
                            <p className="truncate text-xs font-medium text-slate-500">
                              {" "}
                              {coupon.memberId || "No member ID"}{" "}
                            </p>{" "}
                          </div>{" "}
                        </div>{" "}
                        {/* Coupon */}{" "}
                        <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                          {" "}
                          <p className="mb-1.5 text-xs font-medium text-blue-600">
                            {" "}
                            Coupon Code{" "}
                          </p>{" "}
                          <div className="flex items-center justify-between gap-3">
                            {" "}
                            <span className="break-all font-mono text-base font-bold tracking-wider text-blue-900">
                              {" "}
                              {coupon.couponCode || "No coupon code"}{" "}
                            </span>{" "}
                            <button
                              type="button"
                              onClick={() =>
                                void handleCopyCoupon(coupon.couponCode)
                              }
                              title="Copy coupon"
                              aria-label={`Copy coupon ${coupon.couponCode}`}
                              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm transition hover:bg-blue-100"
                            >
                              {" "}
                              {copiedCoupon === coupon.couponCode ? (
                                <Check size={17} className="text-emerald-600" />
                              ) : (
                                <Copy size={17} />
                              )}{" "}
                            </button>{" "}
                          </div>{" "}
                        </div>{" "}
                        {/* Phone */}{" "}
                        <InfoRow
                          label="Phone"
                          value={coupon.phoneNumber || "Not provided"}
                        />{" "}
                        {/* Offer */}{" "}
                        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-3 py-2.5">
                          {" "}
                          <span className="text-xs font-medium text-amber-600">
                            {" "}
                            Offer{" "}
                          </span>{" "}
                          <span className="text-right text-xs font-semibold text-amber-700">
                            {" "}
                            {coupon.offerName || "No offer"}{" "}
                          </span>{" "}
                        </div>{" "}
                        {/* Status */}{" "}
                        <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                          {" "}
                          <span className="text-xs font-medium text-slate-500">
                            {" "}
                            Status{" "}
                          </span>{" "}
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}
                          >
                            {" "}
                            {status.label}{" "}
                          </span>{" "}
                        </div>{" "}
                        {/* Redeemed */}{" "}
                        <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                          {" "}
                          <span className="text-xs font-medium text-slate-500">
                            {" "}
                            Redeemed{" "}
                          </span>{" "}
                          <span className="text-right text-xs font-semibold text-slate-700">
                            {" "}
                            {formatRedeemedDate(coupon.redeemedDate)}{" "}
                          </span>{" "}
                        </div>{" "}
                        {/* WhatsApp */}{" "}
                        <WhatsAppButton
                          coupon={coupon}
                          onClick={handleWhatsApp}
                          fullWidth
                        />{" "}
                      </article>
                    );
                  })
                ) : (
                  <EmptyState hasSearch={searchTerm.trim().length > 0} />
                )}{" "}
              </div>{" "}
              {/* ============================================= PAGINATION ============================================= */}{" "}
              {!isLoading && filteredCoupons.length > 0 && (
                <Pagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  showingFrom={showingFrom}
                  showingTo={showingTo}
                  totalItems={filteredCoupons.length}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={(value) => {
                    setItemsPerPage(value);
                    setCurrentPage(1);
                  }}
                  onPrevious={() =>
                    setCurrentPage((page) => Math.max(page - 1, 1))
                  }
                  onNext={() =>
                    setCurrentPage((page) => Math.min(page + 1, totalPages))
                  }
                  onPageChange={setCurrentPage}
                />
              )}{" "}
            </>
          )}{" "}
        </section>{" "}
      </div>{" "}
    </main>
  );
}
/* ============================================================= SUMMARY CARD ============================================================= */ function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {" "}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
        {" "}
        {icon}{" "}
      </div>{" "}
      <div>
        {" "}
        <p className="text-sm font-medium text-slate-500"> {title} </p>{" "}
        <p className="mt-0.5 text-2xl font-bold text-slate-900">
          {" "}
          {value}{" "}
        </p>{" "}
      </div>{" "}
    </div>
  );
}
/* ============================================================= COUPON CODE ============================================================= */ function CouponCode({
  couponCode,
  isCopied,
  onCopy,
}: {
  couponCode: string;
  isCopied: boolean;
  onCopy: (couponCode: string) => Promise<void>;
}) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl border border-blue-100 bg-blue-50">
      {" "}
      <span className="px-3 py-2 font-mono text-sm font-bold tracking-wider text-blue-900">
        {" "}
        {couponCode || "N/A"}{" "}
      </span>{" "}
      <button
        type="button"
        onClick={() => void onCopy(couponCode)}
        title="Copy coupon"
        aria-label={`Copy coupon ${couponCode}`}
        disabled={!couponCode}
        className="flex h-9 w-10 cursor-pointer items-center justify-center border-l border-blue-100 text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {" "}
        {isCopied ? (
          <Check size={16} className="text-emerald-600" />
        ) : (
          <Copy size={16} />
        )}{" "}
      </button>{" "}
    </div>
  );
}
/* ============================================================= WHATSAPP BUTTON ============================================================= */ function WhatsAppButton({
  coupon,
  onClick,
  fullWidth = false,
}: {
  coupon: Coupon;
  onClick: (coupon: Coupon) => void;
  fullWidth?: boolean;
}) {
  const disabled =
    !coupon.phoneNumber || coupon.isRedeemed || !coupon.isEligible;
  let title = "Send coupon via WhatsApp";
  if (!coupon.phoneNumber) {
    title = "Phone number not available";
  } else if (coupon.isRedeemed) {
    title = "Coupon has already been redeemed";
  } else if (!coupon.isEligible) {
    title = "Member is not eligible for this coupon";
  }
  return (
    <button
      type="button"
      onClick={() => onClick(coupon)}
      disabled={disabled}
      title={title}
      className={`inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg ${fullWidth ? "h-10 w-full rounded-xl" : ""} ${disabled ? "cursor-not-allowed bg-slate-300 text-slate-500" : fullWidth ? "bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700" : "border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"} px-3 text-sm font-semibold`}
    >
      {" "}
      <FaWhatsapp size={fullWidth ? 18 : 17} />{" "}
      {fullWidth ? "Send Coupon via WhatsApp" : "Send"}{" "}
    </button>
  );
}
/* ============================================================= INFO ROW ============================================================= */ function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
      {" "}
      <span className="text-xs font-medium text-slate-500"> {label} </span>{" "}
      <span className="text-right text-sm font-semibold text-slate-800">
        {" "}
        {value}{" "}
      </span>{" "}
    </div>
  );
}
/* ============================================================= PAGINATION ============================================================= */ function Pagination({
  currentPage,
  totalPages,
  showingFrom,
  showingTo,
  totalItems,
  itemsPerPage,
  onItemsPerPageChange,
  onPrevious,
  onNext,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
  totalItems: number;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onPageChange: (page: number) => void;
}) {
  const visiblePages = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).filter(
    (page) =>
      page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1,
  );
  return (
    <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      {" "}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        {" "}
        <p className="text-sm text-slate-500">
          {" "}
          Showing{" "}
          <span className="font-semibold text-slate-700">
            {" "}
            {showingFrom}{" "}
          </span>{" "}
          to <span className="font-semibold text-slate-700"> {showingTo} </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-700"> {totalItems} </span>{" "}
          coupons{" "}
        </p>{" "}
        <div className="flex items-center gap-2">
          {" "}
          <label
            htmlFor="coupon-page-size"
            className="text-xs font-medium text-slate-500"
          >
            {" "}
            Rows:{" "}
          </label>{" "}
          <select
            id="coupon-page-size"
            value={itemsPerPage}
            onChange={(event) =>
              onItemsPerPageChange(Number(event.target.value))
            }
            className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {" "}
            <option value={5}>5</option> <option value={10}>10</option>{" "}
            <option value={20}>20</option> <option value={50}>50</option>{" "}
          </select>{" "}
        </div>{" "}
      </div>{" "}
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        {" "}
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage === 1}
          className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {" "}
          Previous{" "}
        </button>{" "}
        <div className="hidden items-center gap-1 sm:flex">
          {" "}
          {visiblePages.map((page, index) => {
            const previousPage = visiblePages[index - 1];
            const showEllipsis =
              previousPage !== undefined && page - previousPage > 1;
            return (
              <div key={page} className="flex items-center gap-1">
                {" "}
                {showEllipsis && (
                  <span className="flex h-9 w-9 items-center justify-center text-sm text-slate-400">
                    {" "}
                    ...{" "}
                  </span>
                )}{" "}
                <button
                  type="button"
                  onClick={() => onPageChange(page)}
                  aria-current={currentPage === page ? "page" : undefined}
                  className={`flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg px-3 text-sm font-semibold transition ${currentPage === page ? "bg-blue-900 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-700 hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700"}`}
                >
                  {" "}
                  {page}{" "}
                </button>{" "}
              </div>
            );
          })}{" "}
        </div>{" "}
        <span className="text-sm font-semibold text-slate-600 sm:hidden">
          {" "}
          {currentPage} / {totalPages}{" "}
        </span>{" "}
        <button
          type="button"
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {" "}
          Next{" "}
        </button>{" "}
      </div>{" "}
    </div>
  );
}
/* ============================================================= ERROR STATE ============================================================= */ function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      {" "}
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        {" "}
        <RefreshCcw size={26} />{" "}
      </div>{" "}
      <h3 className="font-semibold text-slate-900"> Unable to load coupons </h3>{" "}
      <p className="mt-1 max-w-sm text-sm text-slate-500"> {message} </p>{" "}
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-blue-900 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
      >
        {" "}
        <RefreshCcw size={16} /> Try Again{" "}
      </button>{" "}
    </div>
  );
}
/* ============================================================= TABLE LOADING ============================================================= */ function TableLoading() {
  return (
    <>
      {" "}
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index}>
          {" "}
          <td className="px-5 py-4">
            {" "}
            <div className="flex animate-pulse items-center gap-3">
              {" "}
              <div className="h-11 w-11 rounded-xl bg-slate-200" />{" "}
              <div className="space-y-2">
                {" "}
                <div className="h-3 w-32 rounded bg-slate-200" />{" "}
                <div className="h-2.5 w-20 rounded bg-slate-100" />{" "}
              </div>{" "}
            </div>{" "}
          </td>{" "}
          <td className="px-5 py-4">
            {" "}
            <div className="h-9 w-44 animate-pulse rounded-xl bg-slate-200" />{" "}
          </td>{" "}
          <td className="px-5 py-4">
            {" "}
            <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />{" "}
          </td>{" "}
          <td className="px-5 py-4">
            {" "}
            <div className="h-7 w-36 animate-pulse rounded-lg bg-slate-200" />{" "}
          </td>{" "}
          <td className="px-5 py-4">
            {" "}
            <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200" />{" "}
          </td>{" "}
          <td className="px-5 py-4">
            {" "}
            <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />{" "}
          </td>{" "}
          <td className="px-5 py-4">
            {" "}
            <div className="ml-auto h-9 w-24 animate-pulse rounded-lg bg-slate-200" />{" "}
          </td>{" "}
        </tr>
      ))}{" "}
    </>
  );
}
/* ============================================================= MOBILE LOADING ============================================================= */ function MobileLoading() {
  return (
    <>
      {" "}
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="animate-pulse p-4">
          {" "}
          <div className="mb-4 flex items-center gap-3">
            {" "}
            <div className="h-12 w-12 rounded-xl bg-slate-200" />{" "}
            <div className="space-y-2">
              {" "}
              <div className="h-3 w-32 rounded bg-slate-200" />{" "}
              <div className="h-2.5 w-24 rounded bg-slate-100" />{" "}
            </div>{" "}
          </div>{" "}
          <div className="mb-3 h-16 rounded-xl bg-blue-50" />{" "}
          <div className="mb-3 h-10 rounded-xl bg-slate-100" />{" "}
          <div className="mb-3 h-10 rounded-xl bg-amber-50" />{" "}
          <div className="mb-3 h-10 rounded-xl bg-slate-100" />{" "}
          <div className="mb-4 h-10 rounded-xl bg-slate-100" />{" "}
          <div className="h-10 rounded-xl bg-slate-200" />{" "}
        </div>
      ))}{" "}
    </>
  );
}
/* ============================================================= EMPTY STATE ============================================================= */ function EmptyState({
  hasSearch,
}: {
  hasSearch: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      {" "}
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-900">
        {" "}
        <Gift size={26} />{" "}
      </div>{" "}
      <h3 className="font-semibold text-slate-900"> No coupons found </h3>{" "}
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {" "}
        {hasSearch
          ? "There are no coupons matching your search."
          : "There are currently no coupons available."}{" "}
      </p>{" "}
    </div>
  );
}
