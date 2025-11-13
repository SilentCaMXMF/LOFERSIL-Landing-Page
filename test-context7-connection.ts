/**
 * Test script to verify Context7 MCP connection
 */

import { MCPFactory } from './.opencode/tool/mcp/index.js';

async function testContext7Connection() {
  try {
    console.log('Creating Context7 MCP client...');
    const mcp = await MCPFactory.createContext7();

    console.log('Connecting to Context7...');
    await mcp.connect();

    console.log('✅ Successfully connected to Context7 MCP server');

    // Test tools/list
    console.log('Testing tools/list...');
    const toolsResult = await mcp.getClient().sendRequest('tools/list', {});
    console.log('Available tools:', toolsResult.tools?.length || 0);

    // Test resources/list
    console.log('Testing resources/list...');
    const resourcesResult = await mcp.getClient().sendRequest('resources/list', {});
    console.log('Available resources:', resourcesResult.resources?.length || 0);

    console.log('✅ All tests passed!');

    await mcp.disconnect();
    console.log('Disconnected from Context7');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testContext7Connection();
