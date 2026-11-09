import React, { useState } from 'react';
import {
  TrendingUp,
  Activity,
  Search,
  User as UserIcon,
  LogOut,
  BookmarkCheck,
  Briefcase,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { StockQuote } from '../types/stock';
import { STOCK_UNIVERSE } from '../data/stockUniverse';

interface NavbarProps {
  selectedStock: StockQuote;
  onSelectStock: (stock: StockQuote) => void;
  user: User | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenSavedModal: () => void;
  cashBalance: number;
  savedPredictionsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedStock,
  onSelectStock,
  user,
  onOpenAuth,
  onSignOut,
  onOpenSavedModal,
  cashBalance,
  savedPredictionsCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const filteredStocks = STOCK_UNIVERSE.filter(
    (s) =>
      s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 text-slate-100">
      {/* Top Ticker Tape */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-1.5 overflow-x-auto no-scrollbar flex items-center gap-6 text-xs font-mono">
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold uppercase tracking-wider shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          MARKETS LIVE
        </span>
        <div className="flex items-center gap-6 shrink-0">
          {STOCK_UNIVERSE.map((stock) => {
            const isPos = stock.change >= 0;
            return (
              <button
                key={stock.ticker}
                onClick={() => onSelectStock(stock)}
                className={`flex items-center gap-2 hover:bg-slate-800/60 px-2 py-0.5 rounded transition ${
                  selectedStock.ticker === stock.ticker ? 'bg-slate-800 text-blue-400 font-bold' : 'text-slate-300'
                }`}
              >
                <span>{stock.ticker}</span>
                <span className="text-slate-100">${stock.price.toFixed(2)}</span>
                <span className={isPos ? 'text-emerald-400' : 'text-rose-400'}>
                  {isPos ? '+' : ''}
                  {stock.changePercent.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                QuantPulse
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PRO ML
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Algorithmic Price Forecast & Stochastic Risk Terminal
            </p>
          </div>
        </div>

        {/* Search & Selector */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticker (e.g. NVDA, AAPL, TSLA)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 font-mono transition"
            />
          </div>

          {/* Search Dropdown */}
          {isSearchOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsSearchOpen(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-30 max-h-72 overflow-y-auto">
                <div className="px-3 py-1 text-[11px] font-mono uppercase text-slate-500 font-semibold">
                  Available Assets ({filteredStocks.length})
                </div>
                {filteredStocks.map((stock) => (
                  <button
                    key={stock.ticker}
                    onClick={() => {
                      onSelectStock(stock);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full px-4 py-2 flex items-center justify-between hover:bg-slate-800/80 transition text-left"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-100 flex items-center gap-2">
                        {stock.ticker}
                        <span className="text-xs font-normal text-slate-400 font-sans">
                          {stock.name}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">{stock.sector}</span>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-slate-100 font-semibold">${stock.price.toFixed(2)}</div>
                      <div
                        className={`text-xs ${
                          stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {stock.change >= 0 ? '+' : ''}
                        {stock.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Virtual Portfolio Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <Briefcase className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Paper Cash:</span>
            <span className="text-emerald-400 font-bold">
              ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Saved Predictions Button */}
          <button
            onClick={onOpenSavedModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-slate-800 hover:border-slate-600 text-xs font-medium text-slate-200 transition"
            title="Saved Predictions"
          >
            <BookmarkCheck className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Saved Log</span>
            {savedPredictionsCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {savedPredictionsCount}
              </span>
            )}
          </button>

          {/* User Auth Section */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-slate-900 border border-slate-700/80 hover:border-slate-600 transition"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-blue-500/50"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">
                    {user.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span className="text-xs font-medium text-slate-200 max-w-[100px] truncate hidden sm:block">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-30 divide-y divide-slate-800">
                    <div className="px-4 py-2.5">
                      <div className="font-semibold text-sm text-slate-100 truncate">
                        {user.displayName || 'Quantitative User'}
                      </div>
                      <div className="text-xs text-slate-400 truncate">{user.email}</div>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Google Auth Verified
                      </div>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenSavedModal();
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <BookmarkCheck className="w-4 h-4 text-cyan-400" />
                        My Saved Model Reports
                      </button>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onSignOut();
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/20 transition active:scale-95"
            >
              <UserIcon className="w-4 h-4" />
              <span>Google Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
