//! Goals Plugin
//! 
//! Manages goals and goal tracking

use crate::database::{Database, Goal, GoalProgress, GoalAlert};
use time_tracker_plugin_sdk::{Plugin, PluginInfo, PluginAPIInterface};
use std::sync::Arc;
use serde_json;

pub struct GoalsPlugin {
    info: PluginInfo,
    db: Arc<Database>,
}

impl GoalsPlugin {
    pub fn new(db: Arc<Database>) -> Self {
        Self {
            info: PluginInfo {
                id: "goals-plugin".to_string(),
                name: "Goals".to_string(),
                version: "1.0.0".to_string(),
                description: Some("Goal tracking".to_string()),
                is_builtin: true,
            },
            db,
        }
    }
}

impl Plugin for GoalsPlugin {
    fn info(&self) -> &PluginInfo {
        &self.info
    }
    
    fn initialize(&mut self, _api: &dyn PluginAPIInterface) -> Result<(), String> {
        // Note: goals table is already created in core database.rs
        // TODO: Query filters registration temporarily disabled - needs backend-specific types
        // Will be re-enabled in Phase 3 when query filters are fully migrated to SDK types
        // Query filters for filtering activities by goal criteria will be registered then
        
        Ok(())
    }
    
    fn invoke_command(&self, command: &str, params: serde_json::Value) -> Result<serde_json::Value, String> {
        match command {
            "create_goal" => {
                let goal_type = params["goal_type"].as_str().ok_or("Missing goal_type")?.to_string();
                let target_seconds = params["target_seconds"].as_i64().ok_or("Missing target_seconds")?;
                let category_id = params["category_id"].as_i64();
                let project_id = params["project_id"].as_i64();
                let start_date = params["start_date"].as_i64().ok_or("Missing start_date")?;
                let end_date = params["end_date"].as_i64();
                let name = params["name"].as_str().map(|s| s.to_string());
                
                let id = self.db.create_goal(
                    &goal_type,
                    target_seconds,
                    category_id,
                    project_id,
                    start_date,
                    end_date,
                    name.as_deref(),
                ).map_err(|e| e.to_string())?;
                
                Ok(serde_json::json!(id))
            }
            
            "get_goals" => {
                let active_only = params["active_only"].as_bool().unwrap_or(false);
                let goals = self.db.get_goals(active_only)
                    .map_err(|e| e.to_string())?;
                Ok(serde_json::to_value(goals).map_err(|e| e.to_string())?)
            }
            
            "update_goal" => {
                let id = params["id"].as_i64().ok_or("Missing id")?;
                let goal_type = params["goal_type"].as_str().ok_or("Missing goal_type")?.to_string();
                let target_seconds = params["target_seconds"].as_i64().ok_or("Missing target_seconds")?;
                let category_id = params["category_id"].as_i64();
                let project_id = params["project_id"].as_i64();
                let start_date = params["start_date"].as_i64().ok_or("Missing start_date")?;
                let end_date = params["end_date"].as_i64();
                let active = params["active"].as_bool().unwrap_or(true);
                let name = params["name"].as_str().map(|s| s.to_string());
                
                self.db.update_goal(
                    id,
                    &goal_type,
                    target_seconds,
                    category_id,
                    project_id,
                    start_date,
                    end_date,
                    active,
                    name.as_deref(),
                ).map_err(|e| e.to_string())?;
                
                // Return updated goal by fetching from get_goals
                let goals = self.db.get_goals(false)
                    .map_err(|e| e.to_string())?;
                let goal = goals.into_iter()
                    .find(|g| g.id == id)
                    .ok_or_else(|| "Goal not found".to_string())?;
                
                Ok(serde_json::to_value(goal).map_err(|e| e.to_string())?)
            }
            
            "delete_goal" => {
                let id = params["id"].as_i64().ok_or("Missing id")?;
                self.db.delete_goal(id).map_err(|e| e.to_string())?;
                Ok(serde_json::json!({}))
            }
            
            "get_goal_progress" => {
                let goal_id = params["goal_id"].as_i64().ok_or("Missing goal_id")?;
                let start = params["start"].as_i64().ok_or("Missing start")?;
                let end = params["end"].as_i64().ok_or("Missing end")?;
                let progress = self.db.get_goal_progress(goal_id, start, end)
                    .map_err(|e| e.to_string())?;
                Ok(serde_json::to_value(progress).map_err(|e| e.to_string())?)
            }
            
            "check_goal_alerts" => {
                let alerts = self.db.check_goal_alerts()
                    .map_err(|e| e.to_string())?;
                Ok(serde_json::to_value(alerts).map_err(|e| e.to_string())?)
            }
            
            _ => Err(format!("Unknown command: {}", command)),
        }
    }
    
    fn shutdown(&self) -> Result<(), String> {
        Ok(())
    }
}
