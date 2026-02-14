//! Database module for SQLite operations
//!
//! This module is organized into submodules by domain:
//! - models: Data structures and types
//! - common: Common utilities, constants, and schema initialization
//! - activities: Activity-related database operations
//! - categories: Category management operations
//! - rules: Rule management operations
//! - manual_entries: Manual entry operations
//! - settings: Settings operations
//! - stats: Statistics and reporting operations
//! - plugins: Plugin management operations
//!

pub mod models;
pub mod common;
pub mod activities;
pub mod categories;
pub mod rules;
pub mod manual_entries;
pub mod settings;
pub mod stats;
pub mod plugins;

// Re-export Database and constants
pub use common::{Database, SYSTEM_CATEGORY_UNCATEGORIZED, SYSTEM_CATEGORY_BREAK, SYSTEM_CATEGORY_THINKING};

// Re-export all models
pub use models::*;

// Re-export methods from core domain modules only
pub use activities::*;
pub use categories::*;
pub use rules::*;
pub use manual_entries::*;
pub use settings::*;
pub use stats::*;
pub use plugins::*;
