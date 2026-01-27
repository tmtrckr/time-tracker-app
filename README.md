# ⏱️ Time Tracker Application

**Version**: [0.2.0](CHANGELOG.md#020---2025-01-27)

A desktop application for automatic time tracking that shows where your work time goes, with smart handling of "idle" time.

## Features

### Core Features
- **Automatic Tracking**: Tracks active window (application + title) using native APIs
- **Smart Idle Detection**: Detects inactivity and prompts for activity classification
- **Manual Entry**: Quick entry from system tray for meetings, thinking time, calls, breaks, personal time. Supports project and task assignment.
- **Categorization**: Auto-categorize activities with customizable rules (supports wildcard patterns)
- **Reports & Analytics**: Daily/weekly/monthly reports with charts, hourly activity breakdown
- **CSV/JSON Export**: Export time data for external analysis (CSV includes UTF-8 BOM for Excel compatibility)
- **Thinking Mode**: Track focused thinking/planning time separately
- **System Tray Integration**: Minimize to tray, pause/resume tracking, quick navigation to views
- **Autostart**: Start automatically with system (Windows/macOS/Linux)
- **Keyboard Shortcuts**: Quick navigation and actions via keyboard (see Keyboard Shortcuts section)

### Professional Features ✅

**Backend Complete** - All APIs, database schema, and hooks are implemented.

- **Project/Task Management**: 
  - ✅ Full CRUD operations, database schema, API endpoints, hooks (`useProjects()`, `useTasks()`)
  - ✅ **Integrated into ManualEntryForm**: Users can select projects and tasks when creating manual entries
  - ✅ **Dedicated UI Components**: Full Projects and Tasks management UI components with CRUD operations
- **Billable Time Tracking**: `is_billable` flag, `hourly_rate`, billable hours and revenue calculations
  - ✅ Backend APIs complete
  - ✅ Dashboard widget showing billable hours and revenue
  - ✅ Reports breakdown with billable vs non-billable charts
  - ✅ Timeline visual distinction for billable entries
- **Website/Domain Tracking**: Automatic domain extraction, domain-based categorization rules
  - ✅ Backend APIs complete
  - ✅ Top Websites widget in Dashboard
  - ✅ Domain filtering in Reports
  - ✅ Top Websites chart in Reports
  - ✅ Domain display in Timeline tooltips
- **Pomodoro Timer**: Focus session tracking with timer support, integration with projects/tasks
  - ✅ Backend APIs complete
  - ✅ Full Pomodoro UI component with timer and history
  - ✅ Dashboard Pomodoro widget
- **Goal Setting & Alerts**: Daily/weekly/monthly goals with progress calculations, alerts (80% warning, 100% completion)
  - ✅ Backend APIs complete
  - ✅ Full Goals management UI component
  - ✅ Dashboard Goal Progress widget
  - ✅ Goal alerts component

**Status**: All backend APIs and frontend UI components are complete. Dashboard includes billable time, project breakdown, top websites, and goal progress widgets. Reports support filtering by project/task/domain and show billable breakdown. Timeline displays domain information and visual indicators for billable entries.

### Keyboard Shortcuts

The application supports keyboard shortcuts for quick navigation and actions:

**Navigation**:
- `Ctrl/Cmd + 1` - Dashboard
- `Ctrl/Cmd + 2` - History
- `Ctrl/Cmd + 3` - Reports
- `Ctrl/Cmd + 4` - Pomodoro
- `Ctrl/Cmd + 5` - Projects
- `Ctrl/Cmd + 6` - Tasks
- `Ctrl/Cmd + 7` - Settings

**Actions**:
- `Ctrl/Cmd + N` - Open manual entry form

**System Tray Menu**:
- Right-click system tray icon for quick access to Dashboard, Reports, Settings, Manual Entry, Thinking Mode, and Pause/Resume

### Key Benefits
| Problem | Solution |
|---------|----------|
| Don't know where time goes | Auto-tracking of active applications |
| "No mouse = slacking" | Smart idle + manual classification |
| Offline meetings not tracked | Quick entry from tray + calendar |
| Thinking ≠ work | "Thinking mode" with one button |

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Tauri (Rust)
- **Database**: SQLite
- **State Management**: Zustand
- **Charts**: Recharts
- **Performance**: Native APIs for window/idle detection (10-100x faster than external commands)

## Getting Started

### Prerequisites

**For Running the Application**:
- Windows 10/11, macOS 10.15+, or Linux (Ubuntu 18.04+ / Debian 10+)
- ~100MB free disk space for the application
- ~50MB RAM minimum (typically uses < 50MB)

**For Building from Source**:
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) - Required for building the Tauri backend
- **MSVC Build Tools** (Windows only) - Required for compiling Rust code on Windows
- [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

**Notes**:
- Rust installation requires approximately **500MB-1GB** of free disk space
- MSVC Build Tools are required for Windows builds (see installation instructions below)
- The application runs in the background and uses minimal system resources

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd time-tracker-app

# Install frontend dependencies
npm install

# Run in development mode
npm run tauri:dev

# Build for production
npm run tauri:build
```

### Troubleshooting Rust Installation

If Rust installation fails due to disk space:

**Option 1: Free Up Disk Space** (Recommended)
```powershell
# Run Windows Disk Cleanup
cleanmgr.exe

# Or manually:
# - Empty Recycle Bin
# - Clear browser cache
# - Remove unused programs
# - Clear temp files
```

**Option 2: Install Rust to Different Drive**
```powershell
$env:RUSTUP_HOME = "D:\.rustup"
$env:CARGO_HOME = "D:\.cargo"
Invoke-WebRequest -Uri https://win.rustup.rs/x86_64 -OutFile rustup-init.exe
.\rustup-init.exe
$env:PATH = "$env:CARGO_HOME\bin;$env:PATH"
```

**Option 3: Run Frontend Only** (For UI Testing)
```bash
npm run dev
# Opens at http://localhost:5173
# Note: Backend features won't work without Rust
```

## Development

### Frontend Development

```bash
# Start Vite dev server only (for UI development)
npm run dev
```

### Backend Development

```bash
# Navigate to backend directory
cd backend

# Build Rust backend
cargo build

# Run tests
cargo test
```

## Build Instructions

### Windows: Install MSVC Build Tools (Required)

**MSVC Build Tools are required for compiling Rust code on Windows.**

#### Method 1: Automated Installation (Recommended)

**Run this in PowerShell as Administrator:**

```powershell
# Download and run the installer
Invoke-WebRequest -Uri "https://aka.ms/vs/17/release/vs_buildtools.exe" -OutFile "$env:TEMP\vs_buildtools.exe"
Start-Process "$env:TEMP\vs_buildtools.exe" -ArgumentList "--quiet", "--wait", "--add", "Microsoft.VisualStudio.Workload.VCTools", "--includeRecommended" -Wait
```

**Or use Chocolatey (if installed):**
```powershell
choco install visualstudio2022buildtools --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended" -y
```

#### Method 2: Manual Installation - Build Tools Only (Recommended - Smaller Download)

1. **Download**: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
2. **Run installer** and select:
   - ✅ **C++ build tools** workload
   - ✅ **Windows 10/11 SDK** (latest)
   - ✅ **MSVC v143 - VS 2022 C++ x64/x86 build tools**
3. **Click Install** and wait for completion

#### Method 3: Install Full Visual Studio (Alternative - Larger Download)

If you prefer the full Visual Studio IDE:

1. **Download Visual Studio Community** (free): https://visualstudio.microsoft.com/downloads/
2. **During installation**, select:
   - ✅ **Desktop development with C++** workload
   - ✅ **Windows 10/11 SDK**
3. After installation, use **Developer Command Prompt for VS** (same as Method 2)

#### Verify MSVC Installation

After installation, verify:

```powershell
# Check linker (should show MSVC path, NOT Git)
where.exe link.exe

# Should output something like:
# C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.xx.xxxxx\bin\Hostx64\x64\link.exe
```

### Production Build

#### Option A: Use Developer Command Prompt (Easiest - Windows)

1. Open **Start Menu**
2. Search for **"x64 Native Tools Command Prompt for VS 2022"**
3. Run it
4. Execute:
   ```cmd
   cd d:\Repo\time-tracker-app
   npm run tauri:build
   ```

#### Option B: Use PowerShell with Correct PATH (Windows)

```powershell
# Find MSVC linker (automatically detects version)
$msvcPath = "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC"
# Or if using full Visual Studio:
# $msvcPath = "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC"

$version = Get-ChildItem $msvcPath -Directory | Sort-Object Name -Descending | Select-Object -First 1
$linkerPath = Join-Path $version.FullName "bin\Hostx64\x64"

# Remove Git's link.exe from PATH
$env:PATH = ($env:PATH -split ';' | Where-Object { $_ -notlike '*Git\usr\bin*' }) -join ';'

# Add MSVC linker to PATH
$env:PATH = "$linkerPath;$env:PATH"

# Verify correct linker
where.exe link.exe
# Should show MSVC linker path, NOT Git's link.exe

# Build
cd d:\Repo\time-tracker-app
npm run tauri:build
```

#### Option C: Standard Build (macOS/Linux or Windows with MSVC in PATH)

```bash
# Build the application
npm run tauri:build
```

#### Option D: Quick PATH Fix (If MSVC Already Installed)

If MSVC is installed but PATH is incorrect:

```powershell
# Remove Git's link.exe from PATH
$env:PATH = ($env:PATH -split ';' | Where-Object { $_ -notlike '*Git\usr\bin*' }) -join ';'

# Add MSVC linker to PATH (adjust path to your installation)
# For Build Tools:
$msvcPath = "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.40.33807\bin\Hostx64\x64"
# For Community Edition:
# $msvcPath = "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.40.33807\bin\Hostx64\x64"

$env:PATH = "$msvcPath;$env:PATH"

# Verify
where.exe link.exe

# Build
cd d:\Repo\time-tracker-app
npm run tauri:build
```

### Build Output & Requirements

**Output Location**:
- **Executable**: `backend/target/release/time-tracker-app.exe` (Windows)
- **Installer**: `backend/target/release/bundle/msi/time-tracker-app_0.2.0_x64_en-US.msi`

**Requirements**:
- **Disk Space**: ~2-3GB for full build (includes dependencies)
- **Build Time**: 
  - First build: **10-20 minutes** (compiles ~200+ Rust dependencies)
  - Subsequent builds: **2-5 minutes** (incremental compilation)

### Build Troubleshooting

**Why MSVC Build Tools Are Required**:
- Rust on Windows uses the **MSVC toolchain** (`x86_64-pc-windows-msvc`)
- This requires the **MSVC linker** (`link.exe`) from Visual Studio Build Tools
- Git for Windows includes a Unix-style `link.exe` that conflicts with MSVC's linker
- **Common Error**: `link: extra operand` - This happens when Git's Unix-style `link.exe` is used instead of MSVC's linker

#### If build fails with linker errors (Windows):

1. **Verify MSVC is installed**:
   ```powershell
   # Check for Build Tools
   Test-Path "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC"
   
   # Or check for Community Edition
   Test-Path "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC"
   ```

2. **Check PATH order**:
   ```powershell
   $env:PATH -split ';' | Select-String "link"
   ```
   MSVC linker should come BEFORE Git's link.exe

3. **Verify correct linker**:
   ```powershell
   where.exe link.exe
   # Should show MSVC path, NOT Git's
   ```

4. **Use Developer Command Prompt** - it sets up PATH correctly automatically

5. **Verify Rust installation**:
   ```powershell
   cargo --version
   rustc --version
   ```

## Project Structure

```
time-tracker-app/
├── backend/                   # Rust backend (Tauri)
│   ├── src/
│   │   ├── main.rs           # Entry point
│   │   ├── tracker.rs         # Core tracking logic (includes domain extraction)
│   │   ├── database.rs        # SQLite operations (projects, tasks, goals, etc.)
│   │   ├── models.rs          # Data models and types
│   │   ├── window.rs         # Active window detection (native APIs)
│   │   ├── idle.rs           # Idle detection (native APIs)
│   │   ├── tray.rs           # System tray
│   │   ├── autostart.rs      # Autostart management
│   │   ├── pomodoro.rs       # Pomodoro timer backend support
│   │   └── commands.rs        # IPC commands for frontend (28+ commands)
│   ├── .cargo/               # Cargo configuration
│   ├── build.rs              # Build script
│   ├── Cargo.toml            # Rust dependencies
│   └── tauri.conf.json       # Tauri configuration
│
├── frontend/                  # React frontend
│   ├── components/
│   │   ├── Dashboard/        # Main dashboard view
│   │   ├── Timeline/         # Activity timeline
│   │   ├── Charts/           # Category & app charts
│   │   ├── IdlePrompt/       # Idle return prompt
│   │   ├── Settings/         # Settings panel
│   │   ├── History/          # Activity history
│   │   ├── Reports/          # Reports view
│   │   ├── Categories/       # Category management
│   │   ├── Rules/            # Rule management
│   │   ├── ManualEntry/      # Manual entry forms
│   │   ├── Projects/         # Project management
│   │   ├── Tasks/            # Task management
│   │   ├── Pomodoro/         # Pomodoro timer UI
│   │   ├── Goals/            # Goal management
│   │   └── Common/           # Shared components
│   ├── hooks/                # Custom React hooks
│   │   ├── useProjects.ts    # Project management hook
│   │   ├── useTasks.ts       # Task management hook
│   │   ├── useGoals.ts       # Goal tracking hook
│   │   ├── usePomodoro.ts    # Pomodoro timer hook
│   │   ├── useTracker.ts     # Tracker state hook
│   │   └── ...               # Other hooks
│   ├── services/             # Tauri IPC calls
│   ├── store/                # Zustand store
│   ├── types/                # TypeScript types (Project, Task, Goal, etc.)
│   └── utils/                # Utility functions
│
├── public/                    # Static assets
│   ├── icons/                # Application icons
│   └── favicon.svg
│
├── .github/                   # GitHub workflows
│   └── workflows/
│       ├── build.yml         # CI/CD build workflow
│       └── release.yml       # Release workflow
│
├── package.json               # Node.js dependencies and scripts
├── vite.config.ts            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                  # This file
```

## Database Schema

The application uses SQLite for data storage. The database file is automatically created in the application data directory:

**Database Location**:
- **Windows**: `%APPDATA%\timetracker\data.db` (typically `C:\Users\<username>\AppData\Roaming\timetracker\data.db`)
- **macOS**: `~/Library/Application Support/timetracker/data.db`
- **Linux**: `~/.local/share/timetracker/data.db`

**Note**: The database is created automatically on first launch. You can backup your data by copying the `data.db` file from the data directory.

### Tables

The application uses SQLite with the following main tables:

- **activities**: Raw activity records (app name, window title, domain, timestamps, category_id, project_id, task_id)
- **categories**: Activity categories (Work, Communication, Meetings, etc.) with `is_billable` and `hourly_rate`
- **rules**: Auto-categorization rules (pattern matching for apps/titles/domains)
- **manual_entries**: Manual time entries (meetings, thinking, breaks) linked to projects/tasks
- **projects**: Project records (name, client_name, color, is_billable, hourly_rate, budget_hours)
- **tasks**: Task records (name, description, project_id)
- **focus_sessions**: Pomodoro timer sessions (pomodoro_type, duration, project_id, task_id)
- **goals**: Time goals (goal_type: daily/weekly/monthly, target_seconds, category_id, project_id)
- **settings**: Application settings (idle threshold, polling interval, etc.)

### Database Indexes

Optimized with indexes for faster queries:
- `idx_activities_category` on `category_id`
- `idx_manual_entries_started` on `started_at`
- `idx_activities_app_category` composite index

## Configuration

### Settings

- **Idle Threshold**: Time before considering user idle (default: 2 minutes / 120 seconds)
  - Minimum: 30 seconds
  - Stored with second-level precision for accuracy
- **Idle Prompt Threshold**: Time before prompting user to classify idle time (default: 5 minutes / 300 seconds)
  - Minimum: 60 seconds
- **Polling Interval**: How often to check active window (default: 5 seconds)
- **Auto-start**: Start with system (Windows/macOS/Linux)
- **Minimize to Tray**: Keep running in background
- **Show Notifications**: Enable/disable system notifications (default: enabled)
- **Date Format**: Customize date display format (default: `YYYY-MM-DD`)
- **Time Format**: Choose between 12-hour or 24-hour format (default: `24h`)
  - Options: `12h` or `24h`

### Categories

Default categories:
- 💼 **Work**: IDE, office apps, work websites
- 💬 **Communication**: Slack, Teams, email, messengers
- 🎥 **Meetings**: Zoom, Meet, Teams calls
- 🌐 **Browser**: With domain breakdown
- 🎮 **Entertainment**: Games, YouTube, social media
- 🧠 **Thinking**: Manual thinking/planning time
- ☕ **Break**: Personal breaks
- ❓ **Uncategorized**: Unclassified activities

**Category Properties**:
- `is_productive`: Mark categories as productive/non-productive for productivity calculations
- `is_billable`: Mark categories as billable for revenue tracking
- `hourly_rate`: Set hourly rate for billable categories
- `sort_order`: Customize display order

### Categorization Rules

Auto-categorization uses pattern matching rules with three types:

**Rule Types**:
- **Application Name** (`app_name`): Match by application executable name
- **Window Title** (`window_title`): Match by window title text
- **Domain** (`domain`): Match by website domain (for browser activities)

**Wildcard Patterns** (for domain rules):
- `*pattern*` - Contains substring (e.g., `*google*` matches `google.com`, `googlemail.com`)
- `*pattern` - Ends with substring (e.g., `*.com` matches any `.com` domain)
- `pattern*` - Starts with substring (e.g., `github*` matches `github.com`, `github.io`)

**Reapply Rules**: Use "Reapply Rules" button in Settings to apply all categorization rules to existing activities. Useful after creating new rules or modifying existing ones.

### Domain Extraction

The application automatically extracts domains from browser window titles for supported browsers:
- **Supported Browsers**: Chrome, Firefox, Edge, Safari, Opera, Brave, Vivaldi
- **Extraction Patterns**:
  - URLs in title: `https://example.com/page - Browser`
  - Domain with dash: `example.com - Page Title` or `Page Title - example.com`
  - Direct domain match in title text
- **Features**:
  - Automatically removes `www.` prefix
  - Strips protocol (`http://`, `https://`)
  - Filters out localhost and IP addresses
  - Validates domain format

### Manual Entry Types

When creating manual entries, you can choose from:
- **Meeting** (`meeting`): Track meeting time
- **Thinking** (`thinking`): Track focused thinking/planning time
- **Call** (`call`): Track phone/video call time
- **Break** (`break`): Track break time
- **Personal** (`personal`): Track personal activities

All manual entries support:
- Project and task assignment
- Category selection
- Custom descriptions
- Custom time ranges

## Implementation Status

### ✅ Completed Features

**Phase 1: Critical Fixes** (100% Complete)
- ✅ Backend Commands (28+ commands including projects, tasks, billable, domains, pomodoro, goals)
- ✅ Database Methods (20+ methods)
- ✅ API Parameter Fixes
- ✅ Store Functions
- ✅ Type Fixes
- ✅ Hardcoded IDs Replacement

**Phase 2: Performance & Features** (Backend: 100% Complete | Frontend UI: Partial)
- ✅ CSV/JSON Export (CSV includes UTF-8 BOM for Excel compatibility)
- ✅ Database Optimization (indexes added)
- ✅ Error Handling (toast notifications)
- ✅ Validation (input validation for all forms, settings validation with minimum thresholds)
- ✅ Mock Data Removal (uses real API)
- ✅ Tray Features (thinking mode, pause/resume, minimize, quick navigation)
- ✅ Native APIs (10-100x faster window/idle detection)
- ✅ Autostart (Windows/macOS/Linux)
- ✅ **Professional Features Backend**: Project/Task Management, Billable Time, Domain Tracking, Pomodoro Timer, Goal Setting (all APIs, schemas, hooks complete)
- ✅ **Projects/Tasks Integration**: ManualEntryForm now supports project and task selection
- ✅ **Keyboard Shortcuts**: Navigation shortcuts (Ctrl+1-7) and quick actions (Ctrl+N)
- ✅ **Domain Extraction**: Automatic domain extraction from browser titles with multiple pattern support
- ✅ **Rule Reapplication**: Bulk reapply categorization rules to all activities
- ✅ **Hourly Activity Tracking**: API for hourly breakdown of daily activity
- ✅ **Productive Time Calculation**: Calculate productive time based on category flags
- ✅ **Goal Alerts**: Auto-refresh goal alerts every 5 minutes
- ⚠️ **Frontend UI**: Dedicated management components (Projects, Tasks, Pomodoro, Goals) and dashboard/reports enhancements pending (see Roadmap Phase 2A)

**Phase 3: Code Quality & UX** (100% Complete)
- ✅ Settings Implementation (save/load from backend)
- ✅ State Sync (improved state management)
- ✅ Loading States (skeleton loaders, spinners)
- ✅ Tray Events (all handlers implemented)

### Performance

- **Native APIs**: Replaced PowerShell/osascript/xdotool with native Rust crates
  - Window Detection: 10-100x faster (1-5ms vs 50-200ms)
  - Idle Detection: 50-150x faster (<1ms vs 50-150ms)
  - No external dependencies required

**Target Metrics**:
- RAM usage: < 50MB
- CPU usage: < 1%
- Startup time: < 2 seconds
- Window detection: < 5ms (native APIs)
- Idle detection: < 1ms (native APIs)

### Additional Features & Details

**Export Features**:
- **CSV Export**: Includes UTF-8 BOM (Byte Order Mark) for proper Excel compatibility with international characters
- **JSON Export**: Pretty-printed JSON format for easy parsing
- Both formats include: activity ID, app name, window title, category, start time, duration, idle flag

**Settings Validation**:
- Idle threshold minimum: 30 seconds (automatically adjusted if lower value entered)
- Idle prompt threshold minimum: 60 seconds (automatically adjusted if lower value entered)
- Settings are stored with second-level precision for accurate tracking

**Goal Alerts**:
- Automatic refresh every 5 minutes
- Shows warnings at 80% progress
- Shows completion notifications at 100%
- Alerts displayed in Dashboard widget

**Hourly Activity API**:
- `get_hourly_activity(date)`: Returns activity breakdown by hour for a specific day
- Useful for identifying peak productivity hours
- Available via backend API (UI visualization planned)

**Productive Time Calculation**:
- Calculated based on category `is_productive` flag
- Used in dashboard statistics and reports
- Helps track actual productive work time vs total tracked time

## Roadmap

### Phase 2A: Complete Frontend UI for Core Features ✅ (Complete)

#### Completed UI Components
- ✅ **Projects Component**: Full project management UI (list, create, edit, delete, archive)
- ✅ **Tasks Component**: Full task management UI (list, create, edit, delete, archive)
- ✅ **Pomodoro Component**: Timer UI with settings and focus mode toggle
- ✅ **Goals Component**: Goal management UI with progress indicators and alerts

#### Dashboard Enhancements ✅
- ✅ Project breakdown visualization
- ✅ Billable hours and revenue display
- ✅ Top websites widget (separate from apps)
- ✅ Pomodoro timer widget
- ✅ Goal progress widgets with visual indicators

#### Reports & Timeline Enhancements ✅
- ✅ Project/task filtering in reports
- ✅ Billable vs non-billable breakdown in reports
- ✅ Domain filtering and domain-based charts
- ✅ Timeline: Display domain information for browser activities
- ✅ Timeline: Visual distinction for billable entries

### Phase 2B: UI Enhancements & Advanced Features (Next 3-6 months)

#### Advanced Reporting
- **Period Comparison**: Compare this week vs last week, this month vs last month
- **Trend Analysis**: Show trends over time with line charts
- **Productivity Score**: Calculate score based on productive vs unproductive time
- **Weekly Summary Report**: Email/notification with weekly summary
- **PDF Export**: Professional PDF reports with charts (currently only CSV/JSON)
- **Hourly Activity Visualization**: Visual breakdown of activity by hour of day (API available, UI pending)

#### UX/UI Improvements
- **Better Timeline Visualization**:
  - Hourly breakdown visualization (API available)
  - Drag-and-drop to edit time entries
  - Visual gaps showing idle time
  - Zoom in/out for different time scales
  - Click to edit entries directly from timeline
- **Enhanced Dashboard**: Better visualization for projects, billable time, goals
- **Keyboard Shortcuts Expansion**:
  - Global shortcuts (even when app is minimized) - Currently supports window-level shortcuts
  - Start/stop tracking: `Ctrl+Shift+S` (planned)
  - Quick manual entry: `Ctrl+Shift+M` (planned, currently `Ctrl+N`)
  - Thinking mode toggle: `Ctrl+Shift+T` (planned)
  - Pause/resume: `Ctrl+Shift+P` (planned)
  - Show/hide window: `Ctrl+Shift+H` (planned)
  - Customizable shortcuts in settings (planned)
- **Dark Mode & Themes**:
  - Multiple color themes (not just light/dark)
  - Customizable accent colors
  - Category color customization
  - High contrast mode
  - System theme sync
- **Notifications & Reminders**:
  - Reminder to start tracking if idle
  - Daily summary notifications
  - Goal achievement notifications
  - Budget warning notifications
  - Customizable notification preferences
  - Do Not Disturb mode

#### New Features
- **Tags System**: Multi-tag support for more flexible organization
  - Tags table with many-to-many relationship to activities
  - Tag filtering in reports
  - Tag-based rules for auto-categorization
  - Tag cloud visualization
- **Time Entry Templates**: Save and reuse common manual entries
  - Quick-add buttons for frequent activities
  - Template library (meeting, call, break, etc.)
  - One-click entry from templates
- **Pomodoro Enhancements**: Focus mode that blocks distracting apps/websites

### Phase 3: Integrations & Advanced Features (6-12 months)

#### Integrations
- **Calendar Integration**:
  - Two-way sync with Google Calendar, Outlook, Apple Calendar
  - Auto-create time entries from calendar events
  - Show calendar events in timeline
  - Plan vs Actual comparison
  - Meeting detection and auto-tracking
- **Project Management Tool Integrations**:
  - Sync projects/tasks from Jira, Asana, Trello, Notion
  - Link time entries to PM tool tasks
  - Export time data to PM tools
  - Show PM tool context in reports
- **Accounting Software Integration**:
  - Export billable hours to QuickBooks, Xero, FreshBooks
  - Sync client/project data
  - Generate invoices from time data
  - Expense tracking integration

#### Advanced Features
- **Activity Level Detection**:
  - Track keyboard strokes and mouse movements per activity
  - Calculate activity percentage (0-100%)
  - Show activity level in reports
  - Filter low-activity periods
  - Screenshot capture option (privacy-controlled)
- **Productivity Metrics**:
  - Productivity score calculation (0-100)
  - Focus time tracking (uninterrupted work periods)
  - Distraction frequency analysis
  - Peak productivity hours identification
  - Weekly productivity trends
- **Forecasting & Estimates**:
  - Time estimates per project/task
  - Actual vs estimated comparison
  - Forecast completion dates based on velocity
  - Budget burn-down charts
  - Resource planning
- **Offline Mode & Sync**:
  - Optional cloud sync (encrypted)
  - Conflict resolution for offline edits
  - Multi-device support
  - Backup/restore functionality
  - Export/import database

### Phase 4: Future Considerations

#### Advanced Capabilities
- **AI-Powered Features**:
  - AI-suggested categories based on app/window title
  - Smart activity descriptions
  - Anomaly detection (unusual activity patterns)
  - Productivity insights and recommendations
  - Natural language time entry ("worked on project X for 2 hours")
- **Team Collaboration**:
  - Multi-user support (optional)
  - Shared projects
  - Team dashboards
  - User activity comparison
  - Team productivity metrics
  - Privacy controls (what's shared vs private)
- **Mobile App Companion**:
  - Mobile app for iOS/Android
  - Sync with desktop app
  - Manual entry on mobile
  - View reports on mobile
  - GPS tracking for field work (optional)

#### Privacy & Security Enhancements
- **Enhanced Privacy Controls**:
  - Option to exclude specific apps/websites from tracking
  - Private mode (pause all tracking)
  - Data encryption at rest
  - Local-only mode (no cloud sync)
  - Data retention policies
  - Export and delete all data option
- **Additional Export Formats**:
  - Excel export with formatting (CSV currently includes UTF-8 BOM for Excel compatibility)
  - iCal export for calendar integration
  - API for programmatic access
  - Automated exports (scheduled)

## Special Thanks

- Anastasiya Murenka
- Aliaksei Berkau
- Andrei Zhytkevich

## License

This project is licensed under the MIT License.

Copyright (c) 2026 bthos

See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Follow the code style** - TypeScript/React for frontend, Rust for backend
3. **Write clear commit messages** describing your changes
4. **Test your changes** - Ensure the application builds and runs correctly
5. **Submit a pull request** with a clear description of your changes

### Development Setup

Before contributing, make sure you have:
- Node.js v18+ installed
- Rust toolchain installed
- MSVC Build Tools (Windows) or equivalent build tools for your platform

See the [Getting Started](#getting-started) section for detailed setup instructions.
