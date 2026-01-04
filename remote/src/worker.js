/**
 * Simplest MCP Server - Cloudflare Workers Version
 * 
 * This is a remote MCP server that can be hosted on Cloudflare Workers.
 * It exposes the same prompts, tools, and resources as the local version,
 * but uses HTTP/SSE transport instead of stdio.
 */

// Sample data (inline for Workers)
const QUOTES = [
    { id: 1, text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { id: 2, text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { id: 3, text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
    { id: 4, text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
    { id: 5, text: "Experience is the name everyone gives to their mistakes.", author: "Oscar Wilde" },
    { id: 6, text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
    { id: 7, text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
    { id: 8, text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" }
];

const FACTS = [
    { id: 1, category: "technology", text: "The first computer bug was an actual bug - a moth trapped in a Harvard Mark II computer in 1947." },
    { id: 2, category: "technology", text: "The first 1GB hard drive, released in 1980, weighed over 500 pounds and cost $40,000." },
    { id: 3, category: "programming", text: "The first programming language was Fortran, developed by IBM in 1957." },
    { id: 4, category: "internet", text: "The first email was sent by Ray Tomlinson to himself in 1971." },
    { id: 5, category: "programming", text: "Python was named after Monty Python's Flying Circus, not the snake." },
    { id: 6, category: "technology", text: "The first computer mouse was made of wood and was invented by Doug Engelbart in 1964." },
    { id: 7, category: "internet", text: "The first website ever created is still online at info.cern.ch." },
    { id: 8, category: "programming", text: "JavaScript was created in just 10 days by Brendan Eich in 1995." }
];

// Define prompts
const PROMPTS = {
    'creative-writing': {
        name: 'creative-writing',
        description: 'A prompt template for creative writing assistance',
        arguments: [
            { name: 'topic', description: 'The topic to write about', required: true },
            { name: 'style', description: 'Writing style (e.g., formal, casual, poetic)', required: false }
        ]
    },
    'code-review': {
        name: 'code-review',
        description: 'A prompt template for code review assistance',
        arguments: [
            { name: 'language', description: 'Programming language', required: true },
            { name: 'code', description: 'Code to review', required: true }
        ]
    },
    'explain-concept': {
        name: 'explain-concept',
        description: 'A prompt template for explaining technical concepts',
        arguments: [
            { name: 'concept', description: 'The concept to explain', required: true },
            { name: 'level', description: 'Expertise level (beginner, intermediate, advanced)', required: false }
        ]
    }
};

// Define tools
const TOOLS = [
    {
        name: 'calculate',
        description: 'Perform basic arithmetic calculations',
        inputSchema: {
            type: 'object',
            properties: {
                operation: { type: 'string', description: 'The operation: add, subtract, multiply, divide', enum: ['add', 'subtract', 'multiply', 'divide'] },
                a: { type: 'number', description: 'First number' },
                b: { type: 'number', description: 'Second number' }
            },
            required: ['operation', 'a', 'b']
        }
    },
    {
        name: 'generate-uuid',
        description: 'Generate a random UUID',
        inputSchema: { type: 'object', properties: {} }
    },
    {
        name: 'get-weather',
        description: 'Get simulated weather information for a city',
        inputSchema: {
            type: 'object',
            properties: { city: { type: 'string', description: 'City name' } },
            required: ['city']
        }
    },
    {
        name: 'reverse-string',
        description: 'Reverse a given string',
        inputSchema: {
            type: 'object',
            properties: { text: { type: 'string', description: 'Text to reverse' } },
            required: ['text']
        }
    }
];

// Define resources
const RESOURCES = [
    { uri: 'quotes://all', name: 'Programming Quotes', description: 'Collection of inspirational programming quotes', mimeType: 'application/json' },
    { uri: 'facts://all', name: 'Technology Facts', description: 'Interesting facts about technology and programming', mimeType: 'application/json' },
    { uri: 'quotes://random', name: 'Random Quote', description: 'Get a random programming quote', mimeType: 'application/json' },
    { uri: 'facts://random', name: 'Random Fact', description: 'Get a random technology fact', mimeType: 'application/json' }
];

// JSON-RPC response helper
function jsonRpcResponse(id, result) {
    return { jsonrpc: '2.0', id, result };
}

function jsonRpcError(id, code, message) {
    return { jsonrpc: '2.0', id, error: { code, message } };
}

// Handle MCP requests
function handleRequest(method, params, id) {
    switch (method) {
        case 'initialize':
            return jsonRpcResponse(id, {
                protocolVersion: '2024-11-05',
                capabilities: { prompts: {}, resources: {}, tools: {} },
                serverInfo: { name: 'simplest-mcp-server', version: '1.0.0' }
            });

        case 'prompts/list':
            return jsonRpcResponse(id, { prompts: Object.values(PROMPTS) });

        case 'prompts/get': {
            const promptName = params.name;
            const prompt = PROMPTS[promptName];
            if (!prompt) return jsonRpcError(id, -32602, `Prompt not found: ${promptName}`);

            const args = params.arguments || {};
            let messages = [];

            if (promptName === 'creative-writing') {
                messages = [{ role: 'user', content: { type: 'text', text: `Write a creative piece about "${args.topic || 'general'}" in a ${args.style || 'casual'} style.` } }];
            } else if (promptName === 'code-review') {
                messages = [{ role: 'user', content: { type: 'text', text: `Review this ${args.language || 'code'}:\n\n${args.code || '// No code'}` } }];
            } else if (promptName === 'explain-concept') {
                messages = [{ role: 'user', content: { type: 'text', text: `Explain "${args.concept || 'programming'}" for ${args.level || 'beginner'} level.` } }];
            }
            return jsonRpcResponse(id, { messages });
        }

        case 'tools/list':
            return jsonRpcResponse(id, { tools: TOOLS });

        case 'tools/call': {
            const { name, arguments: args } = params;
            let content;

            try {
                if (name === 'calculate') {
                    const { operation, a, b } = args;
                    let result;
                    if (operation === 'add') result = a + b;
                    else if (operation === 'subtract') result = a - b;
                    else if (operation === 'multiply') result = a * b;
                    else if (operation === 'divide') {
                        if (b === 0) throw new Error('Division by zero');
                        result = a / b;
                    }
                    content = [{ type: 'text', text: `Result: ${a} ${operation} ${b} = ${result}` }];
                } else if (name === 'generate-uuid') {
                    content = [{ type: 'text', text: `Generated UUID: ${crypto.randomUUID()}` }];
                } else if (name === 'get-weather') {
                    const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy', 'Windy'];
                    const condition = conditions[Math.floor(Math.random() * conditions.length)];
                    const temp = Math.floor(Math.random() * 30) + 10;
                    content = [{ type: 'text', text: `Weather in ${args.city}: ${condition}, ${temp}°C (simulated)` }];
                } else if (name === 'reverse-string') {
                    const reversed = args.text.split('').reverse().join('');
                    content = [{ type: 'text', text: `Original: ${args.text}\nReversed: ${reversed}` }];
                } else {
                    throw new Error(`Unknown tool: ${name}`);
                }
                return jsonRpcResponse(id, { content });
            } catch (e) {
                return jsonRpcResponse(id, { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true });
            }
        }

        case 'resources/list':
            return jsonRpcResponse(id, { resources: RESOURCES });

        case 'resources/read': {
            const uri = params.uri;
            let data;

            if (uri === 'quotes://all') data = { quotes: QUOTES };
            else if (uri === 'quotes://random') data = QUOTES[Math.floor(Math.random() * QUOTES.length)];
            else if (uri === 'facts://all') data = { facts: FACTS };
            else if (uri === 'facts://random') data = FACTS[Math.floor(Math.random() * FACTS.length)];
            else return jsonRpcError(id, -32602, `Resource not found: ${uri}`);

            return jsonRpcResponse(id, { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] });
        }

        case 'notifications/initialized':
            return null; // Do not reply to notifications
        case 'ping':
            return jsonRpcResponse(id, {});

        default:
            return jsonRpcError(id, -32601, `Method not found: ${method}`);
    }
}

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Health check / info endpoint
        if (url.pathname === '/' || url.pathname === '/health') {
            return new Response(JSON.stringify({
                name: 'simplest-mcp-server',
                version: '1.0.0',
                description: 'MCP server with prompts, tools, and resources',
                endpoints: {
                    '/mcp': 'POST - JSON-RPC endpoint for MCP requests',
                    '/sse': 'GET - Server-Sent Events endpoint for streaming'
                }
            }, null, 2), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // MCP JSON-RPC endpoint
        if (url.pathname === '/mcp' && request.method === 'POST') {
            try {
                const body = await request.json();

                // Handle batch requests
                if (Array.isArray(body)) {
                    const results = body.map(req => handleRequest(req.method, req.params || {}, req.id));
                    return new Response(JSON.stringify(results), {
                        headers: { 'Content-Type': 'application/json', ...corsHeaders }
                    });
                }

                // Single request
                const result = handleRequest(body.method, body.params || {}, body.id);
                if (result === null) {
                    // JSON-RPC Notifications should not have a response
                    return new Response(null, { status: 204, headers: corsHeaders });
                }
                return new Response(JSON.stringify(result), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            } catch (e) {
                return new Response(JSON.stringify(jsonRpcError(null, -32700, 'Parse error')), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }
        }

        // SSE endpoint for real-time streaming
        if (url.pathname === '/sse' && request.method === 'GET') {
            const encoder = new TextEncoder();

            const stream = new ReadableStream({
                start(controller) {
                    // Send endpoint event (Required by MCP HTTP Spec)
                    // This tells the client where to send POST requests
                    const sessionId = crypto.randomUUID();
                    const urlObj = new URL(request.url);
                    const endpointUrl = `${urlObj.origin}/mcp?sessionId=${sessionId}`;
                    controller.enqueue(encoder.encode(`event: endpoint\ndata: ${endpointUrl}\n\n`));

                    // Keep connection alive with periodic comments
                    const keepAliveInterval = setInterval(() => {
                        try {
                            controller.enqueue(encoder.encode(`: keepalive\n\n`));
                        } catch (e) {
                            clearInterval(keepAliveInterval);
                        }
                    }, 15000);

                    // Clean up interval when stream is cancelled
                    request.signal.addEventListener('abort', () => {
                        clearInterval(keepAliveInterval);
                    });
                },
                cancel() {
                    // Cleanup handled in abort listener, but good practice to have here too
                }
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    ...corsHeaders
                }
            });
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });
    }
};
