#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

// ANSI color codes for better output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function section(title) {
    console.log('\n' + '='.repeat(60));
    log(title, colors.bright + colors.cyan);
    console.log('='.repeat(60));
}

async function main() {
    log('\n🚀 Starting MCP Client Demo\n', colors.bright + colors.green);

    // Create client instance
    const client = new Client(
        {
            name: 'simplest-mcp-client',
            version: '1.0.0',
        },
        {
            capabilities: {},
        }
    );

    // Start the server process
    const serverProcess = spawn('node', ['server.js'], {
        stdio: ['pipe', 'pipe', 'inherit'],
    });

    // Create transport
    const transport = new StdioClientTransport({
        command: 'node',
        args: ['server.js'],
    });

    try {
        // Connect to server
        log('Connecting to MCP server...', colors.yellow);
        await client.connect(transport);
        log('✓ Connected successfully!\n', colors.green);

        // ==================== LIST PROMPTS ====================
        section('📝 Available Prompts');
        const prompts = await client.listPrompts();
        prompts.prompts.forEach((prompt, index) => {
            log(`\n${index + 1}. ${prompt.name}`, colors.bright + colors.blue);
            log(`   Description: ${prompt.description}`, colors.blue);
            if (prompt.arguments && prompt.arguments.length > 0) {
                log('   Arguments:', colors.blue);
                prompt.arguments.forEach((arg) => {
                    const required = arg.required ? '(required)' : '(optional)';
                    log(`     - ${arg.name} ${required}: ${arg.description}`, colors.blue);
                });
            }
        });

        // ==================== GET A PROMPT ====================
        section('🎯 Testing Prompt: creative-writing');
        const promptResult = await client.getPrompt({
            name: 'creative-writing',
            arguments: {
                topic: 'artificial intelligence',
                style: 'poetic',
            },
        });
        log('Prompt generated:', colors.yellow);
        promptResult.messages.forEach((msg) => {
            log(`  ${msg.content.text}`, colors.cyan);
        });

        // ==================== LIST TOOLS ====================
        section('🔧 Available Tools');
        const tools = await client.listTools();
        tools.tools.forEach((tool, index) => {
            log(`\n${index + 1}. ${tool.name}`, colors.bright + colors.magenta);
            log(`   Description: ${tool.description}`, colors.magenta);
            if (tool.inputSchema && tool.inputSchema.properties) {
                log('   Parameters:', colors.magenta);
                Object.entries(tool.inputSchema.properties).forEach(([key, value]) => {
                    const required = tool.inputSchema.required?.includes(key) ? '(required)' : '(optional)';
                    log(`     - ${key} ${required}: ${value.description}`, colors.magenta);
                });
            }
        });

        // ==================== CALL TOOLS ====================
        section('⚡ Testing Tools');

        // Test calculate tool
        log('\n1. Testing calculate tool (add):', colors.yellow);
        const calcResult = await client.callTool({
            name: 'calculate',
            arguments: {
                operation: 'add',
                a: 42,
                b: 58,
            },
        });
        log(`   ${calcResult.content[0].text}`, colors.green);

        // Test generate-uuid tool
        log('\n2. Testing generate-uuid tool:', colors.yellow);
        const uuidResult = await client.callTool({
            name: 'generate-uuid',
            arguments: {},
        });
        log(`   ${uuidResult.content[0].text}`, colors.green);

        // Test get-weather tool
        log('\n3. Testing get-weather tool:', colors.yellow);
        const weatherResult = await client.callTool({
            name: 'get-weather',
            arguments: {
                city: 'Dhaka',
            },
        });
        log(`   ${weatherResult.content[0].text}`, colors.green);

        // Test reverse-string tool
        log('\n4. Testing reverse-string tool:', colors.yellow);
        const reverseResult = await client.callTool({
            name: 'reverse-string',
            arguments: {
                text: 'Hello MCP!',
            },
        });
        log(`   ${reverseResult.content[0].text}`, colors.green);

        // ==================== LIST RESOURCES ====================
        section('📚 Available Resources');
        const resources = await client.listResources();
        resources.resources.forEach((resource, index) => {
            log(`\n${index + 1}. ${resource.name}`, colors.bright + colors.yellow);
            log(`   URI: ${resource.uri}`, colors.yellow);
            log(`   Description: ${resource.description}`, colors.yellow);
            log(`   MIME Type: ${resource.mimeType}`, colors.yellow);
        });

        // ==================== READ RESOURCES ====================
        section('📖 Testing Resources');

        // Read random quote
        log('\n1. Reading random quote:', colors.yellow);
        const quoteResource = await client.readResource({
            uri: 'quotes://random',
        });
        const quote = JSON.parse(quoteResource.contents[0].text);
        log(`   "${quote.text}"`, colors.cyan);
        log(`   - ${quote.author}`, colors.cyan);

        // Read random fact
        log('\n2. Reading random fact:', colors.yellow);
        const factResource = await client.readResource({
            uri: 'facts://random',
        });
        const fact = JSON.parse(factResource.contents[0].text);
        log(`   [${fact.category.toUpperCase()}] ${fact.text}`, colors.cyan);

        // ==================== SUMMARY ====================
        section('✅ Demo Complete!');
        log('\nSuccessfully demonstrated:', colors.green);
        log(`  ✓ ${prompts.prompts.length} prompts`, colors.green);
        log(`  ✓ ${tools.tools.length} tools`, colors.green);
        log(`  ✓ ${resources.resources.length} resources`, colors.green);
        log('\nAll MCP features are working correctly! 🎉\n', colors.bright + colors.green);

    } catch (error) {
        log(`\n❌ Error: ${error.message}`, colors.bright + '\x1b[31m');
        console.error(error);
        process.exit(1);
    } finally {
        // Close the connection
        await client.close();
        serverProcess.kill();
    }
}

main();
