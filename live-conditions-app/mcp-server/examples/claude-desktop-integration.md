# Claude Desktop Integration Examples

This document provides practical examples for integrating the Live Conditions MCP Server with Claude Desktop.

## Setup Configuration

Add the following to your Claude Desktop MCP configuration file:

### macOS
Location: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Windows  
Location: `%APPDATA%/Claude/claude_desktop_config.json`

### Linux
Location: `~/.config/Claude/claude_desktop_config.json`

## Configuration Examples

### Basic Configuration

```json
{
  "mcpServers": {
    "live-conditions": {
      "command": "node",
      "args": ["/path/to/live-conditions-app/mcp-server/dist/index.js"],
      "env": {
        "BACKEND_API_URL": "http://localhost:5000",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Production Configuration

```json
{
  "mcpServers": {
    "live-conditions": {
      "command": "node", 
      "args": ["/path/to/live-conditions-app/mcp-server/dist/index.js"],
      "env": {
        "BACKEND_API_URL": "https://api.liveconditions.com",
        "NODE_ENV": "production",
        "LOG_LEVEL": "warn",
        "CACHE_TTL": "600",
        "API_TIMEOUT": "15000"
      }
    }
  }
}
```

### Development Configuration with Custom Settings

```json
{
  "mcpServers": {
    "live-conditions-dev": {
      "command": "npm",
      "args": ["run", "dev"],
      "cwd": "/path/to/live-conditions-app/mcp-server",
      "env": {
        "BACKEND_API_URL": "http://localhost:5000",
        "NODE_ENV": "development", 
        "LOG_LEVEL": "debug",
        "ENABLE_METRICS": "true"
      }
    }
  }
}
```

## Usage Examples in Claude Desktop

### 1. Weather Queries

**User**: "What's the current weather in Sydney?"

**Claude Response**: Using the `weather_current` tool to get live weather data for Sydney, Australia.

```
Current weather in Sydney:
- Temperature: 22°C (feels like 24°C)
- Condition: Partly cloudy
- Humidity: 65%
- Wind: 15 km/h from the northeast
- Pressure: 1015 hPa
```

### 2. Safety Assessment for Activities

**User**: "Is it safe to go surfing at Bondi Beach today? I'm an intermediate surfer."

**Claude Response**: Using the `safety_assessment` prompt to evaluate surfing conditions.

```
Safety Assessment for Surfing at Bondi Beach:

Current Conditions:
- Wave height: 1.2-1.5m (suitable for intermediate)
- Wind: Light offshore (favorable)
- Water temperature: 19°C
- Visibility: Good (8km)

Risk Level: LOW-MODERATE

Recommendations:
✅ Good conditions for intermediate surfers
✅ Waves are clean with offshore winds
⚠️ Water temperature requires 3/2mm wetsuit
⚠️ Check for any rip currents before entering

Best surf times today: 7-9 AM, 4-6 PM
```

### 3. Travel Planning

**User**: "I'm driving from Melbourne to Sydney tomorrow. What should I expect?"

**Claude Response**: Using the `travel_planning` prompt for route analysis.

```
Melbourne to Sydney Travel Analysis:

Route Conditions:
🛣️ Hume Highway (M31): CLEAR
📍 Current incidents: Minor roadwork near Goulburn (10min delay)
⛅ Weather: Clear skies, good visibility throughout route

Recommendations:
- Departure: 6:00 AM (avoid Melbourne morning traffic)
- Total journey: 8h 45min (including stops)
- Fuel stops: Goulburn, Yass recommended
- Weather: Sunny, 18-25°C along route

Sydney arrival conditions:
- Light afternoon traffic expected
- Parking: Check CBD restrictions
- Weather: 24°C, partly cloudy
```

### 4. Emergency Alert Monitoring

**User**: "Are there any emergency alerts in Queensland right now?"

**Claude Response**: Using the `alert_active` tool to check emergency alerts.

```
Active Emergency Alerts - Queensland:

🔥 FIRE WARNING - Severe (Active)
Location: Sunshine Coast Hinterland
Issued: Today 2:15 PM
Impact: Evacuation warning for Maleny area
Action: Residents should prepare to leave immediately

⛈️ WEATHER WARNING - Moderate (Active)  
Location: Southeast Queensland
Issued: Today 12:30 PM
Impact: Severe thunderstorms, damaging winds
Action: Avoid travel, secure outdoor items

Total alerts: 2 active (1 severe, 1 moderate)
```

### 5. Marine Conditions

**User**: "What are the surf conditions at Gold Coast beaches this weekend?"

**Claude Response**: Using the `marine_forecast` prompt for detailed surf analysis.

```
Gold Coast Surf Forecast - Weekend:

Saturday:
🌊 Wave height: 1.0-1.5m
💨 Wind: Light offshore 5-10 knots
🌊 Period: 8-10 seconds
⭐ Surf rating: 6/10 (Good for beginners/intermediate)
🕐 Best times: Early morning (6-8 AM), Late afternoon (4-6 PM)

Sunday:  
🌊 Wave height: 1.5-2.0m
💨 Wind: Moderate onshore 15-20 knots
🌊 Period: 10-12 seconds  
⭐ Surf rating: 7/10 (Good for intermediate/advanced)
🕐 Best times: Dawn patrol (5:30-7 AM), Before wind picks up

Recommendations:
- Saturday: Great for learning, clean conditions
- Sunday: Bigger waves but wind-affected afternoons
- Water temp: 22°C (boardshorts/rashie suitable)
```

## Advanced Integration Patterns

### 1. Conditional Alerts Setup

```json
{
  "mcpServers": {
    "live-conditions": {
      "command": "node",
      "args": ["/path/to/live-conditions-app/mcp-server/dist/index.js"],
      "env": {
        "BACKEND_API_URL": "http://localhost:5000",
        "AUTO_SUBSCRIBE_ALERTS": "true",
        "DEFAULT_ALERT_RADIUS": "25",
        "ALERT_WEBHOOK_URL": "https://your-app.com/webhooks/alerts"
      }
    }
  }
}
```

### 2. Multi-Location Monitoring

Configure for monitoring multiple locations:

```json
{
  "mcpServers": {
    "live-conditions": {
      "command": "node",
      "args": ["/path/to/live-conditions-app/mcp-server/dist/index.js"],
      "env": {
        "BACKEND_API_URL": "http://localhost:5000",
        "MONITORED_LOCATIONS": "Sydney,Melbourne,Brisbane,Auckland,Wellington",
        "ENABLE_MULTI_LOCATION_SUMMARY": "true"
      }
    }
  }
}
```

## Conversation Starters

Here are useful conversation starters to demonstrate MCP server capabilities:

### Weather & Conditions
- "What's the weather like in [city] right now?"
- "Will it rain in [location] this weekend?"
- "What's the temperature difference between Sydney and Melbourne?"

### Marine & Surf
- "Are the surf conditions good at [beach] today?"
- "What time is high tide at [location]?"
- "Is it safe to go swimming at [beach] now?"

### Safety & Alerts  
- "Are there any emergency alerts in my area?"
- "Is it safe to drive from [A] to [B] today?"
- "What's the fire danger rating in [region]?"

### Travel & Traffic
- "What's the traffic like on [highway/route]?"
- "When should I leave to avoid traffic from [A] to [B]?"
- "Are there any road closures between [origin] and [destination]?"

### Data Analysis
- "Can you summarize today's conditions across Australia?"
- "What's the air quality like in major cities?"
- "Which beaches have the best conditions this weekend?"

## Troubleshooting Integration Issues

### Server Not Starting

1. **Check the path**: Ensure the path to `dist/index.js` is correct
2. **Verify Node.js**: Make sure Node.js 18+ is installed
3. **Check permissions**: Ensure the file is executable
4. **Review logs**: Check Claude Desktop logs for error messages

### Backend Connection Issues

1. **Verify backend URL**: Ensure `BACKEND_API_URL` is accessible
2. **Check network**: Test API connectivity manually
3. **Review timeouts**: Increase `API_TIMEOUT` if needed
4. **Check logs**: Review MCP server logs for connection errors

### Performance Issues

1. **Adjust cache settings**: Increase `CACHE_TTL` for better performance
2. **Monitor memory**: Check for memory leaks in long-running sessions
3. **Rate limiting**: Ensure you're not hitting API rate limits
4. **Network latency**: Consider using a local backend instance

### Data Freshness Issues

1. **Check data sources**: Verify external API connectivity
2. **Review cache**: Clear cache if data seems stale
3. **Monitor updates**: Check data source update frequencies
4. **Validate timestamps**: Ensure timezone handling is correct

## Best Practices

### 1. Resource Management
- Use caching to reduce API calls
- Implement proper error handling
- Monitor memory usage in long sessions

### 2. User Experience
- Provide clear, actionable information
- Include timestamps for data freshness
- Offer alternative options when conditions are poor

### 3. Safety First
- Always include safety warnings for outdoor activities
- Provide emergency contact information
- Prioritize official alert sources

### 4. Performance Optimization
- Use appropriate cache TTL values
- Batch requests when possible
- Implement graceful degradation

---

For more examples and advanced integration patterns, see the other files in this examples directory.