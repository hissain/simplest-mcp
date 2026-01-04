# Simplest MCP Demo

A minimal, complete demonstration of the Model Context Protocol (MCP) featuring both server and client implementations with prompts, tools, and resources.

## 🎯 Overview

This project showcases the core capabilities of MCP:
- **Prompts**: Pre-defined templates for common tasks
- **Tools**: Callable functions that perform operations
- **Resources**: Accessible data sources

## ✨ Features

### 📝 Prompts (3)
- **creative-writing**: Generate creative writing prompts with customizable topics and styles
- **code-review**: Create code review prompts for different programming languages
- **explain-concept**: Generate explanations for technical concepts at various expertise levels

### 🔧 Tools (4)
- **calculate**: Perform basic arithmetic operations (add, subtract, multiply, divide)
- **generate-uuid**: Generate random UUIDs
- **get-weather**: Get simulated weather information for any city
- **reverse-string**: Reverse any text string

### 📚 Resources (4)
- **quotes://all**: Collection of programming and inspirational quotes
- **quotes://random**: Get a random quote
- **facts://all**: Collection of technology and programming facts
- **facts://random**: Get a random fact

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/hissain/simplest-mcp.git
cd simplest-mcp

# Install dependencies
npm install
```

### Running the Demo

```bash
# Run the automated test/demo
chmod +x test.sh
./test.sh

# Or run the client directly
node client.js

# Or run the server standalone (for use with other MCP clients)
node server.js
```

## 📖 Usage Examples

### Using the Client

The client automatically demonstrates all features:

```bash
node client.js
```

This will:
1. Connect to the MCP server
2. List all available prompts
3. Generate a sample prompt
4. List all available tools
5. Call each tool with example parameters
6. List all available resources
7. Read sample resources

### Using the Server with Other Clients

The server can be used with any MCP-compatible client:

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['server.js'],
});

const client = new Client({ name: 'my-client', version: '1.0.0' }, { capabilities: {} });
await client.connect(transport);

// List prompts
const prompts = await client.listPrompts();

// Get a prompt
const prompt = await client.getPrompt({
  name: 'creative-writing',
  arguments: { topic: 'AI', style: 'formal' }
});

// Call a tool
const result = await client.callTool({
  name: 'calculate',
  arguments: { operation: 'add', a: 10, b: 20 }
});

// Read a resource
const resource = await client.readResource({
  uri: 'quotes://random'
});
```

## 🏗️ Project Structure

```
simplest-mcp/
├── package.json          # Project configuration and dependencies
├── server.js            # MCP server implementation
├── client.js            # MCP client implementation
├── test.sh             # Automated test script
├── resources/          # Sample data
│   ├── quotes.json     # Programming quotes
│   └── facts.json      # Technology facts
├── README.md           # This file
└── LICENSE             # MIT License
```

## 🔌 API Reference

### Prompts

#### creative-writing
Generate creative writing prompts.

**Arguments:**
- `topic` (required): The topic to write about
- `style` (optional): Writing style (formal, casual, poetic)

#### code-review
Generate code review prompts.

**Arguments:**
- `language` (required): Programming language
- `code` (required): Code to review

#### explain-concept
Generate concept explanation prompts.

**Arguments:**
- `concept` (required): The concept to explain
- `level` (optional): Expertise level (beginner, intermediate, advanced)

### Tools

#### calculate
Perform arithmetic operations.

**Parameters:**
- `operation`: "add" | "subtract" | "multiply" | "divide"
- `a`: number
- `b`: number

**Returns:** Calculation result

#### generate-uuid
Generate a random UUID.

**Parameters:** None

**Returns:** UUID string

#### get-weather
Get simulated weather data.

**Parameters:**
- `city`: string

**Returns:** Weather information (simulated)

#### reverse-string
Reverse a text string.

**Parameters:**
- `text`: string

**Returns:** Reversed string

### Resources

#### quotes://all
Get all programming quotes.

**Returns:** JSON array of quote objects

#### quotes://random
Get a random quote.

**Returns:** Single quote object

#### facts://all
Get all technology facts.

**Returns:** JSON array of fact objects

#### facts://random
Get a random fact.

**Returns:** Single fact object

## 🧪 Testing

Run the automated test suite:

```bash
./test.sh
```

The test script will:
1. Check for Node.js installation
2. Install dependencies if needed
3. Run the client demo
4. Verify all features work correctly

## 🛠️ Development

### Adding New Prompts

Edit `server.js` and add to the `PROMPTS` object:

```javascript
const PROMPTS = {
  'my-prompt': {
    name: 'my-prompt',
    description: 'Description of my prompt',
    arguments: [
      {
        name: 'param1',
        description: 'Parameter description',
        required: true,
      },
    ],
  },
};
```

### Adding New Tools

Add to the tools list in `ListToolsRequestSchema` handler and implement in `CallToolRequestSchema` handler.

### Adding New Resources

Add resource files to the `resources/` directory and register them in the `ListResourcesRequestSchema` and `ReadResourceRequestSchema` handlers.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Md. Sazzad Hissain Khan**

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 🌟 Show Your Support

Give a ⭐️ if this project helped you understand MCP!

## 📚 Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [MCP SDK on npm](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [MCP Specification](https://spec.modelcontextprotocol.io)

## 🔗 Related Projects

- [MCP Servers](https://github.com/modelcontextprotocol/servers) - Official MCP server implementations
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - TypeScript SDK for MCP

---

Made with ❤️ by Md. Sazzad Hissain Khan
