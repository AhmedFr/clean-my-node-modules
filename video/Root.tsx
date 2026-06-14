import React from 'react'
import { Composition } from 'remotion'
import { Showcase } from './Showcase'
import { DURATION_F, FPS, HEIGHT, WIDTH } from './Showcase/Showcase.constants'

export const RemotionRoot: React.FC = () => (
  <Composition
    id="ShowcaseSquare"
    component={Showcase}
    durationInFrames={DURATION_F}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
)
