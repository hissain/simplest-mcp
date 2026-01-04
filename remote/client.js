#!/usr/bin/env node

/**
 * Remote MCP Client
 * 
 * This client connects to the MCP server hosted on Cloudflare Workers
 * via HTTP/JSON-RPC transport.
 */

// Default to local worker dev server, or use provided URL
const SERVER_URL = process.argv[2] || 'http://localhost:8787';

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

// JSON-RPC request helper
async function rpcRequest(method, params = {}) {
    const response = await fetch(`${SERVER_URL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method,
            params
        })
    });

    const data = await response.json();
    if (data.error) {
        throw new Error(data.error.message);
    }
    return data.result;
}

async function main() {
    log(`\n🚀 Remote MCP Client Demo\n`, colors.bright + colors.green);
    log(`Connecting to: ${SERVER_URL}`, colors.yellow);

    try {
        // Check server health
        const healthResponse = await fetch(`${SERVER_URL}/`);
        const serverInfo = await healthResponse.json();
        log(`✓ Connected to: ${serverInfo.name} v${serverInfo.version}\n`, colors.green);

        // Initialize
        const initResult = await rpcRequest('initialize', {
            protocolVersion: '2024-11-05',
            clientInfo: { name: 'remote-mcp-client', version: '1.0.0' }
        });
        log(`Protocol: ${initResult.protocolVersion}`, colors.cyan);

        // List prompts
        section('Prompts');
        const prompts = await rpcRequest('prompts/list');
        prompts.prompts.forEach((p, i) => {
            log(`${i + 1}. ${p.name}: ${p.description}`, colors.blue);
        });

        // Get a prompt
        section('Testing Prompt');
        const prompt = await rpcRequest('prompts/get', {
            name: 'creative-writing',
            arguments: { topic: 'cloud computing', style: 'technical' }
        });
        log(prompt.messages[0].content.text, colors.cyan);

        // List tools
        section('Tools');
        const tools = await rpcRequest('tools/list');
        tools.tools.forEach((t, i) => {
            log(`${i + 1}. ${t.name}: ${t.description}`, colors.magenta);
        });

        // Call tools
        section('Testing Tools');

        const calc = await rpcRequest('tools/call', {
            name: 'calculate',
            arguments: { operation: 'multiply', a: 7, b: 8 }
        });
        log(`Calculate: ${calc.content[0].text}`, colors.green);

        const uuid = await rpcRequest('tools/call', {
            name: 'generate-uuid',
            arguments: {}
        });
        log(`UUID: ${uuid.content[0].text}`, colors.green);

        const weather = await rpcRequest('tools/call', {
            name: 'get-weather',
            arguments: { city: 'Dhaka' }
        });
        log(`Weather: ${weather.content[0].text}`, colors.green);

        // List resources
        section('Resources');
        const resources = await rpcRequest('resources/list');
        resources.resources.forEach((r, i) => {
            log(`${i + 1}. ${r.name} (${r.uri})`, colors.yellow);
        });

        // Read resources
        section('Testing Resources');

        const quote = await rpcRequest('resources/read', { uri: 'quotes://random' });
        const quoteData = JSON.parse(quote.contents[0].text);
        log(`Quote: "${quoteData.text}" - ${quoteData.author}`, colors.cyan);

        const fact = await rpcRequest('resources/read', { uri: 'facts://random' });
        const factData = JSON.parse(fact.contents[0].text);
        log(`Fact: [${factData.category}] ${factData.text}`, colors.cyan);

        section('Demo Complete!');
        log(`\nAll remote MCP features working correctly!\n`, colors.bright + colors.green);

    } catch (error) {
        log(`\nError: ${error.message}`, '\x1b[31m');
        log(`\nMake sure the server is running:`, colors.yellow);
        log(`  Local: npx wrangler dev`, colors.yellow);
        log(`  Or provide deployed URL: node client.js https://your-worker.workers.dev\n`, colors.yellow);
        process.exit(1);
    }
}

main();
