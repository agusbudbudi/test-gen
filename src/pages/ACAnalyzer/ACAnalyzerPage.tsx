import React, { useRef, useEffect } from "react";
import {
  Trash2,
  Copy,
  ClipboardList,
  Sparkles,
  Bot,
  ExternalLink,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useACAnalyzer } from "@/hooks/useACAnalyzer";
import { useToast } from "@/hooks/useToast";

// Helper recursive function to apply Tailwind prose-like styles manually to markdown
const MarkdownComponents = {
  h1: ({ node, ...props }: any) => (
    <h1
      className="text-2xl font-bold mt-6 mb-4 text-slate-900 dark:text-white"
      {...props}
    />
  ),
  h2: ({ node, ...props }: any) => (
    <h2
      className="text-xl font-bold mt-5 mb-3 text-slate-800 dark:text-slate-100"
      {...props}
    />
  ),
  h3: ({ node, ...props }: any) => (
    <h3
      className="text-lg font-bold mt-4 mb-2 text-slate-800 dark:text-slate-100"
      {...props}
    />
  ),
  p: ({ node, ...props }: any) => (
    <p
      className="mb-4 text-slate-600 dark:text-slate-300 leading-relaxed"
      {...props}
    />
  ),
  ul: ({ node, ...props }: any) => (
    <ul
      className="list-disc pl-6 mb-4 text-slate-600 dark:text-slate-300 space-y-1"
      {...props}
    />
  ),
  ol: ({ node, ...props }: any) => (
    <ol
      className="list-decimal pl-6 mb-4 text-slate-600 dark:text-slate-300 space-y-1"
      {...props}
    />
  ),
  li: ({ node, ...props }: any) => <li className="" {...props} />,
  a: ({ node, ...props }: any) => (
    <a
      className="text-primary hover:underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  strong: ({ node, ...props }: any) => (
    <strong
      className="font-semibold text-slate-900 dark:text-white"
      {...props}
    />
  ),
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto mb-6">
      <table
        className="w-full text-left border-collapse border border-slate-200 dark:border-slate-700"
        {...props}
      />
    </div>
  ),
  thead: ({ node, ...props }: any) => (
    <thead className="bg-slate-50 dark:bg-slate-800/50" {...props} />
  ),
  th: ({ node, ...props }: any) => (
    <th
      className="px-4 py-3 border border-slate-200 dark:border-slate-700 font-semibold text-sm text-slate-900 dark:text-white"
      {...props}
    />
  ),
  td: ({ node, ...props }: any) => (
    <td
      className="px-4 py-3 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300"
      {...props}
    />
  ),
  code: ({ node, inline, ...props }: any) =>
    inline ? (
      <code
        className="bg-slate-100 dark:bg-slate-800 text-sm px-1.5 py-0.5 rounded text-pink-500 font-mono"
        {...props}
      />
    ) : (
      <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto mb-4">
        <code
          className="text-sm font-mono text-slate-800 dark:text-slate-200"
          {...props}
        />
      </pre>
    ),
};

const ACAnalyzerPage = () => {
  const {
    analyzeAC,
    generating,
    result,
    url,
    setUrl,
    additionalContext,
    setAdditionalContext,
  } = useACAnalyzer();

  const toast = useToast();
  const resultRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom while generating
  useEffect(() => {
    if (generating && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [result, generating]);

  const handleUrlChange = (value: string) => {
    setUrl(value);
  };

  const handleClear = () => {
    setUrl("");
  };

  const handleGenerate = () => {
    analyzeAC(url);
  };

  const copyToClipboard = async () => {
    if (!resultRef.current || !result) return;

    try {
      const htmlContent = resultRef.current.innerHTML;
      const textContent = resultRef.current.innerText;

      const clipboardItem = new ClipboardItem({
        "text/html": new Blob([htmlContent], { type: "text/html" }),
        "text/plain": new Blob([textContent], { type: "text/plain" }),
      });

      await navigator.clipboard.write([clipboardItem]);
      toast.success("Analysis copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy: ", err);
      try {
        await navigator.clipboard.writeText(resultRef.current.innerText);
        toast.info("Analysis copied to clipboard as plain text.");
      } catch (fallbackErr) {
        toast.error("Failed to copy to clipboard.");
      }
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          AI Acceptance Criteria Analyzer
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Get a professional QA assessment, suggestions, gaps, and estimations from your Jira Acceptance Criteria.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-20 gap-4 lg:gap-4">
        {/* Left Column - Inputs */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-6">
          <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/15 via-teal-500/5 to-transparent pointer-events-none rounded-2xl" />

            <div className="relative z-10 p-4 lg:p-5 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Bot
                    size={20}
                    className={
                      generating
                        ? "animate-pulse text-emerald-600"
                        : "text-emerald-600 dark:text-emerald-400"
                    }
                  />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                    QA-Powered Analysis
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-emerald-300/80 leading-snug">
                    Enter Jira URL to start the AC assessment
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-300/70 uppercase tracking-widest px-1">
                  Jira Ticket URL
                </label>

                <div className="relative group/input">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://yourdomain.atlassian.net/browse/PROJ-123"
                    className="w-full pl-4 pr-11 py-3 bg-white/80 dark:bg-surface-dark border-2 border-emerald-100 dark:border-emerald-500/20 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400 group-hover/input:border-emerald-300 dark:group-hover/input:border-emerald-500/40"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {url && (
                      <button
                        onClick={handleClear}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                        title="Clear URL"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-300/70 uppercase tracking-widest px-1">
                    Additional Context (Optional)
                  </label>
                  <textarea
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Add specific details, DB tables, API endpoints, or special constraints to help AI analysis..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white/80 dark:bg-surface-dark border-2 border-emerald-100 dark:border-emerald-500/20 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400 group-hover/input:border-emerald-300 dark:group-hover/input:border-emerald-500/40 resize-none font-sans"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-emerald-100/50 dark:border-border-brand/40">
                <button
                  onClick={handleGenerate}
                  disabled={generating || !url.trim()}
                  className="w-full px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group text-sm"
                >
                  {generating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Analyzing AC...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles
                        size={18}
                        className="group-hover:rotate-12 transition-transform"
                      />
                      <span>Start Analysis</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-12 xl:col-span-13">
          <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl h-[calc(100vh-9rem)] min-h-[600px] flex flex-col overflow-hidden relative text-sm sm:text-base">
            {/* Action Bar */}
            <div className="flex-none p-4 border-b border-slate-100 dark:border-border-brand flex justify-between items-center bg-slate-50/50 dark:bg-sidebar-bg/50">
              <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                {generating ? (
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                ) : (
                  <ClipboardList className="w-4 h-4 text-slate-400" />
                )}
                Analysis Result
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  disabled={!result || generating}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Copy Results"
                >
                  <Copy size={16} />
                  <span className="hidden sm:inline">Copy Analysis</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 bg-white dark:bg-sidebar-bg scroll-smooth text-slate-800 dark:text-slate-200"
            >
              {!result && !generating && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3">
                  <ClipboardList size={48} className="opacity-20" />
                  <p className="text-sm">
                    Enter a Jira URL and click Start Analysis to begin.
                  </p>
                </div>
              )}

              {generating && !result && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-4">
                  <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  <p className="animate-pulse text-sm">
                    AI is reviewing the Acceptance Criteria...
                  </p>
                </div>
              )}

              {result !== null && (
                <div
                  ref={resultRef}
                  className="markdown-body max-w-none break-words relative pb-10"
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={MarkdownComponents}
                  >
                    {result}
                  </ReactMarkdown>

                  {generating && (
                    <span
                      className="inline-block w-1.5 h-5 ml-1 bg-emerald-500 animate-pulse align-middle"
                      title="AI is analyzing..."
                    />
                  )}

                  {generating && (
                    <div className="flex items-center gap-2 mt-8 text-emerald-500/60 text-[11px] font-bold uppercase tracking-widest animate-pulse border-t border-emerald-50 dark:border-emerald-500/10 pt-4">
                      <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:.2s]" />
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:.4s]" />
                      </div>
                      <span>QA Scientist at work...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ACAnalyzerPage;
