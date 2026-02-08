//! Plugin API interface trait
//!
//! This trait abstracts the Plugin API so that plugins can work with
//! any implementation. The concrete implementation in the core app
//! provides access to Database and ExtensionRegistry.

use crate::extensions::{EntityType, SchemaChange, ModelField, QueryFilter};

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
}
