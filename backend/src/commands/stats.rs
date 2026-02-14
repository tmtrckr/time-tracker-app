//! Statistics commands

use crate::commands::common::AppState;
use crate::database::RangeStats;
use tauri::State;
use serde::Serialize;

/// Stats response structure
#[derive(Serialize)]
pub struct StatsResponse {
    pub total_seconds: i64,
    pub productive_seconds: i64,
    pub category_breakdown: Vec<CategoryTime>,
    pub app_breakdown: Vec<AppTime>,
}

#[derive(Serialize)]
pub struct CategoryTime {
    pub category_id: i64,
    pub category_name: String,
    pub color: String,
    pub seconds: i64,
}

#[derive(Serialize)]
pub struct AppTime {
    pub app_name: String,
    pub seconds: i64,
}

/// Get aggregated stats for a time range (SQL aggregation)
#[tauri::command]
pub fn get_stats(
    state: State<'_, AppState>,
    start: i64,
    end: i64,
) -> Result<StatsResponse, String> {
    let RangeStats {
        total_seconds,
        productive_seconds,
        category_breakdown: category_rows,
        app_breakdown: app_rows,
    } = state.db.get_stats_for_range(start, end).map_err(|e| e.to_string())?;

    let category_breakdown: Vec<CategoryTime> = category_rows
        .into_iter()
        .map(|(category_id, category_name, color, seconds)| CategoryTime {
            category_id,
            category_name,
            color,
            seconds,
        })
        .collect();

    let app_breakdown: Vec<AppTime> = app_rows
        .into_iter()
        .map(|(app_name, seconds)| AppTime { app_name, seconds })
        .collect();

    Ok(StatsResponse {
        total_seconds,
        productive_seconds,
        category_breakdown,
        app_breakdown,
    })
}

/// Get daily stats
#[tauri::command]
pub fn get_daily_stats(
    state: State<'_, AppState>,
    date: i64,
) -> Result<serde_json::Value, String> {
    let stats = state.db.get_daily_stats(date).map_err(|e| e.to_string())?;
    
    Ok(serde_json::json!({
        "total_duration_sec": stats.total_seconds,
        "productive_duration_sec": stats.productive_seconds,
        "categories": stats.category_stats.iter().map(|cs| serde_json::json!({
            "category": cs.category.as_ref().map(|c| serde_json::json!({
                "id": c.id,
                "name": c.name,
                "color": c.color,
                "icon": c.icon,
                "is_productive": c.is_productive,
                "sort_order": c.sort_order,
            })),
            "duration_sec": cs.duration_sec,
            "percentage": cs.percentage,
        })).collect::<Vec<_>>(),
        "top_apps": stats.app_stats.iter().map(|as_| serde_json::json!({
            "app_name": as_.app_name,
            "duration_sec": as_.duration_sec,
            "category": as_.category.as_ref().map(|c| serde_json::json!({
                "id": c.id,
                "name": c.name,
                "color": c.color,
                "icon": c.icon,
                "is_productive": c.is_productive,
                "sort_order": c.sort_order,
            })),
        })).collect::<Vec<_>>(),
    }))
}

/// Get top apps
#[tauri::command]
pub fn get_top_apps(
    state: State<'_, AppState>,
    start: i64,
    end: i64,
    limit: i64,
) -> Result<Vec<serde_json::Value>, String> {
    let apps = state.db.get_top_apps(start, end, limit).map_err(|e| e.to_string())?;
    
    Ok(apps.iter().map(|app| serde_json::json!({
        "app_name": app.app_name,
        "duration_sec": app.duration_sec,
        "category": app.category.as_ref().map(|c| serde_json::json!({
            "id": c.id,
            "name": c.name,
            "color": c.color,
            "icon": c.icon,
            "is_productive": c.is_productive,
            "sort_order": c.sort_order,
        })),
    })).collect())
}

/// Get category usage
#[tauri::command]
pub fn get_category_usage(
    state: State<'_, AppState>,
    start: i64,
    end: i64,
) -> Result<Vec<serde_json::Value>, String> {
    let usage = state.db.get_category_usage(start, end).map_err(|e| e.to_string())?;
    
    Ok(usage.iter().map(|u| serde_json::json!({
        "category": u.category.as_ref().map(|c| serde_json::json!({
            "id": c.id,
            "name": c.name,
            "color": c.color,
            "icon": c.icon,
            "is_productive": c.is_productive,
            "sort_order": c.sort_order,
        })),
        "duration_sec": u.duration_sec,
        "percentage": u.percentage,
    })).collect())
}

/// Get hourly activity
#[tauri::command]
pub fn get_hourly_activity(
    state: State<'_, AppState>,
    date: i64,
) -> Result<Vec<serde_json::Value>, String> {
    let hourly = state.db.get_hourly_activity(date).map_err(|e| e.to_string())?;
    
    Ok(hourly.iter().map(|h| serde_json::json!({
        "hour": h.hour,
        "duration_sec": h.duration_sec,
    })).collect())
}

/// Get productive time
#[tauri::command]
pub fn get_productive_time(
    state: State<'_, AppState>,
    start: i64,
    end: i64,
) -> Result<i64, String> {
    state.db.get_productive_time(start, end).map_err(|e| e.to_string())
}
