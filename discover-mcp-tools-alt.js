#!/usr/bin/env node

/**
 * MCP Tool Discovery Script
 *
 * Connects to MCP server and discovers available tools
 */

// Import using TypeScript compilation
const { execSync } = require("child_process");
const path = require("path");

async function discoverMCPTools() {
  console.log("🔍 Discovering MCP Tools...\n");

  try {
    // Compile and run TypeScript
    console.log("🔨 Compiling TypeScript...");

    // Use ts-node to run TypeScript directly
    const tsNodeScript = `
import { MCPClient } from './src/scripts/modules/mcp/client';
import { ErrorManager } from './src/scripts/modules/ErrorManager';

async function main() {
  try {
    console.log('📡 Connecting to MCP server...');
    console.log('   Server: ws://localhost:3000');
    console.log('   Client: LOFERSIL OpenAgent v1.0.0');
    
    // Initialize error handler
    const errorHandler = new ErrorManager();
    
    // Create MCP client
    const client = new MCPClient({
      serverUrl: 'ws://localhost:3000',
      apiKey: 'ctx7sk-a1d42d0e-9a2a-4c54-9e41-0e85e1b7de44',
      clientInfo: { 
        name: 'LOFERSIL OpenAgent', 
        version: '1.0.0' 
      },
      connectionTimeout: 10000,
      reconnection: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 5000,
        backoffMultiplier: 2,
      }
    }, errorHandler);
    
    // Connect to server
    await client.connect();
    console.log('✅ Connected to MCP server successfully!');
    
    // Initialize protocol
    console.log('🔧 Initializing MCP protocol...');
    const capabilities = await client.initialize();
    console.log('✅ Protocol initialized');
    console.log('   Protocol Version:', capabilities.protocolVersion || '2024-11-05');
    
    // Discover tools
    console.log('🛠️  Discovering available tools...');
    const tools = await client.listTools();
    
    if (tools.length === 0) {
      console.log('❌ No tools found on server');
    } else {
      console.log(\`✅ Found \${tools.length} tools:\`);
      
      tools.forEach((tool, index) => {
        console.log(\`\${index + 1}. 📦 \${tool.name}\`);
        console.log(\`   Description: \${tool.description || 'No description'}\`);
        
        if (tool.inputSchema) {
          console.log('   Input Schema:');
          console.log('   ' + JSON.stringify(tool.inputSchema, null, 2));
        }
        
        console.log('');
      });
    }
    
    // Discover resources
    console.log('📁 Discovering available resources...');
    try {
      const resources = await client.listResources();
      
      if (resources.length === 0) {
        console.log('❌ No resources found on server');
      } else {
        console.log(\`✅ Found \${resources.length} resources:\`);
        
        resources.forEach((resource, index) => {
          console.log(\`\${index + 1}. 📄 \${resource.name || resource.uri}\`);
          console.log(\`   URI: \${resource.uri}\`);
          console.log(\`   MIME Type: \${resource.mimeType || 'unknown'}\`);
          console.log('');
        });
      }
    } catch (error) {
      console.log(\`⚠️  Could not list resources: \${error.message}\`);
    }
    
    // Discover prompts
    console.log('💬 Discovering available prompts...');
    try {
      const prompts = await client.listPrompts();
      
      if (prompts.length === 0) {
        console.log('❌ No prompts found on server');
      } else {
        console.log(\`✅ Found \${prompts.length} prompts:\`);
        
        prompts.forEach((prompt, index) => {
          console.log(\`\${index + 1}. 🗣️  \${prompt.name}\`);
          console.log(\`   Description: \${prompt.description || 'No description'}\`);
          
          if (prompt.arguments && prompt.arguments.length > 0) {
            console.log('   Arguments:');
            prompt.arguments.forEach(arg => {
              console.log(\`     - \${arg.name}: \${arg.description || 'No description'} (\${arg.required ? 'required' : 'optional'})\`);
            });
          }
          console.log('');
        });
      }
    } catch (error) {
      console.log(\`⚠️  Could not list prompts: \${error.message}\`);
    }
    
    // Get client status
    console.log('📊 Client Status:');
    const status = client.getStatus();
    console.log('   State:', status.state);
    console.log('   Connected At:', status.connectedAt);
    console.log('   Connection Attempts:', status.connectionAttempts);
    console.log('   Active Requests:', status.activeRequests);
    
    // Get metrics
    console.log('\\n📈 Performance Metrics:');
    const metrics = client.getMetrics();
    console.log('   Total Requests:', metrics.totalRequests);
    console.log('   Successful Requests:', metrics.successfulRequests);
    console.log('   Failed Requests:', metrics.failedRequests);
    console.log('   Average Response Time:', metrics.averageResponseTime.toFixed(2) + 'ms');
    
    // Disconnect
    console.log('\\n🔌 Disconnecting from MCP server...');
    await client.disconnect();
    console.log('✅ Disconnected successfully');
    
  } catch (error) {
    console.error('❌ Error connecting to MCP server:');
    console.error('   Message:', error.message);
    
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
    
    console.log('\\n🔧 Troubleshooting:');
    console.log('1. Check if MCP server is running on ws://localhost:3000');
    console.log('2. Verify API key is valid');
    console.log('3. Check network connectivity');
    console.log('4. Ensure firewall allows WebSocket connections');
    
    process.exit(1);
  }
}

main();
`;

    // Write TypeScript file
    require("fs").writeFileSync("/tmp/mcp-discovery.ts", tsNodeScript);

    // Run with ts-node
    console.log("🚀 Running discovery script...");
    execSync(
      "cd /workspaces/LOFERSIL-Landing-Page && npx ts-node /tmp/mcp-discovery.ts",
      {
        stdio: "inherit",
        cwd: "/workspaces/LOFERSIL-Landing-Page",
      },
    );
  } catch (error) {
    console.error("❌ Discovery failed:", error.message);

    // Try alternative approach - check if server is running
    console.log("\n🔍 Checking MCP server status...");
    try {
      const { execSync } = require("child_process");

      // Check if port 3000 is listening
      const portCheck = execSync(
        'netstat -tlnp 2>/dev/null | grep :3000 || echo "Port not listening"',
        { encoding: "utf8" },
      );
      console.log("Port 3000 status:", portCheck.trim());

      // Try WebSocket connection test
      console.log("\n🌐 Testing WebSocket connection...");
      const wsTest = `
        const WebSocket = require('ws');
        const ws = new WebSocket('ws://localhost:3000');
        
        ws.on('open', () => {
          console.log('✅ WebSocket connection successful');
          ws.close();
        });
        
        ws.on('error', (error) => {
          console.log('❌ WebSocket connection failed:', error.message);
        });
        
        ws.on('close', () => {
          setTimeout(() => process.exit(0), 100);
        });
        
        setTimeout(() => {
          console.log('⏰ Connection timeout');
          process.exit(1);
        }, 5000);
      `;

      require("fs").writeFileSync("/tmp/ws-test.js", wsTest);
      execSync("node /tmp/ws-test.js", {
        stdio: "inherit",
        cwd: "/workspaces/LOFERSIL-Landing-Page",
      });
    } catch (testError) {
      console.log("❌ Server test failed:", testError.message);
    }
  }
}

// Run discovery
discoverMCPTools().catch(console.error);
