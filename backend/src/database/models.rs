//! Data models and types for database operations

/// Activity record from the database
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Activity {
    pub id: i64,
    pub app_name: String,
    pub window_title: Option<String>,
    pub domain: Option<String>,
    pub category_id: Option<i64>,
    pub started_at: i64,
    pub duration_sec: i64,
    pub is_idle: bool,
}

/// Category record
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub color: String,
    pub icon: Option<String>,
    pub is_productive: Option<bool>,
    pub sort_order: i64,
    pub is_system: bool,
    pub is_pinned: bool,
}

/// Rule for auto-categorization
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Rule {
    pub id: i64,
    pub rule_type: String,
    pub pattern: String,
    pub category_id: i64,
    pub priority: i64,
}

/// Manual entry record
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ManualEntry {
    pub id: i64,
    pub description: Option<String>,
    pub category_id: Option<i64>,
    pub started_at: i64,
    pub ended_at: i64,
}

/// Domain statistics
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DomainStat {
    pub domain: String,
    pub duration_sec: i64,
}

/// Daily statistics
#[derive(Debug, Clone)]
pub struct DailyStats {
    pub total_seconds: i64,
    pub productive_seconds: i64,
    pub category_stats: Vec<CategoryStat>,
    pub app_stats: Vec<AppStat>,
}

/// Category statistics
#[derive(Debug, Clone)]
pub struct CategoryStat {
    pub category: Option<Category>,
    pub duration_sec: i64,
    pub percentage: i64,
}

/// Application statistics
#[derive(Debug, Clone)]
pub struct AppStat {
    pub app_name: String,
    pub duration_sec: i64,
    pub category: Option<Category>,
}

/// Category usage statistics
#[derive(Debug, Clone)]
pub struct CategoryUsageStat {
    pub category: Option<Category>,
    pub duration_sec: i64,
    pub percentage: i64,
}

/// Hourly statistics
#[derive(Debug, Clone)]
pub struct HourlyStat {
    pub hour: i64,
    pub duration_sec: i64,
}

/// Aggregated stats for an arbitrary time range
#[derive(Debug, Clone)]
pub struct RangeStats {
    pub total_seconds: i64,
    pub productive_seconds: i64,
    /// (category_id, category_name, color, seconds)
    pub category_breakdown: Vec<(i64, String, String, i64)>,
    /// (app_name, seconds)
    pub app_breakdown: Vec<(String, i64)>,
}
