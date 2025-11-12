/**
 * WorkflowValidator Tests
 *
 * Unit tests for workflow validation logic including structure validation,
 * dependency checking, and cyclic dependency detection.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowValidator, ValidationError } from './WorkflowValidator';
import { WorkflowDefinition, WorkflowStep, StepType, WorkflowMetadata } from './WorkflowTypes';

describe('WorkflowValidator', () => {
  let validator: WorkflowValidator;
  let validMetadata: WorkflowMetadata;

  beforeEach(() => {
    validator = new WorkflowValidator();
    validMetadata = {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
    };
  });

  describe('Basic Structure Validation', () => {
    it('should validate a complete valid workflow', () => {
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

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject workflow without ID', () => {
      const workflow = {
        name: 'Test Workflow',
        version: '1.0.0',
        steps: [],
        metadata: validMetadata,
        config: {},
      } as any;

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_WORKFLOW_ID',
        })
      );
    });

    it('should reject workflow without name', () => {
      const workflow = {
        id: 'test-workflow',
        version: '1.0.0',
        steps: [],
        metadata: validMetadata,
        config: {},
      } as any;

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_WORKFLOW_NAME',
        })
      );
    });

    it('should reject workflow with empty steps array', () => {
      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        steps: [],
        metadata: validMetadata,
        config: {},
      };

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'EMPTY_WORKFLOW',
        })
      );
    });
  });

  describe('Step Validation', () => {
    it('should validate valid steps', () => {
      const steps: WorkflowStep[] = [
        {
          id: 'generate-step',
          type: StepType.GENERATE_IMAGE,
          name: 'Generate Image',
          config: { prompt: 'test prompt' },
          dependencies: [],
        },
        {
          id: 'edit-step',
          type: StepType.EDIT_IMAGE,
          name: 'Edit Image',
          config: { prompt: 'edit prompt', image: 'input.jpg' },
          dependencies: ['generate-step'],
        },
      ];

      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        steps,
        metadata: validMetadata,
        config: {},
      };

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(true);
    });

    it('should reject step without ID', () => {
      const steps = [
        {
          type: StepType.GENERATE_IMAGE,
          name: 'Generate Image',
          config: { prompt: 'test' },
          dependencies: [],
        },
      ] as any;

      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        steps,
        metadata: validMetadata,
        config: {},
      };

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_STEP_ID',
        })
      );
    });

    it('should reject duplicate step IDs', () => {
      const steps: WorkflowStep[] = [
        {
          id: 'duplicate',
          type: StepType.GENERATE_IMAGE,
          name: 'Step 1',
          config: { prompt: 'test' },
          dependencies: [],
        },
        {
          id: 'duplicate',
          type: StepType.EDIT_IMAGE,
          name: 'Step 2',
          config: { prompt: 'test', image: 'input.jpg' },
          dependencies: [],
        },
      ];

      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        steps,
        metadata: validMetadata,
        config: {},
      };

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'DUPLICATE_STEP_ID',
        })
      );
    });

    it('should reject invalid step ID format', () => {
      const steps: WorkflowStep[] = [
        {
          id: 'invalid id with spaces',
          type: StepType.GENERATE_IMAGE,
          name: 'Test Step',
          config: { prompt: 'test' },
          dependencies: [],
        },
      ];

      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        steps,
        metadata: validMetadata,
        config: {},
      };

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_STEP_ID_FORMAT',
        })
      );
    });

    it('should reject invalid step type', () => {
      const steps = [
        {
          id: 'test-step',
          type: 'invalid_type',
          name: 'Test Step',
          config: {},
          dependencies: [],
        },
      ] as any;

      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        steps,
        metadata: validMetadata,
        config: {},
      };

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_STEP_TYPE',
        })
      );
    });
  });

  describe('Dependency Validation', () => {
    it('should validate valid dependencies', () => {
      const steps: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.GENERATE_IMAGE,
          name: 'Step 1',
          config: { prompt: 'test' },
          dependencies: [],
        },
        {
          id: 'step2',
          type: StepType.EDIT_IMAGE,
          name: 'Step 2',
          config: { prompt: 'edit', image: 'input.jpg' },
          dependencies: ['step1'],
        },
      ];

      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        steps,
        metadata: validMetadata,
        config: {},
      };

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(true);
    });

    it('should reject dependency on non-existent step', () => {
      const steps: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.GENERATE_IMAGE,
          name: 'Step 1',
          config: { prompt: 'test' },
          dependencies: ['non-existent'],
        },
      ];

      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        steps,
        metadata: validMetadata,
        config: {},
      };

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_DEPENDENCY',
        })
      );
    });

    it('should reject self-dependency', () => {
      const steps: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.GENERATE_IMAGE,
          name: 'Step 1',
          config: { prompt: 'test' },
          dependencies: ['step1'],
        },
      ];

      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        steps,
        metadata: validMetadata,
        config: {},
      };

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'SELF_DEPENDENCY',
        })
      );
    });
  });

  describe('Cyclic Dependency Detection', () => {
    it('should detect simple cycles', () => {
      const steps: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.GENERATE_IMAGE,
          name: 'Step 1',
          config: { prompt: 'test' },
          dependencies: ['step2'],
        },
        {
          id: 'step2',
          type: StepType.EDIT_IMAGE,
          name: 'Step 2',
          config: { prompt: 'edit', image: 'input.jpg' },
          dependencies: ['step1'],
        },
      ];

      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        steps,
        metadata: validMetadata,
        config: {},
      };

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'CYCLIC_DEPENDENCY',
        })
      );
    });

    it('should detect complex cycles', () => {
      const steps: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.GENERATE_IMAGE,
          name: 'Step 1',
          config: { prompt: 'test' },
          dependencies: ['step3'],
        },
        {
          id: 'step2',
          type: StepType.EDIT_IMAGE,
          name: 'Step 2',
          config: { prompt: 'edit', image: 'input.jpg' },
          dependencies: ['step1'],
        },
        {
          id: 'step3',
          type: StepType.ANALYZE_IMAGE,
          name: 'Step 3',
          config: { prompt: 'analyze', image: 'input.jpg' },
          dependencies: ['step2'],
        },
      ];

      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        steps,
        metadata: validMetadata,
        config: {},
      };

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'CYCLIC_DEPENDENCY',
        })
      );
    });

    it('should allow acyclic dependencies', () => {
      const steps: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.GENERATE_IMAGE,
          name: 'Step 1',
          config: { prompt: 'test' },
          dependencies: [],
        },
        {
          id: 'step2',
          type: StepType.EDIT_IMAGE,
          name: 'Step 2',
          config: { prompt: 'edit', image: 'input.jpg' },
          dependencies: ['step1'],
        },
        {
          id: 'step3',
          type: StepType.ANALYZE_IMAGE,
          name: 'Step 3',
          config: { prompt: 'analyze', image: 'input.jpg' },
          dependencies: ['step2'],
        },
      ];

      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        steps,
        metadata: validMetadata,
        config: {},
      };

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Step Configuration Validation', () => {
    it('should validate image generation step config', () => {
      const steps: WorkflowStep[] = [
        {
          id: 'generate',
          type: StepType.GENERATE_IMAGE,
          name: 'Generate',
          config: { prompt: 'test prompt' },
          dependencies: [],
        },
      ];

      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        steps,
        metadata: validMetadata,
        config: {},
      };

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(true);
    });

    it('should reject image generation step without prompt', () => {
      const steps: WorkflowStep[] = [
        {
          id: 'generate',
          type: StepType.GENERATE_IMAGE,
          name: 'Generate',
          config: {},
          dependencies: [],
        },
      ];

      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        steps,
        metadata: validMetadata,
        config: {},
      };

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_PROMPT_CONFIG',
        })
      );
    });
  });

  describe('Timeout and Retry Validation', () => {
    it('should validate valid timeout and retry settings', () => {
      const steps: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.GENERATE_IMAGE,
          name: 'Step 1',
          config: { prompt: 'test' },
          dependencies: [],
          timeout: 30000,
          retryCount: 3,
          retryDelay: 1000,
        },
      ];

      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        steps,
        metadata: validMetadata,
        config: {},
      };

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(true);
    });

    it('should reject invalid timeout', () => {
      const steps: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.GENERATE_IMAGE,
          name: 'Step 1',
          config: { prompt: 'test' },
          dependencies: [],
          timeout: -1000,
        },
      ];

      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        steps,
        metadata: validMetadata,
        config: {},
      };

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_TIMEOUT',
        })
      );
    });

    it('should reject invalid retry count', () => {
      const steps: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.GENERATE_IMAGE,
          name: 'Step 1',
          config: { prompt: 'test' },
          dependencies: [],
          retryCount: -1,
        },
      ];

      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        steps,
        metadata: validMetadata,
        config: {},
      };

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_RETRY_COUNT',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', () => {
      // Create a workflow that might cause unexpected errors
      const workflow = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        steps: null, // This should cause an error
        metadata: validMetadata,
        config: {},
      } as any;

      const result = validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
