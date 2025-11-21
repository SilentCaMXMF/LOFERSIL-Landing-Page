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
import { MCPFactory } from './index.js';
class Context7TestSuite {
    mcp = null;
    async run(config) {
        try {
            await this.connect();
            await this.executeTest(config);
        }
        catch (error) {
            console.error('❌ Test failed:', error);
            process.exit(1);
        }
        finally {
            await this.disconnect();
        }
    }
    async connect() {
        console.log('Creating Context7 MCP client...');
        this.mcp = await MCPFactory.createContext7();
        console.log('Connecting to Context7...');
        await this.mcp.connect();
        console.log('✅ Successfully connected to Context7 MCP server');
    }
    async disconnect() {
        if (this.mcp) {
            await this.mcp.disconnect();
            console.log('Disconnected from Context7');
        }
    }
    async executeTest(config) {
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
    async testBasicConnection() {
        console.log('Testing tools/list...');
        const toolsResult = await this.mcp.getClient().sendRequest('tools/list', {});
        console.log('Available tools:', toolsResult.tools?.length || 0);
        console.log('Testing resources/list...');
        const resourcesResult = await this.mcp.getClient().sendRequest('resources/list', {});
        console.log('Available resources:', resourcesResult.resources?.length || 0);
        console.log('✅ Basic connection test passed!');
    }
    async runDemo() {
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
            console.log(`🔧 Demo: Tool "${firstTool.name}" - ${firstTool.description || 'No description'}`);
        }
        console.log('✅ Demo completed successfully!');
    }
    async fetchDocumentation(config) {
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
                    // Look for lines containing "Context7-compatible library ID:"
                    const lines = content.text.split('\n');
                    for (const line of lines) {
                        if (line.includes('Context7-compatible library ID:')) {
                            const idMatch = line.match(/Context7-compatible library ID:\s*(\/[^\/\s]+\/[^\/\s]+)/);
                            if (idMatch) {
                                libraryId = idMatch[1];
                                break;
                            }
                        }
                    }
                    if (libraryId)
                        break;
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
function parseArgs() {
    const args = process.argv.slice(2);
    const mode = args[0];
    if (!mode || !['basic-connection', 'demo', 'docs-fetch'].includes(mode)) {
        console.error('Usage: node context7-integration-test-suite.ts <mode> [options]');
        console.error('Modes:');
        console.error('  basic-connection    Test basic MCP connection and list tools/resources');
        console.error('  demo               Run demonstration of MCP capabilities');
        console.error('  docs-fetch          Fetch documentation from Context7');
        console.error('');
        console.error('Options for docs-fetch:');
        console.error('  --library <name>    Library name (default: OpenCode)');
        console.error('  --topic <topic>     Documentation topic (default: agent prompting configuration)');
        console.error('  --tokens <num>      Max tokens (default: 2000)');
        process.exit(1);
    }
    const config = { mode };
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
