import { useEffect, useState } from "react";
import { Bookmark, Plus, Loader2, Search, X } from "lucide-react";
import { useLinkStore, Link as LinkType } from "@/stores/linkStore";
import { useToastStore } from "@/stores/toastStore";
import LinkCard from "@/components/ImportantLinks/LinkCard";
import LinkModal from "@/components/ImportantLinks/LinkModal";

export default function ImportantLinksPage() {
  const { links, isLoading, fetchLinks, deleteLink } = useLinkStore();
  const [isModalOpen, setModalOpen] = useState(false);
  const [linkToEdit, setLinkToEdit] = useState<LinkType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const allTags = Array.from(new Set(links.flatMap((link) => link.tags || []))).sort();

  const filteredLinks = links.filter((link) => {
    const matchesSearch =
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.url.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesTag = selectedTag ? link.tags?.includes(selectedTag) : true;

    return matchesSearch && matchesTag;
  });

  const handleAdd = () => {
    setLinkToEdit(null);
    setModalOpen(true);
  };

  const handleEdit = (link: LinkType) => {
    setLinkToEdit(link);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this link?")) {
      try {
        await deleteLink(id);
        addToast("Link has been removed.", "success");
      } catch (error) {
        addToast("Failed to delete link.", "error");
      }
    }
  };

  const renderContent = () => {
    if (isLoading && links.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 animate-pulse">Loading links...</p>
        </div>
      );
    }

    if (links.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <Bookmark size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">No Links Saved Yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Start building your collection of important resources by adding your first link. We'll automatically fetch the thumbnail and description!
          </p>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium shadow-sm shadow-primary/20 transition-all"
          >
            <Plus size={16} />
            Add First Link
          </button>
        </div>
      );
    }

    if (filteredLinks.length === 0 && searchQuery) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-16 h-16 bg-slate-100 dark:bg-surface-dark rounded-full flex items-center justify-center text-slate-400 mb-4 border border-slate-200 dark:border-border-brand">
            <Search size={32} strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
            No results found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6">
            We couldn't find any links matching "<span className="font-semibold text-primary">{searchQuery}</span>"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
        {filteredLinks.map((link) => (
          <LinkCard 
            key={link._id} 
            link={link} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-indigo-500/[0.03] via-primary/[0.03] to-amber-500/[0.03] dark:from-indigo-500/[0.02] dark:via-primary/[0.02] dark:to-amber-500/[0.02] -mt-4 -mx-4 lg:-mx-6">
      {/* Header Container */}
      <div className="sticky top-[64px] lg:top-0 z-30 w-full border-b border-slate-200 dark:border-border-brand bg-white/80 dark:bg-sidebar-bg/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 lg:gap-6">
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 lg:gap-3">
                <Bookmark className="text-primary w-5 h-5 lg:w-6 lg:h-6" />
                Important Links
              </h1>
              <p className="text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage and quick-access your frequently used resources.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          {/* Centered Search & Add Action */}
          <div className="w-full max-w-2xl mx-auto mb-10 flex flex-col sm:flex-row items-center gap-3 z-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="relative group flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <Search className="text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
              </div>
              <input
                type="text"
                placeholder="Search by title, description, or URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-12 py-3.5 bg-white dark:bg-surface-dark border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl text-base text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  title="Clear search"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            <button
              onClick={handleAdd}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-2xl text-base font-medium shadow-[0_8px_30px_rgb(0,0,0,0.04)] shadow-primary/20 hover:shadow-primary/30 transition-all w-full sm:w-auto shrink-0"
            >
              <Plus size={20} />
              <span className="whitespace-nowrap">Add Link</span>
            </button>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="w-full max-w-7xl mx-auto mb-6 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-4 duration-500">
               <button
                 onClick={() => setSelectedTag(null)}
                 className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                   selectedTag === null 
                     ? "bg-primary text-white shadow-sm shadow-primary/20" 
                     : "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                 }`}
               >
                 All
               </button>
               {allTags.map(tag => (
                 <button
                   key={tag}
                   onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                   className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                     selectedTag === tag 
                       ? "bg-primary text-white shadow-sm shadow-primary/20" 
                       : "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                   }`}
                 >
                   {tag}
                 </button>
               ))}
            </div>
          )}

          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>

      <LinkModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        linkToEdit={linkToEdit} 
      />
    </div>
  );
}
