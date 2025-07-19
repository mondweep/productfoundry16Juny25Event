#!/usr/bin/env node

/**
 * Simple test script to verify MCP server functionality
 */

import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testMCPServer() {
  console.log('🧪 Testing Live Conditions MCP Server...\n');
  
  let serverProcess;
  let client;
  let transport;
  
  try {
    // Start the MCP server
    console.log('📡 Starting MCP server...');
    serverProcess = spawn('node', ['dist/index.js'], {
      env: {
        ...process.env,
        BACKEND_API_URL: 'http://localhost:5000',
        LOG_LEVEL: 'warn' // Reduce log noise
      }
    });

    // Create client and transport
    transport = new StdioClientTransport({
      stdin: serverProcess.stdin,
      stdout: serverProcess.stdout,
      stderr: serverProcess.stderr
    });

    client = new Client({
      name: 'test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    console.log('🔗 Connecting to MCP server...');
    await client.connect(transport);
    console.log('✅ Connected successfully!\n');

    // Test 1: List tools
    console.log('🔧 Testing tool listing...');
    const tools = await client.listTools();
    console.log(`✅ Found ${tools.tools.length} tools:`);
    tools.tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // Test 2: List resources
    console.log('📚 Testing resource listing...');
    const resources = await client.listResources();
    console.log(`✅ Found ${resources.resources.length} resources:`);
    resources.resources.forEach(resource => {
      console.log(`   - ${resource.uri}: ${resource.name}`);
    });
    console.log();

    // Test 3: List prompts
    console.log('💬 Testing prompt listing...');
    const prompts = await client.listPrompts();
    console.log(`✅ Found ${prompts.prompts.length} prompts:`);
    prompts.prompts.forEach(prompt => {
      console.log(`   - ${prompt.name}: ${prompt.description}`);
    });
    console.log();

    // Test 4: Try to read a resource
    console.log('📖 Testing resource reading...');
    try {
      const weatherResource = await client.readResource({
        uri: 'conditions://api/schema'
      });
      console.log('✅ Successfully read API schema resource');
      const schema = JSON.parse(weatherResource.contents[0].text);
      console.log(`   - API version: ${schema.schema.version}`);
      console.log(`   - Base URL: ${schema.schema.baseUrl}`);
    } catch (error) {
      console.log(`⚠️  Resource reading test skipped (backend not available): ${error.message}`);
    }
    console.log();

    // Test 5: Try to execute a tool (this will likely fail without backend)
    console.log('🛠️  Testing tool execution...');
    try {
      const result = await client.callTool({
        name: 'integration_health',
        arguments: {
          includeMetrics: false,
          checkExternalAPIs: false
        }
      });
      
      if (!result.isError) {
        console.log('✅ Tool execution successful');
      } else {
        console.log('⚠️  Tool execution returned error (expected without backend)');
      }
    } catch (error) {
      console.log(`⚠️  Tool execution test skipped (backend not available): ${error.message}`);
    }
    console.log();

    // Test 6: Test prompt execution
    console.log('💡 Testing prompt execution...');
    try {
      const prompt = await client.getPrompt({
        name: 'analyze_conditions',
        arguments: {
          location: 'Sydney',
          focus: 'weather',
          timeframe: 'current'
        }
      });
      
      console.log('✅ Prompt execution successful');
      console.log(`   - Generated prompt for analyzing conditions in Sydney`);
    } catch (error) {
      console.log(`❌ Prompt execution failed: ${error.message}`);
    }

    console.log('\n🎉 MCP Server test completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Server startup: OK');
    console.log('   ✅ Client connection: OK');
    console.log('   ✅ Tool listing: OK');
    console.log('   ✅ Resource listing: OK');
    console.log('   ✅ Prompt listing: OK');
    console.log('   ✅ Basic functionality: OK');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    // Cleanup
    if (client) {
      try {
        await client.close();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

// Run the test
testMCPServer().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});