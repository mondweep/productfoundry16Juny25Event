-- Migration: 002_add_indexes.sql
-- Description: Add additional performance indexes based on query patterns
-- Created: 2025-07-16
-- Author: Database Designer Agent

BEGIN;

-- Add specialized indexes for high-frequency queries

-- Composite index for weather data queries by location and time range
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_weather_location_time_range 
ON weather_conditions (location_id, timestamp_utc DESC, data_source);

-- Index for active fire alerts by severity and location
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fire_alerts_active_severity 
ON fire_alerts (is_active, severity, issued_at DESC) 
WHERE is_active = true;

-- Index for recent user reports by category and public visibility
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_reports_recent_public 
ON user_reports (category, is_public, reported_at DESC) 
WHERE is_public = true AND reported_at > NOW() - INTERVAL '7 days';

-- Index for user subscription proximity queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_subscriptions_coordinates 
ON user_subscriptions USING GIST (coordinates) 
WHERE coordinates IS NOT NULL AND is_active = true;

-- Index for traffic conditions by road and timestamp
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_traffic_road_timestamp 
ON traffic_conditions (road_name, timestamp_utc DESC, is_active) 
WHERE is_active = true;

-- Partial index for pending notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_queue_pending 
ON notification_queue (scheduled_at ASC, priority DESC) 
WHERE delivery_status = 'pending';

-- Index for user activity analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_type_date 
ON user_activity_log (activity_type, created_at DESC);

-- Index for API usage statistics aggregation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_date_endpoint 
ON api_usage_stats (date_hour DESC, endpoint, status_code);

-- Record this migration as applied
INSERT INTO schema_migrations (version) VALUES ('002_add_indexes')
ON CONFLICT (version) DO NOTHING;

COMMIT;