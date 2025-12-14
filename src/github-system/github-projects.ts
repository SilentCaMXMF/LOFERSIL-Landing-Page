/**
 * GitHub Projects (V2) Integration
 * Automated kanban board management for AI-powered GitHub Issues Reviewer
 */

import { logger } from "../scripts/modules/logger";

export interface KanbanCard {
  id: string;
  title: string;
  body: string;
  status: string;
  assignees: string[];
  labels: string[];
  issueNumber?: number;
  taskId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KanbanColumn {
  id: string;
  name: string;
  position: number;
}

export interface KanbanProject {
  id: string;
  title: string;
  columns: KanbanColumn[];
}

export class GitHubProjectsIntegration {
  private accessToken: string;
  private baseUrl = "https://api.github.com/graphql";
  private projectId: string;
  private owner: string;
  private repo: string;

  constructor(
    accessToken: string,
    projectId: string,
    owner: string,
    repo: string,
  ) {
    this.accessToken = accessToken;
    this.projectId = projectId;
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Make GraphQL request to GitHub API
   */
  private async makeGraphQLRequest(
    query: string,
    variables: Record<string, unknown> = {},
  ): Promise<any> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v4.idl",
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      return result.data;
    } catch (error) {
      logger.error("GitHub Projects API request failed", {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get project columns
   */
  async getProjectColumns(): Promise<KanbanColumn[]> {
    const query = `
      query($projectId: ID!) {
        node(id: $projectId) {
          ... on ProjectV2 {
            fields(first: 20) {
              nodes {
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  options {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.makeGraphQLRequest(query, {
        projectId: this.projectId,
      });

      const statusField = data.node.fields.nodes.find(
        (field: any) => field.name === "Status" || field.name === "status",
      );

      if (!statusField) {
        throw new Error("Status field not found in project");
      }

      return statusField.options.map((option: any, index: number) => ({
        id: option.id,
        name: option.name,
        position: index,
      }));
    } catch (error) {
      logger.error("Failed to get project columns", {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Create a new card in the kanban board
   */
  async createCard(
    card: Omit<KanbanCard, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    // First, create the issue if it doesn't exist
    let issueId: string;

    if (card.issueNumber) {
      // Get existing issue
      issueId = await this.getIssueId(card.issueNumber);
    } else {
      // Create new issue
      issueId = await this.createIssue(card.title, card.body, card.labels);
    }

    // Add issue to project
    const itemId = await this.addIssueToProject(issueId);

    // Set status field
    await this.updateCardStatus(itemId, card.status);

    logger.info("Created kanban card", {
      title: card.title,
      status: card.status,
      issueNumber: card.issueNumber,
      taskId: card.taskId,
    });

    return itemId;
  }

  /**
   * Update card status
   */
  async updateCardStatus(itemId: string, status: string): Promise<void> {
    // Get status field ID
    const statusFieldId = await this.getStatusFieldId();

    // Get status option ID
    const statusOptionId = await this.getStatusOptionId(status);

    const mutation = `
      mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: ID!) {
        updateProjectV2ItemFieldValue(
          input: {
            projectId: $projectId
            itemId: $itemId
            fieldId: $fieldId
            value: {
              singleSelectOptionId: $optionId
            }
          }
        ) {
          projectV2Item {
            id
          }
        }
      }
    `;

    try {
      await this.makeGraphQLRequest(mutation, {
        projectId: this.projectId,
        itemId,
        fieldId: statusFieldId,
        optionId: statusOptionId,
      });

      logger.info("Updated card status", { itemId, status });
    } catch (error) {
      logger.error("Failed to update card status", {
        itemId,
        status,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get all cards in the project
   */
  async getAllCards(): Promise<KanbanCard[]> {
    const query = `
      query($projectId: ID!) {
        node(id: $projectId) {
          ... on ProjectV2 {
            items(first: 100) {
              nodes {
                id
                fieldValues(first: 20) {
                  nodes {
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      field {
                        ... on ProjectV2SingleSelectField {
                          name
                        }
                      }
                      optionId
                      name
                    }
                  }
                }
                content {
                  ... on Issue {
                    number
                    title
                    body
                    assignees(first: 10) {
                      nodes {
                        login
                      }
                    }
                    labels(first: 10) {
                      nodes {
                        name
                      }
                    }
                    createdAt
                    updatedAt
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.makeGraphQLRequest(query, {
        projectId: this.projectId,
      });

      return data.node.items.nodes.map((item: any) => {
        const statusField = item.fieldValues.nodes.find(
          (field: any) =>
            field.field?.name === "Status" || field.field?.name === "status",
        );

        return {
          id: item.id,
          title: item.content.title,
          body: item.content.body || "",
          status: statusField?.name || "No Status",
          assignees: item.content.assignees.nodes.map(
            (assignee: any) => assignee.login,
          ),
          labels: item.content.labels.nodes.map((label: any) => label.name),
          issueNumber: item.content.number,
          createdAt: new Date(item.content.createdAt),
          updatedAt: new Date(item.content.updatedAt),
        };
      });
    } catch (error) {
      logger.error("Failed to get all cards", {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get issue ID by number
   */
  private async getIssueId(issueNumber: number): Promise<string> {
    const query = `
      query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          issue(number: $number) {
            id
          }
        }
      }
    `;

    try {
      const data = await this.makeGraphQLRequest(query, {
        owner: this.owner,
        repo: this.repo,
        number: issueNumber,
      });

      return data.repository.issue.id;
    } catch (error) {
      logger.error("Failed to get issue ID", {
        issueNumber,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Create a new issue
   */
  private async createIssue(
    title: string,
    body: string,
    labels: string[] = [],
  ): Promise<string> {
    const mutation = `
      mutation($repositoryId: ID!, $title: String!, $body: String!, $labelIds: [ID!]) {
        createIssue(
          input: {
            repositoryId: $repositoryId
            title: $title
            body: $body
            labelIds: $labelIds
          }
        ) {
          issue {
            id
          }
        }
      }
    `;

    // Get repository ID and label IDs
    const repoId = await this.getRepositoryId();
    const labelIds = await this.getLabelIds(labels);

    try {
      const data = await this.makeGraphQLRequest(mutation, {
        repositoryId: repoId,
        title,
        body,
        labelIds,
      });

      return data.createIssue.issue.id;
    } catch (error) {
      logger.error("Failed to create issue", {
        title,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Add issue to project
   */
  private async addIssueToProject(issueId: string): Promise<string> {
    const mutation = `
      mutation($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(
          input: {
            projectId: $projectId
            contentId: $contentId
          }
        ) {
          item {
            id
          }
        }
      }
    `;

    try {
      const data = await this.makeGraphQLRequest(mutation, {
        projectId: this.projectId,
        contentId: issueId,
      });

      return data.addProjectV2ItemById.item.id;
    } catch (error) {
      logger.error("Failed to add issue to project", {
        issueId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get repository ID
   */
  private async getRepositoryId(): Promise<string> {
    const query = `
      query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          id
        }
      }
    `;

    try {
      const data = await this.makeGraphQLRequest(query, {
        owner: this.owner,
        repo: this.repo,
      });

      return data.repository.id;
    } catch (error) {
      logger.error("Failed to get repository ID", {
        owner: this.owner,
        repo: this.repo,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get label IDs
   */
  private async getLabelIds(labelNames: string[]): Promise<string[]> {
    if (labelNames.length === 0) return [];

    const query = `
      query($owner: String!, $repo: String!, $labelNames: [String!]) {
        repository(owner: $owner, name: $repo) {
          labels(first: 100, query: $labelNames[0]) {
            nodes {
              id
              name
            }
          }
        }
      }
    `;

    try {
      const labelIds: string[] = [];

      for (const labelName of labelNames) {
        const data = await this.makeGraphQLRequest(query, {
          owner: this.owner,
          repo: this.repo,
          labelNames: [labelName],
        });

        const label = data.repository.labels.nodes.find(
          (label: any) => label.name === labelName,
        );

        if (label) {
          labelIds.push(label.id);
        }
      }

      return labelIds;
    } catch (error) {
      logger.error("Failed to get label IDs", {
        labelNames,
        error: (error as Error).message,
      });
      return [];
    }
  }

  /**
   * Get status field ID
   */
  private async getStatusFieldId(): Promise<string> {
    const query = `
      query($projectId: ID!) {
        node(id: $projectId) {
          ... on ProjectV2 {
            fields(first: 20) {
              nodes {
                ... on ProjectV2SingleSelectField {
                  id
                  name
                }
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.makeGraphQLRequest(query, {
        projectId: this.projectId,
      });

      const statusField = data.node.fields.nodes.find(
        (field: any) => field.name === "Status" || field.name === "status",
      );

      if (!statusField) {
        throw new Error("Status field not found in project");
      }

      return statusField.id;
    } catch (error) {
      logger.error("Failed to get status field ID", {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get status option ID by name
   */
  private async getStatusOptionId(statusName: string): Promise<string> {
    const query = `
      query($projectId: ID!) {
        node(id: $projectId) {
          ... on ProjectV2 {
            fields(first: 20) {
              nodes {
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  options {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.makeGraphQLRequest(query, {
        projectId: this.projectId,
      });

      const statusField = data.node.fields.nodes.find(
        (field: any) => field.name === "Status" || field.name === "status",
      );

      if (!statusField) {
        throw new Error("Status field not found in project");
      }

      const option = statusField.options.find(
        (opt: any) => opt.name.toLowerCase() === statusName.toLowerCase(),
      );

      if (!option) {
        throw new Error(`Status option '${statusName}' not found in project`);
      }

      return option.id;
    } catch (error) {
      logger.error("Failed to get status option ID", {
        statusName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Sync task status with kanban board
   */
  async syncTaskStatus(
    taskId: string,
    status: string,
    issueNumber?: number,
  ): Promise<void> {
    try {
      if (!issueNumber) {
        logger.warn("Cannot sync task status without issue number", {
          taskId,
          status,
        });
        return;
      }

      // Find the card for this issue
      const cards = await this.getAllCards();
      const card = cards.find((c) => c.issueNumber === issueNumber);

      if (!card) {
        logger.warn("Card not found for issue", { issueNumber, taskId });
        return;
      }

      // Map task status to kanban column
      const kanbanStatus = this.mapTaskStatusToKanban(status);

      // Update card status
      await this.updateCardStatus(card.id, kanbanStatus);

      logger.info("Synced task status with kanban board", {
        taskId,
        issueNumber,
        status,
        kanbanStatus,
      });
    } catch (error) {
      logger.error("Failed to sync task status", {
        taskId,
        status,
        issueNumber,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Map task status to kanban column name
   */
  private mapTaskStatusToKanban(taskStatus: string): string {
    const statusMap: { [key: string]: string } = {
      pending: "Backlog",
      in_progress: "In Progress",
      completed: "Done",
      blocked: "Blocked",
      processing: "In Progress",
      failed: "Blocked",
    };

    return statusMap[taskStatus] || "Backlog";
  }

  /**
   * Create workflow progress card
   */
  async createWorkflowProgressCard(
    issueNumber: number,
    taskId: string,
    workflowStage: string,
    progress: number,
  ): Promise<void> {
    try {
      const title = `🤖 AI Processing: Issue #${issueNumber}`;
      const body = `
## AI Workflow Progress

**Task ID:** ${taskId}
**Issue:** #${issueNumber}
**Current Stage:** ${workflowStage}
**Progress:** ${progress}%

### Workflow Stages:
- [${progress >= 25 ? "x" : " "}] Issue Analysis
- [${progress >= 50 ? "x" : " "}] Code Generation
- [${progress >= 75 ? "x" : " "}] Code Review
- [${progress >= 100 ? "x" : " "}] PR Creation

*This card is automatically updated by the AI system.*
      `;

      const status = progress === 100 ? "Done" : "In Progress";

      await this.createCard({
        title,
        body,
        status,
        assignees: [],
        labels: ["ai-processing", "automated"],
        issueNumber,
        taskId,
      });

      logger.info("Created workflow progress card", {
        issueNumber,
        taskId,
        workflowStage,
        progress,
      });
    } catch (error) {
      logger.error("Failed to create workflow progress card", {
        issueNumber,
        taskId,
        workflowStage,
        progress,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Update workflow progress
   */
  async updateWorkflowProgress(
    issueNumber: number,
    taskId: string,
    workflowStage: string,
    progress: number,
  ): Promise<void> {
    try {
      // Find existing progress card
      const cards = await this.getAllCards();
      const progressCard = cards.find(
        (c) =>
          c.issueNumber === issueNumber &&
          c.labels.includes("ai-processing") &&
          c.taskId === taskId,
      );

      if (progressCard) {
        // Update existing card
        const updatedBody = progressCard.body
          .replace(/Progress: \d+%/, `Progress: ${progress}%`)
          .replace(/Current Stage: .*/, `Current Stage: ${workflowStage}`);

        // Update checkboxes based on progress
        const updatedBodyWithCheckboxes = updatedBody
          .replace(
            /\[x\]\] Issue Analysis/,
            `[${progress >= 25 ? "x" : " "}] Issue Analysis`,
          )
          .replace(
            /\[x\]\] Code Generation/,
            `[${progress >= 50 ? "x" : " "}] Code Generation`,
          )
          .replace(
            /\[x\]\] Code Review/,
            `[${progress >= 75 ? "x" : " "}] Code Review`,
          )
          .replace(
            /\[x\]\] PR Creation/,
            `[${progress >= 100 ? "x" : " "}] PR Creation`,
          );

        // Note: GitHub Projects API doesn't easily support updating card content
        // This would require additional implementation

        // Update status
        const status = progress === 100 ? "Done" : "In Progress";
        await this.updateCardStatus(progressCard.id, status);

        logger.info("Updated workflow progress", {
          issueNumber,
          taskId,
          workflowStage,
          progress,
        });
      } else {
        // Create new progress card
        await this.createWorkflowProgressCard(
          issueNumber,
          taskId,
          workflowStage,
          progress,
        );
      }
    } catch (error) {
      logger.error("Failed to update workflow progress", {
        issueNumber,
        taskId,
        workflowStage,
        progress,
        error: (error as Error).message,
      });
    }
  }
}
