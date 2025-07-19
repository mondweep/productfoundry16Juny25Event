import axios from 'axios';
import { env } from '../utils/env.js';
import { Logger } from '../utils/logger.js';
import { MCPResource } from '../types/index.js';

const logger = new Logger('ConditionsResources');

/**
 * Live Conditions data resources for MCP integration
 */
export const conditionsResources = {
  list(): MCPResource[] {
    return [
      {
        uri: 'conditions://weather/current',
        name: 'Current Weather Conditions',
        description: 'Real-time weather data for Australia and New Zealand',
        mimeType: 'application/json',
      },
      {
        uri: 'conditions://marine/current',
        name: 'Current Marine Conditions',
        description: 'Live marine conditions including waves, tides, and sea temperature',
        mimeType: 'application/json',
      },
      {
        uri: 'conditions://traffic/incidents',
        name: 'Traffic Incidents',
        description: 'Current traffic incidents and road conditions',
        mimeType: 'application/json',
      },
      {
        uri: 'conditions://alerts/active',
        name: 'Active Emergency Alerts',
        description: 'Current emergency alerts and warnings',
        mimeType: 'application/json',
      },
      {
        uri: 'conditions://locations/popular',
        name: 'Popular Locations',
        description: 'List of popular monitored locations',
        mimeType: 'application/json',
      },
      {
        uri: 'conditions://data/quality',
        name: 'Data Quality Metrics',
        description: 'Data freshness and quality information',
        mimeType: 'application/json',
      },
      {
        uri: 'conditions://api/schema',
        name: 'API Schema',
        description: 'Complete API schema and data format definitions',
        mimeType: 'application/json',
      },
    ];
  },

  async read(uri: string): Promise<{ contents: Array<{ type: string; text?: string; data?: string; mimeType?: string }> }> {
    try {
      switch (uri) {
        case 'conditions://weather/current':
          return await this.getCurrentWeatherResource();
        case 'conditions://marine/current':
          return await this.getCurrentMarineResource();
        case 'conditions://traffic/incidents':
          return await this.getTrafficIncidentsResource();
        case 'conditions://alerts/active':
          return await this.getActiveAlertsResource();
        case 'conditions://locations/popular':
          return await this.getPopularLocationsResource();
        case 'conditions://data/quality':
          return await this.getDataQualityResource();
        case 'conditions://api/schema':
          return await this.getApiSchemaResource();
        default:
          throw new Error(`Unknown resource URI: ${uri}`);
      }
    } catch (error) {
      logger.error(`Resource read error for ${uri}: ${error}`);
      throw error;
    }
  },

  async getCurrentWeatherResource() {
    // Get current weather for major cities
    const majorCities = [
      { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
      { name: 'Melbourne', lat: -37.8136, lon: 144.9631 },
      { name: 'Brisbane', lat: -27.4698, lon: 153.0251 },
      { name: 'Perth', lat: -31.9505, lon: 115.8605 },
      { name: 'Auckland', lat: -36.8485, lon: 174.7633 },
      { name: 'Wellington', lat: -41.2865, lon: 174.7762 },
    ];

    const weatherData = await Promise.all(
      majorCities.map(async (city) => {
        try {
          const response = await axios.get(
            `${env.BACKEND_API_URL}/api/weather/current?lat=${city.lat}&lon=${city.lon}`,
            { timeout: 5000 }
          );
          return { city: city.name, ...response.data };
        } catch (error) {
          logger.warn(`Failed to get weather for ${city.name}: ${error}`);
          return { city: city.name, error: 'Data unavailable' };
        }
      })
    );

    return {
      contents: [
        {
          type: 'text',
          text: JSON.stringify({
            timestamp: new Date().toISOString(),
            description: 'Current weather conditions for major cities in Australia and New Zealand',
            cities: weatherData,
          }, null, 2),
          mimeType: 'application/json',
        },
      ],
    };
  },

  async getCurrentMarineResource() {
    // Get marine conditions for popular coastal locations
    const coastalLocations = [
      { name: 'Bondi Beach', lat: -33.8915, lon: 151.2767 },
      { name: 'Gold Coast', lat: -28.0174, lon: 153.4307 },
      { name: 'Byron Bay', lat: -28.6474, lon: 153.6020 },
      { name: 'Raglan', lat: -37.7974, lon: 174.8739 },
      { name: 'Tavarua', lat: -17.8419, lon: 177.1933 },
    ];

    const marineData = await Promise.all(
      coastalLocations.map(async (location) => {
        try {
          const response = await axios.get(
            `${env.BACKEND_API_URL}/api/ocean/conditions?lat=${location.lat}&lon=${location.lon}`,
            { timeout: 5000 }
          );
          return { location: location.name, ...response.data };
        } catch (error) {
          logger.warn(`Failed to get marine data for ${location.name}: ${error}`);
          return { location: location.name, error: 'Data unavailable' };
        }
      })
    );

    return {
      contents: [
        {
          type: 'text',
          text: JSON.stringify({
            timestamp: new Date().toISOString(),
            description: 'Current marine conditions for popular coastal locations',
            locations: marineData,
          }, null, 2),
          mimeType: 'application/json',
        },
      ],
    };
  },

  async getTrafficIncidentsResource() {
    try {
      const response = await axios.get(
        `${env.BACKEND_API_URL}/api/traffic/incidents?region=all`,
        { timeout: 5000 }
      );

      const incidents = response.data;
      const summary = {
        total: incidents.length,
        critical: incidents.filter((i: any) => i.severity === 'critical').length,
        high: incidents.filter((i: any) => i.severity === 'high').length,
        byType: incidents.reduce((acc: any, incident: any) => {
          acc[incident.type] = (acc[incident.type] || 0) + 1;
          return acc;
        }, {}),
      };

      return {
        contents: [
          {
            type: 'text',
            text: JSON.stringify({
              timestamp: new Date().toISOString(),
              description: 'Current traffic incidents across Australia and New Zealand',
              summary,
              incidents: incidents.slice(0, 50), // Limit to top 50 incidents
            }, null, 2),
            mimeType: 'application/json',
          },
        ],
      };
    } catch (error) {
      logger.error(`Failed to get traffic incidents: ${error}`);
      return {
        contents: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Traffic incidents data unavailable',
              timestamp: new Date().toISOString(),
            }),
            mimeType: 'application/json',
          },
        ],
      };
    }
  },

  async getActiveAlertsResource() {
    try {
      const response = await axios.get(
        `${env.BACKEND_API_URL}/api/alerts/active`,
        { timeout: 5000 }
      );

      const alerts = response.data;
      const summary = {
        total: alerts.length,
        extreme: alerts.filter((a: any) => a.severity === 'extreme').length,
        severe: alerts.filter((a: any) => a.severity === 'severe').length,
        byType: alerts.reduce((acc: any, alert: any) => {
          acc[alert.type] = (acc[alert.type] || 0) + 1;
          return acc;
        }, {}),
      };

      return {
        contents: [
          {
            type: 'text',
            text: JSON.stringify({
              timestamp: new Date().toISOString(),
              description: 'Active emergency alerts and warnings',
              summary,
              alerts: alerts.filter((a: any) => a.severity === 'extreme' || a.severity === 'severe'),
            }, null, 2),
            mimeType: 'application/json',
          },
        ],
      };
    } catch (error) {
      logger.error(`Failed to get active alerts: ${error}`);
      return {
        contents: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Alert data unavailable',
              timestamp: new Date().toISOString(),
            }),
            mimeType: 'application/json',
          },
        ],
      };
    }
  },

  async getPopularLocationsResource() {
    const popularLocations = {
      cities: [
        { name: 'Sydney', country: 'AU', lat: -33.8688, lon: 151.2093, population: 5312163 },
        { name: 'Melbourne', country: 'AU', lat: -37.8136, lon: 144.9631, population: 5078193 },
        { name: 'Brisbane', country: 'AU', lat: -27.4698, lon: 153.0251, population: 2560720 },
        { name: 'Perth', country: 'AU', lat: -31.9505, lon: 115.8605, population: 2192229 },
        { name: 'Adelaide', country: 'AU', lat: -34.9285, lon: 138.6007, population: 1402393 },
        { name: 'Auckland', country: 'NZ', lat: -36.8485, lon: 174.7633, population: 1695200 },
        { name: 'Wellington', country: 'NZ', lat: -41.2865, lon: 174.7762, population: 215900 },
        { name: 'Christchurch', country: 'NZ', lat: -43.5321, lon: 172.6362, population: 383200 },
      ],
      beaches: [
        { name: 'Bondi Beach', state: 'NSW', lat: -33.8915, lon: 151.2767 },
        { name: 'Surfers Paradise', state: 'QLD', lat: -28.0023, lon: 153.4145 },
        { name: 'Byron Bay', state: 'NSW', lat: -28.6474, lon: 153.6020 },
        { name: 'Noosa', state: 'QLD', lat: -26.3890, lon: 153.0926 },
        { name: 'Bells Beach', state: 'VIC', lat: -38.3667, lon: 144.2833 },
        { name: 'Raglan', region: 'Waikato', lat: -37.7974, lon: 174.8739 },
        { name: 'Piha Beach', region: 'Auckland', lat: -36.9598, lon: 174.4719 },
      ],
      skiFields: [
        { name: 'Perisher', state: 'NSW', lat: -36.4072, lon: 148.4167 },
        { name: 'Thredbo', state: 'NSW', lat: -36.5000, lon: 148.3000 },
        { name: 'Mt Buller', state: 'VIC', lat: -37.1333, lon: 146.4333 },
        { name: 'Queenstown', region: 'Otago', lat: -45.0312, lon: 168.6626 },
        { name: 'Wanaka', region: 'Otago', lat: -44.7018, lon: 169.1321 },
      ],
    };

    return {
      contents: [
        {
          type: 'text',
          text: JSON.stringify({
            timestamp: new Date().toISOString(),
            description: 'Popular monitored locations across Australia and New Zealand',
            locations: popularLocations,
            totalLocations: popularLocations.cities.length + popularLocations.beaches.length + popularLocations.skiFields.length,
          }, null, 2),
          mimeType: 'application/json',
        },
      ],
    };
  },

  async getDataQualityResource() {
    try {
      const response = await axios.get(
        `${env.BACKEND_API_URL}/api/data-quality`,
        { timeout: 5000 }
      );

      return {
        contents: [
          {
            type: 'text',
            text: JSON.stringify({
              timestamp: new Date().toISOString(),
              description: 'Data quality metrics and freshness indicators',
              ...response.data,
            }, null, 2),
            mimeType: 'application/json',
          },
        ],
      };
    } catch (error) {
      logger.error(`Failed to get data quality metrics: ${error}`);
      return {
        contents: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Data quality metrics unavailable',
              timestamp: new Date().toISOString(),
              fallback: {
                overall: 0.85,
                sources: {
                  weather: { quality: 0.92, lastUpdate: new Date().toISOString() },
                  marine: { quality: 0.88, lastUpdate: new Date().toISOString() },
                  traffic: { quality: 0.79, lastUpdate: new Date().toISOString() },
                  alerts: { quality: 0.95, lastUpdate: new Date().toISOString() },
                },
              },
            }, null, 2),
            mimeType: 'application/json',
          },
        ],
      };
    }
  },

  async getApiSchemaResource() {
    const apiSchema = {
      version: '1.0.0',
      baseUrl: env.BACKEND_API_URL,
      endpoints: {
        weather: {
          current: {
            path: '/api/weather/current',
            method: 'GET',
            parameters: {
              lat: { type: 'number', required: true },
              lon: { type: 'number', required: true },
              units: { type: 'string', enum: ['metric', 'imperial'], default: 'metric' },
            },
          },
          forecast: {
            path: '/api/weather/forecast',
            method: 'GET',
            parameters: {
              lat: { type: 'number', required: true },
              lon: { type: 'number', required: true },
              days: { type: 'number', min: 1, max: 7, default: 3 },
            },
          },
        },
        marine: {
          conditions: {
            path: '/api/ocean/conditions',
            method: 'GET',
            parameters: {
              lat: { type: 'number', required: true },
              lon: { type: 'number', required: true },
              forecast: { type: 'boolean', default: true },
            },
          },
          tides: {
            path: '/api/ocean/tides',
            method: 'GET',
            parameters: {
              lat: { type: 'number', required: true },
              lon: { type: 'number', required: true },
              days: { type: 'number', min: 1, max: 7, default: 1 },
            },
          },
        },
        traffic: {
          incidents: {
            path: '/api/traffic/incidents',
            method: 'GET',
            parameters: {
              lat: { type: 'number', required: false },
              lon: { type: 'number', required: false },
              city: { type: 'string', required: false },
              radius: { type: 'number', default: 10 },
            },
          },
        },
        alerts: {
          active: {
            path: '/api/alerts/active',
            method: 'GET',
            parameters: {
              lat: { type: 'number', required: false },
              lon: { type: 'number', required: false },
              region: { type: 'string', required: false },
              type: { type: 'string', enum: ['weather', 'fire', 'earthquake', 'tsunami', 'flood'] },
            },
          },
        },
      },
      dataModels: {
        WeatherData: {
          location: { name: 'string', country: 'string', latitude: 'number', longitude: 'number' },
          current: {
            temperature: 'number',
            feelsLike: 'number',
            humidity: 'number',
            pressure: 'number',
            windSpeed: 'number',
            windDirection: 'number',
            condition: 'string',
            description: 'string',
          },
          timestamp: 'string (ISO 8601)',
        },
        MarineData: {
          location: { name: 'string', latitude: 'number', longitude: 'number' },
          conditions: {
            waveHeight: 'number',
            wavePeriod: 'number',
            waveDirection: 'number',
            seaSurfaceTemperature: 'number',
            tideLevel: 'number',
          },
          timestamp: 'string (ISO 8601)',
        },
      },
    };

    return {
      contents: [
        {
          type: 'text',
          text: JSON.stringify({
            timestamp: new Date().toISOString(),
            description: 'Complete API schema and data format definitions',
            schema: apiSchema,
          }, null, 2),
          mimeType: 'application/json',
        },
      ],
    };
  },
};