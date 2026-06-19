export interface GridCard {
  icon: string;
  title: string;
  copy: string;
}

export const GRID_CARDS: GridCard[] = [
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
