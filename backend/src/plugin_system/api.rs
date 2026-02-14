//! Plugin API - interface for plugins to interact with Core

use crate::database::Database;
use crate::plugin_system::extensions::{ExtensionRegistry, Extension, ActivityHook, QueryFilter};
use std::sync::Arc;
use time_tracker_plugin_sdk::{
    PluginAPIInterface, 
    EntityType, ExtensionType, SchemaChange, ModelField,
    EntityType as SDKEntityType, 
    SchemaChange as SDKSchemaChange, 
    ModelField as SDKModelField, 
    QueryFilter as SDKQueryFilter
};

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
        _entity_type: SDKEntityType,
        _query_filters: Vec<SDKQueryFilter>,
    ) -> Result<(), String> {
        // SDK QueryFilter uses serde_json::Value, backend QueryFilter uses Activity
        // This conversion will need to be handled differently - for now, return error
        // TODO: Refactor QueryFilter to work with SDK types
        Err("Query filters conversion not yet implemented".to_string())
    }
    
    fn call_db_method(&self, method: &str, params: serde_json::Value) -> Result<serde_json::Value, String> {
        // Route database method calls to the appropriate handler
        let params_map = params.as_object().ok_or("Params must be an object")?;
        
        match method {
            // Category methods
            "create_category" => {
                let name = params_map["name"].as_str().ok_or("Missing name")?.to_string();
                let color = params_map["color"].as_str().unwrap_or("#888888").to_string();
                let icon = params_map["icon"].as_str().map(|s| s.to_string());
                let is_productive = params_map["is_productive"].as_bool();
                let sort_order = params_map["sort_order"].as_i64().unwrap_or(0);
                let is_system = params_map["is_system"].as_bool().unwrap_or(false);
                let is_pinned = params_map["is_pinned"].as_bool().unwrap_or(false);

                let id = self.db.create_category_core(
                    &name,
                    &color,
                    icon.as_deref(),
                    is_productive,
                    sort_order,
                    is_system,
                    is_pinned,
                ).map_err(|e| e.to_string())?;

                let categories = self.db.get_categories().map_err(|e| e.to_string())?;
                let category = categories.into_iter()
                    .find(|c| c.id == id)
                    .ok_or_else(|| "Failed to retrieve created category".to_string())?;
                Ok(serde_json::to_value(category).map_err(|e| e.to_string())?)
            }
            "update_category" => {
                let id = params_map["id"].as_i64().ok_or("Missing id")?;
                let name = params_map["name"].as_str().ok_or("Missing name")?.to_string();
                let color = params_map["color"].as_str().unwrap_or("#888888").to_string();
                let icon = params_map["icon"].as_str().map(|s| s.to_string());
                let is_productive = params_map["is_productive"].as_bool();
                let sort_order = params_map["sort_order"].as_i64().unwrap_or(0);
                let is_pinned = params_map["is_pinned"].as_bool();

                let current = self.db.get_categories().map_err(|e| e.to_string())?
                    .into_iter()
                    .find(|c| c.id == id)
                    .ok_or_else(|| "Category not found".to_string())?;

                let is_pinned_bool = is_pinned.unwrap_or(current.is_pinned);

                self.db.update_category_core(
                    id,
                    &name,
                    &color,
                    icon.as_deref(),
                    is_productive.or(current.is_productive),
                    sort_order,
                    is_pinned_bool,
                ).map_err(|e| e.to_string())?;

                let categories = self.db.get_categories().map_err(|e| e.to_string())?;
                let category = categories.into_iter()
                    .find(|c| c.id == id)
                    .ok_or_else(|| "Category not found".to_string())?;
                Ok(serde_json::to_value(category).map_err(|e| e.to_string())?)
            }
            "get_categories" => {
                let categories = self.db.get_categories().map_err(|e| e.to_string())?;
                Ok(serde_json::to_value(categories).map_err(|e| e.to_string())?)
            }
            "delete_category" => {
                let id = params_map["id"].as_i64().ok_or("Missing id")?;
                self.db.delete_category(id).map_err(|e| e.to_string())?;
                Ok(serde_json::json!({}))
            }
            // Manual entry methods
            "create_manual_entry" => {
                let description = params_map["description"].as_str().map(|s| s.to_string());
                let category_id = params_map["category_id"].as_i64();
                let started_at = params_map["started_at"].as_i64().ok_or("Missing started_at")?;
                let ended_at = params_map["ended_at"].as_i64().ok_or("Missing ended_at")?;

                let id = self.db.add_manual_entry(
                    description.as_deref(),
                    category_id,
                    started_at,
                    ended_at,
                ).map_err(|e| e.to_string())?;

                let entries = self.db.get_manual_entries(started_at.saturating_sub(1), ended_at.saturating_add(1))
                    .map_err(|e| e.to_string())?;
                let entry = entries.into_iter()
                    .find(|e| e.id == id)
                    .ok_or_else(|| "Failed to retrieve created entry".to_string())?;
                Ok(serde_json::to_value(entry).map_err(|e| e.to_string())?)
            }
            "update_manual_entry" => {
                let id = params_map["id"].as_i64().ok_or("Missing id")?;
                let description = params_map["description"].as_str().map(|s| s.to_string());
                let category_id = params_map["category_id"].as_i64();
                let started_at = params_map["started_at"].as_i64().ok_or("Missing started_at")?;
                let ended_at = params_map["ended_at"].as_i64().ok_or("Missing ended_at")?;

                let current = self.db.get_manual_entries(0, i64::MAX).map_err(|e| e.to_string())?
                    .into_iter()
                    .find(|e| e.id == id)
                    .ok_or_else(|| "Manual entry not found".to_string())?;

                let category_id = category_id.or(current.category_id);
                let description_ref = description
                    .as_deref()
                    .or(current.description.as_deref());
                self.db.update_manual_entry(
                    id,
                    description_ref,
                    category_id,
                    started_at,
                    ended_at,
                ).map_err(|e| e.to_string())?;

                let entries = self.db.get_manual_entries(0, i64::MAX).map_err(|e| e.to_string())?;
                let entry = entries.into_iter()
                    .find(|e| e.id == id)
                    .ok_or_else(|| "Manual entry not found".to_string())?;
                Ok(serde_json::to_value(entry).map_err(|e| e.to_string())?)
            }
            "get_manual_entries" => {
                let start = params_map["start"].as_i64().ok_or("Missing start")?;
                let end = params_map["end"].as_i64().ok_or("Missing end")?;
                let entries = self.db.get_manual_entries(start, end).map_err(|e| e.to_string())?;
                Ok(serde_json::to_value(entries).map_err(|e| e.to_string())?)
            }
            "delete_manual_entry" => {
                let id = params_map["id"].as_i64().ok_or("Missing id")?;
                self.db.delete_manual_entry(id).map_err(|e| e.to_string())?;
                Ok(serde_json::json!({}))
            }
            _ => Err(format!("Unknown database method: {}", method))
        }
    }
}
