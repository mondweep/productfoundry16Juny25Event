#!/usr/bin/env node

import { createServer } from 'net';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3003;

// Start a single MCP process that will handle all connections
const mcpProcess = spawn('node', [join(__dirname, 'dist', 'index.js')], {
  stdio: ['pipe', 'pipe', 'inherit']
});

console.log('Started MCP process');

// Store active connections
const clients = new Set();

// Buffer to accumulate JSON messages
let buffer = '';

mcpProcess.stdout.on('data', (data) => {
  buffer += data.toString();
  
  // Try to parse complete JSON messages
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // Keep incomplete line in buffer
  
  for (const line of lines) {
    if (line.trim()) {
      // Broadcast to all connected clients
      const message = line + '\n';
      for (const client of clients) {
        client.write(message);
      }
    }
  }
});

const server = createServer((socket) => {
  console.log('Client connected');
  clients.add(socket);

  // Send data from client to MCP process
  socket.on('data', (data) => {
    mcpProcess.stdin.write(data);
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
    clients.delete(socket);
  });

  socket.on('close', () => {
    console.log('Client disconnected');
    clients.delete(socket);
  });
});

server.listen(PORT, () => {
  console.log(`MCP TCP Server listening on port ${PORT}`);
  console.log('Ready for persistent connections...');
});

process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  mcpProcess.kill();
  server.close();
  process.exit();
});