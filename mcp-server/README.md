# Enhanced MCP Server for GitHub Issues Reviewer

## 🚀 Overview

This is an enhanced Model Context Protocol (MCP) server specifically designed for GitHub Issues Reviewer functionality. It provides AI-powered tools for code analysis, issue classification, and automated review processes.

## 📊 Features

### **Core MCP Capabilities**

- **MCP 2024-11-05 Specification** compliant
- **WebSocket-based communication** on `/mcp` endpoint
- **JSON-RPC 2.0 protocol** for standardized messaging
- **Tool registration system** for extensible functionality
- **Error handling and validation** for robust operation

### **Available Tools**

#### 🔍 **analyze_code**

Comprehensive code analysis including:

- **Security vulnerability detection** (eval(), innerHTML, document.write, etc.)
- **Code quality assessment** (console.log, debugger, TODO comments, etc.)
- **Performance analysis** (inefficient loops, DOM queries, etc.)
- **Metrics calculation** (complexity, maintainability, coverage estimates)

**Input:**

```json
{
  "code": "string - The code to analyze",
  "language": "string - Programming language (javascript, typescript, python, etc.)",
  "analysis_type": "string - security|quality|performance|comprehensive"
}
```

**Output:**

```json
{
  "content": [{"type": "text", "text": "Analysis summary"}],
  "analysis": {
    "issues": [...],
    "metrics": {
      "complexity_score": 0.7,
      "security_score": 0.8,
      "quality_score": 0.6,
      "performance_score": 0.9
    },
    "recommendations": [...]
  }
}
```

#### 🏷️ **classify_issue**

Automated GitHub issue classification:

- **Category detection** (bug, feature, documentation, question, security, performance, maintenance)
- **Complexity assessment** (low, medium, high, critical)
- **Feasibility analysis** (automated vs. human intervention required)
- **Confidence scoring** (0-100% accuracy estimate)
- **Requirements extraction** (automated requirement generation)
- **Acceptance criteria** (automated test criteria)

**Input:**

```json
{
  "title": "string - Issue title",
  "body": "string - Issue description",
  "labels": ["array", "of", "labels"],
  "assignee": "string - Optional assignee"
}
```

**Output:**

```json
{
  "content": [{"type": "text", "text": "Classification summary"}],
  "classification": {
    "category": "bug|feature|documentation|question|security|performance|maintenance",
    "complexity": "low|medium|high|critical",
    "feasibility": boolean,
    "confidence": 0.8,
    "requirements": ["string", "array"],
    "acceptance_criteria": ["string", "array"],
    "estimated_effort": {
      "hours": 8,
      "complexity_level": "medium"
    },
    "reasoning": "Classification rationale"
  }
}
```

## 🛠️ Installation & Setup

### **Prerequisites**

- Node.js 18+
- TypeScript 4.5+ (for development)
- WebSocket compatible client

### **Quick Start**

1. **Install dependencies:**

```bash
cd mcp-server
npm install
```

2. **Start the server:**

```bash
# Development mode
npm run dev

# Production mode
npm start

# Custom port
MCP_SERVER_PORT=3002 npm start
```

3. **Connect with MCP client:**

```javascript
import { MCPClient } from "your-mcp-client";

const client = new MCPClient({
  serverUrl: "ws://localhost:3001/mcp",
  clientInfo: {
    name: "Your Client",
    version: "1.0.0",
  },
});

await client.connect();
await client.initialize();
```

## 🧪 Testing

### **Run Test Suite**

```bash
npm test
```

### **Manual Testing**

```bash
# Start server
npm start

# In another terminal, test connection
node test-client.js
```

## 📡 API Reference

### **Connection Endpoints**

- **WebSocket:** `ws://localhost:3001/mcp`
- **Health Check:** Built-in ping/pong support

### **Protocol Methods**

- `initialize` - Initialize MCP protocol
- `tools/list` - List available tools
- `tools/call` - Execute specific tool
- `ping` - Health check

### **Error Codes**

- `-32700` - Parse error
- `-32601` - Method not found
- `-32602` - Tool not found
- `-32603` - Internal error

## 🔧 Configuration

### **Environment Variables**

```bash
MCP_SERVER_PORT=3001          # Server port (default: 3001)
NODE_ENV=development          # Environment mode
DEBUG=true                   # Enable debug logging
```

### **Server Configuration**

```typescript
const config = {
  port: 3001,
  path: "/mcp",
  serverInfo: {
    name: "GitHub Issues Reviewer MCP Server",
    version: "1.0.0",
  },
  capabilities: {
    tools: {},
    resources: {},
    prompts: {
      experimental: {
        code_review: true,
        issue_analysis: true,
        solution_generation: true,
      },
    },
  },
};
```

## 🚀 Production Deployment

### **Docker Deployment**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### **Process Manager (PM2)**

```bash
pm2 start ecosystem.config.js
```

### **Monitoring**

- Built-in metrics collection
- Performance monitoring
- Error tracking and logging
- Health check endpoints

## 🔒 Security Features

### **Input Validation**

- JSON schema validation for all tool inputs
- Type safety with TypeScript
- Sanitization of user inputs

### **Rate Limiting**

- Configurable request rate limits
- Connection attempt throttling
- Automatic backoff on errors

### **Secure Defaults**

- WSS required in production
- Certificate validation enabled
- Private IP blocking

## 📊 Performance & Monitoring

### **Built-in Metrics**

- Request/response times
- Tool execution statistics
- Error rates and types
- Connection health monitoring

### **Health Checks**

- Automatic health monitoring
- Performance metrics collection
- Diagnostic capabilities
- Status reporting

## 🛠️ Development

### **Project Structure**

```
mcp-server/
├── enhanced-server.ts      # Main server implementation
├── simple-server.ts        # Basic server for testing
├── tools/
│   ├── code-analyzer.ts    # Code analysis logic
│   ├── issue-classifier.ts # Issue classification logic
│   ├── solution-generator.ts # Solution generation logic
│   └── test-generator.ts   # Test generation logic
├── types/
│   └── index.ts          # TypeScript type definitions
├── utils/
│   └── helpers.ts        # Utility functions
├── package.json
└── README.md
```

### **Adding New Tools**

1. Create tool class in `tools/` directory
2. Implement tool logic with proper typing
3. Register tool in server's `setupHandlers()` method
4. Add input schema validation
5. Update documentation

### **Code Style**

- TypeScript strict mode enabled
- Comprehensive JSDoc comments
- Error handling with proper types
- Unit tests for all functionality

## 🤝 Contributing

1. **Fork** the repository
2. **Create feature branch**
3. **Implement** with tests
4. **Ensure all tests pass**
5. **Submit pull request**

### **Development Guidelines**

- Follow existing code patterns
- Add comprehensive tests
- Update documentation
- Ensure TypeScript compliance

## 📝 License

MIT License - see LICENSE file for details

## 🔗 Related Projects

- [MCP Specification](https://modelcontextprotocol.io/)
- [GitHub Issues Reviewer Client](../src/scripts/modules/mcp/)
- [OpenCode AI Integration](../.opencode/)

## 🆘 Support

For issues and questions:

1. Check existing documentation
2. Review test files for usage examples
3. Create issue with detailed information
4. Include error logs and configuration

---

**Note:** This server follows MCP 2024-11-05 specification and is designed to work with compliant MCP clients for GitHub Issues Reviewer automation.
