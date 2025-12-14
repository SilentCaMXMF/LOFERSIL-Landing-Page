import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GitHubProjectsIntegration } from "../../../../src/scripts/modules/../../../src/scripts/modules/github-projects";

// Mock fetch globally
global.fetch = vi.fn();

describe("GitHubProjectsIntegration", () => {
  let kanban: GitHubProjectsIntegration;

  beforeEach(() => {
    kanban = new GitHubProjectsIntegration(
      "fake-token",
      "PVT_kwDOA123",
      "test-owner",
      "test-repo",
    );

    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with provided parameters", () => {
      expect(kanban).toBeDefined();
    });
  });

  describe("GraphQL requests", () => {
    it("should make GraphQL requests with proper headers", async () => {
      const mockResponse = { data: { test: "data" } };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await kanban["makeGraphQLRequest"]("query { test }");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.github.com/graphql",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer fake-token",
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ query: "query { test }" }),
        }),
      );

      expect(result).toEqual(mockResponse);
    });

    it("should handle GraphQL errors", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            errors: [{ message: "Test error" }],
          }),
      });

      await expect(
        kanban["makeGraphQLRequest"]("query { test }"),
      ).rejects.toThrow("GraphQL errors: Test error");
    });

    it("should handle HTTP errors", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      await expect(
        kanban["makeGraphQLRequest"]("query { test }"),
      ).rejects.toThrow("GitHub API error: 401 Unauthorized");
    });
  });

  describe("column management", () => {
    it("should get project columns", async () => {
      const mockResponse = {
        data: {
          node: {
            fields: {
              nodes: [
                {
                  name: "Status",
                  options: [
                    { id: "status1", name: "Backlog" },
                    { id: "status2", name: "In Progress" },
                  ],
                },
              ],
            },
          },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const columns = await kanban.getProjectColumns();

      expect(columns).toHaveLength(2);
      expect(columns[0]).toEqual({
        id: "status1",
        name: "Backlog",
        position: 0,
      });
    });
  });

  describe("card operations", () => {
    it("should create a card", async () => {
      // Mock repository ID query
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { repository: { id: "repo123" } },
          }),
      });

      // Mock label IDs query
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { repository: { labels: { nodes: [] } } },
          }),
      });

      // Mock issue creation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { createIssue: { issue: { id: "issue123" } } },
          }),
      });

      // Mock add to project
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { addProjectV2ItemById: { item: { id: "item123" } } },
          }),
      });

      // Mock status update
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              updateProjectV2ItemFieldValue: {
                projectV2Item: { id: "item123" },
              },
            },
          }),
      });

      const card = await kanban.createCard({
        title: "Test Card",
        body: "Test body",
        status: "Backlog",
        assignees: [],
        labels: ["test"],
      });

      expect(card).toBe("item123");
    });

    it("should update card status", async () => {
      // Mock status field query
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              node: {
                fields: {
                  nodes: [
                    {
                      name: "Status",
                      options: [{ id: "status1", name: "Backlog" }],
                    },
                  ],
                },
              },
            },
          }),
      });

      // Mock status option query
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              node: {
                fields: {
                  nodes: [
                    {
                      name: "Status",
                      options: [{ id: "status1", name: "Backlog" }],
                    },
                  ],
                },
              },
            },
          }),
      });

      // Mock update
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              updateProjectV2ItemFieldValue: {
                projectV2Item: { id: "item123" },
              },
            },
          }),
      });

      await kanban.updateCardStatus("item123", "Backlog");

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe("task synchronization", () => {
    it("should sync task status with kanban", async () => {
      // Mock get all cards
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              node: {
                items: {
                  nodes: [
                    {
                      id: "item123",
                      content: {
                        number: 456,
                        title: "Test Issue",
                        body: "Test body",
                        assignees: { nodes: [] },
                        labels: { nodes: [] },
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      },
                    },
                  ],
                },
              },
            },
          }),
      });

      // Mock status update
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              updateProjectV2ItemFieldValue: {
                projectV2Item: { id: "item123" },
              },
            },
          }),
      });

      // Mock status field queries
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              node: {
                fields: {
                  nodes: [
                    {
                      name: "Status",
                      options: [{ id: "status1", name: "In Progress" }],
                    },
                  ],
                },
              },
            },
          }),
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              node: {
                fields: {
                  nodes: [
                    {
                      name: "Status",
                      options: [{ id: "status1", name: "In Progress" }],
                    },
                  ],
                },
              },
            },
          }),
      });

      await kanban.syncTaskStatus("task123", "in_progress", 456);

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe("workflow progress", () => {
    it("should update workflow progress", async () => {
      // Mock get all cards (no existing progress card)
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              node: {
                items: {
                  nodes: [],
                },
              },
            },
          }),
      });

      // Mock repository ID
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { repository: { id: "repo123" } },
          }),
      });

      // Mock label IDs
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { repository: { labels: { nodes: [] } } },
          }),
      });

      // Mock issue creation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { createIssue: { issue: { id: "issue123" } } },
          }),
      });

      // Mock add to project
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { addProjectV2ItemById: { item: { id: "item123" } } },
          }),
      });

      // Mock status update
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              updateProjectV2ItemFieldValue: {
                projectV2Item: { id: "item123" },
              },
            },
          }),
      });

      await kanban.updateWorkflowProgress(
        123,
        "task456",
        "Analysis Complete",
        50,
      );

      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
