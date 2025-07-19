# Aotearoa & Aussie Live Conditions App

A comprehensive real-time monitoring application providing live conditions data for Australia and New Zealand, including weather, marine conditions, traffic, and emergency alerts.

## 🌟 Features

- **Real-time Weather Data** - Current conditions, forecasts, and severe weather alerts
- **Marine Conditions** - Wave heights, tides, and marine forecasts
- **Traffic Information** - Live traffic incidents and road conditions  
- **Emergency Alerts** - Fire warnings, earthquake notifications, and emergency updates
- **Interactive Map** - Leaflet-based map with multiple data layers
- **PWA Support** - Progressive Web App capabilities for mobile use
- **WebSocket Integration** - Real-time data updates
- **Responsive Design** - Mobile-first responsive interface
- **MCP Server Integration** - AI-ready Model Context Protocol server for seamless integration with Claude and other AI assistants
- **Comprehensive API** - RESTful APIs with detailed documentation

## 📱 Demo Screenshots

View the application in action:
- [Report Feature Screenshot 1](live-conditions-app/output%20demo%20screenshots/Report%20feature%20screenshot%201.png)
- [Report Feature Screenshot 2](live-conditions-app/output%20demo%20screenshots/Report%20feature%20screenshot%202.png)
- [Detail View Screenshot](live-conditions-app/output%20demo%20screenshots/View%20Detail%20Screenshot.png)
- [Detail View Screenshot 2](live-conditions-app/output%20demo%20screenshots/View%20Detail%20Screenshot%202.png)

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:
- Node.js >= 18.0.0
- npm >= 8.0.0
- MongoDB >= 6.0
- Redis >= 6.0

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd productfoundry16Juny25Event
   ```

2. **Install backend dependencies**
   ```bash
   cd live-conditions-app/backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Install MCP server dependencies (optional)**
   ```bash
   cd ../mcp-server
   npm install
   npm run build
   ```

5. **Set up environment variables**
   
   Create `.env` files based on the examples:
   ```bash
   # Backend environment
   cp live-conditions-app/backend/.env.example live-conditions-app/backend/.env
   
   # Frontend environment  
   cp live-conditions-app/frontend/.env.example live-conditions-app/frontend/.env.local
   
   # MCP server environment (optional)
   cp live-conditions-app/mcp-server/.env.example live-conditions-app/mcp-server/.env
   ```

   Configure the following API keys in your `.env` files:
   - OpenWeatherMap API key
   - Bureau of Meteorology API access
   - MetService API access
   - GeoNet API access
   - NSW RFS API access
   - NZTA API access

6. **Set up databases**
   
   Start MongoDB and Redis services:
   ```bash
   # MongoDB (adjust command based on your installation)
   mongod
   
   # Redis
   redis-server
   ```

7. **Initialize database schema**
   ```bash
   cd live-conditions-app/backend
   # Run database migrations
   npm run migrate
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd live-conditions-app/backend
   npm run dev
   ```

2. **Start the frontend application**
   ```bash
   cd live-conditions-app/frontend
   npm run dev
   ```

3. **Start the MCP server (optional)**
   ```bash
   cd live-conditions-app/mcp-server
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api/docs
   - MCP Server: Running on stdio (for AI integrations)

## 🏗️ Project Structure

```
live-conditions-app/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── api/            # API route handlers
│   │   ├── config/         # Configuration files
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── tests/              # Backend tests
│   └── package.json
├── frontend/               # Next.js React application
│   ├── src/
│   │   ├── app/           # Next.js app directory
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   ├── public/            # Static assets
│   ├── tests/             # Frontend tests
│   └── package.json
├── mcp-server/            # Model Context Protocol server
│   ├── src/
│   │   ├── tools/         # MCP tools implementation
│   │   ├── resources/     # MCP resources
│   │   ├── prompts/       # MCP prompts
│   │   └── types/         # TypeScript definitions
│   ├── examples/          # Integration examples
│   ├── dist/              # Compiled JavaScript
│   └── README.md          # MCP server documentation
├── database/              # Database schemas and migrations
├── docs/                  # Documentation
├── infrastructure/        # Deployment configurations
└── output demo screenshots/ # Application screenshots
```

## 🔧 Development

### Available Scripts

**Backend:**
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

**Frontend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run Next.js linting
npm run type-check   # TypeScript type checking
npm run test         # Run Jest tests
```

### Testing

Run the complete test suite:
```bash
# Backend tests
cd live-conditions-app/backend && npm test

# Frontend tests
cd live-conditions-app/frontend && npm test
```

### Code Quality

Both backend and frontend include:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Jest for testing

## 📚 API Documentation

The backend provides RESTful APIs for:
- Weather data (`/api/weather`)
- Marine conditions (`/api/ocean`)
- Traffic information (`/api/traffic`)
- Emergency alerts (`/api/alerts`)
- User management (`/api/users`)
- Favorites (`/api/favorites`)

WebSocket endpoints:
- Real-time updates (`/ws`)
- Live notifications (`/ws/notifications`)

## 🌐 Data Sources

- **Weather**: OpenWeatherMap, Bureau of Meteorology
- **Marine**: Bureau of Meteorology Marine, MetOcean
- **Traffic**: NSW Traffic, NZTA
- **Emergency**: NSW RFS, GeoNet, Emergency Management
- **Geographic**: OpenStreetMap, Natural Earth

## 🚢 Deployment

### Using Docker

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

### Manual Deployment

1. **Build applications**
   ```bash
   cd live-conditions-app/backend && npm run build
   cd ../frontend && npm run build
   ```

2. **Set up production environment**
   - Configure production environment variables
   - Set up reverse proxy (Nginx recommended)
   - Configure SSL certificates
   - Set up monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Bureau of Meteorology for weather data access
- MetService for New Zealand weather information
- OpenStreetMap contributors for mapping data
- GeoNet for earthquake monitoring data
- Emergency services for public alert systems

## 🔧 MCP Server for AI Integration

The application includes a Model Context Protocol (MCP) server that enables seamless integration with AI assistants like Claude:

### MCP Features
- **25+ MCP Tools** - Weather, marine, traffic, and alert tools
- **7 MCP Resources** - Direct access to live data feeds
- **6 MCP Prompts** - Pre-built AI prompts for analysis
- **Full Integration Examples** - Claude Desktop, AI applications, webhooks

### Quick MCP Setup
```bash
# Build and start the MCP server
cd live-conditions-app/mcp-server
npm install && npm run build
npm start
```

For detailed MCP integration, see the [MCP Server Documentation](live-conditions-app/mcp-server/README.md).

## 🐛 Troubleshooting

For common issues and solutions, please refer to the comprehensive [Troubleshooting Guide](troubleshooting-guide.md) which covers:
- Frontend loading and WebSocket issues
- Backend API connection problems
- Database configuration
- Build and deployment errors
- Performance optimization
- Environment setup

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the [Troubleshooting Guide](troubleshooting-guide.md)
- Review the [MCP Server Documentation](live-conditions-app/mcp-server/README.md)
- Check the [documentation](docs/)
- Review the [API specification](docs/api-specification.md)

---

**Note**: This application is designed for educational and informational purposes. Always refer to official emergency services and meteorological agencies for critical weather and emergency information.