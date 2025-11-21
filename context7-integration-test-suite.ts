/**
 * Consolidated Context7 Integration Test Suite
 *
 * Combines functionality from:
 * - test-context7-connection.ts (basic connection testing)
 * - fetch-opencode-docs.ts (documentation fetching)
 * - mcp-config.json (configuration)
 * - MCP-Context7-Integration-Test-Results.md (test results documentation)
 *
 * Supports multiple test modes and eliminates code duplication.
 */

import { MCPFactory, MCP } from './.opencode/tool/mcp/index';
import type { MCPClientConfig } from './.opencode/tool/mcp/types.js';

type TestMode = 'basic-connection' | 'demo' | 'docs-fetch';

interface TestConfig {
  mode: TestMode;
  libraryName?: string;
  topic?: string;
  tokens?: number;
}

class Context7TestSuite {
  private mcp: any = null;

  async run(config: TestConfig): Promise<void> {
    try {
      await this.connect();
      await this.executeTest(config);
    } catch (error) {
      console.error('❌ Test failed:', error);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }

  private async connect(): Promise<void> {
    console.log('Creating Context7 MCP client...');
    this.mcp = await MCPFactory.createContext7();

    console.log('Connecting to Context7...');
    await this.mcp.connect();
    console.log('✅ Successfully connected to Context7 MCP server');
  }

  private async disconnect(): Promise<void> {
    if (this.mcp) {
      await this.mcp.disconnect();
      console.log('Disconnected from Context7');
    }
  }

  private async executeTest(config: TestConfig): Promise<void> {
    switch (config.mode) {
      case 'basic-connection':
        await this.testBasicConnection();
        break;
      case 'demo':
        await this.runDemo();
        break;
      case 'docs-fetch':
        await this.fetchDocumentation(config);
        break;
      default:
        throw new Error(`Unknown test mode: ${config.mode}`);
    }
  }

  private async testBasicConnection(): Promise<void> {
    console.log('Testing tools/list...');
    const toolsResult = await this.mcp.getClient().sendRequest('tools/list', {});
    console.log('Available tools:', toolsResult.tools?.length || 0);

    console.log('Testing resources/list...');
    const resourcesResult = await this.mcp.getClient().sendRequest('resources/list', {});
    console.log('Available resources:', resourcesResult.resources?.length || 0);

    console.log('✅ Basic connection test passed!');
  }

  private async runDemo(): Promise<void> {
    console.log('Running Context7 MCP demo...');

    // Test tools/list
    const toolsResult = await this.mcp.getClient().sendRequest('tools/list', {});
    console.log(`📋 Found ${toolsResult.tools?.length || 0} available tools`);

    // Test resources/list
    const resourcesResult = await this.mcp.getClient().sendRequest('resources/list', {});
    console.log(`📚 Found ${resourcesResult.resources?.length || 0} available resources`);

    // Demo tool execution (if tools available)
    if (toolsResult.tools && toolsResult.tools.length > 0) {
      const firstTool = toolsResult.tools[0];
      console.log(
        `🔧 Demo: Tool "${firstTool.name}" - ${firstTool.description || 'No description'}`
      );
    }

    console.log('✅ Demo completed successfully!');
  }

  private async fetchDocumentation(config: TestConfig): Promise<void> {
    const libraryName = config.libraryName || 'OpenCode';
    const topic = config.topic || 'agent prompting configuration';
    const tokens = config.tokens || 2000;

    console.log(`Resolving ${libraryName} library ID...`);
    const resolveResult = await this.mcp.getClient().sendRequest('tools/call', {
      name: 'resolve-library-id',
      arguments: { libraryName },
    });

    console.log('Resolve result:', JSON.stringify(resolveResult, null, 2));

    let libraryId = null;
    if (resolveResult && resolveResult.content) {
      for (const content of resolveResult.content) {
        if (content.type === 'text') {
          const idMatch = content.text.match(/\/[^\/\s]+\/[^\/\s]+/);
          if (idMatch) {
            libraryId = idMatch[0];
            break;
          }
        }
      }
    }

    if (!libraryId) {
      console.log(`Could not find ${libraryName} library ID`);
      return;
    }

    console.log(`Found ${libraryName} library ID: ${libraryId}`);

    console.log(`Fetching ${libraryName} documentation for topic: "${topic}"...`);
    const docsResult = await this.mcp.getClient().sendRequest('tools/call', {
      name: 'get-library-docs',
      arguments: {
        context7CompatibleLibraryID: libraryId,
        topic,
        tokens,
      },
    });

    console.log(`${libraryName} docs result:`, JSON.stringify(docsResult, null, 2));
    console.log('✅ Documentation fetch completed!');
  }
}

// CLI interface
function parseArgs(): TestConfig {
  const args = process.argv.slice(2);
  const mode = args[0] as TestMode;

  if (!mode || !['basic-connection', 'demo', 'docs-fetch'].includes(mode)) {
    console.error('Usage: node context7-integration-test-suite.ts <mode> [options]');
    console.error('Modes:');
    console.error('  basic-connection    Test basic MCP connection and list tools/resources');
    console.error('  demo               Run demonstration of MCP capabilities');
    console.error('  docs-fetch          Fetch documentation from Context7');
    console.error('');
    console.error('Options for docs-fetch:');
    console.error('  --library <name>    Library name (default: OpenCode)');
    console.error(
      '  --topic <topic>     Documentation topic (default: agent prompting configuration)'
    );
    console.error('  --tokens <num>      Max tokens (default: 2000)');
    process.exit(1);
  }

  const config: TestConfig = { mode };

  if (mode === 'docs-fetch') {
    for (let i = 1; i < args.length; i += 2) {
      const flag = args[i];
      const value = args[i + 1];
      switch (flag) {
        case '--library':
          config.libraryName = value;
          break;
        case '--topic':
          config.topic = value;
          break;
        case '--tokens':
          config.tokens = parseInt(value, 10);
          break;
      }
    }
  }

  return config;
}

// Main execution
const config = parseArgs();
const testSuite = new Context7TestSuite();
testSuite.run(config);
