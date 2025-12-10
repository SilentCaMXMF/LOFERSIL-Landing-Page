#!/usr/bin/env node

/**
 * Simple MCP Server for Testing
 * 
 * A basic MCP server implementation that provides common tools
 * for testing MCP client implementation.
 */

import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const WS_PORT = 3001; // Use different port for WebSocket

// Simple MCP Server implementation
class MCPServer {
  constructor() {
    this.tools = [
      {
        name: 'echo',
        description: 'Echo back the provided message',
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Message to echo back' }
          },
          required: ['message']
        }
      },
      {
        name: 'list_files',
        description: 'List files in a directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path to list' },
            recursive: { type: 'boolean', description: 'List recursively', default: false }
          },
          required: ['path']
        }
      },
      {
        name: 'read_file',
        description: 'Read file contents',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path to read' },
            encoding: { type: 'string', description: 'File encoding', default: 'utf8' }
          },
          required: ['path']
        }
      },
      {
        name: 'write_file',
        description: 'Write content to a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path to write' },
            content: { type: 'string', description: 'Content to write' },
            encoding: { type: 'string', description: 'File encoding', default: 'utf8' }
          },
          required: ['path', 'content']
        }
      },
      {
        name: 'execute_command',
        description: 'Execute a shell command',
        inputSchema: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'Command to execute' },
            args: { type: 'array', description: 'Command arguments', items: { type: 'string' } },
            cwd: { type: 'string', description: 'Working directory' }
          },
          required: ['command']
        }
      },
      {
        name: 'get_system_info',
        description: 'Get system information',
        inputSchema: {
          type: 'object',
          properties: {
            include: { type: 'array', description: 'Information to include', items: { type: 'string' } }
          }
        }
      },
      {
        name: 'http_request',
        description: 'Make an HTTP request',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'URL to request' },
            method: { type: 'string', description: 'HTTP method', default: 'GET' },
            headers: { type: 'object', description: 'Request headers' },
            body: { type: 'string', description: 'Request body' }
          },
          required: ['url']
        }
      },
      {
        name: 'search_files',
        description: 'Search for files matching a pattern',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: { type: 'string', description: 'Search pattern (glob)' },
            directory: { type: 'string', description: 'Directory to search in' },
            max_results: { type: 'number', description: 'Maximum results', default: 100 }
          },
          required: ['pattern']
        }
      }
    ];

    this.resources = [
      {
        uri: 'file://workspace/info',
        name: 'Workspace Information',
        mimeType: 'text/plain',
        description: 'General information about workspace'
      },
      {
        uri: 'file://workspace/config',
        name: 'Configuration',
        mimeType: 'application/json',
        description: 'Current MCP server configuration'
      }
    ];

    this.prompts = [
      {
        name: 'code_review',
        description: 'Generate a code review prompt',
        arguments: [
          {
            name: 'code',
            description: 'Code to review',
            required: true
          },
          {
            name: 'language',
            description: 'Programming language',
            required: false
          }
        ]
      },
      {
        name: 'debug_help',
        description: 'Generate debugging assistance prompt',
        arguments: [
          {
            name: 'error',
            description: 'Error message or description',
            required: true
          },
          {
            name: 'context',
            description: 'Additional context',
            required: false
          }
        ]
      }
    ];

    this.requestId = 1;
    this.pendingRequests = new Map();
  }

  handleRequest(message, ws) {
    try {
      const data = JSON.parse(message);
      console.log('📥 Received:', data);

      const response = {
        jsonrpc: '2.0',
        id: data.id,
        timestamp: new Date().toISOString()
      };

      switch (data.method) {
        case 'initialize':
          response.result = {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
              prompts: {}
            },
            serverInfo: {
              name: 'LOFERSIL Test MCP Server',
              version: '1.0.0'
            }
          };
          break;

        case 'tools/list':
          response.result = { tools: this.tools };
          break;

        case 'tools/call':
          response.result = this.handleToolCall(data.params);
          break;

        case 'resources/list':
          response.result = { resources: this.resources };
          break;

        case 'resources/read':
          response.result = this.handleResourceRead(data.params);
          break;

        case 'prompts/list':
          response.result = { prompts: this.prompts };
          break;

        case 'prompts/get':
          response.result = this.handlePromptGet(data.params);
          break;

        default:
          response.error = {
            code: -32601,
            message: `Method not found: ${data.method}`
          };
      }

      console.log('📤 Sending:', response);
      ws.send(JSON.stringify(response));

    } catch (error) {
      console.error('❌ Error handling request:', error);
      const errorResponse = {
        jsonrpc: '2.0',
        id: data.id || null,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error.message
        }
      };
      ws.send(JSON.stringify(errorResponse));
    }
  }

  handleToolCall(params) {
    const { name, arguments: args } = params;
    
    console.log(`🔨 Executing tool: ${name}`, args);

    switch (name) {
      case 'echo':
        return {
          content: [
            {
              type: 'text',
              text: `Echo: ${args.message}`
            }
          ],
          isError: false
        };

      case 'list_files':
        try {
          const files = fs.readdirSync(args.path || '.');
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  directory: args.path || '.',
                  files: files,
                  count: files.length
                }, null, 2)
              }
            ],
            isError: false
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error listing files: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'read_file':
        try {
          const content = fs.readFileSync(args.path, args.encoding || 'utf8');
          
          return {
            content: [
              {
                type: 'text',
                text: content
              }
            ],
            isError: false
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error reading file: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'write_file':
        try {
          fs.writeFileSync(args.path, args.content, args.encoding || 'utf8');
          
          return {
            content: [
              {
                type: 'text',
                text: `Successfully wrote ${args.content.length} characters to ${args.path}`
              }
            ],
            isError: false
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error writing file: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'execute_command':
        try {
          const command = args.args ? [args.command, ...args.args].join(' ') : args.command;
          const result = execSync(command, { 
            cwd: args.cwd, 
            encoding: 'utf8',
            timeout: 10000 
          });
          
          return {
            content: [
              {
                type: 'text',
                text: `Command executed successfully:\n\n${result}`
              }
            ],
            isError: false
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Command execution failed: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'get_system_info':
        const os = await import('os');
        const info = {
          platform: os.platform(),
          arch: os.arch(),
          nodeVersion: process.version,
          memory: os.totalmem(),
          cpus: os.cpus().length,
          uptime: os.uptime(),
          loadavg: os.loadavg()
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(info, null, 2)
            }
          ],
          isError: false
        };

      case 'http_request':
        try {
          const https = await import('https');
          const http = await import('http');
          const urlModule = await import('url');
          const parsedUrl = new urlModule.URL(args.url);
          const client = parsedUrl.protocol === 'https:' ? https : http;
          
          return new Promise((resolve) => {
            const req = client.request(args.url, {
              method: args.method || 'GET',
              headers: args.headers || {}
            }, (res) => {
              let data = '';
              res.on('data', chunk => data += chunk);
              res.on('end', () => {
                resolve({
                  content: [
                    {
                      type: 'text',
                      text: JSON.stringify({
                        status: res.statusCode,
                        headers: res.headers,
                        body: data
                      }, null, 2)
                    }
                  ],
                  isError: false
                });
              });
            });
            
            req.on('error', (error) => {
              resolve({
                content: [
                  {
                    type: 'text',
                    text: `HTTP request failed: ${error.message}`
                  }
                ],
                isError: true
              });
            });
            
            if (args.body) {
              req.write(args.body);
            }
            req.end();
          });
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `HTTP request error: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'search_files':
        try {
          // Simple glob implementation
          const pattern = args.pattern;
          const directory = args.directory || '.';
          const maxResults = args.max_results || 100;
          
          const files = fs.readdirSync(directory).filter(file => {
            // Simple pattern matching (could be enhanced)
            return file.includes(pattern.replace('*', '')) || pattern === '*';
          });
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  pattern,
                  directory,
                  files: files.slice(0, maxResults),
                  count: files.length
                }, null, 2)
              }
            ],
            isError: false
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `File search error: ${error.message}`
              }
            ],
            isError: true
          };
        }

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`
            }
          ],
          isError: true
        };
    }
  }

  handleResourceRead(params) {
    const { uri } = params;
    
    switch (uri) {
      case 'file://workspace/info':
        return {
          uri,
          content: JSON.stringify({
            name: 'LOFERSIL Landing Page',
            description: 'Static TypeScript site for Vercel deployment',
            version: '1.0.0',
            features: ['MCP Integration', 'PWA', 'TypeScript', 'Vercel Deployment']
          }, null, 2),
          mimeType: 'application/json'
        };

      case 'file://workspace/config':
        return {
          uri,
          content: JSON.stringify({
            server: {
              name: 'LOFERSIL Test MCP Server',
              version: '1.0.0',
              protocol: '2024-11-05'
            },
            tools: this.tools.length,
            resources: this.resources.length,
            prompts: this.prompts.length
          }, null, 2),
          mimeType: 'application/json'
        };

      default:
        throw new Error(`Resource not found: ${uri}`);
    }
  }

  handlePromptGet(params) {
    const { name, arguments: args } = params;
    
    switch (name) {
      case 'code_review':
        return {
          description: 'Code review prompt for analyzing code quality and suggestions',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Please review the following ${args.language || 'code'} for quality, best practices, and potential improvements:\n\n\`\`\`${args.language || ''}\n${args.code}\n\`\`\``
              }
            }
          ]
        };

      case 'debug_help':
        return {
          description: 'Debugging assistance prompt',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I need help debugging this issue:\n\nError: ${args.error}\n\nAdditional context: ${args.context || 'None provided'}\n\nPlease help me identify the cause and suggest solutions.`
              }
            }
          ]
        };

      default:
        throw new Error(`Prompt not found: ${name}`);
    }
  }

  async start() {
    // Install ws if not available
    try {
      await import('ws');
    } catch {
      console.log('📦 Installing ws package...');
      execSync('npm install ws', { stdio: 'inherit' });
    }

    const { WebSocketServer } = await import('ws');
    
    const wss = new WebSocketServer({ port: WS_PORT });
    
    wss.on('connection', (ws, request) => {
      console.log('🔌 MCP Client connected from:', request.socket.remoteAddress);
      
      ws.on('message', (message) => {
        this.handleRequest(message.toString(), ws);
      });
      
      ws.on('close', () => {
        console.log('🔌 MCP Client disconnected');
      });
      
      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
    });

    console.log(`🚀 MCP Server started on ws://localhost:${WS_PORT}`);
    console.log(`📊 Available tools: ${this.tools.length}`);
    console.log(`📁 Available resources: ${this.resources.length}`);
    console.log(`💬 Available prompts: ${this.prompts.length}`);
    console.log('\n🛠️  Available tools:');
    this.tools.forEach((tool, index) => {
      console.log(`   ${index + 1}. ${tool.name} - ${tool.description}`);
    });
    
    return wss;
  }
}

// Start server
const server = new MCPServer();
server.start().catch(console.error);