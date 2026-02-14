// Plugin Frontend Loader
// Loads and initializes plugin frontend bundles

import type { PluginFrontendModule, PluginFrontendAPI } from '../types/pluginFrontend';

const loadedPlugins = new Map<string, PluginFrontendModule>();

export interface PluginManifest {
  id: string;
  author?: string;
  frontend?: {
    entry?: string;
    components?: string[];
  };
}

/**
 * Normalize author name for use in file paths
 */
function normalizeAuthorName(author: string): string {
  return author.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
}

/**
 * Load a plugin's frontend bundle
 */
export async function loadPluginFrontend(
  pluginId: string,
  author: string | undefined,
  manifest: PluginManifest,
  api: PluginFrontendAPI
): Promise<void> {
  if (loadedPlugins.has(pluginId)) {
    return;
  }

  if (!manifest.frontend?.entry) {
    return;
  }

  // Get author from manifest or parameter
  const pluginAuthor = author || manifest.author;
  if (!pluginAuthor) {
    console.error(`Plugin ${pluginId} has no author - cannot load frontend`);
    return;
  }

  try {
    // Normalize entry path - remove leading 'frontend/' if present since we add it below
    let entryPath = manifest.frontend.entry || '';
    if (entryPath.startsWith('frontend/')) {
      entryPath = entryPath.substring('frontend/'.length);
    }
    
    // Load from plugins/{author}/{pluginId}/frontend/{entryPath}
    const normalizedAuthor = normalizeAuthorName(pluginAuthor);
    const modulePath = `/plugins/${normalizedAuthor}/${pluginId}/frontend/${entryPath}`;
    
    // Dynamic import of the plugin module
    // Remove @vite-ignore to allow Vite to process the module and resolve dependencies
    const module = await import(modulePath);
    
    if (!module.default || typeof module.default.initialize !== 'function') {
      throw new Error(`Plugin ${pluginId} frontend module does not export a valid initialize function`);
    }

    const pluginModule: PluginFrontendModule = module.default;
    
    // Initialize the plugin with the API
    pluginModule.initialize(api);
    
    // Store the loaded plugin
    loadedPlugins.set(pluginId, pluginModule);
  } catch (error) {
    console.error(`Failed to load plugin frontend ${pluginId}:`, error);
    // Don't throw - allow app to continue without this plugin's UI
  }
}

/**
 * Unload a plugin's frontend bundle
 */
export function unloadPluginFrontend(pluginId: string): void {
  const pluginModule = loadedPlugins.get(pluginId);
  if (pluginModule?.cleanup) {
    pluginModule.cleanup();
  }
  loadedPlugins.delete(pluginId);
}

/**
 * Get all loaded plugin IDs
 */
export function getLoadedPlugins(): string[] {
  return Array.from(loadedPlugins.keys());
}
