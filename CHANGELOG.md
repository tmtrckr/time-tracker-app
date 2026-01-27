# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-01-27

### Added
- **Pomodoro Timer**: Full Pomodoro timer implementation with work/break sessions
  - Timer UI with visual countdown
  - Focus session tracking integrated with projects and tasks
  - Session history and statistics
  - Dashboard Pomodoro widget
- **Projects Management**: Complete project management system
  - Create, edit, and archive projects
  - Project colors and client names
  - Billable hours and hourly rates per project
  - Project breakdown in dashboard and reports
- **Tasks Management**: Task tracking within projects
  - Create and manage tasks linked to projects
  - Task assignment for manual entries and Pomodoro sessions
  - Task filtering in reports
- **Goals System**: Goal setting and progress tracking
  - Daily, weekly, and monthly goals
  - Goal progress visualization
  - Goal alerts (80% warning, 100% completion)
  - Dashboard goal progress widget
- **Reports**: Comprehensive reporting system
  - Detailed reports with date range filtering
  - Filter by category, project, task, and domain
  - Billable vs non-billable breakdown
  - Charts and visualizations
  - Export functionality (CSV, JSON)

### Changed
- Fixed TypeScript errors in components
- Improved code organization and maintainability

## [0.1.0] - 2025-01-23

### Added
- Initial release of TimeTracker desktop application
- Automatic time tracking with activity monitoring
- Category management with custom colors and icons
- Manual time entry
- Activity timeline visualization
- Dashboard with basic statistics
- System tray integration
- Auto-start functionality
- Idle time detection and handling
- Dark mode support
- Domain and app usage statistics

### Technical Details
- Frontend: React 18 + TypeScript + Vite
- Backend: Rust + Tauri 1.5
- Database: SQLite with migrations
- UI: Tailwind CSS with dark mode
- State Management: Zustand
- Data Fetching: TanStack Query (React Query)

### Infrastructure
- GitHub Actions workflows for CI/CD
- Automated version bumping
- Release automation with changelog generation

[0.2.0]: https://github.com/your-username/time-tracker-app/releases/tag/v0.2.0
[0.1.0]: https://github.com/your-username/time-tracker-app/releases/tag/v0.1.0
