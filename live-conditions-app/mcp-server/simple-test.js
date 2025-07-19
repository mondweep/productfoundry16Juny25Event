#!/usr/bin/env node

/**
 * Simple test to verify MCP server can start
 */

import { spawn } from 'child_process';

async function testServerStart() {
  console.log('🧪 Testing MCP Server Startup...\n');
  
  return new Promise((resolve, reject) => {
    // Start the MCP server
    console.log('📡 Starting MCP server...');
    const serverProcess = spawn('node', ['dist/index.js'], {
      env: {
        ...process.env,
        BACKEND_API_URL: 'http://localhost:5000',
        LOG_LEVEL: 'info'
      }
    });

    let output = '';
    let errorOutput = '';
    
    // Capture stdout
    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log('📊 Server output:', data.toString().trim());
    });
    
    // Capture stderr
    serverProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.log('⚠️  Server stderr:', data.toString().trim());
    });
    
    // Handle server startup
    serverProcess.on('spawn', () => {
      console.log('✅ Server process spawned successfully');
      
      // Give it a moment to initialize
      setTimeout(() => {
        console.log('🔍 Checking if server is ready...');
        
        // Look for success indicators in output
        if (output.includes('started successfully') || 
            output.includes('ready to accept') ||
            errorOutput.includes('started successfully') || 
            errorOutput.includes('ready to accept')) {
          console.log('✅ Server started successfully!');
          console.log('📋 Startup validation: PASSED');
          
          // Kill the server
          serverProcess.kill('SIGTERM');
          resolve(true);
        } else {
          console.log('❌ Server startup validation failed');
          console.log('📊 Output captured:', output);
          console.log('⚠️  Error output:', errorOutput);
          
          serverProcess.kill('SIGTERM');
          reject(new Error('Server did not start properly'));
        }
      }, 3000); // Wait 3 seconds for startup
    });
    
    // Handle process errors
    serverProcess.on('error', (error) => {
      console.error('❌ Server process error:', error.message);
      reject(error);
    });
    
    // Handle unexpected exit
    serverProcess.on('exit', (code, signal) => {
      if (signal !== 'SIGTERM') {
        console.error(`❌ Server exited unexpectedly with code ${code}, signal ${signal}`);
        reject(new Error(`Server exited with code ${code}`));
      } else {
        console.log('✅ Server shutdown cleanly');
      }
    });
  });
}

// Run the test
testServerStart()
  .then(() => {
    console.log('\n🎉 MCP Server startup test completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Server executable: OK');
    console.log('   ✅ Server startup: OK');
    console.log('   ✅ Server initialization: OK');
    console.log('   ✅ Server shutdown: OK');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ MCP Server startup test failed:', error.message);
    process.exit(1);
  });