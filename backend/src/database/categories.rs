//! Category management database operations

use rusqlite::{Result, params};
use super::common::Database;
use super::models::Category;

impl Database {
    /// Get all categories
    pub fn get_categories(&self) -> Result<Vec<Category>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, color, icon, is_productive, sort_order, is_system, is_pinned
             FROM categories
             ORDER BY sort_order ASC",
        )?;

        let categories = stmt
            .query_map([], |row| {
                Ok(Category {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    color: row.get(2)?,
                    icon: row.get(3)?,
                    is_productive: row.get(4)?,
                    sort_order: row.get(5)?,
                    is_system: row.get(6)?,
                    is_pinned: row.get(7)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(categories)
    }

    /// Create category
    pub fn create_category_core(
        &self,
        name: &str,
        color: &str,
        icon: Option<&str>,
        is_productive: Option<bool>,
        sort_order: i64,
        is_system: bool,
        is_pinned: bool,
    ) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO categories (name, color, icon, is_productive, sort_order, is_system, is_pinned)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
            params![name, color, icon, is_productive, sort_order, is_system, is_pinned],
        )
        .map_err(|e| {
            if let rusqlite::Error::SqliteFailure(ref err, Some(ref msg)) = e {
                if err.code == rusqlite::ffi::ErrorCode::ConstraintViolation
                    && (msg.contains("categories.name") 
                        || (msg.contains("UNIQUE constraint") && msg.contains("categories")))
                {
                    return rusqlite::Error::SqliteFailure(
                        rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CONSTRAINT),
                        Some("A category with this name already exists".to_string()),
                    );
                }
            }
            e
        })?;
        Ok(conn.last_insert_rowid())
    }


    /// Reset system category to default values
    pub fn reset_system_category(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        let is_system: bool = conn.query_row(
            "SELECT is_system FROM categories WHERE id = ?",
            params![id],
            |row| row.get(0),
        )?;

        if !is_system {
            return Err(rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CONSTRAINT),
                Some("Only system categories can be reset".to_string()),
            ));
        }

        let category_name: String = conn.query_row(
            "SELECT name FROM categories WHERE id = ?",
            params![id],
            |row| row.get(0),
        )?;

        let (color, icon, is_productive, sort_order, is_pinned) = match category_name.as_str() {
            "Thinking" => ("#00BCD4", Some("🧠"), Some(true), 6, true),
            "Break" => ("#795548", Some("☕"), Some(false), 7, true),
            "Uncategorized" => ("#9E9E9E", Some("❓"), None::<bool>, 8, false),
            _ => {
                return Err(rusqlite::Error::SqliteFailure(
                    rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CONSTRAINT),
                    Some(format!("Unknown system category: {}", category_name)),
                ));
            }
        };

        conn.execute(
            "UPDATE categories SET color = ?, icon = ?, is_productive = ?, sort_order = ?, is_pinned = ?
             WHERE id = ?",
            params![color, icon, is_productive, sort_order, is_pinned, id],
        )?;
        
        Ok(())
    }

    /// Update category core fields only
    pub fn update_category_core(
        &self,
        id: i64,
        name: &str,
        color: &str,
        icon: Option<&str>,
        is_productive: Option<bool>,
        sort_order: i64,
        is_pinned: bool,
    ) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        conn.execute(
            "UPDATE categories SET name = ?, color = ?, icon = ?, is_productive = ?, sort_order = ?, is_pinned = ?
             WHERE id = ?",
            params![name, color, icon, is_productive, sort_order, is_pinned, id],
        )
        .map_err(|e| {
            if let rusqlite::Error::SqliteFailure(ref err, Some(ref msg)) = e {
                if err.code == rusqlite::ffi::ErrorCode::ConstraintViolation
                    && (msg.contains("categories.name") 
                        || (msg.contains("UNIQUE constraint") && msg.contains("categories")))
                {
                    return rusqlite::Error::SqliteFailure(
                        rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CONSTRAINT),
                        Some("A category with this name already exists".to_string()),
                    );
                }
            }
            e
        })?;
        Ok(())
    }


    /// Delete category (with validation)
    pub fn delete_category(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        let is_system: bool = conn.query_row(
            "SELECT is_system FROM categories WHERE id = ?",
            params![id],
            |row| row.get(0),
        )?;

        if is_system {
            return Err(rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CONSTRAINT),
                Some("Cannot delete system category".to_string()),
            ));
        }
        
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM activities WHERE category_id = ?",
            params![id],
            |row| row.get(0),
        )?;

        if count > 0 {
            return Err(rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CONSTRAINT),
                Some(format!("Category is used by {} activities", count)),
            ));
        }

        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM rules WHERE category_id = ?",
            params![id],
            |row| row.get(0),
        )?;

        if count > 0 {
            return Err(rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CONSTRAINT),
                Some(format!("Category is used by {} rules", count)),
            ));
        }

        conn.execute("DELETE FROM categories WHERE id = ?", params![id])?;
        Ok(())
    }

    /// Find category by name
    pub fn find_category_by_name(&self, name: &str) -> Result<Option<i64>> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT id FROM categories WHERE LOWER(name) = LOWER(?)",
            params![name],
            |row| row.get(0),
        )
        .optional()
    }
}

// Use OptionalExtension from common module
use super::common::OptionalExtension;
