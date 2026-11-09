import React, { useState, useMemo, useRef } from 'react';
import {
  StockCandle,
  StockQuote,
  MonteCarloSimulationResult,
  ArimaLstmResult,
  TechnicalIndicators,
} from '../types/stock';
import {
  Layers,
  Activity,
  Maximize2,
  TrendingUp,
  BarChart2,
  Eye,
  Sliders,
} from 'lucide-react';

interface StockChartProps {
  stock: StockQuote;
  monteCarlo: MonteCarloSimulationResult;
  arimaLstm: ArimaLstmResult;
  indicators: TechnicalIndicators;
  timeframe: '1D' | '7D' | '30D' | '90D';
  onTimeframeChange: (tf: '1D' | '7D' | '30D' | '90D') => void;
  targetPrice?: number;
}

export type ChartDisplayMode = 'cone' | 'monte_carlo' | 'candles' | 'line';

export const StockChart: React.FC<StockChartProps> = ({
  stock,
  monteCarlo,
  arimaLstm,
  indicators,
  timeframe,
  onTimeframeChange,
  targetPrice,
}) => {
  const [displayMode, setDisplayMode] = useState<ChartDisplayMode>('cone');
  const [showSMA, setShowSMA] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [activeSubchart, setActiveSubchart] = useState<'none' | 'rsi' | 'macd'>('rsi');
  const [hoverIndex, setHoverIndex] = useState<{ isFuture: boolean; index: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Historical data window
  const historical = useMemo(() => {
    // Show last 60 candles for clarity on chart
    return stock.historicalData.slice(-60);
  }, [stock]);

  // Dimensions
  const width = 850;
  const mainHeight = 360;
  const subHeight = activeSubchart !== 'none' ? 95 : 0;
  const totalSvgHeight = mainHeight + (subHeight > 0 ? subHeight + 25 : 0);
  const padding = { top: 25, right: 75, bottom: 35, left: 20 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = mainHeight - padding.top - padding.bottom;

  // Total points along X axis = historical.length + future days
  const futureDates = monteCarlo.dates;
  const totalXPoints = historical.length + futureDates.length;

  // Determine min and max price across historical + predictions
  const { minPrice, maxPrice } = useMemo(() => {
    const histLows = historical.map((c) => c.low);
    const histHighs = historical.map((c) => c.high);

    let allMin = Math.min(...histLows);
    let allMax = Math.max(...histHighs);

    if (displayMode === 'cone' || displayMode === 'monte_carlo') {
      const mcMin = Math.min(...monteCarlo.p5Path);
      const mcMax = Math.max(...monteCarlo.p95Path);
      allMin = Math.min(allMin, mcMin);
      allMax = Math.max(allMax, mcMax);
    }

    if (showBollinger) {
      allMax = Math.max(allMax, indicators.bollingerUpper);
      allMin = Math.min(allMin, indicators.bollingerLower);
    }

    if (targetPrice) {
      allMin = Math.min(allMin, targetPrice * 0.98);
      allMax = Math.max(allMax, targetPrice * 1.02);
    }

    // Add 5% headroom
    const buffer = (allMax - allMin) * 0.08;
    return {
      minPrice: Math.max(1, allMin - buffer),
      maxPrice: allMax + buffer,
    };
  }, [historical, monteCarlo, displayMode, showBollinger, targetPrice, indicators]);

  // Coordinate scales
  const getX = (index: number) => {
    return padding.left + (index / (totalXPoints - 1)) * plotWidth;
  };

  const getY = (price: number) => {
    const ratio = (price - minPrice) / (maxPrice - minPrice);
    return padding.top + plotHeight - ratio * plotHeight;
  };

  // Split X point between historical and forecast
  const splitIndex = historical.length - 1;
  const splitX = getX(splitIndex);

  // SVG Paths for Historical Line
  const histPathD = useMemo(() => {
    return historical
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(c.close).toFixed(1)}`)
      .join(' ');
  }, [historical, minPrice, maxPrice]);

  const histAreaD = useMemo(() => {
    if (historical.length === 0) return '';
    const firstX = getX(0).toFixed(1);
    const lastX = getX(historical.length - 1).toFixed(1);
    const bottomY = (padding.top + plotHeight).toFixed(1);
    return `${histPathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [histPathD, historical, plotHeight]);

  // Future Prediction Cone Paths
  const cone95PathD = useMemo(() => {
    const upperPoints = monteCarlo.p95Path.map((p, i) => `${getX(splitIndex + i)} ${getY(p)}`);
    const lowerPoints = monteCarlo.p5Path
      .map((p, i) => `${getX(splitIndex + i)} ${getY(p)}`)
      .reverse();
    return `M ${upperPoints.join(' L ')} L ${lowerPoints.join(' L ')} Z`;
  }, [monteCarlo, splitIndex, minPrice, maxPrice]);

  const cone50PathD = useMemo(() => {
    const upperPoints = monteCarlo.p75Path.map((p, i) => `${getX(splitIndex + i)} ${getY(p)}`);
    const lowerPoints = monteCarlo.p25Path
      .map((p, i) => `${getX(splitIndex + i)} ${getY(p)}`)
      .reverse();
    return `M ${upperPoints.join(' L ')} L ${lowerPoints.join(' L ')} Z`;
  }, [monteCarlo, splitIndex, minPrice, maxPrice]);

  const medianPathD = useMemo(() => {
    return monteCarlo.p50Path
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(splitIndex + i).toFixed(1)} ${getY(p).toFixed(1)}`)
      .join(' ');
  }, [monteCarlo, splitIndex, minPrice, maxPrice]);

  const arimaPathD = useMemo(() => {
    return arimaLstm.predictedPath
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(splitIndex + i).toFixed(1)} ${getY(p).toFixed(1)}`)
      .join(' ');
  }, [arimaLstm, splitIndex, minPrice, maxPrice]);

  // Handle pointer scrub
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = (clientX - padding.left) / plotWidth;
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const targetIdx = Math.round(clampedRatio * (totalXPoints - 1));

    if (targetIdx <= splitIndex) {
      setHoverIndex({ isFuture: false, index: targetIdx });
    } else {
      setHoverIndex({ isFuture: true, index: targetIdx - splitIndex });
    }
  };

  const currentHoverData = useMemo(() => {
    if (!hoverIndex) return null;
    if (!hoverIndex.isFuture) {
      const c = historical[hoverIndex.index];
      if (!c) return null;
      return {
        isFuture: false,
        date: c.date,
        price: c.close,
        open: c.open,
        high: c.high,
        low: c.low,
        volume: c.volume,
        x: getX(hoverIndex.index),
        y: getY(c.close),
      };
    } else {
      const idx = hoverIndex.index;
      const date = futureDates[idx - 1] || 'Future';
      const median = monteCarlo.p50Path[idx] || stock.price;
      const upper = monteCarlo.p95Path[idx] || median;
      const lower = monteCarlo.p5Path[idx] || median;
      return {
        isFuture: true,
        date,
        price: median,
        upper,
        lower,
        x: getX(splitIndex + idx),
        y: getY(median),
      };
    }
  }, [hoverIndex, historical, futureDates, monteCarlo, splitIndex, stock.price]);

  // Horizontal price grid lines
  const priceGridTicks = useMemo(() => {
    const count = 5;
    const ticks = [];
    const step = (maxPrice - minPrice) / (count - 1);
    for (let i = 0; i < count; i++) {
      const price = minPrice + i * step;
      ticks.push({
        price: +price.toFixed(2),
        y: getY(price),
      });
    }
    return ticks;
  }, [minPrice, maxPrice]);

  return (
    <div
      ref={containerRef}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4 text-slate-100"
    >
      {/* Chart Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        {/* Stock Title & Live Price */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold font-mono text-white">
                {stock.ticker}
              </span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                {stock.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {stock.sector}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5 font-mono">
              <span className="text-2xl font-black text-slate-100">
                ${stock.price.toFixed(2)}
              </span>
              <span
                className={`text-sm font-bold ${
                  stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {stock.change >= 0 ? '+' : ''}
                {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* View Mode & Horizon Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Horizon Pills */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono text-xs">
            {(['1D', '7D', '30D', '90D'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Model Display Mode */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setDisplayMode('cone')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                displayMode === 'cone'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Forecast Cone</span>
            </button>
            <button
              onClick={() => setDisplayMode('monte_carlo')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                displayMode === 'monte_carlo'
                  ? 'bg-purple-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Monte Carlo</span>
            </button>
            <button
              onClick={() => setDisplayMode('candles')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                displayMode === 'candles'
                  ? 'bg-slate-700 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Candles</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-toolbar for Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200 transition">
            <input
              type="checkbox"
              checked={showSMA}
              onChange={(e) => setShowSMA(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0"
            />
            <span className="text-amber-400 font-semibold">SMA 50 (${indicators.sma50.toFixed(2)})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200 transition">
            <input
              type="checkbox"
              checked={showBollinger}
              onChange={(e) => setShowBollinger(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0"
            />
            <span className="text-cyan-400 font-semibold">Bollinger Bands</span>
          </label>
        </div>

        {/* Subchart toggle */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[11px]">Subchart:</span>
          {(['rsi', 'macd', 'none'] as const).map((sc) => (
            <button
              key={sc}
              onClick={() => setActiveSubchart(sc)}
              className={`px-2 py-0.5 rounded text-[11px] uppercase transition ${
                activeSubchart === sc
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {sc}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive SVG Chart Viewport */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${totalSvgHeight}`}
          className="w-full h-auto cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {/* Historical Area Gradient */}
            <linearGradient id="histAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>

            {/* 95% Confidence Cone Gradient */}
            <linearGradient id="cone95Grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.12" />
            </linearGradient>

            {/* 50% Confidence Cone Gradient */}
            <linearGradient id="cone50Grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {priceGridTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                stroke="#1e293b"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={width - padding.right + 8}
                y={tick.y + 4}
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
              >
                ${tick.price.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Vertical boundary line separating history from prediction */}
          <line
            x1={splitX}
            y1={padding.top}
            x2={splitX}
            y2={padding.top + plotHeight}
            stroke="#38bdf8"
            strokeDasharray="4 4"
            strokeWidth="1.5"
            strokeOpacity="0.7"
          />
          <text
            x={splitX + 6}
            y={padding.top + 14}
            fill="#38bdf8"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
          >
            FORECAST HORIZON ({timeframe})
          </text>

          {/* Bollinger Bands */}
          {showBollinger && (
            <g opacity="0.6">
              <line
                x1={padding.left}
                y1={getY(indicators.bollingerUpper)}
                x2={width - padding.right}
                y2={getY(indicators.bollingerUpper)}
                stroke="#06b6d4"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <line
                x1={padding.left}
                y1={getY(indicators.bollingerLower)}
                x2={width - padding.right}
                y2={getY(indicators.bollingerLower)}
                stroke="#06b6d4"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
            </g>
          )}

          {/* SMA 50 Line across history */}
          {showSMA && (
            <line
              x1={padding.left}
              y1={getY(indicators.sma50)}
              x2={splitX}
              y2={getY(indicators.sma50)}
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeOpacity="0.8"
            />
          )}

          {/* Historical Area & Line */}
          {displayMode !== 'candles' && (
            <>
              <path d={histAreaD} fill="url(#histAreaGrad)" />
              <path
                d={histPathD}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Candlesticks view */}
          {displayMode === 'candles' &&
            historical.map((c, i) => {
              const x = getX(i);
              const openY = getY(c.open);
              const closeY = getY(c.close);
              const highY = getY(c.high);
              const lowY = getY(c.low);
              const isUp = c.close >= c.open;
              const color = isUp ? '#10b981' : '#f43f5e';
              const candleW = Math.max(3, plotWidth / totalXPoints * 0.7);

              return (
                <g key={i}>
                  {/* Wick */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={color}
                    strokeWidth="1.2"
                  />
                  {/* Body */}
                  <rect
                    x={x - candleW / 2}
                    y={Math.min(openY, closeY)}
                    width={candleW}
                    height={Math.max(2, Math.abs(closeY - openY))}
                    fill={color}
                    rx="1"
                  />
                </g>
              );
            })}

          {/* Mode: Forecast Cone */}
          {displayMode === 'cone' && (
            <>
              {/* 95% Confidence Band */}
              <path d={cone95PathD} fill="url(#cone95Grad)" />
              {/* 50% Confidence Band */}
              <path d={cone50PathD} fill="url(#cone50Grad)" />

              {/* ARIMA/LSTM Hybrid Path (Cyan Dotted) */}
              <path
                d={arimaPathD}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2"
                strokeDasharray="4 3"
              />

              {/* Median Forecast Path (Bright Purple) */}
              <path
                d={medianPathD}
                fill="none"
                stroke="#a855f7"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* End Target Circle & Tag */}
              {monteCarlo.p50Path.length > 0 && (
                <g>
                  <circle
                    cx={getX(totalXPoints - 1)}
                    cy={getY(monteCarlo.medianFinalPrice)}
                    r="5"
                    fill="#a855f7"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <rect
                    x={getX(totalXPoints - 1) + 8}
                    y={getY(monteCarlo.medianFinalPrice) - 12}
                    width="62"
                    height="22"
                    rx="4"
                    fill="#a855f7"
                  />
                  <text
                    x={getX(totalXPoints - 1) + 12}
                    y={getY(monteCarlo.medianFinalPrice) + 3}
                    fill="#ffffff"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    ${monteCarlo.medianFinalPrice.toFixed(1)}
                  </text>
                </g>
              )}
            </>
          )}

          {/* Mode: Monte Carlo Individual Stochastic Paths */}
          {displayMode === 'monte_carlo' && (
            <g>
              {monteCarlo.paths.map((p, idx) => {
                const pathD = p.values
                  .map(
                    (val, step) =>
                      `${step === 0 ? 'M' : 'L'} ${getX(splitIndex + step).toFixed(1)} ${getY(
                        val
                      ).toFixed(1)}`
                  )
                  .join(' ');
                return (
                  <path
                    key={p.id}
                    d={pathD}
                    fill="none"
                    stroke={idx % 2 === 0 ? '#38bdf8' : '#c084fc'}
                    strokeWidth="1"
                    strokeOpacity="0.35"
                  />
                );
              })}
              {/* Overlay Median Line */}
              <path
                d={medianPathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
              />
            </g>
          )}

          {/* Hover Crosshair & Tooltip */}
          {currentHoverData && (
            <g>
              {/* Vertical line */}
              <line
                x1={currentHoverData.x}
                y1={padding.top}
                x2={currentHoverData.x}
                y2={padding.top + plotHeight}
                stroke="#94a3b8"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              {/* Horizontal line */}
              <line
                x1={padding.left}
                y1={currentHoverData.y}
                x2={width - padding.right}
                y2={currentHoverData.y}
                stroke="#94a3b8"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              {/* Dot */}
              <circle
                cx={currentHoverData.x}
                cy={currentHoverData.y}
                r="4.5"
                fill={currentHoverData.isFuture ? '#a855f7' : '#3b82f6'}
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}

          {/* SUBCHART: RSI */}
          {activeSubchart === 'rsi' && (
            <g transform={`translate(0, ${mainHeight + 10})`}>
              <rect
                x={padding.left}
                y="0"
                width={plotWidth}
                height={subHeight}
                fill="#020617"
                rx="6"
              />
              {/* Overbought 70 */}
              <line
                x1={padding.left}
                y1={(1 - 70 / 100) * subHeight}
                x2={width - padding.right}
                y2={(1 - 70 / 100) * subHeight}
                stroke="#f43f5e"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              {/* Oversold 30 */}
              <line
                x1={padding.left}
                y1={(1 - 30 / 100) * subHeight}
                x2={width - padding.right}
                y2={(1 - 30 / 100) * subHeight}
                stroke="#10b981"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <text
                x={width - padding.right + 6}
                y={(1 - 70 / 100) * subHeight + 4}
                fill="#f43f5e"
                fontSize="9"
                fontFamily="monospace"
              >
                70
              </text>
              <text
                x={width - padding.right + 6}
                y={(1 - 30 / 100) * subHeight + 4}
                fill="#10b981"
                fontSize="9"
                fontFamily="monospace"
              >
                30
              </text>
              <text
                x={padding.left + 8}
                y="14"
                fill="#94a3b8"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
              >
                RSI (14): <tspan fill="#38bdf8">{indicators.rsi.toFixed(1)}</tspan>
              </text>
            </g>
          )}

          {/* SUBCHART: MACD */}
          {activeSubchart === 'macd' && (
            <g transform={`translate(0, ${mainHeight + 10})`}>
              <rect
                x={padding.left}
                y="0"
                width={plotWidth}
                height={subHeight}
                fill="#020617"
                rx="6"
              />
              <line
                x1={padding.left}
                y1={subHeight / 2}
                x2={width - padding.right}
                y2={subHeight / 2}
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x={padding.left + 8}
                y="14"
                fill="#94a3b8"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
              >
                MACD (12,26,9):{' '}
                <tspan fill="#38bdf8">{indicators.macd.toFixed(2)}</tspan> | Hist:{' '}
                <tspan
                  fill={indicators.macdHistogram >= 0 ? '#10b981' : '#f43f5e'}
                >
                  {indicators.macdHistogram.toFixed(2)}
                </tspan>
              </text>
            </g>
          )}
        </svg>

        {/* Floating Tooltip Box */}
        {currentHoverData && (
          <div
            className="absolute top-3 left-4 bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono shadow-2xl pointer-events-none z-10 backdrop-blur"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-400">{currentHoverData.date}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  currentHoverData.isFuture
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                {currentHoverData.isFuture ? 'PREDICTED' : 'HISTORICAL'}
              </span>
            </div>

            {currentHoverData.isFuture ? (
              <div className="space-y-0.5">
                <div>
                  Median Projection: <span className="text-purple-400 font-bold">${currentHoverData.price?.toFixed(2)}</span>
                </div>
                {currentHoverData.upper && (
                  <div className="text-[11px] text-slate-400">
                    95% Interval: ${currentHoverData.lower?.toFixed(2)} – ${currentHoverData.upper?.toFixed(2)}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
                <div>
                  Close: <span className="text-white font-bold">${currentHoverData.price?.toFixed(2)}</span>
                </div>
                <div>
                  Open: <span className="text-slate-300">${currentHoverData.open?.toFixed(2)}</span>
                </div>
                <div>
                  High: <span className="text-emerald-400">${currentHoverData.high?.toFixed(2)}</span>
                </div>
                <div>
                  Low: <span className="text-rose-400">${currentHoverData.low?.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80 text-xs text-slate-400 font-mono">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-500 rounded" />
            <span>Historical Close</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-purple-500 rounded" />
            <span>Monte Carlo Median</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-cyan-400" />
            <span>ARIMA-LSTM Sequence</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-cyan-500/20 rounded" />
            <span>95% Confidence Interval</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          Scrub chart to inspect daily stochastic quantiles
        </div>
      </div>
    </div>
  );
};
