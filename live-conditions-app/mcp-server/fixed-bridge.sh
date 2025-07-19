#!/bin/bash

# MCP Bridge for Live Conditions
# Forwards stdin/stdout to HTTP server via port forwarding

while IFS= read -r line; do
  # Send request to HTTP server
  response=$(curl -s -X POST http://localhost:3003 \
    -H "Content-Type: application/json" \
    -d "$line" 2>/dev/null)
  
  # Check if we got a response
  if [ $? -eq 0 ] && [ -n "$response" ]; then
    echo "$response"
  else
    # Extract the ID from the request if possible
    id=$(echo "$line" | grep -o '"id":[^,}]*' | cut -d: -f2 | tr -d ' ')
    if [ -z "$id" ]; then
      id="null"
    fi
    
    # Send properly formatted JSON-RPC error response
    echo "{\"jsonrpc\":\"2.0\",\"id\":$id,\"error\":{\"code\":-32603,\"message\":\"Connection to MCP server failed\",\"data\":\"Could not connect to http://localhost:3003\"}}"
  fi
done