# Redis Caching Schema for Live Conditions App

## Overview
Redis is used for high-frequency, real-time data caching to reduce database load and improve response times for the most accessed data.

## Key Patterns and Structures

### 1. Real-time Weather Data
```
Pattern: weather:{location_id}:{timestamp_hour}
Type: Hash
TTL: 2 hours
Fields:
  - temperature
  - humidity
  - wind_speed
  - wind_direction
  - weather_description
  - last_updated

Example:
weather:loc-123:2025071606 -> {
  "temperature": "22.5",
  "humidity": "65",
  "wind_speed": "15.2",
  "wind_direction": "220",
  "weather_description": "Partly cloudy",
  "last_updated": "2025-07-16T06:30:00Z"
}
```

### 2. Surf Conditions
```
Pattern: surf:{location_id}:current
Type: Hash
TTL: 30 minutes
Fields:
  - wave_height
  - wave_period
  - swell_direction
  - surf_rating
  - water_temperature
  - tide_height
  - last_updated

Example:
surf:bondi-beach:current -> {
  "wave_height": "1.8",
  "wave_period": "8.5",
  "swell_direction": "180",
  "surf_rating": "7",
  "water_temperature": "19.2",
  "tide_height": "1.4",
  "last_updated": "2025-07-16T06:25:00Z"
}
```

### 3. Active Fire Alerts by Region
```
Pattern: fire_alerts:{region_id}
Type: List (JSON strings)
TTL: 15 minutes
Content: List of active fire alert IDs

Pattern: fire_alert:{alert_id}
Type: Hash
TTL: 1 hour
Fields:
  - alert_type
  - severity
  - title
  - description
  - centroid_lat
  - centroid_lng
  - issued_at
  - expires_at

Example:
fire_alerts:nsw -> ["alert-123", "alert-456"]
fire_alert:alert-123 -> {
  "alert_type": "emergency",
  "severity": "extreme",
  "title": "Emergency Warning - Blue Mountains",
  "description": "Fast moving fire approaching residential areas",
  "centroid_lat": "-33.7123",
  "centroid_lng": "150.3654",
  "issued_at": "2025-07-16T05:30:00Z",
  "expires_at": "2025-07-16T18:00:00Z"
}
```

### 4. Traffic Conditions by Road
```
Pattern: traffic:{road_name}:{segment_id}
Type: Hash
TTL: 5 minutes
Fields:
  - incident_type
  - severity
  - description
  - speed_kmh
  - delay_minutes
  - timestamp

Example:
traffic:M1-Pacific-Highway:seg-789 -> {
  "incident_type": "accident",
  "severity": "moderate",
  "description": "Multi-vehicle accident, right lane blocked",
  "speed_kmh": "25",
  "delay_minutes": "15",
  "timestamp": "2025-07-16T06:20:00Z"
}
```

### 5. Recent User Reports by Location
```
Pattern: reports:near:{lat}:{lng}:{radius_km}
Type: Sorted Set (by timestamp)
Score: Unix timestamp
Value: report_id
TTL: 1 hour

Pattern: report:{report_id}
Type: Hash
TTL: 24 hours
Fields:
  - category
  - title
  - description
  - severity
  - lat
  - lng
  - reported_at
  - user_id
  - vote_score

Example:
reports:near:-33.8688:151.2093:10 -> [
  (1721115600, "report-abc123"),
  (1721115500, "report-def456")
]

report:report-abc123 -> {
  "category": "wildlife",
  "title": "Jellyfish spotted",
  "description": "Large bluebottle jellyfish washed up on shore",
  "severity": "warning",
  "lat": "-33.8915",
  "lng": "151.2767",
  "reported_at": "2025-07-16T06:20:00Z",
  "user_id": "user-789",
  "vote_score": "5"
}
```

### 6. User Session Cache
```
Pattern: session:{session_token}
Type: Hash
TTL: 24 hours (sliding expiration)
Fields:
  - user_id
  - email
  - username
  - country_code
  - last_activity
  - device_type

Example:
session:sess_abc123xyz -> {
  "user_id": "user-456",
  "email": "user@example.com",
  "username": "surfer_joe",
  "country_code": "AU",
  "last_activity": "2025-07-16T06:25:00Z",
  "device_type": "mobile"
}
```

### 7. Geospatial Queries Cache
```
Pattern: geo:locations:{bounds_hash}
Type: List (JSON strings)
TTL: 10 minutes
Content: Location data within bounding box

Example:
geo:locations:h3_abc123 -> [
  "{\"id\":\"loc-123\",\"name\":\"Bondi Beach\",\"type\":\"beach\",\"lat\":-33.8915,\"lng\":151.2767}",
  "{\"id\":\"loc-124\",\"name\":\"Coogee Beach\",\"type\":\"beach\",\"lat\":-33.9228,\"lng\":151.2583}"
]
```

### 8. Push Notification Queue
```
Pattern: notifications:queue:{priority}
Type: List (JSON strings)
Priority: emergency, high, normal, low
TTL: None (processed and removed)

Pattern: notifications:sent:{user_id}
Type: Sorted Set (by timestamp)
Score: Unix timestamp
Value: notification_id
TTL: 7 days

Example:
notifications:queue:emergency -> [
  "{\"user_id\":\"user-123\",\"title\":\"Fire Emergency\",\"message\":\"Evacuate now\",\"payload\":{\"alert_id\":\"fire-456\"}}"
]
```

### 9. API Rate Limiting
```
Pattern: rate_limit:{user_id}:{endpoint}:{window}
Type: String (counter)
TTL: Window duration (e.g., 3600 for hourly)

Pattern: rate_limit:ip:{ip_address}:{window}
Type: String (counter)
TTL: Window duration

Example:
rate_limit:user-123:/api/reports:3600 -> "45"
rate_limit:ip:192.168.1.100:3600 -> "120"
```

### 10. Data Source Status
```
Pattern: data_source:{source_name}:status
Type: Hash
TTL: 30 minutes
Fields:
  - last_update
  - status
  - error_count
  - records_processed
  - next_update

Example:
data_source:bom_weather:status -> {
  "last_update": "2025-07-16T06:15:00Z",
  "status": "healthy",
  "error_count": "0",
  "records_processed": "1247",
  "next_update": "2025-07-16T06:45:00Z"
}
```

## Cache Invalidation Strategies

### 1. Time-based Expiration
- Weather data: 2 hours
- Surf conditions: 30 minutes
- Fire alerts: 15 minutes
- Traffic: 5 minutes
- User reports: 1-24 hours depending on type

### 2. Event-based Invalidation
- When new data arrives from external sources
- When users submit new reports
- When fire alerts are updated
- When traffic incidents are resolved

### 3. Geographic Invalidation
- Invalidate location-based caches when conditions change
- Use geohashing for efficient spatial cache keys
- Implement radius-based cache invalidation

## Performance Optimization

### 1. Connection Pooling
```javascript
// Redis connection pool configuration
const redis = new Redis.Cluster([
  { host: 'redis-1', port: 6379 },
  { host: 'redis-2', port: 6379 },
  { host: 'redis-3', port: 6379 }
], {
  redisOptions: {
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 50
  },
  maxRedirections: 16,
  scaleReads: 'slave'
});
```

### 2. Pipeline Operations
```javascript
// Batch multiple operations for better performance
const pipeline = redis.pipeline();
pipeline.hgetall('weather:loc-123:current');
pipeline.lrange('reports:near:-33.8688:151.2093:10', 0, 10);
pipeline.hgetall('traffic:M1-Pacific-Highway:seg-789');
const results = await pipeline.exec();
```

### 3. Compression
- Use JSON compression for large payloads
- Implement LZ4 or Snappy for real-time compression
- Consider MessagePack for binary serialization

## Monitoring and Alerting

### 1. Key Metrics
- Cache hit ratio (target: >90%)
- Memory usage (alert if >80%)
- Network latency (target: <5ms)
- Connection count
- Error rates

### 2. Health Checks
```javascript
// Redis health check endpoint
app.get('/health/redis', async (req, res) => {
  try {
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;
    
    const info = await redis.info('memory');
    const usedMemory = parseMemoryInfo(info);
    
    res.json({
      status: 'healthy',
      latency_ms: latency,
      memory_used_mb: usedMemory,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

## Backup and Recovery

### 1. Redis Persistence
- Use RDB snapshots for point-in-time recovery
- Enable AOF (Append Only File) for durability
- Configure save points: `save 900 1`, `save 300 10`, `save 60 10000`

### 2. Cluster Configuration
- Master-slave replication for high availability
- Sentinel for automatic failover
- Cross-region replication for disaster recovery

## Security Considerations

### 1. Access Control
- Use Redis AUTH for password protection
- Implement IP whitelisting
- Use TLS/SSL for data in transit

### 2. Data Privacy
- Avoid storing sensitive user data in cache
- Implement automatic PII scrubbing
- Use secure key naming conventions

This Redis schema provides efficient caching for all real-time data needs while maintaining data consistency and performance optimization.