/**
 * Test file for Cost-Aware Routing System
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CostAwareRoutingFactory, OperationType } from "./routing.js";

describe("Cost-Aware Routing System", () => {
  let router: any;
  let database: any;
  let tracker: any;

  beforeEach(() => {
    const system = CostAwareRoutingFactory.createDefaultSystem();
    router = system.router;
    database = system.database;
    tracker = system.tracker;
  });

  describe("Text Generation Routing", () => {
    it("should route text generation to appropriate model", async () => {
      const textModel = await router.routeOperation(
        OperationType.TEXT_GENERATION,
        {
          minQuality: "standard",
        },
      );

      expect(textModel).toBeDefined();
      expect(textModel.provider).toBeDefined();
      expect(textModel.modelId).toBeDefined();
      expect(textModel.cost.tier).toBeDefined();

      const costEstimate = router.getCostEstimate(
        textModel,
        OperationType.TEXT_GENERATION,
        { maxTokens: 1000 },
      );
      expect(typeof costEstimate).toBe("number");
      expect(costEstimate).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Image Generation Routing", () => {
    it("should route image generation to appropriate model", async () => {
      const imageModel = await router.routeOperation(
        OperationType.IMAGE_GENERATION,
      );

      expect(imageModel).toBeDefined();
      expect(imageModel.provider).toBeDefined();
      expect(imageModel.modelId).toBeDefined();
      expect(imageModel.cost.tier).toBeDefined();

      const costEstimate = router.getCostEstimate(
        imageModel,
        OperationType.IMAGE_GENERATION,
      );
      expect(typeof costEstimate).toBe("number");
      expect(costEstimate).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Analytics", () => {
    it("should provide analytics data", () => {
      const analytics = tracker.getAnalytics();

      expect(analytics).toBeDefined();
      expect(typeof analytics.totalCost).toBe("number");
      expect(typeof analytics.totalOperations).toBe("number");
      expect(analytics.freeTierUsage).toBeDefined();
      expect(typeof analytics.freeTierUsage.used).toBe("number");
      expect(typeof analytics.freeTierUsage.limit).toBe("number");
      expect(typeof analytics.freeTierUsage.percentage).toBe("number");
      expect(Array.isArray(analytics.recommendations)).toBe(true);
    });
  });

  describe("Model Database", () => {
    it("should provide free models", () => {
      const freeModels = database.getFreeModels();

      expect(Array.isArray(freeModels)).toBe(true);
      freeModels.forEach((model) => {
        expect(model.provider).toBeDefined();
        expect(model.modelId).toBeDefined();
        expect(model.capabilities).toBeDefined();
        expect(model.capabilities.quality).toBeDefined();
      });
    });

    it("should provide paid models", () => {
      const paidModels = database.getPaidModels();

      expect(Array.isArray(paidModels)).toBe(true);
      paidModels.forEach((model) => {
        expect(model.provider).toBeDefined();
        expect(model.modelId).toBeDefined();
        expect(model.cost).toBeDefined();
        expect(typeof model.cost.costPerOperation).toBe("number");
      });
    });
  });
});
