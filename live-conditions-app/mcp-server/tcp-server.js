#!/usr/bin/env node

import { createServer } from 'net';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3003;

console.log(`Starting MCP TCP Server on port ${PORT}...`);

const server = createServer((socket) => {
  console.log('Client connected');

  // Spawn the MCP server in stdio mode
  const mcpProcess = spawn('node', [join(__dirname, 'dist', 'index.js')], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  // Pipe socket to MCP process stdin
  socket.pipe(mcpProcess.stdin);
  
  // Pipe MCP process stdout to socket
  mcpProcess.stdout.pipe(socket);

  socket.on('error', (err) => {
    console.error('Socket error:', err);
    mcpProcess.kill();
  });

  socket.on('close', () => {
    console.log('Client disconnected');
    mcpProcess.kill();
  });

  mcpProcess.on('exit', (code) => {
    console.log(`MCP process exited with code ${code}`);
    socket.end();
  });
});

server.listen(PORT, () => {
  console.log(`MCP TCP Server listening on port ${PORT}`);
  console.log('Ready for connections...');
});

process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close();
  process.exit();
});