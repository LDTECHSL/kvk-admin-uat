import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Clock, Loader2, Save } from "lucide-react";
import {
  getSalonBusinessHours,
  updateSalonBusinessHours,
} from "@/services/salon-api";

const extractResponseData = (response: unknown): any => {
  const record =
    typeof response === "object" && response !== null
      ? (response as Record<string, unknown>)
      : {};

  const additionalData = record.additionalData as
    | Record<string, unknown>
    | undefined;

  return (
    additionalData?.response ?? (record as any).response ?? response ?? {}
  );
};

// TimeSpan values come back from the backend as "HH:mm:ss" — <input type="time">
// only understands "HH:mm".
const toTimeInputValue = (value: unknown): string => {
  const text = String(value ?? "");
  return text.length >= 5 ? text.slice(0, 5) : text;
};

export default function SalonSettings() {
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("19:00");
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState(15);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadBusinessHours = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await getSalonBusinessHours();
      const data = extractResponseData(response);

      setOpenTime(toTimeInputValue(data?.openTime) || "09:00");
      setCloseTime(toTimeInputValue(data?.closeTime) || "19:00");
      setSlotIntervalMinutes(Number(data?.slotIntervalMinutes) || 15);
    } catch (err: any) {
      console.error("Failed to load business hours:", err);
      setError("Failed to load business hours.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadBusinessHours();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (closeTime <= openTime) {
      setError("Closing time must be after the opening time.");
      return;
    }

    if (!slotIntervalMinutes || slotIntervalMinutes <= 0) {
      setError("Slot interval must be greater than zero minutes.");
      return;
    }

    try {
      setIsSaving(true);

      await updateSalonBusinessHours({
        openTime: `${openTime}:00`,
        closeTime: `${closeTime}:00`,
        slotIntervalMinutes,
      });

      setSuccessMessage("Business hours updated successfully.");
      await loadBusinessHours();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update business hours.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
            Salon Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure the salon&apos;s opening and closing hours used for
            bookings.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">
                Business Hours
              </p>
              <p className="mt-0.5 text-xs leading-5 text-blue-700">
                These hours apply to every seat that doesn&apos;t have its own
                custom schedule, and decide which time slots customers can
                select when booking on the cashier and guest site.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-sm text-gray-500">
              <Loader2 size={20} className="mr-2 animate-spin text-blue-700" />
              Loading settings...
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle2 size={16} />
                  {successMessage}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="business-open-time"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Opening Time
                  </label>
                  <input
                    id="business-open-time"
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    required
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="business-close-time"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Closing Time
                  </label>
                  <input
                    id="business-close-time"
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    required
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="business-slot-interval"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Slot Interval (minutes)
                </label>
                <input
                  id="business-slot-interval"
                  type="number"
                  min={1}
                  value={slotIntervalMinutes}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) =>
                    setSlotIntervalMinutes(Number(e.target.value))
                  }
                  required
                  className="h-11 w-full max-w-[220px] rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  How far apart bookable start times are, e.g. 15 minutes.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
