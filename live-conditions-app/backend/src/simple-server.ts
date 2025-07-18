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

// CORS configuration - Allow all origins for demo
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'X-Requested-With', 'Accept', 'Origin'],
};
app.use(cors(corsOptions));

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

// User reports
app.get(`/api/${apiVersion}/reports`, (req, res) => {
  res.json({
    success: true,
    data: {
      reports: [
        {
          id: 'report-1',
          category: 'traffic',
          severity: 'low',
          description: 'Light traffic on motorway',
          location: {
            latitude: -36.8485,
            longitude: 174.7633,
          },
          timestamp: new Date().toISOString(),
          user: 'anonymous',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    },
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