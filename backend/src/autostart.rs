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

    fn create_auto_launch(&self) -> Result<AutoLaunch, String> {
        let app_path_str = self.app_path.to_str().ok_or("Invalid app path")?;
        let args: &[&str] = &[];
        #[cfg(target_os = "macos")]
        let autostart = AutoLaunch::new(
            &self.app_name,
            app_path_str,
            false, // use_launch_agent: false = use AppleScript (default)
            args,
        );
        #[cfg(not(target_os = "macos"))]
        let autostart = AutoLaunch::new(
            &self.app_name,
            app_path_str,
            args,
        );
        Ok(autostart)
    }

    /// Enable autostart
    pub fn enable(&self) -> Result<(), String> {
        self.create_auto_launch()?
            .enable()
            .map_err(|e| format!("Failed to enable autostart: {}", e))
    }

    /// Disable autostart
    pub fn disable(&self) -> Result<(), String> {
        self.create_auto_launch()?
            .disable()
            .map_err(|e| format!("Failed to disable autostart: {}", e))
    }

    /// Check if autostart is enabled
    pub fn is_enabled(&self) -> Result<bool, String> {
        self.create_auto_launch()?
            .is_enabled()
            .map_err(|e| format!("Failed to check autostart status: {}", e))
    }
}
