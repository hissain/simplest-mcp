#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create MCP server instance
const server = new Server(
    {
        name: 'simplest-mcp-server',
        version: '1.0.0',
    },
    {
        capabilities: {
            prompts: {},
            resources: {},
            tools: {},
        },
    }
);

// Define prompts
const PROMPTS = {
    'creative-writing': {
        name: 'creative-writing',
        description: 'A prompt template for creative writing assistance',
        arguments: [
            {
                name: 'topic',
                description: 'The topic to write about',
                required: true,
            },
            {
                name: 'style',
                description: 'Writing style (e.g., formal, casual, poetic)',
                required: false,
            },
        ],
    },
    'code-review': {
        name: 'code-review',
        description: 'A prompt template for code review assistance',
        arguments: [
            {
                name: 'language',
                description: 'Programming language',
                required: true,
            },
            {
                name: 'code',
                description: 'Code to review',
                required: true,
            },
        ],
    },
    'explain-concept': {
        name: 'explain-concept',
        description: 'A prompt template for explaining technical concepts',
        arguments: [
            {
                name: 'concept',
                description: 'The concept to explain',
                required: true,
            },
            {
                name: 'level',
                description: 'Expertise level (beginner, intermediate, advanced)',
                required: false,
            },
        ],
    },
};

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
        prompts: Object.values(PROMPTS),
    };
});

// Get specific prompt
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const promptName = request.params.name;
    const prompt = PROMPTS[promptName];

    if (!prompt) {
        throw new Error(`Prompt not found: ${promptName}`);
    }

    const args = request.params.arguments || {};

    let messages = [];

    if (promptName === 'creative-writing') {
        const topic = args.topic || 'general';
        const style = args.style || 'casual';
        messages = [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: `Write a creative piece about "${topic}" in a ${style} style. Be imaginative and engaging.`,
                },
            },
        ];
    } else if (promptName === 'code-review') {
        const language = args.language || 'JavaScript';
        const code = args.code || '// No code provided';
        messages = [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: `Please review this ${language} code:\n\n${code}\n\nProvide feedback on:\n1. Code quality\n2. Best practices\n3. Potential bugs\n4. Suggestions for improvement`,
                },
            },
        ];
    } else if (promptName === 'explain-concept') {
        const concept = args.concept || 'programming';
        const level = args.level || 'beginner';
        messages = [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: `Explain the concept of "${concept}" for a ${level} level audience. Use clear examples and analogies.`,
                },
            },
        ];
    }

    return {
        messages,
    };
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'calculate',
                description: 'Perform basic arithmetic calculations',
                inputSchema: {
                    type: 'object',
                    properties: {
                        operation: {
                            type: 'string',
                            description: 'The operation to perform: add, subtract, multiply, divide',
                            enum: ['add', 'subtract', 'multiply', 'divide'],
                        },
                        a: {
                            type: 'number',
                            description: 'First number',
                        },
                        b: {
                            type: 'number',
                            description: 'Second number',
                        },
                    },
                    required: ['operation', 'a', 'b'],
                },
            },
            {
                name: 'generate-uuid',
                description: 'Generate a random UUID',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'get-weather',
                description: 'Get simulated weather information for a city',
                inputSchema: {
                    type: 'object',
                    properties: {
                        city: {
                            type: 'string',
                            description: 'City name',
                        },
                    },
                    required: ['city'],
                },
            },
            {
                name: 'reverse-string',
                description: 'Reverse a given string',
                inputSchema: {
                    type: 'object',
                    properties: {
                        text: {
                            type: 'string',
                            description: 'Text to reverse',
                        },
                    },
                    required: ['text'],
                },
            },
        ],
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === 'calculate') {
            const { operation, a, b } = args;
            let result;

            switch (operation) {
                case 'add':
                    result = a + b;
                    break;
                case 'subtract':
                    result = a - b;
                    break;
                case 'multiply':
                    result = a * b;
                    break;
                case 'divide':
                    if (b === 0) {
                        throw new Error('Division by zero');
                    }
                    result = a / b;
                    break;
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: `Result: ${a} ${operation} ${b} = ${result}`,
                    },
                ],
            };
        } else if (name === 'generate-uuid') {
            const uuid = randomUUID();
            return {
                content: [
                    {
                        type: 'text',
                        text: `Generated UUID: ${uuid}`,
                    },
                ],
            };
        } else if (name === 'get-weather') {
            const { city } = args;
            // Simulated weather data
            const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy', 'Windy'];
            const condition = conditions[Math.floor(Math.random() * conditions.length)];
            const temperature = Math.floor(Math.random() * 30) + 10; // 10-40°C

            return {
                content: [
                    {
                        type: 'text',
                        text: `Weather in ${city}:\nCondition: ${condition}\nTemperature: ${temperature}°C\n(Note: This is simulated data)`,
                    },
                ],
            };
        } else if (name === 'reverse-string') {
            const { text } = args;
            const reversed = text.split('').reverse().join('');
            return {
                content: [
                    {
                        type: 'text',
                        text: `Original: ${text}\nReversed: ${reversed}`,
                    },
                ],
            };
        } else {
            throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: 'quotes://all',
                name: 'Programming Quotes',
                description: 'Collection of inspirational programming quotes',
                mimeType: 'application/json',
            },
            {
                uri: 'facts://all',
                name: 'Technology Facts',
                description: 'Interesting facts about technology and programming',
                mimeType: 'application/json',
            },
            {
                uri: 'quotes://random',
                name: 'Random Quote',
                description: 'Get a random programming quote',
                mimeType: 'application/json',
            },
            {
                uri: 'facts://random',
                name: 'Random Fact',
                description: 'Get a random technology fact',
                mimeType: 'application/json',
            },
        ],
    };
});

// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    try {
        if (uri.startsWith('quotes://')) {
            const quotesPath = join(__dirname, '..', 'resources', 'quotes.json');
            const quotesData = JSON.parse(await readFile(quotesPath, 'utf-8'));

            if (uri === 'quotes://all') {
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(quotesData, null, 2),
                        },
                    ],
                };
            } else if (uri === 'quotes://random') {
                const randomQuote =
                    quotesData.quotes[Math.floor(Math.random() * quotesData.quotes.length)];
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(randomQuote, null, 2),
                        },
                    ],
                };
            }
        } else if (uri.startsWith('facts://')) {
            const factsPath = join(__dirname, '..', 'resources', 'facts.json');
            const factsData = JSON.parse(await readFile(factsPath, 'utf-8'));

            if (uri === 'facts://all') {
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(factsData, null, 2),
                        },
                    ],
                };
            } else if (uri === 'facts://random') {
                const randomFact =
                    factsData.facts[Math.floor(Math.random() * factsData.facts.length)];
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(randomFact, null, 2),
                        },
                    ],
                };
            }
        }

        throw new Error(`Resource not found: ${uri}`);
    } catch (error) {
        throw new Error(`Failed to read resource: ${error.message}`);
    }
});

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Simplest MCP Server running on stdio');
}

main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
