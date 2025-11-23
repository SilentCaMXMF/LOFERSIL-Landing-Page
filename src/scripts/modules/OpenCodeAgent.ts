/**
 * Stub OpenCodeAgent for build compatibility
 * TODO: Implement actual OpenCodeAgent integration
 */
export class OpenCodeAgent {
  constructor() {
    // Stub implementation
  }

  async analyzeCodebase(): Promise<any> {
    return {};
  }

  async generateSolution(): Promise<any> {
    return {};
  }

  async query(prompt: string, options?: any): Promise<any> {
    return { response: "stub response" };
  }
}
