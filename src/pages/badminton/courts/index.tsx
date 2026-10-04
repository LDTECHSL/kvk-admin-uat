import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Plus,
  Pencil,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  Wrench,
  Trophy,
  Clock,
  Save,
  AlertTriangle,
} from "lucide-react";
import {
  getCourts,
  createCourt,
  updateCourt,
  getSlotConfigurationByCourt,
  createSlotConfiguration,
  updateSlotConfiguration,
} from "@/services/badminton-api";

type Court = {
  id: string;
  name: string;
  pricePerSlot: number;
  status: number;
};

type CourtForm = {
  name: string;
  pricePerSlot: string;
  status: number;
};

const emptyForm: CourtForm = {
  name: "",
  pricePerSlot: "",
  status: 1,
};

const STATUS_OPTIONS = [
  { value: 1, label: "Active" },
  { value: 2, label: "Inactive" },
];

const statusBadge = (status: number) => {
  switch (status) {
    case 1:
      return { label: "Active", classes: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 };
    case 3:
      return { label: "Maintenance", classes: "bg-amber-50 text-amber-700", icon: Wrench };
    default:
      return { label: "Inactive", classes: "bg-gray-100 text-gray-600", icon: XCircle };
  }
};

const formatLkr = (amount: number) =>
  `LKR ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type SlotConfigForm = {
  startTime: string;
  endTime: string;
  slotDurationMinutes: string;
  slotGapMinutes: string;
};

const defaultSlotConfigForm: SlotConfigForm = {
  startTime: "09:00",
  endTime: "22:00",
  slotDurationMinutes: "60",
  slotGapMinutes: "0",
};

export default function BadmintonCourts() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; court?: Court } | null>(
    null,
  );
  const [form, setForm] = useState<CourtForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CourtForm, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [slotCourtId, setSlotCourtId] = useState("");
  const [slotConfigId, setSlotConfigId] = useState<string | null>(null);
  const [slotForm, setSlotForm] = useState<SlotConfigForm>(defaultSlotConfigForm);
  const [slotFormErrors, setSlotFormErrors] = useState<Partial<Record<keyof SlotConfigForm, string>>>({});
  const [isLoadingSlotConfig, setIsLoadingSlotConfig] = useState(false);
  const [isSavingSlotConfig, setIsSavingSlotConfig] = useState(false);
  const [slotConfigError, setSlotConfigError] = useState("");
  const [slotConfigSuccess, setSlotConfigSuccess] = useState("");

  useEffect(() => {
    loadCourts();
  }, []);

  const loadCourts = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getCourts();

      const rows =
        response?.additionalData?.response ?? response?.response ?? response ?? [];

      const mapped: Court[] = Array.isArray(rows)
        ? rows.map((court: any) => ({
            id: court.id,
            name: court.name ?? "",
            pricePerSlot: Number(court.pricePerSlot ?? 0),
            status: Number(court.status ?? 1),
          }))
        : [];

      setCourts(mapped);
    } catch {
      setCourts([]);
      setError("Failed to load courts.");
    } finally {
      setIsLoading(false);
    }
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredCourts = courts.filter((court) =>
    court.name.toLowerCase().includes(normalizedSearchTerm),
  );

  const openCreateModal = () => {
    setForm(emptyForm);
    setFormErrors({});
    setSaveError("");
    setFormModal({ mode: "create" });
  };

  const openEditModal = (court: Court) => {
    setForm({
      name: court.name,
      pricePerSlot: String(court.pricePerSlot),
      status: court.status,
    });
    setFormErrors({});
    setSaveError("");
    setFormModal({ mode: "edit", court });
  };

  const closeFormModal = () => {
    if (isSaving) return;
    setFormModal(null);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof CourtForm, string>> = {};

    if (!form.name.trim()) errors.name = "Name is required.";

    const price = Number(form.pricePerSlot);
    if (form.pricePerSlot.trim() === "" || Number.isNaN(price) || price < 0) {
      errors.pricePerSlot = "Enter a valid, non-negative price.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !formModal) return;

    setIsSaving(true);
    setSaveError("");

    try {
      if (formModal.mode === "create") {
        await createCourt({
          name: form.name.trim(),
          pricePerSlot: Number(form.pricePerSlot),
        });
      } else if (formModal.court) {
        await updateCourt(formModal.court.id, {
          name: form.name.trim(),
          pricePerSlot: Number(form.pricePerSlot),
          status: form.status,
        });
      }

      await loadCourts();
      setFormModal(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to save court.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectSlotCourt = async (courtId: string) => {
    setSlotCourtId(courtId);
    setSlotConfigError("");
    setSlotConfigSuccess("");
    setSlotFormErrors({});

    if (!courtId) {
      setSlotConfigId(null);
      setSlotForm(defaultSlotConfigForm);
      return;
    }

    setIsLoadingSlotConfig(true);
    try {
      const response = await getSlotConfigurationByCourt(courtId);
      const data =
        response?.additionalData?.response ?? response?.response ?? response ?? null;

      if (data && data.id) {
        setSlotConfigId(data.id);
        setSlotForm({
          startTime: String(data.startTime ?? "09:00:00").slice(0, 5),
          endTime: String(data.endTime ?? "22:00:00").slice(0, 5),
          slotDurationMinutes: String(data.slotDurationMinutes ?? 60),
          slotGapMinutes: String(data.slotGapMinutes ?? 0),
        });
      } else {
        setSlotConfigId(null);
        setSlotForm(defaultSlotConfigForm);
      }
    } catch {
      // No configuration exists yet for this court — fall back to the create form.
      setSlotConfigId(null);
      setSlotForm(defaultSlotConfigForm);
    } finally {
      setIsLoadingSlotConfig(false);
    }
  };

  const validateSlotForm = (): boolean => {
    const errors: Partial<Record<keyof SlotConfigForm, string>> = {};

    if (!slotForm.startTime) errors.startTime = "Start time is required.";
    if (!slotForm.endTime) errors.endTime = "End time is required.";

    const duration = Number(slotForm.slotDurationMinutes);
    if (!Number.isInteger(duration) || duration <= 0) {
      errors.slotDurationMinutes = "Enter a whole number of minutes greater than zero.";
    }

    const gap = Number(slotForm.slotGapMinutes);
    if (!Number.isInteger(gap) || gap < 0) {
      errors.slotGapMinutes = "Enter a whole number of minutes, zero or more.";
    }

    setSlotFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveSlotConfig = async () => {
    if (!slotCourtId || !validateSlotForm()) return;

    setIsSavingSlotConfig(true);
    setSlotConfigError("");
    setSlotConfigSuccess("");

    const payload = {
      courtId: slotCourtId,
      startTime: slotForm.startTime,
      endTime: slotForm.endTime,
      slotDurationMinutes: Number(slotForm.slotDurationMinutes),
      slotGapMinutes: Number(slotForm.slotGapMinutes),
      isActive: 1,
    };

    try {
      if (slotConfigId) {
        await updateSlotConfiguration(slotConfigId, { id: slotConfigId, ...payload });
      } else {
        await createSlotConfiguration(payload);
      }

      setSlotConfigSuccess("Slot configuration saved — slots have been regenerated for this court.");
      await handleSelectSlotCourt(slotCourtId);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to save slot configuration.";
      setSlotConfigError(message);
    } finally {
      setIsSavingSlotConfig(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Courts</h1>
            <p className="text-sm text-gray-500 mt-1">Manage the badminton courts</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-[220px] items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300">
              <Search size={16} className="text-gray-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full outline-none text-sm"
                placeholder="Search by name..."
              />
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-2 px-3 py-2.5 bg-blue-700 text-white rounded cursor-pointer transition-all duration-300 text-sm hover:-translate-y-0.5 hover:shadow-lg hover:bg-blue-800"
            >
              <Plus size={16} />
              New Court
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-16 text-sm text-gray-500">
              <Loader2 size={20} className="mr-2 animate-spin text-blue-700" />
              Loading courts...
            </div>
          ) : error ? (
            <div className="col-span-full rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : filteredCourts.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-gray-300 bg-white px-4 py-12 text-center text-sm text-gray-500">
              No courts found.
            </div>
          ) : (
            filteredCourts.map((court) => {
              const badge = statusBadge(court.status);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={court.id}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-gray-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <Trophy size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{court.name}</h3>
                        <p className="text-sm text-gray-500">{formatLkr(court.pricePerSlot)} / slot</p>
                      </div>
                    </div>

                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.classes}`}
                    >
                      <BadgeIcon size={12} />
                      {badge.label}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-end border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      title="Edit"
                      onClick={() => openEditModal(court)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:bg-gray-50"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Slot Configuration */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-700" />
            <h2 className="text-base font-semibold text-gray-900">Slot Configuration</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Define each court's booking hours and slot length. Saving regenerates every
            bookable slot for that court.
          </p>

          <div className="mt-4 max-w-xs">
            <label className="mb-1 block text-sm font-medium text-gray-700">Court</label>
            <select
              value={slotCourtId}
              onChange={(event) => handleSelectSlotCourt(event.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select a court...</option>
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
          </div>

          {slotCourtId && (
            <div className="mt-5 border-t border-gray-100 pt-5">
              {isLoadingSlotConfig ? (
                <div className="flex items-center justify-center py-8 text-sm text-gray-500">
                  <Loader2 size={18} className="mr-2 animate-spin text-blue-700" />
                  Loading configuration...
                </div>
              ) : (
                <>
                  {slotConfigError && (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {slotConfigError}
                    </div>
                  )}

                  {slotConfigSuccess && (
                    <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                      {slotConfigSuccess}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={slotForm.startTime}
                        onChange={(event) =>
                          setSlotForm((current) => ({ ...current, startTime: event.target.value }))
                        }
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      {slotFormErrors.startTime && (
                        <p className="mt-1 text-xs text-red-600">{slotFormErrors.startTime}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={slotForm.endTime}
                        onChange={(event) =>
                          setSlotForm((current) => ({ ...current, endTime: event.target.value }))
                        }
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      {slotFormErrors.endTime && (
                        <p className="mt-1 text-xs text-red-600">{slotFormErrors.endTime}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Slot Duration (min)
                      </label>
                      <input
                        type="number"
                        min={1}
                        step="1"
                        value={slotForm.slotDurationMinutes}
                        onChange={(event) =>
                          setSlotForm((current) => ({
                            ...current,
                            slotDurationMinutes: event.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      {slotFormErrors.slotDurationMinutes && (
                        <p className="mt-1 text-xs text-red-600">
                          {slotFormErrors.slotDurationMinutes}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Gap Between Slots (min)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="1"
                        value={slotForm.slotGapMinutes}
                        onChange={(event) =>
                          setSlotForm((current) => ({
                            ...current,
                            slotGapMinutes: event.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      {slotFormErrors.slotGapMinutes && (
                        <p className="mt-1 text-xs text-red-600">
                          {slotFormErrors.slotGapMinutes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    Saving deletes and regenerates every bookable slot for this court from the
                    hours above. Do this with care if the court already has upcoming bookings.
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={isSavingSlotConfig}
                      onClick={handleSaveSlotConfig}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:opacity-60"
                    >
                      {isSavingSlotConfig ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      {slotConfigId ? "Save Changes" : "Create Configuration"}
                    </button>
                  </div>
                </>
              )}
            </div>
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
            <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {formModal.mode === "create" ? "New Court" : "Edit Court"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {formModal.mode === "create"
                      ? "Add a new badminton court."
                      : "Update this court's details."}
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. Court 1"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Price per Slot (LKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.pricePerSlot}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, pricePerSlot: event.target.value }))
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="0.00"
                  />
                  {formErrors.pricePerSlot && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.pricePerSlot}</p>
                  )}
                </div>

                {formModal.mode === "edit" && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          status: Number(event.target.value),
                        }))
                      }
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:opacity-60"
                >
                  {isSaving && <Loader2 size={14} className="animate-spin" />}
                  {formModal.mode === "create" ? "Create Court" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
