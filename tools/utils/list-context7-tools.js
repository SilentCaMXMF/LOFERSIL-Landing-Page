/**
 * Script to discover available tools from Context7 MCP server
 */

import { MCPFactory } from './.opencode/tool/mcp/index.js';

async function listContext7Tools() {
  let mcp = null;

  try {
    console.log('🔗 Connecting to Context7 MCP server...');

    // Create MCP client for Context7
    mcp = await MCPFactory.createContext7();

    // Connect to the server
    await mcp.connect();
    console.log('✅ Connected to Context7 MCP server');

    // Get available tools
    console.log('📋 Fetching available tools...');
    const toolsResult = await mcp.getClient().sendRequest('tools/list', {});

    console.log('🎯 Available Tools from Context7:');
    console.log('=====================================');

    if (toolsResult.tools && toolsResult.tools.length > 0) {
      toolsResult.tools.forEach((tool, index) => {
        console.log(`${index + 1}. ${tool.name}`);
        if (tool.description) {
          console.log(`   Description: ${tool.description}`);
        }
        if (tool.inputSchema && tool.inputSchema.properties) {
          const params = Object.keys(tool.inputSchema.properties).join(', ');
          console.log(`   Parameters: ${params}`);
        }
        console.log('');
      });

      console.log(`📊 Total tools available: ${toolsResult.tools.length}`);
    } else {
      console.log('No tools found or tools list is empty');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (mcp) {
      await mcp.disconnect();
      console.log('🔌 Disconnected from Context7 MCP server');
    }
  }
}

// Run the script
listContext7Tools();
