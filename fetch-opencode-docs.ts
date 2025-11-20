/**
 * Fetch OpenCode documentation from Context7
 */

import { MCPFactory } from './.opencode/tool/mcp/index.js';

async function fetchOpenCodeDocs() {
  let mcp: any = null;

  try {
    console.log('Creating Context7 MCP client...');
    mcp = await MCPFactory.createContext7();

    console.log('Connecting to Context7...');
    await mcp.connect();

    console.log('Resolving OpenCode library ID...');
    const resolveResult = await mcp.getClient().sendRequest('tools/call', {
      name: 'resolve-library-id',
      arguments: {
        libraryName: 'OpenCode',
      },
    });

    console.log('Resolve result:', JSON.stringify(resolveResult, null, 2));

    // Extract the library ID from the response
    let libraryId = null;
    if (resolveResult && resolveResult.content) {
      for (const content of resolveResult.content) {
        if (content.type === 'text') {
          // Look for library ID in the text
          const idMatch = content.text.match(/\/[^\/\s]+\/[^\/\s]+/);
          if (idMatch) {
            libraryId = idMatch[0];
            break;
          }
        }
      }
    }

    if (!libraryId) {
      console.log('Could not find OpenCode library ID');
      return;
    }

    console.log(`Found OpenCode library ID: ${libraryId}`);

    console.log('Fetching OpenCode agent configuration docs...');
    const docsResult = await mcp.getClient().sendRequest('tools/call', {
      name: 'get-library-docs',
      arguments: {
        context7CompatibleLibraryID: libraryId,
        topic: 'agent prompting configuration',
        tokens: 2000,
      },
    });

    console.log('OpenCode docs result:', JSON.stringify(docsResult, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (mcp) {
      await mcp.disconnect();
    }
  }
}

fetchOpenCodeDocs();
