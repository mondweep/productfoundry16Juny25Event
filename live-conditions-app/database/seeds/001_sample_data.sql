-- Sample data for testing and development
-- File: 001_sample_data.sql
-- Created: 2025-07-16
-- Author: Database Designer Agent

BEGIN;

-- Sample users for testing
INSERT INTO users (id, email, password_hash, username, first_name, last_name, country_code, timezone) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'surfer.pete@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LGf/FzRvAYawhkMaS', 'surfer_pete', 'Pete', 'Wilson', 'AU', 'Australia/Sydney'),
('550e8400-e29b-41d4-a716-446655440002', 'kiwi.sarah@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LGf/FzRvAYawhkMaS', 'kiwi_sarah', 'Sarah', 'Johnson', 'NZ', 'Pacific/Auckland'),
('550e8400-e29b-41d4-a716-446655440003', 'beach.lover@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LGf/FzRvAYawhkMaS', 'beach_lover', 'Mike', 'Thompson', 'AU', 'Australia/Brisbane'),
('550e8400-e29b-41d4-a716-446655440004', 'hiking.fan@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LGf/FzRvAYawhkMaS', 'hiking_fan', 'Emma', 'Davis', 'NZ', 'Pacific/Auckland'),
('550e8400-e29b-41d4-a716-446655440005', 'weather.watcher@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LGf/FzRvAYawhkMaS', 'weather_watcher', 'James', 'Brown', 'AU', 'Australia/Melbourne');

-- Sample locations - Famous beaches and surf spots
INSERT INTO locations (id, name, location_type, coordinates, country_code, address, postcode) VALUES
-- Australian beaches
('loc-bondi-beach', 'Bondi Beach', 'beach', ST_SetSRID(ST_MakePoint(151.2767, -33.8915), 4326), 'AU', 'Bondi Beach NSW', '2026'),
('loc-bells-beach', 'Bells Beach', 'surf_break', ST_SetSRID(ST_MakePoint(144.2833, -38.3667), 4326), 'AU', 'Bells Beach VIC', '3228'),
('loc-byron-bay', 'Byron Bay', 'beach', ST_SetSRID(ST_MakePoint(153.6167, -28.6500), 4326), 'AU', 'Byron Bay NSW', '2481'),
('loc-gold-coast', 'Gold Coast Main Beach', 'beach', ST_SetSRID(ST_MakePoint(153.4333, -27.9667), 4326), 'AU', 'Main Beach QLD', '4217'),
('loc-manly-beach', 'Manly Beach', 'beach', ST_SetSRID(ST_MakePoint(151.2889, -33.7969), 4326), 'AU', 'Manly NSW', '2095'),

-- New Zealand beaches
('loc-piha-beach', 'Piha Beach', 'beach', ST_SetSRID(ST_MakePoint(174.4667, -36.9500), 4326), 'NZ', 'Piha Auckland', '0772'),
('loc-raglan', 'Raglan', 'surf_break', ST_SetSRID(ST_MakePoint(174.8667, -37.8000), 4326), 'NZ', 'Raglan Waikato', '3225'),
('loc-mount-maunganui', 'Mount Maunganui', 'beach', ST_SetSRID(ST_MakePoint(176.1833, -37.6333), 4326), 'NZ', 'Mount Maunganui Bay of Plenty', '3116'),
('loc-wellington-harbor', 'Wellington Harbour', 'beach', ST_SetSRID(ST_MakePoint(174.7833, -41.2833), 4326), 'NZ', 'Wellington', '6011'),
('loc-takapuna-beach', 'Takapuna Beach', 'beach', ST_SetSRID(ST_MakePoint(174.7667, -36.7833), 4326), 'NZ', 'Takapuna Auckland', '0622');

-- Weather monitoring stations
INSERT INTO locations (id, name, location_type, coordinates, country_code, is_official, elevation) VALUES
('loc-sydney-observatory', 'Sydney Observatory Hill', 'weather_station', ST_SetSRID(ST_MakePoint(151.2058, -33.8587), 4326), 'AU', true, 39),
('loc-melbourne-airport', 'Melbourne Airport', 'weather_station', ST_SetSRID(ST_MakePoint(144.8436, -37.6690), 4326), 'AU', true, 113),
('loc-auckland-airport', 'Auckland Airport', 'weather_station', ST_SetSRID(ST_MakePoint(174.7850, -37.0082), 4326), 'NZ', true, 7),
('loc-wellington-kelburn', 'Wellington Kelburn', 'weather_station', ST_SetSRID(ST_MakePoint(174.7684, -41.2865), 4326), 'NZ', true, 125);

-- Sample weather conditions
INSERT INTO weather_conditions (location_id, data_source, external_id, timestamp_utc, temperature, feels_like, humidity, wind_speed, wind_direction, weather_description, weather_code) VALUES
('loc-bondi-beach', 'Australian Bureau of Meteorology', 'BOM_66062', NOW() - INTERVAL '1 hour', 22.5, 24.1, 68.0, 15.2, 220, 'Partly cloudy', 'PARTLY_CLOUDY'),
('loc-bondi-beach', 'Australian Bureau of Meteorology', 'BOM_66062', NOW() - INTERVAL '2 hours', 21.8, 23.5, 72.0, 12.8, 215, 'Partly cloudy', 'PARTLY_CLOUDY'),
('loc-byron-bay', 'Australian Bureau of Meteorology', 'BOM_58217', NOW() - INTERVAL '30 minutes', 25.2, 27.1, 75.0, 8.5, 180, 'Sunny', 'CLEAR'),
('loc-piha-beach', 'MetService NZ', 'MSVC_1401', NOW() - INTERVAL '45 minutes', 18.5, 19.2, 82.0, 22.3, 250, 'Light rain', 'LIGHT_RAIN'),
('loc-raglan', 'MetService NZ', 'MSVC_1502', NOW() - INTERVAL '1 hour', 19.1, 20.0, 78.0, 18.7, 240, 'Overcast', 'OVERCAST');

-- Sample surf conditions
INSERT INTO surf_conditions (location_id, data_source, external_id, timestamp_utc, wave_height, wave_period, wave_direction, swell_height, swell_period, swell_direction, wind_effect, tide_height, surf_rating, water_temperature) VALUES
('loc-bondi-beach', 'Surf Life Saving Australia', 'SLSA_BON001', NOW() - INTERVAL '30 minutes', 1.8, 8.5, 180, 2.1, 12.0, 185, 'offshore', 1.4, 7, 19.2),
('loc-bells-beach', 'Surf Life Saving Australia', 'SLSA_BEL001', NOW() - INTERVAL '45 minutes', 2.5, 10.2, 210, 3.2, 14.5, 215, 'offshore', 0.8, 8, 16.5),
('loc-byron-bay', 'Surf Life Saving Australia', 'SLSA_BYR001', NOW() - INTERVAL '1 hour', 1.2, 6.8, 120, 1.5, 9.2, 125, 'cross-shore', 1.9, 5, 21.8),
('loc-piha-beach', 'Surf Life Saving New Zealand', 'SLSNZ_PIH001', NOW() - INTERVAL '20 minutes', 2.8, 11.5, 260, 3.5, 15.8, 265, 'onshore', 1.1, 6, 17.2),
('loc-raglan', 'Surf Life Saving New Zealand', 'SLSNZ_RAG001', NOW() - INTERVAL '35 minutes', 3.1, 13.2, 240, 4.2, 16.5, 245, 'offshore', 0.5, 9, 18.1);

-- Sample user reports
INSERT INTO user_reports (id, user_id, coordinates, location_id, category, subcategory, title, description, severity, reported_at) VALUES
('rep-001', '550e8400-e29b-41d4-a716-446655440001', ST_SetSRID(ST_MakePoint(151.2767, -33.8915), 4326), 'loc-bondi-beach', 'wildlife', 'marine', 'Bluebottle jellyfish warning', 'Large number of bluebottles washed up on shore. Swimmers advised to be cautious.', 'warning', NOW() - INTERVAL '2 hours'),
('rep-002', '550e8400-e29b-41d4-a716-446655440002', ST_SetSRID(ST_MakePoint(174.4667, -36.9500), 4326), 'loc-piha-beach', 'safety', 'water', 'Strong rip current', 'Very strong rip current on north end of beach. Lifeguards have flagged danger zone.', 'warning', NOW() - INTERVAL '1 hour'),
('rep-003', '550e8400-e29b-41d4-a716-446655440003', ST_SetSRID(ST_MakePoint(153.4333, -27.9667), 4326), 'loc-gold-coast', 'vibe', 'conditions', 'Perfect surf conditions', 'Glass-off conditions with offshore winds. Waves are clean and consistent.', 'info', NOW() - INTERVAL '30 minutes'),
('rep-004', '550e8400-e29b-41d4-a716-446655440004', ST_SetSRID(ST_MakePoint(176.1833, -37.6333), 4326), 'loc-mount-maunganui', 'traffic', 'parking', 'Limited parking available', 'Beach carpark is nearly full. Alternative parking on side streets recommended.', 'info', NOW() - INTERVAL '45 minutes'),
('rep-005', '550e8400-e29b-41d4-a716-446655440005', ST_SetSRID(ST_MakePoint(151.2889, -33.7969), 4326), 'loc-manly-beach', 'weather', 'local', 'Sudden weather change', 'Dark clouds rolling in from the west. Possible thunderstorm approaching.', 'warning', NOW() - INTERVAL '15 minutes');

-- Sample fire alerts (fictional for testing)
INSERT INTO fire_alerts (alert_id, data_source, alert_type, severity, title, description, affected_area, centroid, region_names, issued_at, updated_at, is_active) VALUES
('FIRE_NSW_001', 'NSW Rural Fire Service', 'watch_act', 'high', 'Blue Mountains Fire Warning', 'Bushfire burning near residential areas in Katoomba. Residents should monitor conditions and prepare to leave if necessary.', 
 ST_SetSRID(ST_GeomFromText('POLYGON((150.2 -33.7, 150.4 -33.7, 150.4 -33.9, 150.2 -33.9, 150.2 -33.7))'), 4326),
 ST_SetSRID(ST_MakePoint(150.3, -33.8), 4326),
 ARRAY['Blue Mountains', 'Katoomba', 'Leura'],
 NOW() - INTERVAL '3 hours',
 NOW() - INTERVAL '1 hour',
 true),
('FIRE_NZ_001', 'Fire and Emergency New Zealand', 'advice', 'moderate', 'Canterbury Grassland Fire', 'Controlled burn of grassland near Christchurch. Smoke may affect visibility on nearby roads.',
 ST_SetSRID(ST_GeomFromText('POLYGON((172.5 -43.5, 172.7 -43.5, 172.7 -43.7, 172.5 -43.7, 172.5 -43.5))'), 4326),
 ST_SetSRID(ST_MakePoint(172.6, -43.6), 4326),
 ARRAY['Canterbury', 'Christchurch'],
 NOW() - INTERVAL '2 hours',
 NOW() - INTERVAL '30 minutes',
 true);

-- Sample traffic conditions
INSERT INTO traffic_conditions (location_id, data_source, road_name, incident_type, severity, description, estimated_delay, speed_kmh, typical_speed_kmh, traffic_flow, timestamp_utc, is_active) VALUES
('loc-sydney-observatory', 'Transport for NSW', 'Harbour Bridge', 'congestion', 'moderate', 'Heavy traffic during morning peak. Expect delays.', 15, 25, 60, 'slow', NOW() - INTERVAL '10 minutes', true),
('loc-auckland-airport', 'Waka Kotahi NZ Transport Agency', 'State Highway 20', 'roadwork', 'minor', 'Lane closure for maintenance work. Traffic merging to left lane.', 5, 45, 80, 'slow', NOW() - INTERVAL '20 minutes', true);

-- Sample user subscriptions
INSERT INTO user_subscriptions (user_id, subscription_type, location_id, categories, severity_levels, notification_methods, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'location', 'loc-bondi-beach', ARRAY['weather', 'surf', 'safety'], ARRAY['warning', 'emergency'], ARRAY['push', 'email'], true),
('550e8400-e29b-41d4-a716-446655440002', 'location', 'loc-piha-beach', ARRAY['surf', 'safety', 'wildlife'], ARRAY['info', 'warning', 'emergency'], ARRAY['push'], true),
('550e8400-e29b-41d4-a716-446655440003', 'coordinates', NULL, ARRAY['surf', 'weather'], ARRAY['info', 'warning'], ARRAY['push'], true),
('550e8400-e29b-41d4-a716-446655440004', 'location', 'loc-mount-maunganui', ARRAY['weather', 'traffic'], ARRAY['warning', 'emergency'], ARRAY['push', 'email'], true),
('550e8400-e29b-41d4-a716-446655440005', 'region', NULL, ARRAY['fire', 'emergency'], ARRAY['warning', 'emergency'], ARRAY['push', 'email', 'sms'], true);

-- Update subscription coordinates for coordinate-based subscriptions
UPDATE user_subscriptions 
SET coordinates = ST_SetSRID(ST_MakePoint(153.4333, -27.9667), 4326), radius_km = 25.0 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440003';

-- Sample user devices for push notifications
INSERT INTO user_devices (user_id, device_token, device_type, device_name, platform_version, app_version, push_enabled) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'fcm_token_abc123xyz789', 'ios', 'Pete''s iPhone', 'iOS 17.1', '1.0.0', true),
('550e8400-e29b-41d4-a716-446655440002', 'fcm_token_def456uvw012', 'android', 'Sarah''s Galaxy', 'Android 14', '1.0.0', true),
('550e8400-e29b-41d4-a716-446655440003', 'fcm_token_ghi789rst345', 'ios', 'Mike''s iPhone', 'iOS 16.7', '1.0.0', true),
('550e8400-e29b-41d4-a716-446655440004', 'fcm_token_jkl012mno678', 'android', 'Emma''s Pixel', 'Android 13', '1.0.0', true),
('550e8400-e29b-41d4-a716-446655440005', 'web_token_pqr345stu901', 'web', 'Chrome Browser', 'Chrome 120', '1.0.0', true);

-- Sample user activity for analytics
INSERT INTO user_activity_log (user_id, activity_type, location_id, coordinates, metadata) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'view_map', 'loc-bondi-beach', ST_SetSRID(ST_MakePoint(151.2767, -33.8915), 4326), '{"zoom_level": 15, "duration_seconds": 120}'),
('550e8400-e29b-41d4-a716-446655440002', 'create_report', 'loc-piha-beach', ST_SetSRID(ST_MakePoint(174.4667, -36.9500), 4326), '{"report_category": "safety", "report_id": "rep-002"}'),
('550e8400-e29b-41d4-a716-446655440003', 'view_report', 'loc-gold-coast', ST_SetSRID(ST_MakePoint(153.4333, -27.9667), 4326), '{"report_id": "rep-003", "view_duration": 45}'),
('550e8400-e29b-41d4-a716-446655440004', 'view_weather', 'loc-mount-maunganui', ST_SetSRID(ST_MakePoint(176.1833, -37.6333), 4326), '{"data_source": "MetService", "forecast_days": 3}'),
('550e8400-e29b-41d4-a716-446655440005', 'subscription_update', NULL, NULL, '{"action": "add", "subscription_type": "region", "categories": ["fire", "emergency"]}');

-- Sample report votes
INSERT INTO report_votes (report_id, user_id, vote_type) VALUES
('rep-001', '550e8400-e29b-41d4-a716-446655440002', 'helpful'),
('rep-001', '550e8400-e29b-41d4-a716-446655440003', 'helpful'),
('rep-002', '550e8400-e29b-41d4-a716-446655440001', 'helpful'),
('rep-002', '550e8400-e29b-41d4-a716-446655440004', 'helpful'),
('rep-003', '550e8400-e29b-41d4-a716-446655440005', 'helpful'),
('rep-004', '550e8400-e29b-41d4-a716-446655440001', 'helpful'),
('rep-005', '550e8400-e29b-41d4-a716-446655440002', 'helpful');

-- Update vote scores on reports
UPDATE user_reports SET vote_score = 2 WHERE id = 'rep-001';
UPDATE user_reports SET vote_score = 2 WHERE id = 'rep-002';
UPDATE user_reports SET vote_score = 1 WHERE id = 'rep-003';
UPDATE user_reports SET vote_score = 1 WHERE id = 'rep-004';
UPDATE user_reports SET vote_score = 1 WHERE id = 'rep-005';

COMMIT;