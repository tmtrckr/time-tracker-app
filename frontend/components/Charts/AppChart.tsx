import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from 'recharts';
import { AppUsage } from '../../types';
import { formatDuration } from '../../utils/format';

interface AppChartProps {
  data: AppUsage[];
  limit?: number;
}

interface ChartDataPoint {
  name: string;
  fullName: string;
  value: number;
  color: string;
  icon: string;
}

const AppChart: React.FC<AppChartProps> = ({ data, limit = 10 }) => {
  const chartData = data.slice(0, limit).map((app) => ({
    name: app.app_name.length > 15 ? app.app_name.slice(0, 15) + '...' : app.app_name,
    fullName: app.app_name,
    value: app.duration_sec,
    color: app.category?.color || '#6B7280',
    icon: app.category?.icon || '📱',
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">📱</div>
          <p>No data to display</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <span>{data.icon}</span>
            <span className="font-medium text-gray-900 dark:text-white">{data.fullName}</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {formatDuration(data.value)}
          </div>
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number) => {
    if (value >= 3600) {
      return `${Math.floor(value / 3600)}h`;
    }
    return `${Math.floor(value / 60)}m`;
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <XAxis type="number" tickFormatter={formatYAxis} />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AppChart;
