const fs = require("fs");
const path = require("path");

describe("docs/monitoring-maintenance.md", () => {
  test("file exists and has content", () => {
    const filePath = path.join(
      __dirname,
      "../../docs/monitoring-maintenance.md",
    );
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, "utf8");
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain("# Monitoring Setup and Maintenance Procedures");
  });
});
