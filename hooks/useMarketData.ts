import { useState, useRef, useCallback, useEffect } from 'react';
import type { Tick, MarketSnapshot } from '../types';

export const useMarketData = (instrument: string, accessToken: string | null) => {
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setTicks([]);
      setSnapshot(null);
      console.log('WebSocket disconnected.');
    }
  }, []);

  const connect = useCallback(() => {
    if (!accessToken || wsRef.current) return;

    console.log('Connecting WebSocket...');
    const ws = new WebSocket('ws://localhost:3001');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected. Subscribing to instrument...');
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
    };
  }, [instrument, accessToken]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { ticks, snapshot, connect, disconnect };
};
