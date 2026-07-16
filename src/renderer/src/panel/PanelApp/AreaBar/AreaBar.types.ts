import type { PanelAreaRow } from '../panelAreas'

export interface AreaBarProps {
  row: PanelAreaRow
  accent: string
  /** Opens this area's tab in the launcher. */
  onOpen: () => void
}
