// Darling Theme Configuration

const DarlingConfig = {
    // Theme settings
    theme: {
        name: 'Darling Dark Console',
        version: '1.0.0',
        author: 'AI-HRMS Team',
        darkMode: true,
        compactMode: false
    },

    // API Configuration
    api: {
        baseURL: 'http://localhost:3001/api',
        timeout: 30000,
        retryAttempts: 3
    },

    // Database environments
    environments: {
        development: {
            name: 'Development',
            color: '#3b82f6',
            description: 'Development environment'
        },
        staging: {
            name: 'Staging',
            color: '#f59e0b',
            description: 'Pre-production testing environment'
        },
        production: {
            name: 'Production',
            color: '#ef4444',
            description: 'Live production database'
        },
        local: {
            name: 'Local',
            color: '#10b981',
            description: 'Local development database'
        }
    },

    // Command categories
    commands: {
        database: {
            label: 'Database Operations',
            icon: 'database',
            items: [
                { id: 'dashboard', label: 'Overview', icon: 'calendar' },
                { id: 'query', label: 'Execute Query', icon: 'file-text' },
                { id: 'migrations', label: 'Migrations', icon: 'dollar-sign' },
                { id: 'seeders', label: 'Seeders', icon: 'circle' }
            ]
        }
    },

    // Widget configurations
    widgets: {
        connectionStatus: {
            title: 'Connection Status',
            refreshInterval: 10000,
            showLatency: true,
            showPoolSize: true
        },
        performance: {
            title: 'Performance Monitor',
            refreshInterval: 5000,
            metrics: ['cpu', 'memory', 'connections'],
            thresholds: {
                cpu: { warning: 70, critical: 90 },
                memory: { warning: 80, critical: 95 },
                connections: { warning: 80, critical: 95 }
            }
        },
        activity: {
            title: 'Recent Activity',
            maxEntries: 10,
            autoRefresh: true
        },
        schema: {
            title: 'Schema Overview',
            showRowCounts: true,
            showSizes: true,
            maxTables: 10
        }
    },

    // Notification settings
    notifications: {
        position: 'top-right',
        timeout: 3000,
        showIcons: true,
        maxVisible: 3
    },

    // Console settings
    console: {
        historySize: 100,
        autoComplete: true,
        syntaxHighlighting: true,
        defaultQuery: 'SELECT 1;'
    },

    // Security settings
    security: {
        confirmDestructiveActions: true,
        showPasswordFields: false,
        sessionTimeout: 1800000 // 30 minutes
    }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DarlingConfig;
} else {
    window.DarlingConfig = DarlingConfig;
}