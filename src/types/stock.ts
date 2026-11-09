export interface StockCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockQuote {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  peRatio: number;
  high52w: number;
  low52w: number;
  volume24h: string;
  beta: number;
  dividendYield: number;
  historicalData: StockCandle[];
}

export interface TechnicalIndicators {
  sma20: number;
  sma50: number;
  sma200: number;
  rsi: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;
  volatility30d: number;
  atr14: number;
}

export interface MonteCarloPath {
  id: number;
  values: number[];
}

export interface MonteCarloSimulationResult {
  dates: string[];
  paths: MonteCarloPath[];
  meanPath: number[];
  p5Path: number[];
  p25Path: number[];
  p50Path: number[]; // Median
  p75Path: number[];
  p95Path: number[];
  finalPrices: number[];
  expectedReturnPercent: number;
  var95Percent: number; // Value at Risk 95%
  probGainPercent: number; // Probability of positive return
  medianFinalPrice: number;
  standardDeviation: number;
}

export interface ArimaLstmResult {
  dates: string[];
  predictedPath: number[];
  upperBound: number[];
  lowerBound: number[];
  finalPrice: number;
  expectedReturnPercent: number;
  mape: number; // Mean Absolute Percentage Error (e.g. 2.1%)
  rmse: number; // Root Mean Square Error
  directionalAccuracyPercent: number; // e.g. 78.4%
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
}

export interface ModelPredictionEnsemble {
  ticker: string;
  timeframe: '1D' | '7D' | '30D' | '90D';
  currentPrice: number;
  monteCarlo: MonteCarloSimulationResult;
  arimaLstm: ArimaLstmResult;
  geminiQuant?: {
    baseTargetPrice: number;
    bullTargetPrice: number;
    bearTargetPrice: number;
    directionalSignal: string;
    confidenceScore: number;
    expectedReturnPercent: number;
    volatilityRegime: string;
    supportLevel: number;
    resistanceLevel: number;
    keyCatalysts: string[];
    riskFactors: string[];
    quantitativeThesis: string;
    technicalSummary: string;
  };
  consensusPrice: number;
  consensusSignal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  consensusConfidence: number;
}
