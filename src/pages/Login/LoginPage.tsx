import { useState, useEffect, type FormEvent } from "react";
import { Lock, Eye, EyeOff, Hash, Sparkles, Diamond, Waves, Bug, Activity } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Sparkles,
    label: "Generate & review test cases with AI",
    subtitle: "Powered by GPT-4o & Claude",
  },
  {
    icon: Diamond,
    label: "Create QA tasks and sync with Jira",
    subtitle: "One-click sprint task creation",
  },
  {
    icon: Waves,
    label: "Export product knowledge to Confluence",
    subtitle: "Auto-formatted, ready to publish",
  },
  {
    icon: Bug,
    label: "Analyze and report bugs with AI",
    subtitle: "Structured, actionable bug reports",
  },
  {
    icon: Activity,
    label: "Track releases and automation runs",
    subtitle: "Real-time pipeline visibility",
  },
];

const SLIDE_INTERVAL_MS = 3500;

const LoginPage = () => {
  const { login, error } = useAuthStore();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const toast = useToast();

  useEffect(() => {
    const id = setInterval(() => {
      setActiveFeature((i) => (i + 1) % FEATURES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    const success = await login(password);
    setSubmitting(false);
    if (success) {
      toast.success("Logged in successfully!");
    }
  };

  return (
    <div className="flex min-h-screen bg-surface dark:bg-surface-dark">
      {/* Left: promotional panel, background echoes the Welcome page's subtle corner gradients */}
      <div className="hidden lg:flex lg:w-3/5">
        <div className="relative flex flex-1 flex-col overflow-hidden px-14 py-14 bg-white dark:bg-surface-card">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-20 dark:opacity-25"
            style={{
              background: "radial-gradient(circle, #2563eb 0%, transparent 70%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20 dark:opacity-25"
            style={{
              background: "radial-gradient(circle, #11D4B7 0%, transparent 70%)",
            }}
          />

          {/* Logo pinned to the top */}
          <div className="relative z-10 self-start">
            <img
              src="/assets/icons/logo-testgen.png"
              alt="TestGen"
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* Promotional content, centered in the remaining space */}
          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <span className="mb-5 self-start inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-surface-card px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles size={14} />
              Next-Gen Autonomous QA
            </span>
            <div className="flex items-start gap-3">
              <Hash size={38} strokeWidth={3} className="text-[#11D4B7] flex-shrink-0 mt-1" />
              <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15] max-w-lg text-slate-900 dark:text-white">
                Ship quality faster with{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: "linear-gradient(90deg, #2563eb 0%, #11D4B7 100%)",
                  }}
                >
                  AI-powered QA.
                </span>
              </h1>
            </div>
            <p className="mt-5 text-lg text-slate-600 dark:text-slate-300 max-w-md">
              TestGen helps your team generate test cases, catch bugs, and
              manage QA workflows across Jira and Confluence — all powered by
              AI.
            </p>

            {/* Auto-sliding feature carousel — three cards fully visible, center card in focus.
                Cards share one grid cell so the row height follows the tallest card's content. */}
            <div className="relative mt-10 grid grid-cols-[minmax(0,1fr)] w-full overflow-hidden">
              {FEATURES.map((item, i) => {
                const len = FEATURES.length;
                // Shortest circular distance from the active card, e.g. -2..-1,0,1..2
                let diff = (i - activeFeature) % len;
                if (diff > len / 2) diff -= len;
                if (diff < -len / 2) diff += len;

                const isCenter = diff === 0;
                const isVisible = Math.abs(diff) <= 1;
                // Cards are 32% wide; margin-left percentages resolve against the container width,
                // so 34% puts the center card in the middle and each step shifts one card slot
                const offset = `${34 + diff * 34}%`;

                return (
                  <div
                    key={item.label}
                    className={cn(
                      "[grid-area:1/1] justify-self-start w-[32%] flex flex-col gap-2 p-4 rounded-2xl border border-slate-200 dark:border-border-brand bg-white dark:bg-surface-card transition-all duration-500 ease-out",
                      isCenter
                        ? "opacity-100 scale-100 z-20"
                        : isVisible
                          ? "opacity-60 scale-95 z-10"
                          : "opacity-0 scale-75 z-0 pointer-events-none",
                    )}
                    style={{ marginLeft: offset }}
                  >
                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[13px] font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                        {item.label}
                      </span>
                      <span className="block mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Slide indicators */}
            <div className="mt-4 flex items-center justify-center gap-2">
              {FEATURES.map((item, i) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveFeature(i)}
                  aria-label={`Show feature ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === activeFeature
                      ? "w-6 bg-primary"
                      : "w-1.5 bg-slate-300 dark:bg-slate-600",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="relative z-10 text-xs text-slate-400 dark:text-slate-500">
            <p>Developed by Agus Budiman</p>
            <p className="mt-0.5">
              © {new Date().getFullYear()} TestGen. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex flex-1 lg:w-2/5 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-left">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Welcome back 👋🏻
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter the password to continue
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6"
          >
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative mb-4">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type={showPassword ? "text" : "password"}
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-200 dark:border-border-brand bg-slate-50 dark:bg-surface-dark text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !password}
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;