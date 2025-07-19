import axios from 'axios';
import { env } from '../utils/env.js';
import { Logger } from '../utils/logger.js';
import { AlertData, LocationQuery, MCPToolResult } from '../types/index.js';

const logger = new Logger('AlertTools');

/**
 * Emergency alerts and warnings MCP tools for Live Conditions integration
 */
export const alertTools = {
  list() {
    return [
      {
        name: 'alert_active',
        description: 'Get all active emergency alerts and warnings',
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
            region: {
              type: 'string',
              description: 'Region, state, or area name',
            },
            alertType: {
              type: 'string',
              description: 'Type of alert to filter',
              enum: ['weather', 'fire', 'earthquake', 'tsunami', 'flood', 'emergency', 'all'],
              default: 'all',
            },
            severity: {
              type: 'string',
              description: 'Minimum alert severity',
              enum: ['minor', 'moderate', 'severe', 'extreme'],
            },
            radius: {
              type: 'number',
              description: 'Search radius in kilometers',
              minimum: 1,
              maximum: 500,
              default: 50,
            },
          },
        },
      },
      {
        name: 'alert_fire',
        description: 'Get fire warnings and bushfire alerts',
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
            state: {
              type: 'string',
              description: 'Australian state or NZ region',
              enum: ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'NZ'],
            },
            fireRisk: {
              type: 'string',
              description: 'Fire danger rating',
              enum: ['low', 'moderate', 'high', 'very_high', 'severe', 'extreme', 'catastrophic'],
            },
            includeControlled: {
              type: 'boolean',
              description: 'Include controlled burns',
              default: false,
            },
          },
        },
      },
      {
        name: 'alert_earthquake',
        description: 'Get earthquake alerts and seismic activity',
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
            minMagnitude: {
              type: 'number',
              description: 'Minimum earthquake magnitude',
              minimum: 0,
              maximum: 10,
              default: 3.0,
            },
            timeRange: {
              type: 'string',
              description: 'Time range for earthquake data',
              enum: ['1hour', '24hours', '7days', '30days'],
              default: '24hours',
            },
            radius: {
              type: 'number',
              description: 'Search radius in kilometers',
              default: 100,
            },
          },
        },
      },
      {
        name: 'alert_tsunami',
        description: 'Get tsunami warnings and coastal alerts',
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
            coastalArea: {
              type: 'string',
              description: 'Coastal region or area name',
            },
            alertLevel: {
              type: 'string',
              description: 'Tsunami alert level',
              enum: ['advisory', 'watch', 'warning', 'all'],
              default: 'all',
            },
          },
        },
      },
      {
        name: 'alert_subscribe',
        description: 'Subscribe to alert notifications for a location',
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
            alertTypes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['weather', 'fire', 'earthquake', 'tsunami', 'flood', 'emergency'],
              },
              description: 'Types of alerts to subscribe to',
            },
            notificationMethod: {
              type: 'string',
              description: 'Notification delivery method',
              enum: ['webhook', 'email', 'sms'],
              default: 'webhook',
            },
            endpoint: {
              type: 'string',
              description: 'Notification endpoint (URL, email, or phone)',
            },
          },
          required: ['latitude', 'longitude', 'alertTypes', 'endpoint'],
        },
      },
    ];
  },

  async call(name: string, args: any): Promise<MCPToolResult> {
    try {
      switch (name) {
        case 'alert_active':
          return await this.getActiveAlerts(args);
        case 'alert_fire':
          return await this.getFireAlerts(args);
        case 'alert_earthquake':
          return await this.getEarthquakeAlerts(args);
        case 'alert_tsunami':
          return await this.getTsunamiAlerts(args);
        case 'alert_subscribe':
          return await this.subscribeToAlerts(args);
        default:
          throw new Error(`Unknown alert tool: ${name}`);
      }
    } catch (error) {
      logger.error(`Alert tool error: ${error}`);
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

  async getActiveAlerts(args: LocationQuery & { alertType?: string; severity?: string; radius?: number }): Promise<MCPToolResult> {
    const { latitude, longitude, region, alertType = 'all', severity, radius = 50 } = args;
    
    const params = new URLSearchParams();
    if (latitude && longitude) {
      params.append('lat', latitude.toString());
      params.append('lon', longitude.toString());
      params.append('radius', radius.toString());
    }
    if (region) params.append('region', region);
    if (alertType !== 'all') params.append('type', alertType);
    if (severity) params.append('severity', severity);

    const response = await axios.get(
      `${env.BACKEND_API_URL}/api/alerts/active?${params.toString()}`,
      { timeout: env.API_TIMEOUT }
    );

    const alerts: AlertData[] = response.data;
    const criticalAlerts = alerts.filter(alert => alert.severity === 'extreme' || alert.severity === 'severe');

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            totalAlerts: alerts.length,
            criticalAlerts: criticalAlerts.length,
            alerts: alerts,
            summary: alerts.length > 0 
              ? `${alerts.length} active alert(s) found${criticalAlerts.length > 0 ? `, ${criticalAlerts.length} critical` : ''}`
              : 'No active alerts found',
          }, null, 2),
        },
      ],
    };
  },

  async getFireAlerts(args: { latitude?: number; longitude?: number; state?: string; fireRisk?: string; includeControlled?: boolean }): Promise<MCPToolResult> {
    const { latitude, longitude, state, fireRisk, includeControlled = false } = args;
    
    const params = new URLSearchParams();
    if (latitude && longitude) {
      params.append('lat', latitude.toString());
      params.append('lon', longitude.toString());
    }
    if (state) params.append('state', state);
    if (fireRisk) params.append('risk', fireRisk);
    if (includeControlled) params.append('controlled', 'true');

    const response = await axios.get(
      `${env.BACKEND_API_URL}/api/alerts/fire?${params.toString()}`,
      { timeout: env.API_TIMEOUT }
    );

    const fireAlerts = response.data;
    const emergencyFires = fireAlerts.filter((alert: any) => 
      alert.severity === 'extreme' || alert.type === 'emergency_warning'
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            totalFireAlerts: fireAlerts.length,
            emergencyFires: emergencyFires.length,
            currentFireDanger: fireAlerts.fireDangerRating,
            alerts: fireAlerts.alerts,
            summary: `${fireAlerts.length} fire alert(s)${emergencyFires.length > 0 ? `, ${emergencyFires.length} emergency level` : ''}. Current fire danger: ${fireAlerts.fireDangerRating || 'Unknown'}`,
          }, null, 2),
        },
      ],
    };
  },

  async getEarthquakeAlerts(args: { latitude?: number; longitude?: number; minMagnitude?: number; timeRange?: string; radius?: number }): Promise<MCPToolResult> {
    const { latitude, longitude, minMagnitude = 3.0, timeRange = '24hours', radius = 100 } = args;
    
    const params = new URLSearchParams({
      'min_magnitude': minMagnitude.toString(),
      'time_range': timeRange,
    });
    
    if (latitude && longitude) {
      params.append('lat', latitude.toString());
      params.append('lon', longitude.toString());
      params.append('radius', radius.toString());
    }

    const response = await axios.get(
      `${env.BACKEND_API_URL}/api/alerts/earthquake?${params.toString()}`,
      { timeout: env.API_TIMEOUT }
    );

    const earthquakeData = response.data;
    const significantEarthquakes = earthquakeData.earthquakes.filter((eq: any) => eq.magnitude >= 5.0);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            totalEarthquakes: earthquakeData.earthquakes.length,
            significantEarthquakes: significantEarthquakes.length,
            timeRange: timeRange,
            earthquakes: earthquakeData.earthquakes,
            summary: `${earthquakeData.earthquakes.length} earthquake(s) M${minMagnitude}+ in the last ${timeRange}${significantEarthquakes.length > 0 ? `, ${significantEarthquakes.length} significant (M5.0+)` : ''}`,
          }, null, 2),
        },
      ],
    };
  },

  async getTsunamiAlerts(args: { latitude?: number; longitude?: number; coastalArea?: string; alertLevel?: string }): Promise<MCPToolResult> {
    const { latitude, longitude, coastalArea, alertLevel = 'all' } = args;
    
    const params = new URLSearchParams();
    if (latitude && longitude) {
      params.append('lat', latitude.toString());
      params.append('lon', longitude.toString());
    }
    if (coastalArea) params.append('area', coastalArea);
    if (alertLevel !== 'all') params.append('level', alertLevel);

    const response = await axios.get(
      `${env.BACKEND_API_URL}/api/alerts/tsunami?${params.toString()}`,
      { timeout: env.API_TIMEOUT }
    );

    const tsunamiData = response.data;
    const activeWarnings = tsunamiData.alerts.filter((alert: any) => 
      alert.isActive && (alert.level === 'warning' || alert.level === 'watch')
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            totalAlerts: tsunamiData.alerts.length,
            activeWarnings: activeWarnings.length,
            threatLevel: tsunamiData.threatLevel,
            alerts: tsunamiData.alerts,
            summary: activeWarnings.length > 0 
              ? `${activeWarnings.length} active tsunami warning(s). Threat level: ${tsunamiData.threatLevel}`
              : `No active tsunami warnings. Threat level: ${tsunamiData.threatLevel}`,
          }, null, 2),
        },
      ],
    };
  },

  async subscribeToAlerts(args: { 
    latitude: number; 
    longitude: number; 
    alertTypes: string[]; 
    notificationMethod: string; 
    endpoint: string 
  }): Promise<MCPToolResult> {
    const { latitude, longitude, alertTypes, notificationMethod, endpoint } = args;
    
    const subscriptionData = {
      location: { latitude, longitude },
      alertTypes,
      notificationMethod,
      endpoint,
    };

    const response = await axios.post(
      `${env.BACKEND_API_URL}/api/alerts/subscribe`,
      subscriptionData,
      { 
        timeout: env.API_TIMEOUT,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const subscription = response.data;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            subscriptionId: subscription.id,
            location: subscription.location,
            alertTypes: subscription.alertTypes,
            notificationMethod: subscription.notificationMethod,
            status: subscription.status,
            created: subscription.created,
            summary: `Successfully subscribed to ${alertTypes.join(', ')} alerts via ${notificationMethod}`,
          }, null, 2),
        },
      ],
    };
  },
};