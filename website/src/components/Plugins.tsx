import { FC } from 'react';
import { Puzzle, Code, Package, Zap, Shield, Download, ExternalLink } from 'lucide-react';
import { getGitHubUrl } from '../config';

const Plugins: FC = () => {
  const capabilities = [
    {
      title: 'Extend Database Schemas',
      description: 'Add custom tables and fields to store plugin-specific data',
      icon: Package,
    },
    {
      title: 'Custom UI Components',
      description: 'Build React components that integrate seamlessly with the app',
      icon: Code,
    },
    {
      title: 'Query Filters',
      description: 'Hook into data processing pipelines and filter queries',
      icon: Zap,
    },
    {
      title: 'Plugin Marketplace',
      description: 'Discover and install plugins from registries or GitHub',
      icon: Download,
    },
  ];


  return (
    <section id="plugins" className="py-16 px-4 bg-white dark:bg-gray-900">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
            <Puzzle className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Extensible Plugin System
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Extend TimeTracker with custom plugins. Build powerful extensions using our Plugin SDK, 
            or install plugins from the marketplace to add new features.
          </p>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {capabilities.map((capability, index) => {
            const IconComponent = capability.icon;
            return (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-600 dark:hover:border-primary-500 hover:shadow-lg transition-all"
              >
                <div className="mb-4">
                  <IconComponent className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {capability.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {capability.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Link to Marketplace */}
        <div className="mb-12 text-center">
          <a
            href="/#/marketplace"
            className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold text-lg"
          >
            Browse Plugin Marketplace
            <Download className="w-5 h-5" />
          </a>
        </div>

        {/* Developer Information */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/50 dark:to-primary-800/50 rounded-lg p-8 border border-primary-200 dark:border-primary-800">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <Code className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Build Your Own Plugin
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                TimeTracker provides a comprehensive Plugin SDK written in Rust. Plugins can extend 
                database schemas, add custom UI components, register query filters, and interact with 
                core application data. All plugins are dynamically loaded at runtime.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Shield className="w-4 h-4 text-primary-600 dark:text-primary-400 mr-2" />
                  <span>Secure plugin architecture with sandboxed execution</span>
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Zap className="w-4 h-4 text-primary-600 dark:text-primary-400 mr-2" />
                  <span>Dynamic loading - no app restart required</span>
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Package className="w-4 h-4 text-primary-600 dark:text-primary-400 mr-2" />
                  <span>Plugin Marketplace for easy discovery and installation</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={getGitHubUrl('/blob/main/docs/PLUGIN_DEVELOPMENT.md')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  <Code className="w-5 h-5 mr-2" />
                  Plugin Development Guide
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
                <a
                  href={getGitHubUrl('/blob/main/docs/SDK_REFERENCE.md')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center border-2 border-primary-600 dark:border-primary-500 text-primary-600 dark:text-primary-400 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/50 transition-colors"
                >
                  SDK Reference
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Plugin SDK</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Built with Rust, available on crates.io. Provides all the tools you need to build powerful plugins.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Dynamic Loading</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Plugins are loaded as dynamic libraries (.dll/.so/.dylib) at runtime. No app restart required.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Plugin Registry</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Support for multiple plugin registries. Install plugins from GitHub releases or custom registries.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Plugins;
