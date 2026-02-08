//! Plugin system module
//! 
//! Provides infrastructure for loading and managing plugins, including:
//! - Plugin registry
//! - Extension API for extending Core entities
//! - Dynamic library loading
//! - Plugin lifecycle management
//! - Plugin discovery from registry and GitHub
//! - Plugin installation and loading

pub mod registry;
pub mod extensions;
pub mod api;
pub mod discovery;
pub mod loader;

pub use registry::{PluginRegistry, Plugin, PluginInfo};
pub use extensions::{ExtensionRegistry, Extension, ExtensionType, EntityType, SchemaChange, ModelField};
pub use api::PluginAPI;
pub use discovery::{PluginDiscovery, RegistryPlugin, PluginManifest};
pub use loader::PluginLoader;
