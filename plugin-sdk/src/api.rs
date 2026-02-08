//! Plugin API interface trait
//!
//! This trait abstracts the Plugin API so that plugins can work with
//! any implementation. The concrete implementation in the core app
//! provides access to Database and ExtensionRegistry.

use crate::extensions::{EntityType, SchemaChange, ModelField, QueryFilter};
use serde_json;

/// Abstract interface for plugins to interact with Core
pub trait PluginAPIInterface: Send + Sync {
    /// Register a database schema extension
    fn register_schema_extension(
        &self,
        entity_type: EntityType,
        schema_changes: Vec<SchemaChange>,
    ) -> Result<(), String>;
    
    /// Register a model extension
    fn register_model_extension(
        &self,
        entity_type: EntityType,
        model_fields: Vec<ModelField>,
    ) -> Result<(), String>;
    
    /// Register query filters
    fn register_query_filters(
        &self,
        entity_type: EntityType,
        query_filters: Vec<QueryFilter>,
    ) -> Result<(), String>;
    
    /// Call a database method by name with JSON parameters
    /// This allows plugins to access database functionality without direct Database dependency
    /// Method names match Database methods (e.g., "create_project", "get_projects")
    /// Parameters are passed as a JSON object, return value is JSON
    fn call_db_method(&self, method: &str, params: serde_json::Value) -> Result<serde_json::Value, String>;
}
