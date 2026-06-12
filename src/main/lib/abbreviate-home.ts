import { homedir } from 'node:os'

/** Replaces the home-directory prefix with ~ for display. */
export function abbreviateHome(path: string, home = homedir()): string {
  return path.startsWith(home) ? `~${path.slice(home.length)}` : path
}
