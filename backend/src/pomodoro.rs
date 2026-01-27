//! Pomodoro timer module - Backend support for Pomodoro timer functionality
//! 
//! Note: Most timer logic is handled in the frontend. This module provides
//! backend support for storing focus sessions and integrating with activity tracking.


/// Pomodoro timer configuration
#[allow(dead_code)]
pub struct PomodoroConfig {
    pub work_duration_sec: i64,
    pub short_break_duration_sec: i64,
    pub long_break_duration_sec: i64,
    pub sessions_until_long_break: i32,
}

impl Default for PomodoroConfig {
    fn default() -> Self {
        Self {
            work_duration_sec: 25 * 60,      // 25 minutes
            short_break_duration_sec: 5 * 60, // 5 minutes
            long_break_duration_sec: 15 * 60, // 15 minutes
            sessions_until_long_break: 4,
        }
    }
}

/// Pomodoro timer state (managed in frontend, stored in database)
#[allow(dead_code)]
pub struct PomodoroState {
    pub session_id: Option<i64>,
    pub pomodoro_type: String, // "work" or "break"
    pub started_at: Option<i64>,
    pub config: PomodoroConfig,
}

impl PomodoroState {
    #[allow(dead_code)]
    pub fn new() -> Self {
        Self {
            session_id: None,
            pomodoro_type: "work".to_string(),
            started_at: None,
            config: PomodoroConfig::default(),
        }
    }
}

impl Default for PomodoroState {
    fn default() -> Self {
        Self::new()
    }
}
