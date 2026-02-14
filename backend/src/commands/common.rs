//! Common types and utilities for commands

use crate::database::Category;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::sync::Mutex;
use crate::database::Database;
use crate::tracker::Tracker;
use crate::plugin_system::{PluginRegistry, ExtensionRegistry};
use crate::plugin_system::loader::PluginLoader;

/// Category response from core commands
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryResponse {
    pub id: i64,
    pub name: String,
    pub color: String,
    pub icon: Option<String>,
    pub is_productive: Option<bool>,
    pub sort_order: i64,
    pub is_system: bool,
    pub is_pinned: bool,
}

impl From<Category> for CategoryResponse {
    fn from(category: Category) -> Self {
        Self {
            id: category.id,
            name: category.name,
            color: category.color,
            icon: category.icon,
            is_productive: category.is_productive,
            sort_order: category.sort_order,
            is_system: category.is_system,
            is_pinned: category.is_pinned,
        }
    }
}

/// Convert i32 from frontend (-1 = null, 0 = false, 1 = true) to Option<bool>.
pub fn i32_to_opt_bool(val: i32) -> Option<bool> {
    match val {
        0 => Some(false),
        1 => Some(true),
        _ => None,
    }
}

/// Application state containing database reference
pub struct AppState {
    pub db: Arc<Database>,
    pub tracker: Arc<Mutex<Option<Arc<Tracker>>>>,
    pub thinking_mode_entry_id: Arc<Mutex<Option<i64>>>,
    pub plugin_registry: Option<Arc<PluginRegistry>>,
    pub extension_registry: Option<Arc<ExtensionRegistry>>,
    pub plugin_loader: Option<Arc<PluginLoader>>,
}
