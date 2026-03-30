import { ExternalLink, Edit, Trash2 } from "lucide-react";
import { Link } from "@/stores/linkStore";
import DynamicPlaceholder from "@/components/ImportantLinks/DynamicPlaceholder";

interface LinkCardProps {
  link: Link;
  onEdit: (link: Link) => void;
  onDelete: (id: string) => void;
}

export default function LinkCard({ link, onEdit, onDelete }: LinkCardProps) {
  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  const isFavicon =
    link.imageUrl &&
    (link.imageUrl.toLowerCase().includes("favicon") ||
      link.imageUrl.toLowerCase().endsWith(".ico") ||
      link.imageUrl.toLowerCase().includes(".ico?") ||
      link.imageUrl.toLowerCase().includes("apple-touch-icon"));

  return (
    <div className="group relative bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-brand/50 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      {/* Actions (Edit / Delete) */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(link);
          }}
          className="p-1.5 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 rounded-lg shadow-sm text-slate-600 dark:text-slate-300 hover:text-primary transition-colors backdrop-blur-sm"
          title="Edit"
        >
          <Edit size={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(link._id);
          }}
          className="p-1.5 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 rounded-lg shadow-sm text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors backdrop-blur-sm"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div
        className="cursor-pointer flex flex-col sm:flex-row h-full items-stretch"
        onClick={handleOpen}
      >
        {/* Thumbnail */}
        <div className="w-full sm:w-40 h-32 sm:h-auto min-h-[140px] bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700/60 relative shrink-0">
          {link.imageUrl ? (
            isFavicon ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 transition-colors">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex items-center justify-center p-3 transition-transform duration-500 group-hover:scale-110">
                  <img
                    src={link.imageUrl}
                    alt={link.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            ) : (
              <img
                src={link.imageUrl}
                alt={link.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )
          ) : (
            <DynamicPlaceholder url={link.url} title={link.title} />
          )}

          {/* Overlay gradient for dark mode aesthetics */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-1.5 flex-1 min-w-0 justify-center">
          {link.tags && link.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-0.5">
              {link.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-wider font-semibold rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-primary transition-colors pr-12">
            {link.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
            {link.description || "No description provided."}
          </p>
        </div>
      </div>
    </div>
  );
}
