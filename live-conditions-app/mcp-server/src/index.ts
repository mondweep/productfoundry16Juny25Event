#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  CallToolResult,
  TextContent,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { weatherTools } from './tools/weather.js';
import { marineTools } from './tools/marine.js';
import { trafficTools } from './tools/traffic.js';
import { alertTools } from './tools/alerts.js';
import { integrationTools } from './tools/integration.js';

import { conditionsResources } from './resources/conditions.js';
import { dataPrompts } from './prompts/data.js';

import { Logger } from './utils/logger.js';
import { validateEnvironment } from './utils/env.js';

/**
 * Live Conditions MCP Server
 * 
 * Provides MCP (Model Context Protocol) integration for the Aotearoa & Aussie Live Conditions App.
 * Enables other applications to access weather, marine, traffic, and emergency alert data
 * through standardized MCP tools, resources, and prompts.
 */
class LiveConditionsMCPServer {
  private server: Server;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('LiveConditionsMCP');
    this.server = new Server(
      {
        name: 'live-conditions-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // Tool handlers
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Weather tools
          ...weatherTools.list(),
          // Marine condition tools
          ...marineTools.list(),
          // Traffic information tools
          ...trafficTools.list(),
          // Emergency alert tools
          ...alertTools.list(),
          // Integration utilities
          ...integrationTools.list(),
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        // Route to appropriate tool handler
        let result;
        if (name.startsWith('weather_')) {
          result = await weatherTools.call(name, args);
        } else if (name.startsWith('marine_')) {
          result = await marineTools.call(name, args);
        } else if (name.startsWith('traffic_')) {
          result = await trafficTools.call(name, args);
        } else if (name.startsWith('alert_')) {
          result = await alertTools.call(name, args);
        } else if (name.startsWith('integration_')) {
          result = await integrationTools.call(name, args);
        } else {
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
        
        return {
          content: result.content.map(item => ({
            type: item.type as 'text' | 'image' | 'resource',
            text: item.text,
            data: item.data,
            mimeType: item.mimeType,
          })),
          isError: result.isError || false,
        };
      } catch (error) {
        this.logger.error(`Tool execution error: ${error}`);
        
        if (error instanceof McpError) {
          throw error;
        }
        
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error executing tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });

    // Resource handlers
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: conditionsResources.list(),
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      try {
        return await conditionsResources.read(request.params.uri);
      } catch (error) {
        this.logger.error(`Resource read error: ${error}`);
        throw error;
      }
    });

    // Prompt handlers
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: dataPrompts.list(),
      };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      try {
        return await dataPrompts.get(request.params.name, request.params.arguments);
      } catch (error) {
        this.logger.error(`Prompt execution error: ${error}`);
        throw error;
      }
    });
  }

  async start() {
    try {
      // Validate environment
      validateEnvironment();
      
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      this.logger.info('Live Conditions MCP Server started successfully');
      this.logger.info('Available tools: weather, marine, traffic, alerts, integration');
      this.logger.info('Server ready to accept MCP requests');
      
    } catch (error) {
      this.logger.error(`Failed to start server: ${error}`);
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\\nShutting down Live Conditions MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\nShutting down Live Conditions MCP Server...');
  process.exit(0);
});

// Start the server
const server = new LiveConditionsMCPServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});