//! System tray module - Manages the system tray icon and menu

use tauri::{
    AppHandle, CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem,
};

/// Create the system tray
pub fn create_tray() -> SystemTray {
    let menu = create_tray_menu("0h 0m");
    SystemTray::new().with_menu(menu)
}

/// Create the tray menu with current time
pub fn create_tray_menu(today_time: &str) -> SystemTrayMenu {
    let today = CustomMenuItem::new("today", format!("Today: {}", today_time)).disabled();
    let separator1 = SystemTrayMenuItem::Separator;
    
    let start_activity = CustomMenuItem::new("start_activity", "▶️  Start Activity");
    let thinking_mode = CustomMenuItem::new("thinking_mode", "🧠 Thinking Mode");
    let pause = CustomMenuItem::new("pause", "⏸️  Pause Tracking");
    
    let separator2 = SystemTrayMenuItem::Separator;
    
    let dashboard = CustomMenuItem::new("dashboard", "📊 Open Dashboard");
    let reports = CustomMenuItem::new("reports", "📄 Reports");
    let settings = CustomMenuItem::new("settings", "⚙️  Settings");
    
    let separator3 = SystemTrayMenuItem::Separator;
    
    let quit = CustomMenuItem::new("quit", "❌ Quit");

    SystemTrayMenu::new()
        .add_item(today)
        .add_native_item(separator1)
        .add_item(start_activity)
        .add_item(thinking_mode)
        .add_item(pause)
        .add_native_item(separator2)
        .add_item(dashboard)
        .add_item(reports)
        .add_item(settings)
        .add_native_item(separator3)
        .add_item(quit)
}

/// Update tray menu with new time
pub fn update_tray_time(app: &AppHandle, total_seconds: i64) {
    let hours = total_seconds / 3600;
    let minutes = (total_seconds % 3600) / 60;
    let time_str = format!("{}h {}m", hours, minutes);
    
    let new_menu = create_tray_menu(&time_str);
    if let Err(e) = app.tray_handle().set_menu(new_menu) {
        eprintln!("Failed to update tray menu: {}", e);
    }
}

/// Handle tray events
pub fn handle_tray_event(app: &AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::LeftClick { .. } => {
            // Show/focus main window on left click
            if let Some(window) = app.get_window("main") {
                window.show().ok();
                window.set_focus().ok();
            }
        }
        SystemTrayEvent::MenuItemClick { id, .. } => {
            handle_menu_click(app, &id);
        }
        _ => {}
    }
}

/// Handle menu item clicks
fn handle_menu_click(app: &AppHandle, id: &str) {
    match id {
        "quit" => {
            // Stop tracker before exit so last activity is flushed
            if let Some(state) = app.try_state::<crate::commands::AppState>() {
                if let Ok(guard) = state.tracker.lock() {
                    if let Some(t) = guard.as_ref() {
                        t.stop();
                    }
                }
            }
            app.exit(0);
        }
        "dashboard" => {
            if let Some(window) = app.get_window("main") {
                window.show().ok();
                window.set_focus().ok();
                // Emit event to switch to dashboard view
                window.emit("navigate", "dashboard").ok();
            }
        }
        "reports" => {
            if let Some(window) = app.get_window("main") {
                window.show().ok();
                window.set_focus().ok();
                // Emit event to switch to reports view
                window.emit("navigate", "reports").ok();
            }
        }
        "settings" => {
            if let Some(window) = app.get_window("main") {
                window.show().ok();
                window.set_focus().ok();
                // Emit event to switch to settings view
                window.emit("navigate", "settings").ok();
            }
        }
        "start_activity" => {
            if let Some(window) = app.get_window("main") {
                window.show().ok();
                window.set_focus().ok();
                // Emit event to open manual entry dialog
                window.emit("open-manual-entry", ()).ok();
            }
        }
        "thinking_mode" => {
            // Emit event to start thinking mode
            if let Some(window) = app.get_window("main") {
                window.emit("start-thinking-mode", ()).ok();
            }
        }
        "pause" => {
            // Toggle pause state
            if let Some(window) = app.get_window("main") {
                window.emit("toggle-pause", ()).ok();
            }
        }
        _ => {}
    }
}
