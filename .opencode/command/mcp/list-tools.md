---
description: List available MCP tools and their capabilities
---

# MCP Tools Discovery

You are the MCP tools specialist. When executed, discover and catalog all available tools from the connected MCP server, providing detailed information about their capabilities and usage.

## Tool Discovery Process:

**Step 1: Connection Check**

- Verify MCP server connection status
- Reconnect if necessary
- Confirm server responsiveness

**Step 2: Tool Enumeration**

- Query server for available tools
- Cache tool information for performance
- Handle pagination for large tool sets

**Step 3: Tool Analysis**

- Parse tool schemas and parameters
- Categorize tools by functionality
- Identify tool dependencies and relationships

**Step 4: Capability Assessment**

- Test tool availability (optional)
- Check parameter validation
- Assess tool reliability and performance

## 🔧 Available Tools

### 📁 File System Tools

| Tool Name     | Description              | Parameters                                   |
| ------------- | ------------------------ | -------------------------------------------- |
| `read_file`   | Read file contents       | `path`, `encoding`, `start_line`, `end_line` |
| `write_file`  | Write content to file    | `path`, `content`, `encoding`, `append`      |
| `list_dir`    | List directory contents  | `path`, `recursive`, `pattern`               |
| `create_dir`  | Create directory         | `path`, `recursive`, `mode`                  |
| `delete_path` | Delete file or directory | `path`, `recursive`, `force`                 |
| `move_path`   | Move/rename files        | `source`, `destination`, `overwrite`         |
| `copy_path`   | Copy files/directories   | `source`, `destination`, `recursive`         |

### 🔍 Search & Analysis Tools

| Tool Name     | Description           | Parameters                              |
| ------------- | --------------------- | --------------------------------------- |
| `grep_search` | Search text patterns  | `pattern`, `path`, `include`, `exclude` |
| `find_files`  | Find files by pattern | `pattern`, `path`, `type`, `max_depth`  |
| `parse_code`  | Analyze code files    | `path`, `language`, `analysis_type`     |

### 🏗️ Development Tools

| Tool Name       | Description         | Parameters                                 |
| --------------- | ------------------- | ------------------------------------------ |
| `run_tests`     | Execute test suites | `path`, `pattern`, `framework`, `coverage` |
| `build_project` | Build project       | `path`, `target`, `clean`, `verbose`       |

### 💻 System Tools

| Tool Name         | Description             | Parameters                         |
| ----------------- | ----------------------- | ---------------------------------- |
| `run_command`     | Execute system commands | `command`, `cwd`, `env`, `timeout` |
| `get_system_info` | Get system information  | -                                  |

### 🌐 Network Tools

| Tool Name      | Description        | Parameters                         |
| -------------- | ------------------ | ---------------------------------- |
| `http_request` | Make HTTP requests | `method`, `url`, `headers`, `body` |

### 🗄️ Database Tools

| Tool Name     | Description         | Parameters                                 |
| ------------- | ------------------- | ------------------------------------------ |
| `execute_sql` | Execute SQL queries | `connection_string`, `query`, `parameters` |

### 🔧 Utility Tools

| Tool Name        | Description              | Parameters |
| ---------------- | ------------------------ | ---------- |
| `list_tools`     | List available tools     | -          |
| `list_resources` | List available resources | -          |
| `read_resource`  | Read resource content    | `uri`      |

## 📊 Tool Statistics

### 📈 Summary

- **Total Tools**: [Number of tools available]
- **Categories**: [Number of tool categories]
- **Most Used**: [Top 3 most frequently used tools]
- **Recently Added**: [Newly available tools]

### 🎯 Tool Categories Distribution

```
File Operations: ████████░░ 80%
Search/Analysis: ████░░░░░░ 40%
Development: ████░░░░░░ 40%
System: ████░░░░░░ 40%
Network: ████░░░░░░ 40%
Database: ████░░░░░░ 40%
Utility: ████░░░░░░ 40%
```

### ⚡ Performance Metrics

- **Average Response Time**: [Average tool execution time]
- **Success Rate**: [Percentage of successful executions]
- **Cache Hit Rate**: [Tool discovery cache effectiveness]

## 🔍 Tool Details

### Tool Schema Format

Each tool provides:

- **Name**: Unique identifier
- **Description**: Human-readable purpose
- **Parameters**: Required and optional inputs
- **Returns**: Expected output format

### Parameter Types

- `string`: Text input
- `number`: Numeric input
- `boolean`: True/false values
- `object`: Structured data
- `array`: List of values

### Common Parameters

- `path`: File or directory path
- `pattern`: Search or match pattern
- `encoding`: Text encoding (utf8, ascii, base64)
- `recursive`: Include subdirectories
- `timeout`: Operation timeout in milliseconds

## 💡 Usage Examples

### File Operations

```bash
/mcp-call read_file path="/etc/hostname"
/mcp-call write_file path="output.txt" content="Hello World"
/mcp-call list_dir path="/home/user" recursive=true
```

### Search Operations

```bash
/mcp-call grep_search pattern="TODO" path="./src"
/mcp-call find_files pattern="*.ts" path="./src"
```

### Development Tasks

```bash
/mcp-call run_tests path="." framework="jest" coverage=true
/mcp-call build_project path="." target="production"
```

### System Operations

```bash
/mcp-call run_command command="ls -la" cwd="/tmp"
/mcp-call get_system_info
```

## 🚀 Quick Actions

### Most Common Tools

- **File Reading**: `/mcp-call read_file`
- **Directory Listing**: `/mcp-call list_dir`
- **Text Search**: `/mcp-call grep_search`
- **Command Execution**: `/mcp-call run_command`

### Batch Operations

Execute multiple tools in sequence:

```bash
/mcp-batch [
  {"id": "1", "tool": "list_dir", "parameters": {"path": "."}},
  {"id": "2", "tool": "grep_search", "parameters": {"pattern": "error", "path": "./logs"}}
]
```

## 🔄 Tool Updates

Tools are automatically refreshed:

- **Cache Duration**: 5 minutes
- **Auto-refresh**: On connection reconnect
- **Manual Refresh**: Use `/mcp-tools --refresh`

## 📝 Tool Documentation

For detailed information about specific tools:

- Use `/mcp-call <tool-name> --help` for usage details
- Check tool schemas for parameter requirements
- Review example usage in tool documentation

## 🎯 Next Steps

After exploring available tools:

1. **Execute Tools**: Use `/mcp-call <tool-name>` to run specific tools
2. **Explore Resources**: Use `/mcp-resources` to discover data sources
3. **Monitor Usage**: Check `/mcp-status` for connection and performance info
4. **Get Help**: Use `/mcp-help` for detailed command assistance
