import { notify } from "@/lib/notifications";
import { notifyValidation } from "@/lib/notifications";
import { useFeedbackState } from "@/lib/use-feedback-state";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  ImageOff,
  Upload,
  AlertTriangle,
  Scissors,
  RefreshCw,
  Clock,
} from "lucide-react";
import {
  getSalonServices,
  createSalonService,
  updateSalonService,
  deleteSalonService,
} from "@/services/salon-api";

type SalonServiceItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  image: string | null;
};

type ServiceForm = {
  name: string;
  description: string;
  price: string;
  durationMinutes: string;
  isActive: boolean;
};

const emptyForm: ServiceForm = {
  name: "",
  description: "",
  price: "",
  durationMinutes: "",
  isActive: true,
};

const HARDCODED_BUFFER_MINUTES = 0;

const formatLkr = (amount: number) =>
  `LKR ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SalonServices() {
  const [services, setServices] = useState<SalonServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useFeedbackState<string>("", "error");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" | "edit"; service?: SalonServiceItem } | null
  >(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ServiceForm, string>>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useFeedbackState<string>("", "error");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useFeedbackState<string>("", "error");

  const [deleteTarget, setDeleteTarget] = useState<SalonServiceItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useFeedbackState<string>("", "error");

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getSalonServices();

      const rows =
        response?.additionalData?.response ?? response?.response ?? response ?? [];

      const mapped: SalonServiceItem[] = Array.isArray(rows)
        ? rows.map((service: any) => ({
            id: service.id,
            name: service.name ?? "",
            description: service.description ?? "",
            price: Number(service.price ?? 0),
            durationMinutes: Number(service.durationMinutes ?? 0),
            isActive: !!service.isActive,
            image: service.image || null,
          }))
        : [];

      setServices(mapped);
    } catch {
      setServices([]);
      setError("Failed to load services.");
    } finally {
      setIsLoading(false);
    }
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredServices = services.filter((service) => {
    if (statusFilter === "active" && !service.isActive) return false;
    if (statusFilter === "inactive" && service.isActive) return false;
    if (!normalizedSearchTerm) return true;

    return [service.name, service.description]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchTerm);
  });

  const resetImageState = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreateModal = () => {
    setForm(emptyForm);
    setFormErrors({});
    setSaveError("");
    resetImageState();
    setFormModal({ mode: "create" });
  };

  const openEditModal = (service: SalonServiceItem) => {
    setForm({
      name: service.name,
      description: service.description,
      price: String(service.price),
      durationMinutes: String(service.durationMinutes),
      isActive: service.isActive,
    });
    setFormErrors({});
    setSaveError("");
    setImageFile(null);
    setImageError("");
    setImagePreview(service.image ? `data:image/jpeg;base64,${service.image}` : null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFormModal({ mode: "edit", service });
  };

  const closeFormModal = () => {
    if (isSaving) return;
    setFormModal(null);
  };

  const handleImageChange = (file: File | null) => {
    if (!file) return;
    setImageFile(file);
    setImageError("");
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ServiceForm, string>> = {};

    if (!form.name.trim()) errors.name = "Name is required.";

    const price = Number(form.price);
    if (form.price.trim() === "" || Number.isNaN(price) || price < 0) {
      errors.price = "Enter a valid, non-negative price.";
    }

    const duration = Number(form.durationMinutes);
    if (form.durationMinutes.trim() === "" || !Number.isInteger(duration) || duration <= 0) {
      errors.durationMinutes = "Enter a whole number of minutes greater than zero.";
    }

    let valid = Object.keys(errors).length === 0;

    if (!imageFile && !imagePreview) {
      setImageError("An image is required.");
      valid = false;
    } else {
      setImageError("");
    }

    setFormErrors(errors);
    notifyValidation(errors);
    return valid;
  };

  const handleSave = async () => {
    if (!validateForm() || !formModal) return;

    setIsSaving(true);
    setSaveError("");

    try {
      const formData = new FormData();
      formData.append("Name", form.name.trim());
      formData.append("Description", form.description.trim());
      formData.append("Price", String(Number(form.price)));
      formData.append("DurationMinutes", String(Number(form.durationMinutes)));
      formData.append("BufferMinutes", String(HARDCODED_BUFFER_MINUTES));
      formData.append("IsActive", String(form.isActive));
      if (imageFile) formData.append("Image", imageFile);

      if (formModal.mode === "create") {
        await createSalonService(formData);
      } else if (formModal.service) {
        formData.append("Id", formModal.service.id);
        await updateSalonService(formModal.service.id, formData);
      }

      notify.success(`Service ${formModal.mode === "create" ? "created" : "updated"} successfully.`);
      await loadServices();
      setFormModal(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to save service.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteSalonService(deleteTarget.id);
      notify.success("Service deleted successfully.");
      await loadServices();
      setDeleteTarget(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to delete service.";
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-900"><Scissors size={24} /></span>
          <div><h1 className="page-heading">Services</h1><p className="mt-1 text-sm text-slate-500">Manage the salon's service catalog.</p></div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => window.location.reload()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"><RefreshCw size={18} />Refresh</button>
          <button type="button" onClick={openCreateModal} className="action-primary inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold"><Plus size={18} />New Service</button>
        </div>
      </div>
      <div className="surface-panel overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <div className="relative w-full sm:max-w-md"><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Search services" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by name or description..." className="field-control h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></div>
          <select aria-label="Filter services by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="field-control h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
        </div>
        {error && <p role="alert" className="m-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="overflow-x-auto" aria-busy={isLoading}>
          <table className="w-full min-w-[780px] text-left text-sm">
            <caption className="sr-only">Salon service catalog</caption>
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500"><tr><th scope="col" className="px-6 py-4">Service</th><th scope="col" className="px-6 py-4">Description</th><th scope="col" className="px-6 py-4 text-right">Price</th><th scope="col" className="px-6 py-4">Duration</th><th scope="col" className="px-6 py-4">Status</th><th scope="col" className="px-6 py-4 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-500"><Loader2 size={20} className="mr-2 inline animate-spin text-blue-700" />Loading services...</td></tr>
                : !filteredServices.length ? <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-500">{error ? "Services could not be loaded. Try refreshing." : "No services found."}</td></tr>
                : filteredServices.map((service) => <tr key={service.id} className="transition hover:bg-blue-50/30">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">{service.image ? <img src={`data:image/jpeg;base64,${service.image}`} alt="" className="h-full w-full object-cover" /> : <ImageOff size={20} className="text-slate-400" />}</div><span className="font-semibold text-slate-900">{service.name}</span></div></td>
                  <td className="max-w-xs px-6 py-4"><p className="line-clamp-2 leading-6 text-slate-500" title={service.description}>{service.description || "?"}</p></td>
                  <td className="whitespace-nowrap px-6 py-4 text-right font-semibold tabular-nums text-slate-900">{formatLkr(service.price)}</td>
                  <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 whitespace-nowrap text-slate-500"><Clock size={15} />{service.durationMinutes} min</span></td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${service.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><span className={`h-1.5 w-1.5 rounded-full ${service.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />{service.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="px-6 py-4"><div className="flex justify-end gap-2"><button type="button" title="Edit service" aria-label={`Edit ${service.name}`} onClick={() => openEditModal(service)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"><Pencil size={16} /></button><button type="button" title="Delete service" aria-label={`Delete ${service.name}`} onClick={() => { setDeleteError(""); setDeleteTarget(service); }} className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"><Trash2 size={16} /></button></div></td>
                </tr>)}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-6 py-4 text-xs text-slate-500">{isLoading ? "Loading catalog" : `${filteredServices.length} ${filteredServices.length === 1 ? "service" : "services"} ? ${services.length} total`}</div>
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
                    {formModal.mode === "create" ? "New Service" : "Edit Service"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {formModal.mode === "create"
                      ? "Add a new service to the catalog."
                      : "Update this service's details."}
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">Image</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 transition hover:border-blue-300 hover:bg-blue-50/40"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-gray-400">
                        <Upload size={20} />
                        <span className="text-xs">Click to upload</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleImageChange(event.target.files?.[0] ?? null)}
                  />
                  {imageError && <p className="mt-1 text-xs text-red-600">{imageError}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    className="field-control w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. Classic Haircut"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
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
                    className="field-control w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Optional description"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      className="field-control w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="0.00"
                    />
                    {formErrors.price && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      step="1"
                      value={form.durationMinutes}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          durationMinutes: event.target.value,
                        }))
                      }
                      className="field-control w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="30"
                    />
                    {formErrors.durationMinutes && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.durationMinutes}</p>
                    )}
                  </div>
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, isActive: event.target.checked }))
                    }
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-700 focus:ring-blue-500"
                  />
                  Active
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={closeFormModal}
                  className="cursor-pointer h-11 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="action-primary inline-flex cursor-pointer items-center gap-2 h-11 rounded-xl bg-blue-700 px-4 text-sm font-medium text-white transition hover:bg-blue-800 disabled:opacity-60"
                >
                  {isSaving && <Loader2 size={14} className="animate-spin" />}
                  {formModal.mode === "create" ? "Create Service" : "Save Changes"}
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
                  <h2 className="text-base font-semibold text-gray-900">Delete Service</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    This permanently removes the service from the catalog. This cannot be
                    undone.
                  </p>
                </div>
              </div>

              <div className="mx-6 mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                <div className="font-medium text-gray-900">{deleteTarget.name}</div>
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
                  className="cursor-pointer h-11 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="inline-flex cursor-pointer items-center gap-2 h-11 rounded-xl bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
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
