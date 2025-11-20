/**
 * Mock Workflow Orchestrator for Testing
 */

export class WorkflowOrchestrator {
  async processIssue(issueNumber: number): Promise<any> {
    return {
      success: true,
      issueNumber,
      result: 'Test workflow completed',
    };
  }
}
