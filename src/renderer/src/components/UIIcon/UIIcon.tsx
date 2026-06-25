import type { ReactNode } from 'react'
import type { IconProps, IconRenderer, UIIconName } from './UIIcon.types'

function Icon({ path, size = 16, stroke = 2, fill = 'none', style }: IconProps & { path: ReactNode }): ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      {path}
    </svg>
  )
}

export const UIIcon: Record<UIIconName, IconRenderer> = {
  search: (p) => (
    <Icon
      {...p}
      path={
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </>
      }
    />
  ),
  trash: (p) => (
    <Icon
      {...p}
      path={
        <>
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M10 11v6M14 11v6" />
        </>
      }
    />
  ),
  folder: (p) => (
    <Icon {...p} path={<path d="M4 5a2 2 0 0 1 2-2h3.5l2 2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />} />
  ),
  finder: (p) => (
    <Icon
      {...p}
      path={
        <>
          <rect x="3" y="4" width="18" height="16" rx="2.5" />
          <path d="M12 4v16" />
          <path d="M7 9h.01M16.5 9c0 1.5-.8 3-1.5 4" />
        </>
      }
    />
  ),
  gear: (p) => (
    <Icon
      {...p}
      path={
        <>
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </>
      }
    />
  ),
  refresh: (p) => (
    <Icon
      {...p}
      path={
        <>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          <path d="M3 21v-5h5" />
        </>
      }
    />
  ),
  chevronRight: (p) => <Icon {...p} path={<path d="m9 6 6 6-6 6" />} />,
  chevronLeft: (p) => <Icon {...p} path={<path d="m15 6-6 6 6 6" />} />,
  check: (p) => <Icon {...p} path={<path d="m20 6-11 11-5-5" />} />,
  checkCircle: (p) => (
    <Icon
      {...p}
      path={
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 12 2.5 2.5 4.5-5" />
        </>
      }
    />
  ),
  clock: (p) => (
    <Icon
      {...p}
      path={
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      }
    />
  ),
  alert: (p) => (
    <Icon
      {...p}
      path={
        <>
          <path d="M12 2 1 21h22z" />
          <path d="M12 9v5M12 17.5v.5" />
        </>
      }
    />
  ),
  sparkle: (p) => <Icon {...p} path={<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />} />,
  command: (p) => (
    <Icon {...p} path={<path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z" />} />
  ),
  arrowUp: (p) => <Icon {...p} path={<path d="M12 19V5M5 12l7-7 7 7" />} />,
  arrowDown: (p) => <Icon {...p} path={<path d="M12 5v14M19 12l-7 7-7-7" />} />,
  enter: (p) => <Icon {...p} path={<path d="M9 10 4 15l5 5M4 15h12a4 4 0 0 0 4-4V4" />} />,
  x: (p) => <Icon {...p} path={<path d="M18 6 6 18M6 6l12 12" />} />,
  hdd: (p) => (
    <Icon
      {...p}
      path={
        <>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="M7 15h.01M11 15h6" />
        </>
      }
    />
  ),
  power: (p) => (
    <Icon
      {...p}
      path={
        <>
          <path d="M12 2v10" />
          <path d="M18.4 6.6a9 9 0 1 1-12.77.04" />
        </>
      }
    />
  ),
  box: (p) => (
    <Icon
      {...p}
      path={
        <>
          <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
          <path d="M3 8l9 5 9-5" />
          <path d="M12 13v8" />
        </>
      }
    />
  ),
  externalLink: (p) => (
    <Icon
      {...p}
      path={
        <>
          <path d="M15 3h6v6" />
          <path d="M10 14 21 3" />
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </>
      }
    />
  ),
}
