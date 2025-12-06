/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SessionManager } from './session-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env['PORT'] || 3000;
const WS_PORT = Number(process.env['WS_PORT'] || 8080);

// Serve static frontend files
const frontendPath = join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`HTTP server running on http://localhost:${PORT}`);
  console.log(`Serving frontend from: ${frontendPath}`);
});

// Create WebSocket server
const wss = new WebSocketServer({ port: WS_PORT });
const sessionManager = new SessionManager();

console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);

wss.on('connection', async (ws) => {
  console.log('New WebSocket connection');

  // Create a session for this connection
  const sessionId = Math.random().toString(36).substring(7);

  try {
    const session = await sessionManager.createSession(sessionId);
    console.log(`Created session: ${sessionId}`);

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: 'connected',
        sessionId,
      }),
    );

    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'prompt') {
          const { prompt } = message;
          console.log(`Received prompt: ${prompt.substring(0, 50)}...`);

          try {
            // Build contents array with history + new prompt
            const contents = [
              ...session.history,
              { role: 'user', parts: [{ text: prompt }] },
            ];

            // Send message and get streaming response using models API
            const result = await session.genAI.models.generateContentStream({
              model: 'gemini-2.0-flash-exp',
              contents,
            });

            let fullResponse = '';

            // Stream text chunks
            for await (const chunk of result) {
              const text = chunk.text;
              if (text) {
                fullResponse += text;
                ws.send(
                  JSON.stringify({
                    type: 'content',
                    value: text,
                  }),
                );
              }
            }

            // Add to history
            session.history.push(
              { role: 'user', parts: [{ text: prompt }] },
              { role: 'model', parts: [{ text: fullResponse }] },
            );

            // Send finished event
            ws.send(
              JSON.stringify({
                type: 'finished',
              }),
            );
          } catch (error) {
            console.error('Error generating response:', error);
            ws.send(
              JSON.stringify({
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
              }),
            );
          }
        }
      } catch (error) {
        console.error('Error handling message:', error);
        ws.send(
          JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        );
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      console.log(`WebSocket closed for session: ${sessionId}`);
      sessionManager.destroySession(sessionId);
    });
  } catch (error) {
    console.error('Error creating session:', error);
    ws.send(
      JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    );
    ws.close();
  }
});

// Handle server errors
wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  wss.close();
  process.exit(0);
});
