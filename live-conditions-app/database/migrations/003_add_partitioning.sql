-- Migration: 003_add_partitioning.sql
-- Description: Add table partitioning for high-volume time-series data
-- Created: 2025-07-16
-- Author: Database Designer Agent

BEGIN;

-- Create partitioned tables for high-volume data
-- This is crucial for maintaining performance with large amounts of time-series data

-- Create partitioned weather_conditions table
CREATE TABLE weather_conditions_partitioned (
    LIKE weather_conditions INCLUDING ALL
) PARTITION BY RANGE (timestamp_utc);

-- Create monthly partitions for the current year and next year
-- In production, these should be created automatically
DO $$
DECLARE
    start_date DATE;
    end_date DATE;
    table_name TEXT;
BEGIN
    FOR i IN 0..23 LOOP
        start_date := DATE_TRUNC('month', CURRENT_DATE) + (i || ' months')::INTERVAL;
        end_date := start_date + '1 month'::INTERVAL;
        table_name := 'weather_conditions_' || TO_CHAR(start_date, 'YYYY_MM');
        
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF weather_conditions_partitioned 
             FOR VALUES FROM (%L) TO (%L)',
            table_name, start_date, end_date
        );
    END LOOP;
END $$;

-- Create partitioned surf_conditions table
CREATE TABLE surf_conditions_partitioned (
    LIKE surf_conditions INCLUDING ALL
) PARTITION BY RANGE (timestamp_utc);

-- Create monthly partitions for surf conditions
DO $$
DECLARE
    start_date DATE;
    end_date DATE;
    table_name TEXT;
BEGIN
    FOR i IN 0..23 LOOP
        start_date := DATE_TRUNC('month', CURRENT_DATE) + (i || ' months')::INTERVAL;
        end_date := start_date + '1 month'::INTERVAL;
        table_name := 'surf_conditions_' || TO_CHAR(start_date, 'YYYY_MM');
        
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF surf_conditions_partitioned 
             FOR VALUES FROM (%L) TO (%L)',
            table_name, start_date, end_date
        );
    END LOOP;
END $$;

-- Create partitioned user_activity_log table
CREATE TABLE user_activity_log_partitioned (
    LIKE user_activity_log INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for user activity
DO $$
DECLARE
    start_date DATE;
    end_date DATE;
    table_name TEXT;
BEGIN
    FOR i IN 0..11 LOOP
        start_date := DATE_TRUNC('month', CURRENT_DATE) + (i || ' months')::INTERVAL;
        end_date := start_date + '1 month'::INTERVAL;
        table_name := 'user_activity_log_' || TO_CHAR(start_date, 'YYYY_MM');
        
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF user_activity_log_partitioned 
             FOR VALUES FROM (%L) TO (%L)',
            table_name, start_date, end_date
        );
    END LOOP;
END $$;

-- Function to automatically create new partitions
CREATE OR REPLACE FUNCTION create_monthly_partition(
    table_name TEXT,
    target_date DATE
) RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    start_date := DATE_TRUNC('month', target_date);
    end_date := start_date + '1 month'::INTERVAL;
    partition_name := table_name || '_' || TO_CHAR(start_date, 'YYYY_MM');
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I 
         FOR VALUES FROM (%L) TO (%L)',
        partition_name, table_name, start_date, end_date
    );
END;
$$ LANGUAGE plpgsql;

-- Schedule automatic partition creation (would be called by a cron job)
CREATE OR REPLACE FUNCTION maintain_partitions() RETURNS VOID AS $$
BEGIN
    -- Create partitions for next 3 months
    PERFORM create_monthly_partition('weather_conditions_partitioned', CURRENT_DATE + '1 month'::INTERVAL);
    PERFORM create_monthly_partition('weather_conditions_partitioned', CURRENT_DATE + '2 months'::INTERVAL);
    PERFORM create_monthly_partition('weather_conditions_partitioned', CURRENT_DATE + '3 months'::INTERVAL);
    
    PERFORM create_monthly_partition('surf_conditions_partitioned', CURRENT_DATE + '1 month'::INTERVAL);
    PERFORM create_monthly_partition('surf_conditions_partitioned', CURRENT_DATE + '2 months'::INTERVAL);
    PERFORM create_monthly_partition('surf_conditions_partitioned', CURRENT_DATE + '3 months'::INTERVAL);
    
    PERFORM create_monthly_partition('user_activity_log_partitioned', CURRENT_DATE + '1 month'::INTERVAL);
    PERFORM create_monthly_partition('user_activity_log_partitioned', CURRENT_DATE + '2 months'::INTERVAL);
    PERFORM create_monthly_partition('user_activity_log_partitioned', CURRENT_DATE + '3 months'::INTERVAL);
END;
$$ LANGUAGE plpgsql;

-- Record this migration as applied
INSERT INTO schema_migrations (version) VALUES ('003_add_partitioning')
ON CONFLICT (version) DO NOTHING;

COMMIT;