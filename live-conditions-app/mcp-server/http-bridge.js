#!/usr/bin/env node

import express from 'express';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3003;

app.use(express.json());
app.use(express.text());

// Handle JSON-RPC requests
app.post('/', async (req, res) => {
  console.log('Received request:', req.body);
  
  const mcpProcess = spawn('node', [join(__dirname, 'dist', 'index.js')], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseData = '';
  let errorData = '';

  mcpProcess.stdout.on('data', (data) => {
    responseData += data.toString();
  });

  mcpProcess.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  mcpProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('MCP process error:', errorData);
      res.status(500).json({ error: 'MCP process failed', details: errorData });
      return;
    }

    // Find the JSON response in the output
    const lines = responseData.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('{')) {
        try {
          const json = JSON.parse(line);
          res.json(json);
          return;
        } catch (e) {
          // Continue looking for valid JSON
        }
      }
    }

    res.status(500).json({ error: 'No valid JSON response found' });
  });

  // Send the request
  const requestStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  mcpProcess.stdin.write(requestStr + '\n');
  mcpProcess.stdin.end();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'MCP HTTP Bridge' });
});

app.listen(PORT, () => {
  console.log(`MCP HTTP Bridge listening on port ${PORT}`);
  console.log('Test with: curl -X POST http://localhost:3003 -H "Content-Type: application/json" -d \'{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}\'');
});