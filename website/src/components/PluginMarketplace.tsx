import { FC, useState, useEffect } from 'react';
import { Package, ExternalLink, Download, Search, Filter, CheckCircle, XCircle } from 'lucide-react';

interface Plugin {
  id: string;
  name: string;
  author: string;
  repository: string;
  latest_version: string;
  description: string;
  category: string;
  verified: boolean;
  downloads: number;
  tags: string[];
  license?: string;
  icon?: string;
  homepage?: string;
}

interface RegistryData {
  plugins: Plugin[];
  statistics?: {
    total_plugins: number;
    total_versions: number;
    total_authors: number;
  };
}

const REGISTRY_URL = 'https://raw.githubusercontent.com/tmtrckr/plugins-registry/main/registry.json';

const PluginMarketplace: FC = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [filteredPlugins, setFilteredPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchPlugins = async () => {
      try {
        setLoading(true);
        const response = await fetch(REGISTRY_URL);
        if (!response.ok) {
          throw new Error('Failed to fetch plugin registry');
        }
        const data: RegistryData = await response.json();
        setPlugins(data.plugins || []);
        setFilteredPlugins(data.plugins || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load plugins');
        console.error('Error fetching plugins:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlugins();
  }, []);

  useEffect(() => {
    let filtered = plugins;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (plugin) =>
          plugin.name.toLowerCase().includes(query) ||
          plugin.description.toLowerCase().includes(query) ||
          plugin.author.toLowerCase().includes(query) ||
          plugin.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((plugin) => plugin.category === selectedCategory);
    }

    setFilteredPlugins(filtered);
  }, [searchQuery, selectedCategory, plugins]);

  const categories = Array.from(new Set(plugins.map((p) => p.category))).sort();

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      productivity: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      integration: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      reporting: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      other: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
    };
    return colors[category] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
  };

  if (loading) {
    return (
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading plugins...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <XCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">Failed to Load Plugins</h3>
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
            <Package className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Plugin Marketplace
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Discover and install plugins to extend TimeTracker's functionality. 
            All plugins are open source and available on GitHub.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search plugins by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Category:</span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-primary-600 dark:bg-primary-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  selectedCategory === category
                    ? 'bg-primary-600 dark:bg-primary-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredPlugins.length} of {plugins.length} plugins
        </div>

        {/* Plugins Grid */}
        {filteredPlugins.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Package className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No plugins found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No plugins available at the moment'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlugins.map((plugin) => (
              <div
                key={plugin.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-600 dark:hover:border-primary-500 hover:shadow-lg transition-all p-6 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plugin.name}</h3>
                      {plugin.verified && (
                        <span title="Verified plugin">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">by {plugin.author}</p>
                  </div>
                  {plugin.icon && (
                    <img
                      src={plugin.icon}
                      alt={`${plugin.name} icon`}
                      className="w-12 h-12 rounded-lg object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-1">{plugin.description}</p>

                {/* Category and Tags */}
                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded capitalize ${getCategoryColor(
                        plugin.category
                      )}`}
                    >
                      {plugin.category}
                    </span>
                    {plugin.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    <span>{plugin.downloads.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    <span>v{plugin.latest_version}</span>
                  </div>
                  {plugin.license && (
                    <div className="text-xs">
                      {plugin.license}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <a
                    href={plugin.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on GitHub
                  </a>
                  {plugin.homepage && (
                    <a
                      href={plugin.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-semibold hover:border-primary-600 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm"
                    >
                      Homepage
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Want to add your plugin to the marketplace?{' '}
            <a
              href="https://github.com/tmtrckr/plugins-registry"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold"
            >
              Submit it to the registry
            </a>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Plugins are loaded from the{' '}
            <a
              href="https://github.com/tmtrckr/plugins-registry"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              Time Tracker Plugins Registry
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PluginMarketplace;
