#!/usr/bin/env node

/**
 * Custom SSE <-> Stdio Proxy for Cloudflare Workers MCP
 * Usage: node proxy.js <sse-url>
 */


// Debugging disabled for production
function log(msg) {
    // console.error(`[Proxy] ${msg}`); // Uncomment for stderr logging
}

log("Proxy started");

const sseUrl = process.argv[2];
if (!sseUrl) {
    log("Error: No SSE URL provided");
    console.error("Usage: node proxy.js <sse-url>");
    process.exit(1);
}

// Derive POST URL from SSE URL (replace /sse with /mcp)
// Initial guess, will be updated by endpoint event
let postUrl = sseUrl.replace(/\/sse$/, '/mcp');
log(`SSE URL: ${sseUrl}`);
log(`POST URL: ${postUrl}`);

// Stdio Setup
const stdin = process.stdin;
const stdout = process.stdout;

// Buffer for stdin
let inputBuffer = '';

// Handle Stdio Input (Requests from IDE)
stdin.on('data', async (chunk) => {
    log(`Received chunk (${chunk.length} bytes): ${JSON.stringify(chunk.toString())}`);
    inputBuffer += chunk.toString();

    let newlineIndex;
    while ((newlineIndex = inputBuffer.indexOf('\n')) !== -1) {
        const line = inputBuffer.slice(0, newlineIndex);
        inputBuffer = inputBuffer.slice(newlineIndex + 1);

        if (line.trim()) {
            try {
                log(`Forwarding line to ${postUrl}: ${line}`);
                // Forward to Remote Server via POST
                const response = await fetch(postUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: line
                });

                log(`Response status: ${response.status}`);

                // If response has body (stateless mode), print it to stdout
                const text = await response.text();
                log(`Response body: ${text}`);
                if (text && text.trim()) {
                    stdout.write(text + '\n');
                }
            } catch (err) {
                log(`Error forwarding: ${err.message}`);
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
                let isEndpointEvent = false;

                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        const eventName = line.slice(7).trim();
                        if (eventName === 'endpoint') {
                            isEndpointEvent = true;
                        }
                    } else if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6);

                        if (isEndpointEvent) {
                            try {
                                log(`Received endpoint event: ${dataStr}`);
                                // Handle absolute or relative URL
                                if (dataStr.startsWith('http')) {
                                    postUrl = dataStr;
                                } else if (dataStr.startsWith('/')) {
                                    const baseUrl = new URL(sseUrl).origin;
                                    postUrl = baseUrl + dataStr;
                                } else {
                                    postUrl = dataStr;
                                }
                                log(`Updated dynamic POST URL: ${postUrl}`);
                                isEndpointEvent = false;
                                continue; // Don't print to stdout
                            } catch (e) { log(`Error parsing endpoint: ${e}`); }
                        }

                        try {
                            const msg = JSON.parse(dataStr);
                            // Filter early notifications if they might confuse the IDE,
                            // or pass them if we are confident.
                            if (msg.method === 'connection/ready' || msg.method === 'server/capabilities') {
                                log(`Ignored notification: ${msg.method}`);
                                continue;
                            }
                        } catch (e) {
                            // ignore parse errors
                        }

                        stdout.write(dataStr + '\n');
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
