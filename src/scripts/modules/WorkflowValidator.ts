/**
 * Workflow Validator
 *
 * Validates workflow definitions for correctness, cyclic dependencies, and structural integrity.
 * Provides detailed error reporting for invalid workflows.
 */

import { WorkflowDefinition, WorkflowStep, StepType, WorkflowCondition } from './WorkflowTypes';

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly field?: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export class WorkflowValidator {
  private readonly maxWorkflowDepth = 100;
  private readonly maxStepNameLength = 100;
  private readonly maxWorkflowNameLength = 200;

  /**
   * Validates a complete workflow definition
   */
  validateWorkflow(workflow: WorkflowDefinition): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    try {
      // Basic structure validation
      this.validateBasicStructure(workflow, errors);

      // Step validation
      this.validateSteps(workflow.steps, errors, warnings);

      // Dependency validation
      this.validateDependencies(workflow.steps, errors);

      // Cyclic dependency check
      this.detectCyclicDependencies(workflow.steps, errors);

      // Condition validation
      this.validateConditions(workflow.steps, errors);

      // Configuration validation
      this.validateConfiguration(workflow, warnings);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(
        new ValidationError(
          `Unexpected validation error: ${errorMessage}`,
          'VALIDATION_UNEXPECTED_ERROR',
          undefined,
          error
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates basic workflow structure
   */
  private validateBasicStructure(workflow: WorkflowDefinition, errors: ValidationError[]): void {
    // Required fields
    if (!workflow.id || typeof workflow.id !== 'string') {
      errors.push(
        new ValidationError(
          'Workflow ID is required and must be a string',
          'MISSING_WORKFLOW_ID',
          'id'
        )
      );
    }

    if (!workflow.name || typeof workflow.name !== 'string') {
      errors.push(
        new ValidationError(
          'Workflow name is required and must be a string',
          'MISSING_WORKFLOW_NAME',
          'name'
        )
      );
    } else if (workflow.name.length > this.maxWorkflowNameLength) {
      errors.push(
        new ValidationError(
          `Workflow name exceeds maximum length of ${this.maxWorkflowNameLength} characters`,
          'WORKFLOW_NAME_TOO_LONG',
          'name'
        )
      );
    }

    if (!workflow.version || typeof workflow.version !== 'string') {
      errors.push(
        new ValidationError(
          'Workflow version is required and must be a string',
          'MISSING_WORKFLOW_VERSION',
          'version'
        )
      );
    }

    if (!Array.isArray(workflow.steps)) {
      errors.push(
        new ValidationError('Workflow steps must be an array', 'INVALID_STEPS_ARRAY', 'steps')
      );
    } else if (workflow.steps.length === 0) {
      errors.push(
        new ValidationError('Workflow must contain at least one step', 'EMPTY_WORKFLOW', 'steps')
      );
    }

    if (!workflow.metadata) {
      errors.push(
        new ValidationError('Workflow metadata is required', 'MISSING_METADATA', 'metadata')
      );
    }
  }

  /**
   * Validates individual steps
   */
  private validateSteps(
    steps: WorkflowStep[],
    errors: ValidationError[],
    warnings: string[]
  ): void {
    const stepIds = new Set<string>();

    steps.forEach((step, index) => {
      // Required fields
      if (!step.id || typeof step.id !== 'string') {
        errors.push(
          new ValidationError(
            `Step ${index} ID is required and must be a string`,
            'MISSING_STEP_ID',
            `steps[${index}].id`
          )
        );
      } else {
        // Check for duplicate IDs
        if (stepIds.has(step.id)) {
          errors.push(
            new ValidationError(
              `Duplicate step ID: ${step.id}`,
              'DUPLICATE_STEP_ID',
              `steps[${index}].id`
            )
          );
        }
        stepIds.add(step.id);

        // Validate ID format (alphanumeric, underscore, dash)
        if (!/^[a-zA-Z0-9_-]+$/.test(step.id)) {
          errors.push(
            new ValidationError(
              `Step ID '${step.id}' contains invalid characters. Only alphanumeric, underscore, and dash are allowed`,
              'INVALID_STEP_ID_FORMAT',
              `steps[${index}].id`
            )
          );
        }
      }

      if (!step.name || typeof step.name !== 'string') {
        errors.push(
          new ValidationError(
            `Step ${step.id || index} name is required and must be a string`,
            'MISSING_STEP_NAME',
            `steps[${index}].name`
          )
        );
      } else if (step.name.length > this.maxStepNameLength) {
        errors.push(
          new ValidationError(
            `Step name '${step.name}' exceeds maximum length of ${this.maxStepNameLength} characters`,
            'STEP_NAME_TOO_LONG',
            `steps[${index}].name`
          )
        );
      }

      if (!step.type || !Object.values(StepType).includes(step.type)) {
        errors.push(
          new ValidationError(
            `Step ${step.id || index} has invalid type: ${step.type}`,
            'INVALID_STEP_TYPE',
            `steps[${index}].type`
          )
        );
      }

      // Dependencies validation
      if (!Array.isArray(step.dependencies)) {
        errors.push(
          new ValidationError(
            `Step ${step.id || index} dependencies must be an array`,
            'INVALID_DEPENDENCIES',
            `steps[${index}].dependencies`
          )
        );
      }

      // Config validation based on step type
      this.validateStepConfig(step, index, errors, warnings);

      // Timeout validation
      if (step.timeout !== undefined) {
        if (typeof step.timeout !== 'number' || step.timeout <= 0) {
          errors.push(
            new ValidationError(
              `Step ${step.id || index} timeout must be a positive number`,
              'INVALID_TIMEOUT',
              `steps[${index}].timeout`
            )
          );
        }
      }

      // Retry validation
      if (step.retryCount !== undefined) {
        if (typeof step.retryCount !== 'number' || step.retryCount < 0) {
          errors.push(
            new ValidationError(
              `Step ${step.id || index} retryCount must be a non-negative number`,
              'INVALID_RETRY_COUNT',
              `steps[${index}].retryCount`
            )
          );
        }
      }

      if (step.retryDelay !== undefined) {
        if (typeof step.retryDelay !== 'number' || step.retryDelay < 0) {
          errors.push(
            new ValidationError(
              `Step ${step.id || index} retryDelay must be a non-negative number`,
              'INVALID_RETRY_DELAY',
              `steps[${index}].retryDelay`
            )
          );
        }
      }
    });
  }

  /**
   * Validates step configuration based on type
   */
  private validateStepConfig(
    step: WorkflowStep,
    index: number,
    errors: ValidationError[],
    warnings: string[]
  ): void {
    const stepPath = `steps[${index}]`;

    switch (step.type) {
      case StepType.GENERATE_IMAGE:
      case StepType.EDIT_IMAGE:
      case StepType.ANALYZE_IMAGE:
        if (!step.config.prompt || typeof step.config.prompt !== 'string') {
          errors.push(
            new ValidationError(
              `Step ${step.id} requires a prompt configuration`,
              'MISSING_PROMPT_CONFIG',
              `${stepPath}.config.prompt`
            )
          );
        }
        break;

      case StepType.CONDITIONAL:
        if (!step.conditions || !Array.isArray(step.conditions) || step.conditions.length === 0) {
          errors.push(
            new ValidationError(
              `Conditional step ${step.id} requires at least one condition`,
              'MISSING_CONDITIONS',
              `${stepPath}.conditions`
            )
          );
        }
        break;

      case StepType.PARALLEL:
        if (!step.config.parallelSteps || !Array.isArray(step.config.parallelSteps)) {
          errors.push(
            new ValidationError(
              `Parallel step ${step.id} requires parallelSteps configuration`,
              'MISSING_PARALLEL_STEPS',
              `${stepPath}.config.parallelSteps`
            )
          );
        }
        break;
    }
  }

  /**
   * Validates step dependencies
   */
  private validateDependencies(steps: WorkflowStep[], errors: ValidationError[]): void {
    const stepIds = new Set(steps.map(s => s.id).filter(id => id));

    steps.forEach((step, index) => {
      if (!step.dependencies) return;

      step.dependencies.forEach(depId => {
        if (!stepIds.has(depId)) {
          errors.push(
            new ValidationError(
              `Step ${step.id} depends on non-existent step: ${depId}`,
              'INVALID_DEPENDENCY',
              `steps[${index}].dependencies`
            )
          );
        }

        // Check for self-dependency
        if (depId === step.id) {
          errors.push(
            new ValidationError(
              `Step ${step.id} cannot depend on itself`,
              'SELF_DEPENDENCY',
              `steps[${index}].dependencies`
            )
          );
        }
      });
    });
  }

  /**
   * Detects cyclic dependencies using topological sort
   */
  private detectCyclicDependencies(steps: WorkflowStep[], errors: ValidationError[]): void {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Build graph
    steps.forEach(step => {
      if (!step.id) return;
      graph.set(step.id, step.dependencies || []);
      inDegree.set(step.id, 0);
    });

    // Calculate in-degrees
    graph.forEach(deps => {
      deps.forEach(dep => {
        inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
      });
    });

    // Kahn's algorithm for topological sort
    const queue: string[] = [];
    inDegree.forEach((degree, node) => {
      if (degree === 0) queue.push(node);
    });

    let processed = 0;
    const totalNodes = graph.size;

    while (queue.length > 0) {
      const node = queue.shift()!;
      processed++;

      (graph.get(node) || []).forEach(neighbor => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      });
    }

    if (processed < totalNodes) {
      errors.push(
        new ValidationError('Workflow contains cyclic dependencies', 'CYCLIC_DEPENDENCY', 'steps')
      );
    }
  }

  /**
   * Validates workflow conditions
   */
  private validateConditions(steps: WorkflowStep[], errors: ValidationError[]): void {
    steps.forEach((step, index) => {
      if (!step.conditions) return;

      step.conditions.forEach((condition, condIndex) => {
        const condPath = `steps[${index}].conditions[${condIndex}]`;

        if (!condition.type || !['if', 'switch', 'expression'].includes(condition.type)) {
          errors.push(
            new ValidationError(
              `Invalid condition type: ${condition.type}`,
              'INVALID_CONDITION_TYPE',
              `${condPath}.type`
            )
          );
        }

        if (!condition.expression || typeof condition.expression !== 'string') {
          errors.push(
            new ValidationError(
              'Condition expression is required and must be a string',
              'MISSING_CONDITION_EXPRESSION',
              `${condPath}.expression`
            )
          );
        }

        if (!condition.branches || typeof condition.branches !== 'object') {
          errors.push(
            new ValidationError(
              'Condition branches are required',
              'MISSING_CONDITION_BRANCHES',
              `${condPath}.branches`
            )
          );
        }

        // Validate branch targets exist
        Object.values(condition.branches).forEach((branchSteps: string[]) => {
          if (!Array.isArray(branchSteps)) {
            errors.push(
              new ValidationError(
                'Branch targets must be an array of step IDs',
                'INVALID_BRANCH_TARGETS',
                `${condPath}.branches`
              )
            );
            return;
          }

          branchSteps.forEach(stepId => {
            if (!steps.find(s => s.id === stepId)) {
              errors.push(
                new ValidationError(
                  `Branch references non-existent step: ${stepId}`,
                  'INVALID_BRANCH_STEP',
                  `${condPath}.branches`
                )
              );
            }
          });
        });
      });
    });
  }

  /**
   * Validates workflow configuration
   */
  private validateConfiguration(workflow: WorkflowDefinition, warnings: string[]): void {
    const config = workflow.config;

    if (config.maxConcurrency !== undefined) {
      if (typeof config.maxConcurrency !== 'number' || config.maxConcurrency <= 0) {
        warnings.push('maxConcurrency should be a positive number');
      }
    }

    if (config.timeout !== undefined) {
      if (typeof config.timeout !== 'number' || config.timeout <= 0) {
        warnings.push('timeout should be a positive number');
      }
    }
  }

  /**
   * Validates a single step independently
   */
  validateStep(step: WorkflowStep, availableStepIds: string[] = []): ValidationResult {
    const mockWorkflow: Partial<WorkflowDefinition> = {
      steps: [step],
    };

    const result = this.validateWorkflow(mockWorkflow as WorkflowDefinition);

    // Filter out workflow-level errors that don't apply to single step validation
    result.errors = result.errors.filter(
      error =>
        error.code.startsWith('MISSING_STEP') ||
        error.code.startsWith('INVALID_STEP') ||
        error.code.startsWith('STEP_') ||
        error.code === 'INVALID_DEPENDENCIES'
    );

    return result;
  }
}
