-- Aotearoa & Aussie Live Conditions Database Schema
-- PostgreSQL with PostGIS extension for geospatial operations
-- Optimized for real-time data and high-frequency updates

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Set timezone to handle AU/NZ properly
SET timezone = 'UTC';

-- =====================================================
-- USERS AND AUTHENTICATION
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    country_code CHAR(2) CHECK (country_code IN ('AU', 'NZ')),
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- GEOSPATIAL LOCATIONS AND REGIONS
-- =====================================================

CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    country_code CHAR(2) NOT NULL CHECK (country_code IN ('AU', 'NZ')),
    region_type VARCHAR(50) NOT NULL, -- 'state', 'province', 'territory', 'city', 'suburb'
    parent_region_id UUID REFERENCES regions(id),
    geometry GEOMETRY(MULTIPOLYGON, 4326),
    centroid GEOMETRY(POINT, 4326),
    timezone VARCHAR(50),
    population INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    location_type VARCHAR(50) NOT NULL, -- 'beach', 'surf_break', 'lookout', 'park', 'road_segment'
    coordinates GEOMETRY(POINT, 4326) NOT NULL,
    region_id UUID REFERENCES regions(id),
    address TEXT,
    postcode VARCHAR(10),
    country_code CHAR(2) NOT NULL CHECK (country_code IN ('AU', 'NZ')),
    is_official BOOLEAN DEFAULT FALSE, -- TRUE for official monitoring stations
    elevation DECIMAL(10,2), -- meters above sea level
    metadata JSONB DEFAULT '{}', -- Additional location-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ENVIRONMENTAL CONDITIONS (REAL-TIME DATA)
-- =====================================================

CREATE TABLE weather_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    data_source VARCHAR(100) NOT NULL, -- 'BOM', 'MetService', 'user_report'
    external_id VARCHAR(100), -- ID from external data source
    timestamp_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    temperature DECIMAL(5,2), -- Celsius
    feels_like DECIMAL(5,2), -- Celsius
    humidity DECIMAL(5,2), -- Percentage
    pressure DECIMAL(8,2), -- hPa
    wind_speed DECIMAL(6,2), -- km/h
    wind_direction INTEGER, -- Degrees (0-360)
    wind_gust DECIMAL(6,2), -- km/h
    visibility DECIMAL(6,2), -- km
    uv_index DECIMAL(3,1),
    cloud_cover INTEGER, -- Percentage
    rainfall DECIMAL(6,2), -- mm
    weather_description TEXT,
    weather_code VARCHAR(20), -- Standardized weather codes
    is_forecast BOOLEAN DEFAULT FALSE,
    forecast_hours_ahead INTEGER,
    quality_score DECIMAL(3,2) DEFAULT 1.0, -- Data quality indicator
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE surf_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    data_source VARCHAR(100) NOT NULL,
    external_id VARCHAR(100),
    timestamp_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    wave_height DECIMAL(4,2), -- meters
    wave_period DECIMAL(4,1), -- seconds
    wave_direction INTEGER, -- degrees
    swell_height DECIMAL(4,2), -- meters
    swell_period DECIMAL(4,1), -- seconds
    swell_direction INTEGER, -- degrees
    wind_effect VARCHAR(20), -- 'onshore', 'offshore', 'cross-shore'
    tide_height DECIMAL(4,2), -- meters
    tide_direction VARCHAR(10), -- 'rising', 'falling'
    surf_rating INTEGER CHECK (surf_rating BETWEEN 1 AND 10),
    water_temperature DECIMAL(4,1), -- Celsius
    is_forecast BOOLEAN DEFAULT FALSE,
    forecast_hours_ahead INTEGER,
    quality_score DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE fire_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id VARCHAR(100) UNIQUE NOT NULL, -- External alert ID
    data_source VARCHAR(100) NOT NULL, -- 'RFS', 'CFA', 'FENZ'
    alert_type VARCHAR(50) NOT NULL, -- 'emergency', 'watch_act', 'advice'
    severity VARCHAR(20) NOT NULL, -- 'extreme', 'severe', 'high', 'moderate', 'low'
    title VARCHAR(500) NOT NULL,
    description TEXT,
    affected_area GEOMETRY(MULTIPOLYGON, 4326),
    centroid GEOMETRY(POINT, 4326),
    region_names TEXT[], -- Array of affected region names
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    evacuation_zones GEOMETRY(MULTIPOLYGON, 4326),
    road_closures TEXT[],
    emergency_contacts JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE traffic_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    data_source VARCHAR(100) NOT NULL,
    external_id VARCHAR(100),
    road_name VARCHAR(200),
    road_segment GEOMETRY(LINESTRING, 4326),
    incident_type VARCHAR(50), -- 'accident', 'roadwork', 'congestion', 'closure'
    severity VARCHAR(20), -- 'severe', 'moderate', 'minor'
    description TEXT,
    estimated_delay INTEGER, -- minutes
    speed_kmh INTEGER,
    typical_speed_kmh INTEGER,
    traffic_flow VARCHAR(20), -- 'free_flow', 'slow', 'stationary'
    timestamp_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    reported_at TIMESTAMP WITH TIME ZONE,
    estimated_clear_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    affects_emergency_services BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- USER-GENERATED CONTENT
-- =====================================================

CREATE TABLE user_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    coordinates GEOMETRY(POINT, 4326) NOT NULL,
    location_id UUID REFERENCES locations(id), -- Optional reference to known location
    category VARCHAR(50) NOT NULL, -- 'safety', 'traffic', 'vibe', 'wildlife', 'weather', 'surf'
    subcategory VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'info', -- 'emergency', 'warning', 'info'
    is_public BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    reported_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE, -- Auto-expire time-sensitive reports
    vote_score INTEGER DEFAULT 0, -- Community voting on accuracy
    view_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE report_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES user_reports(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('photo', 'video', 'audio')),
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    file_size INTEGER, -- bytes
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    duration INTEGER, -- seconds for video/audio
    upload_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE report_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES user_reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) CHECK (vote_type IN ('helpful', 'not_helpful', 'spam')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(report_id, user_id)
);

-- =====================================================
-- SUBSCRIPTIONS AND NOTIFICATIONS
-- =====================================================

CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_type VARCHAR(50) NOT NULL, -- 'location', 'region', 'category', 'severity'
    location_id UUID REFERENCES locations(id),
    region_id UUID REFERENCES regions(id),
    coordinates GEOMETRY(POINT, 4326), -- For radius-based subscriptions
    radius_km DECIMAL(8,2), -- Subscription radius in kilometers
    categories TEXT[], -- Array of categories to monitor
    severity_levels TEXT[], -- Array of severity levels
    notification_methods TEXT[] DEFAULT '{"push"}', -- 'push', 'email', 'sms'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'weather_alert', 'fire_warning', 'user_report'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    payload JSONB, -- Additional data for the notification
    methods TEXT[], -- Which methods to use for this notification
    priority VARCHAR(20) DEFAULT 'normal', -- 'emergency', 'high', 'normal', 'low'
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
    failure_reason TEXT,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DEVICE MANAGEMENT
-- =====================================================

CREATE TABLE user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_token VARCHAR(500) UNIQUE NOT NULL, -- FCM token for push notifications
    device_type VARCHAR(50) NOT NULL, -- 'ios', 'android', 'web'
    device_name VARCHAR(200),
    platform_version VARCHAR(50),
    app_version VARCHAR(50),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS AND USAGE TRACKING
-- =====================================================

CREATE TABLE user_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES user_sessions(id),
    activity_type VARCHAR(50) NOT NULL, -- 'view_map', 'create_report', 'view_report'
    location_id UUID REFERENCES locations(id),
    coordinates GEOMETRY(POINT, 4326),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE api_usage_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date_hour TIMESTAMP WITH TIME ZONE NOT NULL, -- Truncated to hour
    endpoint VARCHAR(200) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    request_count INTEGER DEFAULT 1,
    avg_response_time DECIMAL(8,3), -- milliseconds
    unique_users INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date_hour, endpoint, method, status_code)
);

-- =====================================================
-- DATA SOURCE MANAGEMENT
-- =====================================================

CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'weather', 'surf', 'fire', 'traffic'
    base_url TEXT,
    api_key_required BOOLEAN DEFAULT FALSE,
    update_frequency_minutes INTEGER NOT NULL,
    last_successful_update TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    error_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE data_import_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_source_id UUID REFERENCES data_sources(id),
    import_type VARCHAR(50) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    records_processed INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'failed'
    error_details TEXT,
    metadata JSONB DEFAULT '{}'
);

-- =====================================================
-- SPATIAL INDEXES FOR PERFORMANCE
-- =====================================================

-- Spatial indexes for efficient geospatial queries
CREATE INDEX idx_locations_coordinates ON locations USING GIST (coordinates);
CREATE INDEX idx_regions_geometry ON regions USING GIST (geometry);
CREATE INDEX idx_regions_centroid ON regions USING GIST (centroid);
CREATE INDEX idx_user_reports_coordinates ON user_reports USING GIST (coordinates);
CREATE INDEX idx_fire_alerts_affected_area ON fire_alerts USING GIST (affected_area);
CREATE INDEX idx_fire_alerts_centroid ON fire_alerts USING GIST (centroid);
CREATE INDEX idx_traffic_conditions_road_segment ON traffic_conditions USING GIST (road_segment);

-- Time-based indexes for efficient real-time queries
CREATE INDEX idx_weather_conditions_timestamp ON weather_conditions (timestamp_utc DESC);
CREATE INDEX idx_surf_conditions_timestamp ON surf_conditions (timestamp_utc DESC);
CREATE INDEX idx_fire_alerts_issued_at ON fire_alerts (issued_at DESC);
CREATE INDEX idx_traffic_conditions_timestamp ON traffic_conditions (timestamp_utc DESC);
CREATE INDEX idx_user_reports_reported_at ON user_reports (reported_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX idx_weather_location_timestamp ON weather_conditions (location_id, timestamp_utc DESC);
CREATE INDEX idx_surf_location_timestamp ON surf_conditions (location_id, timestamp_utc DESC);
CREATE INDEX idx_user_reports_category_timestamp ON user_reports (category, reported_at DESC);
CREATE INDEX idx_notification_queue_user_status ON notification_queue (user_id, delivery_status, scheduled_at);

-- User-related indexes
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_country ON users (country_code);
CREATE INDEX idx_user_sessions_token ON user_sessions (session_token);
CREATE INDEX idx_user_subscriptions_user_active ON user_subscriptions (user_id, is_active);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_reports_updated_at BEFORE UPDATE ON user_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_devices_updated_at BEFORE UPDATE ON user_devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON data_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance_km(point1 GEOMETRY, point2 GEOMETRY)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ST_Distance(ST_Transform(point1, 3857), ST_Transform(point2, 3857)) / 1000.0;
END;
$$ LANGUAGE plpgsql;

-- Function to find nearby reports
CREATE OR REPLACE FUNCTION find_nearby_reports(
    input_coordinates GEOMETRY,
    radius_km DECIMAL DEFAULT 10.0,
    category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(200),
    category VARCHAR(50),
    distance_km DECIMAL,
    reported_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ur.id,
        ur.title,
        ur.category,
        calculate_distance_km(input_coordinates, ur.coordinates) as distance_km,
        ur.reported_at
    FROM user_reports ur
    WHERE 
        ST_DWithin(
            ST_Transform(input_coordinates, 3857),
            ST_Transform(ur.coordinates, 3857),
            radius_km * 1000
        )
        AND ur.is_public = TRUE
        AND (category_filter IS NULL OR ur.category = category_filter)
        AND ur.reported_at > NOW() - INTERVAL '24 hours'
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTITIONING FOR HIGH-VOLUME TABLES
-- =====================================================

-- Partition weather_conditions by month for better performance
-- This should be implemented based on data volume requirements

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert Australian states and territories
INSERT INTO regions (name, country_code, region_type, timezone) VALUES
('New South Wales', 'AU', 'state', 'Australia/Sydney'),
('Victoria', 'AU', 'state', 'Australia/Melbourne'),
('Queensland', 'AU', 'state', 'Australia/Brisbane'),
('Western Australia', 'AU', 'state', 'Australia/Perth'),
('South Australia', 'AU', 'state', 'Australia/Adelaide'),
('Tasmania', 'AU', 'state', 'Australia/Hobart'),
('Northern Territory', 'AU', 'territory', 'Australia/Darwin'),
('Australian Capital Territory', 'AU', 'territory', 'Australia/Sydney');

-- Insert New Zealand regions
INSERT INTO regions (name, country_code, region_type, timezone) VALUES
('Auckland', 'NZ', 'region', 'Pacific/Auckland'),
('Wellington', 'NZ', 'region', 'Pacific/Auckland'),
('Canterbury', 'NZ', 'region', 'Pacific/Auckland'),
('Waikato', 'NZ', 'region', 'Pacific/Auckland'),
('Bay of Plenty', 'NZ', 'region', 'Pacific/Auckland'),
('Otago', 'NZ', 'region', 'Pacific/Auckland'),
('Southland', 'NZ', 'region', 'Pacific/Auckland'),
('Manawatū-Whanganui', 'NZ', 'region', 'Pacific/Auckland'),
('Hawke''s Bay', 'NZ', 'region', 'Pacific/Auckland'),
('Taranaki', 'NZ', 'region', 'Pacific/Auckland');

-- Insert common data sources
INSERT INTO data_sources (name, source_type, update_frequency_minutes, is_active) VALUES
('Australian Bureau of Meteorology', 'weather', 30, true),
('MetService NZ', 'weather', 30, true),
('Surf Life Saving Australia', 'surf', 60, true),
('Surf Life Saving New Zealand', 'surf', 60, true),
('NSW Rural Fire Service', 'fire', 15, true),
('Fire and Emergency New Zealand', 'fire', 15, true),
('Transport for NSW', 'traffic', 5, true),
('Waka Kotahi NZ Transport Agency', 'traffic', 5, true);

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts and authentication data';
COMMENT ON TABLE weather_conditions IS 'Real-time and forecast weather data from official sources';
COMMENT ON TABLE surf_conditions IS 'Surf and ocean conditions for beaches and surf breaks';
COMMENT ON TABLE fire_alerts IS 'Fire warnings and emergency alerts from official sources';
COMMENT ON TABLE traffic_conditions IS 'Traffic incidents and road conditions';
COMMENT ON TABLE user_reports IS 'Community-submitted reports and observations';
COMMENT ON TABLE user_subscriptions IS 'User notification preferences and area subscriptions';
COMMENT ON TABLE locations IS 'Geographic locations including beaches, landmarks, and monitoring stations';
COMMENT ON TABLE regions IS 'Administrative regions for Australia and New Zealand';

-- Grant appropriate permissions (adjust as needed for your deployment)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;