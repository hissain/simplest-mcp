# Simplest MCP Demo

A minimal, complete demonstration of the Model Context Protocol (MCP) featuring both server and client implementations with prompts, tools, and resources.

## Overview

This project showcases the core capabilities of MCP:
- **Prompts**: Pre-defined templates for common tasks
- **Tools**: Callable functions that perform operations
- **Resources**: Accessible data sources

## ✨ Features

- **Dual Mode**: 
  - 🖥️ **Local**: `stdio` transport using Node.js
  - ☁️ **Remote**: `HTTP/SSE` transport using Cloudflare Workers
- **3 Prompts**: Creative writing, Code review, Concept explanation
- **4 Tools**: Calculator, UUID generator, Weather simulator, String reverser
- **4 Resources**: Programming quotes, Tech facts
- **Zero Dependencies** (except MCP SDK)



## IDE & Agent Integration

### Claude Desktop

To use this server with Claude Desktop, edit your configuration file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**For Local Server:**
```json
{
  "mcpServers": {
    "simplest-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/simplest-mcp/server.js"]
    }
  }
}
```

**For Remote Server (SSE):**
```json
{
    "simplest-mcp-remote": {
      "command": "node",
      "args": [
        "/absolute/path/to/simplest-mcp/remote/proxy.js",
        "https://simplest-mcp.your-subdomain.workers.dev/sse"
      ]
    }
}
```

### VS Code (Cline)

1. Create a `.vscode/mcp.json` file in your project:

```json
{
  "mcpServers": {
    "simplest-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/simplest-mcp/server.js"]
    }
  }
}
```

2. Or configure via settings for remote:
   - Command: `MCP: Add Server`
   - Name: `simplest-mcp-remote`
   - Type: `sse`
   - URL: `https://simplest-mcp.your-subdomain.workers.dev/sse`



### Using the Client (Local)

The local client demonstrates all features using stdio transport:

```bash
npm run client:local
```

### Using the Remote Client

Test the Cloudflare Workers deployment:

```bash
npm run client:remote -- https://your-worker.workers.dev
```

### Using with Other Clients (SDK)

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Local Connection
const transport = new StdioClientTransport({
  command: 'node',
  args: ['local/server.js'],
});

const client = new Client({ name: 'my-client', version: '1.0.0' }, { capabilities: {} });
await client.connect(transport);
```

## 🏗️ Project Structure

```
simplest-mcp/
├── local/               # Local MCP server implementation
│   ├── server.js        # stdio transport server
│   ├── client.js        # Local client demo
│   └── test.sh          # Test script
├── remote/              # Cloudflare Workers implementation
│   ├── src/
│   │   └── worker.js    # HTTP/SSE transport server
│   ├── wrangler.toml    # Workers configuration
│   └── client.js        # Remote client demo
├── resources/           # Shared sample data
│   ├── quotes.json
│   └── facts.json
├── package.json         # Project configuration
└── README.md            # Documentation
```

## 🚀 Quick Start

### Installation

```bash
git clone https://github.com/hissain/simplest-mcp.git
cd simplest-mcp
npm install
```

### Local Development (stdio)

```bash
# Run local demo
npm run client:local

# Or manually
node local/client.js
```

### Remote Hosting (Cloudflare Workers)

**Deploy:**
```bash
npm install -g wrangler
wrangler login
npm run deploy
```

**Test Remote:**
```bash
# Local dev server
npm run start:remote

# Remote client test
npm run client:remote -- http://localhost:8787
```

## IDE Integration

### Claude Desktop

**Local:**
```json
{
  "mcpServers": {
    "simplest-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/simplest-mcp/local/server.js"]
    }
  }
}
```

**Remote:**
```json
{
    "simplest-mcp-remote": {
      "command": "node",
      "args": [
        "/absolute/path/to/simplest-mcp/remote/proxy.js",
        "https://your-worker.workers.dev/sse"
      ]
    }
}
```

### VS Code (Cline)

**Local:** `.vscode/mcp.json`
```json
{
  "mcpServers": {
    "simplest-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/simplest-mcp/local/server.js"]
    }
  }
}
```

**Remote:** Configure via settings → MCP: Add Server → Type: `sse`

### Google Antigravity IDE

**Local:**
```json
{
  "mcpServers": {
    "simplest-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/simplest-mcp/local/server.js"]
    }
  }
}
```

**Remote:**
```json
{
  "mcpServers": {
    "simplest-mcp-remote": {
      "command": "node",
      "args": [
        "/absolute/path/to/simplest-mcp/remote/proxy.js",
        "https://your-worker.workers.dev/sse"
      ]
    }
  }
}
```

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

## Testing

Run the automated test suite:

```bash
./test.sh
```

The test script will:
1. Check for Node.js installation
2. Install dependencies if needed
3. Run the client demo
4. Verify all features work correctly

## Development

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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Md. Sazzad Hissain Khan**

## Contributing

Contributions, issues, and feature requests are welcome!

## Show Your Support

Give a star if this project helped you understand MCP!

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [MCP SDK on npm](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [MCP Specification](https://spec.modelcontextprotocol.io)

## Related Projects

- [MCP Servers](https://github.com/modelcontextprotocol/servers) - Official MCP server implementations
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - TypeScript SDK for MCP

---

Made with care by Md. Sazzad Hissain Khan
