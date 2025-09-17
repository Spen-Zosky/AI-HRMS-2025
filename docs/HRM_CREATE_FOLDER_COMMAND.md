# HRM Create Folder Command Documentation

## Overview

The `/hrm-create-folder` command is a custom API endpoint that allows HR and Admin users to generate User Folder reports for specific employees and automatically save them as organized Markdown files in company-specific directories.

## Command Specification

### Endpoint
```http
POST /api/reports/hrm-create-folder
```

### Authentication
- **Required**: JWT Bearer token
- **Access**: HR and Admin roles only

### Parameters

#### Required
- `name` (string): First name of the employee
- `surname` (string): Last name of the employee

#### Optional
- `email` (string): Email address for exact user matching (recommended when multiple users have similar names)

### Request Format

```json
{
    "name": "John",
    "surname": "Doe"
}
```

**With email for exact match:**
```json
{
    "name": "John",
    "surname": "Doe",
    "email": "john.doe@company.org"
}
```

## How It Works

### 1. User Identification
- Searches for users by name pattern matching in email addresses
- Looks for patterns like `name.surname@company.org`
- If email provided, performs exact lookup

### 2. Organization Detection
- Identifies the user's organization/company
- Uses organization name for directory structure

### 3. Report Generation
- Generates complete User Folder report using existing service
- Includes data from 10+ database tables
- Formats as Markdown with professional styling

### 4. File Organization
- Creates company-specific directory: `/AI-HRMS-2025/[CompanyName]/reports/`
- Generates timestamped filename: `[name]_[surname]_folder_[yyyy-mm-dd_hh-mm].md`
- Saves report with proper permissions

### 5. Audit Logging
- Logs all report generation activities
- Tracks who generated what report when

## Response Format

### Success Response (200)
```json
{
    "success": true,
    "message": "User folder report generated successfully",
    "details": {
        "user": {
            "email": "john.doe@company.org",
            "name": "John Doe",
            "organization": "TechCorp"
        },
        "file": {
            "name": "john_doe_folder_2025-09-17_14-30.md",
            "path": "/absolute/path/to/TechCorp/reports/john_doe_folder_2025-09-17_14-30.md",
            "size": 15432,
            "directory": "/absolute/path/to/TechCorp/reports"
        },
        "timestamp": "2025-09-17T14:30:00.000Z",
        "generatedBy": "hr@company.org"
    }
}
```

### Error Responses

#### Missing Parameters (400)
```json
{
    "error": "Name and surname are required parameters",
    "code": "MISSING_PARAMETERS",
    "usage": "POST /api/reports/hrm-create-folder with body: { \"name\": \"John\", \"surname\": \"Doe\" }"
}
```

#### User Not Found (404)
```json
{
    "error": "No user found with name 'John Doe'",
    "code": "USER_NOT_FOUND",
    "suggestion": "Try providing the email address for exact match"
}
```

#### Multiple Users Found (422)
```json
{
    "error": "Multiple users found with name 'John Doe'. Please specify email.",
    "code": "MULTIPLE_USERS_FOUND",
    "users": [
        {
            "email": "john.doe@company1.org",
            "fullName": "John Doe",
            "organization": "Company1"
        },
        {
            "email": "john.doe@company2.org",
            "fullName": "John Doe",
            "organization": "Company2"
        }
    ]
}
```

#### No Organization (400)
```json
{
    "error": "User john.doe@company.org is not associated with any organization",
    "code": "NO_ORGANIZATION"
}
```

#### Unauthorized (403)
```json
{
    "error": "Insufficient permissions. HR or Admin role required.",
    "code": "INSUFFICIENT_PERMISSIONS"
}
```

## Directory Structure

The command creates an organized directory structure:

```
AI-HRMS-2025/
├── BankNova/
│   └── reports/
│       ├── giulia_marchetti_folder_2025-09-17_14-30.md
│       ├── maria_bianchi_folder_2025-09-17_14-31.md
│       └── franco_verdi_folder_2025-09-17_14-32.md
├── TechCorp/
│   └── reports/
│       ├── john_smith_folder_2025-09-17_14-33.md
│       └── anna_wilson_folder_2025-09-17_14-34.md
├── FinNova/
│   └── reports/
│       └── luca_rossi_folder_2025-09-17_14-35.md
└── EcoNova/
    └── reports/
        └── sara_bianchi_folder_2025-09-17_14-36.md
```

## Usage Examples

### cURL Examples

```bash
# Basic usage
curl -X POST "http://localhost:3000/api/reports/hrm-create-folder" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Maria", "surname": "Bianchi"}'

# With email for exact match
curl -X POST "http://localhost:3000/api/reports/hrm-create-folder" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "surname": "Doe", "email": "john.doe@company.org"}'
```

### JavaScript Example

```javascript
const axios = require('axios');

async function generateUserFolder(name, surname, email = null) {
    try {
        const requestBody = { name, surname };
        if (email) requestBody.email = email;

        const response = await axios.post(
            'http://localhost:3000/api/reports/hrm-create-folder',
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Report generated:', response.data.details.file.name);
        console.log('Saved to:', response.data.details.file.directory);

        return response.data;
    } catch (error) {
        console.error('Error:', error.response.data);
        throw error;
    }
}

// Usage
generateUserFolder('Maria', 'Bianchi');
generateUserFolder('John', 'Doe', 'john.doe@company.org');
```

## File Content

The generated Markdown files contain complete User Folder reports with:

- **Executive Summary**: Key employee information
- **Core User Information**: Basic profile data
- **Organization Details**: Company and membership information
- **Employee Profile**: HR-specific data (position, salary, start date)
- **Team Information**: Direct reports and hierarchy
- **Leave Management**: Current balances and history
- **Skills & Competencies**: Technical and soft skills
- **Performance Data**: Reviews and objectives
- **System Access**: Permissions and roles
- **Audit Trail**: Activity logs
- **Profile Completeness**: Data quality analysis

## Security Features

- **Role-based Access**: Only HR and Admin can execute
- **Authentication Required**: JWT token validation
- **Organization Isolation**: Users can only access their organization's data
- **Audit Logging**: All operations logged with user tracking
- **Input Validation**: Parameter sanitization and validation
- **Error Handling**: Secure error messages without data leakage

## Testing

Run the test script to verify functionality:

```bash
node test-hrm-create-folder.js
```

This will test various scenarios including:
- Successful report generation
- User not found handling
- Multiple user disambiguation
- Error handling and validation

## Support

For issues or questions:
- Check server logs in `/logs/`
- Review API documentation
- Contact: hr@company.org

---

*Last Updated: September 17, 2025 | Version 1.0*