import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Moon,
  Sun,
  Beaker,
  LayoutDashboard,
  BarChart3,
  Activity,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useThemeStore } from "@/stores/themeStore";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "@/lib/navigation";
import Tooltip from "@/components/Tooltip/Tooltip";

const Sidebar = () => {
  const {
    sidebarCollapsed,
    toggleSidebar,
    isMobileMenuOpen,
    setMobileMenuOpen,
    workspace,
  } = useUIStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const logout = useAuthStore((state) => state.logout);
  const toast = useToast();
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully!");
  };

  // Items are tagged with the workspace(s) they belong to ("all" always
  // shows; everything else only shows while that workspace is selected).
  // Shared with the Welcome page's quick-start cards — see @/lib/navigation.
  const visibleNavigation = NAV_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => item.workspace === "all" || item.workspace === workspace,
      ),
    }))
    .filter((section) => section.items.length > 0);

  // Test Management (previously under Execution & Insight) and the whole
  // Automation group, tucked away under a collapsed-by-default section
  // instead of a dedicated sidebar group. Only relevant to the Diri Care
  // workspace — fully hidden while FitHub is selected.
  const comingSoonItems = [
    { to: "/test-management", icon: Beaker, label: "Test Management" },
    { to: "/automation/overview", icon: LayoutDashboard, label: "Overview" },
    { to: "/automation/runs", icon: Activity, label: "Automation Run" },
    { to: "/automation/insight", icon: BarChart3, label: "Insight" },
  ];
  const showComingSoon = workspace === "diricare";

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const renderNavItem = (item: {
    to: string;
    icon: LucideIcon;
    label: string;
  }) => (
    <Tooltip
      key={item.to}
      content={item.label}
      position="right"
      disabled={!sidebarCollapsed || isMobileMenuOpen}
    >
      <NavLink
        to={item.to}
        onClick={closeMobileMenu}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-2.5 px-3 rounded-lg transition-all group relative duration-200 overflow-hidden w-full",
            sidebarCollapsed ? "py-2" : "py-1.5",
            isActive
              ? "bg-primary/10 text-primary dark:text-primary-foreground dark:bg-primary/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-primary/5 hover:text-slate-900 dark:hover:text-slate-200",
          )
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_8px_rgba(var(--primary),0.4)]" />
            )}
            <item.icon
              size={16}
              className={cn(
                "flex-shrink-0 transition-all duration-300",
                isActive ? "scale-105" : "opacity-70 group-hover:opacity-100",
              )}
            />
            {(!sidebarCollapsed || isMobileMenuOpen) && (
              <span className="font-medium text-[13px] whitespace-nowrap animate-in fade-in slide-in-from-left-1 duration-300">
                {item.label}
              </span>
            )}
          </>
        )}
      </NavLink>
    </Tooltip>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-white dark:bg-sidebar-bg border-r border-slate-200 dark:border-border-brand transition-all duration-300 z-50 flex flex-col",
          "lg:translate-x-0",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
          sidebarCollapsed ? "lg:w-16" : "lg:w-52",
          "w-52", // Default width for mobile
        )}
      >
        {/* Logo and Collapse Toggle */}
        <div className="p-2 pb-0 flex items-center h-[64px] relative">
          <div className="flex items-center gap-0 px-1">
            {!sidebarCollapsed || isMobileMenuOpen ? (
              <img
                src="/assets/icons/logo-testgen.png"
                alt="TestGen"
                className="h-10 w-auto object-contain animate-in fade-in duration-300"
              />
            ) : (
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-lg">
                <img
                  src="/assets/icons/logo-testgen-no-text.png"
                  alt="TestGen"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          <button
            onClick={toggleSidebar}
            className={cn(
              "hidden lg:flex items-center justify-center w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:bg-surface-dark dark:border-border-brand dark:hover:text-slate-300 dark:hover:bg-primary/20 transition-all shadow-sm absolute top-1/2 -translate-y-1/2 z-50",
              sidebarCollapsed ? "-right-3.5" : "right-3",
            )}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {visibleNavigation.map((section, idx) => (
            <div
              key={section.group}
              className={cn(
                idx !== 0 && (sidebarCollapsed ? "mt-1" : "mt-3"),
              )}
            >
              {!sidebarCollapsed || isMobileMenuOpen ? (
                <h3 className="px-3 mb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] animate-in fade-in duration-500">
                  {section.group}
                </h3>
              ) : (
                <div className="h-4 flex items-center justify-center">
                  <div className="w-4 h-[1px] bg-slate-100 dark:bg-slate-800/50" />
                </div>
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => renderNavItem(item))}
              </div>
            </div>
          ))}

          {/* Coming Soon (collapsible, collapsed by default) */}
          {showComingSoon && (
            <div className={cn(sidebarCollapsed ? "mt-1" : "mt-3")}>
              {!sidebarCollapsed || isMobileMenuOpen ? (
                <button
                  type="button"
                  onClick={() => setComingSoonOpen((v) => !v)}
                  className="flex items-center justify-between w-full px-3 mb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <span>Coming Soon</span>
                  {comingSoonOpen ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                </button>
              ) : (
                <div className="h-4 flex items-center justify-center">
                  <div className="w-4 h-[1px] bg-slate-100 dark:bg-slate-800/50" />
                </div>
              )}

              {(!sidebarCollapsed || isMobileMenuOpen) && comingSoonOpen && (
                <div className="space-y-0.5">
                  {comingSoonItems.map((item) => renderNavItem(item))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="p-2.5 space-y-0.5 border-t border-slate-100 dark:border-border-brand">
          <Tooltip 
            content={isDarkMode ? "Light Mode" : "Dark Mode"} 
            position="right" 
            disabled={!sidebarCollapsed || isMobileMenuOpen}
          >
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-primary/10 hover:text-slate-900 dark:hover:text-slate-200 transition-all group"
              title={(!sidebarCollapsed || isMobileMenuOpen) ? (isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode") : undefined}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              {(!sidebarCollapsed || isMobileMenuOpen) && (
                <span className="font-medium text-[13px] whitespace-nowrap">
                  {isDarkMode ? "Light Mode" : "Dark Mode"}
                </span>
              )}
            </button>
          </Tooltip>

          <Tooltip
            content="Log Out"
            position="right"
            disabled={!sidebarCollapsed || isMobileMenuOpen}
          >
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all group"
              title={(!sidebarCollapsed || isMobileMenuOpen) ? "Log Out" : undefined}
            >
              <LogOut size={16} />
              {(!sidebarCollapsed || isMobileMenuOpen) && (
                <span className="font-medium text-[13px] whitespace-nowrap">
                  Log Out
                </span>
              )}
            </button>
          </Tooltip>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
