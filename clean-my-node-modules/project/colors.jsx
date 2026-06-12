// colors.jsx — color interpolation + threshold status color.
function _hex(c) {
  if (c[0] === "#") {
    const h = c.slice(1);
    const n = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16), 1];
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m) { const a = m[1].split(",").map((x) => parseFloat(x)); return [a[0], a[1], a[2], a[3] == null ? 1 : a[3]]; }
  return [136, 143, 152, 1];
}
function mixColor(a, b, t) {
  t = Math.max(0, Math.min(1, t));
  const A = _hex(a), B = _hex(b);
  const r = Math.round(A[0] + (B[0] - A[0]) * t);
  const g = Math.round(A[1] + (B[1] - A[1]) * t);
  const bl = Math.round(A[2] + (B[2] - A[2]) * t);
  const al = (A[3] + (B[3] - A[3]) * t).toFixed(3);
  return `rgba(${r},${g},${bl},${al})`;
}
// ratio = used/threshold. calm green -> amber -> danger accent.
function statusColor(ratio, accent) {
  const safe = "#34d399", warn = "#f5b14c";
  if (ratio <= 0.5) return mixColor("#22b378", safe, ratio / 0.5);
  if (ratio <= 0.82) return mixColor(safe, warn, (ratio - 0.5) / 0.32);
  return mixColor(warn, accent || "#ff6363", Math.min(1, (ratio - 0.82) / 0.18));
}
Object.assign(window, { mixColor, statusColor });
