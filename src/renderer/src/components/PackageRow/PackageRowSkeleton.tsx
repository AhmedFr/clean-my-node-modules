import type { CSSProperties, ReactNode } from 'react'

/** Varied name-bar widths so a stack of skeletons reads as content, not stripes. */
const NAME_WIDTHS = [128, 96, 156, 112, 138, 88, 146]

function Bar({ w, h, r = 5 }: { w: number; h: number; r?: number }): ReactNode {
  return <span className="cc-skel" style={{ display: 'block', width: w, height: h, borderRadius: r }} />
}

/** A shimmering placeholder shaped like a PackageRow, for the loading state. */
export function PackageRowSkeleton({ index = 0 }: { index?: number }): ReactNode {
  const nameW = NAME_WIDTHS[index % NAME_WIDTHS.length]
  // Stagger the entrance so rows cascade in rather than appearing all at once.
  const row: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    padding: '10px 12px',
    opacity: 0,
    animation: `mbdrop 0.4s cubic-bezier(0.2, 0.9, 0.3, 1) ${index * 55}ms forwards`,
  }
  return (
    <div style={row} aria-hidden="true">
      <span className="cc-skel" style={{ width: 30, height: 30, borderRadius: 8, flex: 'none' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <Bar w={nameW} h={10} />
        <Bar w={Math.round(nameW * 0.55)} h={8} />
      </div>
      <Bar w={46} h={16} r={9} />
      <Bar w={42} h={11} />
    </div>
  )
}
