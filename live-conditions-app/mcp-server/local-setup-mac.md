# Setting up MCP Connection on macOS

## Step 1: Install GitHub CLI

### Option A: Using Homebrew (Recommended)
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install GitHub CLI
brew install gh

# Authenticate with GitHub
gh auth login
```

### Option B: Direct Download
1. Download from: https://github.com/cli/cli/releases/latest
2. Choose the macOS .pkg file
3. Install it
4. Run `gh auth login` in Terminal

## Step 2: Get Your Codespace Name

Once GitHub CLI is installed and authenticated:

```bash
# List your codespaces
gh codespace list

# You'll see output like:
# NAME                          REPOSITORY              BRANCH  STATE   CREATED AT
# shiny-computing-machine-xxx   mondweep/productfoundry main    Active  2 hours ago
```

## Step 3: Set Up Port Forwarding

Use the codespace name from above:

```bash
# Replace 'shiny-computing-machine-xxx' with your actual codespace name
gh codespace ports forward 3003:3003 --codespace shiny-computing-machine-xxx
```

## Step 4: Create MCP Bridge Script

Create this file: `~/live-conditions-mcp.sh`

```bash
#!/bin/bash

# Simple MCP server proxy script
echo "Starting Live Conditions MCP Server proxy..."

# The MCP server in Codespaces will be available at localhost:3003
# This script just ensures Claude Desktop can find it

# Check if port forwarding is active
if ! lsof -i:3003 > /dev/null 2>&1; then
    echo "ERROR: Port 3003 is not forwarded. Please run:"
    echo "gh codespace ports forward 3003:3003 --codespace YOUR_CODESPACE_NAME"
    exit 1
fi

echo "MCP Server ready on port 3003"
echo "Proxying stdio to localhost:3003..."

# Use netcat to bridge stdio to the TCP port
nc localhost 3003
```

Make it executable:
```bash
chmod +x ~/live-conditions-mcp.sh
```

## Step 5: Configure Claude Desktop

Add to: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "live-conditions": {
      "command": "/bin/bash",
      "args": ["/Users/YOUR_USERNAME/live-conditions-mcp.sh"],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Important:** Replace `YOUR_USERNAME` with your actual macOS username.

## Step 6: Test Everything

1. **In Codespaces terminal:**
   ```bash
   cd /workspaces/productfoundry16Juny25Event/live-conditions-app/mcp-server
   npm run start
   ```

2. **On your Mac:**
   ```bash
   # Make sure port forwarding is active
   gh codespace ports forward 3003:3003 --codespace YOUR_CODESPACE_NAME
   
   # Test the connection
   echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | nc localhost 3003
   ```

3. **Restart Claude Desktop**

## Alternative: SSH Tunnel Method

If GitHub CLI port forwarding doesn't work, use SSH:

```bash
# SSH into codespace with port forwarding
gh codespace ssh --codespace YOUR_CODESPACE_NAME -- -L 3003:localhost:3003 -N &

# This runs in background. To stop it later:
# ps aux | grep "gh codespace ssh" 
# kill [PID]
```

## Troubleshooting

### "command not found: gh"
- Install GitHub CLI using the steps above

### "You are not logged into any GitHub hosts"
- Run: `gh auth login`
- Choose GitHub.com
- Follow the browser authentication

### "Port forwarding failed"
- Make sure the codespace is running
- Check: `gh codespace list`
- Try the SSH tunnel method instead

### Claude Desktop doesn't see the server
- Check the config file path is correct
- Make sure you replaced YOUR_USERNAME in the path
- Restart Claude Desktop completely (Quit and reopen)

### Connection refused on port 3003
- Ensure the MCP server is running in Codespaces
- Check port forwarding is active: `lsof -i:3003`
- Try restarting the port forwarding

## Quick Test Commands

Once everything is set up, test with:

```bash
# Test direct connection
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | nc localhost 3003

# Should return a JSON response with 22 tools
```

In Claude Desktop, you can then ask:
- "What MCP tools are available?"
- "Get the current weather for Sydney"
- "Show me any active emergency alerts"