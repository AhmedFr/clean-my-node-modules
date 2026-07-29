import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

const COMPONENTS_DIR = fileURLToPath(new URL('.', import.meta.url))

/** Components with no visual output of their own. Add sparingly, with a reason. */
const EXEMPT: Record<string, string> = {
  ErrorBoundary: 'behavioral wrapper, renders only its children or a crash screen',
}

it('every component folder has a stories file', () => {
  const missing = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !(e.name in EXEMPT))
    .filter(
      (e) =>
        !readdirSync(join(COMPONENTS_DIR, e.name)).some((f) =>
          f.endsWith('.stories.tsx'),
        ),
    )
    .map((e) => e.name)

  expect(
    missing,
    `Component folders without a *.stories.tsx: ${missing.join(', ')}. ` +
      'Add stories (see docs/storybook/Intro.mdx) or add the folder to EXEMPT with a reason.',
  ).toEqual([])
})
