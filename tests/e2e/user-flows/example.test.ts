/**
 * Unit Test Example
 * Example unit test to verify the test configuration works
 */

import { describe, it, expect } from "vitest";

describe("Unit Test Configuration", () => {
  it("should have access to vitest globals", () => {
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });

  it("should run basic assertions", () => {
    expect(true).toBe(true);
    expect(1 + 1).toBe(2);
    expect("hello").toContain("hell");
  });

  it("should have access to DOM environment", () => {
    expect(document).toBeDefined();
    expect(window).toBeDefined();
    expect(navigator).toBeDefined();
  });

  it("should create DOM elements", () => {
    const div = document.createElement("div");
    div.textContent = "Test";
    document.body.appendChild(div);

    expect(div.textContent).toBe("Test");
    expect(document.body.contains(div)).toBe(true);
  });
});
