# MCP Tool Definitions

## Core MCP Tools

### System Tools

#### `list_tools`

Lists all available tools on the MCP server.

**Parameters:**

- None required

**Returns:**

```json
{
  "tools": [
    {
      "name": "string",
      "description": "string",
      "inputSchema": {
        "type": "object",
        "properties": {...},
        "required": ["string"]
      }
    }
  ]
}
```

#### `list_resources`

Lists all available resources on the MCP server.

**Parameters:**

- None required

**Returns:**

```json
{
  "resources": [
    {
      "uri": "string",
      "name": "string",
      "description": "string",
      "mimeType": "string"
    }
  ]
}
```

#### `read_resource`

Reads the content of a specific resource.

**Parameters:**

```json
{
  "uri": {
    "type": "string",
    "description": "The URI of the resource to read"
  }
}
```

**Returns:**

```json
{
  "contents": [
    {
      "uri": "string",
      "mimeType": "string",
      "text": "string"
    }
  ]
}
```

## File System Tools

### File Operations

#### `read_file`

Reads the contents of a file.

**Parameters:**

```json
{
  "path": {
    "type": "string",
    "description": "Path to the file to read"
  },
  "encoding": {
    "type": "string",
    "enum": ["utf8", "ascii", "base64"],
    "default": "utf8",
    "description": "File encoding"
  },
  "start_line": {
    "type": "number",
    "description": "Starting line number (1-based)"
  },
  "end_line": {
    "type": "number",
    "description": "Ending line number (inclusive)"
  }
}
```

**Returns:**

```json
{
  "content": "string",
  "encoding": "string",
  "lines_read": "number"
}
```

#### `write_file`

Writes content to a file.

**Parameters:**

```json
{
  "path": {
    "type": "string",
    "description": "Path to the file to write"
  },
  "content": {
    "type": "string",
    "description": "Content to write to the file"
  },
  "encoding": {
    "type": "string",
    "enum": ["utf8", "ascii", "base64"],
    "default": "utf8",
    "description": "File encoding"
  },
  "create_dirs": {
    "type": "boolean",
    "default": false,
    "description": "Create parent directories if they don't exist"
  },
  "append": {
    "type": "boolean",
    "default": false,
    "description": "Append to file instead of overwriting"
  }
}
```

**Returns:**

```json
{
  "bytes_written": "number",
  "path": "string"
}
```

#### `list_dir`

Lists contents of a directory.

**Parameters:**

```json
{
  "path": {
    "type": "string",
    "description": "Path to the directory to list"
  },
  "recursive": {
    "type": "boolean",
    "default": false,
    "description": "List contents recursively"
  },
  "include_hidden": {
    "type": "boolean",
    "default": false,
    "description": "Include hidden files/directories"
  },
  "pattern": {
    "type": "string",
    "description": "Glob pattern to filter results"
  }
}
```

**Returns:**

```json
{
  "entries": [
    {
      "name": "string",
      "type": "file|directory|symlink",
      "size": "number",
      "modified": "string",
      "permissions": "string"
    }
  ],
  "path": "string"
}
```

#### `create_dir`

Creates a directory.

**Parameters:**

```json
{
  "path": {
    "type": "string",
    "description": "Path of the directory to create"
  },
  "recursive": {
    "type": "boolean",
    "default": false,
    "description": "Create parent directories if they don't exist"
  },
  "mode": {
    "type": "number",
    "default": 493,
    "description": "Directory permissions (octal)"
  }
}
```

**Returns:**

```json
{
  "path": "string",
  "created": "boolean"
}
```

#### `delete_path`

Deletes a file or directory.

**Parameters:**

```json
{
  "path": {
    "type": "string",
    "description": "Path to delete"
  },
  "recursive": {
    "type": "boolean",
    "default": false,
    "description": "Delete directories recursively"
  },
  "force": {
    "type": "boolean",
    "default": false,
    "description": "Force deletion without confirmation"
  }
}
```

**Returns:**

```json
{
  "path": "string",
  "deleted": "boolean",
  "type": "file|directory"
}
```

#### `move_path`

Moves or renames a file or directory.

**Parameters:**

```json
{
  "source": {
    "type": "string",
    "description": "Source path"
  },
  "destination": {
    "type": "string",
    "description": "Destination path"
  },
  "overwrite": {
    "type": "boolean",
    "default": false,
    "description": "Overwrite destination if it exists"
  }
}
```

**Returns:**

```json
{
  "source": "string",
  "destination": "string",
  "moved": "boolean"
}
```

#### `copy_path`

Copies a file or directory.

**Parameters:**

```json
{
  "source": {
    "type": "string",
    "description": "Source path"
  },
  "destination": {
    "type": "string",
    "description": "Destination path"
  },
  "recursive": {
    "type": "boolean",
    "default": true,
    "description": "Copy directories recursively"
  },
  "overwrite": {
    "type": "boolean",
    "default": false,
    "description": "Overwrite destination if it exists"
  }
}
```

**Returns:**

```json
{
  "source": "string",
  "destination": "string",
  "copied": "boolean",
  "bytes_copied": "number"
}
```

## Search and Analysis Tools

### Text Search

#### `grep_search`

Searches for text patterns in files.

**Parameters:**

```json
{
  "pattern": {
    "type": "string",
    "description": "Regular expression pattern to search for"
  },
  "path": {
    "type": "string",
    "description": "Root path to search in"
  },
  "include": {
    "type": "string",
    "description": "File pattern to include (glob)"
  },
  "exclude": {
    "type": "string",
    "description": "File pattern to exclude (glob)"
  },
  "case_sensitive": {
    "type": "boolean",
    "default": false,
    "description": "Case sensitive search"
  },
  "max_results": {
    "type": "number",
    "default": 100,
    "description": "Maximum number of results to return"
  }
}
```

**Returns:**

```json
{
  "matches": [
    {
      "file": "string",
      "line": "number",
      "column": "number",
      "match": "string",
      "context": "string"
    }
  ],
  "total_matches": "number",
  "searched_files": "number"
}
```

#### `find_files`

Finds files matching patterns.

**Parameters:**

```json
{
  "pattern": {
    "type": "string",
    "description": "Glob pattern to match files"
  },
  "path": {
    "type": "string",
    "default": ".",
    "description": "Root path to search in"
  },
  "type": {
    "type": "string",
    "enum": ["file", "directory", "any"],
    "default": "any",
    "description": "Type of entries to find"
  },
  "max_depth": {
    "type": "number",
    "description": "Maximum directory depth to search"
  },
  "exclude": {
    "type": "array",
    "items": { "type": "string" },
    "description": "Patterns to exclude"
  }
}
```

**Returns:**

```json
{
  "files": ["string"],
  "total_found": "number"
}
```

## Development Tools

### Code Analysis

#### `parse_code`

Parses and analyzes code files.

**Parameters:**

```json
{
  "path": {
    "type": "string",
    "description": "Path to the code file"
  },
  "language": {
    "type": "string",
    "description": "Programming language"
  },
  "analysis_type": {
    "type": "string",
    "enum": ["ast", "symbols", "dependencies", "complexity"],
    "default": "ast",
    "description": "Type of analysis to perform"
  }
}
```

**Returns:**

```json
{
  "language": "string",
  "analysis": "object",
  "symbols": ["object"],
  "dependencies": ["string"],
  "complexity": "object"
}
```

#### `run_tests`

Runs tests for a project.

**Parameters:**

```json
{
  "path": {
    "type": "string",
    "default": ".",
    "description": "Path to the project root"
  },
  "pattern": {
    "type": "string",
    "description": "Test file pattern"
  },
  "framework": {
    "type": "string",
    "description": "Test framework to use"
  },
  "verbose": {
    "type": "boolean",
    "default": false,
    "description": "Verbose output"
  },
  "coverage": {
    "type": "boolean",
    "default": false,
    "description": "Generate coverage report"
  }
}
```

**Returns:**

```json
{
  "passed": "number",
  "failed": "number",
  "skipped": "number",
  "duration": "number",
  "coverage": "object",
  "output": "string"
}
```

### Build Tools

#### `build_project`

Builds a project.

**Parameters:**

```json
{
  "path": {
    "type": "string",
    "default": ".",
    "description": "Path to the project root"
  },
  "target": {
    "type": "string",
    "description": "Build target or configuration"
  },
  "clean": {
    "type": "boolean",
    "default": false,
    "description": "Clean before building"
  },
  "verbose": {
    "type": "boolean",
    "default": false,
    "description": "Verbose output"
  }
}
```

**Returns:**

```json
{
  "success": "boolean",
  "duration": "number",
  "output": "string",
  "artifacts": ["string"]
}
```

## System Tools

### Process Management

#### `run_command`

Runs a system command.

**Parameters:**

```json
{
  "command": {
    "type": "string",
    "description": "Command to execute"
  },
  "cwd": {
    "type": "string",
    "description": "Working directory"
  },
  "env": {
    "type": "object",
    "description": "Environment variables"
  },
  "timeout": {
    "type": "number",
    "default": 30000,
    "description": "Command timeout in milliseconds"
  },
  "shell": {
    "type": "boolean",
    "default": false,
    "description": "Run command in shell"
  }
}
```

**Returns:**

```json
{
  "exit_code": "number",
  "stdout": "string",
  "stderr": "string",
  "duration": "number",
  "success": "boolean"
}
```

#### `get_system_info`

Gets system information.

**Parameters:**

- None required

**Returns:**

```json
{
  "platform": "string",
  "arch": "string",
  "cpu_count": "number",
  "total_memory": "number",
  "free_memory": "number",
  "uptime": "number",
  "load_average": ["number"],
  "hostname": "string"
}
```

## Network Tools

### HTTP Operations

#### `http_request`

Makes HTTP requests.

**Parameters:**

```json
{
  "method": {
    "type": "string",
    "enum": ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
    "default": "GET",
    "description": "HTTP method"
  },
  "url": {
    "type": "string",
    "description": "Request URL"
  },
  "headers": {
    "type": "object",
    "description": "HTTP headers"
  },
  "body": {
    "type": "string",
    "description": "Request body"
  },
  "timeout": {
    "type": "number",
    "default": 30000,
    "description": "Request timeout in milliseconds"
  },
  "follow_redirects": {
    "type": "boolean",
    "default": true,
    "description": "Follow HTTP redirects"
  }
}
```

**Returns:**

```json
{
  "status_code": "number",
  "headers": "object",
  "body": "string",
  "duration": "number",
  "url": "string"
}
```

## Database Tools

### SQL Operations

#### `execute_sql`

Executes SQL queries.

**Parameters:**

```json
{
  "connection_string": {
    "type": "string",
    "description": "Database connection string"
  },
  "query": {
    "type": "string",
    "description": "SQL query to execute"
  },
  "parameters": {
    "type": "array",
    "description": "Query parameters"
  },
  "timeout": {
    "type": "number",
    "default": 30000,
    "description": "Query timeout in milliseconds"
  }
}
```

**Returns:**

```json
{
  "rows_affected": "number",
  "rows": ["object"],
  "columns": ["string"],
  "duration": "number",
  "success": "boolean"
}
```

## Configuration Tools

### Configuration Management

#### `load_config`

Loads and parses MCP configuration from a file.

**Parameters:**

```json
{
  "path": {
    "type": "string",
    "description": "Path to the configuration file"
  },
  "format": {
    "type": "string",
    "enum": ["json", "yaml", "toml"],
    "default": "json",
    "description": "Configuration file format"
  },
  "validate": {
    "type": "boolean",
    "default": true,
    "description": "Validate configuration after loading"
  }
}
```

**Returns:**

```json
{
  "config": "object",
  "validation": {
    "valid": "boolean",
    "errors": ["string"]
  },
  "path": "string"
}
```

#### `validate_config`

Validates MCP configuration against schema.

**Parameters:**

```json
{
  "config": {
    "type": "object",
    "description": "Configuration object to validate"
  },
  "schema": {
    "type": "object",
    "description": "JSON schema for validation"
  },
  "strict": {
    "type": "boolean",
    "default": false,
    "description": "Strict validation mode"
  }
}
```

**Returns:**

```json
{
  "valid": "boolean",
  "errors": ["object"],
  "warnings": ["string"]
}
```

#### `merge_configs`

Merges multiple configuration objects with override rules.

**Parameters:**

```json
{
  "configs": {
    "type": "array",
    "items": { "type": "object" },
    "description": "Array of configuration objects to merge"
  },
  "strategy": {
    "type": "string",
    "enum": ["override", "merge", "deep-merge"],
    "default": "deep-merge",
    "description": "Merge strategy"
  }
}
```

**Returns:**

```json
{
  "merged": "object",
  "conflicts": ["string"],
  "sources": "object"
}
```

#### `resolve_env_vars`

Resolves environment variable substitutions in configuration.

**Parameters:**

```json
{
  "config": {
    "type": "object",
    "description": "Configuration object with variable references"
  },
  "env": {
    "type": "object",
    "description": "Environment variables to use for substitution"
  },
  "strict": {
    "type": "boolean",
    "default": true,
    "description": "Fail if required variables are missing"
  }
}
```

**Returns:**

```json
{
  "resolved": "object",
  "unresolved": ["string"],
  "used_vars": ["string"]
}
```

## Context7-Specific Tools

### Code Analysis Tools

#### `context7:analyze_codebase`

Performs comprehensive code analysis on a codebase.

**Parameters:**

```json
{
  "scope": {
    "type": "string",
    "enum": ["current-project", "workspace", "directory"],
    "default": "current-project",
    "description": "Analysis scope"
  },
  "include": {
    "type": "array",
    "items": { "type": "string" },
    "description": "File patterns to include"
  },
  "exclude": {
    "type": "array",
    "items": { "type": "string" },
    "description": "File patterns to exclude"
  },
  "analysis_types": {
    "type": "array",
    "items": {
      "type": "string",
      "enum": ["complexity", "dependencies", "patterns", "security", "performance"]
    },
    "default": ["complexity", "dependencies"],
    "description": "Types of analysis to perform"
  }
}
```

**Returns:**

```json
{
  "summary": "object",
  "files_analyzed": "number",
  "issues": ["object"],
  "metrics": "object",
  "recommendations": ["string"]
}
```

#### `context7:generate_insights`

Generates insights and recommendations from code analysis.

**Parameters:**

```json
{
  "analysis": {
    "type": "object",
    "description": "Code analysis results"
  },
  "focus": {
    "type": "string",
    "enum": ["performance", "security", "maintainability", "all"],
    "default": "all",
    "description": "Focus area for insights"
  },
  "format": {
    "type": "string",
    "enum": ["summary", "detailed", "actionable"],
    "default": "summary",
    "description": "Output format"
  }
}
```

**Returns:**

```json
{
  "insights": ["object"],
  "recommendations": ["object"],
  "priority_actions": ["string"],
  "estimated_effort": "object"
}
```

### Project Management Tools

#### `context7:create_workspace`

Creates a new Context7 workspace.

**Parameters:**

```json
{
  "name": {
    "type": "string",
    "description": "Workspace name"
  },
  "description": {
    "type": "string",
    "description": "Workspace description"
  },
  "template": {
    "type": "string",
    "description": "Workspace template to use"
  },
  "settings": {
    "type": "object",
    "description": "Workspace settings"
  }
}
```

**Returns:**

```json
{
  "workspace_id": "string",
  "url": "string",
  "status": "string"
}
```

#### `context7:invite_collaborators`

Invites collaborators to a Context7 workspace.

**Parameters:**

```json
{
  "workspace_id": {
    "type": "string",
    "description": "Workspace ID"
  },
  "invites": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "email": { "type": "string" },
        "role": { "type": "string", "enum": ["viewer", "editor", "admin"] },
        "message": { "type": "string" }
      }
    },
    "description": "List of collaborator invites"
  }
}
```

**Returns:**

```json
{
  "invites_sent": "number",
  "failed_invites": ["object"],
  "workspace_url": "string"
}
```

### Integration Tools

#### `context7:export_project`

Exports project data from Context7.

**Parameters:**

```json
{
  "workspace_id": {
    "type": "string",
    "description": "Workspace ID to export"
  },
  "format": {
    "type": "string",
    "enum": ["json", "csv", "xml"],
    "default": "json",
    "description": "Export format"
  },
  "include": {
    "type": "array",
    "items": { "type": "string" },
    "description": "Data types to include"
  },
  "date_range": {
    "type": "object",
    "properties": {
      "start": { "type": "string", "format": "date" },
      "end": { "type": "string", "format": "date" }
    },
    "description": "Date range for export"
  }
}
```

**Returns:**

```json
{
  "export_id": "string",
  "download_url": "string",
  "expires_at": "string",
  "size": "number"
}
```

## Custom Tools

Tools can be extended with custom implementations based on specific project needs. Custom tools should follow the same parameter schema and return format conventions as built-in tools.
