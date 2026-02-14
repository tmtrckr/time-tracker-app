//! Category management commands

use crate::database::Category;
use crate::commands::common::{AppState, CategoryResponse, i32_to_opt_bool};
use tauri::State;

/// Get all categories
#[tauri::command]
pub fn get_categories(state: State<'_, AppState>) -> Result<Vec<Category>, String> {
    state.db.get_categories().map_err(|e: rusqlite::Error| e.to_string())
}

/// Create category
/// Принимает is_productive как i32 (-1 для null/neutral, 0 для false, 1 для true)
/// и конвертирует его в Option<bool> для избежания проблем с десериализацией Option<bool> в Tauri
/// Tauri автоматически конвертирует camelCase (sortOrder) в snake_case (sort_order)
#[tauri::command]
pub fn create_category(
    state: State<'_, AppState>,
    name: String,
    color: String,
    icon: Option<String>,
    is_productive: i32,
    sort_order: i64,
    is_system: Option<bool>,
    is_pinned: Option<bool>,
) -> Result<CategoryResponse, String> {
    // Конвертируем числа в Option<bool>: 1 -> Some(true), 0 -> Some(false), -1 -> None
    let is_productive_bool = if is_productive == -1 {
        None
    } else {
        Some(is_productive == 1)
    };
    
    let is_system_bool = is_system.unwrap_or(false);
    let is_pinned_bool = is_pinned.unwrap_or(false);
    
    let id = state
        .db
        .create_category_core(&name, &color, icon.as_deref(), is_productive_bool, sort_order, is_system_bool, is_pinned_bool)
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    let category = state
        .db
        .get_categories()
        .map_err(|e: rusqlite::Error| e.to_string())?
        .into_iter()
        .find(|c| c.id == id)
        .ok_or_else(|| "Failed to retrieve created category".to_string())?;
    
    Ok(CategoryResponse::from(category))
}

/// Update category
/// Принимает is_productive как i32 (-1 для null/neutral, 0 для false, 1 для true)
/// и конвертирует его в Option<bool> для избежания проблем с десериализацией Option<bool> в Tauri
/// Tauri автоматически конвертирует camelCase (sortOrder) в snake_case (sort_order)
#[tauri::command]
pub fn update_category(
    state: State<'_, AppState>,
    id: i64,
    name: String,
    color: String,
    icon: Option<String>,
    is_productive: i32,
    sort_order: i64,
    is_pinned: Option<bool>,
) -> Result<CategoryResponse, String> {
    let is_productive_bool = i32_to_opt_bool(is_productive);

    let current_category = state
        .db
        .get_categories()
        .map_err(|e: rusqlite::Error| e.to_string())?
        .into_iter()
        .find(|c| c.id == id)
        .ok_or_else(|| "Category not found".to_string())?;
    
    let is_pinned_bool = is_pinned.unwrap_or(current_category.is_pinned);
    
    state
        .db
        .update_category_core(id, &name, &color, icon.as_deref(), is_productive_bool, sort_order, is_pinned_bool)
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    Ok(CategoryResponse {
        id,
        name,
        color,
        icon,
        is_productive: is_productive_bool,
        sort_order,
        is_system: current_category.is_system,
        is_pinned: is_pinned_bool,
    })
}

/// Delete category
#[tauri::command]
pub fn delete_category(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    state.db.delete_category(id).map_err(|e| e.to_string())
}

/// Reset system category to default values
#[tauri::command]
pub fn reset_system_category(state: State<'_, AppState>, id: i64) -> Result<CategoryResponse, String> {
    state.db.reset_system_category(id).map_err(|e| e.to_string())?;
    
    let category = state
        .db
        .get_categories()
        .map_err(|e: rusqlite::Error| e.to_string())?
        .into_iter()
        .find(|c| c.id == id)
        .ok_or_else(|| "Category not found".to_string())?;
    
    Ok(CategoryResponse::from(category))
}
