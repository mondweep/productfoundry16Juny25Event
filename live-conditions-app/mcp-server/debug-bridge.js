const readline = require('readline');
const http = require('http');
const fs = require('fs');

// Debug log file
const logFile = '/tmp/mcp-debug.log';

function log(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `${timestamp}: ${message}\n`);
}

log('Bridge started');

// Create readline interface for stdio
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Process each line from Claude Desktop
rl.on('line', (line) => {
  log(`Received: ${line}`);
  
  try {
    // Parse the incoming request
    const request = JSON.parse(line);
    log(`Parsed request: ${JSON.stringify(request)}`);
    
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
        log(`HTTP Response: ${data}`);
        try {
          // Parse and output the response
          const response = JSON.parse(data);
          const output = JSON.stringify(response);
          log(`Sending to Claude: ${output}`);
          console.log(output);
        } catch (e) {
          // Send error if response isn't valid JSON
          const error = {
            jsonrpc: '2.0',
            id: request.id || null,
            error: {
              code: -32700,
              message: 'Parse error',
              data: e.message
            }
          };
          log(`Parse error, sending: ${JSON.stringify(error)}`);
          console.log(JSON.stringify(error));
        }
      });
    });
    
    req.on('error', (e) => {
      // Send connection error
      const error = {
        jsonrpc: '2.0',
        id: request.id || null,
        error: {
          code: -32603,
          message: 'Internal error',
          data: 'Connection failed: ' + e.message
        }
      };
      log(`Connection error, sending: ${JSON.stringify(error)}`);
      console.log(JSON.stringify(error));
    });
    
    req.write(postData);
    req.end();
    
  } catch (e) {
    // Send parse error for invalid JSON input
    const error = {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: 'Parse error',
        data: 'Invalid JSON: ' + e.message
      }
    };
    log(`JSON parse error, sending: ${JSON.stringify(error)}`);
    console.log(JSON.stringify(error));
  }
});

// Handle readline errors
rl.on('error', (err) => {
  log(`Readline error: ${err}`);
});

// Log when the process exits
process.on('exit', (code) => {
  log(`Process exiting with code: ${code}`);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('Received SIGINT');
  process.exit(0);
});