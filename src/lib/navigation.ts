import {
  FileCheck,
  Bot,
  Bug,
  History,
  ClipboardList,
  BookOpen,
  ClipboardCheck,
  Table as TableIcon,
  Settings,
  Bookmark,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import type { Workspace } from "@/stores/uiStore";

export type NavWorkspace = Workspace | "all";

export interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
  workspace: NavWorkspace;
}

export interface NavSection {
  group: string;
  items: NavItem[];
}

// Shared by the Sidebar (which menus show per workspace) and the Welcome
// page (which menus get featured as quick-start cards per workspace).
export const NAV_SECTIONS: NavSection[] = [
  {
    group: "AI Workshop",
    items: [
      {
        to: "/generate",
        icon: FileCheck,
        label: "AI Generate TCs",
        description:
          "Generate structured test cases from your requirements with AI.",
        workspace: "diricare",
      },
      {
        to: "/review",
        icon: Bot,
        label: "AI Review TCs",
        description: "Get AI feedback to review and refine existing test cases.",
        workspace: "diricare",
      },
      {
        to: "/bug-report",
        icon: Bug,
        label: "AI Bug Report",
        description: "Turn raw bug notes into clear, ready-to-file bug reports.",
        workspace: "diricare",
      },
      {
        to: "/ac-analyzer",
        icon: ClipboardList,
        label: "AI AC Analyzer",
        description: "Analyze acceptance criteria for gaps before dev starts.",
        workspace: "diricare",
      },
      {
        to: "/product-knowledge",
        icon: BookOpen,
        label: "Product Knowledge",
        description: "Store product context to ground every AI generation.",
        workspace: "diricare",
      },
    ],
  },
  {
    group: "Jira Tools",
    items: [
      {
        to: "/qa-tasks",
        icon: ClipboardCheck,
        label: "Create QA Tasks",
        description: "Create and push QA tasks straight into Jira for your sprint.",
        workspace: "fithub",
      },
      {
        to: "/release-visibility",
        icon: TableIcon,
        label: "Release Visibility",
        description: "See what's shipping across releases at a glance.",
        workspace: "diricare",
      },
    ],
  },
  {
    group: "Execution & Insight",
    items: [
      {
        to: "/history",
        icon: History,
        label: "History",
        description: "Browse everything you've generated before.",
        workspace: "diricare",
      },
    ],
  },
  {
    group: "System",
    items: [
      {
        to: "/settings",
        icon: Settings,
        label: "Settings",
        description: "Configure API keys, AI models, and integrations.",
        workspace: "all",
      },
      {
        to: "/important-links",
        icon: Bookmark,
        label: "Important Links",
        description: "Quick access to bookmarked project links.",
        workspace: "all",
      },
      {
        to: "/documentation",
        icon: Lightbulb,
        label: "Documentation",
        description: "Guides and docs for using TestGen.",
        workspace: "all",
      },
    ],
  },
];

// Top workspace-specific menus, featured as quick-start cards on the
// Welcome page. Excludes "System" (always-on utility items, not
// workspace-specific) so the cards actually reflect the chosen workspace.
export function getTopWorkspaceMenus(
  workspace: Workspace,
  max = 3,
): NavItem[] {
  return NAV_SECTIONS.filter((section) => section.group !== "System")
    .flatMap((section) => section.items)
    .filter((item) => item.workspace === workspace)
    .slice(0, max);
}
