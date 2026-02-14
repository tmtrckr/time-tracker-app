//! Manual entry commands

use crate::database::ManualEntry;
use crate::commands::common::AppState;
use chrono::Utc;
use tauri::State;

/// Add manual entry
#[tauri::command]
pub fn add_manual_entry(
    state: State<'_, AppState>,
    description: Option<String>,
    category_id: Option<i64>,
    started_at: i64,
    ended_at: i64,
) -> Result<i64, String> {
    state
        .db
        .add_manual_entry(
            description.as_deref(),
            category_id,
            started_at,
            ended_at,
        )
        .map_err(|e: rusqlite::Error| e.to_string())
}

/// Get manual entries for a time range
#[tauri::command]
pub fn get_manual_entries(
    state: State<'_, AppState>,
    start: i64,
    end: i64,
) -> Result<Vec<ManualEntry>, String> {
    state
        .db
        .get_manual_entries(start, end)
        .map_err(|e: rusqlite::Error| e.to_string())
}

/// Submit idle activity (from idle prompt)
/// Updates the existing idle activity with category and description instead of creating a manual entry
#[tauri::command]
pub fn submit_idle_activity(
    state: State<'_, AppState>,
    category_id: i64,
    comment: Option<String>,
    started_at: i64,
) -> Result<(), String> {
    state
        .db
        .update_idle_activity(
            started_at,
            category_id,
            comment.as_deref(),
        )
        .map_err(|e: rusqlite::Error| e.to_string())?;

    Ok(())
}

/// Create manual entry
#[tauri::command]
pub fn create_manual_entry(
    state: State<'_, AppState>,
    description: Option<String>,
    category_id: Option<i64>,
    started_at: i64,
    ended_at: i64,
) -> Result<ManualEntry, String> {
    let id = state
        .db
        .add_manual_entry(
            description.as_deref(),
            category_id,
            started_at,
            ended_at,
        )
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    // Return the created entry
    let entries = state
        .db
        .get_manual_entries(started_at - 1, ended_at + 1)
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    entries
        .into_iter()
        .find(|e| e.id == id)
        .ok_or_else(|| "Failed to retrieve created entry".to_string())
}

/// Update manual entry
#[tauri::command]
pub fn update_manual_entry(
    state: State<'_, AppState>,
    id: i64,
    description: Option<String>,
    category_id: Option<i64>,
    started_at: i64,
    ended_at: i64,
) -> Result<ManualEntry, String> {
    state
        .db
        .update_manual_entry(
            id,
            description.as_deref(),
            category_id,
            started_at,
            ended_at,
        )
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    let updated_entry = state
        .db
        .get_manual_entries(0, i64::MAX)
        .map_err(|e: rusqlite::Error| e.to_string())?
        .into_iter()
        .find(|e| e.id == id)
        .ok_or_else(|| "Failed to retrieve updated entry".to_string())?;
    
    Ok(updated_entry)
}

/// Delete manual entry
#[tauri::command]
pub fn delete_manual_entry(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    state.db.delete_manual_entry(id).map_err(|e| e.to_string())
}

/// Start manual entry (for thinking mode, etc.)
#[tauri::command]
pub fn start_manual_entry(
    state: State<'_, AppState>,
    category_id: i64,
    description: Option<String>,
) -> Result<i64, String> {
    let now = Utc::now().timestamp();
    let id = state
        .db
        .add_manual_entry(
            description.as_deref(),
            Some(category_id),
            now,
            now, // Will be updated when stopped
        )
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    // Store the entry ID for later update
    *state.thinking_mode_entry_id.lock().unwrap() = Some(id);
    
    Ok(id)
}

/// Stop manual entry
#[tauri::command]
pub fn stop_manual_entry(state: State<'_, AppState>) -> Result<ManualEntry, String> {
    let entry_id = state.thinking_mode_entry_id.lock().unwrap().take()
        .ok_or_else(|| "No active manual entry".to_string())?;
    
    let now = Utc::now().timestamp();
    
    // Get the entry to find its start time
    let entry = state
        .db
        .get_manual_entries(now - 86400, now + 86400)
        .map_err(|e: rusqlite::Error| e.to_string())?
        .into_iter()
        .find(|e| e.id == entry_id)
        .ok_or_else(|| "Entry not found".to_string())?;
    
    // Update with end time
    state
        .db
        .update_manual_entry(
            entry_id,
            entry.description.as_deref(),
            entry.category_id,
            entry.started_at,
            now,
        )
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    let updated_entry = state
        .db
        .get_manual_entries(now - 86400, now + 86400)
        .map_err(|e: rusqlite::Error| e.to_string())?
        .into_iter()
        .find(|e| e.id == entry_id)
        .ok_or_else(|| "Failed to retrieve updated entry".to_string())?;
    
    Ok(updated_entry)
}
