/**
 * Report Routes
 * Endpoints for generating various reports including User Folder
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { generateUserFolder, formatUserFolderToMarkdown, saveUserFolder } = require('../services/userFolderReportService');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const { User, Employee, Organization, OrganizationMember, sequelize } = require('../../models');

/**
 * GET /api/reports/user-folder/:email
 * Generate user folder report for a specific user
 *
 * Access: HR, Manager (for their team), Employee (self only)
 */
router.get('/user-folder/:email', authenticateToken, async (req, res) => {
    try {
        const targetEmail = req.params.email;
        const requestorEmail = req.user.email;
        const requestorRole = req.user.role;

        // Authorization check
        let authorized = false;

        if (requestorRole === 'hr' || requestorRole === 'admin') {
            // HR and Admin can view anyone
            authorized = true;
        } else if (requestorRole === 'manager') {
            // Managers can view their team members
            // TODO: Check if target user is in manager's team
            authorized = true; // Simplified for now
        } else if (requestorEmail === targetEmail) {
            // Users can view their own folder
            authorized = true;
        }

        if (!authorized) {
            return res.status(403).json({
                error: 'Not authorized to view this user folder',
                code: 'UNAUTHORIZED_ACCESS'
            });
        }

        // Generate the user folder
        const userFolder = await generateUserFolder(targetEmail);

        // Format based on requested format
        const format = req.query.format || 'json';

        logger.info(`User folder generated for ${targetEmail} by ${requestorEmail}`);

        switch (format.toLowerCase()) {
            case 'markdown':
                const markdown = formatUserFolderToMarkdown(userFolder);
                res.set('Content-Type', 'text/markdown');
                res.send(markdown);
                break;

            case 'html':
                const markdownContent = formatUserFolderToMarkdown(userFolder);
                const html = `<!DOCTYPE html>
<html>
<head>
    <title>User Folder - ${userFolder.data.userCore.full_name}</title>
    <meta charset="utf-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
            box-shadow: 0 2px 3px rgba(0,0,0,0.1);
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #3498db;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) { background-color: #f8f9fa; }
        code {
            background-color: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        .summary {
            background-color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background-color: #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background-color: #27ae60;
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="container">
        <pre style="white-space: pre-wrap;">${markdownContent}</pre>
    </div>
</body>
</html>`;
                res.set('Content-Type', 'text/html');
                res.send(html);
                break;

            case 'download':
                // Save to file and send as download
                const filePath = await saveUserFolder(userFolder, 'markdown');
                res.download(filePath);
                break;

            case 'json':
            default:
                res.json({
                    success: true,
                    data: userFolder,
                    generated_at: userFolder.generatedAt,
                    user_email: targetEmail
                });
                break;
        }

    } catch (error) {
        logger.error('Error generating user folder:', error);
        res.status(500).json({
            error: 'Failed to generate user folder',
            message: error.message,
            code: 'REPORT_GENERATION_ERROR'
        });
    }
});

/**
 * POST /api/reports/user-folder/bulk
 * Generate user folders for multiple users
 *
 * Body: { emails: ['email1', 'email2', ...] }
 * Access: HR and Admin only
 */
router.post('/user-folder/bulk', authenticateToken, requireRole('hr', 'admin'), async (req, res) => {
    try {
        const { emails } = req.body;

        if (!emails || !Array.isArray(emails)) {
            return res.status(400).json({
                error: 'Email array required',
                code: 'INVALID_REQUEST'
            });
        }

        const results = [];
        const errors = [];

        for (const email of emails) {
            try {
                const userFolder = await generateUserFolder(email);
                results.push({
                    email: email,
                    success: true,
                    data: userFolder
                });
            } catch (error) {
                errors.push({
                    email: email,
                    success: false,
                    error: error.message
                });
            }
        }

        logger.info(`Bulk user folders generated: ${results.length} success, ${errors.length} failed`);

        res.json({
            success: true,
            generated: results.length,
            failed: errors.length,
            results: results,
            errors: errors
        });

    } catch (error) {
        logger.error('Error generating bulk user folders:', error);
        res.status(500).json({
            error: 'Failed to generate bulk user folders',
            message: error.message,
            code: 'BULK_REPORT_ERROR'
        });
    }
});

/**
 * GET /api/reports/user-folder/me
 * Generate user folder for current logged-in user
 *
 * Access: All authenticated users
 */
router.get('/user-folder/me', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const userFolder = await generateUserFolder(userEmail);

        const format = req.query.format || 'json';

        switch (format.toLowerCase()) {
            case 'markdown':
                const markdown = formatUserFolderToMarkdown(userFolder);
                res.set('Content-Type', 'text/markdown');
                res.send(markdown);
                break;

            case 'json':
            default:
                res.json({
                    success: true,
                    data: userFolder,
                    generated_at: userFolder.generatedAt
                });
                break;
        }

    } catch (error) {
        logger.error('Error generating user folder for self:', error);
        res.status(500).json({
            error: 'Failed to generate your user folder',
            message: error.message,
            code: 'SELF_REPORT_ERROR'
        });
    }
});

/**
 * GET /api/reports/templates
 * Get available report templates
 *
 * Access: HR and Admin only
 */
router.get('/templates', authenticateToken, requireRole('hr', 'admin'), (req, res) => {
    res.json({
        success: true,
        templates: [
            {
                id: 'user-folder',
                name: 'User Folder Report',
                description: 'Complete employee profile with all related data',
                formats: ['json', 'markdown', 'html', 'download'],
                endpoints: [
                    'GET /api/reports/user-folder/:email',
                    'GET /api/reports/user-folder/me',
                    'POST /api/reports/user-folder/bulk'
                ]
            },
            {
                id: 'leave-summary',
                name: 'Leave Summary Report',
                description: 'Leave balances and history',
                status: 'planned'
            },
            {
                id: 'team-hierarchy',
                name: 'Team Hierarchy Report',
                description: 'Organizational structure and reporting lines',
                status: 'planned'
            },
            {
                id: 'skills-matrix',
                name: 'Skills Matrix Report',
                description: 'Team skills assessment and gaps',
                status: 'planned'
            }
        ]
    });
});

/**
 * POST /api/reports/hrm-create-folder
 * Custom command to generate user folder report and save as organized file
 *
 * Body: { name: string, surname: string, [email: string] }
 * Access: HR and Admin only
 */
router.post('/hrm-create-folder', authenticateToken, requireRole('hr', 'admin'), async (req, res) => {
    try {
        const { name, surname, email } = req.body;

        // Validate required parameters
        if (!name || !surname) {
            return res.status(400).json({
                error: 'Name and surname are required parameters',
                code: 'MISSING_PARAMETERS',
                usage: 'POST /api/reports/hrm-create-folder with body: { "name": "John", "surname": "Doe" }'
            });
        }

        // Step 1: Find user by name and surname (with optional email for disambiguation)
        let user;
        let searchConditions = {};

        if (email) {
            // If email provided, use it for direct lookup
            searchConditions.email = email.toLowerCase();
        } else {
            // Search by name components
            searchConditions[sequelize.Sequelize.Op.or] = [
                // Try various name combinations
                {
                    email: {
                        [sequelize.Sequelize.Op.iLike]: `${name.toLowerCase()}.${surname.toLowerCase()}%`
                    }
                },
                {
                    email: {
                        [sequelize.Sequelize.Op.iLike]: `${name.toLowerCase()}%${surname.toLowerCase()}%`
                    }
                }
            ];
        }

        // Complete user lookup with proper associations using corrected field names
        const users = await User.findAll({
            where: searchConditions,
            attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'is_active', 'employee_id', 'hire_date', 'status'],
            include: [
                {
                    model: OrganizationMember,
                    as: 'organizationMembership',
                    required: false,
                    attributes: ['role', 'department', 'joined_at', 'status'],
                    include: [
                        {
                            model: Organization,
                            as: 'organization',
                            attributes: ['organization_id', 'name', 'slug', 'domain', 'industry', 'size']
                        }
                    ]
                },
                {
                    model: Employee,
                    as: 'employeeProfile',
                    required: false,
                    attributes: ['id', 'position', 'startDate', 'salary', 'status', 'vacationBalance', 'sickBalance']
                }
            ]
        });

        // Handle search results
        if (users.length === 0) {
            return res.status(404).json({
                error: `No user found with name '${name} ${surname}'`,
                code: 'USER_NOT_FOUND',
                suggestion: 'Try providing the email address for exact match'
            });
        }

        if (users.length > 1 && !email) {
            const userOptions = users.map(u => ({
                email: u.email,
                fullName: `${u.first_name || 'Unknown'} ${u.last_name || 'Unknown'}`,
                organization: u.organizationMembership?.organization?.name || 'Unknown'
            }));

            return res.status(422).json({
                error: `Multiple users found with name '${name} ${surname}'. Please specify email.`,
                code: 'MULTIPLE_USERS_FOUND',
                users: userOptions
            });
        }

        user = users[0];

        // Step 2: Get user's organization from proper association
        const userOrganization = user.organizationMembership?.organization;
        if (!userOrganization) {
            return res.status(400).json({
                error: `User ${user.email} is not associated with any organization`,
                code: 'NO_ORGANIZATION'
            });
        }

        // Step 3: Generate user folder report
        const userFolder = await generateUserFolder(user.email);
        const markdownReport = formatUserFolderToMarkdown(userFolder);

        // Step 4: Create directory structure
        const companyName = userOrganization.name.replace(/[^a-zA-Z0-9]/g, ''); // Remove special chars
        const reportsDir = path.join(__dirname, '../../', companyName, 'reports');

        // Ensure directory exists
        await fs.mkdir(reportsDir, { recursive: true });

        // Step 5: Generate filename with timestamp
        const timestamp = new Date().toISOString()
            .replace(/T/, '_')
            .replace(/:/g, '-')
            .substring(0, 16); // yyyy-mm-dd_hh-mm

        const fileName = `${name.toLowerCase()}_${surname.toLowerCase()}_folder_${timestamp}.md`;
        const filePath = path.join(reportsDir, fileName);

        // Step 6: Save the report
        await fs.writeFile(filePath, markdownReport, 'utf8');

        // Step 7: Log the operation
        logger.info(`User folder report generated: ${fileName} for ${user.email} by ${req.user.email}`);

        // Step 8: Return success response
        res.json({
            success: true,
            message: `User folder report generated successfully`,
            details: {
                user: {
                    email: user.email,
                    name: `${user.first_name || name} ${user.last_name || surname}`,
                    organization: userOrganization.name
                },
                file: {
                    name: fileName,
                    path: filePath,
                    size: Buffer.byteLength(markdownReport, 'utf8'),
                    directory: reportsDir
                },
                timestamp: new Date().toISOString(),
                generatedBy: req.user.email
            }
        });

    } catch (error) {
        logger.error('Error in hrm-create-folder command:', error);
        res.status(500).json({
            error: 'Failed to generate user folder report',
            message: error.message,
            code: 'COMMAND_EXECUTION_ERROR'
        });
    }
});

module.exports = router;