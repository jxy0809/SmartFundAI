
import React, { useState } from 'react';
import { FundHolding, SortConfig } from '../types';
import { Trash2, RefreshCw, TrendingUp, TrendingDown, ChevronUp, ChevronDown, BarChart2 } from 'lucide-react';

interface PortfolioProps {
  holdings: FundHolding[];
  onRemove: (id: string) => void;
  onRefresh: () => void;
  onSelectFund: (fund: FundHolding) => void;
  isRefreshing: boolean;
}

const Portfolio: React.FC<PortfolioProps> = ({ holdings, onRemove, onRefresh, onSelectFund, isRefreshing }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'marketValue', direction: 'desc' });

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getSortedHoldings = () => {
    return [...holdings].sort((a, b) => {
      const aMarket = a.shares * a.currentNav;
      const bMarket = b.shares * b.currentNav;
      const aProfit = aMarket - (a.shares * a.costPrice);
      const bProfit = bMarket - (b.shares * b.costPrice);
      const aRate = ((a.currentNav - a.costPrice) / a.costPrice);
      const bRate = ((b.currentNav - b.costPrice) / b.costPrice);

      let valA: number | string = 0;
      let valB: number | string = 0;

      switch (sortConfig.key) {
        case 'marketValue': valA = aMarket; valB = bMarket; break;
        case 'profit': valA = aProfit; valB = bProfit; break;
        case 'profitRate': valA = aRate; valB = bRate; break;
        case 'currentNav': valA = a.currentNav; valB = b.currentNav; break;
        case 'shares': valA = a.shares; valB = b.shares; break;
        case 'name': valA = a.name; valB = b.name; break;
        default: valA = 0; valB = 0;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const SortIcon = ({ column }: { column: SortConfig['key'] }) => {
    if (sortConfig.key !== column) return <div className="w-4 h-4 ml-1 inline-block opacity-0 group-hover:opacity-30" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="ml-1 inline-block" /> : <ChevronDown size={14} className="ml-1 inline-block" />;
  };

  if (holdings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <TrendingUp className="text-gray-400" size={32} />
        </div>
        <h3 className="text-lg font-medium text-gray-900">暂无持仓</h3>
        <p className="text-gray-500 mt-2 text-sm max-w-xs">
          点击右上角的 "+" 按钮添加您的第一只基金，开始追踪收益。
        </p>
      </div>
    );
  }

  const sortedHoldings = getSortedHoldings();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold text-gray-800">持仓详情 ({holdings.length})</h3>
        <button 
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? '更新净值中...' : '刷新净值'}
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('name')}>
                基金名称 / 代码 <SortIcon column="name" />
              </th>
              <th className="px-6 py-3 font-medium text-right cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('shares')}>
                持有份额 <SortIcon column="shares" />
              </th>
              <th className="px-6 py-3 font-medium text-right cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('currentNav')}>
                成本 / 最新 <SortIcon column="currentNav" />
              </th>
              <th className="px-6 py-3 font-medium text-right cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('marketValue')}>
                持有金额 <SortIcon column="marketValue" />
              </th>
              <th className="px-6 py-3 font-medium text-right cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('profit')}>
                收益 / 率 <SortIcon column="profit" />
              </th>
              <th className="px-6 py-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedHoldings.map((fund) => {
              const marketValue = fund.shares * fund.currentNav;
              const costValue = fund.shares * fund.costPrice;
              const profit = marketValue - costValue;
              const profitRate = ((fund.currentNav - fund.costPrice) / fund.costPrice) * 100;
              const isProfitable = profit >= 0;

              return (
                <tr key={fund.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 cursor-pointer" onClick={() => onSelectFund(fund)}>
                    <div className="flex items-center gap-2">
                       <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{fund.name}</div>
                       <BarChart2 size={14} className="text-gray-300 group-hover:text-blue-400" />
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">{fund.code}</div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-700">
                    {fund.shares.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-mono text-gray-900">{fund.currentNav.toFixed(4)}</div>
                    <div className="font-mono text-xs text-gray-400 mt-0.5">{fund.costPrice.toFixed(4)}</div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-medium text-gray-900">
                    ¥{marketValue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className={`font-mono font-bold ${isProfitable ? 'text-market-up' : 'text-market-down'}`}>
                      {profit > 0 ? '+' : ''}{profit.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-xs font-mono mt-0.5 flex items-center justify-end gap-1 ${isProfitable ? 'text-market-up' : 'text-market-down'}`}>
                      {isProfitable ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {profitRate.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => onRemove(fund.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 bg-gray-50 text-xs text-gray-400 text-right border-t border-gray-100">
        点击列表查看基金走势详情
      </div>
    </div>
  );
};

export default Portfolio;
