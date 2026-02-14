//! Window management commands

use tauri::{AppHandle, Manager};

/// Show main window
#[tauri::command]
pub fn show_main_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Hide main window
#[tauri::command]
pub fn hide_main_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Show idle prompt
#[tauri::command]
pub fn show_idle_prompt(
    app: AppHandle,
    idle_duration: u64,
    _idle_start: i64,
) -> Result<(), String> {
    if let Some(window) = app.get_window("main") {
        window
            .emit("idle-return", serde_json::json!({ "duration_minutes": idle_duration / 60 }))
            .map_err(|e| e.to_string())?;
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}
