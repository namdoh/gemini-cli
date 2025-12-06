# Gemini CLI Web UI

A web-based chat interface for Gemini AI, providing a browser-based alternative
to the terminal CLI.

## Features

- 💬 Real-time chat with Gemini AI
- 🌊 Streaming responses
- 🎨 Dark theme UI matching terminal aesthetics
- 🔒 Server-side authentication

## Setup

### 1. Install Dependencies

```bash
cd packages/web-ui
npm install

cd frontend
npm install
```

### 2. Set Environment Variable

```bash
export GEMINI_API_KEY="your-api-key-here"
```

### 3. Build

```bash
# Build backend
npm run build

# Build frontend
cd frontend
npm run build
```

### 4. Run

```bash
npm run start
```

The server will start on:

- **HTTP**: http://localhost:3000
- **WebSocket**: ws://localhost:8080

## Development

For development with auto-rebuild:

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

## Architecture

```
Browser (React)
    ↓ WebSocket (port 8080)
Express Server
    ↓
@google/genai SDK
    ↓
Gemini API
```

## Environment Variables

| Variable         | Required | Description                      |
| ---------------- | -------- | -------------------------------- |
| `GEMINI_API_KEY` | Yes      | Your Gemini API key              |
| `PORT`           | No       | HTTP server port (default: 3000) |
| `WS_PORT`        | No       | WebSocket port (default: 8080)   |

## Usage

1. Open http://localhost:3000 in your browser
2. Type your message in the input box
3. Press Enter or click Send
4. Watch the AI response stream in real-time

## Keyboard Shortcuts

- **Enter**: Send message
- **Shift+Enter**: New line in input

## Limitations

This simplified version provides basic chat functionality. It does not include:

- Tool execution
- MCP server integration
- File uploads
- Multi-turn context management beyond basic chat history

For full CLI features, use the terminal version.

## Troubleshooting

**"GEMINI_API_KEY environment variable is required"**

- Make sure you've exported the API key before starting the server

**WebSocket connection failed**

- Check that port 8080 is not in use
- Verify firewall settings

**Frontend not loading**

- Ensure you've built the frontend: `cd frontend && npm run build`
- Check that `frontend/dist` directory exists
