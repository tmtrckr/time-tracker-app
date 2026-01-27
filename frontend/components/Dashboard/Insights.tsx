import { Lightbulb, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { formatDuration } from '../../utils';
import type { CategoryStats, AppStats } from '../../types';

interface InsightsProps {
  totalDuration: number;
  productiveDuration: number;
  categories: CategoryStats[];
  topApps: AppStats[];
  uncategorizedCount: number;
}

export default function Insights({ 
  totalDuration, 
  productiveDuration, 
  categories,
  topApps,
  uncategorizedCount 
}: InsightsProps) {
  const insights: Array<{
    type: 'success' | 'warning' | 'info';
    icon: typeof Lightbulb;
    title: string;
    message: string;
  }> = [];

  const productivePercentage = totalDuration > 0 
    ? (productiveDuration / totalDuration) * 100 
    : 0;

  // Productivity insights (lowered threshold to 15 minutes)
  if (productivePercentage >= 70 && totalDuration > 900) {
    insights.push({
      type: 'success',
      icon: CheckCircle2,
      title: 'Great Productivity!',
      message: `You're spending ${productivePercentage.toFixed(0)}% of your time on productive activities. Keep it up!`,
    });
  } else if (productivePercentage < 50 && totalDuration > 900) {
    insights.push({
      type: 'warning',
      icon: AlertCircle,
      title: 'Low Productivity',
      message: `Only ${productivePercentage.toFixed(0)}% of your time is productive. Consider reviewing your categories.`,
    });
  }

  // Uncategorized activities insight (always show if there are uncategorized apps)
  if (uncategorizedCount > 0) {
    insights.push({
      type: 'info',
      icon: Lightbulb,
      title: 'Uncategorized Activities',
      message: `You have ${uncategorizedCount} uncategorized ${uncategorizedCount === 1 ? 'app' : 'apps'}. Categorize them to get better insights.`,
    });
  }

  // Time distribution insight (lowered threshold to 30 minutes)
  if (categories.length > 0 && totalDuration > 1800) {
    const topCategory = categories[0];
    const topCategoryPercentage = topCategory.percentage;
    
    if (topCategoryPercentage > 50) {
      insights.push({
        type: 'info',
        icon: Clock,
        title: 'Focus Area',
        message: `You're spending ${topCategoryPercentage.toFixed(0)}% of your time on "${topCategory.category.name}".`,
      });
    }
  }

  // Top app insight (lowered threshold to 15 minutes)
  if (topApps.length > 0 && totalDuration > 900) {
    const topApp = topApps[0];
    const topAppPercentage = totalDuration > 0 
      ? (topApp.duration_sec / totalDuration) * 100 
      : 0;
    
    if (topAppPercentage > 30) {
      insights.push({
        type: 'info',
        icon: TrendingUp,
        title: 'Most Used App',
        message: `${topApp.app_name} accounts for ${topAppPercentage.toFixed(0)}% of your tracked time.`,
      });
    }
  }

  // Always show a summary insight if there's any data
  if (insights.length === 0 && totalDuration > 0) {
    insights.push({
      type: 'info',
      icon: Lightbulb,
      title: 'Tracking Summary',
      message: `You've tracked ${formatDuration(totalDuration)} today. ${productivePercentage.toFixed(0)}% of your time is productive.`,
    });
  }

  if (insights.length === 0) {
    return null;
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-700 dark:text-green-400';
      case 'warning':
        return 'text-yellow-700 dark:text-yellow-400';
      default:
        return 'text-blue-700 dark:text-blue-400';
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';
    }
  };

  const getIconBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/50';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/50';
      default:
        return 'bg-blue-100 dark:bg-blue-900/50';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-all duration-200 hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-800/20">
          <Lightbulb className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Insights</h3>
      </div>
      
      <div className="space-y-2 flex-1">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div
              key={index}
              className={`flex items-start gap-2.5 p-3 rounded-lg border ${getBgColor(insight.type)} transition-all duration-200 hover:shadow-sm`}
            >
              <div className={`p-1.5 rounded-lg flex-shrink-0 ${getIconBgColor(insight.type)}`}>
                <Icon className={`w-4 h-4 ${getIconColor(insight.type)}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                  {insight.title}
                </p>
                <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                  {insight.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
