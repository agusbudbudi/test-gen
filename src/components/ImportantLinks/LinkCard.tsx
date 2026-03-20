import { ExternalLink, Edit, Trash2 } from "lucide-react";
import { Link } from "@/stores/linkStore";

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

  return (
    <div className="group relative flex flex-col bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-brand/50 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      
      {/* Actions (Edit / Delete) */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(link); }}
          className="p-1.5 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 rounded-lg shadow-sm text-slate-600 dark:text-slate-300 hover:text-primary transition-colors backdrop-blur-sm"
          title="Edit"
        >
          <Edit size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(link._id); }}
          className="p-1.5 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 rounded-lg shadow-sm text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors backdrop-blur-sm"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="cursor-pointer flex flex-col h-full" onClick={handleOpen}>
        {/* Thumbnail */}
        <div className="w-full h-40 bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-border-brand/50 relative shrink-0">
          {link.imageUrl ? (
            <img
              src={link.imageUrl}
              alt={link.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <ExternalLink size={32} className="opacity-50" />
              <span className="text-xs font-medium uppercase tracking-wider">No Image</span>
            </div>
          )}
          
          {/* Overlay gradient for dark mode aesthetics */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-primary transition-colors">
            {link.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[40px] flex-1">
            {link.description || "No description provided."}
          </p>
          
          {/* URL Display */}
          <div className="mt-2 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5 rounded-lg shrink-0">
            <ExternalLink size={12} className="text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate w-full">
              {link.url}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
