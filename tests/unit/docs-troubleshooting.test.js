import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

describe("Troubleshooting Documentation", () => {
  it("should have troubleshooting guide file", () => {
    const filePath = join(process.cwd(), "docs", "troubleshooting.md");
    expect(existsSync(filePath)).toBe(true);
  });

  it("should have substantial content", () => {
    const filePath = join(process.cwd(), "docs", "troubleshooting.md");
    const content = readFileSync(filePath, "utf-8");
    expect(content.length).toBeGreaterThan(1000);
  });

  it("should contain key sections", () => {
    const filePath = join(process.cwd(), "docs", "troubleshooting.md");
    const content = readFileSync(filePath, "utf-8");
    expect(content).toMatch(/## Connection Problems/);
    expect(content).toMatch(/## Authentication Errors/);
    expect(content).toMatch(/## Performance Issues/);
    expect(content).toMatch(/## Deployment Failures/);
    expect(content).toMatch(/## Monitoring Alerts/);
    expect(content).toMatch(/## Environment Variable Problems/);
    expect(content).toMatch(/## Email Delivery Failures/);
    expect(content).toMatch(/## Security Warnings/);
    expect(content).toMatch(/## Monitoring False Positives/);
  });
});
