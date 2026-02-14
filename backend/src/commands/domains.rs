//! Domain statistics commands

use crate::commands::common::AppState;
use crate::database::DomainStat;
use tauri::State;

/// Get top domains for a time range
#[tauri::command]
pub fn get_top_domains(
    state: State<'_, AppState>,
    start: i64,
    end: i64,
    limit: i64,
) -> Result<Vec<DomainStat>, String> {
    state
        .db
        .get_top_domains(start, end, limit)
        .map_err(|e| e.to_string())
}
