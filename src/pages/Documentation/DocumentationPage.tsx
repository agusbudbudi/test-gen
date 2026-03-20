import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Book,
  ChevronRight,
  Search,
  ArrowLeft,
  Layout as LayoutIcon,
  Bot,
  FileCheck,
  Bug,
  ClipboardList,
  BookOpen,
  Table as TableIcon,
  Beaker,
  History as HistoryIcon,
  Settings,
  Key,
  Layers,
  LayoutDashboard,
  PlayCircle,
  PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
// import docsIndex from "@/assets/docs/index.json";

interface DocItem {
  id: string;
  title: string;
  description: string;
  category: string;
  file: string;
}

const iconMap: Record<string, any> = {
  "ai-generate-tcs": FileCheck,
  "ai-review-tcs": Bot,
  "ai-bug-report": Bug,
  "ai-ac-analyzer": ClipboardList,
  "product-knowledge": BookOpen,
  "release-visibility": TableIcon,
  "test-management": Layers,
  "history": HistoryIcon,
  "settings": Settings,
  "atlassian-token": Key,
  "flaky-tests": Beaker,
  "automation-overview": LayoutDashboard,
  "automation-runs": PlayCircle,
  "automation-insights": PieChart,
};

const DocumentationPage = () => {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const [docsIndex, setDocsIndex] = useState<DocItem[]>([]);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/docs/index.json")
      .then((res) => res.json())
      .then((data) => setDocsIndex(data))
      .catch((err) => console.error("Error loading docs index:", err));
  }, []);

  const filteredDocs = docsIndex.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedDoc = docsIndex.find((doc) => doc.id === docId);

  useEffect(() => {
    if (docId && selectedDoc) {
      setLoading(true);
      fetch(`/docs/${selectedDoc.file}`)
        .then((res) => res.text())
        .then((text) => {
          setContent(text);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading documentation:", err);
          setContent("# Error\nCould not load documentation content.");
          setLoading(false);
        });
    } else {
      setContent("");
    }
  }, [docId, selectedDoc]);

  const renderDocList = () => {
    if (filteredDocs.length === 0 && searchQuery) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-16 h-16 bg-slate-100 dark:bg-surface-dark rounded-full flex items-center justify-center text-slate-400 mb-4 border border-slate-200 dark:border-border-brand">
            <Search size={32} strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
            No results found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6">
            We couldn't find any guides matching "
            <span className="font-semibold text-primary">{searchQuery}</span>"
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-sm font-bold transition-all"
          >
            Clear Search
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {filteredDocs.map((doc) => {
          const Icon = iconMap[doc.id] || Book;
          return (
            <Link
              key={doc.id}
              to={`/documentation/${doc.id}`}
              className="group p-4 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl hover:border-primary/50 dark:hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 flex flex-col gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                <Icon size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {doc.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-transparent -mt-4 -mx-4 lg:-mx-6">
      {/* Header Container */}
      <div className="sticky top-[64px] lg:top-0 z-30 w-full border-b border-slate-200 dark:border-border-brand bg-white/80 dark:bg-sidebar-bg/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-6">
            {docId && (
              <button
                onClick={() => navigate("/documentation")}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-primary/10 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 lg:gap-3">
                <Book className="text-primary w-5 h-5 lg:w-6 lg:h-6" />
                {docId && selectedDoc ? selectedDoc.title : "Documentation"}
              </h1>
              <p className="text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {docId && selectedDoc
                  ? selectedDoc.description
                  : "Explore guides and resources to master all features."}
              </p>
            </div>
          </div>

          {!docId && (
            <div className="relative w-64 hidden sm:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
        <div className="max-w-5xl mx-auto">
          {docId ? (
            loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 animate-pulse">
                  Loading documentation...
                </p>
              </div>
            ) : (
              <div className="prose prose-slate dark:prose-invert max-w-none pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1
                        className="text-3xl font-bold mb-6 text-slate-900 dark:text-white border-b pb-4 border-slate-200 dark:border-border-brand"
                        {...props}
                      />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2
                        className="text-2xl font-bold mt-10 mb-4 text-slate-800 dark:text-slate-100"
                        {...props}
                      />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3
                        className="text-xl font-bold mt-8 mb-3 text-slate-800 dark:text-slate-200"
                        {...props}
                      />
                    ),
                    p: ({ node, ...props }) => (
                      <p
                        className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4"
                        {...props}
                      />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        className="list-disc pl-6 mb-4 space-y-2 text-slate-600 dark:text-slate-300"
                        {...props}
                      />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol
                        className="list-decimal pl-6 mb-4 space-y-2 text-slate-600 dark:text-slate-300"
                        {...props}
                      />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="pl-1" {...props} />
                    ),
                    a: ({ node, ...props }) => (
                      <a
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline transition-colors"
                        {...props}
                      />
                    ),
                    code: ({ node, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || "");
                      const isInline = !match;
                      return (
                        <code
                          className={cn(
                            "rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-sm text-primary dark:text-primary-foreground",
                            !isInline &&
                              "block p-4 overflow-x-auto my-6 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-border-brand",
                          )}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    img: (props) => (
                      <img
                        {...props}
                        className="rounded-2xl border border-slate-200 dark:border-border-brand shadow-xl my-8 max-w-full h-auto mx-auto"
                        loading="lazy"
                      />
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>

                {/* Navigation Footer */}
                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-border-brand flex justify-between">
                  <button
                    onClick={() => navigate("/documentation")}
                    className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-medium"
                  >
                    <ArrowLeft size={18} />
                    Back to Guides
                  </button>
                </div>
              </div>
            )
          ) : (
            renderDocList()
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;
