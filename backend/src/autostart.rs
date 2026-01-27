//! Autostart module - Manages application autostart on system login

use auto_launch::AutoLaunch;
use std::path::PathBuf;

/// Autostart manager for enabling/disabling application startup
pub struct AutostartManager {
    app_name: String,
    app_path: PathBuf,
}

impl AutostartManager {
    /// Create a new autostart manager
    pub fn new(app_name: String, app_path: PathBuf) -> Self {
        Self {
            app_name,
            app_path,
        }
    }

    /// Enable autostart
    pub fn enable(&self) -> Result<(), String> {
        let app_path_str = self.app_path.to_str().ok_or("Invalid app path")?;
        let args: &[&str] = &[];
        let autostart = AutoLaunch::new(
            &self.app_name,
            app_path_str,
            args,
        );
        autostart.enable().map_err(|e| format!("Failed to enable autostart: {}", e))
    }

    /// Disable autostart
    pub fn disable(&self) -> Result<(), String> {
        let app_path_str = self.app_path.to_str().ok_or("Invalid app path")?;
        let args: &[&str] = &[];
        let autostart = AutoLaunch::new(
            &self.app_name,
            app_path_str,
            args,
        );
        autostart.disable().map_err(|e| format!("Failed to disable autostart: {}", e))
    }

    /// Check if autostart is enabled
    pub fn is_enabled(&self) -> Result<bool, String> {
        let app_path_str = self.app_path.to_str().ok_or("Invalid app path")?;
        let args: &[&str] = &[];
        let autostart = AutoLaunch::new(
            &self.app_name,
            app_path_str,
            args,
        );
        autostart.is_enabled().map_err(|e| format!("Failed to check autostart status: {}", e))
    }
}
