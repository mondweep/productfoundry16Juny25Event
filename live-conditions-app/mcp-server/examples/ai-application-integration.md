# AI Application Integration Examples

This document provides examples for integrating the Live Conditions MCP Server with various AI applications and frameworks.

## Table of Contents

- [Node.js/JavaScript Integration](#nodejs-javascript-integration)
- [Python Integration](#python-integration)
- [Custom AI Application Integration](#custom-ai-application-integration)
- [Webhook Integration](#webhook-integration)
- [Real-time Data Streaming](#real-time-data-streaming)

## Node.js/JavaScript Integration

### Basic MCP Client Setup

```javascript
// package.json dependencies
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.6.0",
    "axios": "^1.6.0"
  }
}
```

```javascript
// mcp-client.js
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

class LiveConditionsClient {
  constructor() {
    this.client = null;
    this.transport = null;
  }

  async connect() {
    // Start the MCP server process
    const serverProcess = spawn('node', [
      './live-conditions-app/mcp-server/dist/index.js'
    ], {
      env: {
        ...process.env,
        BACKEND_API_URL: 'http://localhost:5000'
      }
    });

    // Create transport and client
    this.transport = new StdioClientTransport({
      stdin: serverProcess.stdin,
      stdout: serverProcess.stdout,
      stderr: serverProcess.stderr
    });

    this.client = new Client({
      name: 'live-conditions-ai-app',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    await this.client.connect(this.transport);
    console.log('Connected to Live Conditions MCP Server');
  }

  async getCurrentWeather(latitude, longitude) {
    try {
      const result = await this.client.callTool({
        name: 'weather_current',
        arguments: {
          latitude,
          longitude,
          units: 'metric'
        }
      });

      return JSON.parse(result.content[0].text);
    } catch (error) {
      console.error('Weather API error:', error);
      throw error;
    }
  }

  async getSafetyAssessment(activity, location, experienceLevel = 'intermediate') {
    try {
      const result = await this.client.getPrompt({
        name: 'safety_assessment',
        arguments: {
          activity,
          location,
          experience_level: experienceLevel
        }
      });

      return result.messages[0].content.text;
    } catch (error) {
      console.error('Safety assessment error:', error);
      throw error;
    }
  }

  async getActiveAlerts(latitude, longitude, radius = 50) {
    try {
      const result = await this.client.callTool({
        name: 'alert_active',
        arguments: {
          latitude,
          longitude,
          radius,
          alertType: 'all'
        }
      });

      return JSON.parse(result.content[0].text);
    } catch (error) {
      console.error('Alerts API error:', error);
      throw error;
    }
  }

  async getConditionsResource(resourceUri) {
    try {
      const result = await this.client.readResource({
        uri: resourceUri
      });

      return JSON.parse(result.contents[0].text);
    } catch (error) {
      console.error('Resource read error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
    }
  }
}

// Usage example
async function main() {
  const client = new LiveConditionsClient();
  
  try {
    await client.connect();

    // Get current weather for Sydney
    const weather = await client.getCurrentWeather(-33.8688, 151.2093);
    console.log('Sydney Weather:', weather);

    // Get safety assessment for surfing
    const safety = await client.getSafetyAssessment(
      'surfing', 
      'Bondi Beach', 
      'intermediate'
    );
    console.log('Surfing Safety:', safety);

    // Get active alerts
    const alerts = await client.getActiveAlerts(-33.8688, 151.2093);
    console.log('Active Alerts:', alerts);

    // Read current conditions resource
    const conditions = await client.getConditionsResource(
      'conditions://weather/current'
    );
    console.log('Current Conditions:', conditions);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.disconnect();
  }
}

main();
```

### Express.js API Wrapper

```javascript
// api-server.js
import express from 'express';
import cors from 'cors';
import { LiveConditionsClient } from './mcp-client.js';

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

let mcpClient;

// Initialize MCP connection
async function initializeMCP() {
  mcpClient = new LiveConditionsClient();
  await mcpClient.connect();
  console.log('MCP client initialized');
}

// Weather endpoints
app.get('/api/weather/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const weather = await mcpClient.getCurrentWeather(
      parseFloat(lat), 
      parseFloat(lon)
    );
    res.json(weather);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Safety assessment endpoint
app.post('/api/safety-assessment', async (req, res) => {
  try {
    const { activity, location, experienceLevel } = req.body;
    const assessment = await mcpClient.getSafetyAssessment(
      activity, 
      location, 
      experienceLevel
    );
    res.json({ assessment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alerts endpoint
app.get('/api/alerts/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const { radius = 50 } = req.query;
    const alerts = await mcpClient.getActiveAlerts(
      parseFloat(lat), 
      parseFloat(lon), 
      parseInt(radius)
    );
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, async () => {
  await initializeMCP();
  console.log(`API server running on port ${port}`);
});
```

## Python Integration

### Python MCP Client

```python
# requirements.txt
# mcp-client>=0.6.0
# requests>=2.31.0
# asyncio

# mcp_client.py
import asyncio
import json
import subprocess
from mcp import ClientSession, StdioTransport

class LiveConditionsClient:
    def __init__(self, backend_url="http://localhost:5000"):
        self.backend_url = backend_url
        self.session = None
        self.transport = None
        self.process = None

    async def connect(self):
        """Connect to the Live Conditions MCP Server"""
        # Start the MCP server process
        self.process = subprocess.Popen([
            'node', 
            './live-conditions-app/mcp-server/dist/index.js'
        ], 
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env={
            **os.environ,
            'BACKEND_API_URL': self.backend_url
        })

        # Create transport and session
        self.transport = StdioTransport(
            self.process.stdin, 
            self.process.stdout
        )
        
        self.session = ClientSession(self.transport)
        await self.session.initialize()
        print("Connected to Live Conditions MCP Server")

    async def get_current_weather(self, latitude, longitude, units="metric"):
        """Get current weather conditions"""
        try:
            result = await self.session.call_tool({
                "name": "weather_current",
                "arguments": {
                    "latitude": latitude,
                    "longitude": longitude,
                    "units": units
                }
            })
            
            return json.loads(result.content[0].text)
        except Exception as e:
            print(f"Weather API error: {e}")
            raise

    async def get_marine_conditions(self, latitude, longitude):
        """Get current marine conditions"""
        try:
            result = await self.session.call_tool({
                "name": "marine_conditions",
                "arguments": {
                    "latitude": latitude,
                    "longitude": longitude,
                    "includeForecast": True
                }
            })
            
            return json.loads(result.content[0].text)
        except Exception as e:
            print(f"Marine conditions error: {e}")
            raise

    async def assess_safety(self, activity, location, experience_level="intermediate"):
        """Get safety assessment for an activity"""
        try:
            result = await self.session.get_prompt({
                "name": "safety_assessment",
                "arguments": {
                    "activity": activity,
                    "location": location,
                    "experience_level": experience_level
                }
            })
            
            return result.messages[0].content.text
        except Exception as e:
            print(f"Safety assessment error: {e}")
            raise

    async def get_active_alerts(self, latitude=None, longitude=None, region=None):
        """Get active emergency alerts"""
        try:
            args = {"alertType": "all"}
            if latitude and longitude:
                args.update({"latitude": latitude, "longitude": longitude})
            if region:
                args["region"] = region

            result = await self.session.call_tool({
                "name": "alert_active",
                "arguments": args
            })
            
            return json.loads(result.content[0].text)
        except Exception as e:
            print(f"Alerts error: {e}")
            raise

    async def close(self):
        """Close the MCP connection"""
        if self.session:
            await self.session.close()
        if self.process:
            self.process.terminate()

# Usage example
async def main():
    client = LiveConditionsClient()
    
    try:
        await client.connect()

        # Get weather for Sydney
        weather = await client.get_current_weather(-33.8688, 151.2093)
        print("Sydney Weather:", weather)

        # Get marine conditions for Bondi Beach
        marine = await client.get_marine_conditions(-33.8915, 151.2767)
        print("Marine Conditions:", marine)

        # Safety assessment for surfing
        safety = await client.assess_safety("surfing", "Bondi Beach", "intermediate")
        print("Safety Assessment:", safety)

        # Get alerts for NSW
        alerts = await client.get_active_alerts(region="NSW")
        print("NSW Alerts:", alerts)

    except Exception as e:
        print(f"Error: {e}")
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
```

### Flask API Wrapper

```python
# flask_api.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import asyncio
from mcp_client import LiveConditionsClient

app = Flask(__name__)
CORS(app)

# Global MCP client
mcp_client = None

def run_async(coro):
    """Helper to run async functions in Flask"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()

@app.before_first_request
async def initialize():
    global mcp_client
    mcp_client = LiveConditionsClient()
    await mcp_client.connect()

@app.route('/api/weather/<float:lat>/<float:lon>')
def get_weather(lat, lon):
    units = request.args.get('units', 'metric')
    weather = run_async(mcp_client.get_current_weather(lat, lon, units))
    return jsonify(weather)

@app.route('/api/marine/<float:lat>/<float:lon>')
def get_marine(lat, lon):
    marine = run_async(mcp_client.get_marine_conditions(lat, lon))
    return jsonify(marine)

@app.route('/api/safety', methods=['POST'])
def assess_safety():
    data = request.json
    assessment = run_async(mcp_client.assess_safety(
        data['activity'], 
        data['location'], 
        data.get('experience_level', 'intermediate')
    ))
    return jsonify({'assessment': assessment})

@app.route('/api/alerts')
def get_alerts():
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    region = request.args.get('region')
    
    alerts = run_async(mcp_client.get_active_alerts(lat, lon, region))
    return jsonify(alerts)

if __name__ == '__main__':
    app.run(debug=True, port=3003)
```

## Custom AI Application Integration

### Chatbot Integration Example

```javascript
// chatbot-integration.js
import { LiveConditionsClient } from './mcp-client.js';

class WeatherChatbot {
  constructor() {
    this.mcpClient = new LiveConditionsClient();
    this.isConnected = false;
  }

  async initialize() {
    await this.mcpClient.connect();
    this.isConnected = true;
    console.log('Weather chatbot initialized');
  }

  async processMessage(message, userLocation = null) {
    if (!this.isConnected) {
      throw new Error('Chatbot not initialized');
    }

    const lowerMessage = message.toLowerCase();
    
    try {
      // Weather queries
      if (lowerMessage.includes('weather')) {
        return await this.handleWeatherQuery(message, userLocation);
      }
      
      // Safety queries
      if (lowerMessage.includes('safe') || lowerMessage.includes('surfing') || 
          lowerMessage.includes('swimming') || lowerMessage.includes('hiking')) {
        return await this.handleSafetyQuery(message, userLocation);
      }
      
      // Alert queries
      if (lowerMessage.includes('alert') || lowerMessage.includes('warning') || 
          lowerMessage.includes('emergency')) {
        return await this.handleAlertQuery(message, userLocation);
      }
      
      // Travel queries
      if (lowerMessage.includes('travel') || lowerMessage.includes('drive') || 
          lowerMessage.includes('traffic')) {
        return await this.handleTravelQuery(message);
      }

      return "I can help you with weather, safety assessments, emergency alerts, and travel conditions. What would you like to know?";
      
    } catch (error) {
      console.error('Chatbot error:', error);
      return "Sorry, I'm having trouble accessing the latest conditions. Please try again.";
    }
  }

  async handleWeatherQuery(message, userLocation) {
    // Extract location from message or use user location
    const location = this.extractLocation(message) || userLocation;
    
    if (!location) {
      return "Please specify a location for the weather forecast.";
    }

    const weather = await this.mcpClient.getCurrentWeather(
      location.latitude, 
      location.longitude
    );

    return this.formatWeatherResponse(weather);
  }

  async handleSafetyQuery(message, userLocation) {
    const activity = this.extractActivity(message);
    const location = this.extractLocation(message) || userLocation;
    
    if (!activity || !location) {
      return "Please specify both an activity and location for safety assessment.";
    }

    const assessment = await this.mcpClient.getSafetyAssessment(
      activity, 
      location.name || `${location.latitude}, ${location.longitude}`
    );

    return assessment;
  }

  async handleAlertQuery(message, userLocation) {
    const location = this.extractLocation(message) || userLocation;
    
    if (!location) {
      return "Please specify a location to check for alerts.";
    }

    const alerts = await this.mcpClient.getActiveAlerts(
      location.latitude, 
      location.longitude
    );

    return this.formatAlertsResponse(alerts);
  }

  extractLocation(message) {
    // Simple location extraction (in production, use NLP)
    const locations = {
      'sydney': { latitude: -33.8688, longitude: 151.2093, name: 'Sydney' },
      'melbourne': { latitude: -37.8136, longitude: 144.9631, name: 'Melbourne' },
      'brisbane': { latitude: -27.4698, longitude: 153.0251, name: 'Brisbane' },
      'perth': { latitude: -31.9505, longitude: 115.8605, name: 'Perth' },
      'auckland': { latitude: -36.8485, longitude: 174.7633, name: 'Auckland' },
      'wellington': { latitude: -41.2865, longitude: 174.7762, name: 'Wellington' },
      'bondi': { latitude: -33.8915, longitude: 151.2767, name: 'Bondi Beach' }
    };

    const lowerMessage = message.toLowerCase();
    for (const [key, location] of Object.entries(locations)) {
      if (lowerMessage.includes(key)) {
        return location;
      }
    }
    
    return null;
  }

  extractActivity(message) {
    const activities = ['surfing', 'swimming', 'hiking', 'sailing', 'fishing', 'camping'];
    const lowerMessage = message.toLowerCase();
    
    return activities.find(activity => lowerMessage.includes(activity));
  }

  formatWeatherResponse(weather) {
    const condition = weather.current;
    return `Current weather in ${weather.location.name}:
🌡️ Temperature: ${condition.temperature}°C (feels like ${condition.feelsLike}°C)
🌤️ Condition: ${condition.condition}
💨 Wind: ${condition.windSpeed} km/h
💧 Humidity: ${condition.humidity}%`;
  }

  formatAlertsResponse(alerts) {
    if (alerts.totalAlerts === 0) {
      return "No active alerts for this area.";
    }

    let response = `Found ${alerts.totalAlerts} active alert(s):\n\n`;
    alerts.alerts.slice(0, 3).forEach(alert => {
      response += `⚠️ ${alert.title}\n`;
      response += `   Severity: ${alert.severity.toUpperCase()}\n`;
      response += `   ${alert.description}\n\n`;
    });

    return response;
  }
}

// Usage example
async function main() {
  const chatbot = new WeatherChatbot();
  await chatbot.initialize();

  // Simulate user interactions
  const messages = [
    "What's the weather like in Sydney?",
    "Is it safe to go surfing at Bondi Beach?",
    "Are there any alerts in Melbourne?",
    "Should I drive from Sydney to Melbourne today?"
  ];

  for (const message of messages) {
    console.log(`User: ${message}`);
    const response = await chatbot.processMessage(message);
    console.log(`Bot: ${response}\n`);
  }
}

main();
```

## Webhook Integration

### Webhook Server for Real-time Alerts

```javascript
// webhook-server.js
import express from 'express';
import { LiveConditionsClient } from './mcp-client.js';

const app = express();
app.use(express.json());

let mcpClient;

// Initialize MCP client
async function initializeMCP() {
  mcpClient = new LiveConditionsClient();
  await mcpClient.connect();
  
  // Set up webhook subscription
  await mcpClient.client.callTool({
    name: 'integration_webhooks',
    arguments: {
      operation: 'create',
      url: 'http://localhost:3004/webhooks/alerts',
      events: ['weather_alert', 'marine_warning', 'traffic_incident', 'emergency_alert']
    }
  });
}

// Webhook endpoint for receiving alerts
app.post('/webhooks/alerts', (req, res) => {
  const alert = req.body;
  
  console.log('Received alert:', alert);
  
  // Process the alert
  processAlert(alert);
  
  res.status(200).json({ received: true });
});

function processAlert(alert) {
  // Example alert processing
  switch (alert.type) {
    case 'weather_alert':
      handleWeatherAlert(alert);
      break;
    case 'marine_warning':
      handleMarineWarning(alert);
      break;
    case 'traffic_incident':
      handleTrafficIncident(alert);
      break;
    case 'emergency_alert':
      handleEmergencyAlert(alert);
      break;
    default:
      console.log('Unknown alert type:', alert.type);
  }
}

function handleWeatherAlert(alert) {
  console.log(`🌧️ Weather Alert: ${alert.title}`);
  
  // Send notifications to users in affected areas
  notifyUsers(alert, 'weather');
  
  // Update application state
  updateWeatherState(alert);
}

function handleEmergencyAlert(alert) {
  console.log(`🚨 Emergency Alert: ${alert.title}`);
  
  // High priority notification
  sendUrgentNotification(alert);
  
  // Log for emergency response
  logEmergencyAlert(alert);
}

function notifyUsers(alert, category) {
  // Implementation for user notifications
  console.log(`Notifying users about ${category} alert in ${alert.areas.join(', ')}`);
}

// Start server
app.listen(3004, async () => {
  await initializeMCP();
  console.log('Webhook server running on port 3004');
});
```

## Real-time Data Streaming

### WebSocket Integration

```javascript
// websocket-stream.js
import WebSocket from 'ws';
import { LiveConditionsClient } from './mcp-client.js';

class LiveConditionsStream {
  constructor() {
    this.mcpClient = new LiveConditionsClient();
    this.wss = new WebSocket.Server({ port: 8080 });
    this.clients = new Set();
    this.updateInterval = null;
  }

  async initialize() {
    await this.mcpClient.connect();
    
    this.wss.on('connection', (ws) => {
      console.log('Client connected');
      this.clients.add(ws);
      
      // Send initial data
      this.sendInitialData(ws);
      
      ws.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(ws);
      });
      
      ws.on('message', (message) => {
        this.handleClientMessage(ws, JSON.parse(message));
      });
    });

    // Start periodic updates
    this.startPeriodicUpdates();
    console.log('Live conditions stream initialized');
  }

  async sendInitialData(ws) {
    try {
      // Get current conditions for major cities
      const conditions = await this.mcpClient.getConditionsResource(
        'conditions://weather/current'
      );
      
      ws.send(JSON.stringify({
        type: 'initial_data',
        data: conditions
      }));
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  async handleClientMessage(ws, message) {
    switch (message.type) {
      case 'subscribe_location':
        await this.subscribeToLocation(ws, message.location);
        break;
      case 'get_weather':
        await this.sendWeatherUpdate(ws, message.location);
        break;
      case 'get_alerts':
        await this.sendAlertsUpdate(ws, message.location);
        break;
    }
  }

  async subscribeToLocation(ws, location) {
    ws.subscribedLocation = location;
    
    // Send current data for the location
    await this.sendLocationUpdate(ws, location);
  }

  async sendLocationUpdate(ws, location) {
    try {
      const [weather, alerts] = await Promise.all([
        this.mcpClient.getCurrentWeather(location.latitude, location.longitude),
        this.mcpClient.getActiveAlerts(location.latitude, location.longitude)
      ]);

      ws.send(JSON.stringify({
        type: 'location_update',
        location,
        weather,
        alerts
      }));
    } catch (error) {
      console.error('Error sending location update:', error);
    }
  }

  startPeriodicUpdates() {
    this.updateInterval = setInterval(async () => {
      await this.broadcastUpdates();
    }, 60000); // Update every minute
  }

  async broadcastUpdates() {
    // Get latest conditions
    const conditions = await this.mcpClient.getConditionsResource(
      'conditions://weather/current'
    );

    // Broadcast to all clients
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'periodic_update',
          timestamp: new Date().toISOString(),
          data: conditions
        }));
      }
    });
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.wss.close();
  }
}

// Usage
const stream = new LiveConditionsStream();
stream.initialize();

// Handle shutdown
process.on('SIGINT', () => {
  console.log('Shutting down stream server...');
  stream.stop();
  process.exit(0);
});
```

### Client-side WebSocket Integration

```javascript
// client-websocket.js
class LiveConditionsClient {
  constructor(url = 'ws://localhost:8080') {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('Connected to Live Conditions stream');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    this.ws.onclose = () => {
      console.log('Disconnected from Live Conditions stream');
      this.handleReconnect();
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleMessage(message) {
    switch (message.type) {
      case 'initial_data':
        this.onInitialData(message.data);
        break;
      case 'location_update':
        this.onLocationUpdate(message);
        break;
      case 'periodic_update':
        this.onPeriodicUpdate(message.data);
        break;
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    }
  }

  subscribeToLocation(latitude, longitude) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe_location',
        location: { latitude, longitude }
      }));
    }
  }

  // Event handlers (override these in your application)
  onInitialData(data) {
    console.log('Initial data received:', data);
  }

  onLocationUpdate(message) {
    console.log('Location update:', message);
  }

  onPeriodicUpdate(data) {
    console.log('Periodic update:', data);
  }
}

// Usage
const client = new LiveConditionsClient();
client.connect();

// Subscribe to Sydney updates
client.subscribeToLocation(-33.8688, 151.2093);
```

---

These examples demonstrate various integration patterns for the Live Conditions MCP Server. Choose the approach that best fits your application architecture and requirements. For production use, ensure proper error handling, authentication, and rate limiting are implemented.