import React, { useRef, useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Copy,
  BookOpen,
  Sparkles,
  Bot,
  Check,
  ExternalLink,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useProductKnowledge } from "@/hooks/useProductKnowledge";
import { useConfluenceExport } from "@/hooks/useConfluenceExport";
import { useToast } from "@/hooks/useToast";

// Helper recursive function to apply Tailwind prose-like styles manually to markdown
// if not using a dedicated typography plugin (standard Vite tailwind setup)
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

const ProductKnowledgePage = () => {
  const {
    generateProductKnowledge,
    generating,
    result,
    importingUrls,
    urls,
    setUrls,
  } = useProductKnowledge();
  const { exportToConfluence, exporting: exportingToConfluence } =
    useConfluenceExport();

  const [exportedConfluenceData, setExportedConfluenceData] = useState<{
    id: string;
    title: string;
    url: string;
  } | null>(null);
  const [copyLinkStatus, setCopyLinkStatus] = useState(false);

  const toast = useToast();
  const resultRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom while generating
  useEffect(() => {
    if (generating && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [result, generating]);

  const handleAddUrl = () => {
    setUrls([...urls, ""]);
  };

  const handleRemoveUrl = (index: number) => {
    const newUrls = [...urls];
    newUrls.splice(index, 1);
    if (newUrls.length === 0) newUrls.push(""); // Keep at least one
    setUrls(newUrls);
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleGenerate = () => {
    setExportedConfluenceData(null);
    generateProductKnowledge(urls);
  };

  const copyToClipboard = async () => {
    if (!resultRef.current || !result) return;

    try {
      // Create a temporary element to hold the formatted HTML
      const htmlContent = resultRef.current.innerHTML;
      const textContent = resultRef.current.innerText;

      // Use the modern Clipboard API to write both HTML and plain text
      const clipboardItem = new ClipboardItem({
        "text/html": new Blob([htmlContent], { type: "text/html" }),
        "text/plain": new Blob([textContent], { type: "text/plain" }),
      });

      await navigator.clipboard.write([clipboardItem]);
      toast.success("Copied to clipboard! Ready to paste into Confluence.");
    } catch (err) {
      console.error("Failed to copy: ", err);

      // Fallback for older browsers
      try {
        await navigator.clipboard.writeText(resultRef.current.innerText);
        toast.info(
          "Text copied to clipboard (HTML copy failed, using plain text)",
        );
      } catch (fallbackErr) {
        toast.error("Failed to copy to clipboard.");
      }
    }
  };

  const handleExportConfluence = async () => {
    if (!result || !resultRef.current) return;

    // Attempt to extract title from the first header
    let title = `Product Knowledge - ${new Date().toLocaleDateString()}`;
    const h1Match = result.match(/^# (.*)$/m);
    const h2Match = result.match(/^## (.*)$/m);
    if (h1Match) title = h1Match[1];
    else if (h2Match) title = h2Match[1];

    const resultExport = await exportToConfluence(
      title,
      resultRef.current.innerHTML,
    );
    if (resultExport) {
      setExportedConfluenceData(resultExport);
    }
  };

  const copyConfluenceLink = () => {
    if (!exportedConfluenceData) return;
    navigator.clipboard.writeText(exportedConfluenceData.url);
    setCopyLinkStatus(true);
    setTimeout(() => setCopyLinkStatus(false), 2000);
    toast.success("Link copied to clipboard!");
  };

  const isAnyImporting = Object.values(importingUrls).some((status) => status);

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          AI Product Knowledge Creator
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Combine Acceptance Criteria from multiple Jira tickets into a
          comprehensive Product Knowledge document.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-20 gap-4 lg:gap-4">
        {/* Left Column - Inputs */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-6">
          <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/15 via-blue-500/5 to-transparent pointer-events-none rounded-2xl" />

            <div className="relative z-10 p-4 lg:p-5 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center shrink-0">
                  <Bot
                    size={20}
                    className={
                      generating
                        ? "animate-pulse text-indigo-600"
                        : "text-indigo-600 dark:text-indigo-400"
                    }
                  />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                    AI-Powered Import
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-indigo-300/80 leading-snug">
                    Paste Jira URLs to synthesize Product Knowledge
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-indigo-600/70 dark:text-indigo-300/70 uppercase tracking-widest px-1">
                  Jira Ticket URLs
                </label>

                <div className="space-y-3">
                  {urls.map((url, index) => (
                    <div key={index} className="relative group/input">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleUrlChange(index, e.target.value)}
                        placeholder="https://yourdomain.atlassian.net/browse/PROJ-123"
                        className="w-full pl-4 pr-11 py-3 bg-white/80 dark:bg-surface-dark border-2 border-indigo-100 dark:border-indigo-500/20 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400 group-hover/input:border-indigo-300 dark:group-hover/input:border-indigo-500/40"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {importingUrls[url] && (
                          <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        )}
                        <button
                          onClick={() => handleRemoveUrl(index)}
                          disabled={urls.length === 1 && urls[0] === ""}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-0 disabled:pointer-events-none"
                          title="Remove URL"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleAddUrl}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-primary transition-colors px-1 py-1 group/btn"
                >
                  <Plus
                    size={14}
                    className="group-hover/btn:rotate-90 transition-transform duration-300"
                  />
                  Add Another Ticket
                </button>
              </div>

              <div className="pt-4 border-t border-indigo-100/50 dark:border-border-brand/40">
                <button
                  onClick={handleGenerate}
                  disabled={generating || isAnyImporting}
                  className="w-full px-6 py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group text-sm"
                >
                  {generating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>
                        {isAnyImporting
                          ? "Fetching ACs..."
                          : "Synthesizing knowledge..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles
                        size={18}
                        className="group-hover:rotate-12 transition-transform"
                      />
                      <span>Generate Knowledge Base</span>
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
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                ) : (
                  <BookOpen className="w-4 h-4 text-slate-400" />
                )}
                Result Document
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  disabled={!result || generating}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Copy as Rich Text for Confluence"
                >
                  <Copy size={16} />
                  <span className="hidden sm:inline">Copy for Confluence</span>
                </button>
                <button
                  onClick={handleExportConfluence}
                  disabled={!result || generating || exportingToConfluence}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 dark:bg-indigo-500 border border-indigo-500 dark:border-indigo-400 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {exportingToConfluence ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <img
                      src="/assets/icons/confluence-icon.webp"
                      alt="Confluence"
                      className="w-4 h-4 object-contain"
                    />
                  )}
                  <span className="hidden sm:inline">
                    {exportingToConfluence
                      ? "Exporting..."
                      : "Export to Confluence"}
                  </span>
                </button>
              </div>
            </div>

            {/* Success Banner */}
            {exportedConfluenceData && (
              <div className="flex-none p-4 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex-shrink-0 bg-green-600 text-white rounded-lg flex items-center justify-center">
                    <Check size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Successfully Exported!
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                        Confluence:
                      </span>
                      <a
                        href={exportedConfluenceData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 max-w-[180px] sm:max-w-[300px]"
                        title={exportedConfluenceData.title}
                      >
                        <span className="truncate">
                          {exportedConfluenceData.title}
                        </span>
                        <ExternalLink size={10} className="shrink-0" />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={copyConfluenceLink}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all font-mono"
                  >
                    {copyLinkStatus ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <Copy size={14} />
                    )}
                    {copyLinkStatus ? "Copied!" : "Copy Link"}
                  </button>
                  <button
                    onClick={() => setExportedConfluenceData(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    title="Dismiss"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 bg-white dark:bg-sidebar-bg scroll-smooth text-slate-800 dark:text-slate-200"
            >
              {!result && !generating && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3">
                  <BookOpen size={48} className="opacity-20" />
                  <p className="text-sm">
                    Enter Jira URLs and configure your prompt to generate a
                    knowledge base.
                  </p>
                </div>
              )}

              {generating && !result && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-4">
                  <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <p className="animate-pulse text-sm">
                    {isAnyImporting
                      ? "Retrieving Acceptance Criteria from Jira..."
                      : "AI is structuring the Product Knowledge..."}
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

                  {generating && !isAnyImporting && (
                    <span
                      className="inline-block w-1.5 h-5 ml-1 bg-indigo-500 animate-pulse align-middle"
                      title="AI is typing..."
                    />
                  )}

                  {generating && !isAnyImporting && (
                    <div className="flex items-center gap-2 mt-8 text-indigo-500/60 text-[11px] font-bold uppercase tracking-widest animate-pulse border-t border-indigo-50 dark:border-indigo-500/10 pt-4">
                      <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:.2s]" />
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:.4s]" />
                      </div>
                      <span>AI Synthesizing...</span>
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

export default ProductKnowledgePage;
