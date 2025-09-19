# User Folder Report Documentation
## AI-HRMS-2025 Comprehensive Employee Profile System

---

## Overview

The User Folder Report is a comprehensive employee profile system that aggregates all available data about a user from across the AI-HRMS-2025 database into a single, unified report. This feature provides a complete 360-degree view of any employee in the system.

This system represents the first implementation of our **Database-driven Report Templates** architecture, serving as the foundation for a comprehensive reporting engine. Future reports will leverage the same underlying infrastructure for consistent, secure, and scalable report generation across the entire HRMS platform.

## Features

- **Complete Data Aggregation**: Pulls data from 10+ related tables
- **Multiple Output Formats**: JSON, Markdown, HTML, and downloadable files
- **Role-Based Access**: Appropriate access controls based on user roles
- **Bulk Generation**: Generate reports for multiple users simultaneously
- **Profile Completeness Analysis**: Automatic assessment of missing data
- **Real-time Generation**: Always shows current data from the database

## API Endpoints

### 1. Get User Folder for Specific User

```http
GET /api/reports/user-folder/:email
```

**Parameters:**
- `:email` - Email address of the target user
- `?format` - Output format (json|markdown|html|download)

**Authorization:**
- HR/Admin: Can view any user
- Manager: Can view team members
- Employee: Can view own profile only

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/reports/user-folder/ceo@banknova.org?format=markdown" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Get Own User Folder

```http
GET /api/reports/user-folder/me
```

**Parameters:**
- `?format` - Output format (json|markdown)

**Authorization:**
- Any authenticated user

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/reports/user-folder/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Bulk User Folder Generation

```http
POST /api/reports/user-folder/bulk
```

**Body:**
```json
{
  "emails": [
    "user1@company.org",
    "user2@company.org",
    "user3@company.org"
  ]
}
```

**Authorization:**
- HR and Admin only

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/reports/user-folder/bulk" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"emails": ["ceo@banknova.org", "hr@banknova.org"]}'
```

## Data Structure

The User Folder contains the following sections:

### 1. Core User Information
- User ID, name, email
- System role and status
- Account timestamps
- Password status

### 2. Organization Details
- Company affiliation
- Industry and size
- Subscription details
- Membership information

### 3. Employee Profile
- Position and department
- Start date and salary
- Manager relationship
- Leave balances

### 4. Team Information
- Direct reports count
- Total team size
- Hierarchy depth

### 5. Leave Management
- Current balances
- Request history
- Approval statistics

### 6. Skills & Competencies
- Skill assessments
- Proficiency levels
- Certifications

### 7. Performance Data
- Reviews and ratings
- Goals and objectives

### 8. System Access
- Permissions and roles
- Access history

### 9. Audit Trail
- Activity log
- Data changes

### 10. Profile Completeness
- Missing data analysis
- Completeness percentage

## SQL Queries

All queries are stored in `/user_folder_report_queries.sql` and include:

1. **Core User Query** - Basic user information
2. **Organization Query** - Company and membership data
3. **Employee Profile Query** - HR-specific data
4. **Direct Reports Query** - Team members
5. **Leave Summary Query** - Leave statistics
6. **Leave History Query** - Recent requests
7. **Skills Query** - Competencies and assessments
8. **Team Hierarchy Query** - Full team structure
9. **Access Rights Query** - Permissions
10. **Audit Log Query** - Activity history
11. **Profile Completeness Query** - Data quality check
12. **Summary Statistics Query** - Key metrics

## Usage Examples

### JavaScript/Node.js

```javascript
const { generateUserFolder, formatUserFolderToMarkdown } = require('./src/services/userFolderReportService');

// Generate user folder
const userFolder = await generateUserFolder('ceo@banknova.org');

// Convert to markdown
const markdown = formatUserFolderToMarkdown(userFolder);

// Save to file
await saveUserFolder(userFolder, 'markdown', './reports/user_folder.md');
```

### Direct SQL Usage

```sql
-- Replace :user_email with actual email
-- Example: Replace with 'ceo@banknova.org'

-- Get core user information
SELECT * FROM users WHERE email = :user_email;

-- Get organization details
SELECT o.* FROM users u
JOIN organization_members om ON u.id = om.user_id
JOIN organizations o ON om.organization_id = o.organization_id
WHERE u.email = :user_email;

-- Continue with other queries from user_folder_report_queries.sql
```

### Command Line

```bash
# Generate report via API
curl -X GET "http://localhost:3000/api/reports/user-folder/ceo@banknova.org" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o user_folder.json

# Generate markdown format
curl -X GET "http://localhost:3000/api/reports/user-folder/ceo@banknova.org?format=markdown" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o user_folder.md
```

## Output Formats

### JSON Format
```json
{
  "generatedAt": "2025-09-16T10:30:00Z",
  "userEmail": "ceo@banknova.org",
  "data": {
    "userCore": { ... },
    "organization": { ... },
    "employeeProfile": { ... },
    "directReports": { ... },
    "leaveSummary": { ... },
    "leaveHistory": [ ... ],
    "skills": [ ... ],
    "teamSize": { ... },
    "profileCompleteness": { ... }
  }
}
```

### Markdown Format
```markdown
# User Folder - Complete Employee Profile
## AI-HRMS-2025 System

### Executive Summary
**Generated:** September 16, 2025
**Subject:** Maria Bianchi
**Position:** Chief Executive Officer
...
```

### HTML Format
- Styled HTML document
- Printable format
- Tables and formatting
- Embedded CSS

## Security Considerations

1. **Access Control**: Strict role-based access
2. **Data Privacy**: GDPR compliant
3. **Audit Logging**: All report generations are logged
4. **Sensitive Data**: Salary and personal info protected
5. **Rate Limiting**: Prevent abuse of bulk generation

## Performance Considerations

- **Query Optimization**: All queries use proper indexes
- **Lazy Loading**: Skills and assessments loaded only if available
- **Caching**: Consider caching for frequently accessed profiles
- **Batch Processing**: Bulk generation processes sequentially

## Future Architecture: Database-driven Templates

This User Folder Report will be migrated to the new **Database-driven Report Templates** system (see the comprehensive report system implementation guide) which includes:

### Enhanced Features Coming Soon
- **Template Versioning**: Maintain report template history and rollback capabilities
- **Dynamic SQL Execution**: Store and execute report queries directly from database
- **Audit Logging**: Complete execution history with performance metrics
- **Advanced Security**: Template-level access controls and data sensitivity handling
- **Custom Formatting**: User-defined output formats with template inheritance
- **Scheduled Generation**: Automated report generation with caching

### Migration Path
1. **Phase 1**: Current implementation (✅ Complete - Sep 17, 2025)
2. **Phase 2**: Strategy & Standards (✅ Complete - Sep 18, 2025)
3. **Phase 3**: Migrate to `report_templates` table structure (📋 Ready - Sprint R1)
4. **Phase 4**: Add versioning and audit capabilities (📋 Ready - Sprint R2)
5. **Phase 5**: Implement advanced security and scheduling (📋 Ready - Sprint R3)
6. **Phase 6**: Visual builder and user interface (📋 Ready - Sprint R4)

## Extending the Report

### Current Method
To add new data sections:

1. Add query to `user_folder_report_queries.sql`
2. Update `generateUserFolder()` in service
3. Update `formatUserFolderToMarkdown()` for display
4. Test with various user profiles

### Future Method (Database-driven)
1. Insert new template into `report_templates` table
2. Configure parameters and security settings
3. Test execution through dynamic engine
4. Deploy with version control

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| User not found | Invalid email | Verify email exists |
| Unauthorized access | Insufficient permissions | Check user role |
| Missing data | Incomplete profile | Normal - shows in completeness |
| Query timeout | Large dataset | Optimize queries |

## Best Practices

1. **Regular Generation**: Generate reports periodically for compliance
2. **Data Validation**: Verify completeness before important processes
3. **Archival**: Store historical snapshots for audit trails
4. **Privacy**: Limit access to sensitive sections
5. **Updates**: Keep queries updated with schema changes

## Troubleshooting

### Report Generation Fails
```bash
# Check database connection
psql -h localhost -U hrms_user -d ai_hrms_2025 -c "SELECT 1"

# Test specific query
psql -h localhost -U hrms_user -d ai_hrms_2025 -c "SELECT * FROM users WHERE email = 'test@company.org'"

# Check logs
tail -f logs/error.log
```

### Missing Data
```sql
-- Check if user exists
SELECT * FROM users WHERE email = 'user@company.org';

-- Check organization membership
SELECT * FROM organization_members WHERE user_id = (SELECT id FROM users WHERE email = 'user@company.org');

-- Check employee profile
SELECT * FROM employees WHERE user_id = (SELECT id FROM users WHERE email = 'user@company.org');
```

## Related Documentation

- **Report System Guide**: Comprehensive development plan for database-driven report system
- **Template Strategy**: Complete implementation strategy for dynamic report templates
- **[CURRENT_USER_STATUS_REPORT_STANDARD.md](./CURRENT_USER_STATUS_REPORT_STANDARD.md)**: Visual standards and guidelines
- **[USER_STATUS_REPORT_STANDARD_GUIDE.md](./USER_STATUS_REPORT_STANDARD_GUIDE.md)**: Technical implementation guide
- **Report System Complete Guide**: Comprehensive implementation documentation (see .development/REPORT_SYSTEM_COMPLETE_GUIDE.md)
- **[CLAUDE.md](../CLAUDE.md)**: Project overview and development guidelines
- **Development Tracker**: Main development progress and sprint tracking

## Support

For issues or questions:
- Check logs in `/logs/`
- Review SQL queries in `/user_folder_report_queries.sql`
- Review development progress in the report system implementation guide
- Contact: hr@company.org

---

*Last Updated: September 18, 2025 | Version 1.2 | Complete Strategy & Standards Integration | Database-driven Report Templates Architecture Ready*