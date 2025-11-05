import { readFileSync } from 'fs';
import type { MCPConfig, MCPConfigFile, ValidationResult, MCPClientConfig } from './types.js';

/**
 * Loads and parses the MCP configuration file.
 * @param filePath - The path to the configuration file.
 * @returns The parsed MCP configuration.
 * @throws Error if the file cannot be read or parsed.
 */
function loadConfig(filePath: string): MCPConfigFile {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load config from ${filePath}: ${(error as Error).message}`);
  }
}

/**
 * Substitutes environment variables in the configuration.
 * @param config - The MCP configuration.
 * @returns The configuration with substituted variables.
 * @throws Error if an environment variable is not set.
 */
function substituteEnvVars(config: MCPConfigFile): MCPConfigFile {
  // Validate environment variable names to prevent injection
  const validateEnvVarName = (varName: string): boolean => {
    // Allow only valid environment variable names: start with letter/underscore, followed by letters/digits/underscores
    return /^[A-Z_][A-Z0-9_]*$/.test(varName);
  };

  const substitute = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/\$\{([^}]+)\}/g, (_, varName) => {
        if (!validateEnvVarName(varName)) {
          throw new Error(`Invalid environment variable name: ${varName}`);
        }
        const value = process.env[varName];
        if (value === undefined) {
          throw new Error(
            `Environment variable ${varName} is not set. ` +
              `Please set this variable in your environment or .env file. ` +
              `For example: export ${varName}="your-value-here"`
          );
        }
        return value;
      });
    } else if (Array.isArray(obj)) {
      return obj.map(substitute);
    } else if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        result[key] = substitute(obj[key]);
      }
      return result;
    }
    return obj;
  };
  return substitute(config);
}

/**
 * Validates the MCP configuration.
 * @param config - The MCP configuration.
 * @returns The validation result.
 */
function validateConfig(config: MCPConfigFile): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!config.mcp || typeof config.mcp !== 'object') {
    errors.push('Missing or invalid "mcp" section');
    return { valid: false, errors, warnings };
  }
  for (const [serverName, serverConfig] of Object.entries(config.mcp)) {
    if (!serverConfig.name || typeof serverConfig.name !== 'string') {
      errors.push(`Server "${serverName}": missing or invalid "name"`);
    }
    if (!serverConfig.type || (serverConfig.type !== 'remote' && serverConfig.type !== 'local')) {
      errors.push(
        `Server "${serverName}": missing or invalid "type" (must be 'remote' or 'local')`
      );
    }
    if (!serverConfig.url || typeof serverConfig.url !== 'string') {
      errors.push(`Server "${serverName}": missing or invalid "url"`);
    }
    if (typeof serverConfig.enabled !== 'boolean') {
      errors.push(`Server "${serverName}": missing or invalid "enabled"`);
    }
    if (!serverConfig.headers || typeof serverConfig.headers !== 'object') {
      errors.push(`Server "${serverName}": missing or invalid "headers"`);
    }
    if (typeof serverConfig.timeout !== 'number') {
      errors.push(`Server "${serverName}": invalid "timeout"`);
    }
    if (!serverConfig.retry || typeof serverConfig.retry !== 'object') {
      errors.push(`Server "${serverName}": missing or invalid "retry"`);
    } else {
      if (typeof serverConfig.retry.maxAttempts !== 'number') {
        errors.push(`Server "${serverName}": invalid "retry.maxAttempts"`);
      }
      if (typeof serverConfig.retry.interval !== 'number') {
        errors.push(`Server "${serverName}": invalid "retry.interval"`);
      }
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Resolves the configuration for a specific MCP server.
 * @param serverName - The name of the server.
 * @param config - The MCP configuration.
 * @returns The server configuration.
 * @throws Error if the server is not found or disabled.
 */
function resolveServerConfig(serverName: string, config: MCPConfigFile): MCPConfig {
  const serverConfig = config.mcp[serverName];
  if (!serverConfig) {
    throw new Error(`Server "${serverName}" not found in configuration`);
  }
  if (!serverConfig.enabled) {
    throw new Error(`Server "${serverName}" is disabled`);
  }
  return serverConfig;
}

export { loadConfig, validateConfig, substituteEnvVars, resolveServerConfig };
