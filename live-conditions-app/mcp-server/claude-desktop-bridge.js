#!/usr/bin/env node

const readline = require('readline');
const http = require('http');

// Create readline interface for stdio
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Process each line from Claude Desktop
rl.on('line', (line) => {
  try {
    // Parse the incoming request
    const request = JSON.parse(line);
    
    // Prepare HTTP request
    const postData = JSON.stringify(request);
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Parse and output the response
          const response = JSON.parse(data);
          console.log(JSON.stringify(response));
        } catch (e) {
          // Send error if response isn't valid JSON
          console.log(JSON.stringify({
            jsonrpc: '2.0',
            id: request.id || null,
            error: {
              code: -32700,
              message: 'Parse error',
              data: e.message
            }
          }));
        }
      });
    });
    
    req.on('error', (e) => {
      // Send connection error
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: request.id || null,
        error: {
          code: -32603,
          message: 'Internal error',
          data: 'Connection failed: ' + e.message
        }
      }));
    });
    
    req.write(postData);
    req.end();
    
  } catch (e) {
    // Send parse error for invalid JSON input
    console.log(JSON.stringify({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: 'Parse error',
        data: 'Invalid JSON: ' + e.message
      }
    }));
  }
});

// Handle readline errors
rl.on('error', (err) => {
  console.error('Readline error:', err);
});