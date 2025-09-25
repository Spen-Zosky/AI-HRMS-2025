// Base Console Controller (will be extended by dashboard.js)
class DarlingConsole {
    constructor() {
        this.activeEnvironment = 'development';
        this.connectionStatus = 'disconnected';
        this.activeOperations = [];

        this.bindBasicEvents();
    }

    bindBasicEvents() {
        // Environment selector
        const envSelect = document.getElementById('environment-select');
        if (envSelect) {
            envSelect.addEventListener('change', (e) => {
                this.switchEnvironment(e.target.value);
            });
        }

        // Command items
        document.querySelectorAll('.darling-command-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleCommandClick(e.currentTarget);
            });
        });

        // Navigation items
        document.querySelectorAll('.darling-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavClick(e.currentTarget);
            });
        });

        // Mobile sidebar toggle
        this.setupMobileNavigation();
    }

    switchEnvironment(env) {
        this.activeEnvironment = env;
        this.showNotification(`Switched to ${env} environment`, 'info');
        this.updateConnectionStatus();
    }

    handleCommandClick(item) {
        // Remove active state from all items
        document.querySelectorAll('.darling-command-item').forEach(el => {
            el.classList.remove('active');
        });

        // Add active state to clicked item
        item.classList.add('active');

        // Get command type
        const section = item.getAttribute('data-section');
        if (section) {
            this.loadSection(section);
        }
    }

    handleNavClick(item) {
        // Remove active state from all nav items
        document.querySelectorAll('.darling-nav-item').forEach(el => {
            el.classList.remove('active');
        });

        // Add active state to clicked item
        item.classList.add('active');

        // Get section
        const section = item.getAttribute('href').replace('#', '');
        this.loadSection(section);
    }

    loadSection(section) {
        this.showNotification(`Loading ${section} section...`, 'info');
        console.log(`Loading section: ${section}`);
    }

    updateConnectionStatus() {
        const statusElements = document.querySelectorAll('.darling-connection-status span');
        const dotElements = document.querySelectorAll('.darling-connection-dot');

        statusElements.forEach(el => {
            if (el) {
                el.textContent = `Connected to ${this.activeEnvironment.charAt(0).toUpperCase() + this.activeEnvironment.slice(1)}`;
            }
        });

        dotElements.forEach(dot => {
            dot.classList.toggle('disconnected', this.connectionStatus !== 'connected');
        });
    }

    updateFooterStatus() {
        const activeOpsElement = document.getElementById('active-operations');
        if (activeOpsElement) {
            activeOpsElement.textContent = `Active operations: ${this.activeOperations.length}`;
        }
    }

    setupMobileNavigation() {
        // Mobile-specific setup
        if (window.innerWidth <= 1024) {
            // Add mobile menu toggle functionality
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `darling-notification darling-notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-card);
            border: 1px solid var(--border-primary);
            border-radius: 0.375rem;
            padding: var(--spacing-md);
            color: var(--text-primary);
            font-size: 0.875rem;
            box-shadow: var(--shadow-lg);
            z-index: 9999;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        // Add type-specific styling
        if (type === 'success') {
            notification.style.borderColor = 'var(--accent-success)';
        } else if (type === 'error') {
            notification.style.borderColor = 'var(--accent-error)';
        } else if (type === 'warning') {
            notification.style.borderColor = 'var(--accent-warning)';
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    destroy() {
        // Cleanup method
        if (this.pollingInterval) {
            this.pollingInterval.stop();
        }
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth <= 1024) {
        document.body.classList.add('mobile');
    } else {
        document.body.classList.remove('mobile');
    }
});

// Initialize basic console if not overridden
document.addEventListener('DOMContentLoaded', () => {
    if (!window.darlingConsole) {
        window.darlingConsole = new DarlingConsole();
    }
});