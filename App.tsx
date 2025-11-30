import React, { useState, useEffect, useMemo } from 'react';
import { getStoredHoldings, addHolding, removeHolding, updateHolding, saveHoldings } from './services/storageService';
import { updateFundPrices } from './services/geminiService';
import { FundHolding, PortfolioStats, ViewMode } from './types';
import StatsCard from './components/StatsCard';
import Portfolio from './components/Portfolio';
import ChatInterface from './components/ChatInterface';
import AddFundModal from './components/AddFundModal';
import MarketScanner from './components/MarketScanner';
import FundDetailModal from './components/FundDetailModal';
import { LayoutDashboard, Wallet, MessageSquareText, Plus, PieChart, ArrowUpRight, Search, Activity, TrendingUp } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend } from 'recharts';

function App() {
  const [holdings, setHoldings] = useState<FundHolding[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState<FundHolding | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize data
  useEffect(() => {
    setHoldings(getStoredHoldings());
  }, []);

  // Calculate Global Stats
  const stats: PortfolioStats = useMemo(() => {
    let totalCost = 0;
    let totalValue = 0;
    
    holdings.forEach(h => {
      totalCost += h.shares * h.costPrice;
      totalValue += h.shares * h.currentNav;
    });

    const totalProfit = totalValue - totalCost;
    const profitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return {
      totalCost,
      totalValue,
      totalProfit,
      profitRate,
      todayProfit: 0 // Would need yesterday's NAV to calc real daily change, simplified here
    };
  }, [holdings]);

  // Handlers
  const handleAddFund = (newHolding: FundHolding) => {
    const updated = addHolding(newHolding);
    setHoldings(updated);
  };

  const handleRemoveFund = (id: string) => {
    if (window.confirm('确定要删除这只基金吗？')) {
      const updated = removeHolding(id);
      setHoldings(updated);
    }
  };

  const handleRefreshPrices = async () => {
    if (isRefreshing || holdings.length === 0) return;
    setIsRefreshing(true);
    try {
      const updatedHoldings = await updateFundPrices(holdings);
      setHoldings(updatedHoldings);
      saveHoldings(updatedHoldings); // Persist updated prices
    } catch (e) {
      console.error(e);
      alert('更新价格失败，请稍后再试。');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Pie Chart Data
  const pieData = holdings.map(h => ({
    name: h.name,
    value: h.shares * h.currentNav
  }));
  const PIE_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#10B981', '#F59E0B'];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-900">
      
      {/* Sidebar / Mobile Nav */}
      <aside className="bg-white border-r border-gray-200 md:w-64 md:h-screen sticky top-0 md:flex flex-col z-10 hidden">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <PieChart className="text-blue-600" />
            SmartFund AI
          </h1>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
          <button 
            onClick={() => setViewMode('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${viewMode === 'dashboard' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutDashboard size={20} />
            总览看板
          </button>
          <button 
             onClick={() => setViewMode('market')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${viewMode === 'market' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Wallet size={20} />
            持仓管理
          </button>
          <button 
             onClick={() => setViewMode('scanner')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${viewMode === 'scanner' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Search size={20} />
            市场选基
          </button>
          <button 
             onClick={() => setViewMode('chat')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${viewMode === 'chat' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <MessageSquareText size={20} />
            AI 顾问
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <h4 className="font-semibold text-sm mb-1">组合分析</h4>
            <p className="text-xs text-indigo-100 mb-3">您的夏普比率: <strong>1.42</strong> (优)</p>
            <button 
              onClick={() => setViewMode('dashboard')}
              className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors backdrop-blur-sm"
            >
              查看详情
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h1 className="font-bold text-gray-800 flex items-center gap-2">
            <PieChart className="text-blue-600" size={20}/> SmartFund
          </h1>
          <div className="flex gap-2">
             <button onClick={() => setViewMode('dashboard')} className={`p-2 rounded-lg ${viewMode === 'dashboard' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}><LayoutDashboard size={20}/></button>
             <button onClick={() => setViewMode('market')} className={`p-2 rounded-lg ${viewMode === 'market' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}><Wallet size={20}/></button>
             <button onClick={() => setViewMode('scanner')} className={`p-2 rounded-lg ${viewMode === 'scanner' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}><Search size={20}/></button>
          </div>
        </div>

        {/* Header Action */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {viewMode === 'dashboard' && '资产组合透视'}
              {viewMode === 'market' && '持仓管理'}
              {viewMode === 'chat' && '智能顾问'}
              {viewMode === 'scanner' && '市场选基'}
            </h2>
            <p className="text-gray-500 mt-1">
              {viewMode === 'dashboard' && '实时追踪您的财富增长与风险指标'}
              {viewMode === 'market' && '点击列表查看 K线图 与 技术指标'}
              {viewMode === 'chat' && '基于 Gemini 模型的深度投资分析'}
              {viewMode === 'scanner' && 'AI 驱动的智能选基与筛选工具'}
            </p>
          </div>
          {viewMode !== 'chat' && viewMode !== 'scanner' && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl shadow-lg shadow-gray-200 hover:shadow-xl transition-all flex items-center gap-2 font-medium"
            >
              <Plus size={18} />
              添加基金
            </button>
          )}
        </div>

        {/* View: Dashboard */}
        {viewMode === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard 
                title="总资产 (CNY)" 
                value={`¥${stats.totalValue.toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
                trend={stats.totalProfit >= 0 ? 'up' : 'down'}
                icon={<Wallet size={24}/>}
              />
              <StatsCard 
                title="累计收益 (CNY)" 
                value={`${stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
                subValue={`${stats.profitRate.toFixed(2)}%`}
                trend={stats.totalProfit >= 0 ? 'up' : 'down'}
                icon={<ArrowUpRight size={24}/>}
              />
              <StatsCard 
                title="夏普比率 (Sharpe)" 
                value="1.42"
                subValue="优于 85% 组合"
                trend="up"
                icon={<Activity size={24}/>}
              />
              <StatsCard 
                title="日收益 (预估)" 
                value="+¥124.50"
                subValue="+0.32%"
                trend="up"
                icon={<TrendingUp size={24}/>}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                 <Portfolio 
                    holdings={holdings} 
                    onRemove={handleRemoveFund} 
                    onRefresh={handleRefreshPrices} 
                    onSelectFund={setSelectedFund}
                    isRefreshing={isRefreshing} 
                 />
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                <h3 className="font-semibold text-gray-800 mb-6">资产配置分析</h3>
                <div className="flex-1 min-h-[300px]">
                  {holdings.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={pieData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <ReTooltip 
                          formatter={(value: number) => `¥${value.toLocaleString()}`}
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                      暂无数据
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View: Market/Portfolio Only */}
        {viewMode === 'market' && (
           <Portfolio 
              holdings={holdings} 
              onRemove={handleRemoveFund} 
              onRefresh={handleRefreshPrices} 
              onSelectFund={setSelectedFund}
              isRefreshing={isRefreshing} 
           />
        )}

        {/* View: Scanner */}
        {viewMode === 'scanner' && (
           <MarketScanner />
        )}

        {/* View: Chat */}
        {viewMode === 'chat' && (
          <div className="max-w-4xl mx-auto">
             <ChatInterface holdings={holdings} />
          </div>
        )}

      </main>

      <AddFundModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddFund} 
      />

      {/* Fund Detail Modal */}
      {selectedFund && (
        <FundDetailModal 
          fund={selectedFund} 
          onClose={() => setSelectedFund(null)} 
        />
      )}
    </div>
  );
}

export default App;