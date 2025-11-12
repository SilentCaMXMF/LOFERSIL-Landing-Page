/**
 * Workflow Executor Engine
 *
 * Core execution engine for managing workflow lifecycle, step execution,
 * and integration with the OpenAI Image Specialist agent.
 */

import {
  WorkflowDefinition,
  WorkflowExecutionState,
  WorkflowResult,
  WorkflowStatus,
  StepExecutionResult,
  StepStatus,
  WorkflowExecutionOptions,
  StepType,
  WorkflowStep,
  WorkflowCondition,
  BranchResult,
} from './WorkflowTypes';
import { WorkflowValidator } from './WorkflowValidator';
import { OpenAIImageSpecialist, ImageOperation } from './OpenAIImageSpecialist';
import { ErrorHandler } from './ErrorHandler';

export interface StepExecutionContext {
  workflowId: string;
  stepResults: Map<string, StepExecutionResult>;
  sharedData: Map<string, any>;
  abortController: AbortController;
}

export class WorkflowExecutor {
  private activeWorkflows = new Map<string, WorkflowExecutionState>();
  private validator: WorkflowValidator;
  private errorHandler: ErrorHandler;

  constructor(
    private imageSpecialist: OpenAIImageSpecialist,
    errorHandler?: ErrorHandler
  ) {
    this.validator = new WorkflowValidator();
    this.errorHandler = errorHandler || new ErrorHandler();
  }

  /**
   * Starts workflow execution
   */
  async startWorkflow(
    workflow: WorkflowDefinition,
    options: WorkflowExecutionOptions = {}
  ): Promise<WorkflowResult> {
    const workflowId = workflow.id;

    // Check if workflow is already running (throw immediately)
    if (this.activeWorkflows.has(workflowId)) {
      throw new Error(`Workflow ${workflowId} is already running`);
    }

    try {
      // Validate workflow
      const validation = this.validator.validateWorkflow(workflow);
      if (!validation.isValid) {
        throw new Error(
          `Workflow validation failed: ${validation.errors.map(e => e.message).join(', ')}`
        );
      }

      // Check if workflow is already running
      if (this.activeWorkflows.has(workflowId)) {
        throw new Error(`Workflow ${workflowId} is already running`);
      }

      // Initialize execution state
      const executionState: WorkflowExecutionState = {
        workflowId,
        status: WorkflowStatus.RUNNING,
        startedAt: new Date(),
        stepResults: new Map(),
        progress: {
          totalSteps: workflow.steps.length,
          completedSteps: 0,
          failedSteps: 0,
          skippedSteps: 0,
          percentage: 0,
        },
        metadata: {
          ...options,
          validationWarnings: validation.warnings,
        },
      };

      this.activeWorkflows.set(workflowId, executionState);

      // Execute workflow
      const result = await this.executeWorkflow(workflow, executionState, options, workflowId);

      // Clean up
      this.activeWorkflows.delete(workflowId);

      return result;
    } catch (error) {
      // Clean up on error
      this.activeWorkflows.delete(workflowId);

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.errorHandler.handleError(error, 'WorkflowExecutor.startWorkflow', {
        component: 'WorkflowExecutor',
        action: 'startWorkflow',
        timestamp: new Date().toISOString(),
      });

      return {
        workflowId,
        status: WorkflowStatus.FAILED,
        startedAt: new Date(),
        completedAt: new Date(),
        duration: 0,
        stepResults: [],
        error: errorMessage,
        metadata: {},
      };
    }
  }

  /**
   * Pauses a running workflow
   */
  pauseWorkflow(workflowId: string): boolean {
    const state = this.activeWorkflows.get(workflowId);
    if (!state || state.status !== WorkflowStatus.RUNNING) {
      return false;
    }

    state.status = WorkflowStatus.PAUSED;
    state.metadata.pausedAt = new Date();
    return true;
  }

  /**
   * Resumes a paused workflow
   */
  resumeWorkflow(workflowId: string): boolean {
    const state = this.activeWorkflows.get(workflowId);
    if (!state || state.status !== WorkflowStatus.PAUSED) {
      return false;
    }

    state.status = WorkflowStatus.RUNNING;
    state.metadata.resumedAt = new Date();
    return true;
  }

  /**
   * Stops a running or paused workflow
   */
  stopWorkflow(workflowId: string): boolean {
    const state = this.activeWorkflows.get(workflowId);
    if (
      !state ||
      (state.status !== WorkflowStatus.RUNNING && state.status !== WorkflowStatus.PAUSED)
    ) {
      return false;
    }

    state.status = WorkflowStatus.CANCELLED;
    state.completedAt = new Date();
    state.metadata.stoppedAt = new Date();

    // Clean up
    this.activeWorkflows.delete(workflowId);
    return true;
  }

  /**
   * Gets the current execution state of a workflow
   */
  getWorkflowState(workflowId: string): WorkflowExecutionState | null {
    return this.activeWorkflows.get(workflowId) || null;
  }

  /**
   * Lists all active workflows
   */
  getActiveWorkflows(): string[] {
    return Array.from(this.activeWorkflows.keys());
  }

  /**
   * Main workflow execution logic
   */
  private async executeWorkflow(
    workflow: WorkflowDefinition,
    state: WorkflowExecutionState,
    options: WorkflowExecutionOptions,
    workflowId: string
  ): Promise<WorkflowResult> {
    const startTime = Date.now();

    try {
      // Create execution context
      const context: StepExecutionContext = {
        workflowId,
        stepResults: state.stepResults,
        sharedData: new Map(),
        abortController: new AbortController(),
      };

      // Execute workflow with enhanced step management
      await this.executeWorkflowSteps(workflow, state, options, context);

      // Determine final status
      const finalStatus = this.determineFinalStatus(state);
      state.status = finalStatus;
      state.completedAt = new Date();

      // Build final result
      const stepResults = Array.from(state.stepResults.values());
      const aggregatedResult = await this.aggregateResults(workflow, stepResults);

      return {
        workflowId: workflow.id,
        status: finalStatus,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
        duration: Date.now() - startTime,
        stepResults,
        aggregatedResult,
        metadata: state.metadata,
      };
    } catch (error) {
      state.status = WorkflowStatus.FAILED;
      state.completedAt = new Date();

      const errorMessage = error instanceof Error ? error.message : String(error);
      if (options.onError) {
        options.onError(
          error instanceof Error ? error : new Error(errorMessage),
          state.currentStep
        );
      }

      return {
        workflowId: workflow.id,
        status: WorkflowStatus.FAILED,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
        duration: Date.now() - startTime,
        stepResults: Array.from(state.stepResults.values()),
        error: errorMessage,
        metadata: state.metadata,
      };
    }
  }

  /**
   * Builds execution order using topological sort
   */
  private buildExecutionOrder(steps: WorkflowStep[]): string[] {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize graph and in-degrees
    steps.forEach(step => {
      if (!step.id) return;
      graph.set(step.id, []);
      inDegree.set(step.id, 0);
    });

    // Build graph: if A depends on B, then B -> A (B must come before A)
    steps.forEach(step => {
      if (!step.id || !step.dependencies) return;
      step.dependencies.forEach(dep => {
        if (graph.has(dep)) {
          graph.get(dep)!.push(step.id);
        }
      });
    });

    // Calculate in-degrees
    steps.forEach(step => {
      if (!step.id || !step.dependencies) return;
      inDegree.set(step.id, step.dependencies.length);
    });

    // Topological sort
    const queue: string[] = [];
    inDegree.forEach((degree, node) => {
      if (degree === 0) queue.push(node);
    });

    const order: string[] = [];

    while (queue.length > 0) {
      const node = queue.shift()!;
      order.push(node);

      (graph.get(node) || []).forEach(neighbor => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      });
    }

    return order;
  }

  /**
   * Execute workflow steps with support for parallel execution
   */
  private async executeWorkflowSteps(
    workflow: WorkflowDefinition,
    state: WorkflowExecutionState,
    options: WorkflowExecutionOptions,
    context: StepExecutionContext
  ): Promise<void> {
    const executed = new Set<string>();
    const inProgress = new Set<string>();

    while (executed.size < workflow.steps.length) {
      // Check if workflow was paused/stopped
      if (state.status === WorkflowStatus.PAUSED) {
        await this.waitForResume(state);
      }

      if (state.status === WorkflowStatus.CANCELLED) {
        break;
      }

      // Find steps that can be executed (all dependencies met)
      const readySteps = workflow.steps.filter(
        step =>
          !executed.has(step.id) &&
          !inProgress.has(step.id) &&
          this.canExecuteStep(step, executed, context)
      );

      if (readySteps.length === 0) {
        // Check for circular dependencies or execution errors
        if (inProgress.size === 0) {
          // Mark remaining steps with met dependencies as skipped
          const remainingSteps = workflow.steps.filter(step => !executed.has(step.id));
          let hasUnmetDependencies = false;
          for (const step of remainingSteps) {
            if (!step.dependencies.every(dep => executed.has(dep))) {
              hasUnmetDependencies = true;
              break;
            }
          }
          if (hasUnmetDependencies) {
            throw new Error(
              'No steps can be executed - possible circular dependency or execution error'
            );
          }
          // Mark remaining steps as skipped
          for (const step of remainingSteps) {
            const skippedResult: StepExecutionResult = {
              stepId: step.id,
              status: StepStatus.SKIPPED,
              startedAt: new Date(),
              completedAt: new Date(),
              duration: 0,
              retryCount: 0,
            };
            state.stepResults.set(step.id, skippedResult);
            executed.add(step.id);
            state.progress.skippedSteps++;
          }
          break; // Exit the loop
        }
        // Wait for in-progress steps to complete
        await new Promise(resolve => setTimeout(resolve, 10));
        continue;
      }

      // Execute ready steps (parallel if allowed)
      const maxConcurrency =
        workflow.config.maxConcurrency || (workflow.config.allowParallel ? 5 : 1);
      const stepsToExecute = readySteps.slice(0, maxConcurrency);

      // Mark steps as in progress
      stepsToExecute.forEach(step => inProgress.add(step.id));

      // Execute steps in parallel
      const executionPromises = stepsToExecute.map(step =>
        this.executeStepEnhanced(workflow, step, state, options, context)
      );

      // Wait for all to complete
      const results = await Promise.allSettled(executionPromises);

      // Process results
      results.forEach((result, index) => {
        const step = stepsToExecute[index];
        inProgress.delete(step.id);

        if (result.status === 'fulfilled') {
          const stepResult = result.value;
          executed.add(step.id);

          // Update progress
          this.updateProgress(state, stepResult);

          // Call callbacks
          if (options.onProgress) {
            options.onProgress(state.progress);
          }
          if (options.onStepComplete) {
            options.onStepComplete(stepResult);
          }

          // Check if workflow should fail
          if (stepResult.status === StepStatus.FAILED && !workflow.config.allowParallel) {
            state.status = WorkflowStatus.FAILED;
          }
        } else {
          // Step execution failed
          const error = result.reason;
          executed.add(step.id);

          const failedResult: StepExecutionResult = {
            stepId: step.id,
            status: StepStatus.FAILED,
            startedAt: new Date(),
            completedAt: new Date(),
            duration: 0,
            retryCount: 0,
            error: error instanceof Error ? error.message : String(error),
          };

          state.stepResults.set(step.id, failedResult);
          this.updateProgress(state, failedResult);

          if (options.onError) {
            options.onError(error instanceof Error ? error : new Error(String(error)), step.id);
          }

          if (!workflow.config.allowParallel) {
            state.status = WorkflowStatus.FAILED;
          }
        }
      });
    }
  }

  /**
   * Check if a step can be executed (all dependencies satisfied and conditions met)
   */
  private canExecuteStep(
    step: WorkflowStep,
    executed: Set<string>,
    context: StepExecutionContext
  ): boolean {
    // Check basic dependencies
    if (!step.dependencies.every(dep => executed.has(dep))) {
      return false;
    }

    // Check conditional dependencies if any
    if (step.conditions) {
      return this.evaluateConditions(
        step.conditions,
        context,
        step.conditions[0]?.operator || 'and'
      );
    }

    return true;
  }

  /**
   * Evaluate a workflow condition with full branching support
   */
  private evaluateCondition(
    condition: WorkflowCondition,
    context: StepExecutionContext
  ): BranchResult | null {
    try {
      switch (condition.type) {
        case 'if':
          return this.evaluateIfCondition(condition, context);
        case 'switch':
          return this.evaluateSwitchCondition(condition, context);
        case 'expression':
          return this.evaluateExpressionCondition(condition, context);
        default:
          return null;
      }
    } catch (error) {
      this.errorHandler.handleError(error, 'WorkflowExecutor.evaluateCondition', {
        component: 'WorkflowExecutor',
        action: 'evaluateCondition',
        timestamp: new Date().toISOString(),
      });
      return null;
    }
  }

  /**
   * Evaluate if condition
   */
  private evaluateIfCondition(
    condition: WorkflowCondition,
    context: StepExecutionContext
  ): BranchResult | null {
    const result = this.evaluateExpression(condition.expression, context);

    if (result) {
      return {
        branch: 'true',
        stepsToExecute: condition.branches['true'] || [],
        conditionResult: result,
      };
    } else {
      return {
        branch: 'false',
        stepsToExecute: condition.branches['false'] || [],
        conditionResult: result,
      };
    }
  }

  /**
   * Evaluate switch condition
   */
  private evaluateSwitchCondition(
    condition: WorkflowCondition,
    context: StepExecutionContext
  ): BranchResult | null {
    const switchValue =
      condition.value !== undefined
        ? condition.value
        : this.evaluateExpression(condition.expression, context);
    const branchKey = String(switchValue);

    if (condition.branches[branchKey]) {
      return {
        branch: branchKey,
        stepsToExecute: condition.branches[branchKey],
        conditionResult: switchValue,
      };
    } else if (condition.defaultBranch) {
      return {
        branch: 'default',
        stepsToExecute: condition.defaultBranch,
        conditionResult: switchValue,
      };
    }

    return null;
  }

  /**
   * Evaluate expression condition
   */
  private evaluateExpressionCondition(
    condition: WorkflowCondition,
    context: StepExecutionContext
  ): BranchResult | null {
    const result = this.evaluateExpression(condition.expression, context);

    return {
      branch: result ? 'true' : 'false',
      stepsToExecute: result ? condition.branches['true'] || [] : condition.branches['false'] || [],
      conditionResult: result,
    };
  }

  /**
   * Evaluate a boolean expression against execution context
   */
  private evaluateExpression(expression: string, context: StepExecutionContext): any {
    // Create a safe evaluation context
    const evalContext = {
      step: (stepId: string) => context.stepResults.get(stepId),
      shared: (key: string) => context.sharedData.get(key),
      workflow: {
        id: context.workflowId,
        stepCount: context.stepResults.size,
      },
      // Utility functions
      equals: (a: any, b: any) => a === b,
      notEquals: (a: any, b: any) => a !== b,
      greaterThan: (a: any, b: any) => a > b,
      lessThan: (a: any, b: any) => a < b,
      contains: (arr: any[], item: any) => Array.isArray(arr) && arr.includes(item),
      isEmpty: (value: any) =>
        value == null ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'string' && value.trim() === ''),
      isDefined: (value: any) => value != null,
    };

    try {
      // Simple expression evaluation - replace template variables
      let processedExpression = expression;

      // Replace ${step.stepId.result.field} patterns
      processedExpression = processedExpression.replace(/\$\{([^}]+)\}/g, (match, path) => {
        try {
          const value = this.resolvePath(path, evalContext);
          return JSON.stringify(value);
        } catch {
          return 'undefined';
        }
      });

      // For simple expressions, try direct evaluation
      if (
        processedExpression.includes('===') ||
        processedExpression.includes('!==') ||
        processedExpression.includes('&&') ||
        processedExpression.includes('||')
      ) {
        // Use Function constructor for safe evaluation
        const func = new Function(...Object.keys(evalContext), `return ${processedExpression};`);
        return func(...Object.values(evalContext));
      }

      // For simple property access
      return this.resolvePath(processedExpression, evalContext);
    } catch (error) {
      console.warn(`Failed to evaluate expression "${expression}":`, error);
      return false;
    }
  }

  /**
   * Resolve a dotted path in the evaluation context
   */
  private resolvePath(path: string, context: any): any {
    const parts = path.split('.');
    let current = context;

    for (const part of parts) {
      if (current == null) return undefined;

      // Handle array access like result.images[0]
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, prop, index] = arrayMatch;
        current = current[prop];
        if (Array.isArray(current)) {
          current = current[parseInt(index)];
        } else {
          return undefined;
        }
      } else {
        current = current[part];
      }
    }

    return current;
  }

  /**
   * Evaluate multiple conditions with logical operators
   */
  private evaluateConditions(
    conditions: WorkflowCondition[],
    context: StepExecutionContext,
    operator: 'and' | 'or' = 'and'
  ): boolean {
    if (!conditions || conditions.length === 0) return true;

    for (const condition of conditions) {
      const result = this.evaluateCondition(condition, context);
      const conditionMet = result !== null && result.conditionResult;

      if (operator === 'and' && !conditionMet) {
        return false;
      }
      if (operator === 'or' && conditionMet) {
        return true;
      }
    }

    return operator === 'and'; // All conditions met for AND, none met for OR
  }

  /**
   * Enhanced step execution with timeout and retry
   */
  private async executeStepEnhanced(
    workflow: WorkflowDefinition,
    step: WorkflowStep,
    state: WorkflowExecutionState,
    options: WorkflowExecutionOptions,
    context: StepExecutionContext
  ): Promise<StepExecutionResult> {
    const stepResult: StepExecutionResult = {
      stepId: step.id,
      status: StepStatus.RUNNING,
      startedAt: new Date(),
      retryCount: 0,
      metadata: {},
    };

    state.stepResults.set(step.id, stepResult);
    state.currentStep = step.id;

    const maxRetries = step.retryCount || 0;
    const baseDelay = step.retryDelay || 1000;
    const timeout = step.timeout || workflow.config.timeout || 30000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        stepResult.retryCount = attempt;

        // Execute with timeout
        const result = await this.executeStepWithTimeout(
          () => this.executeStepActionEnhanced(step, workflow, context),
          timeout,
          context.abortController.signal
        );

        stepResult.status = StepStatus.COMPLETED;
        stepResult.result = result;
        stepResult.completedAt = new Date();
        stepResult.duration = Date.now() - stepResult.startedAt.getTime();

        // Store result in shared context for dependent steps
        context.sharedData.set(`step.${step.id}.result`, result);

        break; // Success
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (isLastAttempt) {
          stepResult.status = StepStatus.FAILED;
          stepResult.error = errorMessage;
          stepResult.completedAt = new Date();
          stepResult.duration = Date.now() - stepResult.startedAt.getTime();
          throw error;
        } else {
          // Wait before retry with exponential backoff
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return stepResult;
  }

  /**
   * Execute step action with timeout
   */
  private async executeStepWithTimeout<T>(
    action: () => Promise<T>,
    timeoutMs: number,
    signal: AbortSignal
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Step execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const abortHandler = () => {
        clearTimeout(timeoutId);
        reject(new Error('Step execution was aborted'));
      };

      signal.addEventListener('abort', abortHandler);

      action()
        .then(result => {
          clearTimeout(timeoutId);
          signal.removeEventListener('abort', abortHandler);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          signal.removeEventListener('abort', abortHandler);
          reject(error);
        });
    });
  }

  /**
   * Enhanced step action execution with context awareness
   */
  private async executeStepActionEnhanced(
    step: WorkflowStep,
    workflow: WorkflowDefinition,
    context: StepExecutionContext
  ): Promise<any> {
    // Resolve dynamic values from context
    const resolvedConfig = this.resolveStepConfig(step.config, context);

    switch (step.type) {
      case StepType.GENERATE_IMAGE:
        return await this.imageSpecialist.processRequest({
          operation: ImageOperation.GENERATE,
          prompt: resolvedConfig.prompt,
          parameters: resolvedConfig.parameters,
        });

      case StepType.EDIT_IMAGE:
        return await this.imageSpecialist.processRequest({
          operation: ImageOperation.EDIT,
          prompt: resolvedConfig.prompt,
          image: resolvedConfig.image,
          mask: resolvedConfig.mask,
          parameters: resolvedConfig.parameters,
        });

      case StepType.ANALYZE_IMAGE:
        return await this.imageSpecialist.processRequest({
          operation: ImageOperation.ANALYZE,
          prompt: resolvedConfig.prompt,
          image: resolvedConfig.image,
        });

      case StepType.CONDITIONAL:
        // Conditional logic is handled at orchestration level
        return { condition: 'evaluated', result: true };

      case StepType.PARALLEL:
        // Parallel execution is handled at orchestration level
        return { parallel: 'completed' };

      case StepType.CUSTOM:
        throw new Error(`Custom step type not implemented: ${step.id}`);

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Resolve dynamic configuration values from execution context
   */
  private resolveStepConfig(config: any, context: StepExecutionContext): any {
    const resolved = { ...config };

    // Simple template resolution - can be enhanced
    Object.keys(resolved).forEach(key => {
      if (typeof resolved[key] === 'string') {
        const value = resolved[key] as string;

        // Replace ${step.stepId.result.someField} with actual values
        const stepResultMatch = value.match(/\$\{step\.(\w+)\.result\.?(.+)?\}/);
        if (stepResultMatch) {
          const stepId = stepResultMatch[1];
          const fieldPath = stepResultMatch[2];
          const stepResult = context.stepResults.get(stepId);

          if (stepResult?.result) {
            if (fieldPath) {
              // Simple dot notation support with array index handling
              const normalizedPath = fieldPath.replace(/\[(\d+)\]/g, '.$1');
              const fields = normalizedPath.split('.');
              let current = stepResult.result;
              for (const field of fields) {
                current = current?.[field];
              }
              resolved[key] = current;
            } else {
              resolved[key] = stepResult.result;
            }
          }
        }

        // Replace ${shared.key} with shared data
        const sharedMatch = value.match(/\$\{shared\.(.+)\}/);
        if (sharedMatch) {
          const sharedKey = sharedMatch[1];
          resolved[key] = context.sharedData.get(sharedKey);
        }
      }
    });

    return resolved;
  }

  /**
   * Executes a single step
   */
  private async executeStep(
    workflow: WorkflowDefinition,
    stepId: string,
    state: WorkflowExecutionState,
    options: WorkflowExecutionOptions
  ): Promise<StepExecutionResult> {
    const step = workflow.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step ${stepId} not found in workflow`);
    }

    state.currentStep = stepId;
    const startTime = Date.now();

    const stepResult: StepExecutionResult = {
      stepId,
      status: StepStatus.RUNNING,
      startedAt: new Date(),
      retryCount: 0,
      metadata: {},
    };

    state.stepResults.set(stepId, stepResult);

    try {
      // Execute step with retry logic
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= (step.retryCount || 0); attempt++) {
        try {
          stepResult.retryCount = attempt;

          const result = await this.executeStepAction(step, workflow, state);

          stepResult.status = StepStatus.COMPLETED;
          stepResult.result = result;
          stepResult.completedAt = new Date();
          stepResult.duration = Date.now() - startTime;

          break; // Success, exit retry loop
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (attempt < (step.retryCount || 0)) {
            // Wait before retry
            const delay = step.retryDelay || 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      if (stepResult.status !== StepStatus.COMPLETED && lastError) {
        throw lastError;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      stepResult.status = StepStatus.FAILED;
      stepResult.error = errorMessage;
      stepResult.completedAt = new Date();
      stepResult.duration = Date.now() - startTime;

      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error(errorMessage), stepId);
      }
    }

    return stepResult;
  }

  /**
   * Executes the actual step action using OpenAI Image Specialist
   */
  private async executeStepAction(
    step: WorkflowStep,
    workflow: WorkflowDefinition,
    state: WorkflowExecutionState
  ): Promise<any> {
    switch (step.type) {
      case StepType.GENERATE_IMAGE:
        return await this.imageSpecialist.processRequest({
          operation: ImageOperation.GENERATE,
          prompt: step.config.prompt,
          parameters: step.config.parameters,
        });

      case StepType.EDIT_IMAGE:
        return await this.imageSpecialist.processRequest({
          operation: ImageOperation.EDIT,
          prompt: step.config.prompt,
          image: step.config.image,
          mask: step.config.mask,
          parameters: step.config.parameters,
        });

      case StepType.ANALYZE_IMAGE:
        return await this.imageSpecialist.processRequest({
          operation: ImageOperation.ANALYZE,
          prompt: step.config.prompt,
          image: step.config.image,
        });

      case StepType.CONDITIONAL:
        // Conditional steps are handled at orchestration level
        return { condition: 'evaluated' };

      case StepType.PARALLEL:
        // Parallel execution is handled at orchestration level
        return { parallel: 'executed' };

      case StepType.CUSTOM:
        // Custom steps would need custom handlers
        throw new Error(`Custom step type not implemented: ${step.id}`);

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Updates workflow progress based on step result
   */
  private updateProgress(state: WorkflowExecutionState, stepResult: StepExecutionResult): void {
    const progress = state.progress;

    switch (stepResult.status) {
      case StepStatus.COMPLETED:
        progress.completedSteps++;
        break;
      case StepStatus.FAILED:
        progress.failedSteps++;
        break;
      case StepStatus.SKIPPED:
        progress.skippedSteps++;
        break;
    }

    progress.percentage = Math.round((progress.completedSteps / progress.totalSteps) * 100);
  }

  /**
   * Determines final workflow status
   */
  private determineFinalStatus(state: WorkflowExecutionState): WorkflowStatus {
    if (state.status === WorkflowStatus.CANCELLED) {
      return WorkflowStatus.CANCELLED;
    }

    if (state.status === WorkflowStatus.FAILED) {
      return WorkflowStatus.FAILED;
    }

    const progress = state.progress;
    if (progress.failedSteps > 0) {
      return WorkflowStatus.FAILED;
    }

    if (progress.completedSteps + progress.skippedSteps === progress.totalSteps) {
      return WorkflowStatus.COMPLETED;
    }

    return WorkflowStatus.FAILED; // Should not reach here in normal execution
  }

  /**
   * Aggregates results from all steps
   */
  private async aggregateResults(
    workflow: WorkflowDefinition,
    stepResults: StepExecutionResult[]
  ): Promise<any> {
    // Basic aggregation - collect all successful results
    const successfulResults = stepResults
      .filter(r => r.status === StepStatus.COMPLETED)
      .map(r => r.result)
      .filter(r => r != null);

    return {
      totalSteps: stepResults.length,
      successfulSteps: successfulResults.length,
      failedSteps: stepResults.filter(r => r.status === StepStatus.FAILED).length,
      results: successfulResults,
      workflowId: workflow.id,
    };
  }

  /**
   * Waits for workflow to be resumed from paused state
   */
  private async waitForResume(state: WorkflowExecutionState): Promise<void> {
    return new Promise(resolve => {
      const checkStatus = () => {
        if (state.status === WorkflowStatus.RUNNING) {
          resolve();
        } else if (state.status === WorkflowStatus.CANCELLED) {
          resolve(); // Will be handled in main loop
        } else {
          setTimeout(checkStatus, 100); // Check every 100ms
        }
      };
      checkStatus();
    });
  }
}
