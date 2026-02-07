# Plugin System

## Overview

The plugin system allows extending TimeTracker functionality through plugins. Plugins can:
- Extend Core entities (activities, manual_entries, categories) with new fields
- Register new commands
- Add UI components and widgets
- Extend database schema

## Architecture

### Core Components

1. **PluginRegistry** - Manages loaded plugins
2. **ExtensionRegistry** - Manages extensions to Core entities
3. **PluginAPI** - Interface for plugins to interact with Core
4. **Extension API** - Allows plugins to extend Core entities

### Extension Types

- **DatabaseSchema** - Add columns to Core tables
- **Model** - Add fields to Core data structures
- **DataHook** - Hook into data processing (e.g., when activities are created)
- **Query** - Add query filters for activities
- **UIForm** - Extend UI forms with new fields

## Plugin Implementation

A plugin must implement the `Plugin` trait:

```rust
pub trait Plugin: Send + Sync {
    fn info(&self) -> &PluginInfo;
    fn initialize(&mut self, api: &PluginAPI) -> Result<(), String>;
    fn invoke_command(&self, command: &str, params: serde_json::Value) -> Result<serde_json::Value, String>;
    fn shutdown(&self) -> Result<(), String>;
}
```

## Example: Projects/Tasks Plugin

The Projects/Tasks plugin extends activities and manual_entries with `project_id` and `task_id` fields:

1. Register schema extensions to add columns to `activities` and `manual_entries` tables
2. Register model extensions to add fields to Activity and ManualEntry structs
3. Register data hooks to automatically set project_id/task_id when activities are created
4. Provide commands for managing projects and tasks

## Migration Strategy

Plugins are migrated gradually:
1. Infrastructure is created (Phase 0) ✅
2. Plugins are created and registered
3. Dual mode allows old and new code to coexist
4. Old code is removed after migration is complete

## Built-in Plugins

The following plugins are installed automatically:
- `projects-tasks-plugin` - Project and task management
- `billing-plugin` - Billable time tracking
- `pomodoro-plugin` - Pomodoro timer
- `goals-plugin` - Goal tracking
