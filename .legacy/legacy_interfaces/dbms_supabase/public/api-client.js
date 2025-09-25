// API Client for Darling DBMS Dashboard
class DarlingAPIClient {
    constructor(baseURL = 'http://localhost:3001/api') {
        this.baseURL = baseURL;
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 seconds
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const requestOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, requestOptions);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // GET request with caching
    async get(endpoint, useCache = true) {
        const cacheKey = `GET:${endpoint}`;

        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        const data = await this.request(endpoint);

        if (useCache) {
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
        }

        return data;
    }

    // POST request
    async post(endpoint, body = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    // PUT request
    async put(endpoint, body = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // Clear cache
    clearCache(pattern = null) {
        if (pattern) {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    // Database API methods
    async getDatabaseStatus() {
        return this.get('/database/status');
    }

    async getDatabaseTables() {
        return this.get('/database/tables');
    }

    async executeQuery(query, type = 'SELECT') {
        return this.post('/database/query', { query, type });
    }

    async getDatabaseSchema() {
        return this.get('/database/schema');
    }

    // Migration API methods
    async getMigrationStatus() {
        return this.get('/migrations/status', false); // Don't cache migration status
    }

    async runMigrations() {
        this.clearCache('migrations');
        return this.post('/migrations/run');
    }

    async rollbackMigrations(steps = 1) {
        this.clearCache('migrations');
        return this.post('/migrations/rollback', { steps });
    }

    // Seeder API methods
    async getSeedersList() {
        return this.get('/seeders/list');
    }

    async runSeeders(seeders = [], runAll = false) {
        this.clearCache('seeders');
        return this.post('/seeders/run', { seeders, runAll });
    }

    async undoSeeders(seeders = [], undoAll = false) {
        this.clearCache('seeders');
        return this.post('/seeders/undo', { seeders, undoAll });
    }

    // Environment API methods
    async getEnvironments() {
        return this.get('/environments');
    }

    // Audit logs
    async getAuditLogs(limit = 50, operation = null) {
        const query = new URLSearchParams({ limit });
        if (operation) query.append('operation', operation);
        return this.get(`/logs/audit?${query}`);
    }

    // Health check
    async getHealth() {
        return this.get('/health');
    }

    // Utility methods for the dashboard

    // Format database size
    formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Format timestamp
    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString();
    }

    // Format duration
    formatDuration(milliseconds) {
        if (milliseconds < 1000) return `${milliseconds}ms`;
        return `${(milliseconds / 1000).toFixed(2)}s`;
    }

    // Validate SQL query safety
    isSafeQuery(query) {
        const dangerous = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'TRUNCATE', 'ALTER', 'CREATE'];
        const queryUpper = query.trim().toUpperCase();
        return !dangerous.some(keyword => queryUpper.startsWith(keyword));
    }

    // Parse seeder name from filename
    parseSeederName(filename) {
        return filename.replace(/^\d+\-/, '').replace(/\.js$/, '').replace(/-/g, ' ');
    }

    // Get seeder category from name
    getSeederCategory(seederName) {
        if (seederName.includes('skill')) return 'Skills';
        if (seederName.includes('career')) return 'Career';
        if (seederName.includes('training')) return 'Training';
        if (seederName.includes('compliance')) return 'Compliance';
        if (seederName.includes('organization')) return 'Organization';
        return 'General';
    }

    // Connection status checker
    async checkConnection() {
        try {
            const health = await this.getHealth();
            return health.status === 'healthy';
        } catch (error) {
            return false;
        }
    }

    // Batch operations
    async batchExecute(operations) {
        const results = [];
        for (const operation of operations) {
            try {
                const result = await this[operation.method](...operation.args);
                results.push({ success: true, data: result });
            } catch (error) {
                results.push({ success: false, error: error.message });
            }
        }
        return results;
    }

    // Performance monitoring
    async getPerformanceMetrics() {
        try {
            const [status, tables] = await Promise.all([
                this.getDatabaseStatus(),
                this.getDatabaseTables()
            ]);

            const totalRows = tables.tables.reduce((sum, table) =>
                sum + parseInt(table.row_count || 0), 0);

            return {
                connectionStatus: status.status,
                activeConnections: status.poolStats || [],
                totalTables: tables.total_tables,
                totalRows,
                uptime: status.uptime,
                lastUpdated: Date.now()
            };
        } catch (error) {
            throw new Error(`Failed to get performance metrics: ${error.message}`);
        }
    }

    // Real-time updates using polling
    startPolling(callback, interval = 5000) {
        const pollId = setInterval(async () => {
            try {
                const metrics = await this.getPerformanceMetrics();
                callback(null, metrics);
            } catch (error) {
                callback(error, null);
            }
        }, interval);

        return {
            stop: () => clearInterval(pollId),
            id: pollId
        };
    }

    // Supabase Synchronization Methods

    // Get Supabase sync status
    async getSupabaseSyncStatus() {
        return await this.get('/supabase/status', false);
    }

    // Stage current database state
    async stageSupabaseChanges() {
        return await this.post('/supabase/stage', {});
    }

    // Commit staged changes
    async commitSupabaseChanges(message) {
        return await this.post('/supabase/commit', { message });
    }

    // Push to Supabase
    async pushToSupabase(options = {}) {
        const { dryRun = false, force = false } = options;
        return await this.post('/supabase/push', { dryRun, force });
    }

    // Pull from Supabase
    async pullFromSupabase(options = {}) {
        const { force = false } = options;
        return await this.post('/supabase/pull', { force });
    }
}

// Export for use in modules or direct browser usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DarlingAPIClient;
} else {
    window.DarlingAPIClient = DarlingAPIClient;
}