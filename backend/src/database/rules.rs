//! Rule management database operations

use rusqlite::{Result, params};
use super::common::Database;
use super::models::Rule;

impl Database {
    /// Get all rules
    pub fn get_rules(&self) -> Result<Vec<Rule>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, rule_type, pattern, category_id, priority
             FROM rules
             ORDER BY priority DESC",
        )?;

        let rules = stmt
            .query_map([], |row| {
                Ok(Rule {
                    id: row.get(0)?,
                    rule_type: row.get(1)?,
                    pattern: row.get(2)?,
                    category_id: row.get(3)?,
                    priority: row.get(4)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(rules)
    }

    /// Add a new rule
    pub fn add_rule(
        &self,
        rule_type: &str,
        pattern: &str,
        category_id: i64,
        priority: i64,
    ) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO rules (rule_type, pattern, category_id, priority)
             VALUES (?, ?, ?, ?)",
            params![rule_type, pattern, category_id, priority],
        )
        .map_err(|e| {
            if let rusqlite::Error::SqliteFailure(ref err, Some(ref msg)) = e {
                if err.code == rusqlite::ffi::ErrorCode::ConstraintViolation
                    && (msg.contains("rules.rule_type") 
                        || msg.contains("idx_rules_unique")
                        || (msg.contains("UNIQUE constraint") && msg.contains("rules")))
                {
                    return rusqlite::Error::SqliteFailure(
                        rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CONSTRAINT),
                        Some("A rule with this pattern and category already exists".to_string()),
                    );
                }
            }
            e
        })?;
        Ok(conn.last_insert_rowid())
    }

    /// Delete a rule
    pub fn delete_rule(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM rules WHERE id = ?", params![id])?;
        Ok(())
    }

    /// Update rule
    pub fn update_rule(
        &self,
        id: i64,
        rule_type: &str,
        pattern: &str,
        category_id: i64,
        priority: i64,
    ) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE rules SET rule_type = ?, pattern = ?, category_id = ?, priority = ?
             WHERE id = ?",
            params![rule_type, pattern, category_id, priority, id],
        )
        .map_err(|e| {
            if let rusqlite::Error::SqliteFailure(ref err, Some(ref msg)) = e {
                if err.code == rusqlite::ffi::ErrorCode::ConstraintViolation
                    && (msg.contains("rules.rule_type") 
                        || msg.contains("idx_rules_unique")
                        || (msg.contains("UNIQUE constraint") && msg.contains("rules")))
                {
                    return rusqlite::Error::SqliteFailure(
                        rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CONSTRAINT),
                        Some("A rule with this pattern and category already exists".to_string()),
                    );
                }
            }
            e
        })?;
        Ok(())
    }
}
