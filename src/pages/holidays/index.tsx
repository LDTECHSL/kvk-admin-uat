import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  X,
  Loader2,
  Trash2,
  AlertTriangle,
  Save,
  CalendarCheck,
} from "lucide-react";
import {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from "@/services/holidays-api";

type Holiday = {
  id: string;
  year: string;
  month: string;
  day: string;
  description: string;
  isActive: boolean;
  isImported: boolean;
  source: string;
  durationDays: number;
};

type DayCell = {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad2 = (n: number) => String(n).padStart(2, "0");

const dateKey = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const holidayKey = (h: Holiday) => `${h.year}-${h.month}-${h.day}`;

const buildMonthGrid = (year: number, month: number): DayCell[] => {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayKey = dateKey(today);

  const cells: DayCell[] = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, daysInPrevMonth - i);
    cells.push({ date, key: dateKey(date), inMonth: false, isToday: dateKey(date) === todayKey });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({ date, key: dateKey(date), inMonth: true, isToday: dateKey(date) === todayKey });
  }

  let nextDay = 1;
  while (cells.length < 42) {
    const date = new Date(year, month + 1, nextDay);
    cells.push({ date, key: dateKey(date), inMonth: false, isToday: dateKey(date) === todayKey });
    nextDay++;
  }

  return cells;
};

type FormState = {
  date: string;
  description: string;
  durationDays: string;
  isActive: boolean;
};

const emptyForm = (date: string): FormState => ({
  date,
  description: "",
  durationDays: "1",
  isActive: true,
});

export default function Holidays() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; holiday?: Holiday } | null>(
    null,
  );
  const [form, setForm] = useState<FormState>(emptyForm(dateKey(today)));
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    loadHolidays(viewYear);
  }, [viewYear]);

  const loadHolidays = async (year: number) => {
    setIsLoading(true);
    setError("");

    try {
      const [prev, current, next] = await Promise.all([
        getHolidays(year - 1),
        getHolidays(year),
        getHolidays(year + 1),
      ]);

      const unwrap = (response: any) =>
        Array.isArray(response) ? response : Array.isArray(response?.response) ? response.response : [];

      const merged = [...unwrap(prev), ...unwrap(current), ...unwrap(next)];

      const mapped: Holiday[] = merged.map((h: any) => ({
        id: h.id,
        year: h.year ?? "",
        month: h.month ?? "",
        day: h.day ?? "",
        description: h.description ?? "",
        isActive: !!h.isActive,
        isImported: !!h.isImported,
        source: h.source ?? "",
        durationDays: Number(h.durationDays ?? 1),
      }));

      setHolidays(mapped);
    } catch {
      setHolidays([]);
      setError("Failed to load holidays.");
    } finally {
      setIsLoading(false);
    }
  };

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, Holiday[]>();
    for (const holiday of holidays) {
      if (!holiday.isActive) continue;
      const key = holidayKey(holiday);
      const existing = map.get(key) ?? [];
      existing.push(holiday);
      map.set(key, existing);
    }
    return map;
  }, [holidays]);

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const upcomingHolidays = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return holidays
      .filter((h) => h.isActive)
      .map((h) => ({ holiday: h, date: new Date(`${h.year}-${h.month}-${h.day}T00:00:00`) }))
      .filter((entry) => !Number.isNaN(entry.date.getTime()) && entry.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 8);
  }, [holidays]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const openCreateModal = (presetDateKey?: string) => {
    setForm(emptyForm(presetDateKey ?? dateKey(today)));
    setFormErrors({});
    setSaveError("");
    setFormModal({ mode: "create" });
  };

  const openEditModal = (holiday: Holiday) => {
    setForm({
      date: `${holiday.year}-${holiday.month}-${holiday.day}`,
      description: holiday.description,
      durationDays: String(holiday.durationDays || 1),
      isActive: holiday.isActive,
    });
    setFormErrors({});
    setSaveError("");
    setFormModal({ mode: "edit", holiday });
  };

  const closeFormModal = () => {
    if (isSaving) return;
    setFormModal(null);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormState, string>> = {};

    if (!form.date) errors.date = "Date is required.";
    if (!form.description.trim()) errors.description = "Description is required.";

    const duration = Number(form.durationDays);
    if (!Number.isInteger(duration) || duration <= 0) {
      errors.durationDays = "Enter a whole number of days greater than zero.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !formModal) return;

    setIsSaving(true);
    setSaveError("");

    const [y, m, d] = form.date.split("-");

    try {
      if (formModal.mode === "create") {
        await createHoliday({
          id: crypto.randomUUID(),
          year: y,
          month: m,
          day: d,
          description: form.description.trim(),
          isActive: form.isActive,
          isImported: false,
          source: "",
          durationDays: Number(form.durationDays),
        });
      } else if (formModal.holiday) {
        await updateHoliday(formModal.holiday.id, {
          id: formModal.holiday.id,
          year: y,
          month: m,
          day: d,
          description: form.description.trim(),
          isActive: form.isActive,
          isImported: formModal.holiday.isImported,
          source: formModal.holiday.source,
          durationDays: Number(form.durationDays),
        });
      }

      await loadHolidays(viewYear);
      setFormModal(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to save holiday.";
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
      await deleteHoliday(deleteTarget.id);
      await loadHolidays(viewYear);
      setDeleteTarget(null);
      setFormModal(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to delete holiday.";
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="page-container">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="page-heading">Holidays</h1>
            <p className="text-sm text-gray-500 mt-1">
              Maintain the company holiday calendar
            </p>
          </div>

          <button
            type="button"
            onClick={() => openCreateModal()}
            className="action-primary flex items-center gap-2 px-3 py-2.5 bg-blue-700 text-white rounded cursor-pointer transition-all duration-300 text-sm hover:shadow-lg hover:bg-blue-800"
          >
            <Plus size={16} />
            Add Holiday
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
          {/* Calendar */}
          <div className="surface-panel rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-blue-700" />
                <h2 className="text-base font-semibold text-gray-900">{monthLabel}</h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToToday}
                  className="cursor-pointer rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={goToPrevMonth}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:bg-gray-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-sm text-gray-500">
                <Loader2 size={20} className="mr-2 animate-spin text-blue-700" />
                Loading calendar...
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-7 gap-1 pb-2">
                  {WEEKDAYS.map((day) => (
                    <div
                      key={day}
                      className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {grid.map((cell) => {
                    const cellHolidays = holidaysByDate.get(cell.key) ?? [];
                    const hasHoliday = cellHolidays.length > 0;

                    return (
                      <button
                        key={cell.key}
                        type="button"
                        onClick={() =>
                          hasHoliday ? openEditModal(cellHolidays[0]) : openCreateModal(cell.key)
                        }
                        className={`group relative flex h-20 cursor-pointer flex-col items-start rounded-lg border p-1.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                          hasHoliday
                            ? "border-blue-200 bg-blue-50 hover:bg-blue-100/80"
                            : cell.inMonth
                              ? "border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                              : "border-transparent bg-gray-50/60"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                            cell.isToday
                              ? "bg-blue-700 text-white"
                              : cell.inMonth
                                ? "text-gray-700"
                                : "text-gray-300"
                          }`}
                        >
                          {cell.date.getDate()}
                        </span>

                        {hasHoliday && (
                          <span className="mt-1 line-clamp-2 text-[11px] font-medium leading-tight text-blue-800">
                            {cellHolidays[0].description}
                          </span>
                        )}

                        {!hasHoliday && cell.inMonth && (
                          <span className="mt-1 hidden items-center gap-1 text-[10px] text-blue-600 group-hover:flex">
                            <Plus size={10} /> Add
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Upcoming list */}
          <div className="surface-panel rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="mb-3 flex items-center gap-2">
              <CalendarCheck size={16} className="text-blue-700" />
              <h3 className="text-sm font-semibold text-gray-900">Upcoming Holidays</h3>
            </div>

            {upcomingHolidays.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">No upcoming holidays.</p>
            ) : (
              <div className="space-y-2">
                {upcomingHolidays.map(({ holiday, date }) => (
                  <button
                    key={holiday.id}
                    type="button"
                    onClick={() => openEditModal(holiday)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-left transition-all duration-300 hover:bg-blue-50/60"
                  >
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-blue-700 text-white">
                      <span className="text-[9px] font-semibold uppercase leading-none">
                        {date.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-sm font-bold leading-none">{date.getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {holiday.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {date.toLocaleDateString("en-US", { weekday: "long" })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
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
                    {formModal.mode === "create" ? "Add Holiday" : "Edit Holiday"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {formModal.mode === "create"
                      ? "Add a new date to the holiday calendar."
                      : "Update this holiday's details."}
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, date: event.target.value }))
                    }
                    className="field-control w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {formErrors.date && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.date}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <input
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    className="field-control w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. New Year's Day"
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.description}</p>
                  )}
                </div>

                {formModal.mode === "create" && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      step="1"
                      value={form.durationDays}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, durationDays: event.target.value }))
                      }
                      className="field-control w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    {formErrors.durationDays && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.durationDays}</p>
                    )}
                  </div>
                )}

                <label className="flex items-center gap-2 text-sm text-gray-700">
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

              <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
                {formModal.mode === "edit" && formModal.holiday ? (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setDeleteTarget(formModal.holiday!)}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-3">
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
                    {isSaving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    {formModal.mode === "create" ? "Add Holiday" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {deleteTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
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
                  <h2 className="text-base font-semibold text-gray-900">Delete Holiday</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    This permanently removes the holiday from the calendar.
                  </p>
                </div>
              </div>

              <div className="mx-6 mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                <div className="font-medium text-gray-900">{deleteTarget.description}</div>
                <div className="mt-0.5 text-gray-500">
                  {deleteTarget.year}-{deleteTarget.month}-{deleteTarget.day}
                </div>
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
