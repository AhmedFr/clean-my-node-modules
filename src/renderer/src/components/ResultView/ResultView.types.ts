export interface ResultViewProps {
  accent: string
  totalBytes: number
  nodeModulesBytes: number
  storeBytes: number
  projectsCount: number
  /** true briefly after a successful copy, drives the button label */
  copied: boolean
  onCopy: () => void
  onContinue: () => void
}
