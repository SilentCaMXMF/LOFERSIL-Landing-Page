#!/usr/bin/env node

/**
 * Test MCP Connection to our running server
 */

import { execSync } from "child_process";
import fs from "fs";

async function testMCPConnection() {
  console.log("🔍 Testing MCP Server Connection...\n");

  // Test WebSocket connection
  console.log("🌐 Testing WebSocket connection to ws://localhost:3001...");
  try {
    const wsTestCode = `
      const WebSocket = require('ws');
      
      console.log('🔌 Connecting to ws://localhost:3001...');
      const ws = new WebSocket('ws://localhost:3001');
      
      let connected = false;
      
      ws.on('open', () => {
        console.log('✅ WebSocket connection established');
        connected = true;
        
        // Try to send MCP initialize message
        const initMessage = {
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: {
              name: "LOFERSIL Test Client",
              version: "1.0.0"
            }
          }
        };
        
        console.log('📤 Sending initialize message...');
        ws.send(JSON.stringify(initMessage));
      });
      
      ws.on('message', (data) => {
        try {
          const response = JSON.parse(data.toString());
          console.log('📥 Received response:', JSON.stringify(response, null, 2));
          
          if (response.result) {
            console.log('✅ MCP protocol initialized successfully');
            
            // Try to list tools
            const toolsMessage = {
              jsonrpc: "2.0",
              id: 2,
              method: "tools/list",
              params: {}
            };
            
            console.log('🛠️  Requesting tools list...');
            ws.send(JSON.stringify(toolsMessage));
          }
        } catch (e) {
          console.log('❌ Failed to parse response:', e.message);
        }
      });
      
      ws.on('error', (error) => {
        console.log('❌ WebSocket error:', error.message);
        if (!connected) {
          console.log('💡 This might mean:');
          console.log('   - MCP server is not running');
          console.log('   - Server expects different protocol');
          console.log('   - Authentication required');
        }
      });
      
      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
        setTimeout(() => process.exit(0), 100);
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (!connected) {
          console.log('⏰ Connection timeout');
          console.log('💡 Server might not be responding or requires different configuration');
        }
        process.exit(1);
      }, 10000);
    `;

    fs.writeFileSync("/tmp/ws-mcp-test.js", wsTestCode);

    // Install ws if not available and run test
    try {
      execSync("npm list ws", { stdio: "ignore" });
    } catch {
      console.log("📦 Installing ws package for WebSocket test...");
      execSync("npm install ws", { stdio: "inherit" });
    }

    execSync("node /tmp/ws-mcp-test.js", {
      stdio: "inherit",
      cwd: "/workspaces/LOFERSIL-Landing-Page",
      timeout: 15000,
    });
  } catch (error) {
    console.log("❌ WebSocket test failed:", error.message);
  }
}

// Run test
testMCPConnection().catch(console.error);
