/** A project directory containing a node_modules folder found on disk. */
export interface Project {
  /** Stable id (hash of path). */
  id: string
  /** Project folder name. */
  name: string
  /** Display path of the project folder (~-abbreviated). */
  path: string
  /** Absolute path of the project folder. */
  absPath: string
  /** Detected framework kind, drives the row icon. */
  kind: FrameworkKind
  /** Apparent size of node_modules in bytes (≈ what `du`/Finder show). */
  size: number
  /** Bytes actually freed by deleting node_modules now (apparent minus the pnpm-store-backed `.pnpm` subtree). */
  uniqueSize: number
  /** Last-used timestamp (ms since epoch). */
  lastUsed: number
  /** Project's own favicon/logo as a data URL, when one was found. */
  iconDataUrl?: string
}

export type FrameworkKind = 'react' | 'next' | 'vue' | 'svelte' | 'node' | 'astro' | 'ts' | 'vite' | 'remix' | 'expo'

export interface ScanProgress {
  foldersChecked: number
  currentPath: string
  done: boolean
}
