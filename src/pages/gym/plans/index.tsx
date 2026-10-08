import { notify } from "@/lib/notifications";
import { notifyValidation } from "@/lib/notifications";
import { useFeedbackState } from "@/lib/use-feedback-state";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Tag,
} from "lucide-react";
import {
  getMembershipPlans,
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,
} from "@/services/membership-plans-api";

type Plan = {
  id: string;
  title: string;
  description: string;
  price: number;
  durationInDays: number;
  isActive: number;
  features: string;
};

type PlanForm = {
  title: string;
  description: string;
  price: string;
  durationInDays: string;
  isActive: number;
  features: string;
};

const emptyForm: PlanForm = {
  title: "",
  description: "",
  price: "",
  durationInDays: "",
  isActive: 1,
  features: "",
};

const formatLkr = (amount: number) =>
  `LKR ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const isDayPass = (title: string) => title.trim().toLowerCase() === "day pass";

export default function MembershipPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useFeedbackState<string>("", "error");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; plan?: Plan } | null>(
    null,
  );
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PlanForm, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useFeedbackState<string>("", "error");

  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useFeedbackState<string>("", "error");

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getMembershipPlans();

      const rows =
        response?.additionalData?.response ?? response?.response ?? response ?? [];

      const mapped: Plan[] = Array.isArray(rows)
        ? rows.map((plan: any) => ({
            id: plan.id,
            title: plan.title ?? "",
            description: plan.description ?? "",
            price: Number(plan.price ?? 0),
            durationInDays: Number(plan.durationInDays ?? 0),
            isActive: Number(plan.isActive ?? 1),
            features: plan.features ?? "",
          }))
        : [];

      setPlans(mapped);
    } catch {
      setPlans([]);
      setError("Failed to load membership plans.");
    } finally {
      setIsLoading(false);
    }
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredPlans = plans.filter((plan) => {
    if (statusFilter !== "all" && String(plan.isActive) !== statusFilter) return false;
    if (!normalizedSearchTerm) return true;

    return [plan.title, plan.description, plan.features]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchTerm);
  });

  const openCreateModal = () => {
    setForm(emptyForm);
    setFormErrors({});
    setSaveError("");
    setFormModal({ mode: "create" });
  };

  const openEditModal = (plan: Plan) => {
    if (isDayPass(plan.title)) return;
    setForm({
      title: plan.title,
      description: plan.description,
      price: String(plan.price),
      durationInDays: String(plan.durationInDays),
      isActive: plan.isActive,
      features: plan.features,
    });
    setFormErrors({});
    setSaveError("");
    setFormModal({ mode: "edit", plan });
  };

  const closeFormModal = () => {
    if (isSaving) return;
    setFormModal(null);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof PlanForm, string>> = {};

    if (!form.title.trim()) errors.title = "Title is required.";
    if (isDayPass(form.title) && form.isActive !== 1) {
      errors.isActive = "Day Pass must be active.";
    }

    const price = Number(form.price);
    if (form.price.trim() === "" || Number.isNaN(price) || price < 0) {
      errors.price = "Enter a valid, non-negative price.";
    }

    const duration = Number(form.durationInDays);
    if (form.durationInDays.trim() === "" || !Number.isInteger(duration) || duration <= 0) {
      errors.durationInDays = "Enter a whole number of days greater than zero.";
    }

    setFormErrors(errors);
    notifyValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !formModal) return;

    setIsSaving(true);
    setSaveError("");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      durationInDays: Number(form.durationInDays),
      isActive: form.isActive,
      features: form.features.trim() || null,
    };

    try {
      if (formModal.mode === "create") {
        await createMembershipPlan(payload);
      } else if (formModal.plan) {
        await updateMembershipPlan(formModal.plan.id, payload);
      }

      notify.success(`Membership plan ${formModal.mode === "create" ? "created" : "updated"} successfully.`);
      await loadPlans();
      setFormModal(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to save membership plan.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (isDayPass(deleteTarget.title)) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteMembershipPlan(deleteTarget.id);
      notify.success("Membership plan deleted successfully.");
      await loadPlans();
      setDeleteTarget(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to delete membership plan.";
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="page-heading">
              Membership Plans
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create and manage the gym's membership plans
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="action-primary flex items-center gap-2 px-3 py-2.5 bg-blue-700 text-white rounded cursor-pointer transition-all duration-300 text-sm hover:shadow-lg hover:bg-blue-800"
          >
            <Plus size={16} />
            New Plan
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-300">
            <Search size={16} className="text-gray-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="field-control w-full outline-none text-sm"
              placeholder="Search by title, description, or features..."
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="field-control rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700"
            >
              <option value="all">All</option>
              <option value="1">Active</option>
              <option value="2">Inactive</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-16 text-sm text-gray-500">
              <Loader2 size={20} className="mr-2 animate-spin text-blue-700" />
              Loading membership plans...
            </div>
          ) : error ? (
            <div className="col-span-full rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-gray-300 bg-white px-4 py-12 text-center text-sm text-gray-500">
              No membership plans found.
            </div>
          ) : (
            filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="surface-panel group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-gray-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-gray-900">
                      {plan.title}
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-blue-900">
                      {formatLkr(plan.price)}
                    </p>
                  </div>

                  <span
                    className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      plan.isActive === 1
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {plan.isActive === 1 ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <XCircle size={12} />
                    )}
                    {plan.isActive === 1 ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock size={14} />
                  {plan.durationInDays} days
                </div>

                {plan.description && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">{plan.description}</p>
                )}

                {plan.features && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {plan.features
                      .split(",")
                      .map((feature) => feature.trim())
                      .filter(Boolean)
                      .map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                        >
                          <Tag size={10} />
                          {feature}
                        </span>
                      ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    title={isDayPass(plan.title) ? "Day Pass cannot be edited or deactivated" : "Edit"}
                    disabled={isDayPass(plan.title)}
                    onClick={() => openEditModal(plan)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    title={isDayPass(plan.title) ? "Day Pass cannot be deleted" : "Delete"}
                    disabled={isDayPass(plan.title)}
                    onClick={() => {
                      setDeleteError("");
                      setDeleteTarget(plan);
                    }}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {formModal &&
        createPortal(
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeFormModal();
            }}
          >
            <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {formModal.mode === "create" ? "New Membership Plan" : "Edit Membership Plan"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {formModal.mode === "create"
                      ? "Define a new plan members can subscribe to."
                      : "Update this plan's details."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeFormModal}
                  disabled={isSaving}
                  className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                {saveError && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {saveError}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, title: event.target.value, isActive: isDayPass(event.target.value) ? 1 : current.isActive }))
                    }
                    className="field-control w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. Gold Monthly"
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    rows={2}
                    className="field-control w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Optional short description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Price (LKR)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.price}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, price: event.target.value }))
                      }
                      className="field-control w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="0.00"
                    />
                    {formErrors.price && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      step="1"
                      value={form.durationInDays}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          durationInDays: event.target.value,
                        }))
                      }
                      className="field-control w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="30"
                    />
                    {formErrors.durationInDays && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.durationInDays}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={isDayPass(form.title) ? 1 : form.isActive}
                    disabled={isDayPass(form.title)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isActive: Number(event.target.value),
                      }))
                    }
                    className="field-control w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value={1}>Active</option>
                    <option value={2}>Inactive</option>
                  </select>
                  {isDayPass(form.title) && (
                    <p className="mt-1 text-xs text-gray-500">Day Pass stays active and cannot be edited or deleted after creation.</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Features
                  </label>
                  <textarea
                    value={form.features}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, features: event.target.value }))
                    }
                    rows={2}
                    className="field-control w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Comma separated, e.g. Pool access, Personal trainer, Locker"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={closeFormModal}
                  className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="action-primary inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:opacity-60"
                >
                  {isSaving && <Loader2 size={14} className="animate-spin" />}
                  {formModal.mode === "create" ? "Create Plan" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {deleteTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isDeleting) setDeleteTarget(null);
            }}
          >
            <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start gap-4 px-6 pt-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Delete Plan</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    This permanently removes the plan. Members currently on it will not be
                    reassigned automatically. This cannot be undone.
                  </p>
                </div>
              </div>

              <div className="mx-6 mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                <div className="font-medium text-gray-900">{deleteTarget.title}</div>
                <div className="mt-0.5 text-gray-500">{formatLkr(deleteTarget.price)}</div>
              </div>

              {deleteError && (
                <div className="mx-6 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {deleteError}
                </div>
              )}

              <div className="mt-5 flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteTarget(null)}
                  className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {isDeleting && <Loader2 size={14} className="animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
