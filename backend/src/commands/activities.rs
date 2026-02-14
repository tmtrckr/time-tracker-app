//! Activity-related commands

use crate::database::Activity;
use crate::commands::common::AppState;
use tauri::State;

/// Get activities for a time range with optional pagination (lazy loading)
/// If limit is None, returns all activities (backward compatibility)
#[tauri::command]
pub fn get_activities(
    state: State<'_, AppState>,
    start: i64,
    end: i64,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<Activity>, String> {
    state
        .db
        .get_activities(start, end, limit, offset)
        .map_err(|e: rusqlite::Error| e.to_string())
}

/// Get activity by ID
#[tauri::command]
pub fn get_activity(
    state: State<'_, AppState>,
    id: i64,
) -> Result<Option<Activity>, String> {
    state
        .db
        .get_activity_by_id(id)
        .map_err(|e: rusqlite::Error| e.to_string())
}

/// Update activity category
#[tauri::command]
pub fn update_activity_category(
    state: State<'_, AppState>,
    activity_id: i64,
    category_id: Option<i64>,
) -> Result<(), String> {
    state
        .db
        .update_activity_category(activity_id, category_id)
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    // Apply plugin hooks if extension registry is available
    if let Some(extension_registry) = &state.extension_registry {
        if let Ok(Some(mut activity)) = state.db.get_activity_by_id(activity_id) {
            use std::sync::Arc;
            if let Err(e) = extension_registry.apply_activity_hooks(&mut activity, &Arc::clone(&state.db)) {
                eprintln!("Warning: Failed to apply activity hooks: {}", e);
            }
        }
    }
    
    Ok(())
}

/// Delete activity
#[tauri::command]
pub fn delete_activity(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    state.db.delete_activity(id).map_err(|e: rusqlite::Error| e.to_string())
}

/// Reapply categorization rules to all activities
#[tauri::command]
pub fn reapply_categorization_rules(state: State<'_, AppState>) -> Result<(), String> {
    state.db.reapply_categorization_rules().map_err(|e: rusqlite::Error| e.to_string())
}
