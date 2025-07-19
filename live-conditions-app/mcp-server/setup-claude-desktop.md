# Connect MCP Server to Local Claude Desktop

## Step 1: Set up Port Forwarding (Run on your LOCAL machine)

```bash
# Forward the MCP server port from Codespaces to your local machine
gh codespace ports forward 3003:3003 --codespace $(gh codespace list --json | jq -r '.[0].name')
```

Or if you know your codespace name:
```bash
gh codespace ports forward 3003:3003 --codespace YOUR_CODESPACE_NAME
```

## Step 2: Create a startup script for the MCP server

Create this file on your LOCAL machine where you want to run the MCP server bridge:

**File: `~/live-conditions-mcp-bridge.js`**
```javascript
#!/usr/bin/env node

import { spawn } from 'child_process';
import { createServer } from 'net';

// Bridge that connects local Claude Desktop to remote MCP server
const REMOTE_HOST = 'localhost'; // Through port forwarding
const REMOTE_PORT = 3003;
const LOCAL_PORT = 3004; // Port for Claude Desktop to connect to

console.log('🌉 Starting MCP Bridge...');
console.log(`📡 Remote: ${REMOTE_HOST}:${REMOTE_PORT}`);
console.log(`🏠 Local: localhost:${LOCAL_PORT}`);

const server = createServer((localSocket) => {
  console.log('🔗 Claude Desktop connected');
  
  const remoteSocket = new require('net').Socket();
  
  remoteSocket.connect(REMOTE_PORT, REMOTE_HOST, () => {
    console.log('✅ Connected to remote MCP server');
    
    // Pipe data between local Claude Desktop and remote MCP server
    localSocket.pipe(remoteSocket);
    remoteSocket.pipe(localSocket);
  });
  
  remoteSocket.on('error', (err) => {
    console.error('❌ Remote connection error:', err.message);
    localSocket.end();
  });
  
  localSocket.on('error', (err) => {
    console.error('❌ Local connection error:', err.message);
    remoteSocket.end();
  });
  
  localSocket.on('close', () => {
    console.log('🔌 Claude Desktop disconnected');
    remoteSocket.end();
  });
});

server.listen(LOCAL_PORT, () => {
  console.log(`🚀 MCP Bridge ready on port ${LOCAL_PORT}`);
  console.log('✨ Claude Desktop can now connect!');
});
```

## Step 3: Configure Claude Desktop (Run on your LOCAL machine)

Add this to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`  
**Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "live-conditions": {
      "command": "node",
      "args": ["/path/to/your/live-conditions-mcp-bridge.js"],
      "env": {
        "BACKEND_API_URL": "https://shiny-computing-machine-7qqrqvp664hr5q5-3001.app.github.dev",
        "LOG_LEVEL": "info",
        "NODE_ENV": "development"
      }
    }
  }
}
```

## Step 4: Complete Setup Process

### On your LOCAL machine:

1. **Install dependencies:**
```bash
npm install net
```

2. **Make the bridge executable:**
```bash
chmod +x ~/live-conditions-mcp-bridge.js
```

3. **Set up port forwarding:**
```bash
# First, get your codespace name
gh codespace list

# Then forward the port (replace YOUR_CODESPACE_NAME)
gh codespace ports forward 3003:3003 --codespace YOUR_CODESPACE_NAME
```

### In this Codespaces terminal:

4. **Start the MCP server:**
```bash
cd /workspaces/productfoundry16Juny25Event/live-conditions-app/mcp-server
npm run start
```

### Back on your LOCAL machine:

5. **Start the bridge:**
```bash
node ~/live-conditions-mcp-bridge.js
```

6. **Restart Claude Desktop** to load the new MCP server configuration

## Testing the Connection

Once everything is running, test in Claude Desktop:

```
What weather tools are available?
```

```
Get the current weather for Sydney
```

```
What resources can I access?
```

## Troubleshooting

- **Port forwarding fails:** Make sure GitHub CLI is authenticated (`gh auth status`)
- **Bridge connection fails:** Check that port forwarding is active
- **Claude Desktop doesn't see the server:** Verify the config file path and restart Claude Desktop
- **Backend connection issues:** Use the full Codespaces URL in BACKEND_API_URL

## Alternative: Direct SSH Tunnel

If GitHub CLI port forwarding doesn't work, use SSH:

```bash
# Get your codespace SSH connection
gh codespace ssh --codespace YOUR_CODESPACE_NAME -- -L 3003:localhost:3003 -N
```

This creates a tunnel that forwards local port 3003 to the Codespaces port 3003.