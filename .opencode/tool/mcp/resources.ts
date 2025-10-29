/**
 * MCP Resources Management
 *
 * Handles resource discovery, reading, and management through MCP protocol.
 */

import { MCPClient } from './client.js';
import type { MCPResource } from './types.js';

export class MCPResources {
  private client: MCPClient;
  private cachedResources: MCPResource[] = [];
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(client: MCPClient) {
    this.client = client;
  }

  async listResources(forceRefresh: boolean = false): Promise<MCPResource[]> {
    if (!forceRefresh && this.isCacheValid()) {
      return this.cachedResources;
    }

    try {
      const response = await this.client.sendRequest('resources/list');
      this.cachedResources = response.resources || [];
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
      return this.cachedResources;
    } catch (error) {
      console.error('Failed to list MCP resources:', error);
      // Return cached resources if available, even if expired
      if (this.cachedResources.length > 0) {
        return this.cachedResources;
      }
      throw error;
    }
  }

  async readResource(uri: string): Promise<any> {
    try {
      const response = await this.client.sendRequest('resources/read', { uri });
      const content = response.contents?.[0];
      if (!content) {
        throw new Error(`No content returned for resource: ${uri}`);
      }
      return content;
    } catch (error) {
      console.error(`Failed to read resource '${uri}':`, error);
      throw error;
    }
  }

  async readMultipleResources(uris: string[]): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    for (const uri of uris) {
      try {
        const content = await this.readResource(uri);
        results.set(uri, content);
      } catch (error) {
        console.error(`Failed to read resource '${uri}':`, error);
        results.set(uri, null);
      }
    }

    return results;
  }

  private isCacheValid(): boolean {
    return this.cacheExpiry > Date.now();
  }

  clearCache(): void {
    this.cachedResources = [];
    this.cacheExpiry = 0;
  }

  getCachedResources(): MCPResource[] {
    return this.cachedResources;
  }

  // Utility methods for resource operations
  async findResourceByUri(uri: string): Promise<MCPResource | null> {
    const resources = await this.listResources();
    return resources.find(r => r.uri === uri) || null;
  }

  async findResourcesByName(name: string): Promise<MCPResource[]> {
    const resources = await this.listResources();
    return resources.filter(r => r.name.toLowerCase().includes(name.toLowerCase()));
  }

  async findResourcesByMimeType(mimeType: string): Promise<MCPResource[]> {
    const resources = await this.listResources();
    return resources.filter(r => r.mimeType === mimeType);
  }

  async getResourceUris(): Promise<string[]> {
    const resources = await this.listResources();
    return resources.map(r => r.uri);
  }

  async getResourcesByPattern(pattern: RegExp): Promise<MCPResource[]> {
    const resources = await this.listResources();
    return resources.filter(
      r =>
        pattern.test(r.uri) ||
        pattern.test(r.name) ||
        (r.description && pattern.test(r.description))
    );
  }

  // Batch operations
  async prefetchResources(uris: string[]): Promise<void> {
    // Prefetch multiple resources in parallel
    const promises = uris.map(uri => this.readResource(uri).catch(() => null));
    await Promise.allSettled(promises);
  }

  // Resource content helpers
  async readTextResource(uri: string): Promise<string> {
    const content = await this.readResource(uri);
    if (content.text) {
      return content.text;
    }
    if (content.blob) {
      // Convert blob to text (simplified)
      return content.blob.toString();
    }
    throw new Error(`Resource '${uri}' does not contain text content`);
  }

  async readJsonResource(uri: string): Promise<any> {
    const text = await this.readTextResource(uri);
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error(`Failed to parse JSON from resource '${uri}': ${error}`);
    }
  }
}
