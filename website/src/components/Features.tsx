import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Rocket, Target, Globe, BarChart, Lock, Monitor, Puzzle, Store } from 'lucide-react';

const Features: FC = () => {
  const features = [
    {
      title: 'Automatic Tracking',
      description: 'Tracks active window (application + title) using native APIs for maximum performance',
      Icon: Zap,
    },
    {
      title: 'Performance',
      description: '10-100x faster than competitors using native APIs. Minimal resource usage (<50MB RAM)',
      Icon: Rocket,
    },
    {
      title: 'Smart Idle Detection',
      description: 'Detects inactivity and prompts for activity classification - no more "no mouse = slacking"',
      Icon: Target,
    },
    {
      title: 'Domain Tracking',
      description: 'Automatic domain extraction from browser activities for better categorization',
      Icon: Globe,
    },
    {
      title: 'Reports & Analytics',
      description: 'Daily/weekly/monthly reports with charts, category breakdown, and insights',
      Icon: BarChart,
    },
    {
      title: 'Plugin System',
      description: 'Extensible architecture with Plugin SDK. Build custom plugins or install from marketplace',
      Icon: Puzzle,
      highlight: true,
      link: '/#plugins',
    },
    {
      title: 'Plugin Marketplace',
      description: 'Discover and install plugins from the community registry. Billable tracking, projects, Pomodoro, and more',
      Icon: Store,
      highlight: true,
      link: '/marketplace',
    },
    {
      title: 'Privacy-First',
      description: '100% local storage (SQLite). GDPR compliant. No cloud sync. Your data stays on your device.',
      Icon: Lock,
    },
    {
      title: 'Cross-Platform',
      description: 'Works on Windows, macOS, and Linux with native performance',
      Icon: Monitor,
    },
  ];

  return (
    <section id="features" className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
          Powerful Features
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Everything you need to track your time accurately and understand where it goes
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.Icon;
            const isHighlighted = feature.highlight;
            const content = (
              <>
                <div className="mb-3">
                  <IconComponent className={`w-8 h-8 ${isHighlighted ? 'text-primary-600' : 'text-primary-600'}`} />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${isHighlighted ? 'text-primary-600' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </>
            );

            const className = `bg-white rounded-lg p-6 border transition-all ${
              isHighlighted
                ? 'border-primary-600 shadow-md hover:shadow-lg hover:border-primary-700'
                : 'border-gray-200 hover:shadow-lg'
            }`;

            if (feature.link) {
              return (
                <Link
                  key={index}
                  to={feature.link}
                  className={className}
                >
                  {content}
                </Link>
              );
            }

            return (
              <div key={index} className={className}>
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
