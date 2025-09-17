#!/usr/bin/env node

/**
 * CLI Setup Script: /hrm-setup
 *
 * Sets up credentials and shell aliases for HRM CLI commands
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function setupCredentials() {
    console.log(colorize('🔐 HRM CLI Setup - Credentials Configuration', 'cyan'));
    console.log(colorize('═'.repeat(50), 'blue'));

    const email = await question(colorize('📧 Enter your email (e.g., hr@banknova.org): ', 'yellow'));
    const password = await question(colorize('🔑 Enter your password: ', 'yellow'));

    const credentials = { email: email.trim(), password: password.trim() };

    const credentialsFile = path.join(__dirname, '../.hrms-credentials');
    await fs.writeFile(credentialsFile, JSON.stringify(credentials, null, 2), 'utf8');

    console.log(colorize('✅ Credentials saved successfully!', 'green'));
    return credentials;
}

async function setupShellAliases() {
    console.log(colorize('\n🔧 Setting up shell aliases...', 'cyan'));

    const projectPath = path.resolve(__dirname, '..');
    const bashrcPath = path.join(process.env.HOME, '.bashrc');
    const zshrcPath = path.join(process.env.HOME, '.zshrc');

    const aliases = `
# HRM CLI Commands
alias hrm-create-folder="node ${projectPath}/cli-commands/hrm-create-folder.js"
alias hrm-setup="node ${projectPath}/cli-commands/hrm-setup.js"
alias /hrm-create-folder="node ${projectPath}/cli-commands/hrm-create-folder.js"
alias /hrm-setup="node ${projectPath}/cli-commands/hrm-setup.js"
`;

    try {
        // Check if aliases already exist
        const bashrcContent = await fs.readFile(bashrcPath, 'utf8').catch(() => '');

        if (!bashrcContent.includes('# HRM CLI Commands')) {
            await fs.appendFile(bashrcPath, aliases, 'utf8');
            console.log(colorize('✅ Added aliases to ~/.bashrc', 'green'));
        } else {
            console.log(colorize('ℹ️  Aliases already exist in ~/.bashrc', 'blue'));
        }

        // Try zsh as well
        try {
            const zshrcContent = await fs.readFile(zshrcPath, 'utf8').catch(() => '');
            if (!zshrcContent.includes('# HRM CLI Commands')) {
                await fs.appendFile(zshrcPath, aliases, 'utf8');
                console.log(colorize('✅ Added aliases to ~/.zshrc', 'green'));
            }
        } catch (error) {
            // Zsh not available, skip
        }

    } catch (error) {
        console.log(colorize('⚠️  Could not set up shell aliases automatically', 'yellow'));
        console.log(colorize('Add these lines to your ~/.bashrc or ~/.zshrc:', 'cyan'));
        console.log(aliases);
    }
}

async function testConnection(credentials) {
    console.log(colorize('\n🧪 Testing connection...', 'cyan'));

    try {
        const axios = require('axios');
        const response = await axios.post('http://localhost:3000/api/auth/login', credentials);

        if (response.data.token) {
            console.log(colorize('✅ Connection test successful!', 'green'));
            console.log(colorize(`👤 Logged in as: ${response.data.user?.email || credentials.email}`, 'blue'));
            return true;
        } else {
            throw new Error('No token received');
        }
    } catch (error) {
        console.log(colorize('❌ Connection test failed:', 'red'), error.response?.data?.error || error.message);
        console.log(colorize('💡 Make sure the HRMS server is running on localhost:3000', 'cyan'));
        return false;
    }
}

async function showUsageInstructions() {
    console.log(colorize('\n📋 Setup Complete! Usage Instructions:', 'cyan'));
    console.log(colorize('═'.repeat(40), 'blue'));

    console.log(colorize('\n🔄 Reload your shell:', 'yellow'));
    console.log('  source ~/.bashrc   # or restart terminal');

    console.log(colorize('\n📂 Create User Folder:', 'yellow'));
    console.log('  /hrm-create-folder Maria Bianchi');
    console.log('  /hrm-create-folder John Doe john.doe@company.org');

    console.log(colorize('\n🔧 Alternative usage:', 'yellow'));
    console.log('  hrm-create-folder Maria Bianchi');
    console.log('  node cli-commands/hrm-create-folder.js Maria Bianchi');

    console.log(colorize('\n💡 For help:', 'yellow'));
    console.log('  /hrm-create-folder --help');

    console.log(colorize('\n📁 Files will be saved to:', 'yellow'));
    console.log('  /AI-HRMS-2025/[CompanyName]/reports/[name]_[surname]_folder_[timestamp].md');
}

async function main() {
    console.log(colorize('🚀 HRM CLI Setup Tool', 'cyan'));
    console.log(colorize('═'.repeat(30), 'blue'));

    try {
        // Setup credentials
        const credentials = await setupCredentials();

        // Test connection
        const connectionOk = await testConnection(credentials);

        // Setup shell aliases
        await setupShellAliases();

        // Show usage instructions
        await showUsageInstructions();

        if (connectionOk) {
            console.log(colorize('\n🎉 Setup completed successfully!', 'green'));
        } else {
            console.log(colorize('\n⚠️  Setup completed but connection test failed', 'yellow'));
            console.log(colorize('   You can still use the CLI when the server is running', 'cyan'));
        }

    } catch (error) {
        console.error(colorize('💥 Setup failed:', 'red'), error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Handle CLI execution
if (require.main === module) {
    main();
}