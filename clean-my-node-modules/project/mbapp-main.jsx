// mbapp-main.jsx — App: desktop, live menu bar, dropdown (main/scan/settings), tweaks.

function ScanPanel({ accent, onDone }) {
  const [pct, setPct] = React.useState(0);
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    const t0 = performance.now(),dur = 1900;let raf;
    const tick = (t) => {const e = Math.min(1, (t - t0) / dur);const eased = 1 - Math.pow(1 - e, 2.2);
      setPct(eased);setCount(Math.round(eased * 2847));
      if (e < 1) raf = requestAnimationFrame(tick);else setTimeout(onDone, 350);};
    raf = requestAnimationFrame(tick);return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div style={{ padding: "34px 24px 38px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{ position: "relative", width: 56, height: 56 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid transparent", borderTopColor: accent, animation: "mbspin .8s linear infinite" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>{UIIcon.search({ size: 22, stroke: 1.9 })}</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 14.5, fontWeight: 650, color: "#fff" }}>Scanning your disk…</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3, fontVariantNumeric: "tabular-nums" }}>{count.toLocaleString()} folders checked</div>
      </div>
      <div style={{ width: 230, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
        <div style={{ width: `${pct * 100}%`, height: "100%", background: accent, borderRadius: 3 }} />
      </div>
    </div>);

}

function SettingsPanel({ t, setTweak, accent, onBack }) {
  return (
    <div style={{ padding: "4px 12px 12px" }}>
      <div style={{ padding: "10px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Scan frequency</div></div>
        <Seg accent={accent} value={t.scanInterval} options={["6h", "daily", "weekly"]} onChange={(v) => setTweak("scanInterval", v)} />
      </div>
      <Sep2 />
      <div style={{ padding: "8px 4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Alert threshold</div>
          <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: 13, color: "#fff" }}>{t.thresholdGB.toFixed(1)} GB</span>
        </div>
        <input type="range" min="1" max="10" step="0.5" value={t.thresholdGB} onChange={(e) => setTweak("thresholdGB", parseFloat(e.target.value))} style={{ width: "100%", marginTop: 10, accentColor: accent }} />
      </div>
      <Sep2 />
      <div style={{ padding: "8px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Notify when over limit</div>
        <button onClick={() => setTweak("notify", !t.notify)} style={{ width: 40, height: 23, borderRadius: 12, border: "none", cursor: "pointer", position: "relative", background: t.notify ? accent : "rgba(255,255,255,0.15)", transition: "background .2s" }}>
          <span style={{ position: "absolute", top: 2, left: t.notify ? 19 : 2, width: 19, height: 19, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.4)" }} />
        </button>
      </div>
    </div>);

}

function UnifiedApp() {
  const [t, setTweak] = useTweaks(MB_DEFAULTS);
  const accent = t.accent;
  const thresholdGB = t.thresholdGB;
  const threshold = thresholdGB * GBx;

  const [open, setOpen] = React.useState(true);
  const [fullOpen, setFullOpen] = React.useState(false);
  const [bannerDismissed, setBannerDismissed] = React.useState(false);
  const [projects, setProjects] = React.useState(MOCK_PROJECTS);
  const [view, setView] = React.useState("main"); // main | scan | settings
  const [deleting, setDeleting] = React.useState(() => new Set());
  const [toast, setToast] = React.useState(null);
  const [reclaimed, setReclaimed] = React.useState(0);
  const toastTimer = React.useRef(null);

  const totalUsed = useMemo(() => projects.reduce((a, p) => a + p.size, 0), [projects]);
  const usedGB = totalUsed / GBx;
  const ratio = totalUsed / threshold;
  const status = statusColor(ratio, accent);
  const trackMaxGB = useMemo(() => Math.max(thresholdGB * 1.5, INITIAL_TOTAL / GBx * 1.06), [thresholdGB]);
  const over = totalUsed > threshold;

  const oldest = useMemo(() => projects.slice().sort((a, b) => a.lastUsed - b.lastUsed), [projects]);
  const visible = oldest.slice(0, 4);
  const staleSet = useMemo(() => projects.filter((p) => (Date.now() - p.lastUsed) / 86400000 > STALE_DAYS), [projects]);
  const freeable = staleSet.reduce((a, p) => a + p.size, 0);

  const flashToast = useCallback((node) => {setToast(node);clearTimeout(toastTimer.current);toastTimer.current = setTimeout(() => setToast(null), 2400);}, []);

  const removeMany = useCallback((ids, label) => {
    const set = new Set(ids);
    const freed = projects.filter((p) => set.has(p.id)).reduce((a, p) => a + p.size, 0);
    setDeleting((s) => {const n = new Set(s);ids.forEach((i) => n.add(i));return n;});
    setTimeout(() => {
      setProjects((prev) => prev.filter((p) => !set.has(p.id)));
      setDeleting((s) => {const n = new Set(s);ids.forEach((i) => n.delete(i));return n;});
      setReclaimed((r) => r + freed);
      flashToast({ text: `Reclaimed ${formatSizeStr(freed)}${label ? " · " + label : ""}`, good: true });
    }, 330);
  }, [projects, flashToast]);

  const cleanStale = useCallback(() => {if (staleSet.length) removeMany(staleSet.map((p) => p.id), `${staleSet.length} stale folders`);}, [staleSet, removeMany]);

  return (
    <div className="mb-desktop">
      {/* live menu bar */}
      <div className="mb-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 13.5 }}></span>
          <span style={{ fontSize: 13, opacity: 0.92 }}>Finder</span>
          <span style={{ fontSize: 13, opacity: 0.62 }}>File</span>
          <span style={{ fontSize: 13, opacity: 0.62 }}>Edit</span>
          <span style={{ fontSize: 13, opacity: 0.62 }}>View</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <button className="mb-tray" onClick={(e) => {e.stopPropagation();setOpen((o) => !o);setView("main");}} style={{ background: open ? "rgba(255,255,255,0.22)" : "transparent" }}>
            <span style={{ position: "relative", display: "flex" }}>
              <Glyph kind="module" size={17} color={over ? "#ff8a8a" : "rgba(255,255,255,0.95)"} sw={1.8} />
              {over && <span style={{ position: "absolute", top: -2, right: -3, width: 6, height: 6, borderRadius: "50%", background: accent, boxShadow: "0 0 0 1.5px rgba(0,0,0,0.3)" }} />}
            </span>
          </button>
          <svg width="18" height="14" viewBox="0 0 24 20" fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth="1.7" strokeLinecap="round"><path d="M5 12a7 7 0 0 1 14 0" /><path d="M8 12a4 4 0 0 1 8 0" /><circle cx="12" cy="13" r="0.7" fill="rgba(255,255,255,0.92)" /></svg>
          <svg width="22" height="14" viewBox="0 0 24 20" fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth="1.6"><rect x="3" y="7" width="16" height="9" rx="2.5" /><rect x="5" y="9" width="9" height="5" rx="1" fill="rgba(255,255,255,0.92)" stroke="none" /><path d="M20.5 10.5v3" strokeLinecap="round" /></svg>
          <span style={{ fontSize: 12.5, fontWeight: 500 }}>Mon&nbsp;9:41</span>
        </div>
      </div>

      {/* click-away */}
      {open && <div style={{ position: "fixed", inset: 0, zIndex: 8 }} onClick={() => setOpen(false)} />}

      {/* dropdown */}
      {open &&
      <div className="mb-panel" onClick={(e) => e.stopPropagation()}>
          {view === "scan" && <ScanPanel accent={accent} onDone={() => setView("main")} />}
          {view === "settings" &&
        <>
              <div className="mb-phead"><button className="mb-back" onClick={() => setView("main")}>{UIIcon.chevronLeft({ size: 17 })}</button><span style={{ fontSize: 13.5, fontWeight: 650, color: "#fff" }}>Settings</span></div>
              <Sep2 />
              <SettingsPanel t={t} setTweak={setTweak} accent={accent} onBack={() => setView("main")} />
            </>
        }
          {view === "main" &&
        <>
              <div style={{ padding: "13px 15px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: "rgba(255,255,255,0.42)" }}>node_modules on disk</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginTop: 4 }}>
                  <span style={{ fontSize: 27, fontWeight: 700, color: "#fff", letterSpacing: "-.01em", fontVariantNumeric: "tabular-nums" }}>{formatSizeStr(totalUsed)}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: over ? status : "#34d399", display: "inline-flex", alignItems: "center", gap: 4 }} data-comment-anchor="7280f29192-div-77-7">
                    {over ? <>{UIIcon.alert({ size: 12 })}{formatSizeStr(totalUsed - threshold)} over your {thresholdGB} GB limit</> : <>{UIIcon.check({ size: 13 })}{formatSizeStr(threshold - totalUsed)} under your {thresholdGB} GB limit</>}
                  </span>
                </div>
                <PixelMeter usedGB={usedGB} thresholdGB={thresholdGB} trackMaxGB={trackMaxGB} accent={accent} cells={Math.round(t.cells)} style={t.meter} />
              </div>
              <Sep2 />
              {projects.length === 0 ?
          <div style={{ padding: "26px 20px 30px", textAlign: "center" }}>
                  <div style={{ width: 46, height: 46, margin: "0 auto", borderRadius: "50%", background: "rgba(52,211,153,0.13)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center" }}>{UIIcon.checkCircle({ size: 26 })}</div>
                  <div style={{ fontSize: 14.5, fontWeight: 650, color: "#fff", marginTop: 10 }}>All clean</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>Reclaimed {formatSizeStr(reclaimed)} this session.</div>
                </div> :

          <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 15px 4px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: "rgba(255,255,255,0.42)" }}>Reclaimable · oldest first</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{projects.length} total</span>
                  </div>
                  {visible.map((p) => <MiniRow key={p.id} p={p} accent={accent} deleting={deleting.has(p.id)} onDelete={() => removeMany([p.id], p.name)} onReveal={() => flashToast({ text: `Revealing ${p.name} in Finder…` })} data-comment-anchor="54bd43b6ae-div-110-9" />)}
                  {staleSet.length > 0 ?
            <CTA2 accent={accent} sub={`Frees ${formatSizeStr(freeable)} · keeps your active projects`} onClick={cleanStale}>Clean {staleSet.length} stale folders</CTA2> :
            <div style={{ height: 8 }} />}
                </>
          }
              <Sep2 />
              <div style={{ paddingBottom: 5 }}>
                <MItem icon={UIIcon.search} label="Open full window…" shortcut="⌘O" onClick={() => {setFullOpen(true);setOpen(false);}} />
                <MItem icon={UIIcon.refresh} label="Scan now" shortcut="⌘R" onClick={() => setView("scan")} />
                <MItem icon={UIIcon.gear} label="Settings…" shortcut="⌘," onClick={() => setView("settings")} />
              </div>
              <Sep2 />
              <div style={{ padding: "1px 16px 9px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Last scan 6 min ago · next in {t.scanInterval === "6h" ? "6 h" : t.scanInterval === "daily" ? "18 h" : "5 d"}</div>
            </>
        }

          {toast && <div className="mb-toast" style={{ borderColor: toast.good ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.14)" }}>
            <span style={{ color: toast.good ? "#34d399" : "rgba(255,255,255,0.7)", display: "flex" }}>{(toast.good ? UIIcon.checkCircle : UIIcon.finder)({ size: 15 })}</span>
            <span style={{ fontSize: 12.5, color: "#fff", fontWeight: 550 }}>{toast.text}</span>
          </div>}
        </div>
      }

      {/* dock */}
      <div className="mb-dock">
        {["#3b82f6", "#34d399", "#f5a623"].map((c, i) => <div key={i} className="mb-dockicon" style={{ background: `linear-gradient(155deg, ${mixColor(c, "#fff", 0.15)}, ${mixColor(c, "#000", 0.3)})` }} />)}
        <div style={{ width: 1, height: 38, background: "rgba(255,255,255,0.18)", margin: "0 4px" }} />
        <div className="mb-dockicon mb-dockactive" title="Clean my node_modules" onClick={() => {setOpen(true);setView("main");}}>
          <AppTile kind="module" size={48} accent={accent} />
          {over && <span className="mb-dockdot" style={{ background: accent }} />}
        </div>
      </div>

      {!open && <div className="mb-hint">Click the <b>◳</b> in the menu bar ↑</div>}

      {/* threshold notification on the desktop */}
      {over && t.notify && !open && !fullOpen && !bannerDismissed && typeof NotifyBanner !== "undefined" &&
      <NotifyBanner used={totalUsed} threshold={threshold} accent={accent}
      onOpen={() => {setBannerDismissed(true);setFullOpen(true);}}
      onDismiss={() => setBannerDismissed(true)} />
      }

      {/* full launcher window, sharing the same projects + tweaks */}
      {fullOpen && typeof LauncherWindow !== "undefined" &&
      <LauncherWindow projects={projects} setProjects={setProjects}
      reclaimed={reclaimed} setReclaimed={setReclaimed}
      t={t} setTweak={setTweak} onClose={() => setFullOpen(false)} />
      }

      <TweaksPanel>
        <TweakSection label="Demo" />
        <TweakButton label="Reset folders" onClick={() => {setProjects(MOCK_PROJECTS);setReclaimed(0);setBannerDismissed(false);}} />
      </TweaksPanel>
    </div>);

}

function CTA2({ accent, children, sub, onClick }) {
  const [h, setH] = React.useState(false);
  return (
    <button onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onClick}
    style={{ width: "calc(100% - 16px)", margin: "4px 8px 6px", border: "none", cursor: "pointer", padding: "9px 12px", borderRadius: 9, background: accent, color: "#fff", display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-start", filter: h ? "brightness(1.08)" : "none", transition: "filter .1s" }}>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{children}</span>
      {sub && <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>{sub}</span>}
    </button>);

}

ReactDOM.createRoot(document.getElementById("root")).render(<UnifiedApp />);