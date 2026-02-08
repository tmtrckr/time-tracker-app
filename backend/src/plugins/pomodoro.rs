//! Pomodoro Plugin
//! 
//! Manages Pomodoro timer and focus sessions

use time_tracker_plugin_sdk::{Plugin, PluginInfo, PluginAPIInterface};
use serde_json;

pub struct PomodoroPlugin {
    info: PluginInfo,
}

impl PomodoroPlugin {
    pub fn new() -> Self {
        Self {
            info: PluginInfo {
                id: "pomodoro-plugin".to_string(),
                name: "Pomodoro".to_string(),
                version: "1.0.0".to_string(),
                description: Some("Pomodoro timer".to_string()),
                is_builtin: true,
            },
        }
    }
}

impl Plugin for PomodoroPlugin {
    fn info(&self) -> &PluginInfo {
        &self.info
    }
    
    fn initialize(&mut self, api: &dyn PluginAPIInterface) -> Result<(), String> {
        // Note: focus_sessions table is already created in core database.rs
        // The plugin just uses the existing table structure
        
        Ok(())
    }
    
    fn invoke_command(&self, command: &str, params: serde_json::Value, api: &dyn PluginAPIInterface) -> Result<serde_json::Value, String> {
        match command {
            "start_pomodoro" => {
                // create_focus_session doesn't take started_at, it uses current time
                api.call_db_method("create_focus_session", params)
            }
            "stop_pomodoro" => {
                // Convert params to match update_focus_session signature
                let session_id = params["session_id"].as_i64().ok_or("Missing session_id")?;
                let update_params = serde_json::json!({
                    "id": session_id,
                    "duration_sec": params["duration_sec"],
                    "completed": params["completed"],
                });
                api.call_db_method("update_focus_session", update_params)
            }
            "get_focus_sessions" => api.call_db_method("get_focus_sessions", params),
            "get_completed_work_sessions_count_today" => api.call_db_method("get_completed_work_sessions_count_today", params),
            "get_active_pomodoro_session" => api.call_db_method("get_active_focus_session", params),
            "delete_focus_session" => api.call_db_method("delete_focus_session", params),
            _ => Err(format!("Unknown command: {}", command)),
        }
    }
    
    fn shutdown(&self) -> Result<(), String> {
        Ok(())
    }
}
