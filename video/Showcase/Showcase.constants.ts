/** Composition timing + geometry. 30fps × 300 = 10s, built to loop. */

export const FPS = 30
export const DURATION_F = 300
export const WIDTH = 1080
export const HEIGHT = 1080

// Launcher placement (top-anchored so it doesn't shift as rows collapse).
export const LAUNCHER_LEFT = 170
export const LAUNCHER_TOP = 208

// Intro
export const WINDOW_SPRING_START = 6
export const GAUGE_FILL: [number, number] = [20, 46]

// Deletion cascade — one click per row, top-down.
export const DEL_LEN = 18
export const DELETE_STARTS = [100, 111, 122, 133, 144]
export const CLICK_FRAMES = [100, 111, 122, 133, 144]

// Cursor key positions (container left/top so the arrow tip lands on the trash).
export const TRASH_TARGET: [number, number] = [871, 336]
export const CURSOR_IDLE: [number, number] = [968, 496]
export const CURSOR_EXIT: [number, number] = [1010, 712]

// Captions: [fromFrame, lengthFrames]
export const CAP1: [number, number] = [30, 66]
export const CAP2: [number, number] = [100, 52]
export const CAP3: [number, number] = [166, 74]

// Reclaim badge + brand handoff
export const BADGE_IN: [number, number] = [118, 140]
export const SCENE_OUT: [number, number] = [232, 252]
export const BRAND_IN: [number, number] = [242, 296]
