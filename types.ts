
export interface FundHolding {
  id: string; // Unique ID for the holding record
  code: string; // Fund Code (e.g., "001234")
  name: string;
  costPrice: number; // Purchase NAV
  shares: number; // Number of shares held
  currentNav: number; // Last known NAV
  lastUpdate: string; // ISO date string of last update
  type?: string; // e.g. "Mixed", "Equity"
  riskLevel?: string; // e.g. "High", "Medium"
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
}

export interface PortfolioStats {
  totalCost: number;
  totalValue: number;
  totalProfit: number;
  profitRate: number;
  todayProfit: number; // Estimated
}

export type ViewMode = 'dashboard' | 'chat' | 'market' | 'scanner';

export interface SortConfig {
  key: keyof FundHolding | 'marketValue' | 'profit' | 'profitRate';
  direction: 'asc' | 'desc';
}

export interface FundRecommendation {
  code: string;
  name: string;
  type: string;
  returnRate1Y?: string;
  risk?: string;
  reason: string;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  ma5?: number;
  ma20?: number;
}
