-- Migration: 001_initial_schema.sql
-- Description: Create initial database schema with PostGIS support
-- Created: 2025-07-16
-- Author: Database Designer Agent

BEGIN;

-- Check if this migration has already been applied
-- (In a real system, you'd have a migrations table to track this)

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Set timezone to handle AU/NZ properly
SET timezone = 'UTC';

-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users and authentication tables
\i '/database/schema_parts/001_users.sql'

-- Geospatial tables
\i '/database/schema_parts/002_geospatial.sql'

-- Environmental conditions tables
\i '/database/schema_parts/003_conditions.sql'

-- User generated content tables
\i '/database/schema_parts/004_user_content.sql'

-- Notifications and subscriptions
\i '/database/schema_parts/005_notifications.sql'

-- Analytics and logging
\i '/database/schema_parts/006_analytics.sql'

-- Data source management
\i '/database/schema_parts/007_data_sources.sql'

-- Indexes and performance optimizations
\i '/database/schema_parts/008_indexes.sql'

-- Functions and triggers
\i '/database/schema_parts/009_functions.sql'

-- Initial data
\i '/database/schema_parts/010_initial_data.sql'

-- Record this migration as applied
INSERT INTO schema_migrations (version) VALUES ('001_initial_schema')
ON CONFLICT (version) DO NOTHING;

COMMIT;