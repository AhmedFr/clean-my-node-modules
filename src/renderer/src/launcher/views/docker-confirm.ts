import type { DockerItem } from '@shared/docker.types'

/** True when a pending removal needs the extra typed confirmation (all volumes). */
export function needsTypedConfirm(item: { kind: DockerItem['kind'] }): boolean {
  return item.kind === 'volume'
}

/** The string the user must type: the volume name (per-item) or 'prune' (bulk volumes). */
export function requiredConfirmText(target: { kind: 'volume'; name: string } | { kind: 'prune' }): string {
  return target.kind === 'prune' ? 'prune' : target.name
}

/** Whether the typed text satisfies the required confirmation text (trimmed, exact match). */
export function confirmSatisfied(required: string, typed: string): boolean {
  return typed.trim() === required
}
