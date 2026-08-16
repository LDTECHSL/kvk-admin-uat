import { Clock3, Sparkles } from "lucide-react";

export default function GymDashboard() {
  return (
    <div className="p-6">
      <div className="flex min-h-[calc(100vh-120px)] py-12 items-center justify-center rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50 shadow-sm">
        <div className="mx-auto max-w-xl text-center">

          {/* Badge */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-blue-900 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
            <Sparkles size={16} />
            Dashboard Coming Soon
          </div>

          {/* Title */}
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900">
            Under Construction
          </h1>

          {/* Description */}
          <p className="mt-4 text-base leading-7 text-slate-600">
            We're building a modern analytics dashboard with real-time
            statistics, business insights, financial summaries, bookings,
            revenue reports, and system monitoring.
          </p>

          {/* Features Preview */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-3xl font-bold text-blue-900">📊</div>
              <h3 className="mt-3 font-semibold text-slate-900">
                Analytics
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Revenue & booking insights
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-3xl font-bold text-blue-900">⚡</div>
              <h3 className="mt-3 font-semibold text-slate-900">
                Live Status
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Real-time system monitoring
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-3xl font-bold text-blue-900">📈</div>
              <h3 className="mt-3 font-semibold text-slate-900">
                Reports
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Daily & monthly performance
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            <Clock3 size={18} />
            This module will be available in a future update.
          </div>
        </div>
      </div>
    </div>
  );
}