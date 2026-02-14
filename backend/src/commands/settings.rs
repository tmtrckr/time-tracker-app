//! Settings management commands

use crate::commands::common::AppState;
use tauri::{State, AppHandle};
use serde::{Deserialize, Serialize};

/// Settings response structure
#[derive(Serialize, Deserialize)]
pub struct SettingsResponse {
    pub idle_threshold_minutes: i64,
    pub idle_prompt_threshold_minutes: i64,
    pub autostart: bool,
    pub minimize_to_tray: bool,
    pub show_notifications: bool,
    pub enable_marketplace: bool,
    pub date_format: String,
    pub time_format: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub idle_threshold_seconds: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub idle_prompt_threshold_seconds: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub plugin_registry_urls: Option<Vec<String>>,
}

/// Get setting value
#[tauri::command]
pub fn get_setting(state: State<'_, AppState>, key: String) -> Result<Option<String>, String> {
    state.db.get_setting(&key).map_err(|e| e.to_string())
}

/// Set setting value
#[tauri::command]
pub fn set_setting(state: State<'_, AppState>, key: String, value: String) -> Result<(), String> {
    state.db.set_setting(&key, &value).map_err(|e| e.to_string())
}

/// Get all settings
#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Result<SettingsResponse, String> {
    let settings = state.db.get_all_settings().map_err(|e| e.to_string())?;
    
    let idle_threshold_secs = settings
        .get("idle_threshold_seconds")
        .and_then(|v| v.parse::<i64>().ok())
        .or_else(|| {
            settings
                .get("idle_threshold_minutes")
                .and_then(|v| v.parse::<i64>().ok())
                .map(|mins| mins * 60)
        })
        .unwrap_or(120);
    
    let idle_prompt_threshold_secs = settings
        .get("idle_prompt_threshold_seconds")
        .and_then(|v| v.parse::<i64>().ok())
        .or_else(|| {
            settings
                .get("idle_prompt_threshold_minutes")
                .and_then(|v| v.parse::<i64>().ok())
                .map(|mins| mins * 60)
        })
        .unwrap_or(300);
    
    Ok(SettingsResponse {
        idle_threshold_minutes: idle_threshold_secs / 60,
        idle_prompt_threshold_minutes: idle_prompt_threshold_secs / 60,
        idle_threshold_seconds: Some(idle_threshold_secs),
        idle_prompt_threshold_seconds: Some(idle_prompt_threshold_secs),
        autostart: settings
            .get("autostart")
            .map(|v| v == "true")
            .unwrap_or(false),
        minimize_to_tray: settings
            .get("minimize_to_tray")
            .map(|v| v == "true")
            .unwrap_or(false),
        show_notifications: settings
            .get("show_notifications")
            .map(|v| v == "true")
            .unwrap_or(true),
        enable_marketplace: settings
            .get("enable_marketplace")
            .map(|v| v == "true")
            .unwrap_or(true),
        date_format: settings
            .get("date_format")
            .cloned()
            .unwrap_or_else(|| "YYYY-MM-DD".to_string()),
        time_format: settings
            .get("time_format")
            .cloned()
            .unwrap_or_else(|| "24h".to_string()),
        plugin_registry_urls: settings.get("plugin_registry_urls")
            .and_then(|v| serde_json::from_str::<Vec<String>>(v).ok()),
    })
}

/// Update settings
#[tauri::command]
pub fn update_settings(
    _app: AppHandle,
    state: State<'_, AppState>,
    settings: SettingsResponse,
) -> Result<(), String> {
    let current_autostart = state.db.get_setting("autostart")
        .map(|v| v.map(|s| s == "true").unwrap_or(false))
        .unwrap_or(false);
    
    let idle_threshold_secs = settings.idle_threshold_seconds.unwrap_or(settings.idle_threshold_minutes * 60);
    let idle_prompt_threshold_secs = settings.idle_prompt_threshold_seconds.unwrap_or(settings.idle_prompt_threshold_minutes * 60);
    
    let mut settings_map = std::collections::HashMap::new();
    settings_map.insert("idle_threshold_seconds".to_string(), idle_threshold_secs.to_string());
    settings_map.insert("idle_prompt_threshold_seconds".to_string(), idle_prompt_threshold_secs.to_string());
    settings_map.insert("idle_threshold_minutes".to_string(), (idle_threshold_secs / 60).to_string());
    settings_map.insert("idle_prompt_threshold_minutes".to_string(), (idle_prompt_threshold_secs / 60).to_string());
    settings_map.insert("autostart".to_string(), settings.autostart.to_string());
    settings_map.insert("minimize_to_tray".to_string(), settings.minimize_to_tray.to_string());
    settings_map.insert("show_notifications".to_string(), settings.show_notifications.to_string());
    settings_map.insert("enable_marketplace".to_string(), settings.enable_marketplace.to_string());
    settings_map.insert("date_format".to_string(), settings.date_format);
    settings_map.insert("time_format".to_string(), settings.time_format);
    
    if let Some(urls) = &settings.plugin_registry_urls {
        if let Ok(json) = serde_json::to_string(urls) {
            settings_map.insert("plugin_registry_urls".to_string(), json);
        }
    }
    
    state.db.set_settings(&settings_map).map_err(|e| e.to_string())?;
    
    if let Some(tracker) = state.tracker.lock().unwrap().as_ref() {
        tracker.set_idle_threshold(idle_threshold_secs as u64);
        tracker.set_prompt_threshold(idle_prompt_threshold_secs as u64);
    }
    
    if current_autostart != settings.autostart {
        let app_name = "Time Tracker".to_string();
        let app_path = std::env::current_exe().map_err(|e| format!("Failed to get app path: {}", e))?;
        
        let autostart_manager = crate::autostart::AutostartManager::new(app_name, app_path);
        
        if settings.autostart {
            autostart_manager.enable().map_err(|e| format!("Failed to enable autostart: {}", e))?;
        } else {
            autostart_manager.disable().map_err(|e| format!("Failed to disable autostart: {}", e))?;
        }
    }
    
    Ok(())
}

/// Enable autostart
#[tauri::command]
pub fn enable_autostart(_app: AppHandle) -> Result<(), String> {
    let app_name = "Time Tracker".to_string();
    let app_path = std::env::current_exe().map_err(|e| format!("Failed to get app path: {}", e))?;
    let autostart_manager = crate::autostart::AutostartManager::new(app_name, app_path);
    autostart_manager.enable().map_err(|e| e.to_string())
}

/// Disable autostart
#[tauri::command]
pub fn disable_autostart(_app: AppHandle) -> Result<(), String> {
    let app_name = "Time Tracker".to_string();
    let app_path = std::env::current_exe().map_err(|e| format!("Failed to get app path: {}", e))?;
    let autostart_manager = crate::autostart::AutostartManager::new(app_name, app_path);
    autostart_manager.disable().map_err(|e| e.to_string())
}

/// Check if autostart is enabled
#[tauri::command]
pub fn is_autostart_enabled(_app: AppHandle) -> Result<bool, String> {
    let app_name = "Time Tracker".to_string();
    let app_path = std::env::current_exe().map_err(|e| format!("Failed to get app path: {}", e))?;
    let autostart_manager = crate::autostart::AutostartManager::new(app_name, app_path);
    autostart_manager.is_enabled().map_err(|e| e.to_string())
}
