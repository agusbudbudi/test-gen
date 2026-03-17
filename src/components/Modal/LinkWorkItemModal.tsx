import { useState } from "react";
import Modal from "./Modal";
import { Link2, Trash2, Info } from "lucide-react";

interface LinkWorkItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (linkData: {
    jiraUrl: string;
    linkType: string;
    issueType: string;
  }) => void;
  exporting: boolean;
}

const LinkWorkItemModal = ({
  isOpen,
  onClose,
  onExport,
  exporting,
}: LinkWorkItemModalProps) => {
  const [jiraUrl, setJiraUrl] = useState("");
  const [linkType, setLinkType] = useState("relates to");
  const [issueType, setIssueType] = useState("Feedback");

  const handleExport = () => {
    onExport({ jiraUrl: jiraUrl.trim(), linkType, issueType });
  };

  const handleClear = () => {
    setJiraUrl("");
    setLinkType("relates to");
    setIssueType("Feedback");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link Work Item"
      maxWidth="md"
    >
      <div className="space-y-6">
        <div className="flex items-start gap-3 p-3.5 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
          <Info size={18} className="text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Optionally link this feedback to an existing Jira issue by providing
            its full URL.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Jira Issue Type
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm dark:text-slate-200"
            >
              <option value="Bug">Bug</option>
              <option value="Feedback">Feedback</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Relationship Type
            </label>
            <select
              value={linkType}
              onChange={(e) => setLinkType(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm dark:text-slate-200"
            >
              <option value="relates to">Relates to</option>
              <option value="blocks">Blocks</option>
              <option value="is blocked by">Is blocked by</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Full Jira Link
            </label>
            <div className="relative">
              <Link2
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="url"
                placeholder="https://company.atlassian.net/browse/QA-123"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm dark:text-slate-200"
                value={jiraUrl}
                onChange={(e) => setJiraUrl(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Example: https://your-domain.atlassian.net/browse/PROJ-123
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors text-sm"
          >
            Cancel
          </button>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-[2] flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/20 text-sm disabled:opacity-50"
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <img
                src="/assets/icons/jira-icon.png"
                alt="Jira"
                className="w-4 h-4 object-contain"
              />
            )}
            {exporting ? "Exporting..." : "Export to Jira"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LinkWorkItemModal;
