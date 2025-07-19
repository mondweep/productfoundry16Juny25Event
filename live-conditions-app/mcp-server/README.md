# Live Conditions MCP Server

A Model Context Protocol (MCP) server that provides seamless integration with the Aotearoa & Aussie Live Conditions App, enabling other applications to access real-time weather, marine, traffic, and emergency alert data through standardized MCP tools, resources, and prompts.

## 🌟 Features

- **MCP Tools**: Interactive functions for weather, marine, traffic, and alert data
- **MCP Resources**: Direct access to live conditions data feeds
- **MCP Prompts**: Pre-built prompts for data analysis and insights
- **Real-time Data**: Live integration with backend API services
- **Comprehensive Coverage**: Australia and New Zealand conditions
- **Safety Focus**: Emergency alerts and safety assessments
- **Integration Ready**: Designed for easy integration with AI applications

## 📋 Available MCP Tools

### Weather Tools
- `weather_current` - Get current weather conditions
- `weather_forecast` - Get weather forecasts (1-7 days)
- `weather_alerts` - Get active weather warnings
- `weather_historical` - Get historical weather data

### Marine Tools  
- `marine_conditions` - Get current marine conditions
- `marine_tides` - Get tide information and predictions
- `marine_surf` - Get surf conditions and forecasts
- `marine_warnings` - Get active marine warnings

### Traffic Tools
- `traffic_incidents` - Get current traffic incidents
- `traffic_routes` - Get traffic information for specific routes
- `traffic_cameras` - Get traffic camera information
- `traffic_roadwork` - Get planned and active roadwork

### Alert Tools
- `alert_active` - Get all active emergency alerts
- `alert_fire` - Get fire warnings and bushfire alerts
- `alert_earthquake` - Get earthquake alerts and seismic activity
- `alert_tsunami` - Get tsunami warnings and coastal alerts
- `alert_subscribe` - Subscribe to alert notifications

### Integration Tools
- `integration_health` - Check health status of all services
- `integration_metrics` - Get performance metrics and usage statistics
- `integration_data_quality` - Assess data quality and freshness
- `integration_cache` - Manage cache operations
- `integration_webhooks` - Manage webhook subscriptions
- `integration_export` - Export data in various formats

## 📚 MCP Resources

- `conditions://weather/current` - Current weather conditions
- `conditions://marine/current` - Current marine conditions  
- `conditions://traffic/incidents` - Traffic incidents
- `conditions://alerts/active` - Active emergency alerts
- `conditions://locations/popular` - Popular monitored locations
- `conditions://data/quality` - Data quality metrics
- `conditions://api/schema` - Complete API schema

## 🎯 MCP Prompts

- `analyze_conditions` - Analyze current conditions for a location
- `safety_assessment` - Assess safety conditions for outdoor activities
- `travel_planning` - Generate travel recommendations
- `emergency_brief` - Generate emergency situation briefing
- `marine_forecast` - Generate detailed marine forecast
- `data_summary` - Create executive summary of conditions

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Running Live Conditions backend API

### Installation

1. **Install dependencies**
   ```bash
   cd live-conditions-app/mcp-server
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your backend API URL and other settings
   ```

3. **Build the server**
   ```bash
   npm run build
   ```

4. **Start the MCP server**
   ```bash
   npm start
   ```

### Claude Desktop Integration

#### Local Development

Add the MCP server to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "live-conditions": {
      "command": "node",
      "args": ["/path/to/live-conditions-app/mcp-server/dist/index.js"],
      "env": {
        "BACKEND_API_URL": "http://localhost:3001"
      }
    }
  }
}
```

#### Remote Access (GitHub Codespaces)

For accessing MCP server running in GitHub Codespaces from local Claude Desktop:

1. **Set up port forwarding:**
   ```bash
   # Install GitHub CLI (if needed)
   brew install gh
   
   # Authenticate with codespace scope
   gh auth refresh -h github.com -s codespace
   
   # Forward MCP bridge port
   gh codespace ports forward 3003:3003 --codespace $(gh codespace list --json | jq -r '.[0].name')
   ```

2. **Create HTTP bridge in Codespaces:**
   ```bash
   cd /workspaces/.../mcp-server
   
   # Create http-bridge.js
   cat > http-bridge.js << 'EOF'
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
   EOF
   
   # Start the bridge
   node http-bridge.js &
   ```

3. **Create local bridge script:**
   ```bash
   # Create ~/live-conditions-bridge.js
   cat > ~/live-conditions-bridge.js << 'EOF'
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
   EOF
   ```

4. **Configure Claude Desktop for remote access:**
   ```json
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

### Claude Code Integration

Add the MCP server using Claude Code CLI:

```bash
# Add the MCP server
claude mcp add live-conditions node /path/to/live-conditions-app/mcp-server/dist/index.js

# Or use the npm package (when published)
claude mcp add live-conditions npx live-conditions-mcp-server
```

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm run mcp          # Run as MCP server (alias for start)
npm test             # Run tests
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Development Mode

```bash
# Start with automatic restarts
npm run dev

# The server will automatically restart when source files change
```

### Testing MCP Tools

You can test MCP tools directly using the Claude Desktop app or by integrating with your application:

```javascript
// Example: Using the weather tool
{
  "tool": "weather_current",
  "arguments": {
    "latitude": -33.8688,
    "longitude": 151.2093,
    "units": "metric"
  }
}
```

## 📖 Usage Examples

### Getting Current Weather

```typescript
// Tool call
{
  "name": "weather_current",
  "arguments": {
    "city": "Sydney",
    "country": "AU",
    "units": "metric"
  }
}

// Returns detailed weather data for Sydney
```

### Safety Assessment for Surfing

```typescript
// Prompt usage
{
  "name": "safety_assessment", 
  "arguments": {
    "activity": "surfing",
    "location": "Bondi Beach",
    "experience_level": "intermediate"
  }
}

// Returns comprehensive safety assessment with recommendations
```

### Getting Emergency Alerts

```typescript
// Tool call
{
  "name": "alert_active",
  "arguments": {
    "latitude": -37.8136,
    "longitude": 144.9631,
    "radius": 50,
    "alertType": "fire"
  }
}

// Returns active fire alerts within 50km of Melbourne
```

### Reading Live Conditions Resource

```typescript
// Resource access
{
  "uri": "conditions://weather/current"
}

// Returns current weather for major cities
```

## 🔗 Integration Patterns

### AI Assistant Integration

The MCP server is designed to work seamlessly with AI assistants:

```typescript
// Example: Weather analysis request
const result = await mcpClient.callTool("weather_current", {
  latitude: -36.8485,
  longitude: 174.7633
});

// Use the result for further analysis or recommendations
```

### Webhook Notifications

Set up webhooks for real-time alerts:

```typescript
await mcpClient.callTool("integration_webhooks", {
  operation: "create",
  url: "https://your-app.com/webhooks/alerts",
  events: ["weather_alert", "emergency_alert"]
});
```

### Data Export for Analytics

Export data for analysis:

```typescript
await mcpClient.callTool("integration_export", {
  dataType: "combined",
  format: "json",
  location: {
    latitude: -33.8688,
    longitude: 151.2093,
    radius: 25
  },
  timeRange: "24hours"
});
```

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BACKEND_API_URL` | Yes | - | Live Conditions backend API URL |
| `PORT` | No | 3001 | MCP server port |
| `LOG_LEVEL` | No | info | Logging level |
| `CACHE_TTL` | No | 300 | Cache TTL in seconds |
| `API_TIMEOUT` | No | 10000 | API timeout in milliseconds |

### Rate Limiting

The MCP server includes built-in rate limiting:

- Default: 100 requests per minute per client
- Configurable via `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MS`

### Caching

Intelligent caching reduces API calls and improves performance:

- Weather data: 5-minute cache
- Marine data: 10-minute cache  
- Traffic data: 2-minute cache
- Alert data: 1-minute cache

## 🚢 Deployment

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```bash
   export NODE_ENV=production
   export BACKEND_API_URL=https://your-api.com
   export LOG_LEVEL=warn
   ```

3. **Start the server**
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3001
CMD ["npm", "start"]
```

### Process Management

Use PM2 for production process management:

```bash
npm install -g pm2
pm2 start dist/index.js --name live-conditions-mcp
pm2 save
pm2 startup
```

## 📊 Monitoring

### Health Checks

The server provides health check endpoints:

```typescript
// Check server health
await mcpClient.callTool("integration_health", {
  includeMetrics: true,
  checkExternalAPIs: true
});
```

### Performance Metrics

Monitor performance and usage:

```typescript
// Get performance metrics
await mcpClient.callTool("integration_metrics", {
  timeRange: "24hours",
  includeBreakdown: true
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Support

For support with the MCP server:

1. Check the [troubleshooting guide](../../troubleshooting-guide.md)
2. Review the [main documentation](../../README.md)
3. Create an issue on GitHub with:
   - MCP server version
   - Error messages or logs
   - Steps to reproduce
   - Expected vs actual behavior

## 🔗 Related Documentation

- [Live Conditions App Documentation](../../README.md)
- [API Documentation](../../docs/api-specification.md)
- [Troubleshooting Guide](../../troubleshooting-guide.md)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/docs)

---

**Note**: This MCP server requires the Live Conditions backend API to be running. Ensure your backend is properly configured and accessible before starting the MCP server.