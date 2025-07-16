# Database Design Documentation
## Aotearoa & Aussie Live Conditions App

### Overview
This document outlines the complete database architecture for the Live Conditions app, designed to handle real-time geospatial data for Australia and New Zealand environmental conditions, user-generated content, and push notifications.

### Technology Stack
- **Primary Database**: PostgreSQL 15+ with PostGIS extension
- **Caching Layer**: Redis Cluster for real-time data
- **Time-Series Optimization**: Table partitioning for high-volume data
- **Geospatial Operations**: PostGIS for location-based queries
- **Real-time Features**: WebSocket support with cached data

---

## Database Architecture

### Core Design Principles

1. **Geospatial First**: All location data uses PostGIS geometry types with SRID 4326 (WGS84)
2. **Time-Series Optimized**: Partitioned tables for weather, surf, and activity data
3. **Real-Time Ready**: Redis caching for frequently accessed data
4. **Scalable**: Designed for high read/write loads with proper indexing
5. **Data Quality**: Built-in validation and quality scoring mechanisms
6. **Multi-Country**: Supports both Australian and New Zealand data sources

### Database Schema Overview

#### 1. Users & Authentication (`users`, `user_sessions`)
- UUID-based user identification
- Secure password hashing with bcrypt
- Session management with refresh tokens
- Country-specific timezone handling
- Device tracking for push notifications

#### 2. Geospatial Foundation (`regions`, `locations`)
- Hierarchical region structure (country → state → city → suburb)
- PostGIS geometry support for complex shapes
- Elevation data for weather stations
- Official vs. user-generated location distinction

#### 3. Environmental Data (`weather_conditions`, `surf_conditions`, `fire_alerts`, `traffic_conditions`)
- Real-time data from official sources (BOM, MetService, RFS, FENZ)
- Forecast vs. current condition tracking
- Quality scoring for data validation
- Standardized severity levels and categorization

#### 4. User-Generated Content (`user_reports`, `report_media`, `report_votes`)
- Community-driven condition reporting
- Photo/video attachment support
- Voting system for report accuracy
- Automatic expiration for time-sensitive reports

#### 5. Notification System (`user_subscriptions`, `notification_queue`, `user_devices`)
- Location-based and radius-based subscriptions
- Multi-channel notifications (push, email, SMS)
- Priority queuing for emergency alerts
- Device management for push notifications

#### 6. Analytics & Monitoring (`user_activity_log`, `api_usage_stats`, `data_sources`)
- User behavior tracking for app optimization
- API performance monitoring
- Data source health monitoring
- Import/export logging

---

## Table Specifications

### Core Tables

#### `users`
**Purpose**: User account management and authentication
**Key Features**:
- UUID primary keys for security
- Country-specific timezone support
- Phone and email verification flags
- Metadata JSONB for extensibility

**Critical Indexes**:
- `idx_users_email` - Fast login lookups
- `idx_users_country` - Country-specific queries

#### `locations`
**Purpose**: Geographic points of interest (beaches, weather stations, landmarks)
**Key Features**:
- PostGIS POINT geometry for precise positioning
- Official monitoring station designation
- Elevation data for weather calculations
- Metadata JSONB for location-specific attributes

**Critical Indexes**:
- `idx_locations_coordinates` (GIST) - Spatial proximity queries
- Composite indexes for location type and country

#### `weather_conditions`
**Purpose**: Real-time and forecast weather data storage
**Key Features**:
- Sub-hourly data resolution
- Multiple data source support
- Forecast horizon tracking
- Quality scoring mechanism

**Performance Considerations**:
- Partitioned by month for large datasets
- Indexes optimized for location + time queries
- Automatic data retention policies

#### `user_reports`
**Purpose**: Community-submitted condition reports
**Key Features**:
- Category-based organization (safety, wildlife, vibe, etc.)
- Severity levels for alert prioritization
- Public/private visibility controls
- Community voting for accuracy

**Critical Indexes**:
- Spatial index for proximity searches
- Time-based indexes for recent reports
- Category-based filtering

### Specialized Tables

#### `fire_alerts`
**Purpose**: Emergency fire warnings and evacuations
**Key Features**:
- Multi-polygon affected areas
- Real-time alert status tracking
- Evacuation zone mapping
- Emergency contact information

**Performance**: 
- Spatial indexes for area intersection queries
- Time-based indexes for active alerts
- Priority indexing for emergency broadcasts

#### `user_subscriptions`
**Purpose**: Notification preferences and geographic monitoring
**Key Features**:
- Location-based or radius-based subscriptions
- Category and severity filtering
- Multi-channel notification support
- Active/inactive status management

---

## Performance Optimization

### Indexing Strategy

#### Spatial Indexes (GIST)
```sql
-- Essential for geospatial queries
CREATE INDEX idx_locations_coordinates ON locations USING GIST (coordinates);
CREATE INDEX idx_user_reports_coordinates ON user_reports USING GIST (coordinates);
CREATE INDEX idx_fire_alerts_affected_area ON fire_alerts USING GIST (affected_area);
```

#### Time-Series Indexes
```sql
-- Optimized for real-time data queries
CREATE INDEX idx_weather_conditions_timestamp ON weather_conditions (timestamp_utc DESC);
CREATE INDEX idx_surf_conditions_timestamp ON surf_conditions (timestamp_utc DESC);
```

#### Composite Indexes
```sql
-- Common query patterns
CREATE INDEX idx_weather_location_timestamp ON weather_conditions (location_id, timestamp_utc DESC);
CREATE INDEX idx_user_reports_category_timestamp ON user_reports (category, reported_at DESC);
```

### Table Partitioning

#### Weather Data Partitioning
High-volume weather data is partitioned by month to maintain query performance:

```sql
-- Automatic monthly partitions
CREATE TABLE weather_conditions_partitioned (
    LIKE weather_conditions INCLUDING ALL
) PARTITION BY RANGE (timestamp_utc);

-- Individual monthly partitions
CREATE TABLE weather_conditions_2025_07 PARTITION OF weather_conditions_partitioned 
FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
```

#### Benefits:
- Faster queries on recent data
- Efficient data archival
- Reduced maintenance overhead
- Improved backup performance

---

## Redis Caching Strategy

### Cache Patterns

#### Real-Time Data Caching
```redis
# Weather conditions by location
weather:{location_id}:current -> Hash (TTL: 2 hours)

# Surf conditions
surf:{location_id}:current -> Hash (TTL: 30 minutes)

# Fire alerts by region
fire_alerts:{region_id} -> List of alert IDs (TTL: 15 minutes)
```

#### Geospatial Caching
```redis
# Nearby reports
reports:near:{lat}:{lng}:{radius} -> Sorted Set (TTL: 1 hour)

# Location data within bounds
geo:locations:{bounds_hash} -> List (TTL: 10 minutes)
```

#### Session Management
```redis
# User sessions
session:{session_token} -> Hash (TTL: 24 hours sliding)

# Rate limiting
rate_limit:{user_id}:{endpoint} -> Counter (TTL: window duration)
```

### Cache Invalidation

#### Time-Based Expiration
- Weather: 2 hours
- Surf: 30 minutes  
- Fire alerts: 15 minutes
- Traffic: 5 minutes

#### Event-Based Invalidation
- New external data arrival
- User report submissions
- Fire alert updates
- Traffic incident resolution

---

## Data Sources Integration

### Official Sources

#### Australia
- **Bureau of Meteorology (BOM)**: Weather and ocean data
- **NSW Rural Fire Service**: Fire alerts and warnings
- **Surf Life Saving Australia**: Beach and surf conditions
- **Transport NSW**: Traffic and road conditions

#### New Zealand
- **MetService**: Weather forecasts and warnings
- **Fire and Emergency NZ (FENZ)**: Fire alerts
- **Surf Life Saving NZ**: Beach safety and conditions
- **Waka Kotahi**: Transport and traffic data

### Data Quality Management

#### Quality Scoring
```sql
quality_score DECIMAL(3,2) DEFAULT 1.0 -- 0.0 to 1.0 scale
```

#### Validation Rules
- Temporal consistency checks
- Spatial boundary validation
- Source reliability scoring
- Community verification integration

---

## Security Considerations

### Data Protection

#### Sensitive Data Handling
- Password hashing with bcrypt (cost factor 12)
- Session tokens with secure random generation
- PII minimization in logs and caches
- GDPR compliance for user data

#### Access Control
```sql
-- Row-level security example
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_reports_privacy ON user_reports
    FOR ALL TO app_user
    USING (is_public = true OR user_id = current_user_id());
```

#### API Security
- Rate limiting per user and IP
- Request validation and sanitization
- SQL injection prevention
- Input size limitations

### Geographic Privacy

#### Location Anonymization
- Configurable precision levels
- Opt-out mechanisms for sensitive areas
- Automatic PII detection in reports
- Location data retention policies

---

## Monitoring and Maintenance

### Database Health Monitoring

#### Key Metrics
```sql
-- Connection monitoring
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';

-- Query performance
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

-- Table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### Automated Maintenance
- Daily VACUUM and ANALYZE operations
- Weekly full VACUUM for heavily updated tables
- Monthly partition maintenance
- Quarterly index rebuild assessments

### Performance Monitoring

#### Redis Monitoring
```bash
# Memory usage monitoring
redis-cli info memory | grep used_memory_human

# Cache hit ratio
redis-cli info stats | grep keyspace_hits
redis-cli info stats | grep keyspace_misses
```

#### PostgreSQL Monitoring
```sql
-- Index usage statistics
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Table access patterns
SELECT schemaname, tablename, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;
```

---

## Disaster Recovery

### Backup Strategy

#### PostgreSQL Backups
- **Continuous WAL archiving** for point-in-time recovery
- **Daily full backups** with pg_dump compression
- **Cross-region backup replication** for disaster recovery
- **Monthly backup restoration testing**

#### Redis Persistence
- **RDB snapshots** every 6 hours
- **AOF (Append Only File)** for durability
- **Cross-datacenter replication** for high availability

### Recovery Procedures

#### Database Recovery
1. Restore from latest full backup
2. Apply WAL files for point-in-time recovery
3. Verify data integrity
4. Restart application services
5. Monitor for anomalies

#### Cache Recovery
1. Restart Redis cluster
2. Allow warm-up period for cache population
3. Monitor cache hit ratios
4. Verify real-time data feeds

---

## Scalability Considerations

### Horizontal Scaling

#### Read Replicas
- Geographic distribution for latency reduction
- Load balancing across read replicas
- Automatic failover configuration
- Real-time replication monitoring

#### Sharding Strategy
For extreme scale, consider sharding by:
- Geographic regions (AU/NZ split)
- Time-based sharding for historical data
- Feature-based sharding (weather vs. reports)

### Vertical Scaling

#### Hardware Optimization
- SSD storage for database files
- Adequate RAM for working set
- CPU optimization for PostGIS operations
- Network optimization for real-time feeds

---

## Migration and Deployment

### Database Migrations

#### Migration Framework
```bash
# Apply all pending migrations
./migrate.sh up

# Rollback last migration
./migrate.sh down 1

# Check migration status
./migrate.sh status
```

#### Deployment Strategy
1. **Blue-Green Deployment** for zero-downtime updates
2. **Database schema versioning** with backward compatibility
3. **Feature flags** for gradual rollouts
4. **Automated testing** of migration scripts

### Environment Management

#### Development
- Docker Compose for local development
- Synthetic data generation scripts
- Performance testing with realistic datasets

#### Production
- Multi-AZ deployment for high availability
- Automated backup verification
- Performance monitoring and alerting
- Capacity planning and scaling alerts

---

## API Integration Patterns

### Real-Time Data Flow

#### External Data Ingestion
```
External APIs → Data Validators → PostgreSQL → Redis Cache → WebSocket Clients
```

#### User Data Flow
```
Mobile App → API Gateway → Application Server → PostgreSQL → Push Notifications
```

### Caching Patterns

#### Cache-Aside Pattern
```javascript
async function getWeatherData(locationId) {
    // Try cache first
    let data = await redis.hgetall(`weather:${locationId}:current`);
    
    if (!data.temperature) {
        // Cache miss - fetch from database
        data = await db.query(`
            SELECT * FROM weather_conditions 
            WHERE location_id = $1 
            ORDER BY timestamp_utc DESC 
            LIMIT 1
        `, [locationId]);
        
        // Store in cache
        await redis.hset(`weather:${locationId}:current`, data);
        await redis.expire(`weather:${locationId}:current`, 7200); // 2 hours
    }
    
    return data;
}
```

#### Write-Through Pattern
```javascript
async function createUserReport(reportData) {
    // Write to database first
    const report = await db.query(`
        INSERT INTO user_reports (...) VALUES (...) RETURNING *
    `, [...reportData]);
    
    // Update cache immediately
    await redis.zadd(
        `reports:near:${report.lat}:${report.lng}:10`,
        Date.now(),
        report.id
    );
    
    return report;
}
```

---

## Conclusion

This database design provides a robust, scalable foundation for the Live Conditions app, with particular attention to:

- **Real-time performance** through strategic caching and indexing
- **Geospatial efficiency** with PostGIS optimization
- **Data reliability** through quality scoring and validation
- **User experience** through fast queries and real-time updates
- **Operational excellence** through monitoring and automation

The architecture supports the app's core mission of providing timely, accurate environmental and community information for Australia and New Zealand users while maintaining high performance and reliability standards.