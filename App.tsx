import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import MarketDataPanel from './components/MarketDataPanel';
import SignalPanel from './components/SignalPanel';
import MarketDepthPanel from './components/MarketDepthPanel';
import SentimentNewsPanel from './components/SentimentNewsPanel';
import { useMarketData } from './hooks/useMarketData';
import { useNewsFeed } from './hooks/useNewsFeed';
import { useGeminiAnalysis } from './hooks/useGeminiAnalysis';
import { useFyersAuth } from './hooks/useFyersAuth';
import type { Trade } from './types';
import { SignalAction, AuthStatus } from './types';

const INSTRUMENTS = {
  nifty: 'NSE:NIFTY50-INDEX',
  banknifty: 'NSE:NIFTYBANK-INDEX',
  reliance: 'NSE:RELIANCE-EQ',
  tcs: 'NSE:TCS-EQ',
  sbin: 'NSE:SBIN-EQ',
  infy: 'NSE:INFY-EQ',
};

const LoginScreen: React.FC<{ onLogin: () => void; error: string | null; authStatus: AuthStatus }> = ({ onLogin, error, authStatus }) => (
    <div className="flex items-center justify-center h-screen">
        <div className="text-center bg-gray-800 p-8 rounded-lg shadow-2xl">
            <h1 className="text-3xl font-bold mb-4 text-white">Gemini AI Trading Bot</h1>
            <p className="text-gray-400 mb-6">Please log in with your Fyers account to continue.</p>
            {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-md mb-4">{error}</p>}
            <button
                onClick={onLogin}
                disabled={authStatus === AuthStatus.AUTHENTICATING}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-3 px-6 rounded-md transition duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                {authStatus === AuthStatus.AUTHENTICATING ? 'Redirecting to Fyers...' : 'Login with Fyers'}
            </button>
        </div>
    </div>
);


function App() {
  const [instrument, setInstrument] = useState<string>(INSTRUMENTS.nifty);
  const [trades, setTrades] = useState<Trade[]>([]);
  
  const { authStatus, accessToken, error, login, logout, handleRedirect } = useFyersAuth();

  // Handle the redirect from Fyers on component mount
  useEffect(() => {
    handleRedirect();
  }, [handleRedirect]);

  const isConnected = authStatus === AuthStatus.AUTHENTICATED;

  const { ticks, snapshot, connect: connectMarketData, disconnect: disconnectMarketData } = useMarketData(instrument, accessToken);
  const { headlines } = useNewsFeed(instrument, isConnected ? 8000 : undefined);
  const { signal, isAnalyzing } = useGeminiAnalysis(
    ticks,
    headlines,
    instrument,
    snapshot?.ohlcv,
    isConnected
  );
  
  const handleConnect = () => {
      if (accessToken) {
          connectMarketData();
      }
  }
  
  const handleDisconnect = () => {
      disconnectMarketData();
  }
  
  const handleManualTrade = () => {
    if (signal && ticks.length > 0 && signal.signal !== SignalAction.HOLD) {
      const latestTick = ticks[ticks.length - 1];
      const newTrade: Trade = { signal, tick: latestTick };
      setTrades(prev => [newTrade, ...prev].slice(0, 50));
    }
  };

  if (!isConnected) {
    return <LoginScreen onLogin={login} error={error} authStatus={authStatus} />;
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4 font-sans flex flex-col">
      <Header
        instrument={instrument}
        setInstrument={setInstrument}
        instruments={INSTRUMENTS}
        isConnected={ticks.length > 0} // Base connection on receiving data
        connect={handleConnect}
        disconnect={handleDisconnect}
        isLoggedIn={isConnected}
        logout={logout}
      />
      
      <main className="flex-grow grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        <div className="lg:col-span-1 md:col-span-1">
          <MarketDataPanel instrument={instrument} ticks={ticks} />
        </div>
        <div className="lg:col-span-1 md:col-span-2">
          <MarketDepthPanel snapshot={snapshot} />
        </div>
        <div className="lg:col-span-1 md:col-span-3">
          <SentimentNewsPanel headlines={headlines} />
        </div>
        <div className="lg:col-span-1 md:col-span-3 lg:row-start-1 lg:col-start-4 md:row-start-auto md:col-start-auto">
          <SignalPanel signal={signal} isAnalyzing={isAnalyzing} onManualTrade={handleManualTrade} trades={trades} />
        </div>
      </main>
    </div>
  );
}

export default App;
