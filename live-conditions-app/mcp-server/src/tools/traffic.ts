import axios from 'axios';
import { env } from '../utils/env.js';
import { Logger } from '../utils/logger.js';
import { TrafficData, LocationQuery, MCPToolResult } from '../types/index.js';

const logger = new Logger('TrafficTools');

/**
 * Traffic information MCP tools for Live Conditions integration
 */
export const trafficTools = {
  list() {
    return [
      {
        name: 'traffic_incidents',
        description: 'Get current traffic incidents and road conditions',
        inputSchema: {
          type: 'object',
          properties: {
            latitude: {
              type: 'number',
              description: 'Latitude coordinate',
              minimum: -90,
              maximum: 90,
            },
            longitude: {
              type: 'number',
              description: 'Longitude coordinate',
              minimum: -180,
              maximum: 180,
            },
            city: {
              type: 'string',
              description: 'City or region name',
            },
            radius: {
              type: 'number',
              description: 'Search radius in kilometers',
              minimum: 1,
              maximum: 100,
              default: 10,
            },
            severity: {
              type: 'string',
              description: 'Minimum incident severity',
              enum: ['low', 'medium', 'high', 'critical'],
            },
            incidentType: {
              type: 'string',
              description: 'Type of traffic incident',
              enum: ['accident', 'roadwork', 'closure', 'congestion', 'weather', 'all'],
              default: 'all',
            },
          },
          anyOf: [
            { required: ['latitude', 'longitude'] },
            { required: ['city'] },
          ],
        },
      },
      {
        name: 'traffic_routes',
        description: 'Get traffic information for specific routes',
        inputSchema: {
          type: 'object',
          properties: {
            origin: {
              type: 'object',
              properties: {
                latitude: { type: 'number' },
                longitude: { type: 'number' },
                name: { type: 'string' },
              },
              required: ['latitude', 'longitude'],
            },
            destination: {
              type: 'object',
              properties: {
                latitude: { type: 'number' },
                longitude: { type: 'number' },
                name: { type: 'string' },
              },
              required: ['latitude', 'longitude'],
            },
            routeType: {
              type: 'string',
              description: 'Type of route preference',
              enum: ['fastest', 'shortest', 'avoid_tolls', 'avoid_highways'],
              default: 'fastest',
            },
            includeAlternatives: {
              type: 'boolean',
              description: 'Include alternative routes',
              default: true,
            },
          },
          required: ['origin', 'destination'],
        },
      },
      {
        name: 'traffic_cameras',
        description: 'Get traffic camera information and live feeds',
        inputSchema: {
          type: 'object',
          properties: {
            latitude: {
              type: 'number',
              description: 'Latitude coordinate',
            },
            longitude: {
              type: 'number',
              description: 'Longitude coordinate',
            },
            highway: {
              type: 'string',
              description: 'Highway or major road name',
            },
            radius: {
              type: 'number',
              description: 'Search radius in kilometers',
              default: 5,
            },
            includeImages: {
              type: 'boolean',
              description: 'Include camera image URLs',
              default: false,
            },
          },
        },
      },
      {
        name: 'traffic_roadwork',
        description: 'Get planned and active roadwork information',
        inputSchema: {
          type: 'object',
          properties: {
            latitude: {
              type: 'number',
              description: 'Latitude coordinate',
            },
            longitude: {
              type: 'number',
              description: 'Longitude coordinate',
            },
            region: {
              type: 'string',
              description: 'Region or state',
            },
            timeframe: {
              type: 'string',
              description: 'Roadwork timeframe',
              enum: ['current', 'upcoming', 'all'],
              default: 'current',
            },
            impact: {
              type: 'string',
              description: 'Traffic impact level',
              enum: ['low', 'medium', 'high', 'all'],
              default: 'all',
            },
          },
        },
      },
    ];
  },

  async call(name: string, args: any): Promise<MCPToolResult> {
    try {
      switch (name) {
        case 'traffic_incidents':
          return await this.getTrafficIncidents(args);
        case 'traffic_routes':
          return await this.getRouteInformation(args);
        case 'traffic_cameras':
          return await this.getTrafficCameras(args);
        case 'traffic_roadwork':
          return await this.getRoadwork(args);
        default:
          throw new Error(`Unknown traffic tool: ${name}`);
      }
    } catch (error) {
      logger.error(`Traffic tool error: ${error}`);
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

  async getTrafficIncidents(args: LocationQuery & { radius?: number; severity?: string; incidentType?: string }): Promise<MCPToolResult> {
    const { latitude, longitude, city, radius = 10, severity, incidentType = 'all' } = args;
    
    const params = new URLSearchParams();
    if (latitude && longitude) {
      params.append('lat', latitude.toString());
      params.append('lon', longitude.toString());
      params.append('radius', radius.toString());
    } else if (city) {
      params.append('city', city);
    } else {
      throw new Error('Either coordinates or city must be provided');
    }
    
    if (severity) params.append('severity', severity);
    if (incidentType !== 'all') params.append('type', incidentType);

    const response = await axios.get(
      `${env.BACKEND_API_URL}/api/traffic/incidents?${params.toString()}`,
      { timeout: env.API_TIMEOUT }
    );

    const trafficData: TrafficData = response.data;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            location: trafficData.location,
            incidents: trafficData.incidents,
            roadConditions: trafficData.roadConditions,
            timestamp: trafficData.timestamp,
            summary: `${trafficData.incidents.length} traffic incident(s) found. Road conditions: ${trafficData.roadConditions.overallStatus}, Average speed: ${trafficData.roadConditions.averageSpeed} km/h`,
          }, null, 2),
        },
      ],
    };
  },

  async getRouteInformation(args: { 
    origin: { latitude: number; longitude: number; name?: string };
    destination: { latitude: number; longitude: number; name?: string };
    routeType?: string;
    includeAlternatives?: boolean;
  }): Promise<MCPToolResult> {
    const { origin, destination, routeType = 'fastest', includeAlternatives = true } = args;
    
    const params = new URLSearchParams({
      'origin_lat': origin.latitude.toString(),
      'origin_lon': origin.longitude.toString(),
      'dest_lat': destination.latitude.toString(),
      'dest_lon': destination.longitude.toString(),
      'route_type': routeType,
      'alternatives': includeAlternatives.toString(),
    });

    if (origin.name) params.append('origin_name', origin.name);
    if (destination.name) params.append('dest_name', destination.name);

    const response = await axios.get(
      `${env.BACKEND_API_URL}/api/traffic/routes?${params.toString()}`,
      { timeout: env.API_TIMEOUT }
    );

    const routeData = response.data;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            origin: routeData.origin,
            destination: routeData.destination,
            primaryRoute: routeData.primaryRoute,
            alternatives: routeData.alternatives,
            summary: `Route from ${routeData.origin.name || 'origin'} to ${routeData.destination.name || 'destination'}: ${routeData.primaryRoute.duration} (${routeData.primaryRoute.distance}). Traffic: ${routeData.primaryRoute.trafficCondition}`,
          }, null, 2),
        },
      ],
    };
  },

  async getTrafficCameras(args: { latitude?: number; longitude?: number; highway?: string; radius?: number; includeImages?: boolean }): Promise<MCPToolResult> {
    const { latitude, longitude, highway, radius = 5, includeImages = false } = args;
    
    const params = new URLSearchParams();
    if (latitude && longitude) {
      params.append('lat', latitude.toString());
      params.append('lon', longitude.toString());
      params.append('radius', radius.toString());
    }
    if (highway) params.append('highway', highway);
    if (includeImages) params.append('images', 'true');

    const response = await axios.get(
      `${env.BACKEND_API_URL}/api/traffic/cameras?${params.toString()}`,
      { timeout: env.API_TIMEOUT }
    );

    const cameraData = response.data;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            cameras: cameraData.cameras,
            total: cameraData.cameras.length,
            summary: `Found ${cameraData.cameras.length} traffic camera(s)${highway ? ` on ${highway}` : ''}`,
          }, null, 2),
        },
      ],
    };
  },

  async getRoadwork(args: { latitude?: number; longitude?: number; region?: string; timeframe?: string; impact?: string }): Promise<MCPToolResult> {
    const { latitude, longitude, region, timeframe = 'current', impact = 'all' } = args;
    
    const params = new URLSearchParams();
    if (latitude && longitude) {
      params.append('lat', latitude.toString());
      params.append('lon', longitude.toString());
    }
    if (region) params.append('region', region);
    if (timeframe !== 'all') params.append('timeframe', timeframe);
    if (impact !== 'all') params.append('impact', impact);

    const response = await axios.get(
      `${env.BACKEND_API_URL}/api/traffic/roadwork?${params.toString()}`,
      { timeout: env.API_TIMEOUT }
    );

    const roadworkData = response.data;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            roadwork: roadworkData.roadwork,
            total: roadworkData.roadwork.length,
            summary: `Found ${roadworkData.roadwork.length} roadwork project(s)${region ? ` in ${region}` : ''}`,
          }, null, 2),
        },
      ],
    };
  },
};