# API Integration Guide for Aotearoa & Aussie Live Conditions

## Overview
This document provides comprehensive integration strategies for real-time data sources covering Australia and New Zealand's live conditions including weather, emergencies, traffic, marine conditions, and geological events.

## Table of Contents
1. [Australian Data Sources](#australian-data-sources)
2. [New Zealand Data Sources](#new-zealand-data-sources)
3. [Authentication Requirements](#authentication-requirements)
4. [Data Formats and Standards](#data-formats-and-standards)
5. [Rate Limiting and Caching](#rate-limiting-and-caching)
6. [Fallback Strategies](#fallback-strategies)
7. [Implementation Examples](#implementation-examples)

---

## Australian Data Sources

### 1. Bureau of Meteorology (BOM) - Weather Data

**Base URL**: `http://www.bom.gov.au/`
**Primary Endpoints**:
- FTP Data: `ftp://ftp.bom.gov.au/anon/gen/`
- Weather API (Beta): `http://api.weather.bom.gov.au/`
- Space Weather API: `https://sws-data.sws.bom.gov.au/`

**Data Types**:
- Real-time weather observations (JSON, XML, CAP)
- Radar images (6-10 minute frequency)
- Satellite imagery (10 minute updates)
- Weather warnings and forecasts
- Wave height forecasts from Auswave model

**Update Frequency**: 6-10 minutes for radar, 10 minutes for satellite
**Authentication**: Registration required for Space Weather API
**Rate Limits**: Not officially documented; recommend 1 request per minute for courtesy

### 2. NSW Rural Fire Service (RFS) - Fire Emergency Data

**Base URL**: `https://www.rfs.nsw.gov.au/`
**Primary Endpoints**:
- Major Incidents GeoJSON: `https://www.rfs.nsw.gov.au/feeds/majorIncidents.json`
- Major Fire Updates XML: `https://www.rfs.nsw.gov.au/feeds/major-Fire-Updates.xml`
- CAP Format: `https://www.rfs.nsw.gov.au/feeds/majorIncidentsCAP.xml`

**Data Types**:
- Active fire incidents with location, status, and alert level
- Fire danger ratings
- Total Fire Ban declarations
- Emergency warnings

**Update Frequency**: Every 30 minutes
**Authentication**: None required
**Rate Limits**: Not specified; recommend max 2 requests per minute

### 3. Transport for NSW - Traffic Data

**Base URL**: `https://opendata.transport.nsw.gov.au/`
**Primary Endpoints**:
- Real-time Public Transport API
- Traffic Camera API
- Historical Traffic API
- Car Park Occupancy API

**Data Types**:
- Real-time incident data (crashes, breakdowns, floods)
- Traffic camera feeds (60-second updates)
- Road condition information
- Public transport delays and disruptions

**Update Frequency**: Real-time to 60 seconds
**Authentication**: API key required (free registration)
**Rate Limits**: Varies by endpoint; typically 1000 requests/hour

### 4. Queensland Traffic and Emergency Services

**Base URL**: `https://www.data.qld.gov.au/`
**Primary Endpoints**:
- QLDTraffic GeoJSON API
- QFES Current Incidents Dashboard (web-only)

**Data Types**:
- Hazards, crashes, congestion
- Flooding and roadworks
- Special events and web cameras

**Update Frequency**: Real-time updates
**Authentication**: None for public feeds
**Rate Limits**: Fair use policy applies

### 5. Victoria Emergency Services

**Base URL**: `https://emergency.vic.gov.au/`
**Status**: Limited public API access
**Data Types**: Emergency warnings and incidents (web interface only)
**Note**: VicEmergency data feed not publicly available as of 2025

---

## New Zealand Data Sources

### 1. GeoNet - Geological Monitoring

**Base URL**: `https://api.geonet.org.nz/`
**Primary Endpoints**:
- Earthquake Feed: `/v1/intensity`
- Volcanic Alerts: `/v1/volcano/alert`
- Sensor Data: `/v1/sensor`
- Strong Motion Data: `/v1/strong-motion`

**Data Types**:
- Real-time earthquake data (location, magnitude, intensity)
- Volcanic alert levels for NZ volcanoes
- Seismic and acoustic sensor readings
- Strong motion accelerometer data

**Update Frequency**: Real-time (sub-minute for significant events)
**Authentication**: None required
**Rate Limits**: Fair use policy; recommend max 60 requests/hour
**Data Formats**: JSON, CAP, FDSN

### 2. NZTA Waka Kotahi - Transport Data

**Base URL**: `https://trafficnz.info/service/traffic/rest/4/`
**Primary Endpoints**:
- Traffic Conditions API
- Camera Images API
- Variable Message Signs API
- Travel Time Estimates API

**Data Types**:
- Real-time traffic conditions on state highways
- Travel time estimates
- Static camera images (100+ locations)
- Variable Message Sign content

**Update Frequency**: Real-time updates
**Authentication**: None required
**Rate Limits**: Not specified; recommend courtesy limits

### 3. MetService - Weather Data

**Base URL**: `https://www.metservice.com/`
**API Access**: Contact required for API access
**Data Types**:
- Weather forecasts and observations
- Marine and surf conditions
- Severe weather warnings

### 4. MetOcean Solutions - Marine Weather API

**Base URL**: `https://www.metocean.co.nz/`
**Primary Service**: Point Forecast API
**Data Types**:
- Ocean, terrestrial, and atmospheric data
- Wave height, swell direction, and period
- Maritime weather conditions

**Authentication**: API key required (commercial service)
**Rate Limits**: Based on subscription plan

---

## Authentication Requirements

### API Key Authentication
Most Australian transport APIs require registration:

```javascript
const headers = {
  'Authorization': `apikey ${API_KEY}`,
  'Content-Type': 'application/json'
};
```

### No Authentication Required
- NSW RFS feeds
- GeoNet APIs
- BOM FTP data
- NZTA traffic APIs

### Commercial Authentication
- MetOcean Solutions (New Zealand marine data)
- BOM Space Weather API (registration required)

---

## Data Formats and Standards

### Common Alerting Protocol (CAP)
Used by emergency services for standardized alert formatting:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>NSW_RFS_123456</identifier>
  <sender>nsw.rfs@emergency.gov.au</sender>
  <sent>2025-07-16T05:00:00+10:00</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>Fire</category>
    <event>Emergency Warning</event>
    <urgency>Immediate</urgency>
    <severity>Extreme</severity>
    <certainty>Observed</certainty>
  </info>
</alert>
```

### GeoJSON for Geographic Data
Standard format for location-based emergency and traffic data:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [151.2093, -33.8688]
      },
      "properties": {
        "title": "Emergency Incident",
        "category": "Fire",
        "status": "Going",
        "alertLevel": "Emergency Warning"
      }
    }
  ]
}
```

### FDSN (Federation of Digital Seismograph Networks)
Used by GeoNet for seismic data:

```
Network.Station.Location.Channel StartTime EndTime
NZ.WEL.10.HHZ 2025-07-16T00:00:00 2025-07-16T23:59:59
```

---

## Rate Limiting and Caching

### Recommended Request Patterns

| Data Source | Update Frequency | Recommended Poll Rate | Cache Duration |
|-------------|------------------|----------------------|----------------|
| NSW RFS Fire Data | 30 minutes | Every 5 minutes | 5 minutes |
| BOM Radar Images | 6-10 minutes | Every 10 minutes | 10 minutes |
| GeoNet Earthquakes | Real-time | Every 2 minutes | 2 minutes |
| NZTA Traffic | Real-time | Every 5 minutes | 3 minutes |
| Transport NSW | 60 seconds | Every 2 minutes | 2 minutes |

### Caching Strategy Implementation

```javascript
class DataCache {
  constructor(ttl = 300000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  async get(key, fetchFunction) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    try {
      const data = await fetchFunction();
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
      return data;
    } catch (error) {
      // Return stale data if available during failures
      return cached ? cached.data : null;
    }
  }
}
```

### Rate Limiting Implementation

```javascript
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.requests = [];
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async throttle() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.throttle();
    }
    
    this.requests.push(now);
  }
}
```

---

## Fallback Strategies

### 1. Data Source Redundancy

```javascript
const dataSourcePriority = [
  'primary_api',
  'secondary_api', 
  'cached_data',
  'static_fallback'
];

async function fetchWithFallback(sources) {
  for (const source of sources) {
    try {
      const data = await source.fetch();
      if (data && data.length > 0) {
        return data;
      }
    } catch (error) {
      console.warn(`Source ${source.name} failed:`, error.message);
      continue;
    }
  }
  throw new Error('All data sources failed');
}
```

### 2. Circuit Breaker Pattern

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}
```

### 3. Graceful Degradation

```javascript
const degradationLevels = {
  FULL: 'All data sources available',
  PARTIAL: 'Some data sources unavailable',
  MINIMAL: 'Only cached/essential data',
  OFFLINE: 'No live data available'
};

function determineServiceLevel(sourceStatus) {
  const available = Object.values(sourceStatus).filter(Boolean).length;
  const total = Object.keys(sourceStatus).length;
  const ratio = available / total;

  if (ratio >= 0.8) return 'FULL';
  if (ratio >= 0.5) return 'PARTIAL';
  if (ratio >= 0.2) return 'MINIMAL';
  return 'OFFLINE';
}
```

---

## Implementation Examples

### Emergency Data Aggregator

```javascript
class EmergencyDataAggregator {
  constructor() {
    this.cache = new DataCache(300000); // 5 minute cache
    this.rateLimiter = new RateLimiter(30, 60000); // 30 requests per minute
  }

  async getFireIncidents() {
    return this.cache.get('fire_incidents', async () => {
      await this.rateLimiter.throttle();
      
      const response = await fetch(
        'https://www.rfs.nsw.gov.au/feeds/majorIncidents.json'
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return response.json();
    });
  }

  async getEarthquakes() {
    return this.cache.get('earthquakes', async () => {
      await this.rateLimiter.throttle();
      
      const response = await fetch(
        'https://api.geonet.org.nz/v1/intensity?MMI=4'
      );
      
      return response.json();
    });
  }
}
```

### Weather Data Service

```javascript
class WeatherService {
  constructor() {
    this.bomCache = new DataCache(600000); // 10 minute cache
    this.metServiceCache = new DataCache(900000); // 15 minute cache
  }

  async getAustralianWeather(location) {
    // Attempt BOM first, fallback to third-party
    try {
      return await this.bomCache.get(`bom_${location}`, () => 
        this.fetchBOMData(location)
      );
    } catch (error) {
      return await this.getThirdPartyWeather(location);
    }
  }

  async getNewZealandWeather(location) {
    return this.metServiceCache.get(`nz_${location}`, () =>
      this.fetchMetServiceData(location)
    );
  }
}
```

### Data Transformation Pipeline

```javascript
class DataTransformer {
  static normalizeEmergencyAlert(source, rawData) {
    const transformers = {
      'nsw_rfs': this.transformNSWRFS,
      'geonet': this.transformGeoNet,
      'qld_traffic': this.transformQLDTraffic
    };

    return transformers[source]?.(rawData) || rawData;
  }

  static transformNSWRFS(data) {
    return data.features.map(feature => ({
      id: feature.properties.guid,
      type: 'fire',
      title: feature.properties.title,
      location: {
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0]
      },
      severity: this.mapRFSSeverity(feature.properties.category),
      status: feature.properties.status,
      lastUpdate: new Date(feature.properties.pubDate),
      source: 'NSW RFS'
    }));
  }

  static transformGeoNet(data) {
    return data.features.map(feature => ({
      id: feature.properties.publicid,
      type: 'earthquake',
      title: `Magnitude ${feature.properties.magnitude} earthquake`,
      location: {
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0]
      },
      magnitude: feature.properties.magnitude,
      depth: feature.geometry.coordinates[2],
      time: new Date(feature.properties.time),
      source: 'GeoNet'
    }));
  }
}
```

---

## Monitoring and Health Checks

### API Health Monitoring

```javascript
class APIHealthMonitor {
  constructor(sources) {
    this.sources = sources;
    this.healthStatus = {};
    this.checkInterval = 300000; // 5 minutes
  }

  startMonitoring() {
    setInterval(async () => {
      for (const [name, config] of Object.entries(this.sources)) {
        this.healthStatus[name] = await this.checkAPIHealth(config);
      }
    }, this.checkInterval);
  }

  async checkAPIHealth(config) {
    const start = Date.now();
    try {
      const response = await fetch(config.healthEndpoint, {
        method: 'HEAD',
        timeout: 10000
      });
      
      return {
        status: response.ok ? 'healthy' : 'degraded',
        responseTime: Date.now() - start,
        lastCheck: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - start,
        lastCheck: new Date()
      };
    }
  }

  getOverallHealth() {
    const statuses = Object.values(this.healthStatus);
    const healthy = statuses.filter(s => s.status === 'healthy').length;
    const total = statuses.length;
    
    return {
      overallStatus: healthy / total >= 0.7 ? 'healthy' : 'degraded',
      availableServices: healthy,
      totalServices: total,
      lastUpdate: new Date()
    };
  }
}
```

---

## Error Handling and Logging

### Structured Error Handling

```javascript
class APIError extends Error {
  constructor(message, source, statusCode, details = {}) {
    super(message);
    this.name = 'APIError';
    this.source = source;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
  }

  toLogFormat() {
    return {
      error: this.message,
      source: this.source,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

class Logger {
  static logAPICall(source, endpoint, responseTime, status) {
    console.log(JSON.stringify({
      type: 'api_call',
      source,
      endpoint,
      responseTime,
      status,
      timestamp: new Date()
    }));
  }

  static logError(error) {
    if (error instanceof APIError) {
      console.error(JSON.stringify(error.toLogFormat()));
    } else {
      console.error(JSON.stringify({
        type: 'error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date()
      }));
    }
  }
}
```

---

## Security Considerations

### API Key Management

```javascript
class APIKeyManager {
  constructor() {
    this.keys = new Map();
    this.loadKeysFromEnvironment();
  }

  loadKeysFromEnvironment() {
    const keyPatterns = [
      'NSW_TRANSPORT_API_KEY',
      'BOM_SPACE_WEATHER_KEY',
      'METOCEAN_API_KEY'
    ];

    keyPatterns.forEach(pattern => {
      const key = process.env[pattern];
      if (key) {
        this.keys.set(pattern, key);
      }
    });
  }

  getKey(service) {
    const key = this.keys.get(service);
    if (!key) {
      throw new Error(`API key not found for service: ${service}`);
    }
    return key;
  }

  rotateKey(service, newKey) {
    // Implement key rotation logic
    this.keys.set(service, newKey);
    // Update environment/secret store
  }
}
```

### Request Sanitization

```javascript
class RequestSanitizer {
  static sanitizeLocation(input) {
    // Remove special characters, limit length
    return input.replace(/[^\w\s.-]/g, '').substring(0, 100);
  }

  static validateCoordinates(lat, lng) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      throw new Error('Invalid latitude');
    }
    
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      throw new Error('Invalid longitude');
    }
    
    return { latitude, longitude };
  }
}
```

---

## Performance Optimization

### Data Aggregation Strategy

```javascript
class DataAggregationService {
  constructor() {
    this.batchSize = 10;
    this.batchTimeout = 5000;
    this.pendingRequests = [];
  }

  async batchRequest(requestConfig) {
    return new Promise((resolve, reject) => {
      this.pendingRequests.push({ requestConfig, resolve, reject });
      
      if (this.pendingRequests.length >= this.batchSize) {
        this.processBatch();
      } else if (this.pendingRequests.length === 1) {
        setTimeout(() => this.processBatch(), this.batchTimeout);
      }
    });
  }

  async processBatch() {
    const batch = this.pendingRequests.splice(0, this.batchSize);
    
    try {
      const results = await Promise.allSettled(
        batch.map(({ requestConfig }) => this.makeRequest(requestConfig))
      );
      
      batch.forEach(({ resolve, reject }, index) => {
        const result = results[index];
        if (result.status === 'fulfilled') {
          resolve(result.value);
        } else {
          reject(result.reason);
        }
      });
    } catch (error) {
      batch.forEach(({ reject }) => reject(error));
    }
  }
}
```

---

## Testing Strategy

### API Integration Tests

```javascript
describe('API Integration Tests', () => {
  let aggregator;

  beforeEach(() => {
    aggregator = new EmergencyDataAggregator();
  });

  test('should fetch NSW fire incidents', async () => {
    const incidents = await aggregator.getFireIncidents();
    
    expect(incidents).toBeDefined();
    expect(Array.isArray(incidents.features)).toBe(true);
    
    if (incidents.features.length > 0) {
      const feature = incidents.features[0];
      expect(feature.geometry.coordinates).toHaveLength(2);
      expect(feature.properties.title).toBeDefined();
    }
  });

  test('should handle API failures gracefully', async () => {
    // Mock network failure
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    
    await expect(aggregator.getFireIncidents()).rejects.toThrow('Network error');
  });

  test('should respect rate limits', async () => {
    const start = Date.now();
    const promises = Array(5).fill().map(() => aggregator.getFireIncidents());
    
    await Promise.all(promises);
    const duration = Date.now() - start;
    
    // Should take at least some time due to rate limiting
    expect(duration).toBeGreaterThan(1000);
  });
});
```

---

## Configuration Management

### Environment Configuration

```javascript
// config/api-sources.js
export const API_SOURCES = {
  australia: {
    weather: {
      bom_ftp: {
        url: 'ftp://ftp.bom.gov.au/anon/gen/',
        type: 'ftp',
        formats: ['json', 'xml', 'html'],
        updateFrequency: 600 // 10 minutes
      },
      bom_space_weather: {
        url: 'https://sws-data.sws.bom.gov.au/',
        type: 'rest',
        auth: 'api_key',
        rateLimit: { requests: 60, window: 3600 }
      }
    },
    emergency: {
      nsw_rfs: {
        url: 'https://www.rfs.nsw.gov.au/feeds/',
        endpoints: {
          majorIncidents: 'majorIncidents.json',
          fireUpdates: 'major-Fire-Updates.xml',
          cap: 'majorIncidentsCAP.xml'
        },
        updateFrequency: 1800, // 30 minutes
        formats: ['json', 'xml', 'cap']
      }
    },
    transport: {
      nsw_transport: {
        url: 'https://opendata.transport.nsw.gov.au/',
        auth: 'api_key',
        rateLimit: { requests: 1000, window: 3600 }
      },
      qld_traffic: {
        url: 'https://www.data.qld.gov.au/',
        type: 'geojson',
        updateFrequency: 300 // 5 minutes
      }
    }
  },
  newZealand: {
    geological: {
      geonet: {
        url: 'https://api.geonet.org.nz/',
        endpoints: {
          intensity: 'v1/intensity',
          volcano: 'v1/volcano/alert',
          sensor: 'v1/sensor'
        },
        updateFrequency: 120, // 2 minutes
        formats: ['json', 'cap', 'fdsn']
      }
    },
    transport: {
      nzta: {
        url: 'https://trafficnz.info/service/traffic/rest/4/',
        type: 'rest',
        updateFrequency: 300 // 5 minutes
      }
    },
    marine: {
      metocean: {
        url: 'https://www.metocean.co.nz/',
        auth: 'api_key',
        type: 'commercial'
      }
    }
  }
};
```

This comprehensive integration guide provides the foundation for implementing robust data collection from Australian and New Zealand APIs, with proper error handling, caching, and fallback strategies to ensure reliable service delivery.