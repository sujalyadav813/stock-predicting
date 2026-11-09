import React, { useMemo } from 'react';
import {
  Sliders,
  RotateCw,
  Activity,
  Percent,
  HelpCircle,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { MonteCarloSimulationResult, StockQuote } from '../types/stock';

interface MonteCarloSimulatorProps {
  stock: StockQuote;
  monteCarlo: MonteCarloSimulationResult;
  volMultiplier: number;
  onVolMultiplierChange: (val: number) => void;
  driftModifier: number;
  onDriftModifierChange: (val: number) => void;
  numPaths: number;
  onNumPathsChange: (val: number) => void;
  onRecalculate: () => void;
  horizonDays: number;
}

export const MonteCarloSimulator: React.FC<MonteCarloSimulatorProps> = ({
  stock,
  monteCarlo,
  volMultiplier,
  onVolMultiplierChange,
  driftModifier,
  onDriftModifierChange,
  numPaths,
  onNumPathsChange,
  onRecalculate,
  horizonDays,
}) => {
  // Generate histogram distribution bins of terminal prices
  const histogramBins = useMemo(() => {
    const prices = monteCarlo.finalPrices;
    if (!prices || prices.length === 0) return [];

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const binCount = 18;
    const binWidth = (max - min) / binCount;

    const bins = Array.from({ length: binCount }, (_, i) => ({
      rangeStart: min + i * binWidth,
      rangeEnd: min + (i + 1) * binWidth,
      count: 0,
      isAboveCurrent: min + (i + 0.5) * binWidth >= stock.price,
    }));

    prices.forEach((p) => {
      let bIdx = Math.floor((p - min) / binWidth);
      if (bIdx >= binCount) bIdx = binCount - 1;
      if (bIdx >= 0 && bins[bIdx]) {
        bins[bIdx].count++;
      }
    });

    const maxCount = Math.max(...bins.map((b) => b.count), 1);
    return bins.map((b) => ({
      ...b,
      heightPercent: (b.count / maxCount) * 100,
    }));
  }, [monteCarlo.finalPrices, stock.price]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Monte Carlo Engine & Stress Testing</span>
              <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Geometric Brownian Motion
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Simulating {numPaths} Brownian paths over {horizonDays} trading days with stochastic calculus.
            </p>
          </div>
        </div>

        <button
          onClick={onRecalculate}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 transition active:scale-95"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Resimulate Paths</span>
        </button>
      </div>

      {/* Control Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
        {/* Volatility Multiplier */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-300 font-medium">Volatility Multiplier</span>
            <span className="text-purple-400 font-bold">{volMultiplier.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={volMultiplier}
            onChange={(e) => onVolMultiplierChange(parseFloat(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0.5x (Stable)</span>
            <span>1.0x (Historical)</span>
            <span>2.5x (Crisis)</span>
          </div>
        </div>

        {/* Macro Drift Bias */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-300 font-medium">Drift / Market Bias</span>
            <span
              className={`font-bold ${
                driftModifier > 0
                  ? 'text-emerald-400'
                  : driftModifier < 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {driftModifier > 0 ? '+' : ''}
              {(driftModifier * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="-0.15"
            max="0.25"
            step="0.05"
            value={driftModifier}
            onChange={(e) => onDriftModifierChange(parseFloat(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>-15% (Bearish)</span>
            <span>Neutral</span>
            <span>+25% (Bullish)</span>
          </div>
        </div>

        {/* Path Count Selector */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-300 font-medium">Simulation Iterations</span>
            <span className="text-cyan-400 font-bold">{numPaths} Paths</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[100, 250, 500].map((count) => (
              <button
                key={count}
                onClick={() => onNumPathsChange(count)}
                className={`py-1.5 text-xs font-mono rounded-lg transition ${
                  numPaths === count
                    ? 'bg-purple-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-slate-500 font-mono text-center">
            Higher paths improve distribution convergence
          </div>
        </div>
      </div>

      {/* Terminal Price Distribution Histogram */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Terminal Price Distribution Density ({numPaths} Stochastic Runs)</span>
          <span className="text-emerald-400">
            Green = In the Money (Gain) | Red = Out of the Money (Loss)
          </span>
        </div>

        <div className="h-28 bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-end gap-1.5 relative overflow-hidden">
          {histogramBins.map((bin, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col justify-end items-center h-full group relative"
            >
              <div
                style={{ height: `${Math.max(4, bin.heightPercent)}%` }}
                className={`w-full rounded-t transition-all ${
                  bin.isAboveCurrent
                    ? 'bg-emerald-500/70 group-hover:bg-emerald-400'
                    : 'bg-rose-500/70 group-hover:bg-rose-400'
                }`}
              />
              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 z-20 pointer-events-none bg-slate-900 border border-slate-700 text-[10px] font-mono px-2 py-1 rounded shadow-xl whitespace-nowrap">
                ${bin.rangeStart.toFixed(1)} - ${bin.rangeEnd.toFixed(1)}: {bin.count} paths
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center text-[11px] font-mono text-slate-500">
          <span>Min: ${Math.min(...monteCarlo.finalPrices).toFixed(2)}</span>
          <span className="text-white font-bold">
            Current Price: ${stock.price.toFixed(2)}
          </span>
          <span className="text-purple-400 font-bold">
            Median Forecast: ${monteCarlo.medianFinalPrice.toFixed(2)}
          </span>
          <span>Max: ${Math.max(...monteCarlo.finalPrices).toFixed(2)}</span>
        </div>
      </div>

      {/* Statistical Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
          <span className="text-slate-500">Win Probability</span>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">
            {monteCarlo.probGainPercent}%
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
          <span className="text-slate-500">Standard Deviation</span>
          <div className="text-sm font-bold text-slate-200 mt-0.5">
            ±${monteCarlo.standardDeviation}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
          <span className="text-slate-500">25th-75th Interquartile</span>
          <div className="text-sm font-bold text-purple-300 mt-0.5">
            ${monteCarlo.p25Path[monteCarlo.p25Path.length - 1]?.toFixed(1)} – $
            {monteCarlo.p75Path[monteCarlo.p75Path.length - 1]?.toFixed(1)}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
          <span className="text-slate-500">Annualized Sigma (σ)</span>
          <div className="text-sm font-bold text-cyan-400 mt-0.5">
            {(stock.historicalData.length > 0 ? (0.28 * volMultiplier * 100).toFixed(1) : 25)}%
          </div>
        </div>
      </div>
    </div>
  );
};
