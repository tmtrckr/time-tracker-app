//! Plugin management commands

use crate::commands::common::AppState;
use crate::plugin_system::{PluginDiscovery, PluginLoader};
use dirs::data_dir;
use std::sync::Arc;
use tauri::State;

/// Plugin info structure for frontend
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct InstalledPluginInfo {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub repository_url: Option<String>,
    pub manifest_path: Option<String>,
    pub frontend_entry: Option<String>,
    pub frontend_components: Option<Vec<String>>,
    pub author: Option<String>,
    pub enabled: bool,
}

/// Registry plugin info for frontend
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RegistryPluginInfo {
    pub id: String,
    pub name: String,
    pub author: String,
    pub repository: String,
    pub latest_version: String,
    pub description: String,
    pub category: Option<String>,
    pub verified: bool,
    pub downloads: u64,
    pub tags: Option<Vec<String>>,
    pub license: Option<String>,
    pub min_core_version: Option<String>,
    pub max_core_version: Option<String>,
    pub api_version: Option<String>,
}

/// Helper function to get registry URLs from settings
fn get_registry_urls(state: &AppState) -> Result<Vec<String>, String> {
    if let Ok(Some(urls_json)) = state.db.get_setting("plugin_registry_urls") {
        if let Ok(urls) = serde_json::from_str::<Vec<String>>(&urls_json) {
            if !urls.is_empty() {
                return Ok(urls);
            }
        }
    }
    
    Ok(vec!["https://raw.githubusercontent.com/tmtrckr/plugins-registry/main/registry.json".to_string()])
}

/// Helper function to fetch plugins from multiple registries and merge them
async fn fetch_plugins_from_registries(urls: Vec<String>) -> Result<Vec<RegistryPluginInfo>, String> {
    use futures::future::join_all;
    
    let mut all_plugins: std::collections::HashMap<String, RegistryPluginInfo> = std::collections::HashMap::new();
    
    let fetch_tasks: Vec<_> = urls.into_iter().map(|url| {
        let mut discovery = PluginDiscovery::new(url);
        async move {
            discovery.get_registry().await
        }
    }).collect();
    
    let results = join_all(fetch_tasks).await;
    
    for result in results {
        match result {
            Ok(registry) => {
                for plugin in registry.plugins {
                    let plugin_info = RegistryPluginInfo {
                        id: plugin.id.clone(),
                        name: plugin.name,
                        author: plugin.author,
                        repository: plugin.repository,
                        latest_version: plugin.latest_version.clone(),
                        description: plugin.description,
                        category: plugin.category,
                        verified: plugin.verified,
                        downloads: plugin.downloads,
                        tags: plugin.tags,
                        license: plugin.license,
                        min_core_version: plugin.min_core_version,
                        max_core_version: plugin.max_core_version,
                        api_version: plugin.api_version,
                    };
                    
                    match all_plugins.get(&plugin.id) {
                        Some(existing) => {
                            if compare_versions(&plugin.latest_version, &existing.latest_version) > 0 {
                                all_plugins.insert(plugin.id, plugin_info);
                            }
                        }
                        None => {
                            all_plugins.insert(plugin.id, plugin_info);
                        }
                    }
                }
            }
            Err(e) => {
                eprintln!("Warning: Failed to fetch registry: {}", e);
            }
        }
    }
    
    Ok(all_plugins.into_values().collect())
}

/// Simple version comparison (assumes semver format)
fn compare_versions(v1: &str, v2: &str) -> i32 {
    let v1_parts: Vec<u32> = v1.split('.').filter_map(|s| s.parse().ok()).collect();
    let v2_parts: Vec<u32> = v2.split('.').filter_map(|s| s.parse().ok()).collect();
    
    for (i, &v1_part) in v1_parts.iter().enumerate() {
        let v2_part = v2_parts.get(i).copied().unwrap_or(0);
        if v1_part > v2_part {
            return 1;
        } else if v1_part < v2_part {
            return -1;
        }
    }
    
    if v1_parts.len() < v2_parts.len() {
        -1
    } else if v1_parts.len() > v2_parts.len() {
        1
    } else {
        0
    }
}

/// Get plugin registry from remote source(s)
#[tauri::command]
pub async fn get_plugin_registry(state: State<'_, AppState>) -> Result<Vec<RegistryPluginInfo>, String> {
    let registry_urls = get_registry_urls(&state)?;
    fetch_plugins_from_registries(registry_urls).await
}

/// Search plugins in registry(ies)
#[tauri::command]
pub async fn search_plugins(state: State<'_, AppState>, query: String) -> Result<Vec<RegistryPluginInfo>, String> {
    let registry_urls = get_registry_urls(&state)?;
    let all_plugins = fetch_plugins_from_registries(registry_urls).await?;
    
    let query_lower = query.to_lowercase();
    let filtered: Vec<RegistryPluginInfo> = all_plugins
        .into_iter()
        .filter(|plugin| {
            plugin.name.to_lowercase().contains(&query_lower)
                || plugin.description.to_lowercase().contains(&query_lower)
                || plugin.id.to_lowercase().contains(&query_lower)
                || plugin.tags.as_ref().map_or(false, |tags| {
                    tags.iter().any(|tag| tag.to_lowercase().contains(&query_lower))
                })
        })
        .collect();
    
    Ok(filtered)
}

/// Get plugin info from repository URL
#[tauri::command]
pub async fn get_plugin_info(repository_url: String) -> Result<serde_json::Value, String> {
    let discovery = PluginDiscovery::new("".to_string());
    let manifest = discovery.get_plugin_manifest(&repository_url).await?;
    
    Ok(serde_json::to_value(&manifest).map_err(|e| format!("Failed to serialize manifest: {}", e))?)
}

/// Discover plugin from repository URL
#[tauri::command]
pub async fn discover_plugin(state: State<'_, AppState>, repository_url: String) -> Result<RegistryPluginInfo, String> {
    let registry_urls = get_registry_urls(&state)?;
    let all_plugins = fetch_plugins_from_registries(registry_urls).await?;
    
    if let Some(plugin) = all_plugins.into_iter().find(|p| p.repository == repository_url) {
        return Ok(plugin);
    }
    
    let discovery = PluginDiscovery::new("".to_string());
    let manifest = discovery.get_plugin_manifest(&repository_url).await?;
    
    let (_owner, repo) = PluginDiscovery::parse_github_url_static(&repository_url)
        .map_err(|e| format!("Invalid GitHub URL: {}", e))?;
    let plugin_id = repo.trim_end_matches("-plugin");
    
    Ok(RegistryPluginInfo {
        id: plugin_id.to_string(),
        name: manifest.plugin.display_name.unwrap_or(manifest.plugin.name.clone()),
        author: manifest.plugin.author,
        repository: manifest.plugin.repository.unwrap_or(repository_url.clone()),
        latest_version: manifest.plugin.version,
        description: manifest.plugin.description,
        category: None,
        verified: false,
        downloads: 0,
        tags: None,
        license: manifest.plugin.license,
        min_core_version: manifest.plugin.min_core_version,
        max_core_version: manifest.plugin.max_core_version,
        api_version: manifest.plugin.api_version,
    })
}

/// Install plugin from repository URL
#[tauri::command]
pub async fn install_plugin(
    state: State<'_, AppState>,
    repository_url: String,
    _version: Option<String>,
) -> Result<(), String> {
    let discovery = PluginDiscovery::new("".to_string());
    
    let release = discovery.get_latest_release(&repository_url).await?;
    let asset = discovery.get_platform_asset(&release)?;
    let manifest = discovery.get_plugin_manifest(&repository_url).await?;
    let plugin_id = manifest.plugin.name.clone();
    let author = manifest.plugin.author.clone();
    
    if author.is_empty() {
        return Err("Plugin author is required in manifest".to_string());
    }
    
    let data_dir = data_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("timetracker");
    let plugins_dir = data_dir.join("plugins");
    
    let loader = PluginLoader::new(plugins_dir);
    let manifest_path = loader.install_from_release(&author, &plugin_id, asset).await?;
    
    let installed_manifest = loader.load_manifest(&manifest_path)?;
    loader.validate_manifest(&installed_manifest)?;
    
    let frontend_entry = installed_manifest.frontend.as_ref()
        .and_then(|f| f.entry.clone());
    let frontend_components = installed_manifest.frontend.as_ref()
        .and_then(|f| f.components.clone())
        .map(|components| serde_json::to_string(&components).unwrap_or_default());
    
    state.db.install_plugin_with_repo(
        &plugin_id,
        &installed_manifest.plugin.display_name.unwrap_or(installed_manifest.plugin.name.clone()),
        &installed_manifest.plugin.version,
        Some(&installed_manifest.plugin.description),
        Some(&repository_url),
        manifest_path.to_str(),
        frontend_entry.as_deref(),
        frontend_components.as_deref(),
        Some(&author),
    )?;
    
    if let Some(plugin_registry) = &state.plugin_registry {
        if let Some(extension_registry) = &state.extension_registry {
            let app_loader = state.plugin_loader.as_ref()
                .ok_or_else(|| "Plugin loader not available".to_string())?;
            
            match app_loader.load_dynamic_plugin(&author, &plugin_id) {
                Ok(mut plugin) => {
                    use crate::plugin_system::api::PluginAPI;
                    use time_tracker_plugin_sdk::PluginAPIInterface;
                    
                    let api = PluginAPI::new(Arc::clone(&state.db), Arc::clone(extension_registry), plugin_id.clone());
                    match plugin.initialize(&api as &dyn PluginAPIInterface) {
                        Ok(()) => {
                            if let Err(e) = plugin_registry.register(plugin) {
                                eprintln!("Warning: Failed to register plugin {} after installation: {}", plugin_id, e);
                            } else {
                                eprintln!("Loaded and registered plugin after installation: {}", plugin_id);
                            }
                        }
                        Err(e) => {
                            eprintln!("Warning: Failed to initialize plugin {} after installation: {}", plugin_id, e);
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Warning: Failed to load plugin {} after installation: {}", plugin_id, e);
                }
            }
        }
    }
    
    Ok(())
}

/// List all installed plugins
#[tauri::command]
pub fn list_installed_plugins(state: State<'_, AppState>) -> Result<Vec<InstalledPluginInfo>, String> {
    let plugins = state.db.get_installed_plugins()?;
    
    Ok(plugins.into_iter().map(|(id, name, version, description, repository_url, manifest_path, frontend_entry, frontend_components, author, enabled)| {
        let components: Option<Vec<String>> = frontend_components
            .and_then(|s| serde_json::from_str(&s).ok());
        
        InstalledPluginInfo {
            id,
            name,
            version,
            description,
            repository_url,
            manifest_path,
            frontend_entry,
            frontend_components: components,
            author,
            enabled,
        }
    }).collect())
}

/// Uninstall plugin
#[tauri::command]
pub async fn uninstall_plugin(
    state: State<'_, AppState>,
    plugin_id: String,
) -> Result<(), String> {
    let plugins = state.db.get_installed_plugins()?;
    let plugin_info = plugins.iter()
        .find(|(id, _, _, _, _, _, _, _, _, _)| id == &plugin_id)
        .ok_or_else(|| format!("Plugin {} not found", plugin_id))?;
    
    let author: String = if let Some(auth) = &plugin_info.8 {
        auth.clone()
    } else {
        if let Some(manifest_path_str) = &plugin_info.5 {
            let manifest_path = std::path::PathBuf::from(manifest_path_str);
            let data_dir = data_dir()
                .unwrap_or_else(|| std::path::PathBuf::from("."))
                .join("timetracker");
            let plugins_dir = data_dir.join("plugins");
            let loader = PluginLoader::new(plugins_dir);
            if let Ok(manifest) = loader.load_manifest(&manifest_path) {
                manifest.plugin.author
            } else {
                return Err(format!("Failed to load manifest for plugin {} to get author", plugin_id));
            }
        } else {
            return Err(format!("Plugin {} has no author and no manifest path", plugin_id));
        }
    };
    
    state.db.uninstall_plugin(&plugin_id)?;
    
    let data_dir = data_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("timetracker");
    let plugins_dir = data_dir.join("plugins");
    let loader = PluginLoader::new(plugins_dir);
    loader.uninstall(&author, &plugin_id)?;
    
    Ok(())
}

/// Enable plugin
#[tauri::command]
pub fn enable_plugin(
    state: State<'_, AppState>,
    plugin_id: String,
) -> Result<(), String> {
    state.db.set_plugin_enabled(&plugin_id, true)?;
    load_plugin(state, plugin_id)
}

/// Disable plugin
#[tauri::command]
pub fn disable_plugin(
    state: State<'_, AppState>,
    plugin_id: String,
) -> Result<(), String> {
    state.db.set_plugin_enabled(&plugin_id, false)?;
    
    if let Some(plugin_registry) = &state.plugin_registry {
        if let Err(e) = plugin_registry.unregister(&plugin_id) {
            eprintln!("Warning: Failed to unregister plugin {}: {}", plugin_id, e);
        }
    }
    
    if let Some(plugin_loader) = &state.plugin_loader {
        if let Err(e) = plugin_loader.unload_plugin_library(&plugin_id) {
            eprintln!("Warning: Failed to unload plugin {} library: {}", plugin_id, e);
        }
    }
    
    Ok(())
}

/// Load plugin into runtime (for dynamic libraries)
#[tauri::command]
pub fn load_plugin(
    state: State<'_, AppState>,
    plugin_id: String,
) -> Result<(), String> {
    let plugins = state.db.get_installed_plugins()?;
    let plugin_info = plugins.iter()
        .find(|(id, _, _, _, _, _, _, _, _, _)| id == &plugin_id)
        .ok_or_else(|| format!("Plugin {} not found", plugin_id))?;
    
    if !plugin_info.9 {
        return Err("Plugin is disabled".to_string());
    }
    
    let author = if let Some(auth) = &plugin_info.8 {
        auth.clone()
    } else {
        if let Some(manifest_path_str) = &plugin_info.5 {
            let manifest_path = std::path::PathBuf::from(manifest_path_str);
            let data_dir = data_dir()
                .unwrap_or_else(|| std::path::PathBuf::from("."))
                .join("timetracker");
            let plugins_dir = data_dir.join("plugins");
            let loader = PluginLoader::new(plugins_dir);
            if let Ok(manifest) = loader.load_manifest(&manifest_path) {
                manifest.plugin.author
            } else {
                return Err(format!("Failed to load manifest for plugin {} to get author", plugin_id));
            }
        } else {
            return Err(format!("Plugin {} has no author and no manifest path", plugin_id));
        }
    };
    
    if let Some(plugin_registry) = &state.plugin_registry {
        if let Some(extension_registry) = &state.extension_registry {
            let loader = state.plugin_loader.as_ref()
                .ok_or_else(|| "Plugin loader not available".to_string())?;
            
            match loader.load_dynamic_plugin(&author, &plugin_id) {
                Ok(mut plugin) => {
                    use crate::plugin_system::api::PluginAPI;
                    use time_tracker_plugin_sdk::PluginAPIInterface;
                    
                    let api = PluginAPI::new(Arc::clone(&state.db), Arc::clone(extension_registry), plugin_id.clone());
                    match plugin.initialize(&api as &dyn PluginAPIInterface) {
                        Ok(()) => {
                            plugin_registry.register(plugin)
                                .map_err(|e| format!("Failed to register plugin: {}", e))?;
                        }
                        Err(e) => {
                            return Err(format!("Failed to initialize plugin: {}", e));
                        }
                    }
                }
                Err(e) => {
                    return Err(format!("Failed to load plugin library: {}", e));
                }
            }
        }
    }
    
    Ok(())
}

/// Unload plugin from runtime (for dynamic libraries)
#[tauri::command]
pub fn unload_plugin(
    state: State<'_, AppState>,
    plugin_id: String,
) -> Result<(), String> {
    if let Some(plugin_registry) = &state.plugin_registry {
        if let Err(e) = plugin_registry.unregister(&plugin_id) {
            return Err(format!("Failed to unregister plugin: {}", e));
        }
    } else {
        return Err("Plugin registry not available".to_string());
    }
    
    if let Some(plugin_loader) = &state.plugin_loader {
        if let Err(e) = plugin_loader.unload_plugin_library(&plugin_id) {
            eprintln!("Warning: Failed to unload plugin {} library: {}", plugin_id, e);
        }
    }
    
    Ok(())
}

/// Helper to invoke a plugin command with PluginAPI
fn invoke_plugin_command_with_api(
    state: &AppState,
    plugin_id: &str,
    command: &str,
    params: serde_json::Value,
) -> Result<serde_json::Value, String> {
    use crate::plugin_system::api::PluginAPI;
    use time_tracker_plugin_sdk::PluginAPIInterface;
    
    let registry = state.plugin_registry.as_ref()
        .ok_or_else(|| "Plugin registry not available".to_string())?;
    let extension_registry = state.extension_registry.as_ref()
        .ok_or_else(|| "Extension registry not available".to_string())?;
    
    let api = PluginAPI::new(
        Arc::clone(&state.db),
        Arc::clone(extension_registry),
        plugin_id.to_string(),
    );
    
    registry.invoke_plugin_command(plugin_id, command, params, &api as &dyn PluginAPIInterface)
}

/// Invoke a command on a plugin
#[tauri::command]
pub fn invoke_plugin_command(
    state: State<'_, AppState>,
    plugin_id: String,
    command: String,
    params: serde_json::Value,
) -> Result<serde_json::Value, String> {
    invoke_plugin_command_with_api(&state, &plugin_id, &command, params)
}

/// Check if a plugin is installed
#[tauri::command]
pub fn is_plugin_installed(
    state: State<'_, AppState>,
    plugin_id: String,
) -> Result<bool, String> {
    state.db.is_plugin_installed(&plugin_id)
}

/// Get all registered plugin IDs
#[tauri::command]
pub fn get_plugin_ids(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    if let Some(plugin_registry) = &state.plugin_registry {
        Ok(plugin_registry.get_plugin_ids())
    } else {
        Ok(vec![])
    }
}

/// Check if a plugin is loaded in runtime
#[tauri::command]
pub fn is_plugin_loaded(
    state: State<'_, AppState>,
    plugin_id: String,
) -> Result<bool, String> {
    if let Some(plugin_loader) = &state.plugin_loader {
        Ok(plugin_loader.is_plugin_loaded(&plugin_id))
    } else {
        Ok(false)
    }
}
