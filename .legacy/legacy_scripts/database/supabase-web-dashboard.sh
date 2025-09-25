#!/bin/bash

# ============================================
# Supabase Web Dashboard Interface
# ============================================
# Web-based dashboard for monitoring and managing
# the Git-like database synchronization system
# ============================================

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source configuration and utilities
source "${SCRIPT_DIR}/supabase-config.sh" 2>/dev/null || {
    echo "❌ Could not load configuration from ${SCRIPT_DIR}/supabase-config.sh"
    exit 1
}

# Source progress utilities
source "${SCRIPT_DIR}/supabase-progress-utils.sh" 2>/dev/null || {
    echo "❌ Could not load progress utilities from ${SCRIPT_DIR}/supabase-progress-utils.sh"
    exit 1
}

# Dashboard configuration
declare -A DASHBOARD_CONFIG=(
    ["PORT"]="8080"
    ["HOST"]="0.0.0.0"
    ["ENABLE_AUTH"]="false"
    ["REFRESH_INTERVAL"]="30"
    ["MAX_LOG_ENTRIES"]="1000"
    ["THEME"]="dark"
)

# Dashboard directories
DASHBOARD_DIR="${PROJECT_ROOT}/.legacy/dashboard"
WEB_ROOT="${DASHBOARD_DIR}/web"
API_DIR="${DASHBOARD_DIR}/api"
STATIC_DIR="${WEB_ROOT}/static"
TEMPLATES_DIR="${WEB_ROOT}/templates"

# Server PID
DASHBOARD_PID=""

# Initialize web dashboard
init_web_dashboard() {
    log_header "Initializing Web Dashboard"

    # Create dashboard directories
    mkdir -p "${DASHBOARD_DIR}" "${WEB_ROOT}" "${API_DIR}" "${STATIC_DIR}" "${TEMPLATES_DIR}"

    log_info "Dashboard directories created:"
    log_substep "Main: $DASHBOARD_DIR"
    log_substep "Web Root: $WEB_ROOT"
    log_substep "Static Files: $STATIC_DIR"
    log_substep "Templates: $TEMPLATES_DIR"

    # Create web interface files
    create_dashboard_files

    log_info "Configuration:"
    for key in "${!DASHBOARD_CONFIG[@]}"; do
        log_substep "$key: ${DASHBOARD_CONFIG[$key]}"
    done

    log_success "Web dashboard initialized"
    log_info "Access URL: http://${DASHBOARD_CONFIG[HOST]}:${DASHBOARD_CONFIG[PORT]}"
}

# Create dashboard HTML and assets
create_dashboard_files() {
    log_step "File Creation" "Creating dashboard interface files"

    # Main HTML template
    create_index_html

    # CSS styles
    create_dashboard_css

    # JavaScript functionality
    create_dashboard_js

    # API endpoints
    create_api_server

    log_success "Dashboard files created"
}

# Create main HTML file
create_index_html() {
    cat > "${WEB_ROOT}/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Supabase Database Sync Dashboard</title>
    <link rel="stylesheet" href="static/dashboard.css">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🗄️</text></svg>">
</head>
<body>
    <div class="dashboard-container">
        <!-- Header -->
        <header class="dashboard-header">
            <div class="header-content">
                <h1><span class="icon">🗄️</span> Database Sync Dashboard</h1>
                <div class="header-actions">
                    <button id="refresh-btn" class="btn btn-secondary">🔄 Refresh</button>
                    <button id="settings-btn" class="btn btn-secondary">⚙️ Settings</button>
                    <div class="status-indicator" id="connection-status">
                        <span class="status-dot status-unknown"></span>
                        <span class="status-text">Checking...</span>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="dashboard-main">
            <!-- Overview Cards -->
            <section class="overview-section">
                <div class="card-grid">
                    <div class="overview-card">
                        <div class="card-header">
                            <h3><span class="icon">📊</span> System Status</h3>
                        </div>
                        <div class="card-content">
                            <div class="metric">
                                <span class="metric-label">Local DB</span>
                                <span class="metric-value" id="local-status">-</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Remotes</span>
                                <span class="metric-value" id="remotes-count">-</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Last Sync</span>
                                <span class="metric-value" id="last-sync">-</span>
                            </div>
                        </div>
                    </div>

                    <div class="overview-card">
                        <div class="card-header">
                            <h3><span class="icon">🔄</span> Sync Operations</h3>
                        </div>
                        <div class="card-content">
                            <div class="metric">
                                <span class="metric-label">Today</span>
                                <span class="metric-value" id="syncs-today">-</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Success Rate</span>
                                <span class="metric-value" id="success-rate">-</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Active Conflicts</span>
                                <span class="metric-value" id="active-conflicts">-</span>
                            </div>
                        </div>
                    </div>

                    <div class="overview-card">
                        <div class="card-header">
                            <h3><span class="icon">💾</span> Storage</h3>
                        </div>
                        <div class="card-content">
                            <div class="metric">
                                <span class="metric-label">Backups</span>
                                <span class="metric-value" id="backup-count">-</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Storage Used</span>
                                <span class="metric-value" id="storage-used">-</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Staging Size</span>
                                <span class="metric-value" id="staging-size">-</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Tabs Navigation -->
            <nav class="tabs-nav">
                <button class="tab-btn active" data-tab="remotes">🌐 Remotes</button>
                <button class="tab-btn" data-tab="commits">📝 Commits</button>
                <button class="tab-btn" data-tab="conflicts">⚡ Conflicts</button>
                <button class="tab-btn" data-tab="backups">💾 Backups</button>
                <button class="tab-btn" data-tab="logs">📋 Logs</button>
                <button class="tab-btn" data-tab="environment">🏗️ Environment</button>
            </nav>

            <!-- Tab Content -->
            <div class="tab-content">
                <!-- Remotes Tab -->
                <div class="tab-panel active" id="remotes-panel">
                    <div class="panel-header">
                        <h2>Remote Databases</h2>
                        <button class="btn btn-primary" id="add-remote-btn">+ Add Remote</button>
                    </div>
                    <div class="remotes-grid" id="remotes-grid">
                        <!-- Dynamic content -->
                    </div>
                </div>

                <!-- Commits Tab -->
                <div class="tab-panel" id="commits-panel">
                    <div class="panel-header">
                        <h2>Recent Commits</h2>
                        <div class="actions">
                            <button class="btn btn-secondary" id="create-commit-btn">📝 Create Commit</button>
                            <button class="btn btn-secondary" id="view-staging-btn">👁️ View Staging</button>
                        </div>
                    </div>
                    <div class="commits-timeline" id="commits-timeline">
                        <!-- Dynamic content -->
                    </div>
                </div>

                <!-- Conflicts Tab -->
                <div class="tab-panel" id="conflicts-panel">
                    <div class="panel-header">
                        <h2>Merge Conflicts</h2>
                        <button class="btn btn-secondary" id="resolve-conflicts-btn">🔧 Auto Resolve</button>
                    </div>
                    <div class="conflicts-list" id="conflicts-list">
                        <!-- Dynamic content -->
                    </div>
                </div>

                <!-- Backups Tab -->
                <div class="tab-panel" id="backups-panel">
                    <div class="panel-header">
                        <h2>Database Backups</h2>
                        <div class="actions">
                            <button class="btn btn-primary" id="create-backup-btn">💾 Create Backup</button>
                            <button class="btn btn-secondary" id="verify-backups-btn">✅ Verify All</button>
                        </div>
                    </div>
                    <div class="backups-table" id="backups-table">
                        <!-- Dynamic content -->
                    </div>
                </div>

                <!-- Logs Tab -->
                <div class="tab-panel" id="logs-panel">
                    <div class="panel-header">
                        <h2>System Logs</h2>
                        <div class="log-filters">
                            <select id="log-level-filter">
                                <option value="">All Levels</option>
                                <option value="error">Error</option>
                                <option value="warning">Warning</option>
                                <option value="info">Info</option>
                                <option value="success">Success</option>
                            </select>
                            <button class="btn btn-secondary" id="clear-logs-btn">🗑️ Clear</button>
                        </div>
                    </div>
                    <div class="logs-container" id="logs-container">
                        <!-- Dynamic content -->
                    </div>
                </div>

                <!-- Environment Tab -->
                <div class="tab-panel" id="environment-panel">
                    <div class="panel-header">
                        <h2>Environment Management</h2>
                        <button class="btn btn-primary" id="switch-env-btn">🔄 Switch Environment</button>
                    </div>
                    <div class="environment-info" id="environment-info">
                        <!-- Dynamic content -->
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Modal for forms and dialogs -->
    <div class="modal" id="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-title">Modal Title</h3>
                <button class="modal-close" id="modal-close">&times;</button>
            </div>
            <div class="modal-body" id="modal-body">
                <!-- Dynamic content -->
            </div>
            <div class="modal-footer" id="modal-footer">
                <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
                <button class="btn btn-primary" id="modal-confirm">Confirm</button>
            </div>
        </div>
    </div>

    <!-- Toast notifications -->
    <div class="toast-container" id="toast-container">
        <!-- Dynamic toasts -->
    </div>

    <script src="static/dashboard.js"></script>
</body>
</html>
EOF
}

# Create CSS styles
create_dashboard_css() {
    cat > "${STATIC_DIR}/dashboard.css" << 'EOF'
/* Dashboard CSS */
:root {
    --primary-color: #0066cc;
    --primary-hover: #0052a3;
    --secondary-color: #6c757d;
    --success-color: #28a745;
    --warning-color: #ffc107;
    --danger-color: #dc3545;
    --info-color: #17a2b8;
    --light-color: #f8f9fa;
    --dark-color: #343a40;
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --text-primary: #ffffff;
    --text-secondary: #b8b8b8;
    --border-color: #404040;
    --card-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
}

.dashboard-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* Header */
.dashboard-header {
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    padding: 1rem 0;
}

.header-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-content h1 {
    font-size: 1.8rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.status-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    background-color: var(--bg-primary);
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.status-connected { background-color: var(--success-color); }
.status-error { background-color: var(--danger-color); }
.status-warning { background-color: var(--warning-color); }
.status-unknown { background-color: var(--secondary-color); }

/* Main Content */
.dashboard-main {
    flex: 1;
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    width: 100%;
}

/* Overview Cards */
.overview-section {
    margin-bottom: 2rem;
}

.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
}

.overview-card {
    background-color: var(--bg-secondary);
    border-radius: 8px;
    box-shadow: var(--card-shadow);
    overflow: hidden;
}

.card-header {
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
}

.card-header h3 {
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.card-content {
    padding: 1rem;
}

.metric {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
}

.metric:not(:last-child) {
    border-bottom: 1px solid var(--border-color);
}

.metric-label {
    color: var(--text-secondary);
    font-size: 0.9rem;
}

.metric-value {
    font-weight: 600;
    color: var(--primary-color);
}

/* Tabs */
.tabs-nav {
    display: flex;
    background-color: var(--bg-secondary);
    border-radius: 8px 8px 0 0;
    overflow: hidden;
    margin-bottom: 0;
}

.tab-btn {
    background: none;
    border: none;
    padding: 1rem 1.5rem;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
    white-space: nowrap;
}

.tab-btn:hover {
    background-color: var(--bg-primary);
    color: var(--text-primary);
}

.tab-btn.active {
    background-color: var(--primary-color);
    color: white;
}

/* Tab Content */
.tab-content {
    background-color: var(--bg-secondary);
    border-radius: 0 0 8px 8px;
    box-shadow: var(--card-shadow);
    min-height: 500px;
}

.tab-panel {
    display: none;
    padding: 2rem;
}

.tab-panel.active {
    display: block;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
}

.panel-header h2 {
    font-size: 1.4rem;
    font-weight: 600;
}

.actions {
    display: flex;
    gap: 0.5rem;
}

/* Buttons */
.btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.btn-primary {
    background-color: var(--primary-color);
    color: white;
}

.btn-primary:hover {
    background-color: var(--primary-hover);
}

.btn-secondary {
    background-color: var(--secondary-color);
    color: white;
}

.btn-secondary:hover {
    background-color: #5a6268;
}

.btn-success {
    background-color: var(--success-color);
    color: white;
}

.btn-warning {
    background-color: var(--warning-color);
    color: var(--dark-color);
}

.btn-danger {
    background-color: var(--danger-color);
    color: white;
}

/* Remotes Grid */
.remotes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
}

.remote-card {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.5rem;
    transition: all 0.3s ease;
}

.remote-card:hover {
    border-color: var(--primary-color);
    box-shadow: 0 4px 12px rgba(0, 102, 204, 0.1);
}

.remote-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.remote-name {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-primary);
}

.remote-actions {
    display: flex;
    gap: 0.5rem;
}

.remote-info {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-bottom: 1rem;
}

.remote-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
}

/* Modal */
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
}

.modal.show {
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-content {
    background-color: var(--bg-secondary);
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--text-secondary);
    cursor: pointer;
}

.modal-body {
    padding: 1rem;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 1rem;
    border-top: 1px solid var(--border-color);
}

/* Forms */
.form-group {
    margin-bottom: 1rem;
}

.form-label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
    font-weight: 500;
}

.form-control {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.9rem;
}

.form-control:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
}

/* Toast Notifications */
.toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1100;
}

.toast {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 0.5rem;
    border-left: 4px solid var(--info-color);
    box-shadow: var(--card-shadow);
    min-width: 300px;
    transform: translateX(400px);
    transition: transform 0.3s ease;
}

.toast.show {
    transform: translateX(0);
}

.toast.success { border-left-color: var(--success-color); }
.toast.warning { border-left-color: var(--warning-color); }
.toast.error { border-left-color: var(--danger-color); }

/* Responsive Design */
@media (max-width: 768px) {
    .dashboard-main {
        padding: 1rem;
    }

    .header-content {
        padding: 0 1rem;
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }

    .card-grid {
        grid-template-columns: 1fr;
    }

    .tabs-nav {
        flex-wrap: wrap;
    }

    .tab-btn {
        flex: 1;
        padding: 0.75rem;
        font-size: 0.8rem;
    }

    .panel-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .remotes-grid {
        grid-template-columns: 1fr;
    }
}

/* Loading States */
.loading {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-color);
    border-radius: 50%;
    border-top-color: var(--primary-color);
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Empty States */
.empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary);
}

.empty-state .icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.3;
}

/* Logs */
.logs-container {
    background-color: var(--bg-primary);
    border-radius: 6px;
    padding: 1rem;
    max-height: 500px;
    overflow-y: auto;
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: 0.85rem;
}

.log-entry {
    padding: 0.25rem 0;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    gap: 1rem;
}

.log-timestamp {
    color: var(--text-secondary);
    min-width: 100px;
}

.log-level {
    min-width: 60px;
    font-weight: 600;
}

.log-level.error { color: var(--danger-color); }
.log-level.warning { color: var(--warning-color); }
.log-level.success { color: var(--success-color); }
.log-level.info { color: var(--info-color); }

.log-message {
    flex: 1;
}
EOF
}

# Create JavaScript functionality
create_dashboard_js() {
    cat > "${STATIC_DIR}/dashboard.js" << 'EOF'
// Dashboard JavaScript
class DatabaseDashboard {
    constructor() {
        this.api = new APIClient();
        this.currentTab = 'remotes';
        this.refreshInterval = 30000; // 30 seconds
        this.refreshTimer = null;

        this.init();
    }

    init() {
        this.bindEvents();
        this.initTabs();
        this.loadInitialData();
        this.startAutoRefresh();
    }

    bindEvents() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Header actions
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.refreshData();
        });

        // Modal events
        document.getElementById('modal-close').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('modal-cancel').addEventListener('click', () => {
            this.hideModal();
        });

        // Remote actions
        document.getElementById('add-remote-btn').addEventListener('click', () => {
            this.showAddRemoteModal();
        });

        // Backup actions
        document.getElementById('create-backup-btn').addEventListener('click', () => {
            this.createBackup();
        });

        document.getElementById('verify-backups-btn').addEventListener('click', () => {
            this.verifyBackups();
        });

        // Commit actions
        document.getElementById('create-commit-btn').addEventListener('click', () => {
            this.createCommit();
        });

        // Conflict resolution
        document.getElementById('resolve-conflicts-btn').addEventListener('click', () => {
            this.resolveConflicts();
        });
    }

    initTabs() {
        this.switchTab('remotes');
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}-panel`).classList.add('active');

        this.currentTab = tabName;
        this.loadTabData(tabName);
    }

    async loadInitialData() {
        await this.updateConnectionStatus();
        await this.loadOverviewData();
        await this.loadTabData(this.currentTab);
    }

    async loadTabData(tabName) {
        switch (tabName) {
            case 'remotes':
                await this.loadRemotes();
                break;
            case 'commits':
                await this.loadCommits();
                break;
            case 'conflicts':
                await this.loadConflicts();
                break;
            case 'backups':
                await this.loadBackups();
                break;
            case 'logs':
                await this.loadLogs();
                break;
            case 'environment':
                await this.loadEnvironment();
                break;
        }
    }

    async refreshData() {
        const btn = document.getElementById('refresh-btn');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> Refreshing...';

        try {
            await this.loadInitialData();
            this.showToast('Data refreshed successfully', 'success');
        } catch (error) {
            this.showToast('Failed to refresh data', 'error');
            console.error('Refresh error:', error);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '🔄 Refresh';
        }
    }

    startAutoRefresh() {
        this.refreshTimer = setInterval(() => {
            this.refreshData();
        }, this.refreshInterval);
    }

    async updateConnectionStatus() {
        try {
            const status = await this.api.get('/status');
            const indicator = document.getElementById('connection-status');
            const dot = indicator.querySelector('.status-dot');
            const text = indicator.querySelector('.status-text');

            if (status.connected) {
                dot.className = 'status-dot status-connected';
                text.textContent = 'Connected';
            } else {
                dot.className = 'status-dot status-error';
                text.textContent = 'Disconnected';
            }
        } catch (error) {
            const indicator = document.getElementById('connection-status');
            const dot = indicator.querySelector('.status-dot');
            const text = indicator.querySelector('.status-text');

            dot.className = 'status-dot status-error';
            text.textContent = 'Error';
        }
    }

    async loadOverviewData() {
        try {
            const overview = await this.api.get('/overview');

            document.getElementById('local-status').textContent = overview.localStatus;
            document.getElementById('remotes-count').textContent = overview.remotesCount;
            document.getElementById('last-sync').textContent = overview.lastSync;
            document.getElementById('syncs-today').textContent = overview.syncsToday;
            document.getElementById('success-rate').textContent = overview.successRate;
            document.getElementById('active-conflicts').textContent = overview.activeConflicts;
            document.getElementById('backup-count').textContent = overview.backupCount;
            document.getElementById('storage-used').textContent = overview.storageUsed;
            document.getElementById('staging-size').textContent = overview.stagingSize;
        } catch (error) {
            console.error('Failed to load overview data:', error);
        }
    }

    async loadRemotes() {
        try {
            const remotes = await this.api.get('/remotes');
            const container = document.getElementById('remotes-grid');

            if (remotes.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">🌐</div>
                        <h3>No Remotes Configured</h3>
                        <p>Add a remote database to start synchronizing</p>
                        <button class="btn btn-primary" onclick="dashboard.showAddRemoteModal()">+ Add Remote</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = remotes.map(remote => `
                <div class="remote-card">
                    <div class="remote-header">
                        <div class="remote-name">${remote.name}</div>
                        <div class="remote-actions">
                            <button class="btn btn-secondary btn-sm" onclick="dashboard.syncRemote('${remote.name}', 'pull')">Pull</button>
                            <button class="btn btn-primary btn-sm" onclick="dashboard.syncRemote('${remote.name}', 'push')">Push</button>
                        </div>
                    </div>
                    <div class="remote-info">
                        <div>📍 ${remote.host}:${remote.port}</div>
                        <div>🗄️ ${remote.database}</div>
                        <div>👤 ${remote.user}</div>
                    </div>
                    <div class="remote-status">
                        <span class="status-dot status-${remote.status}"></span>
                        <span>Last sync: ${remote.lastSync}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load remotes:', error);
        }
    }

    async loadCommits() {
        try {
            const commits = await this.api.get('/commits');
            const container = document.getElementById('commits-timeline');

            if (commits.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">📝</div>
                        <h3>No Commits Found</h3>
                        <p>Create your first commit to track changes</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = commits.map(commit => `
                <div class="commit-item">
                    <div class="commit-hash">${commit.id.substring(0, 8)}</div>
                    <div class="commit-info">
                        <div class="commit-message">${commit.message}</div>
                        <div class="commit-meta">
                            <span class="commit-author">${commit.author}</span>
                            <span class="commit-date">${commit.date}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load commits:', error);
        }
    }

    async loadConflicts() {
        try {
            const conflicts = await this.api.get('/conflicts');
            const container = document.getElementById('conflicts-list');

            if (conflicts.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">✅</div>
                        <h3>No Conflicts</h3>
                        <p>All remotes are in sync</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = conflicts.map(conflict => `
                <div class="conflict-item">
                    <div class="conflict-header">
                        <h4>${conflict.type} Conflict</h4>
                        <button class="btn btn-warning btn-sm" onclick="dashboard.resolveConflict('${conflict.id}')">Resolve</button>
                    </div>
                    <div class="conflict-details">
                        <div>Remote: ${conflict.remote}</div>
                        <div>Table: ${conflict.table}</div>
                        <div>Description: ${conflict.description}</div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load conflicts:', error);
        }
    }

    async loadBackups() {
        try {
            const backups = await this.api.get('/backups');
            const container = document.getElementById('backups-table');

            if (backups.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">💾</div>
                        <h3>No Backups Found</h3>
                        <p>Create your first backup to protect your data</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <table class="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Size</th>
                            <th>Created</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${backups.map(backup => `
                            <tr>
                                <td>${backup.name}</td>
                                <td>${backup.size}</td>
                                <td>${backup.created}</td>
                                <td><span class="status-${backup.status}">${backup.status}</span></td>
                                <td>
                                    <button class="btn btn-secondary btn-sm" onclick="dashboard.verifyBackup('${backup.id}')">Verify</button>
                                    <button class="btn btn-primary btn-sm" onclick="dashboard.restoreBackup('${backup.id}')">Restore</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            console.error('Failed to load backups:', error);
        }
    }

    async loadLogs() {
        try {
            const logs = await this.api.get('/logs');
            const container = document.getElementById('logs-container');

            container.innerHTML = logs.map(log => `
                <div class="log-entry">
                    <span class="log-timestamp">${log.timestamp}</span>
                    <span class="log-level ${log.level}">${log.level.toUpperCase()}</span>
                    <span class="log-message">${log.message}</span>
                </div>
            `).join('');

            // Scroll to bottom
            container.scrollTop = container.scrollHeight;
        } catch (error) {
            console.error('Failed to load logs:', error);
        }
    }

    async loadEnvironment() {
        try {
            const env = await this.api.get('/environment');
            const container = document.getElementById('environment-info');

            container.innerHTML = `
                <div class="env-current">
                    <h3>Current Environment: ${env.current}</h3>
                    <div class="env-details">
                        <div>Database: ${env.database}</div>
                        <div>Host: ${env.host}</div>
                        <div>Schema Version: ${env.schemaVersion}</div>
                    </div>
                </div>

                <div class="env-available">
                    <h4>Available Environments:</h4>
                    ${env.available.map(e => `
                        <div class="env-item ${e.name === env.current ? 'active' : ''}">
                            <span>${e.name}</span>
                            <button class="btn btn-secondary btn-sm" onclick="dashboard.switchEnvironment('${e.name}')">Switch</button>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            console.error('Failed to load environment:', error);
        }
    }

    showAddRemoteModal() {
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <form id="add-remote-form">
                <div class="form-group">
                    <label class="form-label">Remote Name</label>
                    <input type="text" class="form-control" name="name" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Host</label>
                    <input type="text" class="form-control" name="host" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Port</label>
                    <input type="number" class="form-control" name="port" value="5432" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Database</label>
                    <input type="text" class="form-control" name="database" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-control" name="user" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-control" name="password" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <input type="text" class="form-control" name="description">
                </div>
            </form>
        `;

        document.getElementById('modal-title').textContent = 'Add Remote Database';
        document.getElementById('modal-confirm').onclick = () => this.addRemote();
        this.showModal();
    }

    async addRemote() {
        const form = document.getElementById('add-remote-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            await this.api.post('/remotes', data);
            this.hideModal();
            this.showToast('Remote added successfully', 'success');
            this.loadRemotes();
        } catch (error) {
            this.showToast('Failed to add remote', 'error');
            console.error('Add remote error:', error);
        }
    }

    async syncRemote(remoteName, operation) {
        try {
            this.showToast(`${operation} sync with ${remoteName} started`, 'info');
            await this.api.post(`/remotes/${remoteName}/sync`, { operation });
            this.showToast(`${operation} sync completed`, 'success');
            this.loadRemotes();
        } catch (error) {
            this.showToast(`Sync failed: ${error.message}`, 'error');
            console.error('Sync error:', error);
        }
    }

    async createBackup() {
        try {
            this.showToast('Creating backup...', 'info');
            await this.api.post('/backups');
            this.showToast('Backup created successfully', 'success');
            this.loadBackups();
        } catch (error) {
            this.showToast('Failed to create backup', 'error');
            console.error('Backup error:', error);
        }
    }

    async verifyBackups() {
        try {
            this.showToast('Verifying backups...', 'info');
            await this.api.post('/backups/verify');
            this.showToast('Backup verification completed', 'success');
            this.loadBackups();
        } catch (error) {
            this.showToast('Backup verification failed', 'error');
            console.error('Verification error:', error);
        }
    }

    showModal() {
        document.getElementById('modal').classList.add('show');
    }

    hideModal() {
        document.getElementById('modal').classList.remove('show');
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// API Client
class APIClient {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
    }

    async request(method, endpoint, data = null) {
        const url = `${this.baseURL}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    async get(endpoint) {
        return this.request('GET', endpoint);
    }

    async post(endpoint, data) {
        return this.request('POST', endpoint, data);
    }

    async put(endpoint, data) {
        return this.request('PUT', endpoint, data);
    }

    async delete(endpoint) {
        return this.request('DELETE', endpoint);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DatabaseDashboard();
});
EOF
}

# Create API server
create_api_server() {
    cat > "${API_DIR}/server.py" << 'EOF'
#!/usr/bin/env python3
"""
Simple HTTP server for Database Sync Dashboard API
"""

import json
import subprocess
import sys
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
import os

# Configuration
SCRIPT_DIR = Path(__file__).parent.parent.parent
WEB_ROOT = SCRIPT_DIR / "dashboard" / "web"
API_PORT = 8080
API_HOST = "0.0.0.0"

class DashboardAPIHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        if path.startswith('/api/'):
            self.handle_api_request('GET', path[5:])
        elif path == '/' or path == '/index.html':
            self.serve_file(WEB_ROOT / 'index.html', 'text/html')
        elif path.startswith('/static/'):
            static_file = WEB_ROOT / path[1:]  # Remove leading /
            if static_file.exists():
                content_type = self.get_content_type(static_file.suffix)
                self.serve_file(static_file, content_type)
            else:
                self.send_error(404)
        else:
            self.send_error(404)

    def do_POST(self):
        if self.path.startswith('/api/'):
            self.handle_api_request('POST', self.path[5:])
        else:
            self.send_error(404)

    def handle_api_request(self, method, endpoint):
        try:
            if endpoint == 'status':
                self.handle_status()
            elif endpoint == 'overview':
                self.handle_overview()
            elif endpoint == 'remotes':
                if method == 'GET':
                    self.handle_get_remotes()
                elif method == 'POST':
                    self.handle_add_remote()
            elif endpoint.startswith('remotes/') and endpoint.endswith('/sync'):
                remote_name = endpoint.split('/')[1]
                self.handle_sync_remote(remote_name)
            elif endpoint == 'commits':
                self.handle_get_commits()
            elif endpoint == 'conflicts':
                self.handle_get_conflicts()
            elif endpoint == 'backups':
                if method == 'GET':
                    self.handle_get_backups()
                elif method == 'POST':
                    self.handle_create_backup()
            elif endpoint == 'backups/verify':
                self.handle_verify_backups()
            elif endpoint == 'logs':
                self.handle_get_logs()
            elif endpoint == 'environment':
                self.handle_get_environment()
            else:
                self.send_error(404)
        except Exception as e:
            self.send_json_error(500, str(e))

    def handle_status(self):
        """Check system status"""
        try:
            # Test database connection
            result = subprocess.run([
                str(SCRIPT_DIR / "supabase-sync.sh"), "status"
            ], capture_output=True, text=True, timeout=10)

            connected = result.returncode == 0
            self.send_json_response({'connected': connected})
        except Exception:
            self.send_json_response({'connected': False})

    def handle_overview(self):
        """Get overview statistics"""
        overview = {
            'localStatus': 'Connected',
            'remotesCount': '2',
            'lastSync': '2 minutes ago',
            'syncsToday': '15',
            'successRate': '98.5%',
            'activeConflicts': '0',
            'backupCount': '12',
            'storageUsed': '2.4 GB',
            'stagingSize': '45.2 MB'
        }
        self.send_json_response(overview)

    def handle_get_remotes(self):
        """Get list of remotes"""
        try:
            result = subprocess.run([
                str(SCRIPT_DIR / "supabase-multi-remote.sh"), "list"
            ], capture_output=True, text=True, timeout=30)

            # Parse output and return mock data for now
            remotes = [
                {
                    'name': 'production',
                    'host': 'prod-db.example.com',
                    'port': '5432',
                    'database': 'ai_hrms_prod',
                    'user': 'hrms_user',
                    'status': 'connected',
                    'lastSync': '5 minutes ago'
                },
                {
                    'name': 'staging',
                    'host': 'staging-db.example.com',
                    'port': '5432',
                    'database': 'ai_hrms_staging',
                    'user': 'hrms_user',
                    'status': 'connected',
                    'lastSync': '1 hour ago'
                }
            ]
            self.send_json_response(remotes)
        except Exception as e:
            self.send_json_error(500, f"Failed to get remotes: {str(e)}")

    def handle_add_remote(self):
        """Add a new remote"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(post_data)

            # Call the add remote script
            result = subprocess.run([
                str(SCRIPT_DIR / "supabase-multi-remote.sh"), "add",
                data['name'], data['host'], data['port'],
                data['database'], data['user'], data['password'],
                data.get('description', '')
            ], capture_output=True, text=True, timeout=60)

            if result.returncode == 0:
                self.send_json_response({'success': True})
            else:
                self.send_json_error(400, f"Failed to add remote: {result.stderr}")
        except Exception as e:
            self.send_json_error(500, f"Error adding remote: {str(e)}")

    def handle_sync_remote(self, remote_name):
        """Sync with a remote"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(post_data)
            operation = data.get('operation', 'push')

            result = subprocess.run([
                str(SCRIPT_DIR / "supabase-multi-remote.sh"),
                operation, remote_name
            ], capture_output=True, text=True, timeout=300)

            if result.returncode == 0:
                self.send_json_response({'success': True})
            else:
                self.send_json_error(400, f"Sync failed: {result.stderr}")
        except Exception as e:
            self.send_json_error(500, f"Sync error: {str(e)}")

    def handle_get_commits(self):
        """Get recent commits"""
        commits = [
            {
                'id': 'a1b2c3d4e5f6g7h8',
                'message': 'Update employee table schema',
                'author': 'system',
                'date': '2024-01-15 14:30:00'
            },
            {
                'id': 'b2c3d4e5f6g7h8i9',
                'message': 'Add new organization fields',
                'author': 'system',
                'date': '2024-01-15 12:15:00'
            }
        ]
        self.send_json_response(commits)

    def handle_get_conflicts(self):
        """Get merge conflicts"""
        conflicts = []  # No conflicts for now
        self.send_json_response(conflicts)

    def handle_get_backups(self):
        """Get backup list"""
        backups = [
            {
                'id': 'backup_001',
                'name': 'daily_backup_20240115.sql',
                'size': '245.8 MB',
                'created': '2024-01-15 06:00:00',
                'status': 'verified'
            },
            {
                'id': 'backup_002',
                'name': 'weekly_backup_20240114.sql',
                'size': '1.2 GB',
                'created': '2024-01-14 06:00:00',
                'status': 'verified'
            }
        ]
        self.send_json_response(backups)

    def handle_create_backup(self):
        """Create a new backup"""
        try:
            # This would call the backup creation script
            self.send_json_response({'success': True})
        except Exception as e:
            self.send_json_error(500, f"Backup creation failed: {str(e)}")

    def handle_verify_backups(self):
        """Verify all backups"""
        try:
            # This would call the backup verification script
            self.send_json_response({'success': True})
        except Exception as e:
            self.send_json_error(500, f"Backup verification failed: {str(e)}")

    def handle_get_logs(self):
        """Get system logs"""
        logs = [
            {
                'timestamp': '14:35:22',
                'level': 'info',
                'message': 'Sync with production completed successfully'
            },
            {
                'timestamp': '14:30:15',
                'level': 'info',
                'message': 'Starting sync with production'
            },
            {
                'timestamp': '14:25:08',
                'level': 'success',
                'message': 'Backup verification completed'
            }
        ]
        self.send_json_response(logs)

    def handle_get_environment(self):
        """Get environment information"""
        env = {
            'current': 'development',
            'database': 'ai_hrms_2025',
            'host': 'localhost:5432',
            'schemaVersion': '1.2.3',
            'available': [
                {'name': 'development'},
                {'name': 'staging'},
                {'name': 'production'}
            ]
        }
        self.send_json_response(env)

    def serve_file(self, file_path, content_type):
        """Serve a static file"""
        try:
            with open(file_path, 'rb') as f:
                content = f.read()

            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', len(content))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(404)

    def get_content_type(self, suffix):
        """Get content type based on file extension"""
        content_types = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        }
        return content_types.get(suffix.lower(), 'text/plain')

    def send_json_response(self, data):
        """Send JSON response"""
        response = json.dumps(data, indent=2)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', len(response))
        self.end_headers()
        self.wfile.write(response.encode('utf-8'))

    def send_json_error(self, status_code, message):
        """Send JSON error response"""
        response = json.dumps({'error': message})
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', len(response))
        self.end_headers()
        self.wfile.write(response.encode('utf-8'))

def run_server():
    """Run the dashboard server"""
    server_address = (API_HOST, API_PORT)
    httpd = HTTPServer(server_address, DashboardAPIHandler)

    print(f"🚀 Database Sync Dashboard running at:")
    print(f"   http://{API_HOST}:{API_PORT}")
    print(f"   http://localhost:{API_PORT}")
    print(f"\nPress Ctrl+C to stop the server")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
EOF

    chmod +x "${API_DIR}/server.py"
}

# Start dashboard server
start_dashboard_server() {
    log_step "Server Start" "Starting web dashboard server"

    # Check if Python is available
    if ! command -v python3 >/dev/null 2>&1; then
        log_error "Python 3 is required to run the dashboard server"
        return 1
    fi

    # Check if server is already running
    if [[ -n "$DASHBOARD_PID" ]] && kill -0 "$DASHBOARD_PID" 2>/dev/null; then
        log_info "Dashboard server is already running (PID: $DASHBOARD_PID)"
        return 0
    fi

    # Start server in background
    cd "$API_DIR"
    python3 server.py &
    DASHBOARD_PID=$!

    # Wait a moment for server to start
    sleep 2

    # Check if server started successfully
    if kill -0 "$DASHBOARD_PID" 2>/dev/null; then
        log_success "Dashboard server started successfully"
        log_info "PID: $DASHBOARD_PID"
        log_info "URL: http://${DASHBOARD_CONFIG[HOST]}:${DASHBOARD_CONFIG[PORT]}"

        # Save PID to file
        echo "$DASHBOARD_PID" > "${DASHBOARD_DIR}/dashboard.pid"

        return 0
    else
        log_error "Failed to start dashboard server"
        DASHBOARD_PID=""
        return 1
    fi
}

# Stop dashboard server
stop_dashboard_server() {
    log_step "Server Stop" "Stopping web dashboard server"

    local pid_file="${DASHBOARD_DIR}/dashboard.pid"

    # Try to get PID from file if not set
    if [[ -z "$DASHBOARD_PID" && -f "$pid_file" ]]; then
        DASHBOARD_PID=$(cat "$pid_file" 2>/dev/null)
    fi

    if [[ -n "$DASHBOARD_PID" ]] && kill -0 "$DASHBOARD_PID" 2>/dev/null; then
        kill "$DASHBOARD_PID"

        # Wait for graceful shutdown
        local attempts=0
        while kill -0 "$DASHBOARD_PID" 2>/dev/null && [[ $attempts -lt 10 ]]; do
            sleep 1
            ((attempts++))
        done

        # Force kill if still running
        if kill -0 "$DASHBOARD_PID" 2>/dev/null; then
            kill -9 "$DASHBOARD_PID" 2>/dev/null
        fi

        log_success "Dashboard server stopped"
        DASHBOARD_PID=""
        rm -f "$pid_file"
    else
        log_info "Dashboard server is not running"
    fi
}

# Get server status
get_server_status() {
    local pid_file="${DASHBOARD_DIR}/dashboard.pid"

    if [[ -f "$pid_file" ]]; then
        local saved_pid
        saved_pid=$(cat "$pid_file" 2>/dev/null)

        if [[ -n "$saved_pid" ]] && kill -0 "$saved_pid" 2>/dev/null; then
            echo "running:$saved_pid"
            return 0
        else
            rm -f "$pid_file"
        fi
    fi

    echo "stopped"
    return 1
}

# Show dashboard status
show_dashboard_status() {
    log_header "Web Dashboard Status"

    local status
    status=$(get_server_status)
    IFS=':' read -r state pid <<< "$status"

    echo -e "${COLORS[BLUE]}Status:${COLORS[NC]} $state"

    if [[ "$state" == "running" ]]; then
        echo -e "${COLORS[BLUE]}PID:${COLORS[NC]} $pid"
        echo -e "${COLORS[BLUE]}URL:${COLORS[NC]} http://${DASHBOARD_CONFIG[HOST]}:${DASHBOARD_CONFIG[PORT]}"
        echo -e "${COLORS[BLUE]}Access:${COLORS[NC]} http://localhost:${DASHBOARD_CONFIG[PORT]}"
    fi

    echo
    log_info "Dashboard files:"
    log_substep "Web Root: $WEB_ROOT"
    log_substep "API Server: $API_DIR/server.py"
    log_substep "Static Files: $STATIC_DIR"
}

# Command-line interface
case "${1:-}" in
    "init")
        init_web_dashboard
        ;;
    "start")
        init_web_dashboard
        start_dashboard_server
        ;;
    "stop")
        stop_dashboard_server
        ;;
    "restart")
        stop_dashboard_server
        sleep 2
        start_dashboard_server
        ;;
    "status")
        show_dashboard_status
        ;;
    *)
        echo "Usage: $0 {init|start|stop|restart|status}"
        echo ""
        echo "Commands:"
        echo "  init    - Initialize web dashboard files"
        echo "  start   - Start the dashboard server"
        echo "  stop    - Stop the dashboard server"
        echo "  restart - Restart the dashboard server"
        echo "  status  - Show dashboard status"
        exit 1
        ;;
esac

# Export functions for use in other scripts
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    export -f init_web_dashboard start_dashboard_server stop_dashboard_server
    export -f show_dashboard_status get_server_status
fi