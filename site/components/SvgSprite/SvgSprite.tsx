// Shared SVG symbol sprite, ported verbatim from the original site/index.html.
// Rendered as raw markup (static, non-interactive) to avoid hand-converting
// ~28 symbols' presentation attributes to JSX camelCase.
const SYMBOLS = `
  <symbol id="logo-module" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M12 2.6 20.5 7.3v9.4L12 21.4 3.5 16.7V7.3z" /><path d="M3.5 7.3 12 12l8.5-4.7M12 12v9.4" /></g></symbol>
  <symbol id="fw-react" viewBox="0 0 24 24"><rect width="24" height="24" rx="8" fill="#0b3a47" /><g stroke="#61dafb" stroke-width="1.4" fill="none"><ellipse cx="12" cy="12" rx="9" ry="3.6" /><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)" /><circle cx="12" cy="12" r="1.6" fill="#61dafb" stroke="none" /></g></symbol>
  <symbol id="fw-next" viewBox="0 0 24 24"><rect width="24" height="24" rx="8" fill="#000000" /><path d="M7 7v10M7 7l9 11" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round" /><path d="M16 7v6.5" stroke="#fff" stroke-width="1.7" stroke-linecap="round" /></symbol>
  <symbol id="fw-vue" viewBox="0 0 24 24"><rect width="24" height="24" rx="8" fill="#14231d" /><path d="M4 6h3.2L12 14l4.8-8H20l-8 13.5z" stroke="#42b883" stroke-width="1.5" fill="none" stroke-linejoin="round" /></symbol>
  <symbol id="fw-svelte" viewBox="0 0 24 24"><rect width="24" height="24" rx="8" fill="#3a1a0e" /><path d="M14.5 7.5c-2-1.3-4.7-.8-6 1.1-1.4 1.9-.9 4.3.6 5.4-.2.4-.3.9-.3 1.4 0 1.7 1.5 3.1 3.6 3.1 1 0 2-.4 2.8-1.1l2-1.7c2-1.3 2.4-3.7 1-5.6" stroke="#ff5d2b" stroke-width="1.4" fill="none" stroke-linejoin="round" /></symbol>
  <symbol id="fw-node" viewBox="0 0 24 24"><rect width="24" height="24" rx="8" fill="#13270f" /><g stroke="#7fc241" stroke-width="1.4" fill="none"><path d="M12 3.5 20 8v8L12 20.5 4 16V8z" stroke-linejoin="round" /><path d="M12 16c-2 0-3-1-3-2.4 0-.8.6-1.3 1.5-1.3 1 0 1.4.5 1.4 1.6 0 1 .8 1.6 2.1 1.6 1.2 0 1.9-.5 1.9-1.2 0-.8-.5-1.1-2.2-1.4-2-.3-3.2-.8-3.2-2.3 0-1.4 1.2-2.2 3.1-2.2 1.8 0 3 .7 3.1 2.2" /></g></symbol>
  <symbol id="fw-expo" viewBox="0 0 24 24"><rect width="24" height="24" rx="8" fill="#0b1020" /><path d="M12 5 5 18M12 5l7 13M9 13h6" stroke="#e2e8f0" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" /></symbol>
  <symbol id="i-alert" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 1 21h22z" /><path d="M12 9v5M12 17.5v.5" /></g></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="m20 6-11 11-5-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></symbol>
  <symbol id="i-checkcircle" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></g></symbol>
  <symbol id="i-search" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></g></symbol>
  <symbol id="i-refresh" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></g></symbol>
  <symbol id="i-gear" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2" /><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" /></g></symbol>
  <symbol id="i-finder" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M12 4v16" /><path d="M7 9h.01M16.5 9c0 1.5-.8 3-1.5 4" /></g></symbol>
  <symbol id="i-trash" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6M14 11v6" /></g></symbol>
  <symbol id="i-chev-right" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></symbol>
  <symbol id="i-arrow-down" viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></symbol>
  <symbol id="i-clock" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></g></symbol>
  <symbol id="i-bell" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></g></symbol>
  <symbol id="i-calendar" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 9h18M8 3v4M16 3v4" /></g></symbol>
  <symbol id="i-code" viewBox="0 0 24 24"><path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 4l-4 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></symbol>
  <symbol id="i-hdd" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M7 15h.01M11 15h6" /></g></symbol>
  <symbol id="i-grid" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="13" width="8" height="8" rx="2" /></g></symbol>
  <symbol id="i-download" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 11l5 4 5-4" /><path d="M5 20h14" /></g></symbol>
  <symbol id="i-github" viewBox="0 0 24 24"><path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></symbol>
  <symbol id="i-sun" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12a7 7 0 0 1 14 0" /><path d="M8 12a4 4 0 0 1 8 0" /><circle cx="12" cy="13" r="0.6" fill="currentColor" /></g></symbol>
  <symbol id="i-battery" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="7" width="16" height="9" rx="2.5" /><rect x="5" y="9" width="9" height="5" rx="1" fill="currentColor" stroke="none" /><path d="M20.5 10.5v3" stroke-linecap="round" /></g></symbol>
  <symbol id="i-power" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v10" /><path d="M18.4 6.6a9 9 0 1 1-12.77.04" /></g></symbol>
`;

export function SvgSprite() {
  return (
    <svg
      className="sprite"
      aria-hidden
      focusable={false}
      dangerouslySetInnerHTML={{ __html: SYMBOLS }}
    />
  );
}
