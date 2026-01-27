use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Activity {
    pub id: Option<i64>,
    pub app_name: String,
    pub window_title: Option<String>,
    pub domain: Option<String>,
    pub category_id: Option<i64>,
    pub project_id: Option<i64>,
    pub task_id: Option<i64>,
    pub started_at: i64,
    pub duration_sec: i64,
    pub is_idle: bool,
}

// TODO: Consider billable logic unification - both Category and Project have is_billable and hourly_rate fields.
// This creates ambiguity in determining billable status. See TODO in database.rs for discussion.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub is_productive: Option<bool>,
    pub is_billable: Option<bool>,
    pub hourly_rate: Option<f64>,
    pub sort_order: i64,
    pub is_system: bool,
    pub is_pinned: bool,
    pub project_id: Option<i64>,
    pub task_id: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rule {
    pub id: i64,
    pub rule_type: String,
    pub pattern: String,
    pub category_id: i64,
    pub priority: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManualEntry {
    pub id: Option<i64>,
    pub description: Option<String>,
    pub category_id: Option<i64>,
    pub project: Option<String>, // Legacy field
    pub project_id: Option<i64>,
    pub task_id: Option<i64>,
    pub started_at: i64,
    pub ended_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowInfo {
    pub app_name: String,
    pub window_title: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyStats {
    pub total_seconds: i64,
    pub productive_seconds: i64,
    pub by_category: Vec<CategoryStats>,
    pub by_app: Vec<AppStats>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryStats {
    pub category_id: i64,
    pub category_name: String,
    pub color: String,
    pub icon: String,
    pub total_seconds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppStats {
    pub app_name: String,
    pub total_seconds: i64,
    pub category_id: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineEntry {
    pub hour: i32,
    pub minute: i32,
    pub app_name: String,
    pub category_id: Option<i64>,
    pub duration_sec: i64,
}

// TODO: See Category struct TODO - both Category and Project have is_billable and hourly_rate.
// Need to decide on unified logic for determining billable status and rates.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub color: String,
    pub is_archived: bool,
    pub created_at: i64,
    pub client_name: Option<String>,
    pub is_billable: bool,
    pub hourly_rate: f64,
    pub budget_hours: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: i64,
    pub project_id: i64,
    pub name: String,
    pub description: Option<String>,
    pub created_at: i64,
    #[serde(rename(serialize = "is_archived", deserialize = "is_archived"))]
    pub archived: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FocusSession {
    pub id: i64,
    pub started_at: i64,
    pub ended_at: Option<i64>,
    pub duration_sec: Option<i64>,
    pub pomodoro_type: String,
    pub project_id: Option<i64>,
    pub task_id: Option<i64>,
    pub completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Goal {
    pub id: i64,
    pub goal_type: String,
    pub target_seconds: i64,
    pub category_id: Option<i64>,
    pub project_id: Option<i64>,
    pub start_date: i64,
    pub end_date: Option<i64>,
    pub created_at: i64,
    pub active: bool,
    pub name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoalProgress {
    pub goal: Goal,
    pub current_seconds: i64,
    pub percentage: f64,
    pub remaining_seconds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PomodoroStatus {
    pub is_active: bool,
    pub session_id: Option<i64>,
    pub pomodoro_type: String,
    pub started_at: Option<i64>,
    pub remaining_sec: i64,
    pub total_sec: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomainStat {
    pub domain: String,
    pub duration_sec: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoalAlert {
    pub goal_id: i64,
    pub goal_name: String,
    pub alert_type: String,
    pub percentage: f64,
    pub current_seconds: i64,
    pub target_seconds: i64,
}
