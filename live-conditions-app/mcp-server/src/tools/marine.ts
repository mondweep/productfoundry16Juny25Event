import axios from 'axios';
import { env } from '../utils/env.js';
import { Logger } from '../utils/logger.js';
import { MarineData, LocationQuery, MCPToolResult } from '../types/index.js';

const logger = new Logger('MarineTools');

/**
 * Marine conditions MCP tools for Live Conditions integration
 */
export const marineTools = {
  list() {
    return [
      {
        name: 'marine_conditions',
        description: 'Get current marine conditions including waves, tides, and sea temperature',
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
            location: {
              type: 'string',
              description: 'Named marine location or beach',
            },
            includeForcast: {
              type: 'boolean',
              description: 'Include marine forecast data',
              default: true,
            },
          },
          anyOf: [
            { required: ['latitude', 'longitude'] },
            { required: ['location'] },
          ],
        },
      },
      {
        name: 'marine_tides',
        description: 'Get tide information and predictions',
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
            location: {
              type: 'string',
              description: 'Tide station or coastal location name',
            },
            days: {
              type: 'number',
              description: 'Number of days for tide predictions',
              minimum: 1,
              maximum: 7,
              default: 1,
            },
          },
        },
      },
      {
        name: 'marine_surf',
        description: 'Get surf conditions and forecasts for beaches',
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
            beach: {
              type: 'string',
              description: 'Beach or surf spot name',
            },
            country: {
              type: 'string',
              description: 'Country code',
              enum: ['AU', 'NZ'],
            },
            includeSurfForecast: {
              type: 'boolean',
              description: 'Include detailed surf forecast',
              default: true,
            },
          },
        },
      },
      {
        name: 'marine_warnings',
        description: 'Get active marine warnings and advisories',
        inputSchema: {
          type: 'object',
          properties: {
            region: {
              type: 'string',
              description: 'Marine region or coastal area',
            },
            warningType: {
              type: 'string',
              description: 'Type of marine warning',
              enum: ['gale', 'storm', 'tsunami', 'rip', 'all'],
              default: 'all',
            },
            latitude: {
              type: 'number',
              description: 'Latitude for location-based warnings',
            },
            longitude: {
              type: 'number',
              description: 'Longitude for location-based warnings',
            },
          },
        },
      },
    ];
  },

  async call(name: string, args: any): Promise<MCPToolResult> {
    try {
      switch (name) {
        case 'marine_conditions':
          return await this.getMarineConditions(args);
        case 'marine_tides':
          return await this.getTides(args);
        case 'marine_surf':
          return await this.getSurfConditions(args);
        case 'marine_warnings':
          return await this.getMarineWarnings(args);
        default:
          throw new Error(`Unknown marine tool: ${name}`);
      }
    } catch (error) {
      logger.error(`Marine tool error: ${error}`);
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

  async getMarineConditions(args: LocationQuery & { location?: string; includeForecast?: boolean }): Promise<MCPToolResult> {
    const { latitude, longitude, location, includeForecast = true } = args;
    
    const params = new URLSearchParams();
    if (latitude && longitude) {
      params.append('lat', latitude.toString());
      params.append('lon', longitude.toString());
    } else if (location) {
      params.append('location', location);
    } else {
      throw new Error('Either coordinates or location name must be provided');
    }
    
    if (includeForecast) {
      params.append('forecast', 'true');
    }

    const response = await axios.get(
      `${env.BACKEND_API_URL}/api/ocean/conditions?${params.toString()}`,
      { timeout: env.API_TIMEOUT }
    );

    const marineData: MarineData = response.data;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            location: marineData.location,
            conditions: marineData.conditions,
            forecast: marineData.forecast,
            timestamp: marineData.timestamp,
            summary: `Marine conditions at ${marineData.location.name}: Wave height ${marineData.conditions.waveHeight}m, Sea temperature ${marineData.conditions.seaSurfaceTemperature}°C, Next ${marineData.forecast.nextTide.type} tide at ${marineData.forecast.nextTide.time}`,
          }, null, 2),
        },
      ],
    };
  },

  async getTides(args: LocationQuery & { location?: string; days?: number }): Promise<MCPToolResult> {
    const { latitude, longitude, location, days = 1 } = args;
    
    const params = new URLSearchParams();
    if (latitude && longitude) {
      params.append('lat', latitude.toString());
      params.append('lon', longitude.toString());
    } else if (location) {
      params.append('location', location);
    }
    
    params.append('days', days.toString());

    const response = await axios.get(
      `${env.BACKEND_API_URL}/api/ocean/tides?${params.toString()}`,
      { timeout: env.API_TIMEOUT }
    );

    const tideData = response.data;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            location: tideData.location,
            tides: tideData.tides,
            summary: `Tide predictions for ${tideData.location}: ${tideData.tides.length} tide events over ${days} day(s)`,
          }, null, 2),
        },
      ],
    };
  },

  async getSurfConditions(args: LocationQuery & { beach?: string; country?: string; includeSurfForecast?: boolean }): Promise<MCPToolResult> {
    const { latitude, longitude, beach, country, includeSurfForecast = true } = args;
    
    const params = new URLSearchParams();
    if (latitude && longitude) {
      params.append('lat', latitude.toString());
      params.append('lon', longitude.toString());
    } else if (beach) {
      params.append('beach', beach);
      if (country) params.append('country', country);
    }
    
    if (includeSurfForecast) {
      params.append('forecast', 'true');
    }

    const response = await axios.get(
      `${env.BACKEND_API_URL}/api/ocean/surf?${params.toString()}`,
      { timeout: env.API_TIMEOUT }
    );

    const surfData = response.data;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            location: surfData.location,
            conditions: surfData.conditions,
            forecast: surfData.forecast,
            rating: surfData.rating,
            summary: `Surf conditions at ${surfData.location.name}: ${surfData.conditions.waveHeight}m waves, ${surfData.rating} conditions, ${surfData.conditions.surfConditions}`,
          }, null, 2),
        },
      ],
    };
  },

  async getMarineWarnings(args: { region?: string; warningType?: string; latitude?: number; longitude?: number }): Promise<MCPToolResult> {
    const { region, warningType = 'all', latitude, longitude } = args;
    
    const params = new URLSearchParams();
    if (region) params.append('region', region);
    if (warningType !== 'all') params.append('type', warningType);
    if (latitude && longitude) {
      params.append('lat', latitude.toString());
      params.append('lon', longitude.toString());
    }

    const response = await axios.get(
      `${env.BACKEND_API_URL}/api/ocean/warnings?${params.toString()}`,
      { timeout: env.API_TIMEOUT }
    );

    const warnings = response.data;
    const activeWarnings = warnings.filter((warning: any) => warning.isActive);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            totalWarnings: warnings.length,
            activeWarnings: activeWarnings.length,
            warnings: activeWarnings,
            summary: activeWarnings.length > 0 
              ? `${activeWarnings.length} active marine warning(s) found`
              : 'No active marine warnings',
          }, null, 2),
        },
      ],
    };
  },
};