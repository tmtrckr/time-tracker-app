//! Idle detection module - Monitors user activity to detect idle state using native APIs

/// Idle monitor for detecting user inactivity
pub struct IdleMonitor;

impl IdleMonitor {
    /// Create a new idle monitor
    pub fn new() -> Self {
        Self
    }

    /// Get the current idle time in seconds using native APIs
    #[cfg(target_os = "windows")]
    pub fn get_idle_time(&self) -> u64 {
        use winapi::um::winuser::{GetLastInputInfo, LASTINPUTINFO};
        use std::mem::size_of;
        #[cfg(windows)]
        extern "system" {
            fn GetTickCount() -> u32;
        }

        unsafe {
            let mut last_input_info: LASTINPUTINFO = std::mem::zeroed();
            last_input_info.cbSize = size_of::<LASTINPUTINFO>() as u32;

            if GetLastInputInfo(&mut last_input_info) != 0 {
                let current_tick = GetTickCount();
                let idle_ms = current_tick.wrapping_sub(last_input_info.dwTime);
                idle_ms as u64 / 1000 // Convert to seconds
            } else {
                0
            }
        }
    }

    /// Get the current idle time in seconds (macOS)
    #[cfg(target_os = "macos")]
    pub fn get_idle_time(&self) -> u64 {
        // Use ioreg for macOS (works without special permissions)
        self.get_idle_time_fallback()
    }

    #[cfg(target_os = "macos")]
    fn get_idle_time_fallback(&self) -> u64 {
        use std::process::Command;
        let output = Command::new("ioreg")
            .args(["-c", "IOHIDSystem"])
            .output();

        match output {
            Ok(output) => {
                let output_str = String::from_utf8_lossy(&output.stdout);
                
                // Parse the HIDIdleTime from ioreg output
                for line in output_str.lines() {
                    if line.contains("HIDIdleTime") {
                        // Extract the number
                        if let Some(start) = line.find('=') {
                            let value_str = line[start + 1..].trim();
                            if let Ok(ns) = value_str.parse::<u64>() {
                                return ns / 1_000_000_000; // Convert nanoseconds to seconds
                            }
                        }
                    }
                }
                0
            }
            Err(_) => 0,
        }
    }

    /// Get the current idle time in seconds (Linux)
    #[cfg(target_os = "linux")]
    pub fn get_idle_time(&self) -> u64 {
        // Try xprintidle first (if available)
        use std::process::Command;
        let output = Command::new("xprintidle").output();

        match output {
            Ok(output) => {
                let output_str = String::from_utf8_lossy(&output.stdout);
                output_str
                    .trim()
                    .parse::<u64>()
                    .map(|ms| ms / 1000)
                    .unwrap_or(0)
            }
            Err(_) => {
                // Fallback: try xssstate
                let output = Command::new("xssstate").args(["-i"]).output();
                match output {
                    Ok(output) => {
                        let output_str = String::from_utf8_lossy(&output.stdout);
                        output_str
                            .trim()
                            .parse::<u64>()
                            .map(|ms| ms / 1000)
                            .unwrap_or(0)
                    }
                    Err(_) => 0,
                }
            }
        }
    }

    /// Fallback for unsupported platforms
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    pub fn get_idle_time(&self) -> u64 {
        0
    }

    /// Check if user is currently idle (using default threshold of 120 seconds)
    #[allow(dead_code)]
    pub fn is_idle(&self) -> bool {
        self.get_idle_time() > 120
    }

    /// Check if user is idle for a specific duration
    #[allow(dead_code)]
    pub fn is_idle_for(&self, seconds: u64) -> bool {
        self.get_idle_time() > seconds
    }
}

impl Default for IdleMonitor {
    fn default() -> Self {
        Self::new()
    }
}
