// SysAdmin Utility Functions
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class SysAdminHelper {
    constructor() {
        this.credentialsPath = path.join(__dirname, '../../.sysadmin.env');
        this.credentials = null;
        this.loadCredentials();
    }

    // Load credentials from .sysadmin.env
    loadCredentials() {
        try {
            if (fs.existsSync(this.credentialsPath)) {
                const envContent = fs.readFileSync(this.credentialsPath, 'utf-8');
                const credentials = {};

                envContent.split('\n').forEach(line => {
                    if (line && !line.startsWith('#') && line.includes('=')) {
                        const [key, ...valueParts] = line.split('=');
                        credentials[key.trim()] = valueParts.join('=').trim();
                    }
                });

                this.credentials = credentials;
                return credentials;
            }
        } catch (error) {
            console.error('Failed to load SysAdmin credentials:', error.message);
        }
        return null;
    }

    // Get permanent token
    getToken() {
        return this.credentials?.SYSADMIN_TOKEN || null;
    }

    // Get auth headers for API calls
    getAuthHeaders() {
        const token = this.getToken();
        if (!token) return {};

        return {
            'Authorization': `Bearer ${token}`,
            'X-SysAdmin-Auth': 'true',
            'X-Permanent-Token': 'true'
        };
    }

    // Make authenticated API call as SysAdmin
    async apiCall(method, endpoint, data = null, options = {}) {
        const baseURL = this.credentials?.SYSADMIN_API_BASE_URL || 'http://localhost:3000';
        const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;

        try {
            const response = await axios({
                method,
                url,
                data,
                headers: {
                    ...this.getAuthHeaders(),
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            return response.data;
        } catch (error) {
            console.error(`SysAdmin API call failed: ${method} ${url}`, error.message);
            throw error;
        }
    }

    // Quick access methods
    async get(endpoint, options) {
        return this.apiCall('GET', endpoint, null, options);
    }

    async post(endpoint, data, options) {
        return this.apiCall('POST', endpoint, data, options);
    }

    async put(endpoint, data, options) {
        return this.apiCall('PUT', endpoint, data, options);
    }

    async delete(endpoint, options) {
        return this.apiCall('DELETE', endpoint, null, options);
    }

    // Get SysAdmin info
    getSysAdminInfo() {
        if (!this.credentials) return null;

        return {
            id: this.credentials.SYSADMIN_ID,
            email: this.credentials.SYSADMIN_EMAIL,
            name: this.credentials.SYSADMIN_NAME,
            role: this.credentials.SYSADMIN_ROLE,
            isPermanentAuth: true,
            tokenExpires: this.credentials.SYSADMIN_TOKEN_EXPIRES,
            hasUnrestrictedAccess: true
        };
    }

    // Verify SysAdmin authentication
    async verify() {
        try {
            const response = await this.get('/api/auth/me');
            console.log('✅ SysAdmin authentication verified');
            return response;
        } catch (error) {
            console.error('❌ SysAdmin authentication failed');
            return null;
        }
    }

    // Express middleware for automatic SysAdmin auth
    middleware() {
        return (req, res, next) => {
            // Check if SysAdmin override is requested
            const sysAdminOverride = req.headers['x-sysadmin-override'] === 'true';

            if (sysAdminOverride && this.credentials) {
                // Inject SysAdmin token
                req.headers['authorization'] = `Bearer ${this.getToken()}`;
                req.isSysAdminOverride = true;
            }

            next();
        };
    }

    // Log SysAdmin action
    logAction(action, details) {
        const timestamp = new Date().toISOString();
        console.log(`[SYSADMIN] ${timestamp} - ${action}`, details || '');

        // Could be extended to write to audit log file
        const logEntry = {
            timestamp,
            action,
            details,
            sysadmin: this.getSysAdminInfo()
        };

        return logEntry;
    }
}

// Export singleton instance
module.exports = new SysAdminHelper();