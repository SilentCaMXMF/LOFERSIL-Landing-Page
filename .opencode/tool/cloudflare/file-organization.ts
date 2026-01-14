/**
 * Cloudflare Image Operations File Organization System
 *
 * Provides comprehensive file management for Cloudflare Workers AI image operations,
 * including directory structure, naming conventions, metadata tracking, and cleanup.
 */

import { mkdir, writeFile, readFile, stat, access, readdir, rm, rename } from 'fs/promises';
import { constants } from 'fs';
import { join, resolve, dirname, extname, basename } from 'path';
import { createHash } from 'crypto';

// Directory structure constants
export const OPERATION_TYPES = {
  GENERATION: 'generation',
  TRANSFORMATION: 'transformation',
  OPTIMIZATION: 'optimization',
  CONVERSION: 'conversion',
  RESIZE: 'resize',
} as const;

export type OperationType = (typeof OPERATION_TYPES)[keyof typeof OPERATION_TYPES];

// Supported file formats
export const SUPPORTED_FORMATS = {
  PNG: 'png',
  JPEG: 'jpeg',
  JPG: 'jpg',
  WEBP: 'webp',
  AVIF: 'avif',
} as const;

export type ImageFormat = (typeof SUPPORTED_FORMATS)[keyof typeof SUPPORTED_FORMATS];

// Configuration interfaces
export interface FileOrganizationConfig {
  baseDir?: string;
  maxTempAge?: number; // in hours
  maxArchiveAge?: number; // in days
  diskThreshold?: number; // percentage
  enableCleanup?: boolean;
  enableArchiving?: boolean;
}

export interface FileNamingConfig {
  prefix?: string;
  suffix?: string;
  includeTimestamp?: boolean;
  includeParams?: boolean;
  maxLength?: number;
}

export interface OperationMetadata {
  id: string;
  operation: OperationType;
  model: string;
  timestamp: Date;
  duration: number; // in milliseconds
  parameters: Record<string, any>;
  originalPrompt?: string;
  cost: number;
  tokens?: number;
  filePath: string;
  fileSize: number;
  format: ImageFormat;
  dimensions?: {
    width: number;
    height: number;
  };
  quality?: number;
  compression?: string;
  success: boolean;
  error?: string;
}

// File organization class
export class CloudflareFileOrganizer {
  private config: Required<FileOrganizationConfig>;
  private baseDir: string;

  constructor(config: FileOrganizationConfig = {}) {
    this.config = {
      baseDir: config.baseDir || resolve(process.cwd(), '../../assets/images/cloudflare'),
      maxTempAge: config.maxTempAge || 24, // 24 hours
      maxArchiveAge: config.maxArchiveAge || 30, // 30 days
      diskThreshold: config.diskThreshold || 90, // 90%
      enableCleanup: config.enableCleanup !== false,
      enableArchiving: config.enableArchiving !== false,
    };
    this.baseDir = this.config.baseDir;
  }

  /**
   * Get date-based directory path
   */
  private getDatePath(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return join(this.baseDir, `${year}-${month}-${day}`);
  }

  /**
   * Get operation-specific subdirectory
   */
  private getOperationPath(operation: OperationType, date: Date = new Date()): string {
    return join(this.getDatePath(date), operation);
  }

  /**
   * Ensure directory exists with proper permissions
   */
  async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await mkdir(dirPath, { recursive: true, mode: 0o755 });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
      }
    }
  }

  /**
   * Generate unique filename with descriptive naming
   */
  async generateUniqueFilename(
    operation: OperationType,
    config: FileNamingConfig = {},
    extension: string = '.png'
  ): Promise<string> {
    const {
      prefix = '',
      suffix = '',
      includeTimestamp = true,
      includeParams = false,
      maxLength = 100,
    } = config;

    const timestamp = includeTimestamp ? `_${Date.now()}` : '';
    const params = includeParams ? '_params' : '';

    let baseName = `${operation}${timestamp}${params}`;
    if (prefix) baseName = `${prefix}_${baseName}`;
    if (suffix) baseName = `${baseName}_${suffix}`;

    // Truncate if too long
    if (baseName.length > maxLength) {
      const hash = createHash('md5').update(baseName).digest('hex').substring(0, 8);
      baseName = `${baseName.substring(0, maxLength - 9)}_${hash}`;
    }

    const dirPath = this.getOperationPath(operation);
    await this.ensureDirectory(dirPath);

    let counter = 1;
    let filename: string;

    do {
      const counterStr = counter === 1 ? '' : `_${counter.toString().padStart(3, '0')}`;
      filename = join(dirPath, `${baseName}${counterStr}${extension}`);
      counter++;
    } while (
      await access(filename, constants.F_OK)
        .then(() => true)
        .catch(() => false)
    );

    return filename;
  }

  /**
   * Save operation metadata as JSON file
   */
  async saveMetadata(metadata: OperationMetadata): Promise<string> {
    const metadataDir = join(this.getDatePath(new Date(metadata.timestamp)), 'metadata');
    await this.ensureDirectory(metadataDir);

    const metadataPath = join(metadataDir, `${metadata.id}.json`);
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

    return metadataPath;
  }

  /**
   * Load operation metadata
   */
  async loadMetadata(metadataPath: string): Promise<OperationMetadata> {
    const content = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(content);
    // Convert timestamp back to Date object
    metadata.timestamp = new Date(metadata.timestamp);
    return metadata;
  }

  /**
   * Get optimal format based on use case
   */
  getOptimalFormat(useCase: string, quality: number = 80): ImageFormat {
    switch (useCase.toLowerCase()) {
      case 'web':
      case 'website':
        return quality >= 90 ? SUPPORTED_FORMATS.WEBP : SUPPORTED_FORMATS.JPEG;
      case 'print':
      case 'high-quality':
        return SUPPORTED_FORMATS.PNG;
      case 'compression':
      case 'storage':
        return SUPPORTED_FORMATS.WEBP;
      case 'animation':
      case 'transparent':
        return SUPPORTED_FORMATS.PNG;
      default:
        return SUPPORTED_FORMATS.PNG;
    }
  }

  /**
   * Get format-specific quality settings
   */
  getFormatSettings(format: ImageFormat, quality: number = 80): { quality: number; compression?: string } {
    switch (format) {
      case SUPPORTED_FORMATS.JPEG:
      case SUPPORTED_FORMATS.JPG:
        return { quality: Math.max(1, Math.min(100, quality)) };
      case SUPPORTED_FORMATS.WEBP:
        return { quality: Math.max(1, Math.min(100, quality)) };
      case SUPPORTED_FORMATS.AVIF:
        return { quality: Math.max(1, Math.min(100, quality)) };
      case SUPPORTED_FORMATS.PNG:
        // PNG doesn't use quality, but we can suggest compression
        return { quality: 100, compression: 'default' };
      default:
        return { quality: 80 };
    }
  }

  /**
   * Create operation metadata
   */
  createMetadata(
    operation: OperationType,
    model: string,
    parameters: Record<string, any>,
    filePath: string,
    duration: number,
    cost: number = 0,
    tokens?: number,
    error?: string
  ): OperationMetadata {
    const id = createHash('sha256')
      .update(`${operation}-${model}-${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 16);

    const format = this.getFormatFromPath(filePath);
    const success = !error;

    return {
      id,
      operation,
      model,
      timestamp: new Date(),
      duration,
      parameters,
      originalPrompt: parameters.prompt,
      cost,
      tokens,
      filePath,
      fileSize: 0, // Will be updated after file is written
      format,
      quality: parameters.quality,
      compression: parameters.compression,
      success,
      error,
    };
  }

  /**
   * Extract format from file path
   */
  private getFormatFromPath(filePath: string): ImageFormat {
    const ext = extname(filePath).toLowerCase().replace('.', '');
    switch (ext) {
      case 'jpg':
        return SUPPORTED_FORMATS.JPG;
      case 'jpeg':
        return SUPPORTED_FORMATS.JPEG;
      case 'png':
        return SUPPORTED_FORMATS.PNG;
      case 'webp':
        return SUPPORTED_FORMATS.WEBP;
      case 'avif':
        return SUPPORTED_FORMATS.AVIF;
      default:
        return SUPPORTED_FORMATS.PNG;
    }
  }

  /**
   * Update metadata with file information
   */
  async updateMetadataWithFileInfo(metadata: OperationMetadata): Promise<OperationMetadata> {
    try {
      const stats = await stat(metadata.filePath);
      metadata.fileSize = stats.size;

      // Note: For dimensions, we'd need an image processing library like sharp
      // For now, we'll leave dimensions undefined or implement basic detection
      // metadata.dimensions = await this.getImageDimensions(metadata.filePath);

      return metadata;
    } catch (error) {
      console.warn(`Failed to update metadata with file info: ${error.message}`);
      return metadata;
    }
  }

  /**
   * Batch operation file organization
   */
  async organizeBatchOperation(
    operation: OperationType,
    items: Array<{
      parameters: Record<string, any>;
      model: string;
      duration: number;
      cost?: number;
      tokens?: number;
      error?: string;
    }>,
    namingConfig: FileNamingConfig = {}
  ): Promise<{
    filePaths: string[];
    metadataPaths: string[];
    metadatas: OperationMetadata[];
  }> {
    const filePaths: string[] = [];
    const metadataPaths: string[] = [];
    const metadatas: OperationMetadata[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const batchConfig = {
        ...namingConfig,
        suffix: namingConfig.suffix ? `${namingConfig.suffix}_batch_${i + 1}` : `batch_${i + 1}`,
      };

      // Generate file path (actual file saving would happen elsewhere)
      const filePath = await this.generateUniqueFilename(operation, batchConfig);

      // Create metadata
      const metadata = this.createMetadata(
        operation,
        item.model,
        item.parameters,
        filePath,
        item.duration,
        item.cost,
        item.tokens,
        item.error
      );

      // Save metadata
      const metadataPath = await this.saveMetadata(metadata);

      filePaths.push(filePath);
      metadataPaths.push(metadataPath);
      metadatas.push(metadata);
    }

    return { filePaths, metadataPaths, metadatas };
  }

  /**
   * Cleanup temporary files
   */
  async cleanupTempFiles(): Promise<{ deleted: number; errors: string[] }> {
    if (!this.config.enableCleanup) return { deleted: 0, errors: [] };

    const tempDir = join(this.baseDir, 'temp');
    let deleted = 0;
    const errors: string[] = [];

    try {
      const exists = await access(tempDir, constants.F_OK)
        .then(() => true)
        .catch(() => false);

      if (!exists) return { deleted: 0, errors: [] };

      const files = await readdir(tempDir, { withFileTypes: true });
      const maxAge = this.config.maxTempAge * 60 * 60 * 1000; // Convert hours to milliseconds
      const now = Date.now();

      for (const file of files) {
        if (file.isFile()) {
          const filePath = join(tempDir, file.name);
          try {
            const stats = await stat(filePath);
            if (now - stats.mtime.getTime() > maxAge) {
              await rm(filePath);
              deleted++;
            }
          } catch (error) {
            errors.push(`Failed to cleanup ${filePath}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      errors.push(`Failed to cleanup temp directory: ${error.message}`);
    }

    return { deleted, errors };
  }

  /**
   * Archive old files
   */
  async archiveOldFiles(): Promise<{ archived: number; errors: string[] }> {
    if (!this.config.enableArchiving) return { archived: 0, errors: [] };

    const archiveDir = join(this.baseDir, 'archive');
    await this.ensureDirectory(archiveDir);

    let archived = 0;
    const errors: string[] = [];

    try {
      const dateDirs = await readdir(this.baseDir, { withFileTypes: true });
      const maxAge = this.config.maxArchiveAge * 24 * 60 * 60 * 1000; // Convert days to milliseconds
      const now = Date.now();

      for (const dir of dateDirs) {
        if (dir.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(dir.name)) {
          const dirPath = join(this.baseDir, dir.name);
          try {
            const stats = await stat(dirPath);
            if (now - stats.mtime.getTime() > maxAge) {
              const archivePath = join(archiveDir, `${dir.name}.tar.gz`);
              // Note: Actual archiving would require tar command or archiver library
              // For now, we'll just move the directory
              await rename(dirPath, join(archiveDir, dir.name));
              archived++;
            }
          } catch (error) {
            errors.push(`Failed to archive ${dirPath}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      errors.push(`Failed to archive old files: ${error.message}`);
    }

    return { archived, errors };
  }

  /**
   * Monitor disk space
   */
  async checkDiskSpace(): Promise<{ usage: number; available: number; threshold: number }> {
    // Note: This is a simplified implementation. In production, you'd use system calls
    // or a library like 'diskusage' to get actual disk space information
    try {
      // For now, return mock data
      return {
        usage: 75, // percentage
        available: 1000000000, // bytes
        threshold: this.config.diskThreshold,
      };
    } catch (error) {
      console.warn(`Failed to check disk space: ${error.message}`);
      return { usage: 0, available: 0, threshold: this.config.diskThreshold };
    }
  }

  /**
   * Get MCP resource information
   */
  getMCPResourceInfo(operationId?: string): {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
  }[] {
    const resources: Array<{
      uri: string;
      name: string;
      description: string;
      mimeType: string;
    }> = [];

    // Add metadata resources
    if (operationId) {
      resources.push({
        uri: `cloudflare://metadata/${operationId}`,
        name: `Operation Metadata: ${operationId}`,
        description: 'Metadata for Cloudflare image operation',
        mimeType: 'application/json',
      });
    } else {
      // Add general resources
      resources.push({
        uri: 'cloudflare://files/recent',
        name: 'Recent Files',
        description: 'Recently generated/processed files',
        mimeType: 'application/json',
      });

      resources.push({
        uri: 'cloudflare://metrics/performance',
        name: 'Performance Metrics',
        description: 'Performance metrics for operations',
        mimeType: 'application/json',
      });
    }

    return resources;
  }

  /**
   * Get file path for MCP response
   */
  formatFilePathForMCP(filePath: string, metadata?: OperationMetadata): string {
    const relativePath = filePath.replace(this.baseDir, '').replace(/^[\/\\]/, '');
    const mcpUri = `file://${filePath}`;

    let response = `File saved: ${mcpUri}`;

    if (metadata) {
      response += `\nOperation: ${metadata.operation}`;
      response += `\nModel: ${metadata.model}`;
      response += `\nDuration: ${metadata.duration}ms`;
      response += `\nSize: ${metadata.fileSize} bytes`;
      response += `\nFormat: ${metadata.format}`;
      if (metadata.dimensions) {
        response += `\nDimensions: ${metadata.dimensions.width}x${metadata.dimensions.height}`;
      }
      response += `\nMetadata: cloudflare://metadata/${metadata.id}`;
    }

    return response;
  }
}

// Utility functions
export function createFileOrganizer(config?: FileOrganizationConfig): CloudflareFileOrganizer {
  return new CloudflareFileOrganizer(config);
}

export function getDefaultNamingConfig(operation: OperationType): FileNamingConfig {
  return {
    includeTimestamp: true,
    includeParams: false,
    maxLength: 80,
    prefix: operation.substring(0, 3).toUpperCase(),
  };
}

// Export default instance
export const fileOrganizer = new CloudflareFileOrganizer();

// Scheduled maintenance (would be called by a cron job or scheduler)
export async function performMaintenance(): Promise<{
  cleanup: { deleted: number; errors: string[] };
  archive: { archived: number; errors: string[] };
  disk: { usage: number; available: number; threshold: number };
}> {
  const cleanup = await fileOrganizer.cleanupTempFiles();
  const archive = await fileOrganizer.archiveOldFiles();
  const disk = await fileOrganizer.checkDiskSpace();

  return { cleanup, archive, disk };
}</content>
<parameter name="filePath">/workspaces/LOFERSIL-Landing-Page/.opencode/tool/cloudflare/file-organization.ts