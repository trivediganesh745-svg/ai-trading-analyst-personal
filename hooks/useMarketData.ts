import { useState, useRef, useCallback, useEffect } from 'react';
import type { Tick, MarketSnapshot } from '../types';

// This is the base URL of your deployed Render proxy service.
// It defaults to localhost for local development.
const PROXY_BASE_URL = process.env.PROXY_BASE_URL || 'http://localhost:3000';

const getWebSocketUrl = () => {
    if (PROXY_BASE_URL.startsWith('https://')) {
        return PROXY_BASE_URL.replace('https://', 'wss://');
    }
    // Default to localhost for local development
    return 'ws://localhost:3000';
}

export const useMarketData = (instrument: string, accessToken: string | null) => {
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      console.log('WebSocket disconnected.');
    }
  }, []);

  const connect = useCallback(() => {
    if (!accessToken || wsRef.current) return;

    // Disconnect any existing connection before creating a new one
    disconnect(); 

    const wsUrl = getWebSocketUrl();
    console.log(`Connecting WebSocket to ${wsUrl}...`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected. Subscribing to instrument...');
      setTicks([]); // Clear old ticks on new connection
      setSnapshot(null);
      const subMessage = {
        type: 'subscribe',
        instrument,
        accessToken
      };
      ws.send(JSON.stringify(subMessage));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'tick') {
          const newTick: Tick = message.data;
          setTicks(prev => [...prev.slice(-199), newTick]);
        } else if (message.type === 'snapshot') {
          const newSnapshot: MarketSnapshot = message.data;
          setSnapshot(newSnapshot);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed.');
      wsRef.current = null;
      // You might want to automatically set isConnected to false here
    };
  }, [instrument, accessToken, disconnect]);

  // Effect to automatically disconnect when the component unmounts or dependencies change
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { ticks, snapshot, connect, disconnect };
};
