export enum AuthStatus {
  IDLE = 'IDLE',
  AUTHENTICATING = 'AUTHENTICATING',
  AUTHENTICATED = 'AUTHENTICATED',
  ERROR = 'ERROR',
}

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
    close: number; // Previous day's close
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
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD',
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
  contextTicks: Tick[];
  contextHeadlines: NewsHeadline[];
}

export enum TradingStrategy {
    SCALPING = 'Scalping',
    SWING = 'Swing Trading',
    INTRADAY = 'Intraday Momentum',
}

export interface PerformanceMetrics {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    totalNetPL: number;
    winRate: number;
    profitFactor: number;
    averageWin: number;
    averageLoss: number;
}

export interface EquityDataPoint {
    tradeNumber: number;
    cumulativePL: number;
}
