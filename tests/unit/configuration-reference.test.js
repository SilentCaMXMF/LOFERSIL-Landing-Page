import fs from "fs";
import { describe, it, expect } from "vitest";

describe("Configuration Reference Documentation", () => {
  it("should exist and have content", () => {
    const filePath = "docs/configuration-reference.md";
    expect(fs.existsSync(filePath)).toBe(true);
    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(0);
  });
});
