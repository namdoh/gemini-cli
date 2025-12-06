/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface ServerGeminiStreamEvent {
  type: string;
  value?: unknown;
  traceId?: string;
}

interface UseWebSocketOptions {
  onMessage: (event: ServerGeminiStreamEvent) => void;
  url?: string;
}

export function useWebSocket({
  onMessage,
  url = 'ws://localhost:8080',
}: UseWebSocketOptions) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create WebSocket connection
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
    };

    ws.current.onmessage = (event) => {
      try {
        const data: ServerGeminiStreamEvent = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    };

    ws.current.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('Connection error');
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    // Cleanup on unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, onMessage]);

  const sendMessage = useCallback((prompt: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: 'prompt',
          prompt,
        }),
      );
    } else {
      console.error('WebSocket is not connected');
    }
  }, []);

  return { sendMessage, isConnected, error };
}
