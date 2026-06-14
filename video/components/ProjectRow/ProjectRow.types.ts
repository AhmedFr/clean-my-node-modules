import type { MockProject } from '../../mockData'

export interface ProjectRowProps {
  project: MockProject
  /** 0 = present, 1 = fully swiped out + collapsed. */
  deleteProgress: number
  /** Highlighted row showing its action buttons (incl. trash). */
  selected: boolean
  /** Largest size in the list, for the size bar scale. */
  maxSizeGB: number
}
