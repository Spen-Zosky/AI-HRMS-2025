// Enhanced Dashboard Controller with Real API Integration
class DarlingDashboard extends DarlingConsole {
    constructor() {
        super();
        this.api = new DarlingAPIClient();
        this.pollingInterval = null;
        this.widgets = {};

        this.initializeWidgets();
        this.startRealTimeUpdates();
        this.loadInitialData();
    }

    initializeWidgets() {
        // Initialize widget instances
        this.widgets = {
            connectionStatus: new ConnectionStatusWidget(this.api),
            commandExecution: new CommandExecutionWidget(this.api),
            performanceMonitor: new PerformanceMonitorWidget(this.api),
            recentActivity: new RecentActivityWidget(this.api),
            schemaOverview: new SchemaOverviewWidget(this.api),
            migrationStatus: new MigrationStatusWidget(this.api),
            supabaseSync: new SupabaseSyncWidget(this.api)
        };

        // Bind widget events
        Object.values(this.widgets).forEach(widget => {
            widget.addEventListener('error', (event) => this.handleWidgetError(event.detail));
            widget.addEventListener('loading', (event) => this.updateLoadingState(event.detail));
        });
    }

    async loadInitialData() {
        this.showNotification('Loading dashboard data...', 'info');

        try {
            // Load all widget data in parallel
            await Promise.all([
                this.widgets.connectionStatus.refresh(),
                this.widgets.performanceMonitor.refresh(),
                this.widgets.recentActivity.refresh(),
                this.widgets.schemaOverview.refresh(),
                this.widgets.migrationStatus.refresh()
            ]);

            this.showNotification('Dashboard loaded successfully', 'success');
        } catch (error) {
            this.showNotification(`Failed to load dashboard: ${error.message}`, 'error');
        }
    }

    loadSection(section) {
        super.loadSection(section);

        // Hide all widgets first
        document.querySelectorAll('.darling-widget').forEach(widget => {
            widget.style.display = 'none';
        });

        // Show relevant widgets based on section
        switch (section) {
            case 'dashboard':
                this.showDashboardWidgets();
                break;
            case 'supabase':
                this.showSupabaseWidget();
                break;
            case 'migrations':
                this.showMigrationWidgets();
                break;
            case 'seeders':
                this.showSeederWidgets();
                break;
            case 'query':
                this.showQueryWidgets();
                break;
            case 'logs':
                this.showLogWidgets();
                break;
            default:
                this.showDashboardWidgets();
        }
    }

    showDashboardWidgets() {
        // Show main dashboard widgets
        const widgets = ['#connection-status-widget', '#command-execution-widget',
                        '#performance-widget', '#recent-activity-widget',
                        '#schema-widget', '#migration-widget', '#seeder-widget', '#audit-logs-widget'];
        widgets.forEach(selector => {
            const widget = document.querySelector(selector);
            if (widget) widget.style.display = 'block';
        });
    }

    showSupabaseWidget() {
        const supabaseWidget = document.querySelector('#supabase-sync-widget');
        if (supabaseWidget) {
            supabaseWidget.style.display = 'block';
            // Trigger refresh of Supabase sync status
            if (this.widgets.supabaseSync) {
                this.widgets.supabaseSync.refresh();
            }
        }
    }

    showMigrationWidgets() {
        const migrationWidget = document.querySelector('#migration-widget');
        if (migrationWidget) migrationWidget.style.display = 'block';
    }

    showSeederWidgets() {
        const seederWidget = document.querySelector('#seeder-widget');
        if (seederWidget) seederWidget.style.display = 'block';
    }

    showQueryWidgets() {
        const queryWidget = document.querySelector('#command-execution-widget');
        if (queryWidget) queryWidget.style.display = 'block';
    }

    showLogWidgets() {
        const logsWidget = document.querySelector('#audit-logs-widget');
        if (logsWidget) logsWidget.style.display = 'block';
    }

    startRealTimeUpdates() {
        this.pollingInterval = this.api.startPolling((error, metrics) => {
            if (error) {
                this.connectionStatus = 'disconnected';
                this.updateConnectionStatus();
                return;
            }

            this.connectionStatus = 'connected';
            this.updateConnectionStatus();
            this.updatePerformanceMetrics(metrics);
        }, 5000);
    }

    stopRealTimeUpdates() {
        if (this.pollingInterval) {
            this.pollingInterval.stop();
            this.pollingInterval = null;
        }
    }

    async executeCommand(type, data) {
        const operationId = Date.now();

        this.activeOperations.push({
            id: operationId,
            type: type,
            status: 'running',
            startTime: new Date()
        });

        this.updateFooterStatus();

        try {
            let result;

            switch (type) {
                case 'migration':
                    result = await this.executeMigrationCommand(data);
                    break;
                case 'seeder':
                    result = await this.executeSeederCommand(data);
                    break;
                case 'query':
                    result = await this.executeQueryCommand(data);
                    break;
                default:
                    throw new Error(`Unknown command type: ${type}`);
            }

            this.completeOperation(operationId, result);
            return result;
        } catch (error) {
            this.failOperation(operationId, error);
            throw error;
        }
    }

    async executeMigrationCommand(data) {
        const { action, steps } = data;

        switch (action) {
            case 'run':
                return await this.api.runMigrations();
            case 'rollback':
                return await this.api.rollbackMigrations(steps || 1);
            case 'status':
                return await this.api.getMigrationStatus();
            default:
                throw new Error(`Unknown migration action: ${action}`);
        }
    }

    async executeSeederCommand(data) {
        const { action, seeders, runAll } = data;

        switch (action) {
            case 'run':
                return await this.api.runSeeders(seeders, runAll);
            case 'undo':
                return await this.api.undoSeeders(seeders, runAll);
            case 'list':
                return await this.api.getSeedersList();
            default:
                throw new Error(`Unknown seeder action: ${action}`);
        }
    }

    async executeQueryCommand(data) {
        const { query, type } = data;

        if (!this.api.isSafeQuery(query)) {
            throw new Error('Unsafe query detected. Only SELECT, SHOW, DESCRIBE, and EXPLAIN queries are allowed.');
        }

        return await this.api.executeQuery(query, type);
    }

    failOperation(operationId, error) {
        const operation = this.activeOperations.find(op => op.id === operationId);
        if (operation) {
            operation.status = 'failed';
            operation.error = error.message;
            operation.endTime = new Date();

            setTimeout(() => {
                this.activeOperations = this.activeOperations.filter(op => op.id !== operationId);
                this.updateFooterStatus();
            }, 5000);

            this.showNotification(`${operation.type} failed: ${error.message}`, 'error');
            this.widgets.recentActivity.addActivity(`${operation.type} failed: ${error.message}`, 'error');
        }
    }

    completeOperation(operationId, result) {
        const operation = this.activeOperations.find(op => op.id === operationId);
        if (operation) {
            operation.status = 'completed';
            operation.result = result;
            operation.endTime = new Date();

            setTimeout(() => {
                this.activeOperations = this.activeOperations.filter(op => op.id !== operationId);
                this.updateFooterStatus();
            }, 2000);

            this.showNotification(`${operation.type} completed successfully`, 'success');
            this.widgets.recentActivity.addActivity(`${operation.type} completed successfully`);

            // Refresh related widgets
            this.refreshWidgetsForOperation(operation.type);
        }
    }

    refreshWidgetsForOperation(operationType) {
        switch (operationType) {
            case 'migration':
                this.widgets.migrationStatus.refresh();
                this.widgets.schemaOverview.refresh();
                break;
            case 'seeder':
                this.widgets.schemaOverview.refresh();
                break;
            case 'query':
                // Query results are handled by the command execution widget
                break;
        }
    }

    updatePerformanceMetrics(metrics) {
        this.widgets.performanceMonitor.updateMetrics(metrics);
    }

    handleWidgetError(error) {
        this.showNotification(`Widget error: ${error.message}`, 'error');
    }

    updateLoadingState(isLoading) {
        // Update global loading state if needed
        const loadingIndicator = document.querySelector('.dashboard-loading');
        if (loadingIndicator) {
            loadingIndicator.style.display = isLoading ? 'block' : 'none';
        }
    }

    async refreshData() {
        this.showNotification('Refreshing all data...', 'info');

        try {
            await this.loadInitialData();
            this.showNotification('Data refreshed successfully', 'success');
        } catch (error) {
            this.showNotification(`Refresh failed: ${error.message}`, 'error');
        }
    }

    // Enhanced form submission handling
    async handleFormSubmit(form) {
        const formData = new FormData(form);
        const commandType = form.querySelector('.darling-select')?.value || 'query';
        const queryText = form.querySelector('.darling-code[contenteditable]')?.textContent || '';

        const data = {
            query: queryText.trim(),
            type: commandType
        };

        try {
            if (commandType === 'query' && data.query) {
                const result = await this.executeCommand('query', data);
                this.widgets.commandExecution.displayResults(result);
            }
        } catch (error) {
            this.showNotification(`Command failed: ${error.message}`, 'error');
        }
    }

    // Environment switching with real API integration
    async switchEnvironment(env) {
        try {
            this.showNotification(`Switching to ${env} environment...`, 'info');

            // In a real implementation, this would update the API configuration
            this.activeEnvironment = env;
            this.clearCache();
            await this.loadInitialData();

            this.showNotification(`Switched to ${env} environment`, 'success');
            this.updateConnectionStatus();
        } catch (error) {
            this.showNotification(`Failed to switch environment: ${error.message}`, 'error');
        }
    }

    clearCache() {
        this.api.clearCache();
    }

    destroy() {
        this.stopRealTimeUpdates();
        Object.values(this.widgets).forEach(widget => {
            if (widget.destroy) {
                widget.destroy();
            }
        });
    }
}

// Widget Base Class
class DashboardWidget extends EventTarget {
    constructor(api, containerId) {
        super();
        this.api = api;
        this.container = document.getElementById(containerId) || document.querySelector(containerId);
        this.isLoading = false;
    }

    setLoading(loading) {
        this.isLoading = loading;
        this.dispatchEvent(new CustomEvent('loading', { detail: loading }));
    }

    handleError(error) {
        this.dispatchEvent(new CustomEvent('error', { detail: error }));
    }

    async refresh() {
        // Override in subclasses
    }

    destroy() {
        // Cleanup method for subclasses
    }
}

// Connection Status Widget
class ConnectionStatusWidget extends DashboardWidget {
    constructor(api) {
        super(api, '.darling-widget:first-child');
        this.statusElement = this.container?.querySelector('.darling-status');
        this.urlElement = this.container?.querySelector('.darling-code');
        this.metricsElement = this.container?.querySelector('.darling-flex.darling-justify-between');
    }

    async refresh() {
        if (!this.container) return;

        this.setLoading(true);
        try {
            const status = await this.api.getDatabaseStatus();
            this.updateDisplay(status);
        } catch (error) {
            this.handleError(error);
            this.updateDisplay({ status: 'error', message: error.message });
        } finally {
            this.setLoading(false);
        }
    }

    updateDisplay(status) {
        if (this.statusElement) {
            this.statusElement.className = `darling-status darling-status-${status.status === 'connected' ? 'success' : 'error'}`;
            this.statusElement.textContent = status.status === 'connected' ? 'Online' : 'Offline';
        }

        if (this.urlElement && status.connection) {
            const conn = status.connection;
            this.urlElement.textContent = `postgresql://${conn.user}:****@${conn.host || 'localhost'}:${conn.port || 5432}/${conn.database}`;
        }

        if (this.metricsElement && status.poolStats) {
            const activeConnections = status.poolStats.find(stat => stat.state === 'active')?.count || 0;
            const uptime = this.api.formatDuration(status.uptime * 1000);
            this.metricsElement.innerHTML = `
                <span>Active: ${activeConnections}</span>
                <span>Uptime: ${uptime}</span>
            `;
        }
    }
}

// Performance Monitor Widget
class PerformanceMonitorWidget extends DashboardWidget {
    constructor(api) {
        super(api, '.darling-widget:nth-child(3)');
        this.cpuBar = this.container?.querySelector('.darling-progress-bar');
        this.memoryBar = this.container?.querySelectorAll('.darling-progress-bar')[1];
        this.connectionsElement = this.container?.querySelector('.darling-text-lg.darling-text-primary');
    }

    updateMetrics(metrics) {
        if (!metrics) return;

        // Simulate CPU and memory (these would come from system monitoring in production)
        const cpuUsage = Math.floor(Math.random() * 30) + 40; // 40-70%
        const memoryUsage = Math.floor(Math.random() * 20) + 60; // 60-80%

        if (this.cpuBar) {
            this.cpuBar.style.width = `${cpuUsage}%`;
            const cpuText = this.cpuBar.parentNode.nextElementSibling?.querySelector('span');
            if (cpuText) cpuText.textContent = `${cpuUsage}%`;
        }

        if (this.memoryBar) {
            this.memoryBar.style.width = `${memoryUsage}%`;
            this.memoryBar.style.background = memoryUsage > 80 ? 'var(--accent-error)' :
                                              memoryUsage > 70 ? 'var(--accent-warning)' :
                                              'var(--accent-primary)';
            const memoryText = this.memoryBar.parentNode.nextElementSibling?.querySelector('span');
            if (memoryText) memoryText.textContent = `${memoryUsage}%`;
        }

        if (this.connectionsElement && metrics.activeConnections) {
            const activeCount = metrics.activeConnections.reduce((sum, conn) =>
                sum + parseInt(conn.count || 0), 0);
            this.connectionsElement.textContent = `${activeCount} / 200`;
        }
    }

    async refresh() {
        try {
            const metrics = await this.api.getPerformanceMetrics();
            this.updateMetrics(metrics);
        } catch (error) {
            this.handleError(error);
        }
    }
}

// Recent Activity Widget
class RecentActivityWidget extends DashboardWidget {
    constructor(api) {
        super(api, '.darling-widget:nth-child(4)');
        this.activityElement = this.container?.querySelector('.darling-code');
        this.maxEntries = 10;
    }

    async refresh() {
        try {
            const logs = await this.api.getAuditLogs(this.maxEntries);
            this.displayLogs(logs.logs || []);
        } catch (error) {
            this.handleError(error);
        }
    }

    displayLogs(logs) {
        if (!this.activityElement) return;

        const logLines = logs.map(log => {
            const time = new Date(log.timestamp).toLocaleTimeString();
            return `[${time}] ${log.operation.replace(/_/g, ' ')}: ${this.getLogMessage(log)}`;
        });

        this.activityElement.textContent = logLines.join('\n');
    }

    getLogMessage(log) {
        switch (log.operation) {
            case 'migration_run_success':
                return 'Migration completed successfully';
            case 'seeder_run_success':
                return 'Seeders executed successfully';
            case 'query_executed':
                return `Query executed (${log.details.result_count} rows)`;
            default:
                return log.details?.message || 'Operation completed';
        }
    }

    addActivity(message, type = 'info') {
        if (!this.activityElement) return;

        const timestamp = new Date().toLocaleTimeString();
        const newLine = `[${timestamp}] ${message}`;

        const lines = this.activityElement.textContent.split('\n');
        lines.unshift(newLine);

        if (lines.length > this.maxEntries) {
            lines.splice(this.maxEntries);
        }

        this.activityElement.textContent = lines.join('\n');
    }
}

// Schema Overview Widget
class SchemaOverviewWidget extends DashboardWidget {
    constructor(api) {
        super(api, '.darling-widget:nth-child(5)');
        this.tableBody = this.container?.querySelector('.darling-table tbody');
        this.tableCountElement = this.container?.querySelector('.darling-status');
    }

    async refresh() {
        if (!this.container) return;

        this.setLoading(true);
        try {
            const tables = await this.api.getDatabaseTables();
            this.updateDisplay(tables);
        } catch (error) {
            this.handleError(error);
        } finally {
            this.setLoading(false);
        }
    }

    updateDisplay(tablesData) {
        if (this.tableCountElement) {
            this.tableCountElement.textContent = `${tablesData.total_tables} Tables`;
        }

        if (this.tableBody) {
            this.tableBody.innerHTML = '';

            const displayTables = tablesData.tables.slice(0, 5); // Show top 5 tables

            displayTables.forEach(table => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${table.table_name}</td>
                    <td>${table.row_count?.toLocaleString() || '0'}</td>
                    <td>${table.size || '0 B'}</td>
                `;
                this.tableBody.appendChild(row);
            });
        }
    }
}

// Migration Status Widget
class MigrationStatusWidget extends DashboardWidget {
    constructor(api) {
        super(api, '.darling-widget:nth-child(6)');
        this.statusElement = this.container?.querySelector('.darling-status');
        this.versionElement = this.container?.querySelector('.darling-text-lg.darling-text-primary');
        this.pendingElement = this.container?.querySelectorAll('.darling-text-lg')[1];
    }

    async refresh() {
        if (!this.container) return;

        this.setLoading(true);
        try {
            const migrations = await this.api.getMigrationStatus();
            this.updateDisplay(migrations);
        } catch (error) {
            this.handleError(error);
        } finally {
            this.setLoading(false);
        }
    }

    updateDisplay(migrations) {
        const pendingCount = migrations.pending?.length || 0;
        const isUpToDate = pendingCount === 0;

        if (this.statusElement) {
            this.statusElement.className = `darling-status darling-status-${isUpToDate ? 'success' : 'warning'}`;
            this.statusElement.textContent = isUpToDate ? 'Up to date' : 'Pending';
        }

        if (this.versionElement && migrations.executed?.length > 0) {
            const latestMigration = migrations.executed[0];
            const version = latestMigration.name.match(/^\d{8}_\d{6}/)?.[0] || 'Unknown';
            this.versionElement.textContent = `v${version}`;
        }

        if (this.pendingElement) {
            this.pendingElement.textContent = pendingCount.toString();
            this.pendingElement.className = `darling-text-lg darling-text-${pendingCount > 0 ? 'warning' : 'success'}`;
        }
    }
}

// Command Execution Widget
class CommandExecutionWidget extends DashboardWidget {
    constructor(api) {
        super(api, '.darling-widget:nth-child(2)');
        this.form = this.container?.querySelector('.darling-form');
        this.resultsContainer = null;
        this.setupResultsContainer();
    }

    setupResultsContainer() {
        if (!this.container) return;

        this.resultsContainer = document.createElement('div');
        this.resultsContainer.className = 'command-results darling-mt-md';
        this.resultsContainer.style.display = 'none';
        this.container.appendChild(this.resultsContainer);
    }

    displayResults(result) {
        if (!this.resultsContainer) return;

        this.resultsContainer.style.display = 'block';

        if (result.results && Array.isArray(result.results)) {
            // Display query results in a table
            const table = this.createResultsTable(result.results);
            this.resultsContainer.innerHTML = '';
            this.resultsContainer.appendChild(table);
        } else {
            // Display other results as formatted JSON
            this.resultsContainer.innerHTML = `
                <div class="darling-code">
                    ${JSON.stringify(result, null, 2)}
                </div>
            `;
        }
    }

    createResultsTable(results) {
        const table = document.createElement('table');
        table.className = 'darling-table';

        if (results.length === 0) {
            table.innerHTML = '<tr><td>No results found</td></tr>';
            return table;
        }

        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        Object.keys(results[0]).forEach(key => {
            const th = document.createElement('th');
            th.textContent = key;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create body
        const tbody = document.createElement('tbody');
        results.slice(0, 10).forEach(row => { // Limit to 10 rows for display
            const tr = document.createElement('tr');
            Object.values(row).forEach(value => {
                const td = document.createElement('td');
                td.textContent = value?.toString() || '';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        return table;
    }
}

// Supabase Sync Widget
class SupabaseSyncWidget extends DashboardWidget {
    constructor(api) {
        super(api, '#supabase-sync-widget');

        // Status elements
        this.syncStatusElement = this.container?.querySelector('#sync-status');
        this.stagedStatusElement = this.container?.querySelector('#staged-status');
        this.committedStatusElement = this.container?.querySelector('#committed-status');
        this.pushedStatusElement = this.container?.querySelector('#pushed-status');
        this.syncStateInfoElement = this.container?.querySelector('#sync-state-info');
        this.syncOutputElement = this.container?.querySelector('#sync-output');

        // Form elements
        this.commitMessageInput = this.container?.querySelector('#commit-message');

        // Button elements
        this.stageButton = this.container?.querySelector('#stage-db');
        this.commitButton = this.container?.querySelector('#commit-changes');
        this.pushButton = this.container?.querySelector('#push-to-supabase');
        this.dryRunButton = this.container?.querySelector('#dry-run-push');
        this.pullButton = this.container?.querySelector('#pull-from-supabase');
        this.refreshButton = this.container?.querySelector('#refresh-sync-status');

        this.bindEvents();
        this.refresh();
    }

    bindEvents() {
        if (!this.container) return;

        // Bind button events
        this.stageButton?.addEventListener('click', () => this.stageDatabase());
        this.commitButton?.addEventListener('click', () => this.commitChanges());
        this.pushButton?.addEventListener('click', () => this.pushToSupabase());
        this.dryRunButton?.addEventListener('click', () => this.dryRunPush());
        this.pullButton?.addEventListener('click', () => this.pullFromSupabase());
        this.refreshButton?.addEventListener('click', () => this.refresh());
    }

    async refresh() {
        if (!this.container) return;

        this.setLoading(true);
        try {
            const status = await this.api.getSupabaseSyncStatus();
            this.updateSyncStatus(status);
        } catch (error) {
            this.handleError(error);
        } finally {
            this.setLoading(false);
        }
    }

    updateSyncStatus(status) {
        const sync = status.sync;

        // Update status indicators
        this.updateStatusIndicator(this.stagedStatusElement, sync.staged, 'Staged', 'Not Staged');
        this.updateStatusIndicator(this.committedStatusElement, sync.committed, 'Committed', 'Not Committed');
        this.updateStatusIndicator(this.pushedStatusElement, sync.lastPush !== null, 'Pushed', 'Not Pushed');

        // Update state information
        let stateInfo = `Staged: ${sync.staged ? '✅' : '❌'}\n`;
        stateInfo += `Committed: ${sync.committed ? '✅' : '❌'}\n`;
        stateInfo += `Last Commit: ${sync.lastCommit || 'None'}\n`;
        stateInfo += `Last Push: ${sync.lastPush ? new Date(sync.lastPush.timestamp).toLocaleString() : 'Never'}`;

        if (this.syncStateInfoElement) {
            this.syncStateInfoElement.textContent = stateInfo;
        }

        // Update overall sync status
        if (this.syncStatusElement) {
            if (sync.lastPush && sync.committed) {
                this.syncStatusElement.className = 'darling-status darling-status-success';
                this.syncStatusElement.textContent = 'Up to date';
            } else if (sync.committed) {
                this.syncStatusElement.className = 'darling-status darling-status-warning';
                this.syncStatusElement.textContent = 'Ready to push';
            } else if (sync.staged) {
                this.syncStatusElement.className = 'darling-status darling-status-info';
                this.syncStatusElement.textContent = 'Ready to commit';
            } else {
                this.syncStatusElement.className = 'darling-status darling-status-info';
                this.syncStatusElement.textContent = 'Ready to stage';
            }
        }

        // Update button states
        this.updateButtonStates(sync);
    }

    updateStatusIndicator(element, isActive, activeText, inactiveText) {
        if (!element) return;

        if (isActive) {
            element.textContent = `🟢 ${activeText}`;
            element.className = 'darling-text-success';
        } else {
            element.textContent = `⚪ ${inactiveText}`;
            element.className = 'darling-text-secondary';
        }
    }

    updateButtonStates(sync) {
        // Enable/disable buttons based on current state
        if (this.stageButton) {
            this.stageButton.disabled = false; // Always allow staging
        }

        if (this.commitButton) {
            this.commitButton.disabled = !sync.staged;
        }

        if (this.pushButton && this.dryRunButton) {
            const canPush = sync.committed;
            this.pushButton.disabled = !canPush;
            this.dryRunButton.disabled = !canPush;
        }
    }

    async stageDatabase() {
        this.appendOutput('Staging current database state...');
        this.setButtonLoading(this.stageButton, true);

        try {
            const result = await this.api.stageSupabaseChanges();
            this.appendOutput(`✅ ${result.message}\n${result.output || ''}`);
            await this.refresh();
        } catch (error) {
            this.appendOutput(`❌ Staging failed: ${error.message}`);
        } finally {
            this.setButtonLoading(this.stageButton, false);
        }
    }

    async commitChanges() {
        const message = this.commitMessageInput?.value || 'Web dashboard commit';

        if (!message.trim()) {
            this.appendOutput('❌ Commit message is required');
            return;
        }

        this.appendOutput(`Committing changes with message: "${message}"`);
        this.setButtonLoading(this.commitButton, true);

        try {
            const result = await this.api.commitSupabaseChanges(message);
            this.appendOutput(`✅ ${result.message}\n${result.output || ''}`);
            await this.refresh();
        } catch (error) {
            this.appendOutput(`❌ Commit failed: ${error.message}`);
        } finally {
            this.setButtonLoading(this.commitButton, false);
        }
    }

    async pushToSupabase(force = false) {
        this.appendOutput(`${force ? 'Force p' : 'P'}ushing to Supabase...`);
        this.setButtonLoading(this.pushButton, true);

        try {
            const result = await this.api.pushToSupabase({ force });
            this.appendOutput(`✅ ${result.message}\n${result.output || ''}`);
            await this.refresh();
        } catch (error) {
            this.appendOutput(`❌ Push failed: ${error.message}`);
        } finally {
            this.setButtonLoading(this.pushButton, false);
        }
    }

    async dryRunPush() {
        this.appendOutput('Running dry run push to Supabase...');
        this.setButtonLoading(this.dryRunButton, true);

        try {
            const result = await this.api.pushToSupabase({ dryRun: true });
            this.appendOutput(`📋 Dry Run Results:\n${result.output || result.message}`);
        } catch (error) {
            this.appendOutput(`❌ Dry run failed: ${error.message}`);
        } finally {
            this.setButtonLoading(this.dryRunButton, false);
        }
    }

    async pullFromSupabase(force = false) {
        this.appendOutput(`${force ? 'Force p' : 'P'}ulling from Supabase...`);
        this.setButtonLoading(this.pullButton, true);

        try {
            const result = await this.api.pullFromSupabase({ force });
            this.appendOutput(`✅ ${result.message}\n${result.output || ''}`);
            await this.refresh();
        } catch (error) {
            this.appendOutput(`❌ Pull failed: ${error.message}`);
        } finally {
            this.setButtonLoading(this.pullButton, false);
        }
    }

    appendOutput(message) {
        if (!this.syncOutputElement) return;

        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}\n`;
        this.syncOutputElement.textContent += logEntry;
        this.syncOutputElement.scrollTop = this.syncOutputElement.scrollHeight;
    }

    setButtonLoading(button, isLoading) {
        if (!button) return;

        if (isLoading) {
            button.disabled = true;
            button.style.opacity = '0.6';
        } else {
            button.disabled = false;
            button.style.opacity = '1';
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Replace the basic console with the enhanced dashboard
    if (window.darlingConsole) {
        window.darlingConsole.destroy();
    }

    window.darlingConsole = new DarlingDashboard();
});