import type React from 'react'
import { Composition } from 'remotion'
import { ScreenBeauty, ScreenClean, ScreenSafe } from './Screens'
import { Showcase } from './Showcase'
import { DURATION_F, FPS, HEIGHT, WIDTH } from './Showcase/Showcase.constants'

const SCREEN_W = 1600
const SCREEN_H = 1000

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ShowcaseSquare"
      component={Showcase}
      durationInFrames={DURATION_F}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    {/* Static landscape stills for Product Hunt / social galleries. */}
    <Composition
      id="ShotBeauty"
      component={ScreenBeauty}
      durationInFrames={1}
      fps={FPS}
      width={SCREEN_W}
      height={SCREEN_H}
    />
    <Composition
      id="ShotClean"
      component={ScreenClean}
      durationInFrames={1}
      fps={FPS}
      width={SCREEN_W}
      height={SCREEN_H}
    />
    <Composition
      id="ShotSafe"
      component={ScreenSafe}
      durationInFrames={1}
      fps={FPS}
      width={SCREEN_W}
      height={SCREEN_H}
    />
  </>
)
