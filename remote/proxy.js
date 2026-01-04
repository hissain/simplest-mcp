#!/usr/bin/env node

/**
 * Custom SSE <-> Stdio Proxy for Cloudflare Workers MCP
 * Usage: node proxy.js <sse-url>
 */

const sseUrl = process.argv[2];
if (!sseUrl) {
    console.error("Usage: node proxy.js <sse-url>");
    process.exit(1);
}

// Derive POST URL from SSE URL (replace /sse with /mcp)
const postUrl = sseUrl.replace(/\/sse$/, '/mcp');

// Stdio Setup
const stdin = process.stdin;
const stdout = process.stdout;

// Buffer for stdin
let buffer = '';

// Handle Stdio Input (Requests from IDE)
stdin.on('data', async (chunk) => {
    const data = chunk.toString();
    const lines = data.split('\n');

    for (const line of lines) {
        if (line.trim()) {
            try {
                // Forward to Remote Server via POST
                // console.error(`[Proxy] Forwarding: ${line}`);
                const response = await fetch(postUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: line
                });

                // If response has body (stateless mode), print it to stdout
                const text = await response.text();
                if (text && text.trim()) {
                    // console.error(`[Proxy] Response: ${text}`);
                    stdout.write(text + '\n');
                }
            } catch (err) {
                console.error(`[Proxy] Error forwarding request: ${err.message}`);
            }
        }
    }
});

// Handle SSE Output (Events from Remote)
async function connectSSE() {
    try {
        const response = await fetch(sseUrl, {
            headers: {
                'Accept': 'text/event-stream',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            sseBuffer += chunk;

            const events = sseBuffer.split('\n\n');
            sseBuffer = events.pop(); // Keep incomplete chunk

            for (const event of events) {
                const lines = event.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        // console.error(`[Proxy] Received SSE: ${data}`);
                        stdout.write(data + '\n');
                    }
                }
            }
        }
    } catch (err) {
        console.error(`[Proxy] SSE Error: ${err.message}`);
        setTimeout(connectSSE, 5000); // Retry
    }
}

connectSSE();
