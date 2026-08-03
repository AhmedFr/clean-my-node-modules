import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

const COMPONENTS_DIR = fileURLToPath(new URL('.', import.meta.url))

/** Non-visual or server-only components. Add sparingly, with a reason. */
const EXEMPT: Record<string, string> = {
  JsonLd: 'renders a script tag with structured data, nothing visual',
  SetHtmlLang: 'side-effect component, sets the html lang attribute',
  SvgSprite: 'invisible svg symbol definitions',
  RevealClient: 'scroll-reveal behavior wrapper, no visual output of its own',
  'pages/BlogArticle': 'server page composition, reads markdown from disk',
  'pages/BlogIndex': 'server page composition, reads markdown from disk',
  'pages/HomePage': 'server page composition',
  'pages/LegalPage': 'server page composition, reads markdown from disk',
  'pages/PrivacyPage': 'server page composition, reads markdown from disk',
}

const units = (): string[] => {
  const top = readdirSync(COMPONENTS_DIR, { withFileTypes: true }).filter((e) =>
    e.isDirectory(),
  )
  return top.flatMap((e) =>
    e.name === 'pages'
      ? readdirSync(join(COMPONENTS_DIR, 'pages'), { withFileTypes: true })
          .filter((p) => p.isDirectory())
          .map((p) => `pages/${p.name}`)
      : [e.name],
  )
}

it('every component folder has a stories file', () => {
  const missing = units()
    .filter((u) => !(u in EXEMPT))
    .filter(
      (u) =>
        !readdirSync(join(COMPONENTS_DIR, u)).some((f) =>
          f.endsWith('.stories.tsx'),
        ),
    )

  expect(
    missing,
    `Component folders without a *.stories.tsx: ${missing.join(', ')}. ` +
      'Add stories (see site/docs/storybook/Intro.mdx) or add the folder to EXEMPT with a reason.',
  ).toEqual([])
})
