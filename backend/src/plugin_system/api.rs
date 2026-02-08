//! Plugin API - interface for plugins to interact with Core

use crate::database::Database;
use crate::plugin_system::extensions::{ExtensionRegistry, Extension, ExtensionType, EntityType, SchemaChange, ModelField, ActivityHook, QueryFilter};
use std::sync::Arc;
use time_tracker_plugin_sdk::{PluginAPIInterface, EntityType as SDKEntityType, SchemaChange as SDKSchemaChange, ModelField as SDKModelField, QueryFilter as SDKQueryFilter};

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

impl PluginAPIInterface for PluginAPI {
    fn register_schema_extension(
        &self,
        entity_type: SDKEntityType,
        schema_changes: Vec<SDKSchemaChange>,
    ) -> Result<(), String> {
        // Convert SDK types to backend types
        let entity_type_backend = match entity_type {
            SDKEntityType::Activity => EntityType::Activity,
            SDKEntityType::ManualEntry => EntityType::ManualEntry,
            SDKEntityType::Category => EntityType::Category,
        };
        
        let schema_changes_backend: Vec<SchemaChange> = schema_changes.into_iter().map(|sc| {
            match sc {
                SDKSchemaChange::CreateTable { table, columns } => {
                    // Convert CreateTable to multiple AddColumn operations for now
                    // TODO: Update database.rs to handle CreateTable directly
                    SchemaChange::AddColumn {
                        table: table.clone(),
                        column: columns[0].name.clone(),
                        column_type: columns[0].column_type.clone(),
                        default: columns[0].default.clone(),
                        foreign_key: columns[0].foreign_key.clone(),
                    }
                }
                SDKSchemaChange::AddColumn { table, column, column_type, default, foreign_key } => {
                    SchemaChange::AddColumn { table, column, column_type, default, foreign_key }
                }
                SDKSchemaChange::AddIndex { table, index, columns } => {
                    SchemaChange::AddIndex { table, index, columns }
                }
                SDKSchemaChange::AddForeignKey { table, column, foreign_table, foreign_column } => {
                    SchemaChange::AddForeignKey { table, column, foreign_table, foreign_column }
                }
            }
        }).collect();
        
        self.register_extension(Extension {
            plugin_id: self.plugin_id.clone(),
            entity_type: entity_type_backend,
            extension_type: ExtensionType::DatabaseSchema,
            schema_changes: schema_changes_backend,
            model_fields: vec![],
            hook: None,
            query_filters: vec![],
        })
    }
    
    fn register_model_extension(
        &self,
        entity_type: SDKEntityType,
        model_fields: Vec<SDKModelField>,
    ) -> Result<(), String> {
        let entity_type_backend = match entity_type {
            SDKEntityType::Activity => EntityType::Activity,
            SDKEntityType::ManualEntry => EntityType::ManualEntry,
            SDKEntityType::Category => EntityType::Category,
        };
        
        let model_fields_backend: Vec<ModelField> = model_fields.into_iter().map(|mf| {
            ModelField {
                name: mf.name,
                type_: mf.type_,
                optional: mf.optional,
            }
        }).collect();
        
        self.register_extension(Extension {
            plugin_id: self.plugin_id.clone(),
            entity_type: entity_type_backend,
            extension_type: ExtensionType::Model,
            schema_changes: vec![],
            model_fields: model_fields_backend,
            hook: None,
            query_filters: vec![],
        })
    }
    
    fn register_query_filters(
        &self,
        entity_type: SDKEntityType,
        query_filters: Vec<SDKQueryFilter>,
    ) -> Result<(), String> {
        // SDK QueryFilter uses serde_json::Value, backend QueryFilter uses Activity
        // This conversion will need to be handled differently - for now, return error
        // TODO: Refactor QueryFilter to work with SDK types
        Err("Query filters conversion not yet implemented".to_string())
    }
}
