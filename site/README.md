# Landing page

Static marketing site for **Clean my node_modules**, ported from the design handoff in
`clean-my-node-modules/project/landing/` with the content updated to match the real app
(open source + $9 signed binary). No build step, no dependencies — three files:
`index.html`, `landing.css`, `landing.js`.

## Preview

```sh
cd site
python3 -m http.server 8000   # then open http://localhost:8000
```

Or just open `index.html` directly in a browser.

## Deploy

GitHub Pages-ready as-is: point Pages at this folder (or publish it to a `gh-pages`
branch) and it serves without any build.

The "Get the app — $9" buttons currently point to `#` — replace them with the
Lemon Squeezy product URL (search for `TODO: Lemon Squeezy`).
