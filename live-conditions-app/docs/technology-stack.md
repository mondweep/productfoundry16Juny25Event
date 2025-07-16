# Technology Stack Recommendations - Live Conditions App

## Overview

This document provides detailed technology stack recommendations for the Aotearoa & Aussie Live Conditions application, considering scalability, performance, developer experience, and operational requirements.

## Frontend Technology Stack

### Primary Framework: Next.js 14 + React 18

**Rationale:**
- **Server-Side Rendering (SSR)** for improved SEO and initial load performance
- **Static Site Generation (SSG)** for optimized map tiles and static content
- **Edge Runtime** support for reduced latency in AU/NZ regions
- **Built-in API routes** for serverless functions
- **Image optimization** for map overlays and user-uploaded media

**Configuration:**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverActions: true,
  },
  images: {
    domains: ['api.liveconditions.app', 'cdn.liveconditions.app'],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
    WEBSOCKET_URL: process.env.WEBSOCKET_URL,
  },
}

module.exports = nextConfig
```

### Mapping Library: Mapbox GL JS

**Rationale:**
- **Vector tiles** for smooth zooming and performance
- **Custom styling** for different map layers
- **Real-time data integration** capabilities
- **3D terrain** support for topographical features
- **Mobile optimization** for touch interactions

**Alternative:** OpenLayers + OpenStreetMap for cost-sensitive deployments

**Implementation:**
```javascript
// components/Map.jsx
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const MapComponent = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [174.7633, -41.2865], // Wellington, NZ
      zoom: 5,
    });

    // Add real-time data sources
    map.current.on('load', () => {
      addRealtimeDataSources(map.current);
    });
  }, []);

  return <div ref={mapContainer} className="map-container" />;
};
```

### State Management: Zustand + React Query

**Rationale:**
- **Zustand** for global application state (lightweight, TypeScript-friendly)
- **React Query** for server state management and caching
- **Separation of concerns** between UI state and server state

**Configuration:**
```javascript
// stores/useAppStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set, get) => ({
      user: null,
      mapSettings: {
        center: [174.7633, -41.2865],
        zoom: 5,
        activeLayers: ['weather', 'reports'],
      },
      notifications: {
        enabled: true,
        sound: true,
        vibration: true,
      },
      setUser: (user) => set({ user }),
      updateMapSettings: (settings) => 
        set((state) => ({ 
          mapSettings: { ...state.mapSettings, ...settings } 
        })),
    }),
    {
      name: 'live-conditions-storage',
      partialize: (state) => ({ 
        mapSettings: state.mapSettings,
        notifications: state.notifications 
      }),
    }
  )
);
```

### UI Components: Tailwind CSS + Headless UI

**Rationale:**
- **Utility-first** CSS for rapid development
- **Mobile-first** responsive design
- **Headless UI** for accessible components
- **Custom design system** for brand consistency

**Configuration:**
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          900: '#7f1d1d',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### Real-time Communication: Socket.IO Client

**Implementation:**
```javascript
// hooks/useSocket.js
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAppStore } from '../stores/useAppStore';

export const useSocket = () => {
  const socket = useRef(null);
  const user = useAppStore((state) => state.user);

  useEffect(() => {
    if (!user) return;

    socket.current = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL, {
      auth: { token: user.token },
      transports: ['websocket', 'polling'],
    });

    socket.current.on('connect', () => {
      console.log('Connected to real-time server');
    });

    return () => {
      socket.current?.disconnect();
    };
  }, [user]);

  return socket.current;
};
```

## Backend Technology Stack

### Primary Framework: Node.js + Express.js

**Rationale:**
- **JavaScript ecosystem** consistency with frontend
- **NPM package ecosystem** for rapid development
- **Non-blocking I/O** for handling concurrent connections
- **Microservices architecture** support

**Core API Structure:**
```javascript
// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP',
});
app.use('/api/', limiter);

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/locations', require('./routes/locations'));
app.use('/api/v1/data', require('./routes/data'));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Data Processing: Python FastAPI (Microservice)

**Rationale:**
- **High-performance** data processing for weather/seismic analysis
- **Type hints** for better code quality
- **Automatic API documentation** with OpenAPI
- **Machine learning** integration capabilities

**Use Cases:**
- Weather data normalization and forecasting
- Seismic data analysis and alerting
- Image processing for user-uploaded media
- Geographic data processing and spatial analysis

**Implementation:**
```python
# data_processor/main.py
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import asyncio
import aiohttp
from typing import List, Dict

app = FastAPI(title="Live Conditions Data Processor")

class WeatherData(BaseModel):
    location: Dict[str, float]
    temperature: float
    humidity: float
    pressure: float
    timestamp: str

@app.post("/process/weather")
async def process_weather_data(data: List[WeatherData], background_tasks: BackgroundTasks):
    """Process and normalize weather data from multiple sources"""
    background_tasks.add_task(normalize_weather_data, data)
    return {"status": "processing", "count": len(data)}

async def normalize_weather_data(data: List[WeatherData]):
    """Background task for data normalization"""
    # Process and store normalized data
    pass
```

### Authentication: Auth0 / Supabase Auth

**Recommendation: Supabase Auth**

**Rationale:**
- **PostgreSQL integration** with user management
- **Row Level Security (RLS)** for data protection
- **Social login** providers support
- **Real-time subscriptions** built-in
- **Edge functions** for custom authentication logic

**Configuration:**
```javascript
// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

## Database Technology Stack

### Primary Database: PostgreSQL 15 + PostGIS

**Rationale:**
- **PostGIS extension** for geospatial data and queries
- **ACID compliance** for data consistency
- **Advanced indexing** for performance optimization
- **JSON/JSONB support** for flexible schema design
- **Mature ecosystem** with excellent tooling

**Schema Design:**
```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with RLS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Location reports with spatial indexing
CREATE TABLE location_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  description TEXT,
  severity SMALLINT CHECK (severity >= 1 AND severity <= 5),
  media_urls TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT FALSE,
  verification_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spatial index for location queries
CREATE INDEX idx_location_reports_spatial 
  ON location_reports USING GIST (location);

-- Composite index for common queries
CREATE INDEX idx_location_reports_type_time 
  ON location_reports (report_type, created_at DESC);

-- Full-text search index
CREATE INDEX idx_location_reports_search 
  ON location_reports USING GIN (to_tsvector('english', description));
```

### Cache Layer: Redis 7

**Configuration:**
```yaml
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000

# Enable keyspace notifications for pub/sub
notify-keyspace-events Ex
```

**Usage Patterns:**
```javascript
// lib/redis.js
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

// Caching pattern
const cacheKey = `weather:${lat}:${lng}`;
const cachedData = await redis.get(cacheKey);

if (cachedData) {
  return JSON.parse(cachedData);
}

const freshData = await fetchWeatherData(lat, lng);
await redis.setex(cacheKey, 300, JSON.stringify(freshData)); // 5 min TTL
return freshData;
```

### Time Series: InfluxDB 2.0

**Use Cases:**
- Weather sensor data
- Application performance metrics
- User activity tracking
- Real-time analytics

**Configuration:**
```javascript
// lib/influxdb.js
const { InfluxDB, Point } = require('@influxdata/influxdb-client');

const client = new InfluxDB({
  url: process.env.INFLUXDB_URL,
  token: process.env.INFLUXDB_TOKEN,
});

const writeApi = client.getWriteApi(
  process.env.INFLUXDB_ORG,
  process.env.INFLUXDB_BUCKET
);

// Write weather data point
const point = new Point('weather')
  .tag('location', 'sydney')
  .tag('source', 'bom')
  .floatField('temperature', 22.5)
  .floatField('humidity', 78)
  .timestamp(new Date());

writeApi.writePoint(point);
```

## Infrastructure & DevOps Stack

### Container Orchestration: Docker + Kubernetes

**Docker Configuration:**
```dockerfile
# Dockerfile.frontend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

**Kubernetes Deployment:**
```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: liveconditions/frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_API_URL
          value: "https://api.liveconditions.app"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
spec:
  selector:
    app: frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

### Cloud Provider: AWS (Multi-Region)

**Recommended Services:**
- **EKS** (Elastic Kubernetes Service) for container orchestration
- **RDS PostgreSQL** with Multi-AZ deployment
- **ElastiCache Redis** for caching layer
- **S3** for media storage with CloudFront CDN
- **ALB** (Application Load Balancer) for traffic distribution
- **Route 53** for DNS and health checks
- **CloudWatch** for monitoring and alerting

**Terraform Configuration:**
```hcl
# infrastructure/aws/main.tf
provider "aws" {
  region = var.aws_region
}

resource "aws_eks_cluster" "live_conditions" {
  name     = "live-conditions-cluster"
  role_arn = aws_iam_role.cluster.arn

  vpc_config {
    subnet_ids = [
      aws_subnet.private[0].id,
      aws_subnet.private[1].id,
    ]
    endpoint_private_access = true
    endpoint_public_access  = true
  }

  depends_on = [
    aws_iam_role_policy_attachment.cluster_AmazonEKSClusterPolicy,
  ]
}

resource "aws_rds_instance" "postgres" {
  identifier     = "live-conditions-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.large"
  
  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_encrypted     = true
  
  db_name  = "liveconditions"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  multi_az               = true
  publicly_accessible    = false
  
  tags = {
    Name = "live-conditions-postgres"
  }
}
```

### Monitoring: Prometheus + Grafana + ELK Stack

**Prometheus Configuration:**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

**Grafana Dashboard:**
```json
{
  "dashboard": {
    "title": "Live Conditions - Application Metrics",
    "panels": [
      {
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Active WebSocket Connections",
        "type": "stat",
        "targets": [
          {
            "expr": "socket_io_connected_clients",
            "legendFormat": "Connected Clients"
          }
        ]
      }
    ]
  }
}
```

## Development Tools & Workflow

### Package Management: npm/pnpm

**Recommendation: pnpm for monorepo efficiency**

```json
{
  "name": "live-conditions-app",
  "private": true,
  "scripts": {
    "dev": "concurrently \"pnpm:dev:*\"",
    "dev:frontend": "cd frontend && pnpm dev",
    "dev:backend": "cd backend && pnpm dev",
    "build": "pnpm run build:frontend && pnpm run build:backend",
    "test": "pnpm run test:frontend && pnpm run test:backend",
    "lint": "pnpm run lint:frontend && pnpm run lint:backend",
    "type-check": "pnpm run type-check:frontend && pnpm run type-check:backend"
  },
  "devDependencies": {
    "concurrently": "^7.6.0",
    "husky": "^8.0.3",
    "lint-staged": "^13.2.0"
  }
}
```

### Testing Strategy

**Frontend Testing:**
```javascript
// __tests__/components/Map.test.jsx
import { render, screen } from '@testing-library/react';
import { Map } from '../components/Map';

// Mock Mapbox GL
jest.mock('mapbox-gl', () => ({
  Map: jest.fn(() => ({
    on: jest.fn(),
    addSource: jest.fn(),
    addLayer: jest.fn(),
  })),
}));

describe('Map Component', () => {
  it('renders map container', () => {
    render(<Map />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });
});
```

**Backend Testing:**
```javascript
// __tests__/api/locations.test.js
const request = require('supertest');
const app = require('../server');

describe('Location API', () => {
  it('should return nearby reports', async () => {
    const response = await request(app)
      .get('/api/v1/locations/nearby')
      .query({ lat: -33.8688, lng: 151.2093, radius: 5 })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.reports).toBeInstanceOf(Array);
  });
});
```

### CI/CD Pipeline: GitHub Actions

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgis/postgis:15-3.3
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run linting
        run: pnpm run lint
      
      - name: Run type checking
        run: pnpm run type-check
      
      - name: Run tests
        run: pnpm run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-southeast-2
      
      - name: Build and push Docker images
        run: |
          docker build -t $ECR_REGISTRY/frontend:$GITHUB_SHA ./frontend
          docker build -t $ECR_REGISTRY/backend:$GITHUB_SHA ./backend
          docker push $ECR_REGISTRY/frontend:$GITHUB_SHA
          docker push $ECR_REGISTRY/backend:$GITHUB_SHA
      
      - name: Deploy to EKS
        run: |
          aws eks update-kubeconfig --name live-conditions-cluster
          kubectl set image deployment/frontend frontend=$ECR_REGISTRY/frontend:$GITHUB_SHA
          kubectl set image deployment/backend backend=$ECR_REGISTRY/backend:$GITHUB_SHA
          kubectl rollout status deployment/frontend
          kubectl rollout status deployment/backend
```

This comprehensive technology stack provides a solid foundation for building a scalable, maintainable, and performant live conditions mapping application. Each technology choice is justified by specific requirements and includes practical implementation examples.