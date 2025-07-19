import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

// Security middleware - More permissive for demo
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for demo
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration - Very permissive for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(cors({
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Compression and parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Live Conditions API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mock API routes
const apiVersion = 'v1';

// Weather routes
app.get(`/api/${apiVersion}/weather/current`, (req, res) => {
  const { latitude, longitude } = req.query;
  res.json({
    success: true,
    data: {
      location: {
        latitude: parseFloat(latitude as string),
        longitude: parseFloat(longitude as string),
        name: 'Demo Location',
        country: 'NZ',
      },
      current: {
        temperature: 18.5,
        humidity: 72,
        windSpeed: 15.2,
        windDirection: 'NW',
        pressure: 1013.2,
        visibility: 10,
        uvIndex: 3,
        condition: 'partly_cloudy',
        description: 'Partly cloudy with light winds',
        icon: 'partly-cloudy',
      },
      timestamp: new Date().toISOString(),
      source: 'demo',
    },
  });
});

// Ocean conditions
app.get(`/api/${apiVersion}/ocean/conditions`, (req, res) => {
  const { latitude, longitude } = req.query;
  res.json({
    success: true,
    data: {
      location: {
        latitude: parseFloat(latitude as string),
        longitude: parseFloat(longitude as string),
      },
      conditions: {
        waveHeight: 1.2,
        swellDirection: 'SW',
        windWaves: 0.8,
        period: 8.5,
        seaTemperature: 16.5,
        visibility: 15,
        tideHeight: 1.8,
        tideDirection: 'rising',
      },
      timestamp: new Date().toISOString(),
      source: 'demo',
    },
  });
});

// Traffic conditions
app.get(`/api/${apiVersion}/traffic/conditions`, (req, res) => {
  const { latitude, longitude } = req.query;
  res.json({
    success: true,
    data: {
      location: {
        latitude: parseFloat(latitude as string),
        longitude: parseFloat(longitude as string),
      },
      incidents: [
        {
          id: 'incident-1',
          type: 'construction',
          severity: 'moderate',
          description: 'Road works on State Highway 1',
          location: 'SH1 near Newmarket',
          startTime: new Date().toISOString(),
          expectedDuration: '2 hours',
        },
      ],
      congestion: {
        level: 'light',
        averageSpeed: 45,
        travelTimeIndex: 1.2,
      },
      timestamp: new Date().toISOString(),
      source: 'demo',
    },
  });
});

// Alerts
app.get(`/api/${apiVersion}/alerts`, (req, res) => {
  res.json({
    success: true,
    data: {
      alerts: [
        {
          id: 'alert-1',
          type: 'weather',
          severity: 'moderate',
          title: 'Strong Wind Warning',
          description: 'Strong winds expected in the Auckland region',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          affectedAreas: ['Auckland', 'North Shore'],
        },
      ],
      timestamp: new Date().toISOString(),
      source: 'demo',
    },
  });
});

// Geographic data endpoints for map visualization
app.get(`/api/${apiVersion}/weather`, (req, res) => {
  const now = new Date().toISOString();
  res.json({
    success: true,
    data: [
      // Australia
      { id: 'sydney', location: { lat: -33.8688, lng: 151.2093 }, temperature: 22, humidity: 65, windSpeed: 12, pressure: 1013, conditions: 'sunny', city: 'Sydney', source: 'bom', timestamp: now },
      { id: 'melbourne', location: { lat: -37.8136, lng: 144.9631 }, temperature: 18, humidity: 78, windSpeed: 8, pressure: 1015, conditions: 'cloudy', city: 'Melbourne', source: 'bom', timestamp: now },
      { id: 'brisbane', location: { lat: -27.4698, lng: 153.0251 }, temperature: 26, humidity: 72, windSpeed: 15, pressure: 1012, conditions: 'partly_cloudy', city: 'Brisbane', source: 'bom', timestamp: now },
      { id: 'perth', location: { lat: -31.9505, lng: 115.8605 }, temperature: 24, humidity: 55, windSpeed: 18, pressure: 1016, conditions: 'sunny', city: 'Perth', source: 'bom', timestamp: now },
      { id: 'adelaide', location: { lat: -34.9285, lng: 138.6007 }, temperature: 20, humidity: 68, windSpeed: 22, pressure: 1014, conditions: 'windy', city: 'Adelaide', source: 'bom', timestamp: now },
      { id: 'canberra', location: { lat: -35.2809, lng: 149.1300 }, temperature: 16, humidity: 82, windSpeed: 5, pressure: 1017, conditions: 'cold', city: 'Canberra', source: 'bom', timestamp: now },
      { id: 'darwin', location: { lat: -12.4634, lng: 130.8456 }, temperature: 32, humidity: 85, windSpeed: 10, pressure: 1009, conditions: 'hot', city: 'Darwin', source: 'bom', timestamp: now },
      { id: 'hobart', location: { lat: -42.8821, lng: 147.3272 }, temperature: 14, humidity: 88, windSpeed: 25, pressure: 1008, conditions: 'rainy', city: 'Hobart', source: 'bom', timestamp: now },
      
      // New Zealand
      { id: 'auckland', location: { lat: -36.8485, lng: 174.7633 }, temperature: 19, humidity: 74, windSpeed: 14, pressure: 1013, conditions: 'partly_cloudy', city: 'Auckland', source: 'metservice', timestamp: now },
      { id: 'wellington', location: { lat: -41.2924, lng: 174.7787 }, temperature: 15, humidity: 76, windSpeed: 28, pressure: 1011, conditions: 'windy', city: 'Wellington', source: 'metservice', timestamp: now },
      { id: 'christchurch', location: { lat: -43.5321, lng: 172.6362 }, temperature: 12, humidity: 81, windSpeed: 8, pressure: 1016, conditions: 'cold', city: 'Christchurch', source: 'metservice', timestamp: now },
      { id: 'hamilton', location: { lat: -37.7870, lng: 175.2793 }, temperature: 17, humidity: 79, windSpeed: 6, pressure: 1014, conditions: 'cloudy', city: 'Hamilton', source: 'metservice', timestamp: now },
      { id: 'dunedin', location: { lat: -45.8788, lng: 170.5028 }, temperature: 10, humidity: 84, windSpeed: 12, pressure: 1015, conditions: 'cold', city: 'Dunedin', source: 'metservice', timestamp: now },
      { id: 'tauranga', location: { lat: -37.6878, lng: 176.1651 }, temperature: 21, humidity: 70, windSpeed: 9, pressure: 1014, conditions: 'sunny', city: 'Tauranga', source: 'metservice', timestamp: now },
    ]
  });
});

app.get(`/api/${apiVersion}/fires`, (req, res) => {
  const now = new Date().toISOString();
  res.json({
    success: true,
    data: [
      { id: 'fire-1', location: { lat: -33.7174, lng: 150.3085 }, severity: 'high', size: 850, type: 'bushfire', status: 'active', description: 'Active bushfire in Blue Mountains region', timestamp: now },
      { id: 'fire-2', location: { lat: -37.5331, lng: 143.8503 }, severity: 'moderate', size: 420, type: 'grassfire', status: 'contained', description: 'Grassfire in Grampians area, now contained', timestamp: now },
      { id: 'fire-3', location: { lat: -31.2532, lng: 152.9341 }, severity: 'low', size: 120, type: 'controlled_burn', status: 'planned', description: 'Planned hazard reduction burn near Port Macquarie', timestamp: now },
      { id: 'fire-4', location: { lat: -28.7041, lng: 153.5586 }, severity: 'moderate', size: 290, type: 'bushfire', status: 'watch', description: 'Bushfire in Gold Coast Hinterland under watch', timestamp: now },
      { id: 'fire-5', location: { lat: -43.9503, lng: 171.2137 }, severity: 'low', size: 85, type: 'vegetation_fire', status: 'contained', description: 'Small vegetation fire in Canterbury, contained', timestamp: now },
    ]
  });
});

app.get(`/api/${apiVersion}/floods`, (req, res) => {
  const now = new Date().toISOString();
  res.json({
    success: true,
    data: [
      { id: 'flood-1', location: { lat: -27.4705, lng: 153.0260 }, severity: 'moderate', waterLevel: 4.2, trend: 'rising', type: 'river_flood', status: 'warning', description: 'Brisbane River levels rising above minor flood level', affectedAreas: ['South Brisbane', 'West End', 'Kangaroo Point'], timestamp: now },
      { id: 'flood-2', location: { lat: -34.4278, lng: 150.8931 }, severity: 'high', waterLevel: 2.8, trend: 'stable', type: 'flash_flood', status: 'emergency', description: 'Flash flooding in Wollongong area after heavy rainfall', affectedAreas: ['Wollongong CBD', 'Port Kembla', 'Fairy Meadow'], timestamp: now },
      { id: 'flood-3', location: { lat: -37.8136, lng: 144.9631 }, severity: 'low', waterLevel: 1.1, trend: 'falling', type: 'urban_flood', status: 'monitor', description: 'Minor urban flooding in Melbourne CBD storm drains', affectedAreas: ['Collins Street', 'Flinders Lane'], timestamp: now },
      { id: 'flood-4', location: { lat: -39.0646, lng: 174.3135 }, severity: 'moderate', waterLevel: 3.5, trend: 'rising', type: 'coastal_flood', status: 'warning', description: 'Coastal flooding warning for Taranaki region', affectedAreas: ['New Plymouth', 'Hawera', 'Waitara'], timestamp: now },
    ]
  });
});

app.get(`/api/${apiVersion}/traffic`, (req, res) => {
  const now = new Date().toISOString();
  const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now
  res.json({
    success: true,
    data: [
      { id: 'traffic-1', location: { lat: -33.8567, lng: 151.2152 }, severity: 'high', roadName: 'Sydney Harbour Bridge', incidentType: 'accident', status: 'active', description: 'Multi-vehicle accident blocking 2 lanes southbound', estimatedClearTime: futureTime, timestamp: now },
      { id: 'traffic-2', location: { lat: -37.8136, lng: 144.9631 }, severity: 'moderate', roadName: 'Collins Street', incidentType: 'roadwork', status: 'ongoing', description: 'Lane closure for maintenance work', estimatedClearTime: futureTime, timestamp: now },
      { id: 'traffic-3', location: { lat: -27.4698, lng: 153.0251 }, severity: 'low', roadName: 'M1 Pacific Motorway', incidentType: 'congestion', status: 'clearing', description: 'Heavy traffic during peak hour, clearing slowly', timestamp: now },
      { id: 'traffic-4', location: { lat: -36.8485, lng: 174.7633 }, severity: 'moderate', roadName: 'Auckland Harbour Bridge', incidentType: 'construction', status: 'planned', description: 'City Link upgrade works affecting traffic flow', estimatedClearTime: futureTime, timestamp: now },
      { id: 'traffic-5', location: { lat: -41.2924, lng: 174.7787 }, severity: 'high', roadName: 'SH1 Wellington', incidentType: 'closure', status: 'active', description: 'Road closed due to slip, traffic diverted', estimatedClearTime: futureTime, timestamp: now },
      { id: 'traffic-6', location: { lat: -31.9505, lng: 115.8605 }, severity: 'low', roadName: 'Graham Farmer Freeway', incidentType: 'event', status: 'temporary', description: 'Event traffic near Perth Stadium', timestamp: now },
    ]
  });
});

// User reports
app.get(`/api/${apiVersion}/reports`, (req, res) => {
  const now = new Date().toISOString();
  res.json({
    success: true,
    data: [
      {
        id: 'report-1',
        title: 'Light Traffic on Motorway',
        type: 'traffic',
        severity: 'low',
        description: 'Light traffic conditions on Auckland motorway, good flow',
        location: {
          lat: -36.8485,
          lng: 174.7633,
        },
        verified: true,
        votes: 12,
        timestamp: now,
        user: 'TrafficWatcher',
      },
      {
        id: 'report-2', 
        title: 'Beach Conditions Good',
        type: 'safety',
        severity: 'low',
        description: 'Beach is safe for swimming, calm conditions',
        location: {
          lat: -33.8915,
          lng: 151.2767,
        },
        verified: false,
        votes: 8,
        timestamp: now,
        user: 'BeachLover',
      },
      {
        id: 'report-3',
        title: 'Road Surface Damage',
        type: 'safety',
        severity: 'moderate',
        description: 'Large pothole causing vehicle damage on SH1',
        location: {
          lat: -41.2865,
          lng: 174.7762,
        },
        verified: true,
        votes: 23,
        timestamp: now,
        user: 'SafeDriver',
      }
    ],
    total: 3,
    page: 1,
    limit: 20,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Start server
async function startServer() {
  try {
    // Create HTTP server
    const server = createServer(app);
    
    // Setup WebSocket server
    const wss = new WebSocketServer({ port: Number(WS_PORT) });
    
    wss.on('connection', (ws) => {
      console.log('WebSocket client connected');
      
      ws.send(JSON.stringify({
        type: 'connection',
        data: {
          message: 'Connected to Live Conditions WebSocket',
          serverTime: new Date().toISOString(),
        },
        success: true,
        timestamp: Date.now(),
      }));

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('WebSocket message received:', message.type);
          
          // Echo back for demo
          ws.send(JSON.stringify({
            type: 'echo',
            data: message,
            success: true,
            timestamp: Date.now(),
          }));
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
      });
    });
    
    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 WebSocket server running on ws://localhost:${WS_PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📋 API Version: ${apiVersion}`);
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();