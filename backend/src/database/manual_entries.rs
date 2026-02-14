//! Manual entry database operations

use rusqlite::{Result, params};
use super::common::Database;
use super::models::ManualEntry;

impl Database {
    /// Add a manual entry
    pub fn add_manual_entry(
        &self,
        description: Option<&str>,
        category_id: Option<i64>,
        started_at: i64,
        ended_at: i64,
    ) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO manual_entries (entry_type, description, category_id, started_at, ended_at)
             VALUES ('', ?, ?, ?, ?)",
            params![description, category_id, started_at, ended_at],
        )?;
        Ok(conn.last_insert_rowid())
    }

    /// Get manual entries for a time range
    pub fn get_manual_entries(&self, start: i64, end: i64) -> Result<Vec<ManualEntry>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, description, category_id, started_at, ended_at
             FROM manual_entries
             WHERE started_at >= ? AND started_at <= ?
             ORDER BY started_at ASC",
        )?;

        let entries = stmt
            .query_map(params![start, end], |row| {
                Ok(ManualEntry {
                    id: row.get(0)?,
                    description: row.get(1)?,
                    category_id: row.get(2)?,
                    started_at: row.get(3)?,
                    ended_at: row.get(4)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(entries)
    }

    /// Update manual entry
    pub fn update_manual_entry(
        &self,
        id: i64,
        description: Option<&str>,
        category_id: Option<i64>,
        started_at: i64,
        ended_at: i64,
    ) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE manual_entries SET entry_type = '', description = ?, category_id = ?, 
             started_at = ?, ended_at = ? WHERE id = ?",
            params![description, category_id, started_at, ended_at, id],
        )?;
        Ok(())
    }
    

    /// Delete manual entry
    pub fn delete_manual_entry(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM manual_entries WHERE id = ?", params![id])?;
        Ok(())
    }
}
