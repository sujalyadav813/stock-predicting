import React from 'react';
import {
  X,
  BookmarkCheck,
  TrendingUp,
  ArrowRight,
  Calendar,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { SavedPredictionRecord } from '../firebase';
import { STOCK_UNIVERSE } from '../data/stockUniverse';
import { StockQuote } from '../types/stock';

interface SavedPredictionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  predictions: SavedPredictionRecord[];
  onSelectStock: (stock: StockQuote) => void;
  isLoggedIn: boolean;
  onOpenAuth: () => void;
}

export const SavedPredictionsModal: React.FC<SavedPredictionsModalProps> = ({
  isOpen,
  onClose,
  predictions,
  onSelectStock,
  isLoggedIn,
  onOpenAuth,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 text-slate-100 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Saved Quantitative Predictions</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                  {predictions.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Track historical predictive accuracy against actual subsequent market movement.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Content */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {predictions.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-mono space-y-2">
              <p>No saved predictions found yet.</p>
              <p className="text-slate-500">
                Run a prediction in the terminal and click &ldquo;Save Prediction&rdquo; to log your model theses.
              </p>
            </div>
          ) : (
            predictions.map((p) => {
              const stock = STOCK_UNIVERSE.find((s) => s.ticker === p.ticker);
              const returnPercent = (
                ((p.predictedPrice - p.currentPrice) / p.currentPrice) *
                100
              ).toFixed(2);
              const isGain = p.predictedPrice >= p.currentPrice;

              return (
                <div
                  key={p.id || `${p.ticker}_${p.createdAt}`}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-base font-extrabold text-white">
                        {p.ticker}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {p.timeframe}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {p.modelType}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 font-mono flex items-center gap-3">
                      <span>Base: ${p.currentPrice.toFixed(2)}</span>
                      <span>&rarr;</span>
                      <span className="text-white font-bold">
                        Target: ${p.predictedPrice.toFixed(2)}
                      </span>
                      <span
                        className={`font-bold ${
                          isGain ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        ({isGain ? '+' : ''}
                        {returnPercent}%)
                      </span>
                    </div>

                    {p.summary && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 max-w-md pt-0.5">
                        {p.summary}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right font-mono text-[11px] text-slate-500">
                      <div>Confidence: {p.confidenceScore}%</div>
                      <div>
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Recent'}
                      </div>
                    </div>

                    {stock && (
                      <button
                        onClick={() => {
                          onSelectStock(stock);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 transition active:scale-95"
                      >
                        <span>Analyze</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {!isLoggedIn && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Predictions in this session are stored locally. Sign in with Google to sync to your cloud account.
            </span>
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="text-blue-400 hover:text-blue-300 font-semibold underline shrink-0 ml-2"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
