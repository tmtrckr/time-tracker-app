# Plugins Directory

This directory contains built-in plugins that will eventually be moved to separate repositories.

## Current Status

All 4 plugins have been successfully extracted into self-contained directories:

- `projects-tasks/` - Projects and Tasks management
- `billing/` - Billable time tracking  
- `pomodoro/` - Pomodoro timer and focus sessions
- `goals/` - Goal tracking

Each plugin has:
- `Cargo.toml` - Plugin crate configuration (cdylib for dynamic loading)
- `plugin.toml` - Plugin manifest
- `src/lib.rs` - Plugin implementation with FFI exports (`_plugin_create`, `_plugin_destroy`)

## Database Access

✅ **RESOLVED**: Plugins now use `PluginAPIInterface.call_db_method()` for database access, eliminating direct Database dependencies. This enables true dynamic loading.

## Migration Path

1. ✅ Phase 1-3: SDK created, dynamic loading infrastructure ready
2. 🔄 Phase 4: Moving plugins to separate directories (in progress)
3. ⏳ Phase 5: Frontend dynamic loading
4. ⏳ Phase 6: Registry setup
5. ⏳ Phase 7: Core cleanup + PluginAPI database access refactor
