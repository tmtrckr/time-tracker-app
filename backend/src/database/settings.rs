//! Settings database operations

use rusqlite::{Result, params};
use super::common::Database;

impl Database {
    /// Get setting value
    pub fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT value FROM settings WHERE key = ?",
            params![key],
            |row| row.get(0),
        )
        .optional()
    }

    /// Set setting value
    pub fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            params![key, value],
        )?;
        Ok(())
    }

    /// Get all settings as a map
    pub fn get_all_settings(&self) -> Result<std::collections::HashMap<String, String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT key, value FROM settings")?;
        let settings_iter = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })?;

        let mut settings = std::collections::HashMap::new();
        for setting in settings_iter {
            let (key, value) = setting?;
            settings.insert(key, value);
        }
        Ok(settings)
    }

    /// Set multiple settings
    pub fn set_settings(&self, settings: &std::collections::HashMap<String, String>) -> Result<()> {
        let mut conn = self.conn.lock().unwrap();
        let tx = conn.transaction()?;
        for (key, value) in settings {
            tx.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                params![key, value],
            )?;
        }
        tx.commit()?;
        Ok(())
    }
}

// Use OptionalExtension from common module
use super::common::OptionalExtension;
