import { describe, it, expect } from "vitest";
import { mix, statusColor, buildMeterCells } from "./meter";

describe("mix", () => {
  it("returns endpoint at t=0 and t=1", () => {
    expect(mix("#000000", "#ffffff", 0)).toBe("rgb(0,0,0)");
    expect(mix("#000000", "#ffffff", 1)).toBe("rgb(255,255,255)");
  });
  it("clamps t outside [0,1]", () => {
    expect(mix("#000000", "#ffffff", -1)).toBe("rgb(0,0,0)");
    expect(mix("#000000", "#ffffff", 2)).toBe("rgb(255,255,255)");
  });
});

describe("statusColor", () => {
  it("returns an rgb() string across the range", () => {
    expect(statusColor(0)).toMatch(/^rgb\(/);
    expect(statusColor(0.6)).toMatch(/^rgb\(/);
    expect(statusColor(1)).toMatch(/^rgb\(/);
  });
});

describe("buildMeterCells", () => {
  const cells = buildMeterCells({ used: 5.42, threshold: 5, cells: 32 });
  it("produces the requested cell count", () => {
    expect(cells).toHaveLength(32);
  });
  it("marks exactly one hatch (limit) cell with a title", () => {
    const hatched = cells.filter((c) => c.hatch);
    expect(hatched).toHaveLength(1);
    expect(hatched[0].title).toBe("5 GB limit");
  });
  it("fills cells up to used and glows those over threshold", () => {
    expect(cells.some((c) => c.color && !c.hatch)).toBe(true);
    expect(cells.some((c) => c.glow)).toBe(true);
  });
  it("leaves trailing cells empty when under-filled", () => {
    const under = buildMeterCells({ used: 1, threshold: 5, cells: 20 });
    expect(under.some((c) => !c.hatch && !c.color)).toBe(true);
    expect(under.some((c) => c.glow)).toBe(false);
  });
});
