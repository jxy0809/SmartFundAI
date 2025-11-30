import React, { useState, useMemo } from 'react';
import { FundHolding, ChartDataPoint } from '../types';
import { X, TrendingUp, TrendingDown, Activity, Info, BarChart2 } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ComposedChart, Bar, Line
} from 'recharts';

interface FundDetailModalProps {
  fund: FundHolding | null;
  onClose: () => void;
}

// Helper to generate mock historical data since we don't have a real historical API
const generateMockData = (currentNav: number, days: number): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  let price = currentNav * (0.85 + Math.random() * 0.1); // Start slightly lower/higher
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    // Random walk
    const change = (Math.random() - 0.48) * (price * 0.02); 
    price += change;
    
    // Create OHLC simulation
    const open = price;
    const close = price + (Math.random() - 0.5) * (price * 0.01);
    const high = Math.max(open, close) + Math.random() * (price * 0.005);
    const low = Math.min(open, close) - Math.random() * (price * 0.005);
    
    // Ensure last point matches current Nav roughly if it's the last day (simplified)
    if (i === days - 1) {
       // Snap closer to real current Nav for visual consistency
       // price = currentNav;
    }

    data.push({
      date: date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
      value: close,
      open, high, low, close,
      ma5: i > 4 ? (price + data[i-1].value + data[i-2].value + data[i-3].value + data[i-4].value) / 5 : undefined,
      ma20: i > 19 ? price : undefined // Simplified
    });
  }
  return data;
};

const FundDetailModal: React.FC<FundDetailModalProps> = ({ fund, onClose }) => {
  const [period, setPeriod] = useState<'1M' | '3M' | '6M' | '1Y'>('3M');
  const [chartType, setChartType] = useState<'line' | 'kline'>('line');
  const [showMA, setShowMA] = useState(false);

  // Generate data on fly
  const chartData = useMemo(() => {
    if (!fund) return [];
    let days = 90;
    if (period === '1M') days = 30;
    if (period === '6M') days = 180;
    if (period === '1Y') days = 365;
    return generateMockData(fund.currentNav, days);
  }, [fund, period]);

  if (!fund) return null;

  const profitRate = ((fund.currentNav - fund.costPrice) / fund.costPrice) * 100;
  const isProfitable = profitRate >= 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50">
          <div>
             <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">{fund.name}</h2>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-mono font-medium">{fund.code}</span>
                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">混合型 (模拟)</span>
             </div>
             <div className="mt-2 flex items-center gap-4 text-sm">
                <span className="text-gray-500">最新净值: <span className="text-gray-900 font-bold font-mono text-lg">{fund.currentNav.toFixed(4)}</span></span>
                <span className={`flex items-center gap-1 ${isProfitable ? 'text-market-up' : 'text-market-down'}`}>
                   持仓收益率: 
                   {isProfitable ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                   <span className="font-bold">{profitRate.toFixed(2)}%</span>
                </span>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
           {/* Chart Controls */}
           <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
              <div className="flex bg-gray-100 p-1 rounded-lg">
                 {(['1M', '3M', '6M', '1Y'] as const).map(p => (
                   <button 
                     key={p} 
                     onClick={() => setPeriod(p)}
                     className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                   >
                     {p}
                   </button>
                 ))}
              </div>
              
              <div className="flex gap-3">
                 <button 
                   onClick={() => setShowMA(!showMA)}
                   className={`px-3 py-1.5 text-xs border rounded-lg transition-colors flex items-center gap-1 ${showMA ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-600'}`}
                 >
                   <Activity size={14} /> MA均线
                 </button>
                 <button 
                   onClick={() => setChartType(chartType === 'line' ? 'kline' : 'line')}
                   className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                 >
                   <BarChart2 size={14} /> 
                   {chartType === 'line' ? '切换K线' : '切换走势'}
                 </button>
              </div>
           </div>

           {/* Chart Area */}
           <div className="h-[350px] w-full border border-gray-100 rounded-xl bg-white p-2">
             <ResponsiveContainer width="100%" height="100%">
               {chartType === 'line' ? (
                 <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{fontSize: 10, fill: '#9ca3af'}} tickLine={false} axisLine={false} />
                    <YAxis domain={['auto', 'auto']} tick={{fontSize: 10, fill: '#9ca3af'}} tickLine={false} axisLine={false} width={40} />
                    <Tooltip 
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      itemStyle={{fontSize: '12px'}}
                    />
                    <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" name="净值" />
                    {showMA && <Line type="monotone" dataKey="ma5" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="MA5" />}
                 </AreaChart>
               ) : (
                 <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{fontSize: 10, fill: '#9ca3af'}} tickLine={false} axisLine={false} />
                    <YAxis domain={['auto', 'auto']} tick={{fontSize: 10, fill: '#9ca3af'}} tickLine={false} axisLine={false} width={40} />
                    <Tooltip />
                    {/* Simulated Candle Sticks using Bars - requires more complex data struct usually, simplified here */}
                    <Bar dataKey="close" fill="#ef4444" barSize={4} name="收盘" />
                    <Line type="monotone" dataKey="ma5" stroke="#F59E0B" dot={false} strokeWidth={1} name="MA5" />
                 </ComposedChart>
               )}
             </ResponsiveContainer>
           </div>
           
           <div className="text-xs text-gray-400 mt-2 text-center flex items-center justify-center gap-1">
             <Info size={12} /> 数据为模拟演示，仅供功能展示参考
           </div>

           {/* Stats Grid */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                 <div className="text-xs text-gray-500 mb-1">夏普比率 (Sharpe)</div>
                 <div className="font-bold text-gray-900">1.84</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                 <div className="text-xs text-gray-500 mb-1">最大回撤</div>
                 <div className="font-bold text-green-600">-12.5%</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                 <div className="text-xs text-gray-500 mb-1">波动率</div>
                 <div className="font-bold text-gray-900">18.2%</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                 <div className="text-xs text-gray-500 mb-1">持有天数</div>
                 <div className="font-bold text-gray-900">124 天</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FundDetailModal;