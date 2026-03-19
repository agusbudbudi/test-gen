import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: "brand" | "teal" | "red" | "yellow" | "purple" | "blue";
}

export const StatCard = ({
  icon,
  label,
  value,
  color = "brand",
}: StatCardProps) => {
  const colorClasses = {
    brand: "text-primary bg-primary/10 border-primary/20",
    teal: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    red: "text-rose-600 bg-rose-500/10 border-rose-500/20",
    yellow: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    purple: "text-purple-600 bg-purple-500/10 border-purple-500/20",
    blue: "text-blue-600 bg-blue-500/10 border-blue-500/20",
  };

  return (
    <div className="bg-white dark:bg-sidebar-bg border border-slate-200 dark:border-border-brand rounded-2xl p-4 flex items-center gap-4 transition-all h-full">
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center border shrink-0",
          colorClasses[color],
        )}
      >
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5 truncate">
          {label}
        </span>
        <span className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
          {value}
        </span>
      </div>
    </div>
  );
};
