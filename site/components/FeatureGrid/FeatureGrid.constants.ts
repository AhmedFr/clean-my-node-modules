export interface GridCard {
  icon: string;
  title: string;
  copy: string;
}

export const GRID_CARDS: GridCard[] = [
  {
    icon: "i-broom",
    title: "Prune the pnpm store",
    copy: "Reclaim the shared store's dead versions with one safe click — it never deletes the store itself.",
  },
  {
    icon: "i-layers",
    title: "Real vs linked sizing",
    copy: "On pnpm, see the bytes you'd actually free apart from what's linked into the shared store.",
  },
  {
    icon: "i-shield",
    title: "Security advisories",
    copy: "A severity pill on any package with a known vulnerability, from the npm advisory database.",
  },
  {
    icon: "i-calendar",
    title: "Scheduled scans",
    copy: "Runs every 6 hours, daily, or weekly — entirely in the background.",
  },
  {
    icon: "i-bell",
    title: "Threshold alerts",
    copy: "Set a limit in gigabytes and get nudged the instant you cross it.",
  },
  {
    icon: "i-hdd",
    title: "Pixel disk meter",
    copy: "A glanceable bar that fills and reddens as your dependencies pile up.",
  },
  {
    icon: "i-finder",
    title: "Reveal in Finder",
    copy: "Jump straight to any project folder without leaving the keyboard.",
  },
  {
    icon: "i-code",
    title: "Open in your editor",
    copy: "One keystroke launches the project in the editor you already use.",
  },
  {
    icon: "i-grid",
    title: "Framework detection",
    copy: "React, Next, Vue, Svelte, Node, Expo — each project, correctly tagged.",
  },
];
