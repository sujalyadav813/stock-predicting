import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Brain,
  ShieldAlert,
  Target,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Send,
  Zap,
} from 'lucide-react';
import { StockQuote, TechnicalIndicators } from '../types/stock';
import { QuantitativeForecastResponse } from '../server/geminiService';

interface GeminiQuantAnalysisProps {
  stock: StockQuote;
  indicators: TechnicalIndicators;
  timeframe: '1D' | '7D' | '30D' | '90D';
  forecast: QuantitativeForecastResponse | null;
  loading: boolean;
  onRunForecast: (scenario?: string) => Promise<void>;
}

const PRESET_SCENARIOS = [
  'Q3 Earnings Beat by +15% & AI Guidance Acceleration',
  'Federal Reserve 25 bps Interest Rate Cut',
  'Macro Risk-Off Flight to Liquidity & Defensive Assets',
  'Breakout above 50-day SMA on 2x Average Volume',
];

export const GeminiQuantAnalysis: React.FC<GeminiQuantAnalysisProps> = ({
  stock,
  indicators,
  timeframe,
  forecast,
  loading,
  onRunForecast,
}) => {
  const [customScenario, setCustomScenario] = useState('');

  const handleRun = (scenarioText?: string) => {
    const s = scenarioText !== undefined ? scenarioText : customScenario;
    onRunForecast(s);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Gemini Quantitative Market Reasoning</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Server-Side Gemini 3.8 Flash
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Deep quantitative hedge-fund synthesis integrating RSI, MACD, volatility, and macro drivers.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleRun()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 ring-1 ring-white/10 transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Synthesizing...' : 'Run Deep AI Forecast'}</span>
        </button>
      </div>

      {/* Scenario What-If Stress Tester */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Macro Scenario / Shock Simulator
          </span>
          <span className="text-[11px] text-slate-500">
            Simulate custom catalyst or market shock
          </span>
        </div>

        {/* Preset scenario pills */}
        <div className="flex flex-wrap gap-1.5">
          {PRESET_SCENARIOS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCustomScenario(preset);
                handleRun(preset);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition font-sans"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type custom scenario (e.g. Antitrust verdict announced, 10% dividend hike)..."
            value={customScenario}
            onChange={(e) => setCustomScenario(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRun();
            }}
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition"
          />
          <button
            onClick={() => handleRun()}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Send className="w-3 h-3 text-cyan-400" />
            <span>Apply</span>
          </button>
        </div>
      </div>

      {/* Forecast Output Content */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <Sparkles className="w-5 h-5 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-xs font-mono text-cyan-300 animate-pulse">
            Analyzing {stock.ticker} stochastic momentum, volatility regimes, and order book pressure...
          </p>
        </div>
      ) : forecast ? (
        <div className="space-y-4">
          {/* Executive Thesis Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold mb-1.5 uppercase tracking-wider">
              <Brain className="w-4 h-4" />
              <span>Quantitative Analytical Thesis</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {forecast.quantitativeThesis}
            </p>
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
              <span>
                Support Floor: <strong className="text-emerald-400">${forecast.supportLevel}</strong>
              </span>
              <span>
                Resistance Ceiling: <strong className="text-rose-400">${forecast.resistanceLevel}</strong>
              </span>
              <span>
                Volatility Regime: <strong className="text-amber-400">{forecast.volatilityRegime}</strong>
              </span>
            </div>
          </div>

          {/* Key Catalysts and Risk Factors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Catalysts */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold mb-2">
                <TrendingUp className="w-4 h-4" />
                <span>Primary Bullish Catalysts</span>
              </div>
              <ul className="space-y-2">
                {forecast.keyCatalysts.map((cat, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{cat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risk Factors */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono text-rose-400 font-bold mb-2">
                <ShieldAlert className="w-4 h-4" />
                <span>Key Risk Factors & Tail Events</span>
              </div>
              <ul className="space-y-2">
                {forecast.riskFactors.map((risk, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Technical Summary */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>{forecast.technicalSummary}</span>
            <span className="text-cyan-400 shrink-0 font-bold">
              Confidence Rank: {forecast.modelConfidenceRank}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
