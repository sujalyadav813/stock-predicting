/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  auth,
  onAuthStateChanged,
  signOutUser,
  getUserPortfolio,
  saveUserPortfolio,
  getUserPredictions,
  savePredictionRecord,
  SavedPredictionRecord,
} from './firebase';
import { STOCK_UNIVERSE } from './data/stockUniverse';
import { StockQuote } from './types/stock';
import {
  calculateTechnicalIndicators,
  runMonteCarloSimulation,
  runArimaLstmModel,
} from './algorithms/predictiveEngines';
import { QuantitativeForecastResponse } from './server/geminiService';
import { Navbar } from './components/Navbar';
import { StockChart } from './components/StockChart';
import { PredictionMetricsPanel } from './components/PredictionMetricsPanel';
import { MonteCarloSimulator } from './components/MonteCarloSimulator';
import { GeminiQuantAnalysis } from './components/GeminiQuantAnalysis';
import { PaperTradingPanel, Position } from './components/PaperTradingPanel';
import { AuthModal } from './components/AuthModal';
import { SavedPredictionsModal } from './components/SavedPredictionsModal';
import {
  TrendingUp,
  Layers,
  Sparkles,
  Briefcase,
  Activity,
  BarChart3,
  Shield,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  // Stock Selection
  const [selectedStock, setSelectedStock] = useState<StockQuote>(STOCK_UNIVERSE[0]);
  const [timeframe, setTimeframe] = useState<'1D' | '7D' | '30D' | '90D'>('30D');

  // Monte Carlo Knobs
  const [volMultiplier, setVolMultiplier] = useState<number>(1.0);
  const [driftModifier, setDriftModifier] = useState<number>(0.0);
  const [numPaths, setNumPaths] = useState<number>(100);
  const [recalcTrigger, setRecalcTrigger] = useState<number>(0);

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'chart' | 'monte_carlo' | 'gemini' | 'trading'>('chart');

  // Auth & User State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);

  // Paper Trading & Portfolio State
  const [cashBalance, setCashBalance] = useState<number>(100000);
  const [positions, setPositions] = useState<Position[]>([
    {
      ticker: 'NVDA',
      name: 'NVIDIA Corporation',
      shares: 25,
      averagePrice: 132.5,
    },
  ]);

  // Saved Predictions State
  const [savedPredictions, setSavedPredictions] = useState<SavedPredictionRecord[]>([]);

  // Gemini AI Forecast State
  const [geminiForecast, setGeminiForecast] = useState<QuantitativeForecastResponse | null>(null);
  const [geminiLoading, setGeminiLoading] = useState<boolean>(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Load user's saved data from Firestore
        try {
          const portfolio = await getUserPortfolio(currentUser.uid);
          if (portfolio) {
            if (portfolio.cashBalance !== undefined) setCashBalance(portfolio.cashBalance);
          }
          const userPreds = await getUserPredictions(currentUser.uid);
          if (userPreds && userPreds.length > 0) {
            setSavedPredictions(userPreds);
          }
        } catch (err) {
          console.error('Error fetching user Firestore records:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Calculate technical indicators
  const indicators = useMemo(() => {
    return calculateTechnicalIndicators(selectedStock.historicalData);
  }, [selectedStock]);

  const horizonDays = useMemo(() => {
    return timeframe === '1D' ? 1 : timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : 90;
  }, [timeframe]);

  // Run Monte Carlo Simulation
  const monteCarlo = useMemo(() => {
    // recalTrigger dependency allows forced re-simulations
    return runMonteCarloSimulation(
      selectedStock.price,
      indicators.volatility30d,
      horizonDays,
      numPaths,
      volMultiplier,
      driftModifier
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedStock.price,
    indicators.volatility30d,
    horizonDays,
    numPaths,
    volMultiplier,
    driftModifier,
    recalcTrigger,
  ]);

  // Run ARIMA-LSTM Hybrid model
  const arimaLstm = useMemo(() => {
    return runArimaLstmModel(selectedStock.historicalData, horizonDays, indicators);
  }, [selectedStock, horizonDays, indicators]);

  // Fetch Gemini Forecast from server endpoint /api/predict
  const fetchGeminiPrediction = useCallback(
    async (scenario?: string) => {
      setGeminiLoading(true);
      try {
        const histCloses = selectedStock.historicalData.map((c) => c.close);
        const change30d =
          histCloses.length >= 30
            ? ((histCloses[histCloses.length - 1] - histCloses[histCloses.length - 30]) /
                histCloses[histCloses.length - 30]) *
              100
            : 0;

        const payload = {
          ticker: selectedStock.ticker,
          name: selectedStock.name,
          currentPrice: selectedStock.price,
          timeframe,
          historicalChange30d: change30d,
          volatility30d: indicators.volatility30d,
          rsi: indicators.rsi,
          macd: indicators.macd,
          sma50: indicators.sma50,
          sma200: indicators.sma200,
          userScenario: scenario || '',
        };

        const res = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = (await res.json()) as QuantitativeForecastResponse;
          setGeminiForecast(data);
        } else {
          console.warn('Fallback: Server API returned non-200');
        }
      } catch (err) {
        console.error('Failed to fetch prediction:', err);
      } finally {
        setGeminiLoading(false);
      }
    },
    [selectedStock, timeframe, indicators]
  );

  // Trigger initial forecast on stock change or timeframe change
  useEffect(() => {
    fetchGeminiPrediction();
  }, [fetchGeminiPrediction]);

  // Save prediction to Firestore
  const handleSavePrediction = async () => {
    const target = geminiForecast ? geminiForecast.baseTargetPrice : monteCarlo.medianFinalPrice;
    const signal = geminiForecast ? geminiForecast.directionalSignal : arimaLstm.signal;
    const conf = geminiForecast ? geminiForecast.confidenceScore : monteCarlo.probGainPercent;

    const record: Omit<SavedPredictionRecord, 'id'> = {
      userId: user?.uid || 'guest_user',
      ticker: selectedStock.ticker,
      modelType: 'Ensemble (GBM + LSTM + Gemini)',
      timeframe,
      currentPrice: selectedStock.price,
      predictedPrice: target,
      directionalSignal: signal,
      confidenceScore: conf,
      summary:
        geminiForecast?.quantitativeThesis ||
        `Monte Carlo median expectation of $${target} with 95% VaR at -${monteCarlo.var95Percent}%.`,
      createdAt: new Date().toISOString(),
    };

    if (user) {
      try {
        const id = await savePredictionRecord(record);
        setSavedPredictions((prev) => [{ id, ...record }, ...prev]);
      } catch (err) {
        console.error('Failed saving prediction to Firestore:', err);
      }
    } else {
      // Local session save for guests
      setSavedPredictions((prev) => [
        { id: `guest_${Date.now()}`, ...record },
        ...prev,
      ]);
    }
  };

  // Paper Trade execution
  const handleExecuteTrade = (ticker: string, shares: number, isBuy: boolean): boolean => {
    const tradeStock = STOCK_UNIVERSE.find((s) => s.ticker === ticker) || selectedStock;
    const totalAmount = shares * tradeStock.price;

    if (isBuy) {
      if (totalAmount > cashBalance) return false;
      setCashBalance((prev) => prev - totalAmount);

      setPositions((prev) => {
        const existing = prev.find((p) => p.ticker === ticker);
        if (existing) {
          const newShares = existing.shares + shares;
          const newAvg = (existing.shares * existing.averagePrice + totalAmount) / newShares;
          return prev.map((p) =>
            p.ticker === ticker
              ? { ...p, shares: newShares, averagePrice: +newAvg.toFixed(2) }
              : p
          );
        } else {
          return [
            ...prev,
            {
              ticker,
              name: tradeStock.name,
              shares,
              averagePrice: tradeStock.price,
            },
          ];
        }
      });
    } else {
      const existing = positions.find((p) => p.ticker === ticker);
      if (!existing || existing.shares < shares) return false;

      setCashBalance((prev) => prev + totalAmount);
      setPositions((prev) =>
        prev
          .map((p) => {
            if (p.ticker === ticker) {
              const remaining = p.shares - shares;
              return { ...p, shares: remaining };
            }
            return p;
          })
          .filter((p) => p.shares > 0)
      );
    }

    // If logged in, sync portfolio to Firestore
    if (user) {
      saveUserPortfolio(user.uid, {
        cashBalance: isBuy ? cashBalance - totalAmount : cashBalance + totalAmount,
      }).catch(console.error);
    }

    return true;
  };

  const handleClosePosition = (ticker: string) => {
    const pos = positions.find((p) => p.ticker === ticker);
    if (pos) {
      handleExecuteTrade(ticker, pos.shares, false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        selectedStock={selectedStock}
        onSelectStock={setSelectedStock}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={() => signOutUser()}
        onOpenSavedModal={() => setIsSavedModalOpen(true)}
        cashBalance={cashBalance}
        savedPredictionsCount={savedPredictions.length}
      />

      {/* Main Terminal Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Fundamental Asset Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-md flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Market Cap</span>
              <span className="text-white font-bold">{selectedStock.marketCap}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">P/E Ratio</span>
              <span className="text-white font-bold">{selectedStock.peRatio}x</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">52W Range</span>
              <span className="text-slate-300">
                ${selectedStock.low52w.toFixed(1)} – ${selectedStock.high52w.toFixed(1)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Beta (Market β)</span>
              <span className="text-cyan-400 font-bold">{selectedStock.beta}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">RSI Momentum</span>
              <span
                className={`font-bold ${
                  indicators.rsi > 70
                    ? 'text-rose-400'
                    : indicators.rsi < 30
                    ? 'text-emerald-400'
                    : 'text-blue-400'
                }`}
              >
                {indicators.rsi.toFixed(1)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">30D Volatility</span>
              <span className="text-amber-400 font-bold">
                {(indicators.volatility30d * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!user && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-sans font-semibold transition"
              >
                Sign in with Google to sync
              </button>
            )}
          </div>
        </div>

        {/* Prediction Metrics & Signal Panel */}
        <PredictionMetricsPanel
          stock={selectedStock}
          monteCarlo={monteCarlo}
          arimaLstm={arimaLstm}
          geminiForecast={geminiForecast}
          timeframe={timeframe}
          onSavePrediction={handleSavePrediction}
          onTriggerPaperTrade={() => setActiveTab('trading')}
          isLoggedIn={!!user}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        {/* Section Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 gap-2 overflow-x-auto no-scrollbar font-mono text-xs">
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold transition whitespace-nowrap ${
              activeTab === 'chart'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Interactive Chart & Cone</span>
          </button>

          <button
            onClick={() => setActiveTab('monte_carlo')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold transition whitespace-nowrap ${
              activeTab === 'monte_carlo'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Monte Carlo Simulation</span>
          </button>

          <button
            onClick={() => setActiveTab('gemini')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold transition whitespace-nowrap ${
              activeTab === 'gemini'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Gemini AI Quant Reasoning</span>
          </button>

          <button
            onClick={() => setActiveTab('trading')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold transition whitespace-nowrap ${
              activeTab === 'trading'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Paper Trading Sandbox</span>
          </button>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'chart' && (
          <StockChart
            stock={selectedStock}
            monteCarlo={monteCarlo}
            arimaLstm={arimaLstm}
            indicators={indicators}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            targetPrice={geminiForecast?.baseTargetPrice}
          />
        )}

        {activeTab === 'monte_carlo' && (
          <MonteCarloSimulator
            stock={selectedStock}
            monteCarlo={monteCarlo}
            volMultiplier={volMultiplier}
            onVolMultiplierChange={setVolMultiplier}
            driftModifier={driftModifier}
            onDriftModifierChange={setDriftModifier}
            numPaths={numPaths}
            onNumPathsChange={setNumPaths}
            onRecalculate={() => setRecalcTrigger((p) => p + 1)}
            horizonDays={horizonDays}
          />
        )}

        {activeTab === 'gemini' && (
          <GeminiQuantAnalysis
            stock={selectedStock}
            indicators={indicators}
            timeframe={timeframe}
            forecast={geminiForecast}
            loading={geminiLoading}
            onRunForecast={fetchGeminiPrediction}
          />
        )}

        {activeTab === 'trading' && (
          <PaperTradingPanel
            stock={selectedStock}
            cashBalance={cashBalance}
            positions={positions}
            onExecuteTrade={handleExecuteTrade}
            onClosePosition={handleClosePosition}
            isLoggedIn={!!user}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>QuantPulse Institutional Stochastic Engine v2.4</span>
          </div>
          <div>
            Powered by Google Gemini 3.8 Flash & Firebase Cloud Firestore
          </div>
        </div>
      </footer>

      {/* Google Login & Signup Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
        }}
      />

      {/* Saved Predictions Modal */}
      <SavedPredictionsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        predictions={savedPredictions}
        onSelectStock={(stock) => {
          setSelectedStock(stock);
          setActiveTab('chart');
        }}
        isLoggedIn={!!user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />
    </div>
  );
}
