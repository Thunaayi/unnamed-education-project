import { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function createIcon(path: string, viewBox = '0 0 24 24') {
  return ({ size = 24, ...props }: IconProps) => (
    <svg viewBox={viewBox} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {typeof path === 'string' ? path.split('|').map((d, i) => <path key={i} d={d} />) : path}
    </svg>
  )
}

// Achievement icons
export const IconStar = createIcon('M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z')
export const IconBooks = createIcon('M4 6h16M4 12h16M4 18h12M4 6v12M20 6v12')
export const IconTarget = createIcon('M12 2a10 10 0 1 0 10 10M12 6a6 6 0 1 0 6 6M12 10a2 2 0 1 0 2 2')
export const IconCrown = createIcon('M2 20h20M4 20l2-14 6 6 6-6 2 14M12 6v4')
export const IconFire = createIcon('M12 21c-3.3 0-6-2.4-6-5.8 0-2.6 1.6-4 2.6-5.7.5 1 .3 2 .9 2 .7 0 .6-2.7 0-4.5-.4-1.2-.2-2.4.5-3 1 2.6 3 3.4 4.3 5.4 1 1.6 1.7 3 1.7 4.8 0 3.4-2.7 5.8-6 5.8z')
export const IconMuscle = createIcon('M17 21v-4a8 8 0 0 0-16-4v4h16zM21 16c1-2 1-6 0-8M7 9V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4')
export const IconTrophy = createIcon('M6 9H4a2 2 0 0 1-2-2V5h4v4zm12 0h2a2 2 0 0 0 2-2V5h-4v4zM8 21h8M12 17v4M6 9h12v4a6 6 0 0 1-12 0V9z')
export const IconCheck = createIcon('M5 13l4 4L19 7')
export const IconGraduation = createIcon('M22 10l-10-5L2 10l10 5 10-5zM6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5')
export const IconGlobe = createIcon('M12 2a10 10 0 1 0 10 10M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z')
export const IconZap = createIcon('M13 2L3 14h9l-1 8 10-12h-9l1-8z')
export const IconSparkle = createIcon('M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2zM4 20h16M8 22l4-3 4 3')
export const IconMap = createIcon('M9 20l-7-3V4l7 3v13zm6 0l7-3V4l-7 3v13zM9 20V7M15 20V7')

// UI icons
export const IconLock = createIcon('M8 11V7a4 4 0 0 1 8 0v4M6 11h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM12 16v2')
export const IconClose = createIcon('M18 6L6 18M6 6l12 12')
export const IconPin = createIcon('M12 2a8 8 0 0 0-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z' + '|M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z')
export const IconCircle = createIcon('M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z')
export const IconCircleFilled = createCircleFilledIcon()

function createCircleFilledIcon() {
  return ({ size = 24, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" {...props}>
      <circle cx="12" cy="12" r="6" />
    </svg>
  )
}

export const IconLightbulb = createIcon('M9 18h6M10 22h4M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14')
export const IconWarning = createIcon('M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01')
export const IconClock = createIcon('M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z' + '|M12 6v6l4 2')
export const IconTrending = createIcon('M23 6l-9.5 9.5-5-5L1 18')
export const IconBook = createIcon('M4 6h16M4 12h16M4 18h12')
export const IconUser = createIcon('M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z')
export const IconLogOut = createIcon('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9')

export function getAchievementIcon(name: string, size = 28) {
  const map: Record<string, (props: IconProps) => React.ReactNode> = {
    star: IconStar,
    books: IconBooks,
    target: IconTarget,
    crown: IconCrown,
    fire: IconFire,
    muscle: IconMuscle,
    trophy: IconTrophy,
    check: IconCheck,
    graduation: IconGraduation,
    globe: IconGlobe,
    zap: IconZap,
    sparkle: IconSparkle,
    map: IconMap,
  }
  const Comp = map[name]
  return Comp ? <Comp size={size} /> : null
}
