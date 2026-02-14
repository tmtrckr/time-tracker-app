//! Rule management commands

use crate::database::Rule;
use crate::commands::common::AppState;
use tauri::State;

/// Get all rules
#[tauri::command]
pub fn get_rules(state: State<'_, AppState>) -> Result<Vec<Rule>, String> {
    state.db.get_rules().map_err(|e| e.to_string())
}

/// Add a new rule
#[tauri::command]
pub fn add_rule(
    state: State<'_, AppState>,
    rule_type: String,
    pattern: String,
    category_id: i64,
    priority: i64,
) -> Result<i64, String> {
    state
        .db
        .add_rule(&rule_type, &pattern, category_id, priority)
        .map_err(|e: rusqlite::Error| e.to_string())
}

/// Create rule
#[tauri::command]
pub fn create_rule(
    state: State<'_, AppState>,
    rule_type: String,
    pattern: String,
    category_id: i64,
    priority: i64,
) -> Result<Rule, String> {
    let id = state
        .db
        .add_rule(&rule_type, &pattern, category_id, priority)
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    state
        .db
        .get_rules()
        .map_err(|e: rusqlite::Error| e.to_string())?
        .into_iter()
        .find(|r| r.id == id)
        .ok_or_else(|| "Failed to retrieve created rule".to_string())
}

/// Update rule
#[tauri::command]
pub fn update_rule(
    state: State<'_, AppState>,
    id: i64,
    rule_type: String,
    pattern: String,
    category_id: i64,
    priority: i64,
) -> Result<Rule, String> {
    state
        .db
        .update_rule(id, &rule_type, &pattern, category_id, priority)
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    // Return updated rule without querying DB again
    Ok(Rule {
        id,
        rule_type,
        pattern,
        category_id,
        priority,
    })
}

/// Delete a rule
#[tauri::command]
pub fn delete_rule(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    state.db.delete_rule(id).map_err(|e| e.to_string())
}
