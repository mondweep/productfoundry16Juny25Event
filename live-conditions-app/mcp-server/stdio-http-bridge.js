#!/usr/bin/env node

import readline from 'readline';
import fetch from 'node-fetch';

const HTTP_ENDPOINT = 'http://localhost:3003';

// Create interface for reading from stdin
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Process each line of input
rl.on('line', async (line) => {
  try {
    // Parse the JSON-RPC request
    const request = JSON.parse(line);
    
    // Forward to HTTP server
    const response = await fetch(HTTP_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    
    const result = await response.json();
    
    // Write response to stdout
    console.log(JSON.stringify(result));
  } catch (error) {
    // Send error response
    console.log(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
        data: error.message
      }
    }));
  }
});

// Handle errors
rl.on('error', (error) => {
  console.error('Bridge error:', error);
  process.exit(1);
});