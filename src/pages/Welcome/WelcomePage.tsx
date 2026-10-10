import { NavLink } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { getTopWorkspaceMenus } from "@/lib/navigation";

const WelcomePage = () => {
  const workspace = useUIStore((state) => state.workspace);
  const topMenus = getTopWorkspaceMenus(workspace, 3);

  return (
    <div className="relative flex flex-col items-center justify-center text-center w-full h-full overflow-hidden animate-slide-up">
      {/* Subtle corner gradients echoing the logo's blue → teal palette */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-20 dark:opacity-25"
        style={{
          background:
            "radial-gradient(circle, #2563eb 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-20 dark:opacity-25"
        style={{
          background:
            "radial-gradient(circle, #11D4B7 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <img
          src="/assets/icons/logo-testgen.png"
          alt="TestGen Logo"
          className="h-14 sm:h-16 w-auto object-contain mb-6"
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Welcome to TestGen
        </h1>
        <p className="mt-3 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Your AI-powered toolkit for generating test cases, reviewing them,
          analyzing bugs, and managing QA workflows — all in one place.
        </p>

        {topMenus.length > 0 && (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl px-4">
            {topMenus.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="group text-left p-5 rounded-2xl border border-slate-200 dark:border-border-brand bg-white dark:bg-surface-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all"
              >
                <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                  <item.icon size={17} />
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
                  {item.label}
                  <ArrowRight
                    size={14}
                    className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {item.description}
                </p>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomePage;
