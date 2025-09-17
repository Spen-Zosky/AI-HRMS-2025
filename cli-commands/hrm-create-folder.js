#!/usr/bin/env node

/**
 * CLI Slash Command: /hrm-create-folder
 *
 * Usage: /hrm-create-folder John Doe [email]
 * Alternative: node cli-commands/hrm-create-folder.js John Doe [email]
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
    baseUrl: process.env.HRMS_API_URL || 'http://localhost:3000',
    tokenFile: path.join(__dirname, '../.hrms-token'),
    credentialsFile: path.join(__dirname, '../.hrms-credentials')
};

// ANSI Colors for better CLI output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

function showUsage() {
    console.log(`
${colorize('📋 HRM Create Folder - CLI Command', 'cyan')}
${colorize('═'.repeat(40), 'blue')}

${colorize('Usage:', 'yellow')}
  /hrm-create-folder <name> <surname> [email]
  node cli-commands/hrm-create-folder.js <name> <surname> [email]

${colorize('Examples:', 'yellow')}
  /hrm-create-folder Maria Bianchi
  /hrm-create-folder John Doe john.doe@company.org

${colorize('Arguments:', 'yellow')}
  name     ${colorize('(required)', 'red')} First name of the employee
  surname  ${colorize('(required)', 'red')} Last name of the employee
  email    ${colorize('(optional)', 'green')} Email for exact matching

${colorize('Setup:', 'yellow')}
  Run: ${colorize('/hrm-setup', 'cyan')} to configure credentials
  Or create ~/.hrms-credentials with your login details

${colorize('Output:', 'yellow')}
  Creates: /AI-HRMS-2025/[Company]/reports/[name]_[surname]_folder_[timestamp].md
`);
}

async function loadToken() {
    try {
        const token = await fs.readFile(CONFIG.tokenFile, 'utf8');
        return token.trim();
    } catch (error) {
        return null;
    }
}

async function saveToken(token) {
    await fs.writeFile(CONFIG.tokenFile, token, 'utf8');
}

async function loadCredentials() {
    try {
        const credentials = await fs.readFile(CONFIG.credentialsFile, 'utf8');
        return JSON.parse(credentials);
    } catch (error) {
        return null;
    }
}

async function authenticate() {
    console.log(colorize('🔐 Authenticating...', 'yellow'));

    const credentials = await loadCredentials();
    if (!credentials) {
        console.error(colorize('❌ No credentials found. Run /hrm-setup first.', 'red'));
        console.log(colorize('💡 Or create .hrms-credentials with: {"email": "hr@company.org", "password": "Welcome123!"}', 'cyan'));
        process.exit(1);
    }

    try {
        const response = await axios.post(`${CONFIG.baseUrl}/api/auth/login`, credentials);
        const token = response.data.token;

        if (!token) {
            throw new Error('No token received from login');
        }

        await saveToken(token);
        console.log(colorize('✅ Authentication successful', 'green'));
        return token;

    } catch (error) {
        console.error(colorize('❌ Authentication failed:', 'red'), error.response?.data?.error || error.message);
        process.exit(1);
    }
}

async function getValidToken() {
    let token = await loadToken();

    if (!token) {
        return await authenticate();
    }

    // Test if token is still valid
    try {
        await axios.get(`${CONFIG.baseUrl}/api/reports/templates`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return token;
    } catch (error) {
        if (error.response?.status === 401) {
            console.log(colorize('🔄 Token expired, re-authenticating...', 'yellow'));
            return await authenticate();
        }
        throw error;
    }
}

async function createUserFolder(name, surname, email = null) {
    console.log(colorize(`\n📂 Generating User Folder for: ${name} ${surname}`, 'cyan'));
    if (email) {
        console.log(colorize(`📧 Using email: ${email}`, 'blue'));
    }

    try {
        const token = await getValidToken();

        const requestBody = { name, surname };
        if (email) {
            requestBody.email = email;
        }

        const response = await axios.post(
            `${CONFIG.baseUrl}/api/reports/hrm-create-folder`,
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data.success) {
            const details = response.data.details;

            console.log(colorize('\n✅ Report Generated Successfully!', 'green'));
            console.log(colorize('═'.repeat(40), 'blue'));
            console.log(`${colorize('👤 User:', 'yellow')} ${details.user.name}`);
            console.log(`${colorize('📧 Email:', 'yellow')} ${details.user.email}`);
            console.log(`${colorize('🏢 Organization:', 'yellow')} ${details.user.organization}`);
            console.log(`${colorize('📁 File:', 'yellow')} ${details.file.name}`);
            console.log(`${colorize('📂 Directory:', 'yellow')} ${details.file.directory}`);
            console.log(`${colorize('📏 Size:', 'yellow')} ${(details.file.size / 1024).toFixed(1)} KB`);
            console.log(`${colorize('⏰ Generated:', 'yellow')} ${new Date(details.timestamp).toLocaleString()}`);
            console.log(`${colorize('👨‍💼 By:', 'yellow')} ${details.generatedBy}`);

            console.log(colorize('\n🎯 File Location:', 'cyan'));
            console.log(colorize(details.file.path, 'bright'));

        } else {
            console.error(colorize('❌ Unexpected response format', 'red'));
            console.log(JSON.stringify(response.data, null, 2));
        }

    } catch (error) {
        if (error.response) {
            const errorData = error.response.data;
            console.error(colorize(`❌ Error: ${errorData.error}`, 'red'));

            if (errorData.code) {
                console.log(colorize(`🔍 Code: ${errorData.code}`, 'yellow'));
            }

            if (errorData.suggestion) {
                console.log(colorize(`💡 Suggestion: ${errorData.suggestion}`, 'cyan'));
            }

            if (errorData.users) {
                console.log(colorize('\n👥 Available users with similar names:', 'cyan'));
                errorData.users.forEach((user, index) => {
                    console.log(`  ${index + 1}. ${colorize(user.fullName, 'bright')} (${user.email}) at ${user.organization}`);
                });
                console.log(colorize('\n💡 Try again with specific email address', 'cyan'));
            }

            if (errorData.usage) {
                console.log(colorize(`\n📋 Usage: ${errorData.usage}`, 'blue'));
            }
        } else {
            console.error(colorize('❌ Network error:', 'red'), error.message);
        }
        process.exit(1);
    }
}

// Main CLI execution
async function main() {
    const args = process.argv.slice(2);

    // Handle help flags
    if (args.includes('--help') || args.includes('-h') || args.length === 0) {
        showUsage();
        process.exit(0);
    }

    // Validate arguments
    if (args.length < 2) {
        console.error(colorize('❌ Error: Name and surname are required', 'red'));
        showUsage();
        process.exit(1);
    }

    const [name, surname, email] = args;

    // Validate name and surname
    if (!name || !surname) {
        console.error(colorize('❌ Error: Both name and surname must be provided', 'red'));
        showUsage();
        process.exit(1);
    }

    // Show welcome message
    console.log(colorize('🚀 HRM Create Folder CLI', 'cyan'));
    console.log(colorize('═'.repeat(30), 'blue'));

    await createUserFolder(name, surname, email);
}

// Handle CLI execution
if (require.main === module) {
    main().catch((error) => {
        console.error(colorize('💥 Fatal error:', 'red'), error.message);
        process.exit(1);
    });
}

module.exports = { createUserFolder };