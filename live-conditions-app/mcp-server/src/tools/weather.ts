import axios from 'axios';
import { env } from '../utils/env.js';
import { Logger } from '../utils/logger.js';
import { WeatherData, LocationQuery, MCPToolResult } from '../types/index.js';

const logger = new Logger('WeatherTools');

/**
 * Weather-related MCP tools for Live Conditions integration
 */
export const weatherTools = {
  list() {
    return [
      {
        name: 'weather_current',
        description: 'Get current weather conditions for a specified location',
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
              description: 'City name (alternative to coordinates)',
            },
            country: {
              type: 'string',
              description: 'Country code (AU for Australia, NZ for New Zealand)',
              enum: ['AU', 'NZ'],
            },
            units: {
              type: 'string',
              description: 'Temperature units',
              enum: ['metric', 'imperial'],
              default: 'metric',
            },
          },
          required: [],
          anyOf: [
            { required: ['latitude', 'longitude'] },
            { required: ['city'] },
          ],
        },
      },
      {
        name: 'weather_forecast',
        description: 'Get weather forecast for a specified location',
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
            city: {
              type: 'string',
              description: 'City name',
            },
            days: {
              type: 'number',
              description: 'Number of forecast days',
              minimum: 1,
              maximum: 7,
              default: 3,
            },
            units: {
              type: 'string',
              enum: ['metric', 'imperial'],
              default: 'metric',
            },
          },
        },
      },
      {
        name: 'weather_alerts',
        description: 'Get active weather alerts and warnings for a location',
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
              description: 'Region or state name',
            },
            severity: {
              type: 'string',
              description: 'Minimum alert severity level',
              enum: ['minor', 'moderate', 'severe', 'extreme'],
            },
          },
        },
      },
      {
        name: 'weather_historical',
        description: 'Get historical weather data for analysis',
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
            date: {
              type: 'string',
              description: 'Date in YYYY-MM-DD format',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            },
            days: {
              type: 'number',
              description: 'Number of historical days',
              minimum: 1,
              maximum: 30,
              default: 1,
            },
          },
          required: ['latitude', 'longitude', 'date'],
        },
      },
    ];
  },

  async call(name: string, args: any): Promise<MCPToolResult> {
    try {
      switch (name) {
        case 'weather_current':
          return await this.getCurrentWeather(args);
        case 'weather_forecast':
          return await this.getForecast(args);
        case 'weather_alerts':
          return await this.getWeatherAlerts(args);
        case 'weather_historical':
          return await this.getHistoricalWeather(args);
        default:
          throw new Error(`Unknown weather tool: ${name}`);
      }
    } catch (error) {
      logger.error(`Weather tool error: ${error}`);
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

  async getCurrentWeather(args: LocationQuery & { units?: string }): Promise<MCPToolResult> {
    const { latitude, longitude, city, country, units = 'metric' } = args;
    
    // Build query parameters
    const params = new URLSearchParams();
    if (latitude && longitude) {
      params.append('lat', latitude.toString());
      params.append('lon', longitude.toString());
    } else if (city) {
      params.append('city', city);
      if (country) params.append('country', country);
    } else {
      throw new Error('Either coordinates (lat/lon) or city must be provided');
    }
    
    params.append('units', units);

    const response = await axios.get(
      `${env.BACKEND_API_URL}/api/weather/current?${params.toString()}`,
      {
        timeout: env.API_TIMEOUT,
        headers: {
          'User-Agent': 'LiveConditions-MCP-Server/1.0.0',
        },
      }
    );

    const weatherData: WeatherData = response.data;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            location: weatherData.location,
            current: weatherData.current,
            timestamp: weatherData.timestamp,
            summary: `Current weather in ${weatherData.location.name}: ${weatherData.current.temperature}°C, ${weatherData.current.condition}. Feels like ${weatherData.current.feelsLike}°C. Humidity: ${weatherData.current.humidity}%, Wind: ${weatherData.current.windSpeed} km/h`,
          }, null, 2),
        },
      ],
    };
  },

  async getForecast(args: LocationQuery & { days?: number; units?: string }): Promise<MCPToolResult> {
    const { latitude, longitude, city, days = 3, units = 'metric' } = args;
    
    const params = new URLSearchParams();
    if (latitude && longitude) {
      params.append('lat', latitude.toString());
      params.append('lon', longitude.toString());
    } else if (city) {
      params.append('city', city);
    }
    
    params.append('days', days.toString());
    params.append('units', units);

    const response = await axios.get(
      `${env.BACKEND_API_URL}/api/weather/forecast?${params.toString()}`,
      { timeout: env.API_TIMEOUT }
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  },

  async getWeatherAlerts(args: LocationQuery & { severity?: string }): Promise<MCPToolResult> {
    const { latitude, longitude, region, severity } = args;
    
    const params = new URLSearchParams();
    if (latitude && longitude) {
      params.append('lat', latitude.toString());
      params.append('lon', longitude.toString());
    }
    if (region) params.append('region', region);
    if (severity) params.append('severity', severity);

    const response = await axios.get(
      `${env.BACKEND_API_URL}/api/weather/alerts?${params.toString()}`,
      { timeout: env.API_TIMEOUT }
    );

    const alerts = response.data;
    const activeAlerts = alerts.filter((alert: any) => alert.isActive);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            totalAlerts: alerts.length,
            activeAlerts: activeAlerts.length,
            alerts: activeAlerts,
            summary: activeAlerts.length > 0 
              ? `${activeAlerts.length} active weather alert(s) found`
              : 'No active weather alerts',
          }, null, 2),
        },
      ],
    };
  },

  async getHistoricalWeather(args: { latitude: number; longitude: number; date: string; days?: number }): Promise<MCPToolResult> {
    const { latitude, longitude, date, days = 1 } = args;
    
    const params = new URLSearchParams({
      lat: latitude.toString(),
      lon: longitude.toString(),
      date,
      days: days.toString(),
    });

    const response = await axios.get(
      `${env.BACKEND_API_URL}/api/weather/historical?${params.toString()}`,
      { timeout: env.API_TIMEOUT }
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  },
};