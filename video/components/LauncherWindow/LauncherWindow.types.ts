import type { MockProject } from '../../mockData'

export interface RowState {
  project: MockProject
  deleteProgress: number
  selected: boolean
}

export interface LauncherWindowProps {
  usedGB: number
  limitGB: number
  trackMaxGB: number
  rows: RowState[]
  maxSizeGB: number
  /** Count shown in the list header ("N folders"). */
  folderCount: number
}

export const LAUNCHER_WIDTH = 740
