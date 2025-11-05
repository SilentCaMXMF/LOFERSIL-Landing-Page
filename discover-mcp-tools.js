import { MCPFactory } from './.opencode/tool/mcp/index.js';

/**
 * Test script to discover and display available MCP tools
 */
async function discoverMCPTools() {
  console.log('🔍 Discovering MCP Tools...\n');

  try {
    // Try to create Context7 MCP instance
    console.log('📡 Connecting to Context7 MCP server...');
    const mcp = await MCPFactory.createContext7();

    console.log('✅ Connected successfully!\n');

    // Connect to the server
    await mcp.connect();
    console.log('🔗 Connection established\n');

    // Get tools
    const tools = await mcp.getTools().listTools();
    console.log(`🛠️  Available Tools (${tools.length}):\n`);

    if (tools.length === 0) {
      console.log('❌ No tools available from this MCP server');
      return;
    }

    tools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name}`);
      console.log(`   📝 ${tool.description}`);

      if (tool.inputSchema?.properties) {
        console.log('   📥 Parameters:');
        Object.entries(tool.inputSchema.properties).forEach(([param, schema]) => {
          const required = tool.inputSchema?.required?.includes(param) ? ' (required)' : '';
          console.log(`      - ${param}: ${schema.type}${required}`);
        });
      }
      console.log('');
    });

    // Get resources if available
    try {
      const resources = await mcp.getResources().listResources();
      console.log(`📁 Available Resources (${resources.length}):\n`);

      resources.forEach((resource, index) => {
        console.log(`${index + 1}. ${resource.name}`);
        console.log(`   📄 ${resource.description || 'No description'}`);
        console.log(`   🔗 URI: ${resource.uri}`);
        console.log('');
      });
    } catch (error) {
      console.log('📁 Could not retrieve resources:', error.message);
    }

    // Cleanup
    await mcp.disconnect();
    console.log('🔌 Disconnected from MCP server');

  } catch (error) {
    console.error('❌ Failed to connect to MCP server:');
    console.error('Error:', error.message);

    if (error.message.includes('CONTEXT7_API_KEY') || error.message.includes('CONTEXT7_MCP_URL')) {
      console.log('\n💡 Make sure your .env file contains:');
      console.log('   CONTEXT7_API_KEY=your-api-key');
      console.log('   CONTEXT7_MCP_URL=https://mcp.context7.com/mcp');
    }
  }
}

// Run the discovery
discoverMCPTools().catch(console.error);</content>
<parameter name="filePath">/workspaces/LOFERSIL-Landing-Page/discover-mcp-tools.js