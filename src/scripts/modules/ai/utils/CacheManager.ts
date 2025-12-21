/**
 * Cache Manager for AI Services
 * Provides intelligent caching with TTL, LRU eviction, and cleanup
 */

import type { GeminiConfig } from "../config/gemini-config";
import type { CacheConfig } from "../config/gemini-config";

export interface CacheEntry<T = any> {
  /** Cached data */
  data: T;
  /** Entry creation timestamp */
  createdAt: number;
  /** Time to live in seconds */
  ttl: number;
  /** Access count for LRU */
  accessCount: number;
  /** Last access timestamp */
  lastAccessed: number;
  /** Entry size in bytes (approximate) */
  size: number;
}

export interface CacheStats {
  /** Total number of entries */
  totalEntries: number;
  /** Cache hit ratio */
  hitRatio: number;
  /** Total hits */
  hits: number;
  /** Total misses */
  misses: number;
  /** Memory usage in bytes */
  memoryUsage: number;
  /** Evicted entries */
  evictions: number;
  /** Expired entries */
  expirations: number;
}

export interface CacheOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Maximum size of the entry */
  maxSize?: number;
  /** Priority level */
  priority?: "low" | "medium" | "high";
}

/**
 * In-memory LRU Cache with TTL support
 */
export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;
  private stats: CacheStats = {
    totalEntries: 0,
    hitRatio: 0,
    hits: 0,
    misses: 0,
    memoryUsage: 0,
    evictions: 0,
    expirations: 0,
  };

  constructor(config: CacheConfig) {
    this.config = config;

    if (config.cleanupInterval > 0) {
      this.startCleanupTimer();
    }
  }

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.config.enabled) {
      return null;
    }

    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRatio();
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.expirations++;
      this.stats.misses++;
      this.updateHitRatio();
      return null;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    this.stats.hits++;
    this.updateHitRatio();

    return entry.data as T;
  }

  /**
   * Set a value in cache
   */
  async set<T = any>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const ttl = options.ttl || this.config.defaultTtl;
    const size = this.estimateSize(value);

    // Check if we need to evict entries
    await this.ensureCapacity(size);

    const entry: CacheEntry<T> = {
      data: value,
      createdAt: Date.now(),
      ttl,
      accessCount: 1,
      lastAccessed: Date.now(),
      size,
    };

    this.cache.set(key, entry);
    this.updateStats();
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateStats();
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * Check if a key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Get cache size (number of entries)
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Force cleanup of expired entries
   */
  async cleanup(): Promise<number> {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleaned++;
        this.stats.expirations++;
      }
    }

    this.updateStats();
    return cleaned;
  }

  /**
   * Create a cache key from parameters
   */
  static createKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}:${params[key]}`)
      .join("|");

    return `${prefix}:${sortedParams}`;
  }

  /**
   * Create a hash key for long strings
   */
  static createHashKey(prefix: string, content: string): string {
    // Simple hash function for demonstration
    // In production, use a proper hashing algorithm
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `${prefix}:${Math.abs(hash).toString(36)}`;
  }

  /**
   * Destroy the cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    this.cache.clear();
    this.resetStats();
  }

  // Private methods

  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    const age = (now - entry.createdAt) / 1000; // Convert to seconds
    return age > entry.ttl;
  }

  private async ensureCapacity(newEntrySize: number): Promise<void> {
    // Check if we're at size limit
    if (this.cache.size < this.config.maxSize) {
      return;
    }

    // Evict entries until we have space
    const entries = Array.from(this.cache.entries()).sort(([, a], [, b]) => {
      // Sort by LRU (least recently used first)
      if (a.lastAccessed !== b.lastAccessed) {
        return a.lastAccessed - b.lastAccessed;
      }
      // Then by access count
      return a.accessCount - b.accessCount;
    });

    let freedSpace = 0;
    const entriesToRemove = Math.max(1, Math.floor(this.config.maxSize * 0.1)); // Remove 10% at least

    for (let i = 0; i < entriesToRemove && i < entries.length; i++) {
      const [key, entry] = entries[i];
      this.cache.delete(key);
      freedSpace += entry.size;
      this.stats.evictions++;
    }

    this.updateStats();
  }

  private estimateSize(value: any): number {
    // Rough estimation of object size in bytes
    if (value === null || value === undefined) return 0;

    if (typeof value === "string") {
      return value.length * 2; // Unicode characters are roughly 2 bytes
    }

    if (typeof value === "number") {
      return 8; // 64-bit number
    }

    if (typeof value === "boolean") {
      return 4;
    }

    if (typeof value === "object") {
      try {
        return JSON.stringify(value).length * 2;
      } catch {
        return 1024; // Default estimate for complex objects
      }
    }

    return 64; // Default estimate
  }

  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;

    let memoryUsage = 0;
    for (const entry of this.cache.values()) {
      memoryUsage += entry.size;
    }
    this.stats.memoryUsage = memoryUsage;

    this.updateHitRatio();
  }

  private updateHitRatio(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRatio = total > 0 ? this.stats.hits / total : 0;
  }

  private resetStats(): void {
    this.stats = {
      totalEntries: 0,
      hitRatio: 0,
      hits: 0,
      misses: 0,
      memoryUsage: 0,
      evictions: 0,
      expirations: 0,
    };
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch((error) => {
        console.error("Cache cleanup error:", error);
      });
    }, this.config.cleanupInterval * 1000);
  }
}

/**
 * Cache factory for creating specialized cache instances
 */
export class CacheFactory {
  private static instances = new Map<string, CacheManager>();

  /**
   * Get or create a cache instance
   */
  static getInstance(name: string, config: CacheConfig): CacheManager {
    if (!this.instances.has(name)) {
      this.instances.set(name, new CacheManager(config));
    }

    return this.instances.get(name)!;
  }

  /**
   * Destroy a cache instance
   */
  static destroyInstance(name: string): void {
    const instance = this.instances.get(name);
    if (instance) {
      instance.destroy();
      this.instances.delete(name);
    }
  }

  /**
   * Destroy all cache instances
   */
  static destroyAll(): void {
    for (const [name, instance] of this.instances) {
      instance.destroy();
    }
    this.instances.clear();
  }

  /**
   * Get all cache instance names
   */
  static getInstances(): string[] {
    return Array.from(this.instances.keys());
  }

  /**
   * Get combined statistics from all instances
   */
  static getCombinedStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};

    for (const [name, instance] of this.instances) {
      stats[name] = instance.getStats();
    }

    return stats;
  }
}
