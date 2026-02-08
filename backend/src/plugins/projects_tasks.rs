//! Projects/Tasks Plugin
//! 
//! Manages projects and tasks, extends activities and manual_entries with project_id and task_id fields

use time_tracker_plugin_sdk::{Plugin, PluginInfo, PluginAPIInterface, EntityType, SchemaChange, ModelField, ForeignKey};
use serde_json;

pub struct ProjectsTasksPlugin {
    info: PluginInfo,
}

impl ProjectsTasksPlugin {
    pub fn new() -> Self {
        Self {
            info: PluginInfo {
                id: "projects-tasks-plugin".to_string(),
                name: "Projects/Tasks".to_string(),
                version: "1.0.0".to_string(),
                description: Some("Project and task management".to_string()),
                is_builtin: true,
            },
        }
    }
}

impl Plugin for ProjectsTasksPlugin {
    fn info(&self) -> &PluginInfo {
        &self.info
    }
    
    fn initialize(&mut self, api: &dyn PluginAPIInterface) -> Result<(), String> {
        // Note: Projects and tasks tables are already created in core database.rs
        // The Extension API will handle adding columns to activities and manual_entries
        // if they don't already exist
        
        // Register schema extensions for activities
        api.register_schema_extension(
            EntityType::Activity,
            vec![
                SchemaChange::AddColumn {
                    table: "activities".to_string(),
                    column: "project_id".to_string(),
                    column_type: "INTEGER".to_string(),
                    default: None,
                    foreign_key: Some(crate::plugin_system::extensions::ForeignKey {
                        table: "projects".to_string(),
                        column: "id".to_string(),
                    }),
                },
                SchemaChange::AddColumn {
                    table: "activities".to_string(),
                    column: "task_id".to_string(),
                    column_type: "INTEGER".to_string(),
                    default: None,
                    foreign_key: Some(ForeignKey {
                        table: "tasks".to_string(),
                        column: "id".to_string(),
                    }),
                },
                SchemaChange::AddIndex {
                    table: "activities".to_string(),
                    index: "idx_activities_project".to_string(),
                    columns: vec!["project_id".to_string()],
                },
            ],
        )?;
        
        // Register schema extensions for manual_entries
        api.register_schema_extension(
            EntityType::ManualEntry,
            vec![
                SchemaChange::AddColumn {
                    table: "manual_entries".to_string(),
                    column: "project_id".to_string(),
                    column_type: "INTEGER".to_string(),
                    default: None,
                    foreign_key: Some(crate::plugin_system::extensions::ForeignKey {
                        table: "projects".to_string(),
                        column: "id".to_string(),
                    }),
                },
                SchemaChange::AddColumn {
                    table: "manual_entries".to_string(),
                    column: "task_id".to_string(),
                    column_type: "INTEGER".to_string(),
                    default: None,
                    foreign_key: Some(ForeignKey {
                        table: "tasks".to_string(),
                        column: "id".to_string(),
                    }),
                },
            ],
        )?;
        
        // Register model extensions
        api.register_model_extension(
            EntityType::Activity,
            vec![
                ModelField {
                    name: "project_id".to_string(),
                    type_: "Option<i64>".to_string(),
                    optional: true,
                },
                ModelField {
                    name: "task_id".to_string(),
                    type_: "Option<i64>".to_string(),
                    optional: true,
                },
            ],
        )?;
        
        api.register_model_extension(
            EntityType::ManualEntry,
            vec![
                ModelField {
                    name: "project_id".to_string(),
                    type_: "Option<i64>".to_string(),
                    optional: true,
                },
                ModelField {
                    name: "task_id".to_string(),
                    type_: "Option<i64>".to_string(),
                    optional: true,
                },
            ],
        )?;
        
        Ok(())
    }
    
    fn invoke_command(&self, command: &str, params: serde_json::Value, api: &dyn time_tracker_plugin_sdk::PluginAPIInterface) -> Result<serde_json::Value, String> {
        match command {
            "create_project" => api.call_db_method("create_project", params),
            "get_projects" => api.call_db_method("get_projects", params),
            "get_project_by_id" => api.call_db_method("get_project_by_id", params),
            "update_project" => api.call_db_method("update_project", params),
            "delete_project" => api.call_db_method("delete_project", params),
            "create_task" => api.call_db_method("create_task", params),
            "get_tasks" => api.call_db_method("get_tasks", params),
            "get_task_by_id" => api.call_db_method("get_task_by_id", params),
            "update_task" => api.call_db_method("update_task", params),
            "delete_task" => api.call_db_method("delete_task", params),
            
            _ => Err(format!("Unknown command: {}", command)),
        }
    }
    
    fn shutdown(&self) -> Result<(), String> {
        // Cleanup if needed
        Ok(())
    }
}
