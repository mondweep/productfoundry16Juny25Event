import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

import { connectDatabase } from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { authMiddleware } from './middleware/auth';
import { validateApiKey } from './middleware/apiKey';
import { setupWebSocket } from './services/websocket';

// Import API routes
import weatherRoutes from './api/weather';
import oceanRoutes from './api/ocean';
import trafficRoutes from './api/traffic';
import alertsRoutes from './api/alerts';
import authRoutes from './api/auth';
import userRoutes from './api/users';
import favoritesRoutes from './api/favorites';
import healthRoutes from './api/health';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'ws:', 'wss:'],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
};
app.use(cors(corsOptions));

// Compression and parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
  }));
}

// Rate limiting
app.use(rateLimiter);

// API key validation for external requests
app.use('/api', validateApiKey);

// Health check endpoint (before auth)
app.use('/health', healthRoutes);

// API routes
const apiVersion = process.env.API_VERSION || 'v1';
app.use(`/api/${apiVersion}/auth`, authRoutes);
app.use(`/api/${apiVersion}/weather`, weatherRoutes);
app.use(`/api/${apiVersion}/ocean`, oceanRoutes);
app.use(`/api/${apiVersion}/traffic`, trafficRoutes);
app.use(`/api/${apiVersion}/alerts`, alertsRoutes);

// Protected routes
app.use(`/api/${apiVersion}/users`, authMiddleware, userRoutes);
app.use(`/api/${apiVersion}/favorites`, authMiddleware, favoritesRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Create HTTP server
    const server = createServer(app);
    
    // Setup WebSocket server
    const wss = new WebSocketServer({ port: Number(WS_PORT) });
    setupWebSocket(wss);
    
    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📡 WebSocket server running on ws://localhost:${WS_PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📋 API Version: ${apiVersion}`);
    });

    // Graceful shutdown handler
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { app, startServer };