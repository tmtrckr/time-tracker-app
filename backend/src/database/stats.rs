//! Statistics and reporting database operations

use super::common::Database;
use super::models::*;
use rusqlite::{Result, params};

impl Database {
    /// Get daily stats (SQL aggregation — no full activity load)
    pub fn get_daily_stats(&self, date: i64) -> Result<DailyStats> {
        let start = date;
        let end = date + 86400; // 24 hours
        let categories = self.get_categories()?;
        let cat_map: std::collections::HashMap<i64, Category> = categories
            .iter()
            .map(|c| (c.id, c.clone()))
            .collect();

        let conn = self.conn.lock().unwrap();

        // Query 1: total and productive seconds
        let (total_seconds, productive_seconds): (i64, i64) = conn.query_row(
            "SELECT
                COALESCE(SUM(a.duration_sec), 0),
                COALESCE(SUM(CASE WHEN c.is_productive = 1 THEN a.duration_sec ELSE 0 END), 0)
            FROM activities a
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE a.started_at >= ?1 AND a.started_at <= ?2 AND a.is_idle = 0",
            params![start, end],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )?;

        // Query 2: category breakdown
        let mut category_stats: Vec<CategoryStat> = Vec::new();
        let mut stmt = conn.prepare(
            "SELECT a.category_id, SUM(a.duration_sec) AS duration_sec
             FROM activities a
             WHERE a.started_at >= ?1 AND a.started_at <= ?2 AND a.is_idle = 0 AND a.category_id IS NOT NULL
             GROUP BY a.category_id
             ORDER BY duration_sec DESC",
        )?;
        let category_rows = stmt.query_map(params![start, end], |row| {
            Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)?))
        })?;
        for row in category_rows {
            let (category_id, duration_sec) = row?;
            let percentage = if total_seconds > 0 {
                (duration_sec as f64 / total_seconds as f64 * 100.0) as i64
            } else {
                0
            };
            category_stats.push(CategoryStat {
                category: cat_map.get(&category_id).cloned(),
                duration_sec,
                percentage,
            });
        }

        // Query 3: app breakdown
        let mut app_stats: Vec<AppStat> = Vec::new();
        let mut stmt = conn.prepare(
            "SELECT a.app_name, SUM(a.duration_sec) AS duration_sec, MAX(a.category_id) AS category_id
             FROM activities a
             WHERE a.started_at >= ?1 AND a.started_at <= ?2 AND a.is_idle = 0
             GROUP BY a.app_name
             ORDER BY duration_sec DESC",
        )?;
        let app_rows = stmt.query_map(params![start, end], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, i64>(1)?,
                row.get::<_, Option<i64>>(2)?,
            ))
        })?;
        for row in app_rows {
            let (app_name, duration_sec, category_id) = row?;
            let category = category_id.and_then(|id| cat_map.get(&id).cloned());
            app_stats.push(AppStat {
                app_name,
                duration_sec,
                category,
            });
        }

        Ok(DailyStats {
            total_seconds,
            productive_seconds,
            category_stats,
            app_stats,
        })
    }

    /// Get top apps (SQL aggregation)
    pub fn get_top_apps(&self, start: i64, end: i64, limit: i64) -> Result<Vec<AppStat>> {
        let categories = self.get_categories()?;
        let cat_map: std::collections::HashMap<i64, Category> = categories
            .iter()
            .map(|c| (c.id, c.clone()))
            .collect();
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT a.app_name, SUM(a.duration_sec) AS duration_sec, MAX(a.category_id) AS category_id
             FROM activities a
             WHERE a.started_at >= ?1 AND a.started_at <= ?2 AND a.is_idle = 0
             GROUP BY a.app_name
             ORDER BY duration_sec DESC
             LIMIT ?3",
        )?;
        let rows = stmt.query_map(params![start, end, limit], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, i64>(1)?,
                row.get::<_, Option<i64>>(2)?,
            ))
        })?;
        let mut app_stats: Vec<AppStat> = Vec::new();
        for row in rows {
            let (app_name, duration_sec, category_id) = row?;
            let category = category_id.and_then(|id| cat_map.get(&id).cloned());
            app_stats.push(AppStat {
                app_name,
                duration_sec,
                category,
            });
        }
        Ok(app_stats)
    }

    /// Get category usage (SQL aggregation)
    pub fn get_category_usage(&self, start: i64, end: i64) -> Result<Vec<CategoryUsageStat>> {
        let categories = self.get_categories()?;
        let cat_map: std::collections::HashMap<i64, Category> = categories
            .iter()
            .map(|c| (c.id, c.clone()))
            .collect();
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT a.category_id, SUM(a.duration_sec) AS duration_sec
             FROM activities a
             WHERE a.started_at >= ?1 AND a.started_at <= ?2 AND a.is_idle = 0 AND a.category_id IS NOT NULL
             GROUP BY a.category_id
             ORDER BY duration_sec DESC",
        )?;
        let rows = stmt.query_map(params![start, end], |row| {
            Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)?))
        })?;
        let mut category_stats: Vec<CategoryUsageStat> = Vec::new();
        let mut total: i64 = 0;
        for row in rows {
            let (category_id, duration_sec) = row?;
            total += duration_sec;
            category_stats.push(CategoryUsageStat {
                category: cat_map.get(&category_id).cloned(),
                duration_sec,
                percentage: 0, // set below
            });
        }
        if total > 0 {
            for stat in &mut category_stats {
                stat.percentage = (stat.duration_sec as f64 / total as f64 * 100.0) as i64;
            }
        }
        Ok(category_stats)
    }

    /// Get hourly activity (SQL aggregation)
    pub fn get_hourly_activity(&self, date: i64) -> Result<Vec<HourlyStat>> {
        let start = date;
        let end = date + 86400;
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT CAST((started_at - ?1) / 3600 AS INTEGER) AS hour, SUM(duration_sec) AS duration_sec
             FROM activities
             WHERE started_at >= ?1 AND started_at <= ?2 AND is_idle = 0
             GROUP BY CAST((started_at - ?1) / 3600 AS INTEGER)
             ORDER BY hour ASC",
        )?;
        let rows = stmt.query_map(params![start, end], |row| {
            Ok(HourlyStat {
                hour: row.get(0)?,
                duration_sec: row.get(1)?,
            })
        })?;
        let stats: Vec<HourlyStat> = rows.collect::<Result<Vec<_>>>()?;
        Ok(stats)
    }

    /// Get productive time (SQL aggregation)
    pub fn get_productive_time(&self, start: i64, end: i64) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        let productive_seconds: i64 = conn.query_row(
            "SELECT COALESCE(SUM(a.duration_sec), 0) AS productive_seconds
             FROM activities a
             INNER JOIN categories c ON a.category_id = c.id
             WHERE a.started_at >= ?1 AND a.started_at <= ?2 AND a.is_idle = 0 AND c.is_productive = 1",
            params![start, end],
            |row| row.get(0),
        )?;
        Ok(productive_seconds)
    }


    /// Get top domains for a time range (SQL aggregation)
    pub fn get_top_domains(&self, start: i64, end: i64, limit: i64) -> Result<Vec<DomainStat>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT domain, SUM(duration_sec) AS duration_sec
             FROM activities
             WHERE started_at >= ?1 AND started_at <= ?2 AND is_idle = 0 AND domain IS NOT NULL
             GROUP BY domain
             ORDER BY duration_sec DESC
             LIMIT ?3",
        )?;
        let rows = stmt.query_map(params![start, end, limit], |row| {
            Ok(DomainStat {
                domain: row.get(0)?,
                duration_sec: row.get(1)?,
            })
        })?;
        let domain_stats: Vec<DomainStat> = rows.collect::<Result<Vec<_>>>()?;
        Ok(domain_stats)
    }

    /// Get aggregated stats for an arbitrary time range (SQL aggregation, for get_stats command).
    pub fn get_stats_for_range(&self, start: i64, end: i64) -> Result<RangeStats> {
        let conn = self.conn.lock().unwrap();

        let (total_seconds, productive_seconds): (i64, i64) = conn.query_row(
            "SELECT
                COALESCE(SUM(a.duration_sec), 0),
                COALESCE(SUM(CASE WHEN c.is_productive = 1 THEN a.duration_sec ELSE 0 END), 0)
            FROM activities a
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE a.started_at >= ?1 AND a.started_at <= ?2 AND a.is_idle = 0",
            params![start, end],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )?;

        let mut stmt = conn.prepare(
            "SELECT a.category_id, COALESCE(c.name, 'Unknown'), COALESCE(c.color, '#888'), SUM(a.duration_sec) AS duration_sec
             FROM activities a
             LEFT JOIN categories c ON a.category_id = c.id
             WHERE a.started_at >= ?1 AND a.started_at <= ?2 AND a.is_idle = 0 AND a.category_id IS NOT NULL
             GROUP BY a.category_id
             ORDER BY duration_sec DESC",
        )?;
        let category_breakdown: Vec<(i64, String, String, i64)> = stmt
            .query_map(params![start, end], |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                ))
            })?
            .collect::<Result<Vec<_>>>()?;

        let mut stmt = conn.prepare(
            "SELECT a.app_name, SUM(a.duration_sec) AS duration_sec
             FROM activities a
             WHERE a.started_at >= ?1 AND a.started_at <= ?2 AND a.is_idle = 0
             GROUP BY a.app_name
             ORDER BY duration_sec DESC",
        )?;
        let app_breakdown: Vec<(String, i64)> = stmt
            .query_map(params![start, end], |row| Ok((row.get(0)?, row.get(1)?)))?
            .collect::<Result<Vec<_>>>()?;

        Ok(RangeStats {
            total_seconds,
            productive_seconds,
            category_breakdown,
            app_breakdown,
        })
    }
}
