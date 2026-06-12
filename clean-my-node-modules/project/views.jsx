// views.jsx — Scanning, Empty/all-clean, Settings, and the OS notification banner.

// ---------- Scanning ----------
function ScanningView({ accent, onDone }) {
  const [pct, setPct] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const samplePaths = [
    "~/Work/checkout-flow", "~/Code/experiments/hackathon-bot", "~/Sites/blog-astro",
    "~/Work/internal-tools", "~/Code/personal/recipe-app-old", "~/Work/design-system/ui-kit",
    "~/Code/clients/acme/legacy-dashboard", "~/Sites/portfolio-2021",
  ];
  const [line, setLine] = React.useState(0);
  React.useEffect(() => {
    const t0 = performance.now(), dur = 2600;
    let raf;
    const tick = (t) => {
      const e = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - e, 2.2);
      setPct(eased); setCount(Math.round(eased * 2847));
      setLine(Math.floor(e * samplePaths.length * 2) % samplePaths.length);
      if (e < 1) raf = requestAnimationFrame(tick); else setTimeout(onDone, 380);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div style={{ padding: "46px 30px 50px", display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
      <div style={{ position: "relative", width: 84, height: 84 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid transparent", borderTopColor: accent, animation: "ccspin .8s linear infinite" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>{UIIcon.search({ size: 30, stroke: 1.8 })}</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 650, color: "rgba(255,255,255,0.95)" }}>Scanning your disk…</div>
        <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{count.toLocaleString()} folders checked</div>
      </div>
      <div style={{ width: 300, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ width: `${pct * 100}%`, height: "100%", background: accent, borderRadius: 3 }} />
      </div>
      <div style={{ fontFamily: "var(--mono-font)", fontSize: 11.5, color: "rgba(255,255,255,0.32)", maxWidth: 340, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {samplePaths[line]}/node_modules
      </div>
    </div>
  );
}

// ---------- Empty / all clean ----------
function EmptyView({ reclaimedTotal, accent }) {
  return (
    <div style={{ padding: "52px 30px 58px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(52,211,153,0.12)", color: "#34d399", animation: "ccpop .5s cubic-bezier(.2,1.4,.4,1)" }}>
        {UIIcon.checkCircle({ size: 38, stroke: 2 })}
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.96)" }}>All clean</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 6, maxWidth: 320, lineHeight: 1.5 }}>
          No stale <code style={{ fontFamily: "var(--mono-font)", color: "rgba(255,255,255,0.7)" }}>node_modules</code> over your limit. {reclaimedTotal > 0 ? <>You reclaimed <span style={{ color: "#34d399", fontWeight: 600 }}>{formatSizeStr(reclaimedTotal)}</span> this session.</> : "Your disk is in great shape."}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 4, color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
        {UIIcon.refresh({ size: 13 })} Next scan in 6 hours · <Kbd wide>⌘R</Kbd> to rescan now
      </div>
    </div>
  );
}

// ---------- Settings ----------
function SettingsRow({ label, hint, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "13px 4px" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 550, color: "rgba(255,255,255,0.9)" }}>{label}</div>
        {hint && <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ flex: "0 0 auto" }}>{children}</div>
    </div>
  );
}

function Segmented({ options, value, onChange, accent }) {
  return (
    <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.06)", borderRadius: 9, padding: 3, gap: 2 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            border: "none", cursor: "pointer", padding: "6px 12px", borderRadius: 7, fontSize: 12.5, fontWeight: 600,
            fontFamily: "var(--ui-font)", color: on ? "#fff" : "rgba(255,255,255,0.55)",
            background: on ? accent : "transparent", transition: "background .15s, color .15s",
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function SettingsView({ scanInterval, setScanInterval, threshold, setThreshold, notify, setNotify, accent }) {
  const gb = (threshold / (1024 * MB));
  return (
    <div style={{ padding: "12px 18px 22px" }}>
      <SettingsRow label="Scan frequency" hint="How often Clean scans your disk in the background">
        <Segmented accent={accent} value={scanInterval} onChange={setScanInterval}
          options={[{ value: "6h", label: "6h" }, { value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }, { value: "manual", label: "Manual" }]} />
      </SettingsRow>
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
      <SettingsRow label="Alert threshold" hint={`Notify me when node_modules folders exceed ${gb.toFixed(1)} GB total`}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input type="range" min="1" max="10" step="0.5" value={gb}
            onChange={(e) => setThreshold(parseFloat(e.target.value) * 1024 * MB)}
            style={{ width: 150, accentColor: accent }} />
          <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 650, fontSize: 13, color: "rgba(255,255,255,0.9)", minWidth: 48 }}>{gb.toFixed(1)} GB</span>
        </div>
      </SettingsRow>
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
      <SettingsRow label="Threshold notifications" hint="Show a desktop alert the moment you cross the limit">
        <button onClick={() => setNotify(!notify)} style={{
          width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative",
          background: notify ? accent : "rgba(255,255,255,0.14)", transition: "background .2s",
        }}>
          <span style={{ position: "absolute", top: 2, left: notify ? 20 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .2s cubic-bezier(.2,.8,.2,1)", boxShadow: "0 1px 3px rgba(0,0,0,.4)" }} />
        </button>
      </SettingsRow>
    </div>
  );
}

// ---------- OS notification banner ----------
function NotifyBanner({ used, threshold, accent, onOpen, onDismiss }) {
  return (
    <div style={{
      position: "absolute", top: 18, right: 18, width: 360, zIndex: 50,
      borderRadius: 16, padding: 14, display: "flex", gap: 12, alignItems: "flex-start",
      background: "rgba(28,28,30,0.72)", backdropFilter: "blur(30px) saturate(160%)",
      WebkitBackdropFilter: "blur(30px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)",
      boxShadow: "0 18px 50px rgba(0,0,0,0.5)", animation: "ccslidein .45s cubic-bezier(.2,.9,.3,1)",
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(160deg, ${accent}, ${mixColor(accent, "#000", 0.35)})`, color: "#fff", boxShadow: `0 4px 14px ${mixColor(accent, "#000", 0.2)}` }}>
        {UIIcon.alert({ size: 20, stroke: 2 })}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.95)" }}>Clean my node_modules</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>now</span>
        </div>
        <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.72)", marginTop: 3, lineHeight: 1.45 }}>
          You've crossed your limit — <b style={{ color: "#fff" }}>{formatSizeStr(used)}</b> of stale dependencies are taking up space.
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={onOpen} style={{ flex: 1, border: "none", cursor: "pointer", padding: "7px 10px", borderRadius: 8, fontWeight: 650, fontSize: 12.5, fontFamily: "var(--ui-font)", color: "#fff", background: accent }}>Review &amp; clean</button>
          <button onClick={onDismiss} style={{ border: "none", cursor: "pointer", padding: "7px 12px", borderRadius: 8, fontWeight: 600, fontSize: 12.5, fontFamily: "var(--ui-font)", color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.08)" }}>Later</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScanningView, EmptyView, SettingsView, Segmented, NotifyBanner });
