import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Gamepad2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { login } from "@/services/auth-api";
import { Alert } from "@/components/ui/alert";
import { createPortal } from "react-dom";

export default function Login() {
  const [formData, setFormData] = useState({
    userId: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [pageAlert, setPageAlert] = useState<{
    visible: boolean;
    variant?: "success" | "error" | "warning" | "info";
    title?: string;
    description?: string;
  }>({ visible: false });
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    try {
      const admin = await login(formData.userId, formData.password);
      localStorage.setItem("admin", JSON.stringify(admin));
      navigate("/main/dashboard");
    } catch (error) {
      setPageAlert({
        visible: true,
        variant: "error",
        title: "Login Failed",
        description: "Invalid user ID or password.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-screen max-h-screen overflow-hidden bg-[#eef5ff] p-2 sm:p-3 lg:p-4">
      <section className="relative mx-auto grid h-full max-h-full max-w-[1500px] overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_24px_80px_rgba(30,64,175,0.16)] lg:grid-cols-[0.95fr_1.05fr]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,rgba(37,99,235,0.08),transparent_22%),radial-gradient(circle_at_92%_90%,rgba(59,130,246,0.08),transparent_24%)]"
        />

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

        {loading && createPortal(
          <div className="fixed inset-0 z-[9999999999] flex items-center justify-center bg-black/60 backdrop-blur-md">
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
              <p className="text-sm text-white font-medium">Loading</p>
            </div>
          </div>,
          document.body
        )}

        {/* Left side */}
        <div className="relative z-10 flex min-h-0 flex-col px-5 py-4 sm:px-8 sm:py-5 lg:px-12 xl:px-16">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-500/25">
              <Trophy size={20} />
            </div>

            <div>
              <h1 className="text-base font-bold text-slate-950 sm:text-lg">
                KVK Arena
              </h1>
              <p className="text-[11px] font-medium text-slate-500">
                Admin Management Portal
              </p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center">
            <div className="w-full max-w-[430px]">
              <div className="mb-4 flex justify-center lg:mb-5">
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-blue-500/25 blur-xl" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-xl shadow-blue-500/30">
                    <LockKeyhole size={25} />
                  </div>
                </div>
              </div>

              <div className="mb-5 text-center">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-900">
                  Welcome back Admin !
                </p>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Login to your account
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label
                    htmlFor="userId"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    User ID
                  </label>

                  <div className="group relative">
                    <User size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-900"
                    />

                    <input
                      id="userId"
                      value={formData.userId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          userId: e.target.value,
                        }))
                      }
                      type="text"
                      placeholder="Enter your User ID"
                      autoComplete="username"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Password
                    </label>

                    {/* <button
                      type="button"
                      className="cursor-pointer text-xs font-semibold text-blue-900 transition hover:text-blue-800"
                    >
                      Forgot password?
                    </button> */}
                  </div>

                  <div className="group relative">
                    <LockKeyhole
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-900"
                    />

                    <input
                      id="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-900"
                    >
                      {showPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="group flex mt-4 h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-600/25 active:translate-y-0"
                >
                  Login
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              </form>

              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck size={14} className="text-emerald-500" />
                Secure access protected by encrypted authentication
              </div>
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-400 sm:text-[11px]">
            © 2026 KVK Arena. All rights reserved.
          </p>
        </div>

        {/* Right side */}
        <div className="relative z-10 hidden min-h-0 p-3 lg:block">
          <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] bg-gradient-to-br from-[#eaf3ff] via-[#d9ebff] to-[#c5e1ff] px-8 py-7 xl:px-12">
            <div
              aria-hidden="true"
              className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl"
            />

            <div className="relative text-center">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-3 py-1 text-[11px] font-semibold text-blue-700 shadow-sm backdrop-blur">
                <Sparkles size={13} />
                Smart arena management
              </div>

              <h3 className="text-2xl font-bold text-slate-950 xl:text-3xl">
                Manage Everything{" "}
                <span className="text-blue-900">In One Place</span>
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-slate-600 xl:text-sm">
                Control bookings, memberships, payments and arena operations
                from one secure administrative workspace.
              </p>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              <div className="relative h-[330px] w-[330px] xl:h-[390px] xl:w-[390px]">
                <div className="absolute inset-[7%] rounded-full border border-white/80" />
                <div className="absolute inset-[20%] rounded-full border border-white/90" />
                <div className="absolute inset-[33%] rounded-full border border-white" />

                <div className="absolute inset-0 m-auto flex h-24 w-24 items-center justify-center rounded-[30px] border-8 border-white/50 bg-gradient-to-br from-blue-500 to-blue-800 text-white shadow-[0_20px_50px_rgba(37,99,235,0.38)] backdrop-blur">
                  <Gamepad2 size={41} />
                </div>

                <FeatureBubble
                  className="left-[2%] top-[42%] bg-gradient-to-br from-green-500 to-green-700 text-white shadow-[0_12px_30px_rgba(37,99,235,0.22)]"
                  icon={<Trophy size={18} />}
                  label="Courts"
                />

                <FeatureBubble
                  className="right-[1%] top-[43%] bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-[0_12px_30px_rgba(37,99,235,0.22)]"
                  icon={<ShieldCheck size={18} />}
                  label="Secure"
                />

                <FeatureBubble
                  className="left-[43%] top-[2%] bg-gradient-to-br from-yellow-500 to-yellow-700 text-white shadow-[0_12px_30px_rgba(37,99,235,0.22)]"
                  icon={<Gamepad2 size={18} />}
                  label="Gaming"
                />

                <FeatureBubble
                  className="bottom-[3%] left-[42%] bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-[0_12px_30px_rgba(37,99,235,0.22)]"
                  icon={<CheckCircle2 size={18} />}
                  label="Bookings"
                />

                <FeatureBubble
                  className="right-[14%] top-[17%] bg-gradient-to-br from-cyan-500 to-cyan-700 text-white shadow-[0_12px_30px_rgba(37,99,235,0.22)]"
                  icon={<Sparkles size={18} />}
                  label="Members"
                />

                <FeatureBubble
                  className="bottom-[16%] left-[13%] bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 text-white shadow-[0_12px_30px_rgba(37,99,235,0.22)]"
                  icon={<LockKeyhole size={18} />}
                  label="Payments"
                />
              </div>
            </div>

            <div className="relative grid grid-cols-3 gap-3">
              <StatCard value="5+" label="Arena modules" />
              <StatCard value="24/7" label="System access" />
              <StatCard value="100%" label="Secure control" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

type FeatureBubbleProps = {
  className: string;
  icon: React.ReactNode;
  label: string;
};

function FeatureBubble({ className, icon, label }: FeatureBubbleProps) {
  return (
    <div
      className={`absolute flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-white/70 bg-white text-blue-900 shadow-[0_12px_30px_rgba(37,99,235,0.22)] ${className}`}
      title={label}
    >
      {icon}
    </div>
  );
}

type StatCardProps = {
  value: string;
  label: string;
};

function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/50 px-3 py-3 text-center shadow-sm backdrop-blur">
      <p className="text-lg font-bold text-blue-700">{value}</p>
      <p className="mt-0.5 text-[10px] font-medium text-slate-600 xl:text-[11px]">
        {label}
      </p>
    </div>
  );
}