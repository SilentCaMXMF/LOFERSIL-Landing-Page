/**
 * WorkflowExecutor Tests
 *
 * Unit tests for workflow execution engine including lifecycle management,
 * step execution, and error handling.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WorkflowExecutor } from './WorkflowExecutor';
import { OpenAIImageSpecialist, ImageOperation } from './OpenAIImageSpecialist';
import { ErrorHandler } from './ErrorHandler';
import {
  WorkflowDefinition,
  WorkflowStep,
  StepType,
  WorkflowStatus,
  StepStatus,
  WorkflowMetadata,
} from './WorkflowTypes';

describe('WorkflowExecutor', () => {
  let executor: WorkflowExecutor;
  let mockImageSpecialist: OpenAIImageSpecialist;
  let mockErrorHandler: ErrorHandler;
  let processRequestMock: any;
  let validMetadata: WorkflowMetadata;

  beforeEach(() => {
    // Mock the OpenAI Image Specialist
    processRequestMock = vi.fn();
    mockImageSpecialist = {
      processRequest: processRequestMock,
    } as any as OpenAIImageSpecialist;

    mockErrorHandler = {
      handleError: vi.fn(),
    } as any;

    // Set up default mock implementation
    processRequestMock.mockResolvedValue({ success: true });

    executor = new WorkflowExecutor(mockImageSpecialist, mockErrorHandler);
    validMetadata = {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Workflow Lifecycle Management', () => {
    it('should start and complete a simple workflow', async () => {
      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'step1',
            type: StepType.GENERATE_IMAGE,
            name: 'Generate Image',
            config: { prompt: 'test prompt' },
            dependencies: [],
          },
        ],
        metadata: validMetadata,
        config: {},
      };

      const mockResult = { success: true, images: [{ url: 'test.jpg' }] };
      processRequestMock.mockResolvedValue(mockResult);

      const result = await executor.startWorkflow(workflow);

      expect(result.workflowId).toBe('test-workflow');
      expect(result.status).toBe(WorkflowStatus.COMPLETED);
      expect(result.stepResults).toHaveLength(1);
      expect(result.stepResults[0].status).toBe(StepStatus.COMPLETED);
      expect(mockImageSpecialist.processRequest as any).toHaveBeenCalledWith({
        operation: ImageOperation.GENERATE,
        prompt: 'test prompt',
        parameters: undefined,
      });
    });

    it('should handle workflow with multiple dependent steps', async () => {
      const workflow: WorkflowDefinition = {
        id: 'multi-step-workflow',
        name: 'Multi Step Workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'generate',
            type: StepType.GENERATE_IMAGE,
            name: 'Generate Image',
            config: { prompt: 'generate prompt' },
            dependencies: [],
          },
          {
            id: 'edit',
            type: StepType.EDIT_IMAGE,
            name: 'Edit Image',
            config: { prompt: 'edit prompt', image: 'input.jpg' },
            dependencies: ['generate'],
          },
        ],
        metadata: validMetadata,
        config: {},
      };

      const generateResult = { success: true, images: [{ url: 'generated.jpg' }] };
      const editResult = { success: true, images: [{ url: 'edited.jpg' }] };

      (mockImageSpecialist.processRequest as any)
        .mockResolvedValueOnce(generateResult)
        .mockResolvedValueOnce(editResult);

      const result = await executor.startWorkflow(workflow);

      expect(result.status).toBe(WorkflowStatus.COMPLETED);
      expect(result.stepResults).toHaveLength(2);
      expect(result.stepResults[0].stepId).toBe('generate');
      expect(result.stepResults[1].stepId).toBe('edit');
      expect(mockImageSpecialist.processRequest).toHaveBeenCalledTimes(2);
    });

    it('should pause and resume workflow', async () => {
      const workflow: WorkflowDefinition = {
        id: 'pause-resume-workflow',
        name: 'Pause Resume Workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'step1',
            type: StepType.GENERATE_IMAGE,
            name: 'Generate Image',
            config: { prompt: 'test prompt' },
            dependencies: [],
          },
        ],
        metadata: validMetadata,
        config: {},
      };

      // Mock a slow operation
      processRequestMock.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      // Start workflow
      const workflowPromise = executor.startWorkflow(workflow);

      // Wait a bit then pause
      await new Promise(resolve => setTimeout(resolve, 10));
      const paused = executor.pauseWorkflow('pause-resume-workflow');
      expect(paused).toBe(true);

      // Check state
      let state = executor.getWorkflowState('pause-resume-workflow');
      expect(state?.status).toBe(WorkflowStatus.PAUSED);

      // Resume
      const resumed = executor.resumeWorkflow('pause-resume-workflow');
      expect(resumed).toBe(true);

      // Wait for completion
      const result = await workflowPromise;
      expect(result.status).toBe(WorkflowStatus.COMPLETED);
    });

    it('should stop a running workflow', async () => {
      const workflow: WorkflowDefinition = {
        id: 'stop-workflow',
        name: 'Stop Workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'step1',
            type: StepType.GENERATE_IMAGE,
            name: 'Generate Image',
            config: { prompt: 'test prompt' },
            dependencies: [],
          },
        ],
        metadata: validMetadata,
        config: {},
      };

      // Mock a slow operation
      processRequestMock.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      // Start workflow
      const workflowPromise = executor.startWorkflow(workflow);

      // Wait a bit then stop
      await new Promise(resolve => setTimeout(resolve, 10));
      const stopped = executor.stopWorkflow('stop-workflow');
      expect(stopped).toBe(true);

      // Wait for completion
      const result = await workflowPromise;
      expect(result.status).toBe(WorkflowStatus.CANCELLED);
    });
  });

  describe('Step Execution', () => {
    it('should execute generate image step', async () => {
      const step: WorkflowStep = {
        id: 'generate-step',
        type: StepType.GENERATE_IMAGE,
        name: 'Generate',
        config: { prompt: 'test prompt', parameters: { size: '512x512' } },
        dependencies: [],
      };

      const mockResult = { success: true, images: [{ url: 'generated.jpg' }] };
      processRequestMock.mockResolvedValue(mockResult);

      const workflow: WorkflowDefinition = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        steps: [step],
        metadata: validMetadata,
        config: {},
      };

      const result = await executor.startWorkflow(workflow);

      expect(mockImageSpecialist.processRequest).toHaveBeenCalledWith({
        operation: ImageOperation.GENERATE,
        prompt: 'test prompt',
        parameters: { size: '512x512' },
      });
      expect(result.stepResults[0].result).toBe(mockResult);
    });

    it('should execute edit image step', async () => {
      const step: WorkflowStep = {
        id: 'edit-step',
        type: StepType.EDIT_IMAGE,
        name: 'Edit',
        config: { prompt: 'edit prompt', image: 'input.jpg', mask: 'mask.jpg' },
        dependencies: [],
      };

      const mockResult = { success: true, images: [{ url: 'edited.jpg' }] };
      processRequestMock.mockResolvedValue(mockResult);

      const workflow: WorkflowDefinition = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        steps: [step],
        metadata: validMetadata,
        config: {},
      };

      const result = await executor.startWorkflow(workflow);

      expect(mockImageSpecialist.processRequest).toHaveBeenCalledWith({
        operation: ImageOperation.EDIT,
        prompt: 'edit prompt',
        image: 'input.jpg',
        mask: 'mask.jpg',
        parameters: undefined,
      });
      expect(result.stepResults[0].result).toBe(mockResult);
    });

    it('should execute analyze image step', async () => {
      const step: WorkflowStep = {
        id: 'analyze-step',
        type: StepType.ANALYZE_IMAGE,
        name: 'Analyze',
        config: { prompt: 'analyze prompt', image: 'input.jpg' },
        dependencies: [],
      };

      const mockResult = { success: true, analysis: { description: 'test analysis' } };
      processRequestMock.mockResolvedValue(mockResult);

      const workflow: WorkflowDefinition = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        steps: [step],
        metadata: validMetadata,
        config: {},
      };

      const result = await executor.startWorkflow(workflow);

      expect(mockImageSpecialist.processRequest).toHaveBeenCalledWith({
        operation: ImageOperation.ANALYZE,
        prompt: 'analyze prompt',
        image: 'input.jpg',
      });
      expect(result.stepResults[0].result).toBe(mockResult);
    });

    it('should handle step execution errors', async () => {
      const workflow: WorkflowDefinition = {
        id: 'error-workflow',
        name: 'Error Workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'failing-step',
            type: StepType.GENERATE_IMAGE,
            name: 'Failing Step',
            config: { prompt: 'test' },
            dependencies: [],
            retryCount: 2,
          },
        ],
        metadata: validMetadata,
        config: {},
      };

      // Fail twice, succeed on third try
      mockImageSpecialist.processRequest
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce({ success: true });

      const result = await executor.startWorkflow(workflow);

      expect(result.status).toBe(WorkflowStatus.COMPLETED);
      expect(mockImageSpecialist.processRequest).toHaveBeenCalledTimes(3);
      expect(result.stepResults[0].retryCount).toBe(2);
    });
  });

  describe('Progress Tracking', () => {
    it('should track progress correctly', async () => {
      const workflow: WorkflowDefinition = {
        id: 'progress-workflow',
        name: 'Progress Workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'step1',
            type: StepType.GENERATE_IMAGE,
            name: 'Step 1',
            config: { prompt: 'test1' },
            dependencies: [],
          },
          {
            id: 'step2',
            type: StepType.GENERATE_IMAGE,
            name: 'Step 2',
            config: { prompt: 'test2' },
            dependencies: ['step1'],
          },
        ],
        metadata: validMetadata,
        config: {},
      };

      processRequestMock.mockResolvedValue({ success: true });

      const progressUpdates: any[] = [];
      const options = {
        onProgress: (progress: any) => progressUpdates.push({ ...progress }),
      };

      await executor.startWorkflow(workflow, options);

      expect(progressUpdates).toHaveLength(2);
      expect(progressUpdates[0].percentage).toBe(50); // After step 1
      expect(progressUpdates[1].percentage).toBe(100); // After step 2
    });

    it('should provide workflow state information', async () => {
      const workflow: WorkflowDefinition = {
        id: 'state-workflow',
        name: 'State Workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'step1',
            type: StepType.GENERATE_IMAGE,
            name: 'Step 1',
            config: { prompt: 'test' },
            dependencies: [],
          },
        ],
        metadata: validMetadata,
        config: {},
      };

      processRequestMock.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 50))
      );

      // Start workflow
      const workflowPromise = executor.startWorkflow(workflow);

      // Check state while running
      await new Promise(resolve => setTimeout(resolve, 10));
      const state = executor.getWorkflowState('state-workflow');
      expect(state).toBeTruthy();
      expect(state!.status).toBe(WorkflowStatus.RUNNING);
      expect(state!.currentStep).toBe('step1');

      // Wait for completion
      await workflowPromise;

      // Check final state
      const finalState = executor.getWorkflowState('state-workflow');
      expect(finalState).toBeNull(); // Cleaned up after completion
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid workflow validation', async () => {
      const invalidWorkflow = {
        id: 'invalid',
        name: 'Invalid',
        version: '1.0.0',
        steps: [], // Empty steps
        metadata: validMetadata,
        config: {},
      } as WorkflowDefinition;

      const result = await executor.startWorkflow(invalidWorkflow);

      expect(result.status).toBe(WorkflowStatus.FAILED);
      expect(result.error).toContain('Workflow validation failed');
    });

    it('should handle duplicate workflow execution', async () => {
      const workflow: WorkflowDefinition = {
        id: 'duplicate-workflow',
        name: 'Duplicate Workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'step1',
            type: StepType.GENERATE_IMAGE,
            name: 'Step 1',
            config: { prompt: 'test' },
            dependencies: [],
          },
        ],
        metadata: validMetadata,
        config: {},
      };

      processRequestMock.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      // Start first workflow
      const promise1 = executor.startWorkflow(workflow);

      // Try to start second workflow with same ID
      await expect(executor.startWorkflow(workflow)).rejects.toThrow('already running');

      // Wait for first to complete
      await promise1;
    });

    it('should handle unsupported step types', async () => {
      const workflow: WorkflowDefinition = {
        id: 'unsupported-workflow',
        name: 'Unsupported Workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'custom-step',
            type: StepType.CUSTOM,
            name: 'Custom Step',
            config: {},
            dependencies: [],
          },
        ],
        metadata: validMetadata,
        config: {},
      };

      const result = await executor.startWorkflow(workflow);

      expect(result.status).toBe(WorkflowStatus.FAILED);
      expect(result.stepResults[0].status).toBe(StepStatus.FAILED);
      expect(result.stepResults[0].error).toContain('Custom step type not implemented');
    });
  });

  describe('Enhanced Step Execution Management', () => {
    it('should execute independent steps in parallel', async () => {
      const workflow: WorkflowDefinition = {
        id: 'parallel-workflow',
        name: 'Parallel Workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'step1',
            type: StepType.GENERATE_IMAGE,
            name: 'Step 1',
            config: { prompt: 'test1' },
            dependencies: [],
          },
          {
            id: 'step2',
            type: StepType.GENERATE_IMAGE,
            name: 'Step 2',
            config: { prompt: 'test2' },
            dependencies: [],
          },
          {
            id: 'step3',
            type: StepType.GENERATE_IMAGE,
            name: 'Step 3',
            config: { prompt: 'test3' },
            dependencies: ['step1'], // Depends on step1
          },
        ],
        metadata: validMetadata,
        config: { allowParallel: true, maxConcurrency: 2 },
      };

      const result1 = { success: true, images: [{ url: 'img1.jpg' }] };
      const result2 = { success: true, images: [{ url: 'img2.jpg' }] };
      const result3 = { success: true, images: [{ url: 'img3.jpg' }] };

      // Mock responses - step1 and step2 should execute in parallel, step3 after
      (mockImageSpecialist.processRequest as any)
        .mockResolvedValueOnce(result1) // step1
        .mockResolvedValueOnce(result2) // step2 (parallel)
        .mockResolvedValueOnce(result3); // step3 (after step1)

      const startTime = Date.now();
      const result = await executor.startWorkflow(workflow);
      const duration = Date.now() - startTime;

      expect(result.status).toBe(WorkflowStatus.COMPLETED);
      expect(result.stepResults).toHaveLength(3);
      // Parallel execution should be faster than sequential
      expect(duration).toBeLessThan(300); // Assuming each mock takes some time
    });

    it('should handle step timeouts', async () => {
      const workflow: WorkflowDefinition = {
        id: 'timeout-workflow',
        name: 'Timeout Workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'slow-step',
            type: StepType.GENERATE_IMAGE,
            name: 'Slow Step',
            config: { prompt: 'test' },
            dependencies: [],
            timeout: 100, // Very short timeout
          },
        ],
        metadata: validMetadata,
        config: {},
      };

      // Mock a slow operation that exceeds timeout
      (mockImageSpecialist.processRequest as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 200))
      );

      const result = await executor.startWorkflow(workflow);

      expect(result.status).toBe(WorkflowStatus.FAILED);
      expect(result.stepResults[0].status).toBe(StepStatus.FAILED);
      expect(result.stepResults[0].error).toContain('timed out');
    });

    it('should retry failed steps', async () => {
      const workflow: WorkflowDefinition = {
        id: 'retry-workflow',
        name: 'Retry Workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'retry-step',
            type: StepType.GENERATE_IMAGE,
            name: 'Retry Step',
            config: { prompt: 'test' },
            dependencies: [],
            retryCount: 2,
            retryDelay: 10,
          },
        ],
        metadata: validMetadata,
        config: {},
      };

      // Fail twice, succeed on third try
      (mockImageSpecialist.processRequest as any)
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce({ success: true });

      const result = await executor.startWorkflow(workflow);

      expect(result.status).toBe(WorkflowStatus.COMPLETED);
      expect(result.stepResults[0].retryCount).toBe(2);
      expect(mockImageSpecialist.processRequest as any).toHaveBeenCalledTimes(3);
    });

    it('should propagate results between dependent steps', async () => {
      const workflow: WorkflowDefinition = {
        id: 'propagation-workflow',
        name: 'Result Propagation Workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'generate',
            type: StepType.GENERATE_IMAGE,
            name: 'Generate',
            config: { prompt: 'generate image' },
            dependencies: [],
          },
          {
            id: 'edit',
            type: StepType.EDIT_IMAGE,
            name: 'Edit',
            config: {
              prompt: 'edit the image',
              image: '${step.generate.result.images[0].url}', // Dynamic reference
            },
            dependencies: ['generate'],
          },
        ],
        metadata: validMetadata,
        config: {},
      };

      const generateResult = {
        success: true,
        images: [{ url: 'generated.jpg' }],
      };
      const editResult = {
        success: true,
        images: [{ url: 'edited.jpg' }],
      };

      (mockImageSpecialist.processRequest as any)
        .mockResolvedValueOnce(generateResult)
        .mockResolvedValueOnce(editResult);

      const result = await executor.startWorkflow(workflow);

      expect(result.status).toBe(WorkflowStatus.COMPLETED);
      expect(mockImageSpecialist.processRequest as any).toHaveBeenCalledTimes(2);

      // Verify the edit step received the resolved image URL
      expect(mockImageSpecialist.processRequest as any).toHaveBeenNthCalledWith(2, {
        operation: ImageOperation.EDIT,
        prompt: 'edit the image',
        image: 'generated.jpg', // Should be resolved from template
        mask: undefined,
        parameters: undefined,
      });
    });

    it('should handle conditional step execution', async () => {
      const workflow: WorkflowDefinition = {
        id: 'conditional-workflow',
        name: 'Conditional Workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'check-condition',
            type: StepType.GENERATE_IMAGE,
            name: 'Check Condition',
            config: { prompt: 'check' },
            dependencies: [],
          },
          {
            id: 'conditional-step',
            type: StepType.GENERATE_IMAGE,
            name: 'Conditional Step',
            config: { prompt: 'conditional' },
            dependencies: ['check-condition'],
            conditions: [
              {
                type: 'if',
                expression: 'step("check-condition").status === "completed"',
                branches: {
                  true: ['conditional-step'],
                  false: [],
                },
              },
            ],
          },
        ],
        metadata: validMetadata,
        config: {},
      };

      const checkResult = { success: true };
      const conditionalResult = { success: true };

      (mockImageSpecialist.processRequest as any)
        .mockResolvedValueOnce(checkResult)
        .mockResolvedValueOnce(conditionalResult);

      const result = await executor.startWorkflow(workflow);

      expect(result.status).toBe(WorkflowStatus.COMPLETED);
      expect(result.stepResults).toHaveLength(2);
    });

    it('should handle if-else branching', async () => {
      const workflow: WorkflowDefinition = {
        id: 'if-else-workflow',
        name: 'If-Else Workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'evaluate',
            type: StepType.GENERATE_IMAGE,
            name: 'Evaluate',
            config: { prompt: 'evaluate' },
            dependencies: [],
          },
          {
            id: 'success-path',
            type: StepType.GENERATE_IMAGE,
            name: 'Success Path',
            config: { prompt: 'success' },
            dependencies: [],
            conditions: [
              {
                type: 'if',
                expression: 'step("evaluate").status === "completed"',
                branches: {
                  true: ['success-path'],
                  false: [],
                },
              },
            ],
          },
          {
            id: 'failure-path',
            type: StepType.GENERATE_IMAGE,
            name: 'Failure Path',
            config: { prompt: 'failure' },
            dependencies: [],
            conditions: [
              {
                type: 'if',
                expression: 'step("evaluate").status !== "completed"',
                branches: {
                  true: ['failure-path'],
                  false: [],
                },
              },
            ],
          },
        ],
        metadata: validMetadata,
        config: {},
      };

      const evaluateResult = { success: true };
      const successResult = { success: true };

      (mockImageSpecialist.processRequest as any)
        .mockResolvedValueOnce(evaluateResult)
        .mockResolvedValueOnce(successResult);

      const result = await executor.startWorkflow(workflow);

      expect(result.status).toBe(WorkflowStatus.COMPLETED);
      expect(result.stepResults).toHaveLength(3); // evaluate + success-path + failure-path (skipped)
      expect(result.stepResults.find(r => r.stepId === 'success-path')?.status).toBe(
        StepStatus.COMPLETED
      );
      expect(result.stepResults.find(r => r.stepId === 'failure-path')?.status).toBe(
        StepStatus.SKIPPED
      );
    });

    it('should handle switch branching', async () => {
      const workflow: WorkflowDefinition = {
        id: 'switch-workflow',
        name: 'Switch Workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'categorize',
            type: StepType.GENERATE_IMAGE,
            name: 'Categorize',
            config: { prompt: 'categorize' },
            dependencies: [],
          },
          {
            id: 'portrait-step',
            type: StepType.EDIT_IMAGE,
            name: 'Portrait Processing',
            config: { prompt: 'portrait edit', image: 'input.jpg' },
            dependencies: ['categorize'],
            conditions: [
              {
                type: 'switch',
                expression: 'shared("step.categorize.result.category")',
                branches: {
                  portrait: ['portrait-step'],
                  landscape: [],
                  other: [],
                },
                defaultBranch: [],
              },
            ],
          },
        ],
        metadata: validMetadata,
        config: {},
      };

      const categorizeResult = { success: true, category: 'portrait' };
      const portraitResult = { success: true };

      (mockImageSpecialist.processRequest as any)
        .mockResolvedValueOnce(categorizeResult)
        .mockResolvedValueOnce(portraitResult);

      const result = await executor.startWorkflow(workflow);

      expect(result.status).toBe(WorkflowStatus.COMPLETED);
      expect(result.stepResults).toHaveLength(2);
      expect(result.stepResults.find(r => r.stepId === 'portrait-step')).toBeDefined();
    });

    it('should evaluate complex expressions', async () => {
      const workflow: WorkflowDefinition = {
        id: 'expression-workflow',
        name: 'Expression Workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'step1',
            type: StepType.GENERATE_IMAGE,
            name: 'Step 1',
            config: { prompt: 'test' },
            dependencies: [],
          },
          {
            id: 'conditional-step',
            type: StepType.GENERATE_IMAGE,
            name: 'Conditional Step',
            config: { prompt: 'conditional' },
            dependencies: ['step1'],
            conditions: [
              {
                type: 'expression',
                expression: 'true === true',
                branches: {
                  true: ['conditional-step'],
                  false: [],
                },
              },
            ],
          },
        ],
        metadata: validMetadata,
        config: {},
      };

      // Set up shared data
      workflow.steps[1].conditions![0].branches = {
        true: ['conditional-step'],
        false: [],
      };

      const step1Result = { success: true };
      const conditionalResult = { success: true };

      (mockImageSpecialist.processRequest as any)
        .mockResolvedValueOnce(step1Result)
        .mockResolvedValueOnce(conditionalResult);

      const result = await executor.startWorkflow(workflow);

      expect(result.status).toBe(WorkflowStatus.COMPLETED);
      expect(result.stepResults).toHaveLength(2);
    });

    it('should handle nested conditions with logical operators', async () => {
      const workflow: WorkflowDefinition = {
        id: 'nested-conditions-workflow',
        name: 'Nested Conditions Workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'step1',
            type: StepType.GENERATE_IMAGE,
            name: 'Step 1',
            config: { prompt: 'test1' },
            dependencies: [],
          },
          {
            id: 'step2',
            type: StepType.GENERATE_IMAGE,
            name: 'Step 2',
            config: { prompt: 'test2' },
            dependencies: [],
          },
          {
            id: 'combined-step',
            type: StepType.GENERATE_IMAGE,
            name: 'Combined Step',
            config: { prompt: 'combined' },
            dependencies: ['step1', 'step2'],
            conditions: [
              {
                type: 'expression',
                expression: 'step("step1").status === "completed"',
                branches: { true: [], false: [] },
                operator: 'and',
              },
              {
                type: 'expression',
                expression: 'step("step2").status === "completed"',
                branches: { true: ['combined-step'], false: [] },
                operator: 'and',
              },
            ],
          },
        ],
        metadata: validMetadata,
        config: { allowParallel: true },
      };

      const result1 = { success: true };
      const result2 = { success: true };
      const combinedResult = { success: true };

      (mockImageSpecialist.processRequest as any)
        .mockResolvedValueOnce(result1)
        .mockResolvedValueOnce(result2)
        .mockResolvedValueOnce(combinedResult);

      const result = await executor.startWorkflow(workflow);

      expect(result.status).toBe(WorkflowStatus.COMPLETED);
      expect(result.stepResults).toHaveLength(3);
      expect(result.stepResults.find(r => r.stepId === 'combined-step')).toBeDefined();
    });
  });

  describe('Result Aggregation', () => {
    it('should aggregate results from multiple steps', async () => {
      const workflow: WorkflowDefinition = {
        id: 'aggregate-workflow',
        name: 'Aggregate Workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'step1',
            type: StepType.GENERATE_IMAGE,
            name: 'Step 1',
            config: { prompt: 'test1' },
            dependencies: [],
          },
          {
            id: 'step2',
            type: StepType.GENERATE_IMAGE,
            name: 'Step 2',
            config: { prompt: 'test2' },
            dependencies: [],
          },
        ],
        metadata: validMetadata,
        config: { allowParallel: true },
      };

      const result1 = { success: true, images: [{ url: 'img1.jpg' }] };
      const result2 = { success: true, images: [{ url: 'img2.jpg' }] };

      (mockImageSpecialist.processRequest as any)
        .mockResolvedValueOnce(result1)
        .mockResolvedValueOnce(result2);

      const result = await executor.startWorkflow(workflow);

      expect(result.aggregatedResult).toBeDefined();
      expect(result.aggregatedResult.totalSteps).toBe(2);
      expect(result.aggregatedResult.successfulSteps).toBe(2);
      expect(result.aggregatedResult.results).toHaveLength(2);
    });
  });
});
