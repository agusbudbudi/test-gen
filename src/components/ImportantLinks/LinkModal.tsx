import { useState, useEffect } from "react";
import { Search, Loader2, X } from "lucide-react";
import { Link, useLinkStore } from "@/stores/linkStore";
import { useToastStore } from "@/stores/toastStore";
import Modal from "@/components/Modal/Modal";
import DynamicPlaceholder from "@/components/ImportantLinks/DynamicPlaceholder";

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkToEdit?: Link | null;
}

export default function LinkModal({ isOpen, onClose, linkToEdit }: LinkModalProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  
  const [isParsing, setIsParsing] = useState(false);
  
  const addLink = useLinkStore((state) => state.addLink);
  const updateLink = useLinkStore((state) => state.updateLink);
  const parseUrl = useLinkStore((state) => state.parseUrl);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    if (isOpen) {
      if (linkToEdit) {
        setUrl(linkToEdit.url);
        setTitle(linkToEdit.title);
        setDescription(linkToEdit.description);
        setImageUrl(linkToEdit.imageUrl);
        setTags(linkToEdit.tags || []);
      } else {
        setUrl("");
        setTitle("");
        setDescription("");
        setImageUrl("");
        setTags([]);
      }
    }
  }, [isOpen, linkToEdit]);

  const formatUrl = (val: string) => {
    if (!val) return val;
    let formatted = val.trim();
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = 'https://' + formatted;
    }
    return formatted;
  };

  const handleUrlBlur = () => {
    setUrl(formatUrl(url));
  };

  const isValidUrl = (val: string) => {
    if (!val) return true;
    try {
      new URL(formatUrl(val));
      return true;
    } catch {
      return false;
    }
  };

  const urlIsValid = isValidUrl(url);

  const handleParseUrl = async () => {
    if (!url) return;
    setIsParsing(true);
    try {
      const data = await parseUrl(url);
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.imageUrl) setImageUrl(data.imageUrl);
      addToast("Metadata auto-filled successfully!", "success");
    } catch (error) {
      console.error("Failed to parse URL metadata");
      addToast("Could not fetch metadata. You can fill it manually.", "warning");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !title) return;
    
    try {
      if (linkToEdit) {
        await updateLink(linkToEdit._id, { url, title, description, imageUrl, tags });
        addToast("Link updated successfully!", "success");
      } else {
        await addLink({ url, title, description, imageUrl, tags });
        addToast("Link added! Start exploring your resources.", "success");
      }
      onClose();
    } catch (error) {
      console.error("Failed to save link");
      addToast("Failed to save link. Something went wrong.", "error");
    }
  };

  const isFaviconUrl = (imgUrl: string) => {
    if (!imgUrl) return false;
    const lowerUrl = imgUrl.toLowerCase();
    return lowerUrl.includes('favicon') || lowerUrl.endsWith('.ico') || lowerUrl.includes('.ico?') || lowerUrl.includes('apple-touch-icon');
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={linkToEdit ? "Edit Link" : "Add Important Link"}
      maxWidth="lg"
      noPadding
    >
      <form onSubmit={handleSave} className="flex flex-col h-full max-h-[70vh]">
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">URL <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="example.com"
                className={`flex-1 bg-slate-50 dark:bg-slate-800 border ${!urlIsValid && url ? 'border-red-500 focus:ring-red-500/50' : 'border-slate-200 dark:border-slate-700/60 focus:ring-primary/50'} rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 transition-all`}
              />
              <button
                type="button"
                onClick={handleParseUrl}
                disabled={isParsing || !url || !urlIsValid}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isParsing ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Auto-fill
              </button>
            </div>
            {!urlIsValid && url && (
              <p className="text-xs text-red-500">Please enter a valid URL.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Link Title"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Image URL Override</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, i) => (
                <span key={i} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full flex items-center gap-1">
                  {tag}
                  <button type="button" onClick={() => setTags(tags.filter((_, idx) => idx !== i))} className="hover:text-red-500"><X size={12} /></button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add tag and press Enter"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  const val = e.currentTarget.value.trim();
                  if (val && !tags.includes(val)) {
                    setTags([...tags, val]);
                  }
                  e.currentTarget.value = '';
                }
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          
          {/* Thumbnail Preview */}
          <div className="mt-2 rounded-lg border border-slate-200 dark:border-slate-700/60 overflow-hidden h-32 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 relative">
             {imageUrl ? (
               isFaviconUrl(imageUrl) ? (
                 <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900/50 absolute inset-0">
                    <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex items-center justify-center p-2.5">
                      <img src={imageUrl} alt="Thumbnail Preview" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </div>
                 </div>
               ) : (
                 <img src={imageUrl} alt="Thumbnail Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
               )
             ) : (
               <DynamicPlaceholder url={url} title={title} />
             )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title || !url || !urlIsValid}
            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium shadow-sm shadow-primary/20 transition-all disabled:opacity-50"
          >
            {linkToEdit ? "Update Link" : "Save Link"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
