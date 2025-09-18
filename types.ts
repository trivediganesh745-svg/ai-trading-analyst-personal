export interface Tick {
  timestamp: number;
  price: number;
  volume: number;
}

export interface MarketDepthEntry {
  price: number;
  quantity: number;
  orders: number;
}

export interface OHLCV {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketSnapshot {
  bids: MarketDepthEntry[];
  asks: MarketDepthEntry[];
  ohlcv: OHLCV;
}

export type Sentiment = 'Positive' | 'Negative' | 'Neutral';

export interface NewsHeadline {
  timestamp: number;
  sentiment: Sentiment;
  text: string;
}

export enum SignalAction {
  BUY = "BUY",
  SELL = "SELL",
  HOLD = "HOLD",
}

export interface AISignal {
  signal: SignalAction;
  confidence: number;
  target: number;
  stoploss: number;
  reason: string;
}

export interface Trade {
    signal: AISignal;
    tick: Tick;
}

// Type for WebSocket event listeners
export type FyersSocketListener = (data: any) => void;

// Represents the state of the Fyers API authentication process
export enum AuthStatus {
  IDLE,
  AUTHENTICATING,
  AUTHENTICATED,
  ERROR,
}
