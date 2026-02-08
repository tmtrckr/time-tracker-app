//! Billing Plugin
//! 
//! Manages billable time tracking, extends categories with is_billable and hourly_rate fields

use time_tracker_plugin_sdk::{Plugin, PluginInfo, PluginAPIInterface, EntityType, SchemaChange, ModelField};
use serde_json;

pub struct BillingPlugin {
    info: PluginInfo,
}

impl BillingPlugin {
    pub fn new() -> Self {
        Self {
            info: PluginInfo {
                id: "billing-plugin".to_string(),
                name: "Billing".to_string(),
                version: "1.0.0".to_string(),
                description: Some("Billable time tracking".to_string()),
                is_builtin: false,
            },
        }
    }
}

impl Plugin for BillingPlugin {
    fn info(&self) -> &PluginInfo {
        &self.info
    }
    
    fn initialize(&mut self, api: &dyn PluginAPIInterface) -> Result<(), String> {
        // Register schema extensions for categories
        api.register_schema_extension(
            EntityType::Category,
            vec![
                SchemaChange::AddColumn {
                    table: "categories".to_string(),
                    column: "is_billable".to_string(),
                    column_type: "BOOLEAN".to_string(),
                    default: Some("FALSE".to_string()),
                    foreign_key: None,
                },
                SchemaChange::AddColumn {
                    table: "categories".to_string(),
                    column: "hourly_rate".to_string(),
                    column_type: "REAL".to_string(),
                    default: Some("0.0".to_string()),
                    foreign_key: None,
                },
            ],
        )?;
        
        // Register model extensions
        api.register_model_extension(
            EntityType::Category,
            vec![
                ModelField {
                    name: "is_billable".to_string(),
                    type_: "Option<bool>".to_string(),
                    optional: true,
                },
                ModelField {
                    name: "hourly_rate".to_string(),
                    type_: "Option<f64>".to_string(),
                    optional: true,
                },
            ],
        )?;
        
        Ok(())
    }
    
    fn invoke_command(&self, command: &str, params: serde_json::Value, api: &dyn PluginAPIInterface) -> Result<serde_json::Value, String> {
        match command {
            "get_billable_hours" => api.call_db_method("get_billable_hours", params),
            "get_billable_revenue" => api.call_db_method("get_billable_revenue", params),
            _ => Err(format!("Unknown command: {}", command)),
        }
    }
    
    fn shutdown(&self) -> Result<(), String> {
        Ok(())
    }
}

// FFI exports for dynamic loading
#[no_mangle]
pub extern "C" fn _plugin_create() -> *mut dyn Plugin {
    Box::into_raw(Box::new(BillingPlugin::new()))
}

#[no_mangle]
pub extern "C" fn _plugin_destroy(plugin: *mut dyn Plugin) {
    unsafe {
        let _ = Box::from_raw(plugin);
    }
}
