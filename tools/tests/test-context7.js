import { MCPFactory } from './.opencode/tool/mcp/index.js';

async function testContext7() {
  try {
    console.log('Testing Context7 MCP...');
    const mcp = await MCPFactory.createContext7();
    console.log('Context7 API key is set and valid');
  } catch (error) {
    console.error('Context7 test failed:', error.message);
  }
}

testContext7();
