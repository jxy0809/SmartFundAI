import { FundHolding } from '../types';

const STORAGE_KEY = 'smartfund_portfolio_v1';

export const getStoredHoldings = (): FundHolding[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load holdings", e);
    return [];
  }
};

export const saveHoldings = (holdings: FundHolding[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  } catch (e) {
    console.error("Failed to save holdings", e);
  }
};

export const addHolding = (holding: FundHolding): FundHolding[] => {
  const current = getStoredHoldings();
  const updated = [...current, holding];
  saveHoldings(updated);
  return updated;
};

export const updateHolding = (id: string, updates: Partial<FundHolding>): FundHolding[] => {
  const current = getStoredHoldings();
  const updated = current.map(h => h.id === id ? { ...h, ...updates } : h);
  saveHoldings(updated);
  return updated;
};

export const removeHolding = (id: string): FundHolding[] => {
  const current = getStoredHoldings();
  const updated = current.filter(h => h.id !== id);
  saveHoldings(updated);
  return updated;
};
