/**
 * Placeholder recommenders for missing strategies
 */

import { GeminiService } from "../../../gemini/GeminiService";
import type {
  RecommendationContext,
  TaskRecommendation,
  RecommendationFilters,
} from "../types";

export class UrgencyRecommender {
  constructor(geminiService: GeminiService) {}
  async generateRecommendations(
    context: RecommendationContext,
    limit: number,
    filters: Partial<RecommendationFilters>,
  ): Promise<TaskRecommendation[]> {
    return [];
  }
}

export class SkillBasedRecommender {
  constructor(geminiService: GeminiService) {}
  async generateRecommendations(
    context: RecommendationContext,
    limit: number,
    filters: Partial<RecommendationFilters>,
  ): Promise<TaskRecommendation[]> {
    return [];
  }
}

export class WorkloadBalancedRecommender {
  constructor(geminiService: GeminiService) {}
  async generateRecommendations(
    context: RecommendationContext,
    limit: number,
    filters: Partial<RecommendationFilters>,
  ): Promise<TaskRecommendation[]> {
    return [];
  }
}

export class DeadlineDrivenRecommender {
  constructor(geminiService: GeminiService) {}
  async generateRecommendations(
    context: RecommendationContext,
    limit: number,
    filters: Partial<RecommendationFilters>,
  ): Promise<TaskRecommendation[]> {
    return [];
  }
}

export class QualityFocusedRecommender {
  constructor(geminiService: GeminiService) {}
  async generateRecommendations(
    context: RecommendationContext,
    limit: number,
    filters: Partial<RecommendationFilters>,
  ): Promise<TaskRecommendation[]> {
    return [];
  }
}

export class StrategicRecommender {
  constructor(geminiService: GeminiService) {}
  async generateRecommendations(
    context: RecommendationContext,
    limit: number,
    filters: Partial<RecommendationFilters>,
  ): Promise<TaskRecommendation[]> {
    return [];
  }
}

export class ModelManager {
  getStats() {
    return {};
  }
  async recordFeedback(
    id: string,
    feedback: string,
    rating?: number,
    comment?: string,
  ): Promise<void> {}
  clearCache() {}
  destroy() {}
}

export class ContextAnalyzer {
  constructor(geminiService: GeminiService) {}
  async analyzeContext(
    context: RecommendationContext,
  ): Promise<RecommendationContext> {
    return context;
  }
  getStats() {
    return {};
  }
  clearCache() {}
  destroy() {}
}
