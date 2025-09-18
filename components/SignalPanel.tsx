import React from 'react';
import type { AISignal, Tick } from '../types';
import { SignalAction } from '../types';

interface SignalPanelProps {
  signal: AISignal | null;
  isAnalyzing: boolean;
  onManualTrade: () => void;
  trades: { signal: AISignal, tick: Tick }[];
}

const ConfidenceMeter: React.FC<{ confidence: number }> = ({ confidence }) => {
  const width = `${Math.round(confidence * 100)}%`;
  const confidenceLevel = confidence > 0.75 ? 'High' : confidence > 0.5 ? 'Medium' : 'Low';
  
  let bgColor = 'bg-yellow-500';
  if (confidence > 0.75) bgColor = 'bg-green-500';
  if (confidence < 0.5) bgColor = 'bg-red-500';

  return (
    <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Confidence: {confidenceLevel}</span>
            <span>{(confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-2.5">
            <div className={`${bgColor} h-2.5 rounded-full`} style={{ width }}></div>
        </div>
    </div>
  );
};


const SignalCard: React.FC<{ signal: AISignal }> = ({ signal }) => {
  const getSignalColorClasses = () => {
    switch (signal.signal) {
      case SignalAction.BUY:
        return 'border-green-500 bg-green-500/10 text-green-400';
      case SignalAction.SELL:
        return 'border-red-500 bg-red-500/10 text-red-400';
      case SignalAction.HOLD:
        return 'border-yellow-500 bg-yellow-500/10 text-yellow-400';
      default:
        return 'border-gray-600 bg-gray-700/20 text-gray-400';
    }
  };
  
  const signalColorClasses = getSignalColorClasses();

  return (
    <div className={`border-l-4 p-4 rounded-lg w-full ${signalColorClasses}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-2xl font-bold ${signalColorClasses.split(' ')[2]}`}>{signal.signal}</h3>
      </div>
      <div className="mb-4">
        <ConfidenceMeter confidence={signal.confidence} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div className="text-gray-400">Target: <span className="font-mono text-white">{signal.target.toFixed(2)}</span></div>
        <div className="text-gray-400">Stoploss: <span className="font-mono text-white">{signal.stoploss.toFixed(2)}</span></div>
      </div>
      <div>
        <p className="text-sm text-gray-400 italic">"{signal.reason}"</p>
      </div>
    </div>
  );
};

const SignalPanel: React.FC<SignalPanelProps> = ({ signal, isAnalyzing, onManualTrade, trades }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-4 flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-4 text-white">AI Analyst Signal</h2>
      
      <div className="mb-4 flex-grow flex items-center justify-center bg-gray-900/50 rounded-lg p-2">
        {isAnalyzing ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="mt-2 text-cyan-400">AI is analyzing market data...</p>
          </div>
        ) : signal ? (
          <SignalCard signal={signal} />
        ) : (
          <p className="text-gray-500">Waiting for market data to generate signal...</p>
        )}
      </div>

      <button
        onClick={onManualTrade}
        disabled={!signal || signal.signal === SignalAction.HOLD}
        className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed mb-4"
      >
        {signal?.signal === SignalAction.BUY ? 'Execute Manual Buy' : signal?.signal === SignalAction.SELL ? 'Execute Manual Sell' : 'Manual Trade'}
      </button>

      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-300">Trade Log (Simulated)</h3>
        <div className="bg-gray-900 rounded-md p-2 h-40 overflow-y-auto">
            {trades.length === 0 && <p className="text-gray-500 text-center p-4">No trades executed yet.</p>}
            <ul className="text-sm font-mono text-gray-400">
                {trades.map((trade, index) => (
                    <li key={index} className={`p-2 border-b border-gray-700/50 ${trade.signal.signal === SignalAction.BUY ? 'text-green-400' : 'text-red-400'}`}>
                        <div className="flex justify-between font-bold">
                            <span>{trade.signal.signal} @ {trade.tick.price.toFixed(2)}</span>
                            <span>{new Date(trade.tick.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                           Reason: {trade.signal.reason.substring(0, 50)}...
                        </div>
                    </li>
                ))}
            </ul>
        </div>
      </div>
    </div>
  );
};

export default SignalPanel;
