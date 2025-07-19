# Troubleshooting Guide: Aotearoa & Aussie Live Conditions App

This document provides solutions to common issues encountered during development and deployment of the Live Conditions application.

## 📋 Table of Contents

- [MCP Server Issues](#mcp-server-issues)
- [Claude Desktop Integration Issues](#claude-desktop-integration-issues)
- [GitHub Codespaces Remote Access Issues](#github-codespaces-remote-access-issues)
- [Frontend Issues](#frontend-issues)
- [Backend Issues](#backend-issues)
- [API Integration Issues](#api-integration-issues)
- [Database Issues](#database-issues)
- [WebSocket Issues](#websocket-issues)
- [Build and Deployment Issues](#build-and-deployment-issues)
- [Environment Configuration Issues](#environment-configuration-issues)
- [Performance Issues](#performance-issues)
- [Known Limitations](#known-limitations)

---

## 🤖 MCP Server Issues

### Issue: MCP Server API Endpoint Mismatches

**Problem:** MCP server tools return 404 errors when calling backend APIs.

**Symptoms:**
- Weather tools return "Request failed with status code 404"
- MCP tools work in terminal but fail when integrated
- Backend server returns "Route not found" errors

**Root Cause:** 
- MCP server calling wrong API endpoints (e.g., `/api/weather/` instead of `/api/v1/weather/`)
- Backend API versioning not matching MCP configuration
- Incorrect `BACKEND_API_URL` environment variable

**Solution:**
```typescript
// Fix API endpoints in weather.ts
const response = await axios.get(
  `${env.BACKEND_API_URL}/api/v1/weather/current?${params.toString()}`,
  {
    timeout: env.API_TIMEOUT,
    headers: {
      'User-Agent': 'LiveConditions-MCP-Server/1.0.0',
    },
  }
);

// Ensure correct .env configuration
NODE_ENV=development
LOG_LEVEL=info
BACKEND_API_URL=http://localhost:3001
API_TIMEOUT=10000
```

**Prevention:**
- Always verify backend API endpoints match MCP tool endpoints
- Use environment variables for API URL configuration
- Test MCP tools directly with JSON-RPC calls before integration

### Issue: MCP Server Response Data Structure Mismatch

**Problem:** MCP server crashes with "Cannot read properties of undefined" errors.

**Symptoms:**
- TypeError when accessing response data properties
- MCP tools return empty or malformed responses
- Backend API returns different data structure than expected

**Root Cause:**
- Backend API wraps responses in `{success: true, data: {...}}` format
- MCP server expects direct data structure
- Missing error handling for API response formats

**Solution:**
```typescript
// Handle both wrapped and unwrapped API responses
const apiResponse = response.data;
const weatherData = apiResponse.data || apiResponse; // Handle both formats

// Add proper error handling
try {
  const response = await axios.get(endpoint);
  const apiResponse = response.data;
  
  if (!apiResponse || (!apiResponse.data && !apiResponse.location)) {
    throw new Error('Invalid API response format');
  }
  
  const weatherData = apiResponse.data || apiResponse;
  // Process weatherData...
} catch (error) {
  logger.error(`API call failed: ${error.message}`);
  return {
    content: [{
      type: 'text',
      text: `Error: ${error.message}`
    }],
    isError: true
  };
}
```

---

## 🖥️ Claude Desktop Integration Issues

### Issue: Claude Desktop Cannot Connect to MCP Server in Codespaces

**Problem:** Claude Desktop on local machine cannot access MCP server running in GitHub Codespaces.

**Symptoms:**
- "Server disconnected" messages in Claude Desktop
- MCP tools not appearing in Claude Desktop
- Connection timeout errors
- "ZodError" validation failures

**Root Cause:**
- Codespaces runs in remote environment, not accessible locally
- Claude Desktop expects stdio-based MCP servers, not HTTP
- Network connectivity issues between local machine and Codespaces

**Solution (Complete Setup):**
```bash
# 1. Install GitHub CLI (if needed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install gh

# 2. Authenticate with codespace scope
gh auth refresh -h github.com -s codespace

# 3. Set up port forwarding
gh codespace ports forward 3003:3003 --codespace $(gh codespace list --json | jq -r '.[0].name')

# 4. Create HTTP bridge server in Codespaces
# File: /workspaces/.../mcp-server/http-bridge.js
const express = require('express');
const { spawn } = require('child_process');
const app = express();

app.use(express.json());

app.post('/', async (req, res) => {
  const mcpProcess = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  mcpProcess.stdin.write(JSON.stringify(req.body) + '\n');
  mcpProcess.stdin.end();
  
  let output = '';
  mcpProcess.stdout.on('data', (data) => output += data);
  
  mcpProcess.on('close', () => {
    try {
      const response = JSON.parse(output.trim().split('\n').pop());
      res.json(response);
    } catch (e) {
      res.status(500).json({
        jsonrpc: '2.0',
        id: req.body.id,
        error: { code: -32603, message: 'Parse error' }
      });
    }
  });
});

app.listen(3003, () => console.log('HTTP bridge listening on port 3003'));

# 5. Create local bridge script
# File: ~/live-conditions-bridge.js
const readline = require('readline');
const http = require('http');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  try {
    const request = JSON.parse(line);
    const postData = JSON.stringify(request);
    
    const req = http.request({
      hostname: 'localhost',
      port: 3003,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(JSON.stringify(response));
        } catch (e) {
          console.log(JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            error: { code: -32700, message: 'Parse error' }
          }));
        }
      });
    });
    
    req.write(postData);
    req.end();
  } catch (e) {
    console.log(JSON.stringify({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Invalid JSON' }
    }));
  }
});

# 6. Configure Claude Desktop
# File: ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "live-conditions": {
      "command": "node",
      "args": ["/Users/username/live-conditions-bridge.js"],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Prevention:**
- Always test MCP server locally first before attempting remote integration
- Use HTTP bridges for remote MCP server access
- Implement proper error handling in bridge scripts

### Issue: MCP Tools Not Appearing in Claude Desktop

**Problem:** Claude Desktop connects but doesn't show any MCP tools.

**Symptoms:**
- Connection successful but no tools visible
- Empty tools list in Claude Desktop
- "Server ready" logs but no tool registration

**Root Cause:**
- MCP server not properly implementing `tools/list` method
- Bridge script not forwarding tool registration correctly
- JSON-RPC response format issues

**Solution:**
```bash
# Test MCP server tools/list method directly
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/index.js

# Expected response should include tools array
{
  "result": {
    "tools": [
      {
        "name": "weather_current",
        "description": "Get current weather conditions",
        "inputSchema": { ... }
      }
      // ... more tools
    ]
  },
  "jsonrpc": "2.0",
  "id": 1
}

# Verify bridge script preserves all JSON-RPC methods
# Check that tools/list, tools/call, resources/list are all forwarded
```

---

## 🌐 GitHub Codespaces Remote Access Issues

### Issue: GitHub CLI Not Installed or Authentication Failures

**Problem:** Cannot set up port forwarding from Codespaces to local machine.

**Symptoms:**
- "command not found: gh" error
- "HTTP 403: Must have admin rights to Repository" error
- Authentication failures with GitHub CLI

**Root Cause:**
- GitHub CLI not installed on local machine
- Missing codespace scope in GitHub authentication
- Insufficient permissions for codespace access

**Solution:**
```bash
# Install GitHub CLI via Homebrew (macOS)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
eval "$(/opt/homebrew/bin/brew shellenv)"
brew install gh

# Authenticate with required scopes
gh auth login
gh auth refresh -h github.com -s codespace

# Verify authentication
gh auth status

# List and connect to codespaces
gh codespace list
gh codespace ports forward 3003:3003 --codespace $(gh codespace list --json | jq -r '.[0].name')
```

### Issue: Port Forwarding Connection Drops

**Problem:** Port forwarding tunnel closes unexpectedly when testing MCP connection.

**Symptoms:**
- Connection established but immediately closes
- "tunnel closes" messages when testing with netcat
- Intermittent connectivity to forwarded ports

**Root Cause:**
- HTTP bridge not properly handling keep-alive connections
- Codespaces network timeout settings
- Firewall or network proxy interference

**Solution:**
```bash
# Use persistent HTTP connection testing
curl -X POST http://localhost:3003 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'

# Instead of netcat which closes immediately:
# nc localhost 3003 (NOT recommended for HTTP)

# Monitor port forwarding status
gh codespace ports --codespace $(gh codespace list --json | jq -r '.[0].name')

# Restart port forwarding if needed
gh codespace ports forward 3003:3003 --codespace $(gh codespace list --json | jq -r '.[0].name')
```

### Issue: Backend Server Not Running on Expected Port

**Problem:** MCP server cannot connect to backend API because server isn't running.

**Symptoms:**
- "Connection refused" errors when testing backend
- MCP tools return connection timeout errors
- Backend health check fails

**Root Cause:**
- Backend server not started
- Backend running on wrong port
- TypeScript compilation errors preventing server start

**Solution:**
```bash
# Check if backend is running
curl http://localhost:3001/health

# If not running, check for compilation errors
cd live-conditions-app/backend
npm run build

# If build fails, use simple server
npx ts-node src/simple-server.ts &

# Verify backend is accessible
curl http://localhost:3001/api/v1/weather/current?city=Sydney&country=AU

# Update MCP server .env file
echo "BACKEND_API_URL=http://localhost:3001" > ../mcp-server/.env
echo "API_TIMEOUT=10000" >> ../mcp-server/.env

# Rebuild and test MCP server
cd ../mcp-server
npm run build
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "weather_current", "arguments": {"city": "Sydney", "country": "AU"}}}' | node dist/index.js
```

---

## 🎨 Frontend Issues

### Issue: Frontend Loading State Not Properly Managed

**Problem:** Frontend shows loading indefinitely when backend APIs are disconnected or unavailable.

**Symptoms:**
- Infinite loading spinners
- No error messages displayed to users
- Application appears frozen

**Root Cause:** 
- Missing error boundaries in React components
- API timeout configurations not properly set
- Loading states not properly handled in async operations

**Solution:**
```typescript
// Fixed in useApi.ts hook
const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const apiCall = async (endpoint: string, options?: RequestInit) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(endpoint, {
        ...options,
        timeout: 10000, // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { apiCall, loading, error };
};
```

**Prevention:**
- Always implement proper error boundaries
- Set reasonable timeout values for API calls
- Provide user-friendly error messages
- Implement retry mechanisms for critical operations

### Issue: WebSocket Connection Failures

**Problem:** WebSocket connections fail silently or reconnect indefinitely.

**Symptoms:**
- Real-time updates stop working
- Console errors about WebSocket connections
- No fallback to polling

**Solution:**
```typescript
// Enhanced WebSocket service with retry logic
class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(url: string) {
    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.handleReconnect(url);
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleReconnect(url);
    }
  }
  
  private handleReconnect(url: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(url);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }
}
```

---

## 🔧 Backend Issues

### Issue: Backend API Disconnection Issues

**Problem:** Backend server disconnects from external APIs and doesn't reconnect properly.

**Symptoms:**
- 502/503 errors from backend
- Stale data being served
- External API rate limiting

**Root Cause:**
- No retry mechanisms for external API calls
- Missing connection pooling
- Improper error handling for external services

**Solution:**
```typescript
// Implemented in services/weather.ts
import axios, { AxiosInstance } from 'axios';

class WeatherService {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      timeout: 5000,
      retries: 3,
      retryDelay: 1000,
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        
        if (!config || !config.retry) {
          config.retry = 0;
        }
        
        if (config.retry >= 3) {
          throw error;
        }
        
        config.retry += 1;
        
        await new Promise(resolve => 
          setTimeout(resolve, config.retryDelay * config.retry)
        );
        
        return this.client(config);
      }
    );
  }
}
```

### Issue: Rate Limiting Problems

**Problem:** External APIs return 429 (Too Many Requests) errors.

**Solution:**
```typescript
// Rate limiter implementation
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  keyGenerate: (req, res) => req.ip,
  points: 10, // Number of requests
  duration: 60, // Per 60 seconds
});

app.use('/api', async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({ error: 'Too many requests' });
  }
});
```

---

## 🌐 API Integration Issues

### Issue: External API Authentication Failures

**Problem:** API keys expire or become invalid, causing authentication errors.

**Symptoms:**
- 401/403 errors from external services
- Missing or invalid API key responses
- Quota exceeded errors

**Solution:**
```typescript
// API key validation and rotation
class ApiKeyManager {
  private keys: Map<string, { key: string; lastUsed: Date; quotaUsed: number }> = new Map();
  
  async getValidKey(service: string): Promise<string> {
    const keyData = this.keys.get(service);
    
    if (!keyData || this.isKeyExpired(keyData)) {
      throw new Error(`No valid API key for ${service}`);
    }
    
    keyData.lastUsed = new Date();
    return keyData.key;
  }
  
  private isKeyExpired(keyData: any): boolean {
    const now = new Date();
    const hoursSinceLastUse = (now.getTime() - keyData.lastUsed.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastUse > 24 || keyData.quotaUsed > 1000;
  }
}
```

### Issue: CORS (Cross-Origin Resource Sharing) Errors

**Problem:** Frontend can't access backend APIs due to CORS restrictions.

**Solution:**
```typescript
// Backend CORS configuration
import cors from 'cors';

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com', 'https://www.yourdomain.com']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
```

---

## 🗄️ Database Issues

### Issue: MongoDB Connection Failures

**Problem:** Database connections fail or timeout during high load.

**Symptoms:**
- "MongoServerError" in logs
- Connection timeout errors
- Application crashes on database operations

**Solution:**
```typescript
// Robust MongoDB connection with retry logic
import mongoose from 'mongoose';

class DatabaseManager {
  private static instance: DatabaseManager;
  private retryAttempts = 0;
  private maxRetries = 5;
  
  async connect(uri: string) {
    try {
      await mongoose.connect(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        retryWrites: true,
        retryReads: true,
      });
      
      console.log('MongoDB connected successfully');
      this.retryAttempts = 0;
      
    } catch (error) {
      console.error('MongoDB connection failed:', error);
      await this.handleReconnect(uri);
    }
  }
  
  private async handleReconnect(uri: string) {
    if (this.retryAttempts < this.maxRetries) {
      this.retryAttempts++;
      const delay = Math.pow(2, this.retryAttempts) * 1000; // Exponential backoff
      
      console.log(`Retrying MongoDB connection in ${delay}ms (${this.retryAttempts}/${this.maxRetries})`);
      
      setTimeout(() => this.connect(uri), delay);
    } else {
      throw new Error('Max MongoDB connection retries exceeded');
    }
  }
}
```

### Issue: Redis Cache Misses

**Problem:** Redis cache not working properly, causing performance issues.

**Solution:**
```typescript
// Enhanced Redis cache service
import Redis from 'ioredis';

class CacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
    
    this.redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }
  
  async get(key: string): Promise<any> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null; // Graceful degradation
    }
  }
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
      // Don't throw - continue without caching
    }
  }
}
```

---

## ⚡ WebSocket Issues

### Issue: WebSocket Connection Drops

**Problem:** WebSocket connections drop unexpectedly, especially on mobile networks.

**Solution:**
```typescript
// Enhanced WebSocket server with heartbeat
import { WebSocketServer } from 'ws';

class EnhancedWebSocketServer {
  private wss: WebSocketServer;
  private heartbeatInterval: NodeJS.Timeout;
  
  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupHeartbeat();
    this.setupConnectionHandling();
  }
  
  private setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.readyState === ws.OPEN) {
          ws.ping();
        }
      });
    }, 30000); // Ping every 30 seconds
  }
  
  private setupConnectionHandling() {
    this.wss.on('connection', (ws) => {
      ws.isAlive = true;
      
      ws.on('pong', () => {
        ws.isAlive = true;
      });
      
      ws.on('close', () => {
        console.log('Client disconnected');
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }
}
```

---

## 🏗️ Build and Deployment Issues

### Issue: TypeScript Compilation Errors

**Problem:** Build fails due to TypeScript type mismatches.

**Common Errors:**
```
Property 'X' does not exist on type 'Y'
Cannot find module or its type declarations
```

**Solution:**
```typescript
// Enhanced type definitions in types/index.ts
export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  timestamp: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// Module declarations for missing types
declare module 'some-package' {
  export function someFunction(): void;
}
```

### Issue: Next.js Build Optimization Problems

**Problem:** Large bundle sizes and slow build times.

**Solution:**
```javascript
// Enhanced next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    domains: ['api.openweathermap.org'],
    formats: ['image/webp', 'image/avif'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      );
    }
    
    return config;
  },
};
```

---

## 🔧 Environment Configuration Issues

### Issue: Environment Variables Not Loading

**Problem:** Application can't access required environment variables.

**Symptoms:**
- `undefined` values for API keys
- Connection failures to databases
- Missing configuration values

**Solution:**
```typescript
// Environment validation utility
import dotenv from 'dotenv';

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  REDIS_URL: string;
  OPENWEATHER_API_KEY: string;
  JWT_SECRET: string;
}

function validateEnv(): EnvConfig {
  dotenv.config();
  
  const requiredVars = [
    'MONGODB_URI',
    'REDIS_URL',
    'OPENWEATHER_API_KEY',
    'JWT_SECRET'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '5000'),
    MONGODB_URI: process.env.MONGODB_URI!,
    REDIS_URL: process.env.REDIS_URL!,
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY!,
    JWT_SECRET: process.env.JWT_SECRET!,
  };
}

export const env = validateEnv();
```

---

## 🚀 Performance Issues

### Issue: Slow API Response Times

**Problem:** API endpoints take too long to respond.

**Symptoms:**
- Request timeouts
- Poor user experience
- High server load

**Solution:**
```typescript
// Performance monitoring and optimization
import compression from 'compression';
import helmet from 'helmet';

// Enable compression
app.use(compression());

// Security headers
app.use(helmet());

// Response time monitoring
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
    
    if (duration > 1000) {
      console.warn(`Slow request detected: ${req.path} took ${duration}ms`);
    }
  });
  
  next();
});

// Database query optimization
const optimizedQuery = await Weather.find()
  .select('temperature humidity windSpeed') // Only select needed fields
  .limit(100) // Limit results
  .lean() // Return plain objects instead of Mongoose documents
  .exec();
```

### Issue: High Memory Usage

**Problem:** Application consumes too much memory, leading to crashes.

**Solution:**
```typescript
// Memory monitoring and optimization
class MemoryMonitor {
  private static interval: NodeJS.Timeout;
  
  static start() {
    this.interval = setInterval(() => {
      const usage = process.memoryUsage();
      const usedMB = Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100;
      
      console.log(`Memory usage: ${usedMB} MB`);
      
      if (usedMB > 512) { // 512MB threshold
        console.warn('High memory usage detected');
        global.gc && global.gc(); // Force garbage collection if available
      }
    }, 30000);
  }
  
  static stop() {
    clearInterval(this.interval);
  }
}

// Start monitoring in production
if (process.env.NODE_ENV === 'production') {
  MemoryMonitor.start();
}
```

---

## ⚠️ Known Limitations

### External API Dependencies

**Limitation:** Application heavily depends on external APIs for data.

**Impact:**
- Service unavailable when external APIs are down
- Rate limiting affects functionality
- Data freshness depends on external update frequencies

**Mitigation:**
- Implement caching strategies
- Provide fallback data sources
- Show appropriate user messages when services are unavailable

### Mobile Network Reliability

**Limitation:** WebSocket connections may be unstable on mobile networks.

**Impact:**
- Real-time updates may be delayed or lost
- Connection drops on network switches

**Mitigation:**
- Implement automatic reconnection
- Fall back to polling when WebSocket fails
- Buffer updates during disconnection periods

### Geographic Data Coverage

**Limitation:** Some remote areas may have limited data coverage.

**Impact:**
- Missing data for certain locations
- Reduced accuracy in rural areas

**Mitigation:**
- Clearly indicate data availability
- Provide alternative data sources where possible
- Show data confidence levels

---

## 🛠️ Debug Tools and Commands

### Useful Debug Commands

```bash
# Check API connectivity
curl -X GET "http://localhost:5000/api/health"

# Test WebSocket connection
wscat -c ws://localhost:5000

# Monitor database connections
mongosh --eval "db.adminCommand('connPoolStats')"

# Check Redis connectivity
redis-cli ping

# Monitor memory usage
node --inspect server.js

# Analyze bundle size
npm run analyze

# Test API endpoints
npm run test:api

# Check for TypeScript errors
npm run type-check

# Lint code
npm run lint
```

### Environment-Specific Debugging

**Development:**
```bash
# Enable debug logging
DEBUG=* npm run dev

# Run with inspector
node --inspect-brk=0.0.0.0:9229 dist/server.js
```

**Production:**
```bash
# Monitor with PM2
pm2 monit

# Check logs
pm2 logs live-conditions-app

# Restart if needed
pm2 restart live-conditions-app
```

---

## 📞 Getting Help

If you encounter issues not covered in this guide:

1. **Check the logs** - Both frontend and backend logs provide valuable information
2. **Verify environment variables** - Ensure all required variables are set
3. **Test external APIs** - Verify that external services are accessible
4. **Check network connectivity** - Ensure database and Redis connections work
5. **Review recent changes** - Check if recent code changes introduced the issue

For additional support:
- Review the main [README.md](README.md)
- Check the [API documentation](docs/api-specification.md)
- Create an issue on GitHub with detailed error information

---

## 🔄 Regular Maintenance

### Daily Checks
- Monitor API response times
- Check error logs for anomalies
- Verify external API quotas

### Weekly Tasks
- Review and rotate API keys if needed
- Check database performance
- Update dependencies (security patches)

### Monthly Tasks
- Analyze performance metrics
- Review and optimize database queries
- Update documentation with new issues and solutions

---

*Last updated: [Current Date]*
*For questions about this guide, please create an issue on GitHub.*