import React from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subValue, trend, icon }) => {
  const trendColor = trend === 'up' ? 'text-market-up' : trend === 'down' ? 'text-market-down' : 'text-gray-500';
  const bgColor = trend === 'up' ? 'bg-red-50' : trend === 'down' ? 'bg-green-50' : 'bg-gray-50';

  return (
    <div className={`p-6 rounded-xl shadow-sm border border-gray-100 bg-white hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className={`text-2xl font-bold ${trendColor}`}>{value}</h3>
          {subValue && (
            <p className={`text-xs mt-1 font-medium ${trendColor} bg-opacity-10 px-2 py-0.5 rounded-full inline-block ${bgColor}`}>
              {subValue}
            </p>
          )}
        </div>
        {icon && <div className="p-3 bg-blue-50 rounded-lg text-blue-600">{icon}</div>}
      </div>
    </div>
  );
};

export default StatsCard;