/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ChatWindow, type Message } from './components/ChatWindow';
import { InputBox } from './components/InputBox';
import {
  useWebSocket,
  type ServerGeminiStreamEvent,
} from './hooks/useWebSocket';
import './App.css';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  const handleMessage = useCallback((event: ServerGeminiStreamEvent) => {
    console.log('Received event:', event);

    switch (event.type) {
      case 'connected':
        console.log('Connected to server');
        break;

      case 'content':
        // Streaming text content
        setIsStreaming(true);
        setCurrentResponse((prev) => prev + ((event.value as string) || ''));
        break;

      case 'finished':
        // Stream finished, add to messages
        setCurrentResponse((prev) => {
          if (prev) {
            setMessages((msgs) => [
              ...msgs,
              {
                role: 'model',
                content: prev,
                timestamp: new Date(),
              },
            ]);
          }
          return '';
        });
        setIsStreaming(false);
        break;

      case 'error':
        console.error('Error from server:', event.value);
        setIsStreaming(false);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }
  }, []);

  const { sendMessage, isConnected, error } = useWebSocket({
    onMessage: handleMessage,
  });

  const handleSend = useCallback(
    (text: string) => {
      // Add user message
      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          content: text,
          timestamp: new Date(),
        },
      ]);

      // Send to server
      sendMessage(text);
    },
    [sendMessage],
  );

  // Combine messages with current streaming response
  const displayMessages = [
    ...messages,
    ...(currentResponse
      ? [
          {
            role: 'model' as const,
            content: currentResponse,
            timestamp: new Date(),
          },
        ]
      : []),
  ];

  return (
    <div className="app">
      <header className="app-header">
        <h1>Gemini CLI Web UI</h1>
        <div className="status">
          {error ? (
            <span className="status-error">Error: {error}</span>
          ) : isConnected ? (
            <span className="status-connected">● Connected</span>
          ) : (
            <span className="status-connecting">○ Connecting...</span>
          )}
        </div>
      </header>

      <main className="app-main">
        <ChatWindow messages={displayMessages} />
        <div ref={chatEndRef} />
      </main>

      <InputBox onSend={handleSend} disabled={!isConnected || isStreaming} />
    </div>
  );
}

export default App;
