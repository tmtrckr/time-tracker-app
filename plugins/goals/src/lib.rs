//! Goals Plugin
//! 
//! Manages goals and goal tracking

use time_tracker_plugin_sdk::{Plugin, PluginInfo, PluginAPIInterface, EntityType, SchemaChange};
use serde_json;

pub struct GoalsPlugin {
    info: PluginInfo,
}

impl GoalsPlugin {
    pub fn new() -> Self {
        Self {
            info: PluginInfo {
                id: "goals-plugin".to_string(),
                name: "Goals".to_string(),
                version: "1.0.0".to_string(),
                description: Some("Goal tracking".to_string()),
                is_builtin: false,
            },
        }
    }
}

impl Plugin for GoalsPlugin {
    fn info(&self) -> &PluginInfo {
        &self.info
    }
    
    fn initialize(&mut self, _api: &dyn PluginAPIInterface) -> Result<(), String> {
        // Register schema extension for goals table
        // Note: Query filters registration temporarily disabled - needs backend-specific types
        // Will be re-enabled in Phase 3 when query filters are fully migrated to SDK types
        // Query filters for filtering activities by goal criteria will be registered then
        
        // TODO: Register goals table schema extension
        // For now, the table is created in core database.rs
        // This will be moved here in Phase 3
        
        Ok(())
    }
    
    fn invoke_command(&self, command: &str, params: serde_json::Value, api: &dyn PluginAPIInterface) -> Result<serde_json::Value, String> {
        match command {
            "create_goal" => api.call_db_method("create_goal", params),
            "get_goals" => api.call_db_method("get_goals", params),
            "update_goal" => api.call_db_method("update_goal", params),
            "delete_goal" => api.call_db_method("delete_goal", params),
            "get_goal_progress" => api.call_db_method("get_goal_progress", params),
            "check_goal_alerts" => api.call_db_method("check_goal_alerts", params),
            _ => Err(format!("Unknown command: {}", command)),
        }
    }
    
    fn shutdown(&self) -> Result<(), String> {
        Ok(())
    }
}

// FFI exports for dynamic loading
#[no_mangle]
pub extern "C" fn _plugin_create() -> *mut dyn Plugin {
    Box::into_raw(Box::new(GoalsPlugin::new()))
}

#[no_mangle]
pub extern "C" fn _plugin_destroy(plugin: *mut dyn Plugin) {
    unsafe {
        let _ = Box::from_raw(plugin);
    }
}
