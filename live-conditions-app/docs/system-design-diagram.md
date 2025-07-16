# System Design Diagrams - Live Conditions App

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App<br/>Next.js + React]
        MOBILE[Mobile App<br/>React Native]
        PWA[Progressive Web App<br/>Offline Capable]
    end
    
    subgraph "CDN & Gateway"
        CF[CloudFlare CDN]
        GATEWAY[API Gateway<br/>Nginx + Rate Limiting]
    end
    
    subgraph "Microservices"
        USER[User Service<br/>Auth & Profiles]
        LOCATION[Location Service<br/>Geospatial Data]
        NOTIFICATION[Notification Service<br/>Push & Email]
        INGESTION[Data Ingestion<br/>BOM & GeoNet APIs]
    end
    
    subgraph "Real-time Layer"
        REDIS_PUB[Redis Pub/Sub]
        SOCKETIO[Socket.IO Cluster]
        QUEUE[Bull Queue System]
    end
    
    subgraph "Data Layer"
        POSTGRES[(PostgreSQL<br/>+ PostGIS)]
        REDIS_CACHE[(Redis Cache)]
        INFLUX[(InfluxDB<br/>Time Series)]
        ELASTIC[(Elasticsearch<br/>Search & Geo)]
    end
    
    subgraph "External APIs"
        BOM[Australian BOM<br/>Weather API]
        GEONET[NZ GeoNet<br/>Seismic API]
        MAPS[Mapbox/OSM<br/>Map Tiles]
    end
    
    subgraph "Infrastructure"
        K8S[Kubernetes Cluster]
        MONITORING[Prometheus + Grafana]
        LOGGING[ELK Stack]
    end
    
    WEB --> CF
    MOBILE --> CF
    PWA --> CF
    CF --> GATEWAY
    
    GATEWAY --> USER
    GATEWAY --> LOCATION
    GATEWAY --> NOTIFICATION
    GATEWAY --> INGESTION
    
    USER --> POSTGRES
    USER --> REDIS_CACHE
    
    LOCATION --> POSTGRES
    LOCATION --> ELASTIC
    LOCATION --> REDIS_PUB
    
    NOTIFICATION --> QUEUE
    NOTIFICATION --> REDIS_CACHE
    
    INGESTION --> BOM
    INGESTION --> GEONET
    INGESTION --> POSTGRES
    INGESTION --> INFLUX
    INGESTION --> REDIS_PUB
    
    REDIS_PUB --> SOCKETIO
    SOCKETIO --> WEB
    SOCKETIO --> MOBILE
    SOCKETIO --> PWA
    
    QUEUE --> NOTIFICATION
    
    K8S --> USER
    K8S --> LOCATION
    K8S --> NOTIFICATION
    K8S --> INGESTION
    K8S --> REDIS_PUB
    K8S --> SOCKETIO
    
    MONITORING --> K8S
    LOGGING --> K8S
```

## Data Flow Architecture

### Real-time Weather Data Flow
```mermaid
sequenceDiagram
    participant BOM as BOM API
    participant Ingestion as Data Ingestion Service
    participant DB as PostgreSQL
    participant Cache as Redis
    participant PubSub as Redis Pub/Sub
    participant Socket as Socket.IO
    participant Client as Web/Mobile Client
    
    loop Every 5 minutes
        Ingestion->>BOM: Fetch weather data
        BOM-->>Ingestion: Weather JSON
        Ingestion->>DB: Store weather data
        Ingestion->>Cache: Update cache
        Ingestion->>PubSub: Publish weather_update
        PubSub->>Socket: Broadcast to rooms
        Socket-->>Client: Real-time weather update
    end
```

### User Report Submission Flow
```mermaid
sequenceDiagram
    participant Client as Mobile/Web Client
    participant Gateway as API Gateway
    participant Location as Location Service
    participant DB as PostgreSQL
    participant Cache as Redis
    participant PubSub as Redis Pub/Sub
    participant Socket as Socket.IO
    participant Notify as Notification Service
    
    Client->>Gateway: POST /api/v1/locations/reports
    Gateway->>Location: Validate & process report
    Location->>DB: Store report with geolocation
    Location->>Cache: Update spatial cache
    Location->>PubSub: Publish report_created
    PubSub->>Socket: Broadcast to nearby users
    PubSub->>Notify: Trigger alert notifications
    Socket-->>Client: Real-time report update
    Notify-->>Client: Push notification (if subscribed)
```

## Database Schema Design

### Core Entity Relationships
```mermaid
erDiagram
    USERS ||--o{ USER_SUBSCRIPTIONS : has
    USERS ||--o{ LOCATION_REPORTS : creates
    USERS ||--o{ USER_SESSIONS : maintains
    
    LOCATION_REPORTS }o--|| REPORT_TYPES : categorized_as
    LOCATION_REPORTS ||--o{ REPORT_MEDIA : contains
    LOCATION_REPORTS ||--o{ REPORT_VERIFICATIONS : verified_by
    
    USER_SUBSCRIPTIONS ||--o{ SUBSCRIPTION_ALERTS : generates
    WEATHER_DATA ||--o{ WEATHER_ALERTS : triggers
    SEISMIC_DATA ||--o{ EARTHQUAKE_ALERTS : triggers
    
    USERS {
        uuid id PK
        string email UK
        string name
        jsonb preferences
        timestamp created_at
        timestamp updated_at
    }
    
    LOCATION_REPORTS {
        uuid id PK
        uuid user_id FK
        geography location
        string report_type
        text description
        int severity
        text[] media_urls
        boolean verified
        timestamp created_at
    }
    
    USER_SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        geography location_polygon
        text[] alert_types
        text[] notification_methods
        boolean active
        timestamp created_at
    }
    
    WEATHER_DATA {
        uuid id PK
        geography location
        jsonb data
        string source
        timestamp observation_time
        timestamp ingested_at
    }
    
    SEISMIC_DATA {
        uuid id PK
        geography epicenter
        float magnitude
        float depth
        timestamp event_time
        string source
        jsonb details
    }
```

## Microservices Communication

### Service Dependencies
```mermaid
graph LR
    subgraph "Frontend Services"
        WEB[Web Client]
        MOBILE[Mobile Client]
    end
    
    subgraph "Gateway Layer"
        GATEWAY[API Gateway]
        AUTH[Auth Middleware]
    end
    
    subgraph "Core Services"
        USER[User Service]
        LOCATION[Location Service]
        NOTIFICATION[Notification Service]
        INGESTION[Data Ingestion]
    end
    
    subgraph "Supporting Services"
        MEDIA[Media Service]
        SEARCH[Search Service]
        ANALYTICS[Analytics Service]
    end
    
    WEB --> GATEWAY
    MOBILE --> GATEWAY
    
    GATEWAY --> AUTH
    AUTH --> USER
    
    GATEWAY --> LOCATION
    GATEWAY --> NOTIFICATION
    GATEWAY --> INGESTION
    
    LOCATION --> SEARCH
    LOCATION --> MEDIA
    
    NOTIFICATION --> ANALYTICS
    USER --> ANALYTICS
    
    INGESTION --> LOCATION
```

## Deployment Architecture

### Kubernetes Cluster Layout
```mermaid
graph TB
    subgraph "Kubernetes Cluster"
        subgraph "Ingress Layer"
            INGRESS[Nginx Ingress Controller]
            TLS[TLS Termination]
        end
        
        subgraph "Application Namespace"
            subgraph "Frontend Pods"
                WEB_POD[Web App Pods x3]
                API_POD[API Gateway Pods x3]
            end
            
            subgraph "Backend Pods"
                USER_POD[User Service Pods x2]
                LOCATION_POD[Location Service Pods x3]
                NOTIFY_POD[Notification Pods x2]
                INGEST_POD[Ingestion Pods x2]
            end
            
            subgraph "Real-time Pods"
                SOCKET_POD[Socket.IO Pods x3]
                REDIS_POD[Redis Cluster x3]
            end
        end
        
        subgraph "Data Namespace"
            POSTGRES_POD[PostgreSQL Primary + 2 Replicas]
            INFLUX_POD[InfluxDB Cluster x2]
            ELASTIC_POD[Elasticsearch Cluster x3]
        end
        
        subgraph "System Namespace"
            MONITOR_POD[Prometheus + Grafana]
            LOG_POD[ELK Stack]
            BACKUP_POD[Backup Services]
        end
    end
    
    subgraph "External Services"
        AWS_RDS[(AWS RDS<br/>PostgreSQL)]
        AWS_S3[(AWS S3<br/>Media Storage)]
        CLOUDFLARE[CloudFlare CDN]
    end
    
    INGRESS --> WEB_POD
    INGRESS --> API_POD
    
    API_POD --> USER_POD
    API_POD --> LOCATION_POD
    API_POD --> NOTIFY_POD
    API_POD --> INGEST_POD
    
    LOCATION_POD --> SOCKET_POD
    SOCKET_POD --> REDIS_POD
    
    USER_POD --> AWS_RDS
    LOCATION_POD --> POSTGRES_POD
    
    WEB_POD --> CLOUDFLARE
    
    MONITOR_POD --> USER_POD
    MONITOR_POD --> LOCATION_POD
    LOG_POD --> USER_POD
    LOG_POD --> LOCATION_POD
```

## Network Security Architecture

### Security Layers
```mermaid
graph TB
    subgraph "Internet"
        USER_TRAFFIC[User Traffic]
        API_TRAFFIC[API Traffic]
    end
    
    subgraph "Edge Security"
        WAF[Web Application Firewall]
        DDOS[DDoS Protection]
        CF_SEC[CloudFlare Security]
    end
    
    subgraph "Network Security"
        VPC[Virtual Private Cloud]
        SUBNET_PUB[Public Subnet]
        SUBNET_PRIV[Private Subnet]
        SUBNET_DB[Database Subnet]
    end
    
    subgraph "Application Security"
        API_GATEWAY[API Gateway + Rate Limiting]
        JWT_AUTH[JWT Authentication]
        RBAC[Role-Based Access Control]
    end
    
    subgraph "Data Security"
        TLS_TERM[TLS 1.3 Termination]
        ENCRYPTION[Database Encryption]
        KEY_MGMT[Key Management Service]
    end
    
    USER_TRAFFIC --> CF_SEC
    API_TRAFFIC --> CF_SEC
    
    CF_SEC --> WAF
    CF_SEC --> DDOS
    
    WAF --> VPC
    DDOS --> VPC
    
    VPC --> SUBNET_PUB
    SUBNET_PUB --> API_GATEWAY
    
    API_GATEWAY --> JWT_AUTH
    API_GATEWAY --> SUBNET_PRIV
    
    JWT_AUTH --> RBAC
    SUBNET_PRIV --> SUBNET_DB
    
    SUBNET_DB --> ENCRYPTION
    ENCRYPTION --> KEY_MGMT
```

## Performance Optimization Strategy

### Caching Layers
```mermaid
graph TB
    subgraph "Client Side"
        BROWSER_CACHE[Browser Cache]
        SW_CACHE[Service Worker Cache]
        LOCAL_STORAGE[Local Storage]
    end
    
    subgraph "CDN Layer"
        CF_CACHE[CloudFlare Cache]
        EDGE_CACHE[Edge Locations]
    end
    
    subgraph "Application Layer"
        REDIS_CACHE[Redis Cache]
        APP_CACHE[Application Memory Cache]
        SESSION_CACHE[Session Store]
    end
    
    subgraph "Database Layer"
        QUERY_CACHE[Query Result Cache]
        CONNECTION_POOL[Connection Pool]
        READ_REPLICA[Read Replicas]
    end
    
    BROWSER_CACHE --> CF_CACHE
    SW_CACHE --> CF_CACHE
    
    CF_CACHE --> EDGE_CACHE
    EDGE_CACHE --> REDIS_CACHE
    
    REDIS_CACHE --> APP_CACHE
    APP_CACHE --> SESSION_CACHE
    
    SESSION_CACHE --> QUERY_CACHE
    QUERY_CACHE --> CONNECTION_POOL
    CONNECTION_POOL --> READ_REPLICA
```

This comprehensive system design provides visual representations of the architecture components, data flows, and infrastructure layout for the Live Conditions application. Each diagram serves as a blueprint for implementation teams to understand the system's complexity and interconnections.