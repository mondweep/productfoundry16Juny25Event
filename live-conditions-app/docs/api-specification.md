# API Specification - Live Conditions App

## Overview

This document defines the RESTful API endpoints and WebSocket events for the Aotearoa & Aussie Live Conditions application. The API follows REST principles with consistent URL patterns, HTTP methods, and response formats.

## Base URL

- **Development**: `https://dev-api.liveconditions.app/api/v1`
- **Staging**: `https://staging-api.liveconditions.app/api/v1`
- **Production**: `https://api.liveconditions.app/api/v1`

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456789"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456789"
  }
}
```

## Rate Limiting

- **Authenticated users**: 1000 requests per hour
- **Anonymous users**: 100 requests per hour
- **Real-time endpoints**: 10 requests per second

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248600
```

## Authentication Endpoints

### POST /auth/login
Authenticate user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    }
  }
}
```

### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "preferences": {
    "units": "metric",
    "timezone": "Australia/Sydney"
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/logout
Invalidate current session tokens.

**Headers:** `Authorization: Bearer <token>`

## User Management Endpoints

### GET /users/profile
Get current user profile information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar_url": "https://cdn.example.com/avatars/user_123.jpg",
    "preferences": {
      "units": "metric",
      "timezone": "Australia/Sydney",
      "notifications": {
        "email": true,
        "push": true,
        "sms": false
      }
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### PUT /users/profile
Update user profile information.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "Jane Doe",
  "preferences": {
    "units": "imperial",
    "timezone": "Pacific/Auckland"
  }
}
```

### GET /users/subscriptions
Get user's location-based alert subscriptions.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "sub_123",
      "name": "Home Area",
      "location": {
        "type": "Polygon",
        "coordinates": [[[151.2093, -33.8688], [151.2193, -33.8688], [151.2193, -33.8588], [151.2093, -33.8588], [151.2093, -33.8688]]]
      },
      "alert_types": ["weather", "emergency", "traffic"],
      "notification_methods": ["push", "email"],
      "active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /users/subscriptions
Create a new location subscription.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "Work Area",
  "location": {
    "type": "Polygon",
    "coordinates": [[[151.2093, -33.8688], [151.2193, -33.8688], [151.2193, -33.8588], [151.2093, -33.8588], [151.2093, -33.8688]]]
  },
  "alert_types": ["weather", "emergency"],
  "notification_methods": ["push"]
}
```

## Location & Reports Endpoints

### GET /locations/nearby
Get reports and data near a specific location.

**Query Parameters:**
- `lat` (required): Latitude
- `lng` (required): Longitude
- `radius` (optional): Radius in kilometers (default: 10, max: 100)
- `types` (optional): Comma-separated list of report types
- `limit` (optional): Number of results (default: 50, max: 200)

**Example:** `/locations/nearby?lat=-33.8688&lng=151.2093&radius=5&types=weather,traffic&limit=20`

**Response:**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "report_123",
        "user_id": "user_456",
        "location": {
          "type": "Point",
          "coordinates": [151.2093, -33.8688]
        },
        "report_type": "weather",
        "description": "Heavy rain and flooding on main street",
        "severity": 4,
        "media_urls": ["https://cdn.example.com/reports/photo1.jpg"],
        "verified": true,
        "created_at": "2024-01-15T10:15:00Z",
        "distance": 0.8
      }
    ],
    "weather_data": {
      "temperature": 22.5,
      "humidity": 78,
      "wind_speed": 15.2,
      "conditions": "Rainy"
    },
    "alerts": [
      {
        "id": "alert_789",
        "type": "severe_weather",
        "severity": "moderate",
        "message": "Heavy rain warning for Sydney metro area",
        "expires_at": "2024-01-15T18:00:00Z"
      }
    ]
  },
  "meta": {
    "total_reports": 1,
    "search_radius": 5,
    "center": [-33.8688, 151.2093]
  }
}
```

### POST /locations/reports
Submit a new location report.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "location": {
    "type": "Point",
    "coordinates": [151.2093, -33.8688]
  },
  "report_type": "traffic",
  "description": "Major accident blocking two lanes",
  "severity": 5,
  "media_urls": ["https://cdn.example.com/temp/photo_upload_123.jpg"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "report_456",
    "status": "pending_verification",
    "estimated_verification_time": "2024-01-15T10:45:00Z"
  }
}
```

### GET /locations/layers
Get map layer data for visualization.

**Query Parameters:**
- `bounds` (required): Bounding box as "sw_lat,sw_lng,ne_lat,ne_lng"
- `layers` (optional): Comma-separated list of layers (weather, traffic, alerts, reports)
- `zoom` (optional): Map zoom level (affects data density)

**Example:** `/locations/layers?bounds=-34.0,151.0,-33.0,152.0&layers=weather,reports&zoom=10`

**Response:**
```json
{
  "success": true,
  "data": {
    "weather": {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [151.2093, -33.8688]
          },
          "properties": {
            "temperature": 22.5,
            "conditions": "rainy",
            "icon": "rain"
          }
        }
      ]
    },
    "reports": {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [151.2093, -33.8688]
          },
          "properties": {
            "id": "report_123",
            "type": "traffic",
            "severity": 3,
            "age_minutes": 15
          }
        }
      ]
    }
  }
}
```

## Data Endpoints

### GET /data/weather
Get weather data for a specific location or region.

**Query Parameters:**
- `lat` (required): Latitude
- `lng` (required): Longitude
- `include` (optional): Additional data to include (forecast, radar, warnings)

**Response:**
```json
{
  "success": true,
  "data": {
    "current": {
      "temperature": 22.5,
      "feels_like": 24.2,
      "humidity": 78,
      "pressure": 1013.2,
      "wind_speed": 15.2,
      "wind_direction": 225,
      "visibility": 10,
      "uv_index": 6,
      "conditions": "Partly cloudy",
      "icon": "partly-cloudy",
      "observation_time": "2024-01-15T10:30:00Z"
    },
    "forecast": [
      {
        "date": "2024-01-15",
        "min_temp": 18,
        "max_temp": 26,
        "conditions": "Rainy",
        "chance_of_rain": 80,
        "icon": "rain"
      }
    ]
  }
}
```

### GET /data/alerts
Get active alerts for a region.

**Query Parameters:**
- `bounds` (required): Bounding box as "sw_lat,sw_lng,ne_lat,ne_lng"
- `severity` (optional): Minimum severity level (low, moderate, high, severe)
- `types` (optional): Alert types (weather, fire, flood, earthquake)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "alert_123",
      "type": "severe_weather",
      "severity": "high",
      "title": "Severe Thunderstorm Warning",
      "message": "Severe thunderstorms with damaging winds and large hail expected",
      "affected_areas": ["Sydney", "Central Coast", "Hunter"],
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[151.0, -34.0], [152.0, -34.0], [152.0, -33.0], [151.0, -33.0], [151.0, -34.0]]]
      },
      "issued_at": "2024-01-15T09:00:00Z",
      "expires_at": "2024-01-15T18:00:00Z",
      "source": "BOM",
      "url": "http://www.bom.gov.au/warnings/nsw/..."
    }
  ]
}
```

### GET /data/seismic
Get earthquake and seismic activity data (New Zealand).

**Query Parameters:**
- `region` (optional): NZ region code
- `magnitude_min` (optional): Minimum magnitude (default: 2.0)
- `hours` (optional): Hours back to search (default: 24, max: 168)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "quake_123",
      "magnitude": 4.2,
      "depth": 12.5,
      "location": {
        "type": "Point",
        "coordinates": [174.7633, -41.2865]
      },
      "locality": "10 km north-east of Wellington",
      "event_time": "2024-01-15T08:45:23Z",
      "quality": "best",
      "intensity": "light",
      "source": "GeoNet",
      "url": "https://www.geonet.org.nz/earthquake/..."
    }
  ]
}
```

## Notification Endpoints

### POST /notifications/send
Send a notification to users (admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request:**
```json
{
  "title": "Emergency Alert",
  "message": "Evacuation order issued for coastal areas",
  "target": {
    "type": "location",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[[151.0, -34.0], [152.0, -34.0], [152.0, -33.0], [151.0, -33.0], [151.0, -34.0]]]
    }
  },
  "priority": "high",
  "channels": ["push", "email"]
}
```

### GET /notifications/history
Get user's notification history.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (optional): Number of notifications (default: 20, max: 100)
- `offset` (optional): Pagination offset
- `read` (optional): Filter by read status (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_123",
      "title": "Weather Alert",
      "message": "Heavy rain warning for your subscribed area",
      "type": "weather",
      "priority": "medium",
      "read": false,
      "sent_at": "2024-01-15T10:00:00Z",
      "channels_sent": ["push"]
    }
  ],
  "meta": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "unread_count": 3
  }
}
```

## WebSocket Events

### Connection
Connect to WebSocket endpoint: `wss://api.liveconditions.app/socket.io`

**Authentication:**
```javascript
const socket = io('wss://api.liveconditions.app', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Client to Server Events

#### subscribe_location
Subscribe to real-time updates for a specific area.

```javascript
socket.emit('subscribe_location', {
  bounds: {
    southwest: { lat: -34.0, lng: 151.0 },
    northeast: { lat: -33.0, lng: 152.0 }
  },
  layers: ['weather', 'reports', 'alerts']
});
```

#### unsubscribe_location
Unsubscribe from location updates.

```javascript
socket.emit('unsubscribe_location', {
  subscription_id: 'sub_123'
});
```

#### report_update
Real-time report submission (authenticated users only).

```javascript
socket.emit('report_update', {
  report_id: 'report_456',
  location: { lat: -33.8688, lng: 151.2093 },
  type: 'traffic',
  description: 'Accident cleared, traffic flowing normally',
  severity: 1
});
```

### Server to Client Events

#### location_data
Real-time location data updates.

```javascript
socket.on('location_data', (data) => {
  // data.type: 'weather' | 'report' | 'alert'
  // data.action: 'create' | 'update' | 'delete'
  // data.payload: actual data object
  console.log('Received update:', data);
});
```

#### alert_notification
Critical alerts and emergency notifications.

```javascript
socket.on('alert_notification', (alert) => {
  // Urgent notification that should be displayed immediately
  console.log('Alert:', alert);
});
```

#### connection_status
Connection status and room information.

```javascript
socket.on('connection_status', (status) => {
  // status.connected: boolean
  // status.subscriptions: array of active subscriptions
  // status.user_id: user identifier
  console.log('Connection status:', status);
});
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_REQUIRED` | 401 | Valid authentication token required |
| `AUTHORIZATION_FAILED` | 403 | User lacks permission for this resource |
| `VALIDATION_ERROR` | 400 | Request data validation failed |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource does not exist |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded for this endpoint |
| `INTERNAL_ERROR` | 500 | Internal server error occurred |
| `SERVICE_UNAVAILABLE` | 503 | External service temporarily unavailable |
| `INVALID_LOCATION` | 400 | Invalid geographic coordinates provided |
| `REPORT_TOO_OLD` | 400 | Report timestamp too old to accept |
| `MEDIA_UPLOAD_FAILED` | 400 | Media file upload or processing failed |

## Data Types

### Location GeoJSON
```typescript
interface Location {
  type: 'Point' | 'Polygon';
  coordinates: number[] | number[][][];
}
```

### Report Types
- `weather` - Weather conditions and observations
- `traffic` - Traffic incidents and conditions
- `emergency` - Emergency situations
- `surf` - Surf and beach conditions
- `fire` - Fire incidents and smoke
- `flood` - Flooding reports
- `earthquake` - Earthquake felt reports

### Severity Levels
- `1` - Very Low / Informational
- `2` - Low / Minor impact
- `3` - Moderate / Some impact
- `4` - High / Significant impact
- `5` - Severe / Major impact

### Notification Priorities
- `low` - Standard notifications
- `medium` - Important updates
- `high` - Urgent alerts
- `critical` - Emergency notifications

This API specification provides a comprehensive foundation for implementing the Live Conditions application with proper REST principles, real-time capabilities, and robust error handling.