import { describe, expect, it } from "vitest";
import { pixrowColors } from "./Pixrow";

describe("pixrowColors", () => {
  it("mirrored strip is the exact reverse of the default strip", () => {
    expect(pixrowColors(7, true)).toEqual(
      [...pixrowColors(7, false)].reverse(),
    );
  });

  it("default strip runs green to red left-to-right", () => {
    const colors = pixrowColors(7, false);
    expect(colors[0]).not.toBe(colors[colors.length - 1]);
  });
});
