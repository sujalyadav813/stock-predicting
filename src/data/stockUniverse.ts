import { StockCandle, StockQuote } from '../types/stock';

/**
 * Generate synthetic yet realistic historical market series matching exact volatility,
 * trends, and statistical properties of institutional assets.
 */
function generateHistoricalSeries(
  basePrice: number,
  annualVolatility: number,
  annualDrift: number,
  trendFactor: number,
  days: number = 180
): StockCandle[] {
  const candles: StockCandle[] = [];
  const dt = 1 / 252;
  const dailyVol = annualVolatility * Math.sqrt(dt);
  const dailyDrift = (annualDrift - 0.5 * annualVolatility * annualVolatility) * dt;

  let currentPrice = basePrice;
  const now = new Date();
  
  // Work backwards from today
  const rawCloses: number[] = [basePrice];
  
  // Seed random generator deterministically based on basePrice
  let seed = Math.floor(basePrice * 100);
  const pseudoRand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const boxMuller = () => {
    const u1 = Math.max(1e-6, pseudoRand());
    const u2 = pseudoRand();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  };

  for (let i = 1; i < days; i++) {
    const z = boxMuller();
    // Add cycle momentum and slight mean reversion
    const cycle = Math.sin((i / 20) * Math.PI) * (dailyVol * 0.4);
    const returnStep = dailyDrift + dailyVol * z + cycle * trendFactor;
    currentPrice = Math.max(10, currentPrice / Math.exp(returnStep));
    rawCloses.unshift(currentPrice);
  }

  // Build daily candles
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    
    // Skip weekends for realistic market calendar
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const close = +rawCloses[i].toFixed(2);
    const dayIntraVol = dailyVol * (0.8 + pseudoRand() * 0.4);
    const open = +(close * (1 + (pseudoRand() - 0.5) * dayIntraVol)).toFixed(2);
    const high = +(Math.max(open, close) * (1 + pseudoRand() * dayIntraVol)).toFixed(2);
    const low = +(Math.min(open, close) * (1 - pseudoRand() * dayIntraVol)).toFixed(2);
    const volume = Math.floor(15000000 + pseudoRand() * 45000000);

    candles.push({
      date: d.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume,
    });
  }

  return candles;
}

export const STOCK_UNIVERSE: StockQuote[] = [
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Semiconductors & AI',
    price: 138.45,
    change: +4.82,
    changePercent: +3.61,
    marketCap: '$3.40T',
    peRatio: 52.4,
    high52w: 153.12,
    low52w: 75.60,
    volume24h: '58.2M',
    beta: 1.68,
    dividendYield: 0.03,
    historicalData: generateHistoricalSeries(138.45, 0.44, 0.38, 1.2, 160),
  },
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Consumer Electronics',
    price: 228.80,
    change: +1.65,
    changePercent: +0.73,
    marketCap: '$3.48T',
    peRatio: 33.8,
    high52w: 237.23,
    low52w: 164.08,
    volume24h: '42.1M',
    beta: 1.04,
    dividendYield: 0.44,
    historicalData: generateHistoricalSeries(228.80, 0.22, 0.16, 0.7, 160),
  },
  {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    sector: 'Automotive & Clean Energy',
    price: 248.60,
    change: -3.20,
    changePercent: -1.27,
    marketCap: '$792.5B',
    peRatio: 64.1,
    high52w: 271.00,
    low52w: 138.80,
    volume24h: '78.5M',
    beta: 2.25,
    dividendYield: 0.00,
    historicalData: generateHistoricalSeries(248.60, 0.58, 0.24, -0.4, 160),
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Software & Cloud',
    price: 432.15,
    change: +3.90,
    changePercent: +0.91,
    marketCap: '$3.21T',
    peRatio: 35.6,
    high52w: 468.35,
    low52w: 366.50,
    volume24h: '21.4M',
    beta: 1.15,
    dividendYield: 0.71,
    historicalData: generateHistoricalSeries(432.15, 0.23, 0.18, 0.8, 160),
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    sector: 'Interactive Media & Search',
    price: 176.30,
    change: +2.10,
    changePercent: +1.21,
    marketCap: '$2.18T',
    peRatio: 23.9,
    high52w: 191.75,
    low52w: 129.40,
    volume24h: '28.9M',
    beta: 1.10,
    dividendYield: 0.45,
    historicalData: generateHistoricalSeries(176.30, 0.28, 0.22, 0.9, 160),
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com, Inc.',
    sector: 'E-Commerce & AWS',
    price: 194.50,
    change: +2.85,
    changePercent: +1.49,
    marketCap: '$2.02T',
    peRatio: 41.2,
    high52w: 201.20,
    low52w: 118.35,
    volume24h: '34.7M',
    beta: 1.28,
    dividendYield: 0.00,
    historicalData: generateHistoricalSeries(194.50, 0.31, 0.25, 1.1, 160),
  },
  {
    ticker: 'META',
    name: 'Meta Platforms, Inc.',
    sector: 'Social Media & Reality Labs',
    price: 588.90,
    change: +8.40,
    changePercent: +1.45,
    marketCap: '$1.49T',
    peRatio: 27.8,
    high52w: 602.95,
    low52w: 279.40,
    volume24h: '15.6M',
    beta: 1.34,
    dividendYield: 0.34,
    historicalData: generateHistoricalSeries(588.90, 0.33, 0.35, 1.3, 160),
  },
  {
    ticker: 'AMD',
    name: 'Advanced Micro Devices',
    sector: 'Semiconductors',
    price: 154.20,
    change: -1.80,
    changePercent: -1.15,
    marketCap: '$249.8B',
    peRatio: 112.5,
    high52w: 227.30,
    low52w: 94.04,
    volume24h: '39.4M',
    beta: 1.72,
    dividendYield: 0.00,
    historicalData: generateHistoricalSeries(154.20, 0.48, 0.15, -0.2, 160),
  },
  {
    ticker: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    sector: 'Broad Market ETF',
    price: 585.40,
    change: +3.25,
    changePercent: +0.56,
    marketCap: '$598.2B',
    peRatio: 26.2,
    high52w: 589.60,
    low52w: 433.20,
    volume24h: '52.3M',
    beta: 1.00,
    dividendYield: 1.22,
    historicalData: generateHistoricalSeries(585.40, 0.14, 0.14, 0.9, 160),
  },
  {
    ticker: 'QQQ',
    name: 'Invesco QQQ Trust',
    sector: 'Tech Index ETF',
    price: 494.80,
    change: +4.60,
    changePercent: +0.94,
    marketCap: '$289.4B',
    peRatio: 30.5,
    high52w: 503.52,
    low52w: 350.10,
    volume24h: '38.1M',
    beta: 1.18,
    dividendYield: 0.58,
    historicalData: generateHistoricalSeries(494.80, 0.18, 0.20, 1.0, 160),
  },
];
