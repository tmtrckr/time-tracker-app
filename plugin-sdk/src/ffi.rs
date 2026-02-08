//! FFI types for dynamic plugin loading
//!
//! Plugins compiled as dynamic libraries (.dll/.so/.dylib) must export
//! these functions to be loadable by the core application.

use crate::plugin::Plugin;

/// Function pointer type for creating a plugin instance
/// Plugins must export a function with this signature: `#[no_mangle] pub extern "C" fn _plugin_create() -> *mut dyn Plugin`
pub type PluginCreateFn = unsafe extern "C" fn() -> *mut dyn Plugin;

/// Function pointer type for destroying a plugin instance
/// Plugins must export a function with this signature: `#[no_mangle] pub extern "C" fn _plugin_destroy(plugin: *mut dyn Plugin)`
pub type PluginDestroyFn = unsafe extern "C" fn(*mut dyn Plugin);
