import React, { useState } from 'react';
import { searchFundDetails } from '../services/geminiService';
import { FundHolding } from '../types';
import { Loader2, Search, Plus, X } from 'lucide-react';

interface AddFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (holding: FundHolding) => void;
}

const AddFundModal: React.FC<AddFundModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<{ name: string; code: string; nav: number; date: string } | null>(null);
  
  // Form inputs
  const [costPrice, setCostPrice] = useState<string>('');
  const [shares, setShares] = useState<string>('');

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setSearchResult(null);
    try {
      const result = await searchFundDetails(query);
      if (result) {
        setSearchResult(result);
        setCostPrice(result.nav.toString()); // Default cost to current NAV
      }
    } catch (e) {
      console.error(e);
      alert("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (!searchResult || !costPrice || !shares) return;
    
    const newHolding: FundHolding = {
      id: Date.now().toString(),
      code: searchResult.code,
      name: searchResult.name,
      currentNav: searchResult.nav,
      costPrice: parseFloat(costPrice),
      shares: parseFloat(shares),
      lastUpdate: new Date().toISOString()
    };
    
    onAdd(newHolding);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setQuery('');
    setSearchResult(null);
    setCostPrice('');
    setShares('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">添加自选基金</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">搜索基金 (代码或名称)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="例如: 001234 或 易方达蓝筹"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                onClick={handleSearch}
                disabled={loading || !query}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
              </button>
            </div>
            <p className="text-xs text-gray-400">AI 将实时查询最新净值数据</p>
          </div>

          {/* Result & Entry Section */}
          {searchResult && (
            <div className="space-y-4 border rounded-xl p-4 bg-blue-50 border-blue-100">
              <div>
                <h3 className="font-bold text-gray-900">{searchResult.name}</h3>
                <div className="flex gap-4 text-sm mt-1 text-gray-600">
                  <span>代码: <span className="font-mono">{searchResult.code}</span></span>
                  <span>最新净值: <span className="font-mono font-bold text-blue-600">{searchResult.nav}</span></span>
                </div>
                <div className="text-xs text-gray-400 mt-1">数据日期: {searchResult.date}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">持有份额</label>
                  <input
                    type="number"
                    step="0.01"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">持仓成本(单价)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0.0000"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">取消</button>
          <button 
            onClick={handleAdd}
            disabled={!searchResult || !shares || !costPrice}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm flex items-center gap-2 transition-all"
          >
            <Plus size={18} />
            确认添加
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFundModal;