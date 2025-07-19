# MCP Server Testing Examples

This document provides comprehensive testing examples for the Live Conditions MCP Server, including unit tests, integration tests, and manual testing scenarios.

## Table of Contents

- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [Manual Testing](#manual-testing)
- [Performance Testing](#performance-testing)
- [Error Handling Testing](#error-handling-testing)

## Unit Testing

### Jest Test Setup

```json
// package.json (test dependencies)
{
  "devDependencies": {
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "@types/jest": "^29.5.8",
    "supertest": "^6.3.3",
    "nock": "^13.4.0"
  },
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
```

### Weather Tools Tests

```typescript
// tests/tools/weather.test.ts
import { weatherTools } from '../../src/tools/weather';
import nock from 'nock';

describe('Weather Tools', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('weather_current', () => {
    it('should return current weather for valid coordinates', async () => {
      // Mock backend API response
      nock('http://localhost:5000')
        .get('/api/weather/current')
        .query({
          lat: '-33.8688',
          lon: '151.2093',
          units: 'metric'
        })
        .reply(200, {
          location: {
            name: 'Sydney',
            country: 'AU',
            latitude: -33.8688,
            longitude: 151.2093
          },
          current: {
            temperature: 22,
            feelsLike: 24,
            humidity: 65,
            pressure: 1015,
            windSpeed: 15,
            windDirection: 45,
            condition: 'Partly cloudy',
            description: 'Partly cloudy with light winds'
          },
          timestamp: '2024-01-15T10:30:00Z'
        });

      const result = await weatherTools.call('weather_current', {
        latitude: -33.8688,
        longitude: 151.2093,
        units: 'metric'
      });

      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      const data = JSON.parse(result.content[0].text);
      expect(data.location.name).toBe('Sydney');
      expect(data.current.temperature).toBe(22);
      expect(data.summary).toContain('Sydney');
    });

    it('should handle missing coordinates', async () => {
      const result = await weatherTools.call('weather_current', {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Either coordinates');
    });

    it('should handle API errors gracefully', async () => {
      nock('http://localhost:5000')
        .get('/api/weather/current')
        .query(true)
        .reply(500, { error: 'Internal server error' });

      const result = await weatherTools.call('weather_current', {
        latitude: -33.8688,
        longitude: 151.2093
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error');
    });
  });

  describe('weather_forecast', () => {
    it('should return weather forecast', async () => {
      nock('http://localhost:5000')
        .get('/api/weather/forecast')
        .query({
          lat: '-33.8688',
          lon: '151.2093',
          days: '3',
          units: 'metric'
        })
        .reply(200, {
          location: { name: 'Sydney' },
          forecast: [
            { date: '2024-01-15', temperature: { min: 18, max: 25 } },
            { date: '2024-01-16', temperature: { min: 19, max: 26 } },
            { date: '2024-01-17', temperature: { min: 20, max: 27 } }
          ]
        });

      const result = await weatherTools.call('weather_forecast', {
        latitude: -33.8688,
        longitude: 151.2093,
        days: 3
      });

      expect(result).toBeDefined();
      expect(result.isError).toBeFalsy();
      
      const data = JSON.parse(result.content[0].text);
      expect(data.forecast).toHaveLength(3);
    });
  });

  describe('weather_alerts', () => {
    it('should return active weather alerts', async () => {
      nock('http://localhost:5000')
        .get('/api/weather/alerts')
        .query({
          lat: '-33.8688',
          lon: '151.2093'
        })
        .reply(200, [
          {
            id: 'alert-1',
            type: 'weather',
            severity: 'moderate',
            title: 'Strong Wind Warning',
            isActive: true
          }
        ]);

      const result = await weatherTools.call('weather_alerts', {
        latitude: -33.8688,
        longitude: 151.2093
      });

      expect(result).toBeDefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.activeAlerts).toBe(1);
      expect(data.alerts[0].title).toBe('Strong Wind Warning');
    });
  });
});
```

### Marine Tools Tests

```typescript
// tests/tools/marine.test.ts
import { marineTools } from '../../src/tools/marine';
import nock from 'nock';

describe('Marine Tools', () => {
  describe('marine_conditions', () => {
    it('should return marine conditions for valid coordinates', async () => {
      nock('http://localhost:5000')
        .get('/api/ocean/conditions')
        .query({
          lat: '-33.8915',
          lon: '151.2767',
          forecast: 'true'
        })
        .reply(200, {
          location: {
            name: 'Bondi Beach',
            latitude: -33.8915,
            longitude: 151.2767
          },
          conditions: {
            waveHeight: 1.2,
            wavePeriod: 8,
            waveDirection: 135,
            seaSurfaceTemperature: 19,
            tideLevel: 0.8
          },
          forecast: {
            nextTide: {
              type: 'high',
              time: '14:30',
              height: 1.6
            }
          },
          timestamp: '2024-01-15T10:30:00Z'
        });

      const result = await marineTools.call('marine_conditions', {
        latitude: -33.8915,
        longitude: 151.2767,
        includeForecast: true
      });

      expect(result).toBeDefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.location.name).toBe('Bondi Beach');
      expect(data.conditions.waveHeight).toBe(1.2);
      expect(data.summary).toContain('1.2m');
    });

    it('should handle location name input', async () => {
      nock('http://localhost:5000')
        .get('/api/ocean/conditions')
        .query({
          location: 'Byron Bay',
          forecast: 'true'
        })
        .reply(200, {
          location: { name: 'Byron Bay' },
          conditions: { waveHeight: 1.5 },
          forecast: {},
          timestamp: '2024-01-15T10:30:00Z'
        });

      const result = await marineTools.call('marine_conditions', {
        location: 'Byron Bay'
      });

      expect(result).toBeDefined();
      expect(result.isError).toBeFalsy();
    });
  });

  describe('marine_tides', () => {
    it('should return tide information', async () => {
      nock('http://localhost:5000')
        .get('/api/ocean/tides')
        .query({
          lat: '-33.8915',
          lon: '151.2767',
          days: '1'
        })
        .reply(200, {
          location: { name: 'Bondi Beach' },
          tides: [
            { type: 'high', time: '06:30', height: 1.4 },
            { type: 'low', time: '12:15', height: 0.3 },
            { type: 'high', time: '18:45', height: 1.6 }
          ]
        });

      const result = await marineTools.call('marine_tides', {
        latitude: -33.8915,
        longitude: 151.2767,
        days: 1
      });

      expect(result).toBeDefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.tides).toHaveLength(3);
    });
  });
});
```

### Alert Tools Tests

```typescript
// tests/tools/alerts.test.ts
import { alertTools } from '../../src/tools/alerts';
import nock from 'nock';

describe('Alert Tools', () => {
  describe('alert_active', () => {
    it('should return active alerts for location', async () => {
      nock('http://localhost:5000')
        .get('/api/alerts/active')
        .query({
          lat: '-37.8136',
          lon: '144.9631',
          radius: '50'
        })
        .reply(200, [
          {
            id: 'alert-1',
            type: 'fire',
            severity: 'severe',
            title: 'Bushfire Emergency Warning',
            description: 'Immediate threat to life',
            areas: ['Dandenong Ranges'],
            isActive: true,
            issued: '2024-01-15T08:00:00Z'
          }
        ]);

      const result = await alertTools.call('alert_active', {
        latitude: -37.8136,
        longitude: 144.9631,
        radius: 50
      });

      expect(result).toBeDefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.totalAlerts).toBe(1);
      expect(data.criticalAlerts).toBe(1);
      expect(data.alerts[0].type).toBe('fire');
    });

    it('should filter alerts by type', async () => {
      nock('http://localhost:5000')
        .get('/api/alerts/active')
        .query({
          lat: '-37.8136',
          lon: '144.9631',
          radius: '50',
          type: 'fire'
        })
        .reply(200, []);

      const result = await alertTools.call('alert_active', {
        latitude: -37.8136,
        longitude: 144.9631,
        radius: 50,
        alertType: 'fire'
      });

      expect(result).toBeDefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.totalAlerts).toBe(0);
    });
  });

  describe('alert_subscribe', () => {
    it('should create alert subscription', async () => {
      nock('http://localhost:5000')
        .post('/api/alerts/subscribe')
        .reply(200, {
          id: 'sub-123',
          location: { latitude: -33.8688, longitude: 151.2093 },
          alertTypes: ['weather', 'fire'],
          notificationMethod: 'webhook',
          status: 'active',
          created: '2024-01-15T10:30:00Z'
        });

      const result = await alertTools.call('alert_subscribe', {
        latitude: -33.8688,
        longitude: 151.2093,
        alertTypes: ['weather', 'fire'],
        notificationMethod: 'webhook',
        endpoint: 'https://example.com/webhook'
      });

      expect(result).toBeDefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.subscriptionId).toBe('sub-123');
      expect(data.status).toBe('active');
    });
  });
});
```

## Integration Testing

### MCP Server Integration Tests

```typescript
// tests/integration/mcp-server.test.ts
import { spawn, ChildProcess } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

describe('MCP Server Integration', () => {
  let serverProcess: ChildProcess;
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    // Start the MCP server
    serverProcess = spawn('node', ['dist/index.js'], {
      env: {
        ...process.env,
        BACKEND_API_URL: 'http://localhost:5000',
        NODE_ENV: 'test'
      }
    });

    // Create client and transport
    transport = new StdioClientTransport({
      stdin: serverProcess.stdin,
      stdout: serverProcess.stdout,
      stderr: serverProcess.stderr
    });

    client = new Client({
      name: 'test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    await client.connect(transport);
  }, 30000);

  afterAll(async () => {
    if (client) {
      await client.close();
    }
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  describe('Tool Listing', () => {
    it('should list all available tools', async () => {
      const result = await client.listTools();
      
      expect(result.tools).toHaveLength(25); // Expected number of tools
      
      const toolNames = result.tools.map(tool => tool.name);
      expect(toolNames).toContain('weather_current');
      expect(toolNames).toContain('marine_conditions');
      expect(toolNames).toContain('traffic_incidents');
      expect(toolNames).toContain('alert_active');
      expect(toolNames).toContain('integration_health');
    });
  });

  describe('Resource Listing', () => {
    it('should list all available resources', async () => {
      const result = await client.listResources();
      
      expect(result.resources.length).toBeGreaterThan(0);
      
      const resourceUris = result.resources.map(resource => resource.uri);
      expect(resourceUris).toContain('conditions://weather/current');
      expect(resourceUris).toContain('conditions://marine/current');
      expect(resourceUris).toContain('conditions://alerts/active');
    });
  });

  describe('Prompt Listing', () => {
    it('should list all available prompts', async () => {
      const result = await client.listPrompts();
      
      expect(result.prompts.length).toBeGreaterThan(0);
      
      const promptNames = result.prompts.map(prompt => prompt.name);
      expect(promptNames).toContain('analyze_conditions');
      expect(promptNames).toContain('safety_assessment');
      expect(promptNames).toContain('travel_planning');
    });
  });

  describe('Tool Execution', () => {
    it('should execute weather tool successfully', async () => {
      const result = await client.callTool({
        name: 'weather_current',
        arguments: {
          latitude: -33.8688,
          longitude: 151.2093,
          units: 'metric'
        }
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBeFalsy();
    });

    it('should handle tool execution errors', async () => {
      const result = await client.callTool({
        name: 'weather_current',
        arguments: {} // Missing required arguments
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error');
    });
  });

  describe('Resource Reading', () => {
    it('should read weather conditions resource', async () => {
      const result = await client.readResource({
        uri: 'conditions://weather/current'
      });

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].type).toBe('text');
      expect(result.contents[0].mimeType).toBe('application/json');
      
      const data = JSON.parse(result.contents[0].text);
      expect(data.description).toContain('weather conditions');
      expect(data.cities).toBeDefined();
    });
  });

  describe('Prompt Execution', () => {
    it('should execute safety assessment prompt', async () => {
      const result = await client.getPrompt({
        name: 'safety_assessment',
        arguments: {
          activity: 'surfing',
          location: 'Bondi Beach',
          experience_level: 'intermediate'
        }
      });

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content.text).toContain('safety assessment');
      expect(result.messages[0].content.text).toContain('surfing');
      expect(result.messages[0].content.text).toContain('Bondi Beach');
    });
  });
});
```

### End-to-End Testing

```typescript
// tests/e2e/weather-workflow.test.ts
import { LiveConditionsClient } from '../helpers/test-client';

describe('Weather Workflow E2E', () => {
  let client: LiveConditionsClient;

  beforeAll(async () => {
    client = new LiveConditionsClient();
    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
  });

  it('should complete full weather analysis workflow', async () => {
    // 1. Get current weather
    const weather = await client.getCurrentWeather(-33.8688, 151.2093);
    expect(weather.location.name).toBe('Sydney');
    expect(weather.current.temperature).toBeDefined();

    // 2. Get weather forecast
    const forecast = await client.getForecast(-33.8688, 151.2093, 3);
    expect(forecast.forecast).toBeDefined();

    // 3. Check for weather alerts
    const alerts = await client.getWeatherAlerts(-33.8688, 151.2093);
    expect(alerts.totalAlerts).toBeDefined();

    // 4. Get safety assessment
    const safety = await client.getSafetyAssessment(
      'hiking', 
      'Blue Mountains', 
      'intermediate'
    );
    expect(safety).toContain('safety');

    console.log('Weather workflow completed successfully');
  });

  it('should handle marine conditions workflow', async () => {
    // 1. Get marine conditions
    const marine = await client.getMarineConditions(-33.8915, 151.2767);
    expect(marine.location.name).toContain('Bondi');

    // 2. Get tide information
    const tides = await client.getTides(-33.8915, 151.2767, 1);
    expect(tides.tides).toBeDefined();

    // 3. Safety assessment for surfing
    const surfSafety = await client.getSafetyAssessment(
      'surfing',
      'Bondi Beach',
      'intermediate'
    );
    expect(surfSafety).toContain('surfing');

    console.log('Marine workflow completed successfully');
  });
});
```

## Manual Testing

### Manual Test Cases

```typescript
// tests/manual/test-scenarios.ts

/**
 * Manual Test Scenarios for Live Conditions MCP Server
 * 
 * Run these tests manually using Claude Desktop or MCP client
 */

export const manualTestScenarios = [
  {
    name: 'Weather Query - Sydney',
    description: 'Get current weather for Sydney, Australia',
    tool: 'weather_current',
    arguments: {
      city: 'Sydney',
      country: 'AU',
      units: 'metric'
    },
    expectedFields: ['location', 'current', 'timestamp'],
    validation: (result) => {
      return result.location.name === 'Sydney' && 
             result.current.temperature !== undefined;
    }
  },

  {
    name: 'Marine Conditions - Bondi Beach',
    description: 'Get marine conditions for Bondi Beach',
    tool: 'marine_conditions',
    arguments: {
      latitude: -33.8915,
      longitude: 151.2767,
      includeForecast: true
    },
    expectedFields: ['location', 'conditions', 'forecast'],
    validation: (result) => {
      return result.conditions.waveHeight !== undefined &&
             result.forecast.nextTide !== undefined;
    }
  },

  {
    name: 'Emergency Alerts - Melbourne',
    description: 'Check emergency alerts around Melbourne',
    tool: 'alert_active',
    arguments: {
      latitude: -37.8136,
      longitude: 144.9631,
      radius: 50,
      alertType: 'all'
    },
    expectedFields: ['totalAlerts', 'alerts'],
    validation: (result) => {
      return typeof result.totalAlerts === 'number';
    }
  },

  {
    name: 'Traffic Incidents - Sydney to Melbourne Route',
    description: 'Get traffic incidents for major highway route',
    tool: 'traffic_routes',
    arguments: {
      origin: { latitude: -33.8688, longitude: 151.2093, name: 'Sydney' },
      destination: { latitude: -37.8136, longitude: 144.9631, name: 'Melbourne' },
      routeType: 'fastest'
    },
    expectedFields: ['origin', 'destination', 'primaryRoute'],
    validation: (result) => {
      return result.primaryRoute.duration !== undefined;
    }
  },

  {
    name: 'Safety Assessment - Surfing',
    description: 'Assess safety for intermediate surfer at Gold Coast',
    prompt: 'safety_assessment',
    arguments: {
      activity: 'surfing',
      location: 'Gold Coast',
      experience_level: 'intermediate'
    },
    validation: (result) => {
      return result.messages[0].content.text.includes('safety') &&
             result.messages[0].content.text.includes('surfing');
    }
  },

  {
    name: 'Data Quality Check',
    description: 'Check overall data quality across all sources',
    tool: 'integration_data_quality',
    arguments: {
      dataSource: 'all',
      includeRecommendations: true
    },
    expectedFields: ['overallQuality', 'sources'],
    validation: (result) => {
      return result.overallQuality >= 0 && result.overallQuality <= 1;
    }
  },

  {
    name: 'Health Status Check',
    description: 'Check health of all backend services',
    tool: 'integration_health',
    arguments: {
      includeMetrics: true,
      checkExternalAPIs: true
    },
    expectedFields: ['overallStatus', 'services'],
    validation: (result) => {
      return ['healthy', 'degraded', 'unhealthy'].includes(result.overallStatus);
    }
  }
];

/**
 * Resource Testing Scenarios
 */
export const resourceTestScenarios = [
  {
    name: 'Current Weather Resource',
    uri: 'conditions://weather/current',
    expectedFields: ['timestamp', 'cities'],
    validation: (result) => {
      return Array.isArray(result.cities) && result.cities.length > 0;
    }
  },

  {
    name: 'Active Alerts Resource',
    uri: 'conditions://alerts/active',
    expectedFields: ['timestamp', 'summary'],
    validation: (result) => {
      return result.timestamp !== undefined;
    }
  },

  {
    name: 'API Schema Resource',
    uri: 'conditions://api/schema',
    expectedFields: ['schema', 'endpoints'],
    validation: (result) => {
      return result.schema.version !== undefined;
    }
  }
];

/**
 * Run manual tests with this helper function
 */
export async function runManualTest(client, scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📝 Description: ${scenario.description}`);
  
  try {
    let result;
    
    if (scenario.tool) {
      result = await client.callTool({
        name: scenario.tool,
        arguments: scenario.arguments
      });
      
      if (result.isError) {
        console.log('❌ Test failed with error:', result.content[0].text);
        return false;
      }
      
      result = JSON.parse(result.content[0].text);
    } else if (scenario.prompt) {
      result = await client.getPrompt({
        name: scenario.prompt,
        arguments: scenario.arguments
      });
    } else if (scenario.uri) {
      const resourceResult = await client.readResource({
        uri: scenario.uri
      });
      result = JSON.parse(resourceResult.contents[0].text);
    }
    
    // Check expected fields
    if (scenario.expectedFields) {
      for (const field of scenario.expectedFields) {
        if (result[field] === undefined) {
          console.log(`❌ Missing expected field: ${field}`);
          return false;
        }
      }
    }
    
    // Run custom validation
    if (scenario.validation && !scenario.validation(result)) {
      console.log('❌ Custom validation failed');
      return false;
    }
    
    console.log('✅ Test passed');
    console.log('📊 Result sample:', JSON.stringify(result, null, 2).substring(0, 200) + '...');
    return true;
    
  } catch (error) {
    console.log('❌ Test failed with exception:', error.message);
    return false;
  }
}
```

## Performance Testing

### Load Testing

```typescript
// tests/performance/load-test.ts
import { LiveConditionsClient } from '../helpers/test-client';

describe('Performance Testing', () => {
  const clients: LiveConditionsClient[] = [];
  const concurrentRequests = 10;
  const requestsPerClient = 50;

  beforeAll(async () => {
    // Create multiple clients
    for (let i = 0; i < concurrentRequests; i++) {
      const client = new LiveConditionsClient();
      await client.connect();
      clients.push(client);
    }
  });

  afterAll(async () => {
    // Cleanup clients
    await Promise.all(clients.map(client => client.disconnect()));
  });

  it('should handle concurrent weather requests', async () => {
    const startTime = Date.now();
    
    const promises = clients.map(async (client, index) => {
      const results = [];
      
      for (let i = 0; i < requestsPerClient; i++) {
        const result = await client.getCurrentWeather(
          -33.8688 + (Math.random() - 0.5) * 0.1, // Vary coordinates slightly
          151.2093 + (Math.random() - 0.5) * 0.1
        );
        results.push(result);
      }
      
      return results;
    });

    const allResults = await Promise.all(promises);
    const endTime = Date.now();
    
    const totalRequests = concurrentRequests * requestsPerClient;
    const duration = endTime - startTime;
    const requestsPerSecond = (totalRequests / duration) * 1000;
    
    console.log(`Performance Results:`);
    console.log(`Total requests: ${totalRequests}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Requests per second: ${requestsPerSecond.toFixed(2)}`);
    
    // Verify all requests succeeded
    expect(allResults.flat().length).toBe(totalRequests);
    
    // Performance thresholds
    expect(requestsPerSecond).toBeGreaterThan(5); // At least 5 RPS
    expect(duration).toBeLessThan(60000); // Complete within 60 seconds
  }, 120000);

  it('should maintain response times under load', async () => {
    const responseTimes: number[] = [];
    
    const promise = clients[0].getCurrentWeather(-33.8688, 151.2093);
    const startTime = Date.now();
    
    // Measure response time for single request
    for (let i = 0; i < 20; i++) {
      const reqStart = Date.now();
      await clients[0].getCurrentWeather(
        -33.8688 + Math.random() * 0.1,
        151.2093 + Math.random() * 0.1
      );
      const reqEnd = Date.now();
      responseTimes.push(reqEnd - reqStart);
    }
    
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    
    console.log(`Average response time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Max response time: ${maxResponseTime}ms`);
    
    expect(avgResponseTime).toBeLessThan(2000); // Average under 2 seconds
    expect(maxResponseTime).toBeLessThan(5000); // Max under 5 seconds
  });
});
```

### Memory Usage Testing

```typescript
// tests/performance/memory-test.ts
describe('Memory Usage Testing', () => {
  it('should not have memory leaks during extended operation', async () => {
    const client = new LiveConditionsClient();
    await client.connect();
    
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Run many operations
    for (let i = 0; i < 1000; i++) {
      await client.getCurrentWeather(-33.8688, 151.2093);
      
      // Force garbage collection periodically
      if (i % 100 === 0 && global.gc) {
        global.gc();
      }
    }
    
    // Force final garbage collection
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    console.log(`Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Final memory: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
    
    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    
    await client.disconnect();
  }, 300000); // 5 minute timeout
});
```

## Error Handling Testing

### Error Scenarios

```typescript
// tests/error-handling/error-scenarios.test.ts
describe('Error Handling', () => {
  let client: LiveConditionsClient;

  beforeAll(async () => {
    client = new LiveConditionsClient();
    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
  });

  describe('Invalid Input Handling', () => {
    it('should handle invalid coordinates gracefully', async () => {
      const result = await client.client.callTool({
        name: 'weather_current',
        arguments: {
          latitude: 999, // Invalid latitude
          longitude: 151.2093
        }
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error');
    });

    it('should handle missing required arguments', async () => {
      const result = await client.client.callTool({
        name: 'weather_current',
        arguments: {} // Missing required arguments
      });

      expect(result.isError).toBe(true);
    });

    it('should handle unknown tool names', async () => {
      try {
        await client.client.callTool({
          name: 'unknown_tool',
          arguments: {}
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Unknown tool');
      }
    });
  });

  describe('Backend Service Errors', () => {
    it('should handle backend service unavailable', async () => {
      // This test requires the backend to be stopped
      // Mock or configure test environment accordingly
      
      const result = await client.client.callTool({
        name: 'weather_current',
        arguments: {
          latitude: -33.8688,
          longitude: 151.2093
        }
      });

      // Should handle gracefully, not crash the server
      expect(result).toBeDefined();
    });

    it('should handle timeout scenarios', async () => {
      // Test with very long timeout scenario
      const result = await client.client.callTool({
        name: 'integration_health',
        arguments: {
          checkExternalAPIs: true
        }
      });

      expect(result).toBeDefined();
    });
  });

  describe('Resource Error Handling', () => {
    it('should handle invalid resource URIs', async () => {
      try {
        await client.client.readResource({
          uri: 'invalid://resource/uri'
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Unknown resource URI');
      }
    });
  });
});
```

### Test Utilities

```typescript
// tests/helpers/test-client.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn, ChildProcess } from 'child_process';

export class LiveConditionsClient {
  private client: Client;
  private transport: StdioClientTransport;
  private serverProcess: ChildProcess;

  async connect() {
    // Start server process
    this.serverProcess = spawn('node', ['dist/index.js'], {
      env: {
        ...process.env,
        BACKEND_API_URL: process.env.TEST_BACKEND_URL || 'http://localhost:5000',
        NODE_ENV: 'test'
      }
    });

    // Create transport and client
    this.transport = new StdioClientTransport({
      stdin: this.serverProcess.stdin,
      stdout: this.serverProcess.stdout,
      stderr: this.serverProcess.stderr
    });

    this.client = new Client({
      name: 'test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    await this.client.connect(this.transport);
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
    }
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
  }

  async getCurrentWeather(lat: number, lon: number) {
    const result = await this.client.callTool({
      name: 'weather_current',
      arguments: { latitude: lat, longitude: lon }
    });
    
    if (result.isError) {
      throw new Error(result.content[0].text);
    }
    
    return JSON.parse(result.content[0].text);
  }

  // Add other helper methods as needed...
}
```

## Running Tests

### Test Commands

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testPathPattern=weather
npm test -- --testPathPattern=integration
npm test -- --testPathPattern=performance

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run performance tests (requires longer timeout)
npm test -- --testTimeout=300000 --testPathPattern=performance
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test MCP Server

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build server
      run: npm run build
      
    - name: Run unit tests
      run: npm test -- --testPathPattern="unit|tools"
      
    - name: Run integration tests
      run: npm test -- --testPathPattern=integration
      env:
        TEST_BACKEND_URL: http://localhost:5000
        
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

These testing examples provide comprehensive coverage for the Live Conditions MCP Server, ensuring reliability, performance, and proper error handling across all components.