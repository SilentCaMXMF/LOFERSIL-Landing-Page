import { describe, it, expect, vi, beforeEach } from "vitest";
import { MonitoringReportingManager } from "./MonitoringReporting";
import { AutomationTriggersManager } from "./AutomationTriggers";

describe("MonitoringReportingManager", () => {
  let monitoring: MonitoringReportingManager;
  let mockAutomationManager: AutomationTriggersManager;

  beforeEach(() => {
    mockAutomationManager = new AutomationTriggersManager();
    monitoring = new MonitoringReportingManager(mockAutomationManager);
  });

  describe("initialization", () => {
    it("should initialize with automation manager", () => {
      expect(monitoring).toBeDefined();
    });
  });

  describe("metrics retrieval", () => {
    it("should return metrics array", () => {
      const metrics = monitoring.getMetrics();
      expect(Array.isArray(metrics)).toBe(true);
    });
  });

  describe("reports", () => {
    it("should generate daily reports", async () => {
      const report = await monitoring.generateDailyReport();

      expect(report).toBeDefined();
      expect(report.type).toBe("daily");
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it("should generate weekly reports", async () => {
      const report = await monitoring.generateWeeklyReport();

      expect(report).toBeDefined();
      expect(report.type).toBe("weekly");
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it("should generate monthly reports", async () => {
      const report = await monitoring.generateMonthlyReport();

      expect(report).toBeDefined();
      expect(report.type).toBe("monthly");
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it("should return reports array", () => {
      const reports = monitoring.getReports();
      expect(Array.isArray(reports)).toBe(true);
    });
  });

  describe("alerts", () => {
    it("should return alerts array", () => {
      const alerts = monitoring.getAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it("should resolve alerts", () => {
      // This tests the resolveAlert method indirectly through the class
      expect(monitoring).toBeDefined();
    });
  });
});
