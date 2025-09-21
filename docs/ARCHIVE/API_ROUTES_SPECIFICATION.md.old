# API Routes Specification

## Overview
Complete API endpoint documentation for AI-HRMS-2025 platform with JWT authentication and multi-tenant architecture.

## Base URL
```
Development: http://localhost:3000/api
Production: https://api.ai-hrms.com/api
```

## Authentication Routes (`/api/auth`)

### POST /api/auth/register
Register new user account with organization assignment
- **Body**: `{ user_email, user_password_hash, user_first_name, user_last_name, org_id }`
- **Response**: `{ token, user, organization }`
- **Auth**: Public

### POST /api/auth/login
User authentication with JWT token generation
- **Body**: `{ email, password }`
- **Response**: `{ token, user, permissions }`
- **Auth**: Public

### GET /api/auth/profile
Get current authenticated user profile
- **Headers**: `Authorization: Bearer <token>`
- **Response**: User profile with organization details
- **Auth**: Required

### PUT /api/auth/password
Change user password
- **Body**: `{ currentPassword, newPassword }`
- **Auth**: Required

## Employee Management Routes (`/api/employees`)

### GET /api/employees
List all employees in organization
- **Query**: `?page=1&limit=20&department=HR&status=active`
- **Response**: Paginated employee list
- **Auth**: Required, Role: HR_VIEW

### GET /api/employees/:id
Get specific employee details
- **Params**: `id` - Employee UUID
- **Response**: Complete employee profile
- **Auth**: Required, Role: HR_VIEW

### POST /api/employees
Create new employee record
- **Body**: Employee object with all required fields
- **Response**: Created employee with emp_id
- **Auth**: Required, Role: HR_ADMIN

### PUT /api/employees/:id
Update employee information
- **Params**: `id` - Employee UUID
- **Body**: Partial employee update object
- **Auth**: Required, Role: HR_ADMIN

### DELETE /api/employees/:id
Soft delete employee (set inactive)
- **Params**: `id` - Employee UUID
- **Auth**: Required, Role: SUPER_ADMIN

### POST /api/employees/:id/documents
Upload employee documents
- **Files**: Multipart form data
- **Auth**: Required, Role: HR_ADMIN

## ATS Routes (`/api/ats`)

### POST /api/ats/applications
Submit job application with CV parsing
- **Files**: CV file (PDF/DOCX)
- **Body**: `{ jobId, coverLetter }`
- **Response**: Parsed application with skills extraction
- **Auth**: Public

### GET /api/ats/applications
List job applications
- **Query**: `?status=pending&jobId=xxx`
- **Response**: Paginated applications
- **Auth**: Required, Role: RECRUITER

### GET /api/ats/applications/:id
Get application details with AI analysis
- **Response**: Application with skills match score
- **Auth**: Required, Role: RECRUITER

### PUT /api/ats/applications/:id/status
Update application status
- **Body**: `{ status, notes }`
- **Auth**: Required, Role: RECRUITER

### POST /api/ats/parse-cv
Parse CV and extract structured data
- **Files**: CV file upload
- **Response**: Extracted skills, experience, education
- **Auth**: Required

## AI Services Routes (`/api/ai`)

### POST /api/ai/extract-text
Extract text from documents
- **Files**: Document upload
- **Response**: Extracted plain text
- **Auth**: Required

### POST /api/ai/analyze-skills
Analyze and match skills
- **Body**: `{ text, targetRole }`
- **Response**: Skills analysis with proficiency scores
- **Auth**: Required

### POST /api/ai/generate-description
Generate job descriptions
- **Body**: `{ role, department, requirements }`
- **Response**: AI-generated job description
- **Auth**: Required, Role: HR_ADMIN

## Vector Search Routes (`/api/vectors`)

### POST /api/vectors/search
Semantic search for candidates
- **Body**: `{ query, limit, filters }`
- **Response**: Ranked candidate matches
- **Auth**: Required

### POST /api/vectors/index
Index document for search
- **Body**: `{ document, metadata }`
- **Auth**: Required, Role: SYSTEM

### DELETE /api/vectors/:id
Remove from vector index
- **Auth**: Required, Role: SYSTEM

## Analytics Routes (`/api/analytics`)

### GET /api/analytics/dashboard
Get dashboard metrics
- **Response**: KPIs and charts data
- **Auth**: Required

### GET /api/analytics/employees
Employee analytics and trends
- **Query**: `?period=month&department=all`
- **Auth**: Required, Role: MANAGER

### GET /api/analytics/recruitment
Recruitment funnel metrics
- **Auth**: Required, Role: RECRUITER

### GET /api/analytics/skills-gap
Skills gap analysis
- **Auth**: Required, Role: HR_ADMIN

## Organization Routes (`/api/organizations`)

### GET /api/organizations/:id
Get organization details
- **Auth**: Required, Scope: Own organization

### PUT /api/organizations/:id
Update organization settings
- **Auth**: Required, Role: ORG_ADMIN

### GET /api/organizations/:id/users
List organization users
- **Auth**: Required, Role: ORG_ADMIN

### POST /api/organizations/:id/invite
Invite users to organization
- **Body**: `{ email, role }`
- **Auth**: Required, Role: ORG_ADMIN

## Report Routes (`/api/reports`)

### GET /api/reports/templates
List available report templates
- **Auth**: Required

### POST /api/reports/generate
Generate custom report
- **Body**: Report configuration
- **Response**: Report data or scheduled job ID
- **Auth**: Required

### GET /api/reports/:id/download
Download generated report
- **Format**: PDF, Excel, CSV
- **Auth**: Required

## Copilot Routes (`/api/copilot`)

### POST /api/copilot/chat
HR Copilot chat interface
- **Body**: `{ message, context }`
- **Response**: AI assistant response
- **Auth**: Required

### GET /api/copilot/suggestions
Get contextual suggestions
- **Query**: `?context=employee_review`
- **Auth**: Required

### POST /api/copilot/execute
Execute copilot actions
- **Body**: `{ action, parameters }`
- **Auth**: Required, Dynamic permissions

## Leave Management Routes (`/api/leaves`)

### GET /api/leaves
List leave requests
- **Query**: `?status=pending&employeeId=xxx`
- **Auth**: Required

### POST /api/leaves
Submit leave request
- **Body**: Leave request details
- **Auth**: Required

### PUT /api/leaves/:id/approve
Approve leave request
- **Auth**: Required, Role: MANAGER

### PUT /api/leaves/:id/reject
Reject leave request
- **Body**: `{ reason }`
- **Auth**: Required, Role: MANAGER

## Common Headers

### Required Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Organization-ID: <org_uuid>
```

### Optional Headers
```
Accept-Language: en-US
X-Request-ID: <unique_request_id>
X-Client-Version: 1.0.0
```

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2025-01-21T10:30:00Z",
  "path": "/api/auth/register"
}
```

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **409**: Conflict
- **422**: Unprocessable Entity
- **429**: Too Many Requests
- **500**: Internal Server Error

## Rate Limiting
- **Default**: 100 requests per minute
- **Authentication endpoints**: 5 requests per minute
- **File uploads**: 10 requests per minute
- **AI operations**: 20 requests per minute

## Pagination
All list endpoints support pagination:
```
?page=1&limit=20&sort=created_at&order=desc
```

## Filtering
Standard filter query parameters:
```
?status=active&department=HR&created_after=2025-01-01
```

## Multi-Tenant Scoping
All endpoints automatically scope data to the authenticated user's organization using the JWT token's org_id claim.