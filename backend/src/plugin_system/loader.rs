//! Plugin Loader - dynamic library loading for plugins

use std::path::{Path, PathBuf};
use std::fs;
use std::io::Write;
use crate::plugin_system::discovery::{PluginManifest, GitHubReleaseAsset};

/// Plugin loader for dynamic libraries
pub struct PluginLoader {
    plugins_dir: PathBuf,
}

impl PluginLoader {
    /// Create a new plugin loader
    pub fn new(plugins_dir: PathBuf) -> Self {
        // Ensure plugins directory exists
        fs::create_dir_all(&plugins_dir).ok();
        
        Self { plugins_dir }
    }

    /// Get plugins directory path
    pub fn plugins_dir(&self) -> &Path {
        &self.plugins_dir
    }

    /// Get plugin directory path
    pub fn get_plugin_dir(&self, plugin_id: &str) -> PathBuf {
        self.plugins_dir.join(plugin_id)
    }

    /// Download and install plugin from GitHub release
    pub async fn install_from_release(
        &self,
        plugin_id: &str,
        asset: &GitHubReleaseAsset,
    ) -> Result<PathBuf, String> {
        let plugin_dir = self.get_plugin_dir(plugin_id);
        fs::create_dir_all(&plugin_dir)
            .map_err(|e| format!("Failed to create plugin directory: {}", e))?;

        // Download asset
        let client = reqwest::Client::new();
        let response = client
            .get(&asset.browser_download_url)
            .send()
            .await
            .map_err(|e| format!("Failed to download plugin: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Download failed with status: {}", response.status()));
        }

        let bytes = response
            .bytes()
            .await
            .map_err(|e| format!("Failed to read download: {}", e))?;

        // Save to temporary file
        let archive_path = plugin_dir.join(&asset.name);
        let mut file = fs::File::create(&archive_path)
            .map_err(|e| format!("Failed to create archive file: {}", e))?;
        file.write_all(&bytes)
            .map_err(|e| format!("Failed to write archive: {}", e))?;

        // Extract archive
        self.extract_archive(&archive_path, &plugin_dir)?;

        // Remove archive file
        fs::remove_file(&archive_path).ok();

        // Find manifest path
        let manifest_path = plugin_dir.join("plugin.toml");
        if !manifest_path.exists() {
            return Err("plugin.toml not found in archive".to_string());
        }

        Ok(manifest_path)
    }

    /// Extract archive (zip or tar.gz)
    fn extract_archive(&self, archive_path: &Path, dest_dir: &Path) -> Result<(), String> {
        let file = fs::File::open(archive_path)
            .map_err(|e| format!("Failed to open archive: {}", e))?;

        if archive_path.extension().and_then(|s| s.to_str()) == Some("zip") {
            // Extract ZIP
            let mut archive = zip::ZipArchive::new(file)
                .map_err(|e| format!("Failed to open ZIP archive: {}", e))?;

            for i in 0..archive.len() {
                let mut file = archive.by_index(i)
                    .map_err(|e| format!("Failed to read ZIP entry {}: {}", i, e))?;
                
                let outpath = match file.enclosed_name() {
                    Some(path) => dest_dir.join(path),
                    None => continue,
                };
                
                if file.name().ends_with('/') {
                    fs::create_dir_all(&outpath)
                        .map_err(|e| format!("Failed to create directory: {}", e))?;
                } else {
                    if let Some(parent) = outpath.parent() {
                        fs::create_dir_all(parent)
                            .map_err(|e| format!("Failed to create parent directory: {}", e))?;
                    }
                    
                    let mut outfile = fs::File::create(&outpath)
                        .map_err(|e| format!("Failed to create file: {}", e))?;
                    std::io::copy(&mut file, &mut outfile)
                        .map_err(|e| format!("Failed to extract file: {}", e))?;
                }
            }
        } else if archive_path.extension().and_then(|s| s.to_str()) == Some("gz")
            || archive_path.to_string_lossy().ends_with(".tar.gz")
        {
            // Extract tar.gz
            let tar = flate2::read::GzDecoder::new(file);
            let mut archive = tar::Archive::new(tar);
            archive.unpack(dest_dir)
                .map_err(|e| format!("Failed to extract tar.gz: {}", e))?;
        } else {
            return Err("Unsupported archive format".to_string());
        }

        Ok(())
    }

    /// Load plugin manifest from file
    pub fn load_manifest(&self, manifest_path: &Path) -> Result<PluginManifest, String> {
        let content = fs::read_to_string(manifest_path)
            .map_err(|e| format!("Failed to read manifest: {}", e))?;

        let manifest: PluginManifest = toml::from_str(&content)
            .map_err(|e| format!("Failed to parse manifest: {}", e))?;

        Ok(manifest)
    }

    /// Validate plugin manifest
    pub fn validate_manifest(&self, manifest: &PluginManifest) -> Result<(), String> {
        // Check required fields
        if manifest.plugin.name.is_empty() {
            return Err("Plugin name is required".to_string());
        }
        if manifest.plugin.version.is_empty() {
            return Err("Plugin version is required".to_string());
        }
        if manifest.plugin.repository.is_empty() {
            return Err("Plugin repository is required".to_string());
        }

        // Check backend section if present
        if let Some(backend) = &manifest.backend {
            if backend.crate_name.is_empty() {
                return Err("Backend crate_name is required".to_string());
            }
            if backend.library_name.is_empty() {
                return Err("Backend library_name is required".to_string());
            }
            if backend.entry_point.is_empty() {
                return Err("Backend entry_point is required".to_string());
            }
        }

        Ok(())
    }

    /// Uninstall plugin (remove directory)
    pub fn uninstall(&self, plugin_id: &str) -> Result<(), String> {
        let plugin_dir = self.get_plugin_dir(plugin_id);
        if plugin_dir.exists() {
            fs::remove_dir_all(&plugin_dir)
                .map_err(|e| format!("Failed to remove plugin directory: {}", e))?;
        }
        Ok(())
    }

    /// Check if plugin is installed
    pub fn is_installed(&self, plugin_id: &str) -> bool {
        let plugin_dir = self.get_plugin_dir(plugin_id);
        plugin_dir.exists() && plugin_dir.join("plugin.toml").exists()
    }

    /// Get plugin manifest path if installed
    pub fn get_manifest_path(&self, plugin_id: &str) -> Option<PathBuf> {
        let manifest_path = self.get_plugin_dir(plugin_id).join("plugin.toml");
        if manifest_path.exists() {
            Some(manifest_path)
        } else {
            None
        }
    }
}

// Note: Dynamic library loading would require libloading crate
// For now, we'll focus on the installation and manifest handling
// Actual runtime loading will be implemented when we add libloading dependency
