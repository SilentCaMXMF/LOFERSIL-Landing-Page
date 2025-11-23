/**
 * Script to test Gemini MCP server connection
 */

import { MCPFactory } from './.opencode/tool/mcp/index.js';

async function testGeminiConnection() {
  let mcp = null;

  try {
    console.log('🔗 Connecting to Gemini MCP server...');

    // Create MCP client for Gemini
    mcp = await MCPFactory.createGemini();

    // Connect to the server
    await mcp.connect();
    console.log('✅ Connected to Gemini MCP server');

    // Test basic functionality - get available tools
    console.log('📋 Testing tools/list...');
    const toolsResult = await mcp.getClient().sendRequest('tools/list', {});
    console.log('Available tools:', toolsResult.tools?.length || 0);

    // Test resources if available
    console.log('📚 Testing resources/list...');
    const resourcesResult = await mcp.getClient().sendRequest('resources/list', {});
    console.log('Available resources:', resourcesResult.resources?.length || 0);

    console.log('✅ Gemini MCP server connection test passed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (mcp) {
      await mcp.disconnect();
      console.log('🔌 Disconnected from Gemini MCP server');
    }
  }
}

// Run the script
testGeminiConnection();
