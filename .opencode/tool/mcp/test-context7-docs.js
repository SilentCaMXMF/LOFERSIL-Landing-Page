#!/usr/bin/env node
/**
 * MCP Context7 Integration Test - OpenCode Documentation Fetcher
 *
 * This test demonstrates end-to-end MCP integration with Context7 to fetch
 * OpenCode documentation on agent prompting and GitHub worktrees functionality.
 *
 * Usage: npm run test:context7-docs
 */
import { MCPFactory } from './index.js';
class OpenCodeDocumentationFetcher {
    mcp = null;
    queries = {
        opencodeAgent: [
            'OpenCode agent prompting configuration',
            'OpenCode AI agent setup and configuration',
            'How to configure OpenCode agents for prompting',
        ],
        githubWorktrees: [
            'GitHub worktrees functionality and usage',
            'Git worktrees for parallel development',
            'How to use GitHub worktrees effectively',
        ],
        issuesReviewer: [
            'GitHub issues reviewer agent implementation',
            'AI agent for GitHub issue review automation',
            'Creating automated GitHub issue reviewers',
        ],
    };
    async initialize() {
        console.log('🔧 Initializing MCP Context7 connection...');
        try {
            // Check environment variables
            const context7Url = process.env.CONTEXT7_MCP_URL;
            const context7Key = process.env.CONTEXT7_API_KEY;
            if (!context7Url || !context7Key) {
                throw new Error('Missing required environment variables: CONTEXT7_MCP_URL and CONTEXT7_API_KEY');
            }
            console.log(`📡 Connecting to Context7 at: ${context7Url}`);
            console.log(`🔑 Using API key: ${context7Key.substring(0, 8)}****`);
            // Create MCP instance using factory
            this.mcp = await MCPFactory.createContext7();
            // Connect to Context7
            await this.mcp.connect();
            console.log('✅ Successfully connected to Context7 MCP server');
            // Get client for direct access
            const client = this.mcp.getClient();
            console.log(`📊 Connection state: ${client.getConnectionState()}`);
            console.log(`🔌 Is connected: ${client.isConnected()}`);
        }
        catch (error) {
            console.error('❌ Failed to initialize MCP connection:', error);
            throw error;
        }
    }
    async discoverAvailableTools() {
        if (!this.mcp) {
            throw new Error('MCP not initialized');
        }
        console.log('🔍 Discovering available tools...');
        try {
            const client = this.mcp.getClient();
            const response = await client.sendRequest('tools/list', {});
            if (response && response.tools) {
                console.log(`📋 Found ${response.tools.length} available tools:`);
                response.tools.forEach((tool, index) => {
                    console.log(`  ${index + 1}. ${tool.name}: ${tool.description}`);
                });
                return response.tools;
            }
            else {
                console.log('⚠️ No tools found or unexpected response format');
                return [];
            }
        }
        catch (error) {
            console.error('❌ Failed to discover tools:', error);
            throw error;
        }
    }
    async discoverAvailableResources() {
        if (!this.mcp) {
            throw new Error('MCP not initialized');
        }
        console.log('📚 Discovering available resources...');
        try {
            const client = this.mcp.getClient();
            const response = await client.sendRequest('resources/list', {});
            if (response && response.resources) {
                console.log(`📁 Found ${response.resources.length} available resources:`);
                response.resources.forEach((resource, index) => {
                    console.log(`  ${index + 1}. ${resource.uri}: ${resource.description || 'No description'}`);
                });
                return response.resources;
            }
            else {
                console.log('⚠️ No resources found or unexpected response format');
                return [];
            }
        }
        catch (error) {
            console.error('❌ Failed to discover resources:', error);
            throw error;
        }
    }
    async searchDocumentation(query) {
        if (!this.mcp) {
            throw new Error('MCP not initialized');
        }
        console.log(`🔎 Searching for: "${query}"`);
        try {
            const client = this.mcp.getClient();
            // Try to use a search tool if available
            const response = await client.sendRequest('tools/call', {
                name: 'search_documents',
                arguments: {
                    query: query,
                    limit: 10,
                    includeContent: true,
                },
            });
            return response;
        }
        catch (error) {
            console.error(`❌ Search failed for "${query}":`, error);
            // Try alternative search methods
            try {
                const client = this.mcp.getClient();
                const response = await client.sendRequest('tools/call', {
                    name: 'search',
                    arguments: {
                        q: query,
                        maxResults: 5,
                    },
                });
                return response;
            }
            catch (fallbackError) {
                console.error(`❌ Fallback search also failed:`, fallbackError);
                throw error;
            }
        }
    }
    async fetchDocumentationByTopic(topicName, queries) {
        console.log(`\n📖 Fetching documentation for topic: ${topicName}`);
        console.log('='.repeat(60));
        const results = [];
        for (const query of queries) {
            try {
                const searchResult = await this.searchDocumentation(query);
                results.push({
                    topic: topicName,
                    query: query,
                    results: searchResult,
                    success: true,
                });
                console.log(`✅ Successfully fetched: "${query}"`);
                // Display a preview of results
                if (searchResult && searchResult.content) {
                    searchResult.content.forEach((content, index) => {
                        if (content.type === 'text') {
                            const preview = content.text.substring(0, 200);
                            console.log(`   Preview ${index + 1}: ${preview}${content.text.length > 200 ? '...' : ''}`);
                        }
                    });
                }
            }
            catch (error) {
                console.log(`❌ Failed to fetch: "${query}" - ${error}`);
                results.push({
                    topic: topicName,
                    query: query,
                    results: null,
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
            // Add delay between requests to be respectful to the API
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return results;
    }
    async runCompleteDocumentationTest() {
        console.log('🚀 Starting OpenCode Documentation Fetch Test');
        console.log('='.repeat(80));
        try {
            // Initialize connection
            await this.initialize();
            // Discover available capabilities
            const tools = await this.discoverAvailableTools();
            const resources = await this.discoverAvailableResources();
            // Fetch documentation for each topic
            const allResults = [];
            // 1. OpenCode Agent Documentation
            const opencodeResults = await this.fetchDocumentationByTopic('OpenCode Agent Configuration', this.queries.opencodeAgent);
            allResults.push(...opencodeResults);
            // 2. GitHub Worktrees Documentation
            const worktreesResults = await this.fetchDocumentationByTopic('GitHub Worktrees', this.queries.githubWorktrees);
            allResults.push(...worktreesResults);
            // 3. GitHub Issues Reviewer Documentation
            const reviewerResults = await this.fetchDocumentationByTopic('GitHub Issues Reviewer Agent', this.queries.issuesReviewer);
            allResults.push(...reviewerResults);
            // Generate summary report
            this.generateSummaryReport(allResults, tools, resources);
        }
        catch (error) {
            console.error('💥 Test failed:', error);
            throw error;
        }
        finally {
            // Cleanup
            if (this.mcp) {
                await this.mcp.disconnect();
                console.log('🔌 Disconnected from Context7 MCP server');
            }
        }
    }
    generateSummaryReport(results, tools, resources) {
        console.log('\n📊 TEST SUMMARY REPORT');
        console.log('='.repeat(80));
        // Connection summary
        console.log(`🔌 MCP Connection: ✅ Established`);
        console.log(`🛠️ Available Tools: ${tools.length}`);
        console.log(`📁 Available Resources: ${resources.length}`);
        // Results summary
        const totalQueries = results.length;
        const successfulQueries = results.filter(r => r.success).length;
        const failedQueries = totalQueries - successfulQueries;
        console.log(`\n📈 Documentation Queries:`);
        console.log(`   Total queries: ${totalQueries}`);
        console.log(`   Successful: ${successfulQueries} ✅`);
        console.log(`   Failed: ${failedQueries} ❌`);
        console.log(`   Success rate: ${((successfulQueries / totalQueries) * 100).toFixed(1)}%`);
        // Topic breakdown
        const topicBreakdown = results.reduce((acc, result) => {
            if (!acc[result.topic]) {
                acc[result.topic] = { total: 0, successful: 0 };
            }
            acc[result.topic].total++;
            if (result.success) {
                acc[result.topic].successful++;
            }
            return acc;
        }, {});
        console.log(`\n📋 Results by Topic:`);
        Object.entries(topicBreakdown).forEach(([topic, stats]) => {
            const successRate = ((stats.successful / stats.total) * 100).toFixed(1);
            console.log(`   ${topic}: ${stats.successful}/${stats.total} (${successRate}%)`);
        });
        // Failed queries details
        const failedResults = results.filter(r => !r.success);
        if (failedResults.length > 0) {
            console.log(`\n❌ Failed Queries:`);
            failedResults.forEach(result => {
                console.log(`   "${result.query}" - ${result.error}`);
            });
        }
        // Sample successful results
        const successfulResults = results.filter(r => r.success && r.results?.content);
        if (successfulResults.length > 0) {
            console.log(`\n📄 Sample Documentation Content:`);
            successfulResults.slice(0, 2).forEach((result, index) => {
                console.log(`\n   ${index + 1}. ${result.query}`);
                if (result.results.content && result.results.content.length > 0) {
                    const textContent = result.results.content.find((c) => c.type === 'text');
                    if (textContent) {
                        const preview = textContent.text.substring(0, 300);
                        console.log(`      ${preview}${textContent.text.length > 300 ? '...' : ''}`);
                    }
                }
            });
        }
        // Overall assessment
        console.log(`\n🎯 Overall Assessment:`);
        if (successfulQueries === totalQueries) {
            console.log(`   ✅ Perfect! All documentation queries succeeded.`);
            console.log(`   🚀 MCP Context7 integration is fully functional.`);
        }
        else if (successfulQueries > totalQueries * 0.7) {
            console.log(`   ✅ Good! Most documentation queries succeeded.`);
            console.log(`   🔧 MCP Context7 integration is mostly functional.`);
        }
        else {
            console.log(`   ⚠️ Limited success rate. Check configuration and API access.`);
            console.log(`   🔍 May need to investigate tool availability or permissions.`);
        }
        console.log('\n' + '='.repeat(80));
        console.log('🏁 OpenCode Documentation Fetch Test Complete');
    }
}
// Main execution
async function main() {
    const fetcher = new OpenCodeDocumentationFetcher();
    try {
        await fetcher.runCompleteDocumentationTest();
        process.exit(0);
    }
    catch (error) {
        console.error('💥 Test execution failed:', error);
        process.exit(1);
    }
}
// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
export { OpenCodeDocumentationFetcher };
