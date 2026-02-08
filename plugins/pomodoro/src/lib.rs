//! Pomodoro Plugin
//! 
//! Manages Pomodoro timer and focus sessions

use time_tracker_plugin_sdk::{Plugin, PluginInfo, PluginAPIInterface, EntityType, SchemaChange};
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
                is_builtin: false,
            },
        }
    }
}

impl Plugin for PomodoroPlugin {
    fn info(&self) -> &PluginInfo {
        &self.info
    }
    
    fn initialize(&mut self, api: &dyn PluginAPIInterface) -> Result<(), String> {
        // Register schema extension for focus_sessions table
        api.register_schema_extension(
            EntityType::Activity, // Using Activity as entity type, though focus_sessions is separate
            vec![
                SchemaChange::CreateTable {
                    table: "focus_sessions".to_string(),
                    columns: vec![
                        time_tracker_plugin_sdk::TableColumn {
                            name: "id".to_string(),
                            column_type: "INTEGER PRIMARY KEY AUTOINCREMENT".to_string(),
                            default: None,
                            foreign_key: None,
                        },
                        time_tracker_plugin_sdk::TableColumn {
                            name: "started_at".to_string(),
                            column_type: "INTEGER NOT NULL".to_string(),
                            default: None,
                            foreign_key: None,
                        },
                        time_tracker_plugin_sdk::TableColumn {
                            name: "ended_at".to_string(),
                            column_type: "INTEGER".to_string(),
                            default: None,
                            foreign_key: None,
                        },
                        time_tracker_plugin_sdk::TableColumn {
                            name: "duration_sec".to_string(),
                            column_type: "INTEGER DEFAULT 0".to_string(),
                            default: Some("0".to_string()),
                            foreign_key: None,
                        },
                        time_tracker_plugin_sdk::TableColumn {
                            name: "pomodoro_type".to_string(),
                            column_type: "TEXT NOT NULL".to_string(),
                            default: None,
                            foreign_key: None,
                        },
                        time_tracker_plugin_sdk::TableColumn {
                            name: "project_id".to_string(),
                            column_type: "INTEGER".to_string(),
                            default: None,
                            foreign_key: Some(time_tracker_plugin_sdk::ForeignKey {
                                table: "projects".to_string(),
                                column: "id".to_string(),
                            }),
                        },
                        time_tracker_plugin_sdk::TableColumn {
                            name: "task_id".to_string(),
                            column_type: "INTEGER".to_string(),
                            default: None,
                            foreign_key: Some(time_tracker_plugin_sdk::ForeignKey {
                                table: "tasks".to_string(),
                                column: "id".to_string(),
                            }),
                        },
                        time_tracker_plugin_sdk::TableColumn {
                            name: "completed".to_string(),
                            column_type: "BOOLEAN DEFAULT FALSE".to_string(),
                            default: Some("FALSE".to_string()),
                            foreign_key: None,
                        },
                    ],
                },
            ],
        )?;
        
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

// FFI exports for dynamic loading
#[no_mangle]
pub extern "C" fn _plugin_create() -> *mut dyn Plugin {
    Box::into_raw(Box::new(PomodoroPlugin::new()))
}

#[no_mangle]
pub extern "C" fn _plugin_destroy(plugin: *mut dyn Plugin) {
    unsafe {
        let _ = Box::from_raw(plugin);
    }
}
