// app.jsx — main launcher: search, sliding selection, sort, delete flow,
// views, keyboard nav, dynamic threshold-proximity color. Mounts the app.

var { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } = React;
var GB = 1024 * MB;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#ff6363",
  "sizeStyle": "plain",
  "density": "compact",
  "thresholdGB": 5,
  "scanInterval": "daily",
  "notify": true
}/*EDITMODE-END*/;

// mini app icon
function AppIcon({ size = 26, accent }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, flex: "0 0 auto",
      display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
      background: `linear-gradient(155deg, ${mixColor(accent, "#fff", 0.12)}, ${mixColor(accent, "#000", 0.32)})`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 8px ${mixColor(accent, "#000", 0.25)}` }}>
      <Glyph kind="module" size={size * 0.56} color="#fff" sw={1.9} />
    </div>
  );
}

function SortTab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      border: "none", background: "transparent", cursor: "pointer", padding: "3px 8px", borderRadius: 6,
      fontSize: 11.5, fontWeight: 600, fontFamily: "var(--ui-font)",
      color: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.4)",
      background: active ? "rgba(255,255,255,0.08)" : "transparent", transition: "color .12s, background .12s",
    }}>{label}</button>
  );
}

function LauncherWindow(props) {
  const embedded = !!(props && props.onClose);
  const ownTweaks = useTweaks(TWEAK_DEFAULTS);
  const t = (props && props.t) || ownTweaks[0];
  const setTweak = (props && props.setTweak) || ownTweaks[1];
  const accent = t.accent;
  const threshold = t.thresholdGB * GB;

  const [ownProjects, setOwnProjects] = useState(MOCK_PROJECTS);
  const projects = (props && props.projects) || ownProjects;
  const setProjects = (props && props.setProjects) || setOwnProjects;
  const onClose = props && props.onClose;
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("used");
  const [sel, setSel] = useState(0);
  const [view, setView] = useState("list"); // list | scanning | settings
  const [deleting, setDeleting] = useState(() => new Set());
  const [confirm, setConfirm] = useState(null); // project pending delete
  const [toast, setToast] = useState(null);
  const [ownReclaimed, setOwnReclaimed] = useState(0);
  const reclaimed = (props && props.reclaimed != null) ? props.reclaimed : ownReclaimed;
  const setReclaimed = (props && props.setReclaimed) || setOwnReclaimed;
  const [showNotify, setShowNotify] = useState(false);

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const rowEls = useRef({});
  const toastTimer = useRef(null);

  const totalUsed = useMemo(() => projects.reduce((a, p) => a + p.size, 0), [projects]);
  const maxBytes = useMemo(() => Math.max(1, ...projects.map((p) => p.size)), [projects]);
  const ratio = totalUsed / threshold;
  const status = statusColor(ratio, accent);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = projects.filter((p) => !q || p.name.toLowerCase().includes(q) || p.path.toLowerCase().includes(q));
    arr = arr.slice().sort((a, b) => {
      if (sortBy === "size") return b.size - a.size;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return a.lastUsed - b.lastUsed; // oldest first
    });
    return arr;
  }, [projects, query, sortBy]);

  useEffect(() => { if (sel >= filtered.length) setSel(Math.max(0, filtered.length - 1)); }, [filtered.length]);

  // notify on load if over limit (standalone only; embedded uses the desktop banner)
  useEffect(() => {
    if (!embedded && t.notify && totalUsed > threshold) {
      const id = setTimeout(() => setShowNotify(true), 700);
      return () => clearTimeout(id);
    }
  }, []);

  // sliding highlight
  const [hl, setHl] = useState({ top: 0, height: 0, on: false });
  useLayoutEffect(() => {
    if (view !== "list") { setHl((h) => ({ ...h, on: false })); return; }
    const p = filtered[sel];
    const el = p && rowEls.current[p.id];
    if (el) setHl({ top: el.offsetTop, height: el.offsetHeight, on: true });
    else setHl((h) => ({ ...h, on: false }));
  }, [sel, filtered, view, t.density, t.sizeStyle, query]);

  const flashToast = useCallback((node) => {
    setToast(node);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const doOpen = useCallback((p) => { if (p) flashToast({ icon: UIIcon.chevronRight, text: `Opening ${p.name} in your editor…`, tone: "neutral" }); }, [flashToast]);
  const doFinder = useCallback((p) => { if (p) flashToast({ icon: UIIcon.finder, text: `Revealing ${p.name} in Finder…`, tone: "neutral" }); }, [flashToast]);

  const commitDelete = useCallback((p) => {
    setConfirm(null);
    setDeleting((s) => new Set(s).add(p.id));
    setTimeout(() => {
      setProjects((prev) => prev.filter((x) => x.id !== p.id));
      setDeleting((s) => { const n = new Set(s); n.delete(p.id); return n; });
      setReclaimed((r) => r + p.size);
      flashToast({ icon: UIIcon.checkCircle, text: `Reclaimed ${formatSizeStr(p.size)} · ${p.name}`, tone: "good" });
    }, 340);
  }, [flashToast]);

  const rescan = useCallback(() => { setView("scanning"); setShowNotify(false); }, []);

  // keyboard
  useEffect(() => {
    const onKey = (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === ",") { e.preventDefault(); setView((v) => (v === "settings" ? "list" : "settings")); setConfirm(null); return; }
      if (meta && (e.key === "r" || e.key === "R")) { e.preventDefault(); rescan(); return; }
      if (e.key === "Escape") {
        if (confirm) { setConfirm(null); return; }
        if (view !== "list") { setView("list"); return; }
        if (query) { setQuery(""); return; }
        if (embedded && onClose) { onClose(); }
        return;
      }
      if (confirm) {
        if (e.key === "Enter") { e.preventDefault(); commitDelete(confirm); }
        return;
      }
      if (view !== "list") return;
      if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(filtered.length - 1, s + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
      else if (e.key === "Enter") { e.preventDefault(); doOpen(filtered[sel]); }
      else if (meta && e.key === "Backspace") { e.preventDefault(); const p = filtered[sel]; if (p) setConfirm(p); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtered, sel, view, confirm, query, commitDelete, doOpen, rescan]);

  // keep selected row in view
  useEffect(() => {
    if (view !== "list") return;
    const p = filtered[sel];
    const el = p && rowEls.current[p.id];
    const c = listRef.current;
    if (el && c) {
      const top = el.offsetTop, bot = top + el.offsetHeight;
      if (top < c.scrollTop) c.scrollTop = top - 6;
      else if (bot > c.scrollTop + c.clientHeight) c.scrollTop = bot - c.clientHeight + 6;
    }
  }, [sel, view]);

  const isEmpty = projects.length === 0;
  const overBy = totalUsed - threshold;

  return (
    <div className={embedded ? "cc-stage cc-overlay" : "cc-stage"} onClick={embedded ? onClose : undefined} style={{ "--accent": accent }}>
      {/* ambient threshold glow */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(620px 380px at 50% 42%, ${mixColor(status, "rgba(0,0,0,0)", 1 - Math.min(0.5, Math.max(0, ratio - 0.55)))}, transparent 70%)`,
        opacity: ratio > 0.6 ? Math.min(0.5, (ratio - 0.6) * 0.9) : 0, transition: "opacity .6s, background .6s" }} />

      {showNotify && <NotifyBanner used={totalUsed} threshold={threshold} accent={accent}
        onOpen={() => { setShowNotify(false); inputRef.current && inputRef.current.focus(); }}
        onDismiss={() => setShowNotify(false)} />}

      <div className="cc-window" onClick={embedded ? ((e) => e.stopPropagation()) : undefined} style={{ boxShadow: `0 30px 80px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)${ratio > 0.85 ? `, 0 0 60px -10px ${mixColor(status, "rgba(0,0,0,0)", 0.45)}` : ""}` }}>
        {/* ---------- Header ---------- */}
        {view === "list" ? (
          <div className="cc-header">
            <AppIcon accent={accent} />
            <input ref={inputRef} className="cc-input" autoFocus value={query}
              onChange={(e) => { setQuery(e.target.value); setSel(0); }}
              placeholder="Search node_modules by project or path…" />
            <Gauge used={totalUsed} threshold={threshold} accent={accent} />
            {embedded && <button className="cc-close" onClick={onClose} title="Close (esc)" aria-label="Close">{UIIcon.x({ size: 14 })}</button>}
          </div>
        ) : (
          <div className="cc-header">
            <button className="cc-back" onClick={() => setView("list")} aria-label="Back">{UIIcon.chevronLeft({ size: 18 })}</button>
            <div style={{ fontSize: 14.5, fontWeight: 650, color: "rgba(255,255,255,0.92)" }}>{view === "settings" ? "Settings" : "Scanning"}</div>
            <div style={{ flex: 1 }} />
            {embedded && <button className="cc-close" onClick={onClose} title="Close (esc)" aria-label="Close">{UIIcon.x({ size: 14 })}</button>}
          </div>
        )}
        <div className="cc-divider" />

        {/* ---------- Body ---------- */}
        {view === "scanning" && <ScanningView accent={accent} onDone={() => setView("list")} />}
        {view === "settings" && (
          <SettingsView accent={accent}
            scanInterval={t.scanInterval} setScanInterval={(v) => setTweak("scanInterval", v)}
            threshold={threshold} setThreshold={(b) => setTweak("thresholdGB", +(b / GB).toFixed(1))}
            notify={t.notify} setNotify={(v) => setTweak("notify", v)} />
        )}
        {view === "list" && isEmpty && <EmptyView reclaimedTotal={reclaimed} accent={accent} />}
        {view === "list" && !isEmpty && (
          <>
            <div className="cc-listhead">
              <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: "rgba(255,255,255,0.36)" }}>
                {filtered.length} folder{filtered.length !== 1 ? "s" : ""}{query ? " found" : " · reclaimable"}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginRight: 4 }}>Sort</span>
                <SortTab label="Last used" active={sortBy === "used"} onClick={() => setSortBy("used")} />
                <SortTab label="Size" active={sortBy === "size"} onClick={() => setSortBy("size")} />
                <SortTab label="Name" active={sortBy === "name"} onClick={() => setSortBy("name")} />
              </div>
            </div>
            <div ref={listRef} className="cc-list">
              <div style={{ position: "relative" }}>
                <div className="cc-hl" style={{ top: hl.top, height: hl.height, opacity: hl.on ? 1 : 0, background: "rgba(255,255,255,0.085)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)" }} />
                {filtered.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                    No folders match “{query}”.
                  </div>
                ) : filtered.map((p, i) => (
                  <Row key={p.id} p={p} selected={i === sel} density={t.density} sizeStyle={t.sizeStyle}
                    maxBytes={maxBytes} accent={accent} deleting={deleting.has(p.id)}
                    rowRef={(el) => { if (el) rowEls.current[p.id] = el; }}
                    onSelect={() => setSel(i)} onOpen={() => doOpen(p)} onFinder={() => doFinder(p)}
                    onDelete={() => setConfirm(p)} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* ---------- Toast ---------- */}
        {toast && (
          <div className="cc-toast" style={{ borderColor: toast.tone === "good" ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.12)" }}>
            <span style={{ color: toast.tone === "good" ? "#34d399" : "rgba(255,255,255,0.7)", display: "flex" }}>{toast.icon({ size: 15 })}</span>
            <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.9)", fontWeight: 550 }}>{toast.text}</span>
          </div>
        )}

        <div className="cc-divider" />
        {/* ---------- Footer ---------- */}
        {confirm ? (
          <div className="cc-footer" style={{ background: mixColor("rgba(255,99,99,0)", accent, 0.1) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
              <span style={{ color: accent, display: "flex" }}>{UIIcon.trash({ size: 16 })}</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Delete <b>{confirm.name}</b>’s node_modules? Frees <b style={{ color: "#fff" }}>{formatSizeStr(confirm.size)}</b>.
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button className="cc-btn ghost" onClick={() => setConfirm(null)}>Cancel <Kbd wide>esc</Kbd></button>
              <button className="cc-btn danger" style={{ background: accent }} onClick={() => commitDelete(confirm)}>Delete <Kbd wide>↵</Kbd></button>
            </div>
          </div>
        ) : (
          <div className="cc-footer">
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <AppIcon accent={accent} size={20} />
              {view === "list" && !isEmpty && (
                <span style={{ fontSize: 12.5, color: ratio > 1 ? mixColor("#fff", accent, 0.5) : "rgba(255,255,255,0.55)", fontWeight: 550 }}>
                  {ratio > 1 ? `${formatSizeStr(overBy)} over your ${t.thresholdGB} GB limit` : `${(ratio * 100).toFixed(0)}% of your ${t.thresholdGB} GB limit`}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {view === "list" && !isEmpty && (
                <div className="cc-hints">
                  <span>{UIIcon.arrowUp({ size: 12 })}{UIIcon.arrowDown({ size: 12 })} navigate</span>
                  <span><Kbd><span style={{ display: "flex" }}>{UIIcon.enter({ size: 12 })}</span></Kbd> open</span>
                  <span><Kbd wide>⌘</Kbd><Kbd wide>⌫</Kbd> delete</span>
                </div>
              )}
              <button className="cc-iconbtn" title="Rescan (⌘R)" onClick={rescan}>{UIIcon.refresh({ size: 15 })}</button>
              <button className="cc-iconbtn" title="Settings (⌘,)" onClick={() => setView(view === "settings" ? "list" : "settings")}>{UIIcon.gear({ size: 16 })}</button>
            </div>
          </div>
        )}
      </div>

      {!embedded && <TweaksPanel>
        <TweakSection label="Demo" />
        <TweakButton label="Trigger alert" onClick={() => setShowNotify(true)} />
      </TweaksPanel>}
    </div>
  );
}

if (!window.__UNIFIED__) ReactDOM.createRoot(document.getElementById("root")).render(<LauncherWindow />);
