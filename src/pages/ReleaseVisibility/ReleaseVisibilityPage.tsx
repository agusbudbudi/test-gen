import React, { useState } from "react";
import {
  Search,
  Table as TableIcon,
  ExternalLink,
  User,
  Layers,
  RefreshCw,
  Box,
  Calendar,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { useReleaseVisibility } from "@/hooks/useReleaseVisibility";
import { cn } from "@/lib/utils";

const ReleaseVisibilityPage = () => {
  const [sprint, setSprint] = useState("");
  const [assignee, setAssignee] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const { queryTickets, tickets, loading } = useReleaseVisibility();

  const handleQuery = () => {
    queryTickets(sprint, assignee);
  };

  const handleCopy = () => {
    if (tickets.length === 0) return;

    // Format content as tab-separated values (TSV) for spreadsheets
    // Grouped by assignee
    const grouped = tickets.reduce(
      (acc, ticket) => {
        const group = ticket.assignee || "Unassigned";
        if (!acc[group]) acc[group] = [];
        acc[group].push(ticket);
        return acc;
      },
      {} as Record<string, typeof tickets>,
    );

    const content = Object.entries(grouped)
      .map(([assigneeName, groupTickets]) => {
        const headerRow = `Assignee: ${assigneeName}\t\t\t\t`; // Column headers placeholder
        const rows = groupTickets.map((t) => {
          const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
          const formattedDemoFlow = t.demoFlow
            .split("\n")
            .map((line) => `- ${line.trim().replace(/^[#*-]\s*/, "")}`)
            .join("\n");
          return [
            t.url,
            escape(t.title),
            escape(t.area),
            escape(t.status),
            escape(formattedDemoFlow),
          ].join("\t");
        });
        return [headerRow, ...rows].join("\n");
      })
      .join("\n\n");

    navigator.clipboard.writeText(content);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          Release Visibility
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Query tickets ready to deploy from current sprint with AI-powered area
          detection.
        </p>
      </div>

      {/* Query Filters */}
      <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-primary dark:text-primary-foreground uppercase tracking-widest px-1 flex items-center gap-2">
              <Calendar size={14} />
              Sprint Name / ID
            </label>
            <input
              type="text"
              value={sprint}
              onChange={(e) => setSprint(e.target.value)}
              placeholder="e.g. 2026-1"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-primary dark:text-primary-foreground uppercase tracking-widest px-1 flex items-center gap-2">
              <User size={14} />
              Assigned Email
            </label>
            <input
              type="email"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="e.g. user1@test.com, user2@test.com"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={handleQuery}
            disabled={loading || !sprint || !assignee}
            className="h-[42px] px-6 bg-primary hover:bg-primary/90 text-white dark:text-sidebar-bg rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
            <span>{loading ? "Querying..." : "Search Tickets"}</span>
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-border-brand flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-sidebar-bg/50">
          <div className="flex items-center gap-2">
            <TableIcon size={18} className="text-slate-400" />
            <h3 className="font-semibold text-slate-800 dark:text-white text-sm">
              Tickets Ready to Deploy
            </h3>
            {tickets.length > 0 && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary dark:text-primary-foreground rounded-full text-[10px] font-bold">
                {tickets.length}
              </span>
            )}
          </div>
          
          {tickets.length > 0 && (
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all w-full sm:w-auto",
                copySuccess
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 dark:bg-surface-dark text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-primary/20",
              )}
            >
              {copySuccess ? <Check size={14} /> : <Copy size={14} />}
              {copySuccess ? "Copied!" : "Copy to Spreadsheet"}
            </button>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-sidebar-bg/30 border-b border-slate-100 dark:border-border-brand">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  JIRA URL
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Ticket Title
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    Detect Area
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary dark:text-primary-foreground text-[8px] font-black tracking-normal border border-primary/20">
                      <Sparkles size={8} /> AI SUGGESTIONS
                    </span>
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    Suggestions Demo Flow
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary dark:text-primary-foreground text-[8px] font-black tracking-normal border border-primary/20">
                      <Sparkles size={8} /> AI SUGGESTIONS
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-border-brand/30">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw
                        size={32}
                        className="text-primary/40 animate-spin"
                      />
                      <p className="text-sm text-slate-400 animate-pulse font-medium">
                        Fetching tickets and analyzing functional areas...
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && tickets.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-20 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <Box size={48} />
                      <p className="text-sm font-medium">
                        No tickets found. Enter query details above.
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                Object.entries(
                  tickets.reduce(
                    (acc, ticket) => {
                      const group = ticket.assignee || "Unassigned";
                      if (!acc[group]) acc[group] = [];
                      acc[group].push(ticket);
                      return acc;
                    },
                    {} as Record<string, typeof tickets>,
                  ),
                ).map(([groupName, groupTickets]) => (
                  <React.Fragment key={groupName}>
                    {/* Group Header */}
                    <tr className="bg-slate-100/30 dark:bg-surface-dark/30 border-y border-slate-100 dark:border-border-brand">
                      <td colSpan={5} className="px-6 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                            {groupName.charAt(0)}
                          </div>
                          <span className="text-xs text-slate-600 dark:text-slate-300">
                            Assignee:{" "}
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                              {groupName}
                            </span>
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-sidebar-bg text-slate-500 dark:text-slate-400 rounded-md font-bold">
                            {groupTickets.length} tickets
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* Group Items */}
                    {groupTickets.map((ticket) => (
                      <tr
                        key={ticket.key}
                        className="hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <a
                            href={ticket.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-primary font-bold hover:underline text-xs whitespace-nowrap"
                          >
                            {ticket.key}
                            <ExternalLink
                              size={12}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </a>
                        </td>
                        <td className="px-6 py-4 max-w-xs xl:max-w-md">
                          <div
                            className="text-sm text-slate-700 dark:text-slate-200 font-medium whitespace-normal"
                            title={ticket.title}
                          >
                            {ticket.title}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-500/20 whitespace-nowrap">
                            <Layers size={12} />
                            {ticket.area}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20 whitespace-nowrap">
                            {ticket.status}
                          </div>
                        </td>
                        <td className="px-6 py-4 min-w-[250px]">
                          <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-surface-dark/50 p-3 rounded-lg">
                            {ticket.demoFlow.split("\n").map((line, i) => (
                              <div
                                key={i}
                                className="flex gap-2 mb-1 last:mb-0"
                              >
                                <span className="text-primary font-bold">
                                  •
                                </span>
                                <span>{line.replace(/^[#*-]\s*/, "")}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-slate-100 dark:divide-border-brand/30">
          {loading && (
            <div className="px-6 py-20 text-center">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw size={32} className="text-primary/40 animate-spin" />
                <p className="text-sm text-slate-400 animate-pulse font-medium">
                  Analyzing tickets for mobile...
                </p>
              </div>
            </div>
          )}

          {!loading && tickets.length === 0 && (
            <div className="px-6 py-20 text-center text-slate-400">
              <div className="flex flex-col items-center gap-3 opacity-40">
                <Box size={48} />
                <p className="text-sm font-medium">No tickets found.</p>
              </div>
            </div>
          )}

          {!loading &&
            Object.entries(
              tickets.reduce(
                (acc, ticket) => {
                  const group = ticket.assignee || "Unassigned";
                  if (!acc[group]) acc[group] = [];
                  acc[group].push(ticket);
                  return acc;
                },
                {} as Record<string, typeof tickets>,
              ),
            ).map(([groupName, groupTickets]) => (
              <div key={groupName} className="flex flex-col">
                <div className="px-4 py-2 bg-slate-50/80 dark:bg-sidebar-bg/50 border-y border-slate-100 dark:border-border-brand flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold uppercase">
                      {groupName.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {groupName}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {groupTickets.length}
                  </span>
                </div>
                {groupTickets.map((ticket) => (
                  <div key={ticket.key} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={ticket.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-bold text-xs hover:underline flex items-center gap-1"
                      >
                        {ticket.key} <ExternalLink size={10} />
                      </a>
                      <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/10">
                        {ticket.status}
                      </div>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                      {ticket.title}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold border border-purple-500/10">
                        <Layers size={10} /> {ticket.area}
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-surface-dark/40 p-3 rounded-xl border border-slate-100 dark:border-border-brand/30">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-2 flex items-center gap-1.5">
                        <Sparkles size={10} className="text-primary" /> Suggetion Demo Flow
                      </div>
                      <div className="space-y-1.5">
                        {ticket.demoFlow.split("\n").map((line, i) => (
                          <div key={i} className="flex gap-2 text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                            <span className="text-primary font-bold shrink-0">•</span>
                            <span>{line.replace(/^[#*-]\s*/, "")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ReleaseVisibilityPage;
