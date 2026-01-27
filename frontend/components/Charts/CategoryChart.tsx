import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  TooltipProps,
  LegendProps,
} from 'recharts';
import { CategoryUsage } from '../../types';
import { formatDuration } from '../../utils/format';

interface CategoryChartProps {
  data: CategoryUsage[];
  totalTime: number;
}

interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
  icon: string;
  percentage: string;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ data, totalTime }) => {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>No data to display</p>
        </div>
      </div>
    );
  }

  const chartData = data.map(item => ({
    name: item.category.name,
    value: item.duration_sec,
    color: item.category.color,
    icon: item.category.icon,
    percentage: totalTime > 0 ? ((item.duration_sec / totalTime) * 100).toFixed(1) : 0,
  }));

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <span>{data.icon}</span>
            <span className="font-medium text-gray-900 dark:text-white">{data.name}</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {formatDuration(data.value)} ({data.percentage}%)
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: LegendProps) => (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
      {payload?.map((entry, index: number) => (
        <div key={index} className="flex items-center gap-1.5 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600 dark:text-gray-400">{entry.value}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryChart;
