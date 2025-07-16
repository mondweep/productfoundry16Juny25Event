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

### Prerequisites
- Node.js 18+ 
- MongoDB
- PostgreSQL with PostGIS extension
- Redis (optional, for enhanced caching)

### Installation

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
   # Configure your .env file with database URLs and API keys
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
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
```
PORT=3001
WEBSOCKET_PORT=3002
MONGODB_URI=mongodb://localhost:27017/live_conditions
POSTGRESQL_URI=postgresql://user:password@localhost:5432/live_conditions
REDIS_URI=redis://localhost:6379
JWT_SECRET=your_jwt_secret
BOM_API_KEY=your_bom_api_key
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3002
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

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