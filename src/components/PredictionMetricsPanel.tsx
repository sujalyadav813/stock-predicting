import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Percent,
  CheckCircle2,
  BookmarkPlus,
  Loader2,
  Sparkles,
  Zap,
  Target,
  BarChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  StockQuote,
  MonteCarloSimulationResult,
  ArimaLstmResult,
} from '../types/stock';
import { QuantitativeForecastResponse } from '../server/geminiService';

interface PredictionMetricsPanelProps {
  stock: StockQuote;
  monteCarlo: MonteCarloSimulationResult;
  arimaLstm: ArimaLstmResult;
  geminiForecast: QuantitativeForecastResponse | null;
  timeframe: '1D' | '7D' | '30D' | '90D';
  onSavePrediction: () => Promise<void>;
  onTriggerPaperTrade: () => void;
  isLoggedIn: boolean;
  onOpenAuth: () => void;
}

export const PredictionMetricsPanel: React.FC<PredictionMetricsPanelProps> = ({
  stock,
  monteCarlo,
  arimaLstm,
  geminiForecast,
  timeframe,
  onSavePrediction,
  onTriggerPaperTrade,
  isLoggedIn,
  onOpenAuth,
}) => {
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Compute synthesized ensemble
  const baseTarget = geminiForecast
    ? geminiForecast.baseTargetPrice
    : +(monteCarlo.medianFinalPrice * 0.6 + arimaLstm.finalPrice * 0.4).toFixed(2);

  const expectedReturn = +(
    ((baseTarget - stock.price) / stock.price) *
    100
  ).toFixed(2);

  const signal = geminiForecast
    ? geminiForecast.directionalSignal
    : expectedReturn > 5
    ? 'STRONG_BUY'
    : expectedReturn > 1.5
    ? 'BUY'
    : expectedReturn < -5
    ? 'STRONG_SELL'
    : expectedReturn < -1.5
    ? 'SELL'
    : 'HOLD';

  const confidenceScore = geminiForecast
    ? geminiForecast.confidenceScore
    : Math.round(
        (monteCarlo.probGainPercent * 0.45 +
          arimaLstm.directionalAccuracyPercent * 0.55)
      );

  const handleSave = async () => {
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }
    setSaving(true);
    try {
      await onSavePrediction();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const getSignalBadge = (sig: string) => {
    switch (sig) {
      case 'STRONG_BUY':
        return {
          bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          text: 'STRONG BUY',
          icon: ArrowUpRight,
        };
      case 'BUY':
        return {
          bg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          text: 'BUY / ACCUMULATE',
          icon: ArrowUpRight,
        };
      case 'STRONG_SELL':
        return {
          bg: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
          text: 'STRONG SELL',
          icon: ArrowDownRight,
        };
      case 'SELL':
        return {
          bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          text: 'TRIM / REDUCE',
          icon: ArrowDownRight,
        };
      default:
        return {
          bg: 'bg-slate-700/50 text-slate-300 border-slate-600',
          text: 'NEUTRAL / HOLD',
          icon: Target,
        };
    }
  };

  const badge = getSignalBadge(signal);
  const BadgeIcon = badge.icon;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5 text-slate-100">
      {/* Top Banner: Signal & Target Price */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wider">
              Ensemble Quant Recommendation
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Horizon: {timeframe}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-bold font-mono ${badge.bg}`}
            >
              <BadgeIcon className="w-4 h-4" />
              <span>{badge.text}</span>
            </div>

            <div className="font-mono">
              <span className="text-xs text-slate-400">Target: </span>
              <span className="text-xl font-black text-white">
                ${baseTarget.toFixed(2)}
              </span>
              <span
                className={`ml-1.5 text-xs font-bold ${
                  expectedReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                ({expectedReturn >= 0 ? '+' : ''}
                {expectedReturn}%)
              </span>
            </div>
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl">
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* SVG radial ring */}
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={
                  confidenceScore > 80
                    ? 'text-cyan-400'
                    : confidenceScore > 65
                    ? 'text-blue-400'
                    : 'text-amber-400'
                }
                strokeDasharray={`${confidenceScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-mono text-xs font-bold text-white">
              {confidenceScore}%
            </span>
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400">Model Reliability</div>
            <div className="text-xs font-bold text-slate-200">
              {confidenceScore >= 85
                ? 'High Confidence'
                : confidenceScore >= 70
                ? 'Moderate Conviction'
                : 'Elevated Volatility'}
            </div>
          </div>
        </div>
      </div>

      {/* Key Quantitative Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-mono">Expected Return</div>
          <div
            className={`text-base font-bold font-mono mt-0.5 ${
              expectedReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {expectedReturn >= 0 ? '+' : ''}
            {expectedReturn}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Over {timeframe}</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-mono">95% VaR (Risk)</div>
          <div className="text-base font-bold font-mono mt-0.5 text-rose-400">
            -{monteCarlo.var95Percent}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Value at Risk</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-mono">Probability Gain</div>
          <div className="text-base font-bold font-mono mt-0.5 text-cyan-400">
            {monteCarlo.probGainPercent}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">GBM Win Rate</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-mono">Directional Acc.</div>
          <div className="text-base font-bold font-mono mt-0.5 text-blue-400">
            {arimaLstm.directionalAccuracyPercent}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">LSTM Backtested</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-mono">Model MAPE</div>
          <div className="text-base font-bold font-mono mt-0.5 text-slate-200">
            {arimaLstm.mape}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Mean Abs Error</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-mono">Sharpe Estimate</div>
          <div className="text-base font-bold font-mono mt-0.5 text-emerald-400">
            {geminiForecast?.sharpeRatioEstimate || '1.62'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Risk-adjusted</div>
        </div>
      </div>

      {/* Scenario Multi-Horizon Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Bear Case */}
        <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
          <div className="flex items-center justify-between text-xs font-mono text-rose-400 font-semibold">
            <span>BEAR SCENARIO</span>
            <span className="text-[10px] text-rose-500">5th Quantile</span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-100 mt-1">
            $
            {geminiForecast
              ? geminiForecast.bearTargetPrice.toFixed(2)
              : monteCarlo.p5Path[monteCarlo.p5Path.length - 1]?.toFixed(2)}
          </div>
          <div className="text-xs text-rose-400 font-mono mt-0.5">
            {(
              (((geminiForecast
                ? geminiForecast.bearTargetPrice
                : monteCarlo.p5Path[monteCarlo.p5Path.length - 1] || stock.price) -
                stock.price) /
                stock.price) *
              100
            ).toFixed(1)}
            % downside floor
          </div>
        </div>

        {/* Base Case */}
        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <div className="flex items-center justify-between text-xs font-mono text-blue-400 font-semibold">
            <span>BASE EXPECTATION</span>
            <span className="text-[10px] text-blue-500">50th Quantile</span>
          </div>
          <div className="text-lg font-bold font-mono text-white mt-1">
            ${baseTarget.toFixed(2)}
          </div>
          <div
            className={`text-xs font-mono mt-0.5 ${
              expectedReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {expectedReturn >= 0 ? '+' : ''}
            {expectedReturn}% projected
          </div>
        </div>

        {/* Bull Case */}
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold">
            <span>BULL SCENARIO</span>
            <span className="text-[10px] text-emerald-500">95th Quantile</span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-100 mt-1">
            $
            {geminiForecast
              ? geminiForecast.bullTargetPrice.toFixed(2)
              : monteCarlo.p95Path[monteCarlo.p95Path.length - 1]?.toFixed(2)}
          </div>
          <div className="text-xs text-emerald-400 font-mono mt-0.5">
            +
            {(
              (((geminiForecast
                ? geminiForecast.bullTargetPrice
                : monteCarlo.p95Path[monteCarlo.p95Path.length - 1] || stock.price) -
                stock.price) /
                stock.price) *
              100
            ).toFixed(1)}
            % upside ceiling
          </div>
        </div>
      </div>

      {/* Action Buttons: Save to Firestore & Execute Trade */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {isLoggedIn
              ? 'Synced to your cloud Firebase database.'
              : 'Sign in with Google to save predictions & sync portfolio.'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : saveSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>{saveSuccess ? 'Saved to Log!' : 'Save Prediction'}</span>
          </button>

          <button
            onClick={onTriggerPaperTrade}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/10 transition active:scale-95"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Execute Paper Trade</span>
          </button>
        </div>
      </div>
    </div>
  );
};
