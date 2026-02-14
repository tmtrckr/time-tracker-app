//! Idle detection commands

use crate::commands::common::AppState;
use tauri::State;

/// Get idle time
#[tauri::command]
pub fn get_idle_time() -> Result<u64, String> {
    let monitor = crate::idle::IdleMonitor::new();
    Ok(monitor.get_idle_time())
}

/// Check idle state
#[tauri::command]
pub fn check_idle_state(seconds: Option<u64>) -> Result<bool, String> {
    let monitor = crate::idle::IdleMonitor::new();
    Ok(if let Some(secs) = seconds {
        monitor.is_idle_for(secs)
    } else {
        monitor.is_idle()
    })
}

/// Classify idle time
#[tauri::command]
pub fn classify_idle_time(
    state: State<'_, AppState>,
    idle_start: i64,
    idle_end: i64,
    classification: String,
    description: Option<String>,
) -> Result<(), String> {
    let category_id = state
        .db
        .find_category_by_name(&classification)
        .map_err(|e| e.to_string())?;
    
    state
        .db
        .add_manual_entry(
            description.as_deref(),
            category_id,
            idle_start,
            idle_end,
        )
        .map_err(|e| e.to_string())?;
    
    Ok(())
}
