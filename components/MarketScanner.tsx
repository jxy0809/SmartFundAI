
import React, { useState } from 'react';
import { screenFunds } from '../services/geminiService';
import { FundRecommendation } from '../types';
import { Search, Loader2, Filter, AlertTriangle, ChevronRight } from 'lucide-react';

const MarketScanner: React.FC = () => {
  const [filters, setFilters] = useState({
    type: '混合型',
    risk: '中风险',
    minReturn: '10%以上'
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FundRecommendation[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleScreen = async () => {
    setLoading(true);
    setResults([]);
    try {
      const data = await screenFunds(filters);
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
         <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Filter size={20} /></div>
            <h2 className="text-lg font-bold text-gray-800">智能选基</h2>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">基金类型</label>
               <select 
                 value={filters.type}
                 onChange={e => setFilters({...filters, type: e.target.value})}
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
               >
                 <option>股票型</option>
                 <option>混合型</option>
                 <option>债券型</option>
                 <option>指数型</option>
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">风险等级</label>
               <select 
                 value={filters.risk}
                 onChange={e => setFilters({...filters, risk: e.target.value})}
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
               >
                 <option>低风险</option>
                 <option>中低风险</option>
                 <option>中风险</option>
                 <option>中高风险</option>
                 <option>高风险</option>
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">近一年收益要求</label>
               <select 
                 value={filters.minReturn}
                 onChange={e => setFilters({...filters, minReturn: e.target.value})}
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
               >
                 <option>不限</option>
                 <option>正收益</option>
                 <option>5%以上</option>
                 <option>10%以上</option>
                 <option>20%以上</option>
               </select>
            </div>
         </div>

         <div className="mt-6 flex justify-end">
            <button 
              onClick={handleScreen}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
            >
               {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
               AI 智能筛选
            </button>
         </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
         {loading && (
           <div className="text-center py-12">
              <Loader2 className="animate-spin mx-auto text-blue-500 mb-3" size={32} />
              <p className="text-gray-500">AI 正在全网检索匹配的基金...</p>
           </div>
         )}

         {!loading && hasSearched && results.length === 0 && (
           <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-500">未找到符合条件的基金，请尝试降低筛选要求。</p>
           </div>
         )}

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {results.map((fund, idx) => (
             <div key={idx} className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-3xl -mr-4 -mt-4 z-0"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                     <div>
                       <h3 className="font-bold text-gray-800">{fund.name}</h3>
                       <div className="flex gap-2 mt-1">
                          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{fund.code}</span>
                          <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{fund.type}</span>
                          <span className="text-xs bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded">{fund.risk}</span>
                       </div>
                     </div>
                     <div className="text-right">
                        <div className="text-xs text-gray-400">近一年</div>
                        <div className="text-lg font-bold text-red-500">{fund.returnRate1Y || '--'}</div>
                     </div>
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                     <span className="font-semibold text-blue-600 text-xs uppercase tracking-wider mb-1 block">AI 推荐理由</span>
                     {fund.reason}
                  </div>
                </div>
             </div>
           ))}
         </div>
         
         {results.length > 0 && (
           <div className="flex items-center gap-2 text-xs text-gray-400 justify-center mt-4">
             <AlertTriangle size={12} />
             数据由 AI 检索生成，仅供参考，不构成投资建议。
           </div>
         )}
      </div>
    </div>
  );
};

export default MarketScanner;
