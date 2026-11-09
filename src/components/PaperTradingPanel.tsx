import React, { useState } from 'react';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
} from 'lucide-react';
import { StockQuote } from '../types/stock';

export interface Position {
  ticker: string;
  name: string;
  shares: number;
  averagePrice: number;
}

interface PaperTradingPanelProps {
  stock: StockQuote;
  cashBalance: number;
  positions: Position[];
  onExecuteTrade: (ticker: string, shares: number, isBuy: boolean) => boolean;
  onClosePosition: (ticker: string) => void;
  isLoggedIn: boolean;
  onOpenAuth: () => void;
}

export const PaperTradingPanel: React.FC<PaperTradingPanelProps> = ({
  stock,
  cashBalance,
  positions,
  onExecuteTrade,
  onClosePosition,
  isLoggedIn,
  onOpenAuth,
}) => {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [sharesInput, setSharesInput] = useState<string>('10');
  const [tradeStatus, setTradeStatus] = useState<{ msg: string; isError: boolean } | null>(null);

  const numShares = parseInt(sharesInput, 10) || 0;
  const totalCost = numShares * stock.price;

  const currentStockPosition = positions.find((p) => p.ticker === stock.ticker);

  const handleTrade = () => {
    if (numShares <= 0) {
      setTradeStatus({ msg: 'Please enter a valid share quantity.', isError: true });
      return;
    }

    if (tradeType === 'buy') {
      if (totalCost > cashBalance) {
        setTradeStatus({
          msg: `Insufficient cash balance ($${cashBalance.toFixed(2)} available).`,
          isError: true,
        });
        return;
      }
      const success = onExecuteTrade(stock.ticker, numShares, true);
      if (success) {
        setTradeStatus({
          msg: `Successfully bought ${numShares} shares of ${stock.ticker} at $${stock.price.toFixed(2)}`,
          isError: false,
        });
        setTimeout(() => setTradeStatus(null), 3500);
      }
    } else {
      if (!currentStockPosition || currentStockPosition.shares < numShares) {
        setTradeStatus({
          msg: `You do not own ${numShares} shares of ${stock.ticker} to sell.`,
          isError: true,
        });
        return;
      }
      const success = onExecuteTrade(stock.ticker, numShares, false);
      if (success) {
        setTradeStatus({
          msg: `Successfully sold ${numShares} shares of ${stock.ticker} at $${stock.price.toFixed(2)}`,
          isError: false,
        });
        setTimeout(() => setTradeStatus(null), 3500);
      }
    }
  };

  // Portfolio total value
  const totalHoldingsValue = positions.reduce(
    (acc, p) => acc + p.shares * (p.ticker === stock.ticker ? stock.price : p.averagePrice * 1.02),
    0
  );
  const netWorth = cashBalance + totalHoldingsValue;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Paper Trading & Order Execution</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Risk-Free Sandbox
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Test machine learning price forecasts with simulated institutional order execution.
            </p>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-xs text-slate-400">Total Portfolio Value: </span>
          <span className="text-base font-extrabold text-white">
            ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Main Grid: Order Form & Positions Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Order Form */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-slate-300">
                Order Ticket: {stock.ticker}
              </span>
              <span className="text-xs font-mono font-semibold text-white">
                Market: ${stock.price.toFixed(2)}
              </span>
            </div>

            {/* Buy / Sell Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs font-bold mb-4">
              <button
                onClick={() => setTradeType('buy')}
                className={`py-2 rounded-lg transition ${
                  tradeType === 'buy'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                BUY / LONG
              </button>
              <button
                onClick={() => setTradeType('sell')}
                className={`py-2 rounded-lg transition ${
                  tradeType === 'sell'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SELL / SHORT
              </button>
            </div>

            {/* Shares Input */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-mono">Quantity (Shares)</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSharesInput(String(Math.max(1, numShares - 5)))}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={sharesInput}
                  onChange={(e) => setSharesInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg py-2 px-3 text-center text-sm font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => setSharesInput(String(numShares + 5))}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick share buttons */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[5, 10, 25, 50].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setSharesInput(String(amt))}
                    className="py-1 text-[11px] font-mono rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="mt-4 p-3 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs font-mono space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Estimated Value:</span>
                <span className="text-white font-bold">${totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Execution Type:</span>
                <span className="text-blue-400">Instant Market Fill</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Available Cash:</span>
                <span className="text-emerald-400">${cashBalance.toFixed(2)}</span>
              </div>
            </div>

            {/* Status Message */}
            {tradeStatus && (
              <div
                className={`mt-3 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  tradeStatus.isError
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                }`}
              >
                {tradeStatus.isError ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{tradeStatus.msg}</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleTrade}
            className={`w-full py-2.5 rounded-xl font-bold font-mono text-xs uppercase tracking-wider text-white shadow-lg transition active:scale-95 ${
              tradeType === 'buy'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
            }`}
          >
            Confirm {tradeType === 'buy' ? 'Buy Order' : 'Sell Order'}
          </button>
        </div>

        {/* Positions Table */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-mono uppercase text-slate-400 font-bold">
                Active Open Positions ({positions.length})
              </h4>
              <span className="text-xs text-slate-500 font-mono">
                Realized mark-to-market valuations
              </span>
            </div>

            {positions.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-mono">
                No active positions. Execute a buy order above to start testing models.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 pb-2">
                      <th className="pb-2 font-normal">Ticker</th>
                      <th className="pb-2 font-normal">Shares</th>
                      <th className="pb-2 font-normal">Avg Cost</th>
                      <th className="pb-2 font-normal">Current Price</th>
                      <th className="pb-2 font-normal">Market Value</th>
                      <th className="pb-2 font-normal">Unrealized P&L</th>
                      <th className="pb-2 font-normal text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {positions.map((p) => {
                      const curPrice =
                        p.ticker === stock.ticker ? stock.price : p.averagePrice * 1.02;
                      const value = p.shares * curPrice;
                      const costBasis = p.shares * p.averagePrice;
                      const pnl = value - costBasis;
                      const pnlPercent = (pnl / costBasis) * 100;
                      const isProfit = pnl >= 0;

                      return (
                        <tr key={p.ticker} className="hover:bg-slate-900/50 transition">
                          <td className="py-2.5 font-bold text-white">{p.ticker}</td>
                          <td className="py-2.5 text-slate-300">{p.shares}</td>
                          <td className="py-2.5 text-slate-400">
                            ${p.averagePrice.toFixed(2)}
                          </td>
                          <td className="py-2.5 text-slate-200">${curPrice.toFixed(2)}</td>
                          <td className="py-2.5 text-white font-semibold">
                            ${value.toFixed(2)}
                          </td>
                          <td
                            className={`py-2.5 font-bold ${
                              isProfit ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isProfit ? '+' : ''}${pnl.toFixed(2)} (
                            {isProfit ? '+' : ''}
                            {pnlPercent.toFixed(2)}%)
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => onClosePosition(p.ticker)}
                              className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-bold transition"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Positions are updated in real-time as market prices oscillate.</span>
            {!isLoggedIn && (
              <button
                onClick={onOpenAuth}
                className="text-blue-400 hover:text-blue-300 underline font-sans"
              >
                Sign in with Google to sync portfolio across devices
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
