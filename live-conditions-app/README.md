# 🌏 Aotearoa & Aussie Live Conditions

A real-time, crowd-sourced map that visualizes live environmental and community conditions across Australia and New Zealand - from beach surf quality to bushfire alerts and local traffic hotspots.

## 🎯 Project Overview

**Problem Statement**: Information about immediate, local conditions is fragmented across many different apps and websites (weather, surf cams, state fire services, traffic authorities). There is no single place to see what's happening right now in your immediate vicinity.

**Solution**: A unified real-time map interface that aggregates official data sources with community-submitted reports to provide comprehensive local awareness for Australia and New Zealand.

## ✨ Features

### Core MVP Features
- **🗺️ Interactive Map**: Map of NZ and AU as the primary view
- **📊 Data Layers**: Toggleable layers for weather, surf breaks, fire alerts, and traffic
- **📍 User Reporting**: Simple "Drop a Pin" feature for users to report conditions with categories (Safety, Traffic, Vibe, Wildlife) and short text/photo
- **🔔 Push Notifications**: Users can subscribe to alerts for their local area or favorite spots

### Technical Features
- **⚡ Real-time Updates**: WebSocket connections for live data synchronization
- **🔐 Authentication**: Secure user accounts with preferences and favorites
- **📱 PWA Support**: Installable progressive web app for mobile and desktop
- **🌐 Offline Capability**: Cached data and offline reporting functionality
- **🔄 Auto-sync**: Background synchronization when connection restored

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Next.js 14 with TypeScript
- Leaflet for interactive maps
- Zustand for state management
- Tailwind CSS for styling
- PWA with service worker

**Backend:**
- Node.js with Express and TypeScript
- MongoDB with Mongoose
- WebSocket for real-time updates
- JWT authentication
- Redis caching

**Database:**
- PostgreSQL with PostGIS for geospatial data
- Redis for real-time caching
- MongoDB for user data and reports

### Data Sources

**Australia:**
- NSW Rural Fire Service (Fire incidents)
- Bureau of Meteorology (Weather, marine conditions)
- Transport NSW (Traffic conditions)
- Queensland Traffic (Road incidents)

**New Zealand:**
- GeoNet (Earthquake and volcanic monitoring)
- NZTA Waka Kotahi (Traffic conditions)
- MetService (Weather data)
- MetOcean Solutions (Marine forecasts)

## 🚀 Getting Started

### 🎭 Demo Environment (Current State)

**Quick Start:**
1. **Clone and run the demo**
   ```bash
   git clone <repository-url>
   cd live-conditions-app
   
   # Start backend (demo server)
   cd backend && npm install && npx ts-node src/simple-server.ts &
   
   # Start frontend
   cd ../frontend && npm install && npm run dev
   ```

2. **Access the demo**
   - Open `http://localhost:3000`
   - View interactive map with demo data
   - See working UI/UX and architecture

**What Works in Demo:**
- ✅ Interactive map of Australia & New Zealand
- ✅ Backend API with mock weather/traffic data
- ✅ Real-time WebSocket architecture (local connections)
- ✅ Complete UI with layers panel and status indicators
- ✅ Professional interface ready for live data

**Demo Limitations:**
- 🔶 Mock data only (not real-time conditions)
- 🔶 WebSocket only works locally (not through GitHub Codespaces)
- 🔶 No real API integrations
- 🔶 Missing external data source connections

---

### 🌐 Production Environment (Live Data)

**To move beyond demo and get real live conditions:**

### Prerequisites
- Node.js 18+ 
- MongoDB
- PostgreSQL with PostGIS extension
- Redis (for caching)
- **API Keys** (see below)

### Required API Keys & Services

**Australia Data Sources:**
```bash
# Weather & Marine
BOM_API_KEY=your_bureau_of_meteorology_key
OPENWEATHER_API_KEY=your_openweather_api_key

# Traffic & Transport
NSW_TRANSPORT_API_KEY=your_nsw_transport_key
VIC_TRANSPORT_API_KEY=your_vic_transport_key
QLD_TRANSPORT_API_KEY=your_qld_transport_key

# Emergency Services
NSW_RFS_API_KEY=your_rural_fire_service_key
CFA_API_KEY=your_country_fire_authority_key
```

**New Zealand Data Sources:**
```bash
# Weather & Marine
METSERVICE_API_KEY=your_metservice_key
NIWA_API_KEY=your_niwa_marine_key

# Transport
NZTA_API_KEY=your_nzta_traffic_key

# Emergency & Geological
GEONET_API_KEY=your_geonet_earthquake_key
```

**Additional Services:**
```bash
# Maps & Geocoding
MAPBOX_API_KEY=your_mapbox_token
GOOGLE_MAPS_API_KEY=your_google_maps_key

# Authentication & Monitoring
AUTH0_DOMAIN=your_auth0_domain
AUTH0_CLIENT_ID=your_auth0_client_id
SENTRY_DSN=your_sentry_monitoring_url
```

### Production Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd live-conditions-app
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   
   # Configure ALL API keys in .env file
   nano .env
   
   # Install databases
   # MongoDB: https://docs.mongodb.com/manual/installation/
   # PostgreSQL: https://postgresql.org/download/
   # Redis: https://redis.io/download
   
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Configure environment
   cp .env.example .env.local
   nano .env.local
   
   npm run dev
   ```

4. **Database Setup**
   ```bash
   # Run PostgreSQL migrations
   cd database
   psql -U postgres -d live_conditions < schema.sql
   ```

### Environment Variables

**Backend (.env):**
```bash
# Server Configuration
PORT=3001
WEBSOCKET_PORT=3002
NODE_ENV=production

# Databases
MONGODB_URI=mongodb://localhost:27017/live_conditions
POSTGRESQL_URI=postgresql://user:password@localhost:5432/live_conditions
REDIS_URI=redis://localhost:6379

# Security
JWT_SECRET=your_jwt_secret_256_bit
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=your-api-identifier

# Australia API Keys
BOM_API_KEY=your_bom_api_key
OPENWEATHER_API_KEY=your_openweather_key
NSW_TRANSPORT_API_KEY=your_nsw_transport_key
NSW_RFS_API_KEY=your_rural_fire_service_key

# New Zealand API Keys
METSERVICE_API_KEY=your_metservice_key
NIWA_API_KEY=your_niwa_key
NZTA_API_KEY=your_nzta_key
GEONET_API_KEY=your_geonet_key

# Monitoring & Logging
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3002
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your_auth0_client_id
NEXT_PUBLIC_SENTRY_DSN=your_frontend_sentry_dsn
```

### 🔑 How to Obtain API Keys

**Australian Services:**
1. **Bureau of Meteorology**: Register at [data.gov.au](http://data.gov.au)
2. **NSW Transport**: Apply at [opendata.transport.nsw.gov.au](https://opendata.transport.nsw.gov.au)
3. **Rural Fire Service**: Contact [rfs.nsw.gov.au](https://rfs.nsw.gov.au) for data access
4. **OpenWeather**: Sign up at [openweathermap.org](https://openweathermap.org/api)

**New Zealand Services:**
1. **MetService**: Register at [metservice.com/national/about/weatherdata](https://metservice.com)
2. **NIWA**: Apply for access at [niwa.co.nz](https://niwa.co.nz)
3. **NZTA**: Register at [nzta.govt.nz/resources/traffic-and-travel-data](https://nzta.govt.nz)
4. **GeoNet**: Access data via [geonet.org.nz](https://geonet.org.nz)

**Other Services:**
1. **Mapbox**: Create account at [mapbox.com](https://mapbox.com)
2. **Auth0**: Sign up at [auth0.com](https://auth0.com)
3. **Sentry**: Register at [sentry.io](https://sentry.io)

### 🔧 Backend Code Updates Needed

**Replace mock data in `src/simple-server.ts` with real API calls:**

1. **Weather Service Integration**
   ```typescript
   // Replace mock weather data with real BOM/MetService calls
   app.get('/api/v1/weather/current', async (req, res) => {
     const bomData = await fetchBOMData(lat, lng);
     const processedData = processBOMResponse(bomData);
     res.json(processedData);
   });
   ```

2. **Emergency Services Integration**
   ```typescript
   // Add real fire/flood data feeds
   app.get('/api/v1/fires', async (req, res) => {
     const fireData = await fetchNSWRFSIncidents();
     res.json(fireData);
   });
   ```

3. **Transport Integration**
   ```typescript
   // Add real traffic data
   app.get('/api/v1/traffic', async (req, res) => {
     const trafficData = await fetchTransportAPI();
     res.json(trafficData);
   });
   ```

**See `/docs/api-integrations.md` for detailed integration examples.**

## 📱 Usage

1. **Open the app** in your browser at `http://localhost:3000`
2. **View live conditions** on the interactive map
3. **Toggle data layers** to see weather, fire, flood, traffic, or user reports
4. **Drop a pin** to report local conditions
5. **Sign up** to save favorites and receive notifications
6. **Install as PWA** for mobile app experience

## 📊 Success Metrics

- **Daily Active Users (DAU)**
- **Number of user-submitted reports per day**
- **Time to display critical information** from official sources (target: <500ms latency)
- **User engagement** with notifications and favorites
- **Geographic coverage** of user reports

## 🛡️ Security

- JWT-based authentication with refresh tokens
- Rate limiting to prevent abuse
- Input validation and sanitization
- Secure API key management
- HTTPS enforcement in production

## 📚 Documentation

- **[Technical Architecture](docs/architecture.md)** - System design and technology choices
- **[API Documentation](docs/api-specification.md)** - RESTful endpoints and WebSocket events
- **[Database Schema](docs/database-design.md)** - Data models and relationships
- **[API Integrations](docs/api-integrations.md)** - External data source documentation
- **[System Design](docs/system-design-diagram.md)** - Visual architecture diagrams

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests  
cd frontend
npm test

# End-to-end tests
npm run test:e2e
```

## 🚀 Deployment

### Production Build

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Kubernetes Deployment

```bash
# Deploy to Kubernetes cluster
kubectl apply -f deploy/
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Australian Bureau of Meteorology for weather data
- GeoNet New Zealand for seismic monitoring
- NSW Rural Fire Service for fire incident data
- Transport authorities in both countries for traffic information
- OpenStreetMap contributors for map data

## 📞 Support

For support and questions:
- Create an issue in this repository
- Contact the development team
- Check the documentation in the `docs/` folder

---

**Built with ❤️ for the Australia and New Zealand community**