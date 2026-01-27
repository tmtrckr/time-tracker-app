import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatDuration } from '../../utils';
import type { CategoryStats } from '../../types';

interface CategoryChartProps {
  categories: CategoryStats[];
}

export default function CategoryChart({ categories }: CategoryChartProps) {
  const data = categories.map((cat) => ({
    name: cat.category.name,
    value: cat.duration_sec,
    color: cat.category.color,
    icon: cat.category.icon,
    percentage: cat.percentage,
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof data[0] }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
          <p className="font-semibold text-gray-900 dark:text-white mb-1">
            {item.icon} {item.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {formatDuration(item.value)} ({item.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = () => (
    <ul className="flex flex-wrap gap-3 justify-center">
      {data.map((item) => (
        <li key={item.name} className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <span
            className="w-3 h-3 rounded-full shadow-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-gray-700 dark:text-gray-300 font-medium">{item.icon} {item.name}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
          <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">By Category</h3>
      </div>
      
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {renderLegend()}
    </div>
  );
}
