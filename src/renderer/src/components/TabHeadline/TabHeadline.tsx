import { Gauge } from '@renderer/components/Gauge'
import { SeverityMeter } from '@renderer/components/SeverityMeter'
import { GB } from '@renderer/lib/format'
import type { ReactNode } from 'react'
import type { TabHeadlineProps } from './TabHeadline.types'

/** The header data-viz slot, routed by active tab: a size-vs-limit Gauge for
 *  node_modules / caches / docker, a SeverityMeter for packages. Renders null
 *  when a size tab has no data to show (no pnpm store / docker unavailable). */
export function TabHeadline(props: TabHeadlineProps): ReactNode {
  const { tab, accent } = props
  if (tab === 'packages') {
    if (!props.packagesCheckEnabled) return null
    if (props.packagesComputing) {
      return <SeverityMeter counts={props.severity} total={props.packagesTotal} computing />
    }
    if (!props.packagesDataReady) return null
    return <SeverityMeter counts={props.severity} total={props.packagesTotal} />
  }
  if (tab === 'caches') {
    if (!props.cachesAvailable) return null
    return (
      <Gauge
        used={props.cachesUsed}
        threshold={props.cacheThresholdGB * GB}
        accent={accent}
        calculating={props.cachesCalculating}
      />
    )
  }
  if (tab === 'docker') {
    if (!props.dockerAvailable) return null
    return <Gauge used={props.dockerUsed} threshold={props.dockerThresholdGB * GB} accent={accent} />
  }
  // projects
  return (
    <Gauge
      used={props.projectsUsed}
      threshold={props.thresholdGB * GB}
      accent={accent}
      linkedBytes={props.linkedBytes}
      calculating={props.projectsCalculating}
    />
  )
}
