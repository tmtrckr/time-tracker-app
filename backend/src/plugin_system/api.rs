//! Plugin API - interface for plugins to interact with Core

use crate::database::Database;
use crate::plugin_system::extensions::{ExtensionRegistry, Extension, ExtensionType, EntityType, SchemaChange, ModelField, ActivityHook, QueryFilter};
use std::sync::Arc;

/// Plugin API provides plugins with access to Core functionality
pub struct PluginAPI {
    db: Arc<Database>,
    extension_registry: Arc<ExtensionRegistry>,
    plugin_id: String,
}

impl PluginAPI {
    /// Create a new Plugin API instance
    pub fn new(db: Arc<Database>, extension_registry: Arc<ExtensionRegistry>, plugin_id: String) -> Self {
        Self {
            db,
            extension_registry,
            plugin_id,
        }
    }
    
    /// Get database access
    pub fn database(&self) -> &Arc<Database> {
        &self.db
    }
    
    /// Register an extension
    pub fn register_extension(&self, mut extension: Extension) -> Result<(), String> {
        extension.plugin_id = self.plugin_id.clone();
        self.extension_registry.register(extension)
    }
    
    /// Register a database schema extension
    pub fn register_schema_extension(
        &self,
        entity_type: EntityType,
        schema_changes: Vec<SchemaChange>,
    ) -> Result<(), String> {
        self.register_extension(Extension {
            plugin_id: self.plugin_id.clone(),
            entity_type,
            extension_type: ExtensionType::DatabaseSchema,
            schema_changes,
            model_fields: vec![],
            hook: None,
            query_filters: vec![],
        })
    }
    
    /// Register a model extension
    pub fn register_model_extension(
        &self,
        entity_type: EntityType,
        model_fields: Vec<ModelField>,
    ) -> Result<(), String> {
        self.register_extension(Extension {
            plugin_id: self.plugin_id.clone(),
            entity_type,
            extension_type: ExtensionType::Model,
            schema_changes: vec![],
            model_fields,
            hook: None,
            query_filters: vec![],
        })
    }
    
    /// Register a data hook
    pub fn register_data_hook(
        &self,
        entity_type: EntityType,
        hook: ActivityHook,
    ) -> Result<(), String> {
        self.register_extension(Extension {
            plugin_id: self.plugin_id.clone(),
            entity_type,
            extension_type: ExtensionType::DataHook,
            schema_changes: vec![],
            model_fields: vec![],
            hook: Some(hook),
            query_filters: vec![],
        })
    }
    
    /// Register query filters
    pub fn register_query_filters(
        &self,
        entity_type: EntityType,
        query_filters: Vec<QueryFilter>,
    ) -> Result<(), String> {
        self.register_extension(Extension {
            plugin_id: self.plugin_id.clone(),
            entity_type,
            extension_type: ExtensionType::Query,
            schema_changes: vec![],
            model_fields: vec![],
            hook: None,
            query_filters,
        })
    }
}
