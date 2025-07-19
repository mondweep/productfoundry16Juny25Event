import axios from 'axios';
import { env } from '../utils/env.js';
import { Logger } from '../utils/logger.js';
import { IntegrationMetrics, DataQuality, MCPToolResult } from '../types/index.js';

const logger = new Logger('IntegrationTools');

/**
 * Integration and utility MCP tools for Live Conditions
 */
export const integrationTools = {
  list() {
    return [
      {
        name: 'integration_health',
        description: 'Check health status of all data sources and services',
        inputSchema: {
          type: 'object',
          properties: {
            includeMetrics: {
              type: 'boolean',
              description: 'Include detailed performance metrics',
              default: true,
            },
            checkExternalAPIs: {
              type: 'boolean',
              description: 'Test connectivity to external APIs',
              default: true,
            },
          },
        },
      },
      {
        name: 'integration_metrics',
        description: 'Get performance metrics and usage statistics',
        inputSchema: {
          type: 'object',
          properties: {
            timeRange: {
              type: 'string',
              description: 'Time range for metrics',
              enum: ['1hour', '24hours', '7days', '30days'],
              default: '24hours',
            },
            includeBreakdown: {
              type: 'boolean',
              description: 'Include breakdown by service/endpoint',
              default: true,
            },
          },
        },
      },
      {
        name: 'integration_data_quality',
        description: 'Assess data quality and freshness across all sources',
        inputSchema: {
          type: 'object',
          properties: {
            dataSource: {
              type: 'string',
              description: 'Specific data source to check',
              enum: ['weather', 'marine', 'traffic', 'alerts', 'all'],
              default: 'all',
            },
            includeRecommendations: {
              type: 'boolean',
              description: 'Include quality improvement recommendations',
              default: true,
            },
          },
        },
      },
      {
        name: 'integration_cache',
        description: 'Manage cache operations and statistics',
        inputSchema: {
          type: 'object',
          properties: {
            operation: {
              type: 'string',
              description: 'Cache operation to perform',
              enum: ['stats', 'clear', 'clear_expired', 'warming'],
              default: 'stats',
            },
            cacheType: {
              type: 'string',
              description: 'Type of cache to operate on',
              enum: ['weather', 'marine', 'traffic', 'alerts', 'all'],
              default: 'all',
            },
          },
        },
      },
      {
        name: 'integration_webhooks',
        description: 'Manage webhook subscriptions and notifications',
        inputSchema: {
          type: 'object',
          properties: {
            operation: {
              type: 'string',
              description: 'Webhook operation',
              enum: ['list', 'create', 'update', 'delete', 'test'],
              default: 'list',
            },
            webhookId: {
              type: 'string',
              description: 'Webhook ID (for update/delete/test operations)',
            },
            url: {
              type: 'string',
              description: 'Webhook URL (for create/update operations)',
            },
            events: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['weather_alert', 'marine_warning', 'traffic_incident', 'emergency_alert'],
              },
              description: 'Events to subscribe to (for create/update)',
            },
          },
        },
      },
      {
        name: 'integration_export',
        description: 'Export data in various formats for integration',
        inputSchema: {
          type: 'object',
          properties: {
            dataType: {
              type: 'string',
              description: 'Type of data to export',
              enum: ['weather', 'marine', 'traffic', 'alerts', 'combined'],
              default: 'combined',
            },
            format: {
              type: 'string',
              description: 'Export format',
              enum: ['json', 'csv', 'xml', 'geojson'],
              default: 'json',
            },
            location: {
              type: 'object',
              properties: {
                latitude: { type: 'number' },
                longitude: { type: 'number' },
                radius: { type: 'number', default: 10 },
              },
              description: 'Location filter for data export',
            },
            timeRange: {
              type: 'string',
              description: 'Time range for historical data',
              enum: ['current', '1hour', '24hours', '7days'],
              default: 'current',
            },
          },
        },
      },
    ];
  },

  async call(name: string, args: any): Promise<MCPToolResult> {
    try {
      switch (name) {
        case 'integration_health':
          return await this.getHealthStatus(args);
        case 'integration_metrics':
          return await this.getMetrics(args);
        case 'integration_data_quality':
          return await this.getDataQuality(args);
        case 'integration_cache':
          return await this.manageCache(args);
        case 'integration_webhooks':
          return await this.manageWebhooks(args);
        case 'integration_export':
          return await this.exportData(args);
        default:
          throw new Error(`Unknown integration tool: ${name}`);
      }
    } catch (error) {
      logger.error(`Integration tool error: ${error}`);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },

  async getHealthStatus(args: { includeMetrics?: boolean; checkExternalAPIs?: boolean }): Promise<MCPToolResult> {
    const { includeMetrics = true, checkExternalAPIs = true } = args;
    
    const params = new URLSearchParams({
      metrics: includeMetrics.toString(),
      external: checkExternalAPIs.toString(),
    });

    const response = await axios.get(
      `${env.BACKEND_API_URL}/api/health?${params.toString()}`,
      { timeout: env.API_TIMEOUT }
    );

    const healthData = response.data;
    const unhealthyServices = Object.entries(healthData.services)
      .filter(([_, status]: [string, any]) => status.status !== 'healthy')
      .map(([service, _]) => service);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            overallStatus: healthData.status,
            services: healthData.services,
            database: healthData.database,
            cache: healthData.cache,
            externalAPIs: healthData.externalAPIs,
            uptime: healthData.uptime,
            timestamp: healthData.timestamp,
            issues: unhealthyServices,
            summary: unhealthyServices.length > 0 
              ? `System health: ${healthData.status}. Issues detected: ${unhealthyServices.join(', ')}`
              : `All systems healthy. Uptime: ${healthData.uptime}`,
          }, null, 2),
        },
      ],
    };
  },

  async getMetrics(args: { timeRange?: string; includeBreakdown?: boolean }): Promise<MCPToolResult> {
    const { timeRange = '24hours', includeBreakdown = true } = args;
    
    const params = new URLSearchParams({
      range: timeRange,
      breakdown: includeBreakdown.toString(),
    });

    const response = await axios.get(
      `${env.BACKEND_API_URL}/api/metrics?${params.toString()}`,
      { timeout: env.API_TIMEOUT }
    );

    const metrics: IntegrationMetrics = response.data;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            timeRange,
            totalRequests: metrics.totalRequests,
            successRate: ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2) + '%',
            averageResponseTime: metrics.averageResponseTime + 'ms',
            dataSourcesStatus: metrics.dataSourcesStatus,
            requestsPerHour: Math.round(metrics.totalRequests / (timeRange === '24hours' ? 24 : 1)),
            summary: `${metrics.totalRequests} requests in ${timeRange}. Success rate: ${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1)}%. Avg response: ${metrics.averageResponseTime}ms`,
          }, null, 2),
        },
      ],
    };
  },

  async getDataQuality(args: { dataSource?: string; includeRecommendations?: boolean }): Promise<MCPToolResult> {
    const { dataSource = 'all', includeRecommendations = true } = args;
    
    const params = new URLSearchParams({
      source: dataSource,
      recommendations: includeRecommendations.toString(),
    });

    const response = await axios.get(
      `${env.BACKEND_API_URL}/api/data-quality?${params.toString()}`,
      { timeout: env.API_TIMEOUT }
    );

    const qualityData = response.data;
    const lowQualitySources = Object.entries(qualityData.sources)
      .filter(([_, quality]: [string, any]) => quality.overall < 0.8)
      .map(([source, _]) => source);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            overallQuality: qualityData.overall,
            sources: qualityData.sources,
            recommendations: qualityData.recommendations,
            lowQualitySources,
            summary: `Overall data quality: ${(qualityData.overall * 100).toFixed(1)}%${lowQualitySources.length > 0 ? `. Low quality sources: ${lowQualitySources.join(', ')}` : ''}`,
          }, null, 2),
        },
      ],
    };
  },

  async manageCache(args: { operation?: string; cacheType?: string }): Promise<MCPToolResult> {
    const { operation = 'stats', cacheType = 'all' } = args;
    
    const response = await axios.post(
      `${env.BACKEND_API_URL}/api/cache/${operation}`,
      { type: cacheType },
      { 
        timeout: env.API_TIMEOUT,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const cacheData = response.data;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            operation,
            cacheType,
            result: cacheData,
            summary: `Cache ${operation} completed for ${cacheType}${cacheData.itemsAffected ? `. Items affected: ${cacheData.itemsAffected}` : ''}`,
          }, null, 2),
        },
      ],
    };
  },

  async manageWebhooks(args: { operation?: string; webhookId?: string; url?: string; events?: string[] }): Promise<MCPToolResult> {
    const { operation = 'list', webhookId, url, events } = args;
    
    let response;
    const baseUrl = `${env.BACKEND_API_URL}/api/webhooks`;
    
    switch (operation) {
      case 'list':
        response = await axios.get(baseUrl, { timeout: env.API_TIMEOUT });
        break;
      case 'create':
        if (!url || !events) {
          throw new Error('URL and events are required for webhook creation');
        }
        response = await axios.post(baseUrl, { url, events }, { timeout: env.API_TIMEOUT });
        break;
      case 'update':
        if (!webhookId) {
          throw new Error('Webhook ID is required for update operation');
        }
        response = await axios.put(`${baseUrl}/${webhookId}`, { url, events }, { timeout: env.API_TIMEOUT });
        break;
      case 'delete':
        if (!webhookId) {
          throw new Error('Webhook ID is required for delete operation');
        }
        response = await axios.delete(`${baseUrl}/${webhookId}`, { timeout: env.API_TIMEOUT });
        break;
      case 'test':
        if (!webhookId) {
          throw new Error('Webhook ID is required for test operation');
        }
        response = await axios.post(`${baseUrl}/${webhookId}/test`, {}, { timeout: env.API_TIMEOUT });
        break;
      default:
        throw new Error(`Unknown webhook operation: ${operation}`);
    }

    const webhookData = response.data;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            operation,
            result: webhookData,
            summary: `Webhook ${operation} ${operation === 'list' ? `returned ${webhookData.length} webhook(s)` : 'completed successfully'}`,
          }, null, 2),
        },
      ],
    };
  },

  async exportData(args: { 
    dataType?: string; 
    format?: string; 
    location?: { latitude: number; longitude: number; radius?: number }; 
    timeRange?: string 
  }): Promise<MCPToolResult> {
    const { dataType = 'combined', format = 'json', location, timeRange = 'current' } = args;
    
    const exportParams: any = {
      type: dataType,
      format,
      timeRange,
    };
    
    if (location) {
      exportParams.location = location;
    }

    const response = await axios.post(
      `${env.BACKEND_API_URL}/api/export`,
      exportParams,
      { 
        timeout: env.API_TIMEOUT * 2, // Extended timeout for export operations
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const exportData = response.data;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            exportId: exportData.id,
            dataType,
            format,
            recordCount: exportData.recordCount,
            downloadUrl: exportData.downloadUrl,
            expiresAt: exportData.expiresAt,
            summary: `Exported ${exportData.recordCount} ${dataType} records in ${format} format`,
          }, null, 2),
        },
      ],
    };
  },
};