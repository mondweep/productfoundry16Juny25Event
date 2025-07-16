# Data Transformation Strategies

## Overview
This document outlines standardized data transformation patterns for converting raw API responses from various Australian and New Zealand data sources into consistent, normalized formats for the Live Conditions application.

## Core Data Models

### Unified Alert/Incident Model
```typescript
interface UnifiedAlert {
  id: string;
  type: 'fire' | 'earthquake' | 'traffic' | 'weather' | 'marine' | 'emergency';
  severity: 'low' | 'moderate' | 'high' | 'extreme' | 'critical';
  title: string;
  description: string;
  location: {
    coordinates: [number, number]; // [longitude, latitude]
    address?: string;
    region: string;
    country: 'AU' | 'NZ';
  };
  status: 'active' | 'resolved' | 'monitoring' | 'cleared';
  timestamps: {
    created: Date;
    updated: Date;
    expires?: Date;
  };
  source: {
    agency: string;
    url?: string;
    lastUpdate: Date;
  };
  metadata: Record<string, any>;
}
```

### Unified Weather Model
```typescript
interface UnifiedWeather {
  location: {
    name: string;
    coordinates: [number, number];
    country: 'AU' | 'NZ';
  };
  current: {
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: string;
    visibility: number;
    conditions: string;
    observationTime: Date;
  };
  forecast?: {
    date: string;
    tempMin: number;
    tempMax: number;
    conditions: string;
    rainChance: number;
    uvIndex: number;
  }[];
  marine?: {
    waveHeight: number;
    swellDirection: string;
    swellPeriod: number;
    seaTemperature: number;
  };
  warnings: string[];
  source: string;
}
```

## Transformation Functions

### NSW RFS Fire Data Transformation

```typescript
class NSWRFSTransformer {
  static transform(rawData: any): UnifiedAlert[] {
    return rawData.features.map((feature: any) => ({
      id: `nsw-rfs-${feature.properties.guid}`,
      type: 'fire',
      severity: this.mapAlertLevel(feature.properties.category),
      title: feature.properties.title,
      description: feature.properties.description,
      location: {
        coordinates: feature.geometry.coordinates,
        address: feature.properties.location,
        region: feature.properties.council_area,
        country: 'AU'
      },
      status: this.mapStatus(feature.properties.status),
      timestamps: {
        created: new Date(feature.properties.pubDate),
        updated: new Date(feature.properties.pubDate)
      },
      source: {
        agency: 'NSW Rural Fire Service',
        url: feature.properties.link,
        lastUpdate: new Date(rawData.metadata.generated)
      },
      metadata: {
        fireSize: feature.properties.size,
        fireDanger: feature.properties.fire_danger_today,
        weatherConditions: feature.properties.weather_conditions,
        resources: feature.properties.resources,
        evacuationWarnings: feature.properties.evacuation_warnings,
        roadClosures: feature.properties.road_closures
      }
    }));
  }

  private static mapAlertLevel(category: string): 'low' | 'moderate' | 'high' | 'extreme' | 'critical' {
    switch (category?.toLowerCase()) {
      case 'emergency warning': return 'critical';
      case 'watch and act': return 'high';
      case 'advice': return 'moderate';
      default: return 'moderate';
    }
  }

  private static mapStatus(status: string): 'active' | 'resolved' | 'monitoring' | 'cleared' {
    switch (status?.toLowerCase()) {
      case 'going': return 'active';
      case 'being controlled': return 'monitoring';
      case 'under control': return 'monitoring';
      case 'out': return 'resolved';
      default: return 'active';
    }
  }
}
```

### GeoNet Earthquake Data Transformation

```typescript
class GeoNetTransformer {
  static transform(rawData: any): UnifiedAlert[] {
    return rawData.features.map((feature: any) => ({
      id: `geonet-${feature.properties.publicid}`,
      type: 'earthquake',
      severity: this.mapMagnitudeToSeverity(feature.properties.magnitude),
      title: `Magnitude ${feature.properties.magnitude} earthquake`,
      description: `${feature.properties.locality} - Depth: ${feature.geometry.coordinates[2]}km`,
      location: {
        coordinates: [feature.geometry.coordinates[0], feature.geometry.coordinates[1]],
        address: feature.properties.locality,
        region: this.extractRegion(feature.properties.locality),
        country: 'NZ'
      },
      status: this.mapEvaluationStatus(feature.properties.evaluationstatus),
      timestamps: {
        created: new Date(feature.properties.time),
        updated: new Date()
      },
      source: {
        agency: 'GeoNet',
        url: `https://www.geonet.org.nz/earthquake/${feature.properties.publicid}`,
        lastUpdate: new Date(rawData.metadata.generated)
      },
      metadata: {
        magnitude: feature.properties.magnitude,
        depth: feature.geometry.coordinates[2],
        magnitudeType: feature.properties.magnitudetype,
        mmi: feature.properties.mmi,
        quality: feature.properties.quality,
        intensityObservations: feature.properties.intensity_observations,
        usedStationCount: feature.properties.usedstationcount
      }
    }));
  }

  private static mapMagnitudeToSeverity(magnitude: number): 'low' | 'moderate' | 'high' | 'extreme' | 'critical' {
    if (magnitude >= 7.0) return 'critical';
    if (magnitude >= 6.0) return 'extreme';
    if (magnitude >= 5.0) return 'high';
    if (magnitude >= 4.0) return 'moderate';
    return 'low';
  }

  private static mapEvaluationStatus(status: string): 'active' | 'resolved' | 'monitoring' | 'cleared' {
    switch (status?.toLowerCase()) {
      case 'preliminary': return 'active';
      case 'confirmed': return 'monitoring';
      case 'reviewed': return 'resolved';
      default: return 'active';
    }
  }

  private static extractRegion(locality: string): string {
    // Extract region from locality string
    const regions = ['Wellington', 'Auckland', 'Canterbury', 'Otago', 'Waikato', 'Bay of Plenty'];
    for (const region of regions) {
      if (locality.includes(region)) return region;
    }
    return 'Unknown';
  }
}
```

### Bureau of Meteorology Weather Transformation

```typescript
class BOMTransformer {
  static transformObservations(rawData: any): UnifiedWeather[] {
    return rawData.observations.data.map((obs: any) => ({
      location: {
        name: obs.name,
        coordinates: [obs.lon, obs.lat],
        country: 'AU'
      },
      current: {
        temperature: obs.air_temp,
        humidity: obs.rel_hum,
        pressure: obs.press_msl,
        windSpeed: obs.wind_spd_kmh,
        windDirection: obs.wind_dir,
        visibility: obs.vis_km,
        conditions: obs.weather,
        observationTime: new Date(obs.aifstime_utc + 'Z')
      },
      forecast: rawData.forecasts ? [
        {
          date: rawData.forecasts.today.date,
          tempMin: rawData.forecasts.today.temp_min,
          tempMax: rawData.forecasts.today.temp_max,
          conditions: rawData.forecasts.today.short_text,
          rainChance: this.extractRainChance(rawData.forecasts.today.rainfall_range),
          uvIndex: rawData.forecasts.today.uv_max_index
        }
      ] : undefined,
      marine: obs.swell_height ? {
        waveHeight: obs.swell_height,
        swellDirection: obs.swell_dir_worded,
        swellPeriod: obs.swell_period,
        seaTemperature: obs.sea_temp || null
      } : undefined,
      warnings: rawData.warnings?.map((w: any) => w.description) || [],
      source: 'Bureau of Meteorology'
    }));
  }

  private static extractRainChance(rainfallRange: string): number {
    // Extract percentage from rainfall range or return default
    const match = rainfallRange?.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  }
}
```

### Traffic Data Transformation

```typescript
class TrafficTransformer {
  static transformNSWTransport(rawData: any): UnifiedAlert[] {
    return rawData.traffic_data.incidents.map((incident: any) => ({
      id: `nsw-traffic-${incident.id}`,
      type: 'traffic',
      severity: this.mapSeverity(incident.severity),
      title: `${incident.incident_type} - ${incident.location.road}`,
      description: incident.description,
      location: {
        coordinates: [incident.location.coordinates.longitude, incident.location.coordinates.latitude],
        address: `${incident.location.road}, ${incident.location.suburb}`,
        region: 'NSW',
        country: 'AU'
      },
      status: this.mapTrafficStatus(incident.status),
      timestamps: {
        created: new Date(incident.first_reported),
        updated: new Date(incident.last_updated),
        expires: incident.estimated_clearance ? new Date(incident.estimated_clearance) : undefined
      },
      source: {
        agency: 'Transport for NSW',
        lastUpdate: new Date(rawData.traffic_data.metadata.last_updated)
      },
      metadata: {
        incidentType: incident.incident_type,
        lanesBlocked: incident.impact.lanes_blocked,
        totalLanes: incident.impact.total_lanes,
        delayMinutes: incident.impact.delay_time_minutes,
        trafficVolume: incident.impact.traffic_volume,
        emergencyResponse: incident.emergency_response,
        alternateRoutes: incident.alternate_routes
      }
    }));
  }

  static transformNZTA(rawData: any): UnifiedAlert[] {
    return rawData.traffic_incidents.incidents.map((incident: any) => ({
      id: `nzta-${incident.id}`,
      type: 'traffic',
      severity: this.mapSeverity(incident.severity),
      title: `${incident.type} - ${incident.location.highway}`,
      description: incident.description,
      location: {
        coordinates: [incident.location.coordinates.longitude, incident.location.coordinates.latitude],
        address: `${incident.location.highway}, ${incident.location.description}`,
        region: incident.location.region,
        country: 'NZ'
      },
      status: this.mapTrafficStatus(incident.status),
      timestamps: {
        created: new Date(incident.reported_time),
        updated: new Date(),
        expires: incident.estimated_clearance ? new Date(incident.estimated_clearance) : undefined
      },
      source: {
        agency: 'NZTA Waka Kotahi',
        lastUpdate: new Date(rawData.traffic_incidents.metadata.generated)
      },
      metadata: {
        incidentType: incident.type,
        lanesAffected: incident.impact?.lanes_affected,
        totalLanes: incident.impact?.total_lanes,
        delayMinutes: incident.impact?.delay_minutes,
        queueLength: incident.impact?.queue_length_km,
        emergencyServices: incident.emergency_services,
        detourInfo: incident.detour_info,
        weatherConditions: incident.weather_conditions
      }
    }));
  }

  private static mapSeverity(severity: string): 'low' | 'moderate' | 'high' | 'extreme' | 'critical' {
    switch (severity?.toLowerCase()) {
      case 'minor': return 'low';
      case 'moderate': return 'moderate';
      case 'major': case 'serious': return 'high';
      case 'critical': return 'critical';
      default: return 'moderate';
    }
  }

  private static mapTrafficStatus(status: string): 'active' | 'resolved' | 'monitoring' | 'cleared' {
    switch (status?.toLowerCase()) {
      case 'active': case 'ongoing': return 'active';
      case 'clearing': return 'monitoring';
      case 'cleared': case 'resolved': return 'resolved';
      default: return 'active';
    }
  }
}
```

## Data Aggregation Pipeline

```typescript
class DataAggregationPipeline {
  private transformers: Map<string, any> = new Map([
    ['nsw-rfs', NSWRFSTransformer],
    ['geonet', GeoNetTransformer],
    ['bom', BOMTransformer],
    ['nsw-transport', TrafficTransformer],
    ['nzta', TrafficTransformer]
  ]);

  async aggregateAllData(): Promise<{
    alerts: UnifiedAlert[];
    weather: UnifiedWeather[];
    lastUpdate: Date;
  }> {
    const alerts: UnifiedAlert[] = [];
    const weather: UnifiedWeather[] = [];

    // Fetch and transform NSW RFS fire data
    try {
      const nswFireData = await this.fetchData('https://www.rfs.nsw.gov.au/feeds/majorIncidents.json');
      alerts.push(...NSWRFSTransformer.transform(nswFireData));
    } catch (error) {
      console.warn('Failed to fetch NSW RFS data:', error);
    }

    // Fetch and transform GeoNet earthquake data
    try {
      const geonetData = await this.fetchData('https://api.geonet.org.nz/v1/intensity?MMI=3');
      alerts.push(...GeoNetTransformer.transform(geonetData));
    } catch (error) {
      console.warn('Failed to fetch GeoNet data:', error);
    }

    // Fetch and transform BOM weather data
    try {
      const bomData = await this.fetchData('http://www.bom.gov.au/fwo/IDN60901/IDN60901.json');
      weather.push(...BOMTransformer.transformObservations(bomData));
    } catch (error) {
      console.warn('Failed to fetch BOM data:', error);
    }

    // Fetch and transform traffic data
    try {
      const nswTrafficData = await this.fetchWithAuth('https://opendata.transport.nsw.gov.au/');
      alerts.push(...TrafficTransformer.transformNSWTransport(nswTrafficData));
    } catch (error) {
      console.warn('Failed to fetch NSW traffic data:', error);
    }

    try {
      const nztaData = await this.fetchData('https://trafficnz.info/service/traffic/rest/4/incidents');
      alerts.push(...TrafficTransformer.transformNZTA(nztaData));
    } catch (error) {
      console.warn('Failed to fetch NZTA data:', error);
    }

    return {
      alerts: this.deduplicateAlerts(alerts),
      weather: this.deduplicateWeather(weather),
      lastUpdate: new Date()
    };
  }

  private async fetchData(url: string): Promise<any> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Live Conditions App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private async fetchWithAuth(baseUrl: string, apiKey?: string): Promise<any> {
    const headers: Record<string, string> = {
      'User-Agent': 'Live Conditions App/1.0'
    };

    if (apiKey) {
      headers['Authorization'] = `apikey ${apiKey}`;
    }

    const response = await fetch(baseUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private deduplicateAlerts(alerts: UnifiedAlert[]): UnifiedAlert[] {
    const seen = new Set<string>();
    return alerts.filter(alert => {
      const key = `${alert.type}-${alert.location.coordinates.join(',')}-${alert.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateWeather(weather: UnifiedWeather[]): UnifiedWeather[] {
    const seen = new Set<string>();
    return weather.filter(w => {
      const key = `${w.location.coordinates.join(',')}-${w.location.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
```

## Validation and Quality Assurance

```typescript
class DataValidator {
  static validateAlert(alert: UnifiedAlert): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!alert.id) errors.push('Missing required field: id');
    if (!alert.type) errors.push('Missing required field: type');
    if (!alert.severity) errors.push('Missing required field: severity');
    if (!alert.location?.coordinates) errors.push('Missing required field: location.coordinates');
    if (!Array.isArray(alert.location.coordinates) || alert.location.coordinates.length !== 2) {
      errors.push('Invalid coordinates format');
    }

    // Validate coordinate ranges
    const [lon, lat] = alert.location.coordinates;
    if (typeof lon !== 'number' || lon < -180 || lon > 180) {
      errors.push('Invalid longitude');
    }
    if (typeof lat !== 'number' || lat < -90 || lat > 90) {
      errors.push('Invalid latitude');
    }

    // Validate Australia/New Zealand bounds
    if (alert.location.country === 'AU') {
      if (lon < 112 || lon > 154 || lat < -44 || lat > -10) {
        errors.push('Coordinates outside Australian bounds');
      }
    } else if (alert.location.country === 'NZ') {
      if (lon < 166 || lon > 179 || lat < -47 || lat > -34) {
        errors.push('Coordinates outside New Zealand bounds');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static validateWeather(weather: UnifiedWeather): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!weather.location?.name) errors.push('Missing required field: location.name');
    if (!weather.location?.coordinates) errors.push('Missing required field: location.coordinates');
    if (!weather.current) errors.push('Missing required field: current');
    
    if (weather.current) {
      if (typeof weather.current.temperature !== 'number') {
        errors.push('Invalid temperature value');
      }
      if (weather.current.humidity !== undefined && 
          (weather.current.humidity < 0 || weather.current.humidity > 100)) {
        errors.push('Invalid humidity value (must be 0-100)');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

## Error Handling and Logging

```typescript
class TransformationLogger {
  static logTransformationError(source: string, error: Error, rawData?: any): void {
    console.error({
      timestamp: new Date().toISOString(),
      source,
      error: error.message,
      stack: error.stack,
      rawDataPreview: rawData ? JSON.stringify(rawData).substring(0, 500) : undefined
    });
  }

  static logTransformationSuccess(source: string, recordCount: number): void {
    console.info({
      timestamp: new Date().toISOString(),
      source,
      status: 'success',
      recordCount,
      message: `Successfully transformed ${recordCount} records from ${source}`
    });
  }

  static logValidationWarning(source: string, record: any, errors: string[]): void {
    console.warn({
      timestamp: new Date().toISOString(),
      source,
      recordId: record.id,
      validationErrors: errors,
      message: 'Record failed validation but was included with warnings'
    });
  }
}
```

## Real-time Data Processing

```typescript
class RealTimeProcessor {
  private websocketConnections: Map<string, WebSocket> = new Map();
  private eventEmitter = new EventTarget();

  setupRealTimeStreams(): void {
    // Setup websocket for GeoNet earthquake feed
    this.setupGeoNetWebSocket();
    
    // Setup polling for other sources that don't support real-time
    this.setupPollingStreams();
  }

  private setupGeoNetWebSocket(): void {
    const ws = new WebSocket('wss://api.geonet.org.nz/ws/earthquake');
    
    ws.onmessage = (event) => {
      try {
        const rawData = JSON.parse(event.data);
        const transformedAlert = GeoNetTransformer.transform({ features: [rawData] })[0];
        
        this.eventEmitter.dispatchEvent(new CustomEvent('newAlert', {
          detail: { alert: transformedAlert, source: 'geonet' }
        }));
      } catch (error) {
        TransformationLogger.logTransformationError('geonet-websocket', error as Error, event.data);
      }
    };

    this.websocketConnections.set('geonet', ws);
  }

  private setupPollingStreams(): void {
    // Poll NSW RFS every 5 minutes
    setInterval(async () => {
      try {
        const data = await this.fetchData('https://www.rfs.nsw.gov.au/feeds/majorIncidents.json');
        const alerts = NSWRFSTransformer.transform(data);
        
        this.eventEmitter.dispatchEvent(new CustomEvent('alertsUpdate', {
          detail: { alerts, source: 'nsw-rfs' }
        }));
      } catch (error) {
        TransformationLogger.logTransformationError('nsw-rfs-polling', error as Error);
      }
    }, 5 * 60 * 1000);

    // Poll NZTA every 2 minutes
    setInterval(async () => {
      try {
        const data = await this.fetchData('https://trafficnz.info/service/traffic/rest/4/incidents');
        const alerts = TrafficTransformer.transformNZTA(data);
        
        this.eventEmitter.dispatchEvent(new CustomEvent('alertsUpdate', {
          detail: { alerts, source: 'nzta' }
        }));
      } catch (error) {
        TransformationLogger.logTransformationError('nzta-polling', error as Error);
      }
    }, 2 * 60 * 1000);
  }

  onNewAlert(callback: (alert: UnifiedAlert) => void): void {
    this.eventEmitter.addEventListener('newAlert', (event: any) => {
      callback(event.detail.alert);
    });
  }

  onAlertsUpdate(callback: (alerts: UnifiedAlert[], source: string) => void): void {
    this.eventEmitter.addEventListener('alertsUpdate', (event: any) => {
      callback(event.detail.alerts, event.detail.source);
    });
  }
}
```

This comprehensive data transformation strategy provides:

1. **Standardized data models** for consistent application interfaces
2. **Source-specific transformers** for each major API
3. **Validation and quality assurance** to ensure data integrity
4. **Error handling and logging** for robust operation
5. **Real-time processing capabilities** for immediate updates
6. **Deduplication logic** to handle overlapping data sources
7. **Geographic bounds validation** for Australia/New Zealand regions

The transformation layer acts as a crucial abstraction between the raw API responses and the application's business logic, ensuring consistent data handling regardless of the source API's format or structure.