import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  AlertTriangle,
  Monitor,
} from "lucide-react";
import {
  getGamingCategories,
  getGamingStationsByCategory,
  createGamingStation,
  updateGamingStation,
  activateGamingStation,
  deactivateGamingStation,
  getSlotConfigurationByCategory,
  createGamingSlotConfiguration,
  updateGamingSlotConfiguration,
} from "@/services/gaming-api";

type Category = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  price: number;
};

type Station = {
  id: string;
  gamingCategoryId: string;
  stationCode: string;
  name: string;
  isActive: boolean;
};

type StationForm = {
  stationCode: string;
  name: string;
};

const emptyStationForm: StationForm = { stationCode: "", name: "" };

type SlotConfigForm = {
  startTime: string;
  endTime: string;
  slotDurationMinutes: string;
  slotGapMinutes: string;
  price: string;
};

const defaultSlotConfigForm: SlotConfigForm = {
  startTime: "09:00",
  endTime: "22:00",
  slotDurationMinutes: "60",
  slotGapMinutes: "0",
  price: "0",
};

export default function GamingSettings() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");

  const [stations, setStations] = useState<Station[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(false);
  const [stationsError, setStationsError] = useState("");

  const [stationFormModal, setStationFormModal] = useState<
    { mode: "create" | "edit"; station?: Station } | null
  >(null);
  const [stationForm, setStationForm] = useState<StationForm>(emptyStationForm);
  const [stationFormErrors, setStationFormErrors] = useState<Partial<Record<keyof StationForm, string>>>({});
  const [isSavingStation, setIsSavingStation] = useState(false);
  const [stationSaveError, setStationSaveError] = useState("");

  const [stationConfirmTarget, setStationConfirmTarget] = useState<
    { type: "activate" | "deactivate"; station: Station } | null
  >(null);
  const [busyStationId, setBusyStationId] = useState<string | null>(null);
  const [stationActionError, setStationActionError] = useState("");

  const [slotConfigId, setSlotConfigId] = useState<string | null>(null);
  const [slotForm, setSlotForm] = useState<SlotConfigForm>(defaultSlotConfigForm);
  const [slotFormErrors, setSlotFormErrors] = useState<Partial<Record<keyof SlotConfigForm, string>>>({});
  const [isLoadingSlotConfig, setIsLoadingSlotConfig] = useState(false);
  const [isSavingSlotConfig, setIsSavingSlotConfig] = useState(false);
  const [slotConfigError, setSlotConfigError] = useState("");
  const [slotConfigSuccess, setSlotConfigSuccess] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (activeCategoryId) {
      loadStations(activeCategoryId);
      loadSlotConfig(activeCategoryId);
    }
  }, [activeCategoryId]);

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    setCategoriesError("");

    try {
      const response = await getGamingCategories();

      const rows =
        response?.additionalData?.response ?? response?.response ?? response ?? [];

      const mapped: Category[] = Array.isArray(rows)
        ? rows.map((category: any) => ({
            id: category.id,
            name: category.name ?? "",
            code: category.code ?? "",
            isActive: !!category.isActive,
            price: Number(category.price ?? 0),
          }))
        : [];

      setCategories(mapped);
      if (mapped.length > 0) {
        setActiveCategoryId((current) => current || mapped[0].id);
      }
    } catch {
      setCategories([]);
      setCategoriesError("Failed to load categories.");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const loadStations = async (categoryId: string) => {
    setIsLoadingStations(true);
    setStationsError("");

    try {
      const response = await getGamingStationsByCategory(categoryId);

      const rows =
        response?.additionalData?.response ?? response?.response ?? response ?? [];

      const mapped: Station[] = Array.isArray(rows)
        ? rows.map((station: any) => ({
            id: station.id,
            gamingCategoryId: station.gamingCategoryId,
            stationCode: station.stationCode ?? "",
            name: station.name ?? "",
            isActive: !!station.isActive,
          }))
        : [];

      setStations(mapped);
    } catch {
      setStations([]);
      setStationsError("Failed to load stations.");
    } finally {
      setIsLoadingStations(false);
    }
  };

  const loadSlotConfig = async (categoryId: string) => {
    setIsLoadingSlotConfig(true);
    setSlotConfigError("");
    setSlotConfigSuccess("");

    try {
      const response = await getSlotConfigurationByCategory(categoryId);
      const data =
        response?.additionalData?.response ?? response?.response ?? response ?? null;

      if (data && data.id) {
        setSlotConfigId(data.id);
        setSlotForm({
          startTime: String(data.startTime ?? "09:00:00").slice(0, 5),
          endTime: String(data.endTime ?? "22:00:00").slice(0, 5),
          slotDurationMinutes: String(data.slotDurationMinutes ?? 60),
          slotGapMinutes: String(data.slotGapMinutes ?? 0),
          price: String(data.price ?? 0),
        });
      } else {
        setSlotConfigId(null);
        setSlotForm(defaultSlotConfigForm);
      }
    } catch {
      setSlotConfigId(null);
      setSlotForm(defaultSlotConfigForm);
    } finally {
      setIsLoadingSlotConfig(false);
    }
  };

  const activeCategory = categories.find((category) => category.id === activeCategoryId) ?? null;

  // ---------- Stations ----------

  const openCreateStationModal = () => {
    setStationForm(emptyStationForm);
    setStationFormErrors({});
    setStationSaveError("");
    setStationFormModal({ mode: "create" });
  };

  const openEditStationModal = (station: Station) => {
    setStationForm({ stationCode: station.stationCode, name: station.name });
    setStationFormErrors({});
    setStationSaveError("");
    setStationFormModal({ mode: "edit", station });
  };

  const closeStationFormModal = () => {
    if (isSavingStation) return;
    setStationFormModal(null);
  };

  const validateStationForm = (): boolean => {
    const errors: Partial<Record<keyof StationForm, string>> = {};
    if (!stationForm.stationCode.trim()) errors.stationCode = "Station code is required.";
    if (!stationForm.name.trim()) errors.name = "Name is required.";
    setStationFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveStation = async () => {
    if (!validateStationForm() || !stationFormModal || !activeCategoryId) return;

    setIsSavingStation(true);
    setStationSaveError("");

    try {
      if (stationFormModal.mode === "create") {
        await createGamingStation({
          gamingCategoryId: activeCategoryId,
          stationCode: stationForm.stationCode.trim(),
          name: stationForm.name.trim(),
          isActive: true,
        });
      } else if (stationFormModal.station) {
        await updateGamingStation({
          id: stationFormModal.station.id,
          gamingCategoryId: activeCategoryId,
          stationCode: stationForm.stationCode.trim(),
          name: stationForm.name.trim(),
          isActive: stationFormModal.station.isActive,
        });
      }

      await loadStations(activeCategoryId);
      setStationFormModal(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to save station.";
      setStationSaveError(message);
    } finally {
      setIsSavingStation(false);
    }
  };

  const handleConfirmStationAction = async () => {
    if (!stationConfirmTarget || !activeCategoryId) return;

    setStationActionError("");
    setBusyStationId(stationConfirmTarget.station.id);

    try {
      if (stationConfirmTarget.type === "deactivate") {
        await deactivateGamingStation(stationConfirmTarget.station.id);
      } else {
        await activateGamingStation(stationConfirmTarget.station.id);
      }
      await loadStations(activeCategoryId);
    } catch {
      setStationActionError(
        stationConfirmTarget.type === "deactivate"
          ? "Failed to deactivate station."
          : "Failed to activate station.",
      );
    } finally {
      setBusyStationId(null);
      setStationConfirmTarget(null);
    }
  };

  // ---------- Slot Configuration ----------

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

    const price = Number(slotForm.price);
    if (Number.isNaN(price) || price < 0) {
      errors.price = "Enter a valid, non-negative price.";
    }

    setSlotFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveSlotConfig = async () => {
    if (!activeCategoryId || !validateSlotForm()) return;

    setIsSavingSlotConfig(true);
    setSlotConfigError("");
    setSlotConfigSuccess("");

    const payload = {
      gamingCategoryId: activeCategoryId,
      startTime: slotForm.startTime,
      endTime: slotForm.endTime,
      slotDurationMinutes: Number(slotForm.slotDurationMinutes),
      slotGapMinutes: Number(slotForm.slotGapMinutes),
      isActive: 1,
      price: Number(slotForm.price),
    };

    try {
      if (slotConfigId) {
        await updateGamingSlotConfiguration({ id: slotConfigId, ...payload });
      } else {
        await createGamingSlotConfiguration(payload);
      }

      setSlotConfigSuccess("Slot configuration saved — slots have been regenerated for this category.");
      await loadSlotConfig(activeCategoryId);
      await loadCategories();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to save slot configuration.";
      setSlotConfigError(message);
    } finally {
      setIsSavingSlotConfig(false);
    }
  };

  return (
    <div className="page-container">
      <div className="space-y-4">
        <div>
          <h1 className="page-heading">Gaming Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage stations and slot configuration for each category
          </p>
        </div>

        {categoriesError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {categoriesError}
          </div>
        )}

        {isLoadingCategories ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-500">
            <Loader2 size={20} className="mr-2 animate-spin text-blue-700" />
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-12 text-center text-sm text-gray-500">
            No gaming categories found.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-200">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategoryId(category.id)}
                  className={`cursor-pointer rounded-t-md border-b-2 px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                    activeCategoryId === category.id
                      ? "border-blue-700 text-blue-700"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {category.name} Settings
                </button>
              ))}
            </div>

            {activeCategory && (
              <div className="space-y-4">
                {/* Stations */}
                <div className="surface-panel rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Monitor size={16} className="text-blue-700" />
                      <h2 className="text-base font-semibold text-gray-900">
                        {activeCategory.name} Stations
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={openCreateStationModal}
                      className="action-primary flex items-center gap-2 px-3 py-2 bg-blue-700 text-white rounded cursor-pointer transition-all duration-300 text-sm hover:shadow-lg hover:bg-blue-800"
                    >
                      <Plus size={14} />
                      New Station
                    </button>
                  </div>

                  {stationActionError && (
                    <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {stationActionError}
                    </div>
                  )}

                  <div className="mt-4 overflow-x-auto">
                    <table className="data-table w-full table-auto text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-600 border-b border-gray-100">
                          <th className="py-2 px-3">STATION CODE</th>
                          <th className="py-2 px-3">NAME</th>
                          <th className="py-2 px-3">STATUS</th>
                          <th className="py-2 px-3">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingStations ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-sm text-gray-500">
                              Loading stations...
                            </td>
                          </tr>
                        ) : stationsError ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-sm text-red-600">
                              {stationsError}
                            </td>
                          </tr>
                        ) : stations.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-sm text-gray-500">
                              No stations found for this category.
                            </td>
                          </tr>
                        ) : (
                          stations.map((station) => (
                            <tr
                              key={station.id}
                              className="border-b border-gray-100 transition-colors duration-300 hover:bg-gray-50/80"
                            >
                              <td className="py-2 px-3 align-top text-gray-700">
                                {station.stationCode}
                              </td>
                              <td className="py-2 px-3 align-top text-gray-900 font-medium">
                                {station.name}
                              </td>
                              <td className="py-2 px-3 align-top">
                                <span
                                  className={`flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                    station.isActive
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {station.isActive ? (
                                    <CheckCircle2 size={12} />
                                  ) : (
                                    <XCircle size={12} />
                                  )}
                                  {station.isActive ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className="py-2 px-3 align-top">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    title="Edit"
                                    onClick={() => openEditStationModal(station)}
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:bg-gray-50"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  {station.isActive ? (
                                    <button
                                      type="button"
                                      title="Deactivate"
                                      disabled={busyStationId === station.id}
                                      onClick={() =>
                                        setStationConfirmTarget({ type: "deactivate", station })
                                      }
                                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      title="Activate"
                                      disabled={busyStationId === station.id}
                                      onClick={() =>
                                        setStationConfirmTarget({ type: "activate", station })
                                      }
                                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-emerald-200 text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                                    >
                                      <RotateCcw size={14} />
                                    </button>
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

                {/* Slot Configuration */}
                <div className="surface-panel rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-blue-700" />
                    <h2 className="text-base font-semibold text-gray-900">
                      {activeCategory.name} Slot Configuration
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Define booking hours, slot length, and price for every{" "}
                    {activeCategory.name} station. Saving regenerates all bookable slots in
                    this category.
                  </p>

                  {isLoadingSlotConfig ? (
                    <div className="flex items-center justify-center py-8 text-sm text-gray-500">
                      <Loader2 size={18} className="mr-2 animate-spin text-blue-700" />
                      Loading configuration...
                    </div>
                  ) : (
                    <div className="mt-4">
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

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={slotForm.startTime}
                            onChange={(event) =>
                              setSlotForm((current) => ({
                                ...current,
                                startTime: event.target.value,
                              }))
                            }
                            className="field-control w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                              setSlotForm((current) => ({
                                ...current,
                                endTime: event.target.value,
                              }))
                            }
                            className="field-control w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                          {slotFormErrors.endTime && (
                            <p className="mt-1 text-xs text-red-600">{slotFormErrors.endTime}</p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Duration (min)
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
                            className="field-control w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                          {slotFormErrors.slotDurationMinutes && (
                            <p className="mt-1 text-xs text-red-600">
                              {slotFormErrors.slotDurationMinutes}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Gap (min)
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
                            className="field-control w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                          {slotFormErrors.slotGapMinutes && (
                            <p className="mt-1 text-xs text-red-600">
                              {slotFormErrors.slotGapMinutes}
                            </p>
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
                            value={slotForm.price}
                            onChange={(event) =>
                              setSlotForm((current) => ({
                                ...current,
                                price: event.target.value,
                              }))
                            }
                            className="field-control w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                          {slotFormErrors.price && (
                            <p className="mt-1 text-xs text-red-600">{slotFormErrors.price}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        Saving deletes and regenerates every bookable slot across all active{" "}
                        {activeCategory.name} stations. Do this with care if there are already
                        upcoming bookings.
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          disabled={isSavingSlotConfig}
                          onClick={handleSaveSlotConfig}
                          className="action-primary inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:opacity-60"
                        >
                          {isSavingSlotConfig ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Save size={14} />
                          )}
                          {slotConfigId ? "Save Changes" : "Create Configuration"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {stationFormModal &&
        createPortal(
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeStationFormModal();
            }}
          >
            <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {stationFormModal.mode === "create" ? "New Station" : "Edit Station"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {stationFormModal.mode === "create"
                      ? `Add a new ${activeCategory?.name ?? ""} station.`
                      : "Update this station's details."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeStationFormModal}
                  disabled={isSavingStation}
                  className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                {stationSaveError && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {stationSaveError}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Station Code
                  </label>
                  <input
                    value={stationForm.stationCode}
                    onChange={(event) =>
                      setStationForm((current) => ({
                        ...current,
                        stationCode: event.target.value,
                      }))
                    }
                    className="field-control w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. PC-01"
                  />
                  {stationFormErrors.stationCode && (
                    <p className="mt-1 text-xs text-red-600">{stationFormErrors.stationCode}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                  <input
                    value={stationForm.name}
                    onChange={(event) =>
                      setStationForm((current) => ({ ...current, name: event.target.value }))
                    }
                    className="field-control w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. Gaming PC 1"
                  />
                  {stationFormErrors.name && (
                    <p className="mt-1 text-xs text-red-600">{stationFormErrors.name}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  disabled={isSavingStation}
                  onClick={closeStationFormModal}
                  className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingStation}
                  onClick={handleSaveStation}
                  className="action-primary inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:opacity-60"
                >
                  {isSavingStation && <Loader2 size={14} className="animate-spin" />}
                  {stationFormModal.mode === "create" ? "Create Station" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {stationConfirmTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                busyStationId !== stationConfirmTarget.station.id
              ) {
                setStationConfirmTarget(null);
              }
            }}
          >
            <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start gap-4 px-6 pt-6">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                    stationConfirmTarget.type === "deactivate"
                      ? "bg-red-50 text-red-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {stationConfirmTarget.type === "deactivate" ? (
                    <AlertTriangle size={20} />
                  ) : (
                    <RotateCcw size={20} />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {stationConfirmTarget.type === "deactivate"
                      ? "Deactivate Station"
                      : "Activate Station"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {stationConfirmTarget.type === "deactivate"
                      ? "This station will no longer be bookable."
                      : "This station will become bookable again."}
                  </p>
                </div>
              </div>

              <div className="mx-6 mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                <div className="font-medium text-gray-900">{stationConfirmTarget.station.name}</div>
                <div className="mt-0.5 text-gray-500">{stationConfirmTarget.station.stationCode}</div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  disabled={busyStationId === stationConfirmTarget.station.id}
                  onClick={() => setStationConfirmTarget(null)}
                  className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busyStationId === stationConfirmTarget.station.id}
                  onClick={handleConfirmStationAction}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60 ${
                    stationConfirmTarget.type === "deactivate"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {busyStationId === stationConfirmTarget.station.id && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  {stationConfirmTarget.type === "deactivate" ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
