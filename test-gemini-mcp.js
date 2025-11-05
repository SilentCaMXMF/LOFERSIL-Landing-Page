import { MCPFactory } from './.opencode/tool/mcp/index.js';

/**
 * Test script to verify Gemini MCP integration
 */
async function testGeminiMCP() {
  console.log('🧪 Testing Gemini MCP Integration...\n');

  try {
    console.log('🤖 Creating Gemini MCP instance...');
    const mcp = await MCPFactory.createGemini();
    console.log('✅ Gemini MCP instance created successfully!\n');

    // Test getting tools
    console.log('🔧 Testing tool discovery...');
    const tools = await mcp.getTools().listTools();
    console.log(`✅ Found ${tools.length} tools:`);
    tools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.name} - ${tool.description}`);
    });

    // Test getting resources
    console.log('\n📁 Testing resource discovery...');
    const resources = await mcp.getResources().listResources();
    console.log(`✅ Found ${resources.length} resources:`);
    resources.forEach((resource, index) => {
      console.log(`  ${index + 1}. ${resource.name} - ${resource.description}`);
    });

    console.log('\n🎉 Gemini MCP integration test completed successfully!');
  } catch (error) {
    console.error('❌ Gemini MCP test failed:');
    console.error('Error:', error.message);

    if (error.message.includes('GEMINI_API_KEY')) {
      console.log('\n💡 Make sure your .env file contains:');
      console.log('   GEMINI_API_KEY=your-gemini-api-key');
    }
  }
}

// Run the test
testGeminiMCP().catch(console.error);
