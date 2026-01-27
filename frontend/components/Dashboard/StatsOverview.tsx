import { Clock, TrendingUp, Target } from 'lucide-react';
import { formatDuration, calculatePercentage } from '../../utils';

interface StatsOverviewProps {
  totalDuration: number;
  productiveDuration: number;
}

export default function StatsOverview({ totalDuration, productiveDuration }: StatsOverviewProps) {
  const productivePercentage = calculatePercentage(productiveDuration, totalDuration);

  const stats = [
    {
      label: 'Total Time',
      value: formatDuration(totalDuration),
      icon: Clock,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100 dark:bg-primary-900/20',
    },
    {
      label: 'Productive',
      value: formatDuration(productiveDuration),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      label: 'Productivity',
      value: `${productivePercentage}%`,
      icon: Target,
      color: productivePercentage >= 70 ? 'text-green-600' : productivePercentage >= 50 ? 'text-yellow-600' : 'text-red-600',
      bgColor: productivePercentage >= 70 ? 'bg-green-100 dark:bg-green-900/20' : productivePercentage >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-red-100 dark:bg-red-900/20',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 h-full flex flex-col">
      <div className="space-y-4 flex-1">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-4"
            >
              <div className={`p-3 rounded-xl ${stat.bgColor} shadow-sm flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${stat.color} dark:opacity-90`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
