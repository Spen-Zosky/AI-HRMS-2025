# AI-HRMS-2025 API Documentation
**RESTful API Reference - January 24, 2025**

## Executive Summary

### API Configuration
- **Base URL**: `http://localhost:3000/api`
- **Protocol**: HTTP/HTTPS with REST architecture
- **Authentication**: JWT Bearer tokens
- **Content-Type**: `application/json`
- **API Version**: v1 (implicit, no versioning implemented)

### API Statistics
- **Total Endpoints**: 89 documented endpoints
- **Route Modules**: 13 functional modules
- **Authentication**: Required for 87/89 endpoints
- **Public Endpoints**: 2 (login, test-users)
- **Authorization**: Role-based access control (RBAC)

---

## 1. Authentication & Authorization

### 1.1 Authentication Endpoints

#### POST /api/auth/login
**Description**: User login with email and password

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK)**:
```json
{
  "message": "Login effettuato con successo",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "employee"
  }
}
```

**Error Responses**:
- `400 Bad Request` - Missing email or password
- `401 Unauthorized` - Invalid credentials
- `423 Locked` - Account locked due to failed attempts

**Security Features**:
- bcrypt password hashing (12 rounds)
- Failed login attempt tracking
- Account lockout after multiple failures (15 min)
- Permanent SysAdmin token support

---

#### GET /api/auth/me
**Description**: Get current authenticated user profile

**Headers**:
```
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "employee"
  }
}
```

---

#### POST /api/auth/logout
**Description**: Logout current user (client-side token invalidation)

**Headers**:
```
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "message": "Logout effettuato con successo",
  "note": "Token invalidato lato client"
}
```

---

#### GET /api/auth/test-users
**Description**: List test users (development only)

**Availability**: `NODE_ENV !== 'production'`

**Response (200 OK)**:
```json
{
  "message": "Utenti di test disponibili dal database",
  "users": [
    {
      "email": "admin@example.com",
      "role": "admin",
      "name": "Admin User",
      "password": "password123"
    }
  ]
}
```

---

### 1.2 Authorization Headers

All authenticated endpoints require:

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

Optional tenant context headers:
```http
X-Tenant-Slug: acme-corp
X-Organization-Slug: hr-department
```

---

## 2. Employee Management API

### 2.1 List Employees

#### GET /api/employees
**Description**: Get paginated list of employees with filtering

**Authentication**: Required
**Authorization**: employee-management:read permission

**Query Parameters**:
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20) - Items per page
- `search` (string) - Search by name, email, or position
- `department` (string) - Filter by department ID
- `status` (string) - Filter by status (active/inactive)

**Response (200 OK)**:
```json
{
  "success": true,
  "employees": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "department": "Engineering",
      "position": "Software Engineer",
      "startDate": "2024-01-15",
      "status": "Active",
      "salary": 75000,
      "vacationBalance": 25.0,
      "sickBalance": 10.0,
      "phone": "+1234567890",
      "manager": {
        "id": "uuid",
        "name": "Jane Smith",
        "email": "jane@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `500 Internal Server Error` - Server error

**Multi-Tenant Filtering**:
- Non-SysAdmin users: Automatic `tenant_id` filtering
- SysAdmin users: Can access all tenants

---

### 2.2 Get Employee by ID

#### GET /api/employees/:id
**Description**: Get detailed employee information

**Authentication**: Required
**Authorization**: employee-management:read permission with detail scope

**URL Parameters**:
- `id` (uuid) - Employee ID

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user": {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "is_active": true
    },
    "position": "Software Engineer",
    "startDate": "2024-01-15",
    "salary": 75000,
    "status": "active",
    "vacationBalance": 25.0,
    "sickBalance": 10.0,
    "manager": {
      "id": "uuid",
      "user": {
        "first_name": "Jane",
        "last_name": "Smith"
      }
    },
    "subordinates": [],
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Error Responses**:
- `404 Not Found` - Employee not found
- `403 Forbidden` - Cross-tenant access denied

---

### 2.3 Create Employee

#### POST /api/employees
**Description**: Create new employee profile

**Authentication**: Required
**Authorization**: employee-management:write permission with create scope

**Request Body**:
```json
{
  "userId": "uuid",
  "position": "Software Engineer",
  "startDate": "2024-01-15",
  "salary": 75000,
  "managerId": "uuid",
  "departmentId": "uuid",
  "vacationBalance": 25.0,
  "sickBalance": 10.0
}
```

**Required Fields**: `userId`, `position`, `startDate`

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "success.created",
  "data": {
    "id": "uuid",
    "user": { ... },
    "position": "Software Engineer",
    "startDate": "2024-01-15"
  }
}
```

**Error Responses**:
- `400 Bad Request` - Missing required fields
- `404 Not Found` - User or manager not found
- `409 Conflict` - Employee profile already exists

**Security Checks**:
- User must exist and belong to same tenant
- Manager must belong to same tenant
- Cannot create employee for different tenant (non-SysAdmin)

---

### 2.4 Update Employee

#### PUT /api/employees/:id
**Description**: Update employee information

**Authentication**: Required
**Authorization**: employee-management:write permission with update scope

**Request Body** (partial update):
```json
{
  "position": "Senior Software Engineer",
  "salary": 85000,
  "status": "active"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "success.updated",
  "data": { ... }
}
```

---

### 2.5 Delete Employee

#### DELETE /api/employees/:id
**Description**: Soft delete employee (sets status to inactive)

**Authentication**: Required
**Authorization**: employee-management:delete permission

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "success.deleted"
}
```

---

## 3. Organization Management API

### 3.1 Create Organization (Onboarding)

#### POST /api/organizations
**Description**: Create new organization with trial subscription

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Acme Corporation",
  "slug": "acme-corp",
  "domain": "acme.com",
  "industry": "technology",
  "size": "small",
  "country": "US",
  "timezone": "America/New_York",
  "currency": "USD"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Organization created successfully",
  "data": {
    "organization": {
      "id": "uuid",
      "name": "Acme Corporation",
      "slug": "acme-corp",
      "subscription_plan": "trial",
      "subscription_status": "trial",
      "trial_ends_at": "2024-02-24T10:00:00Z"
    }
  }
}
```

**Automatic Actions**:
- Creates organization with 30-day trial
- Adds creator as owner with admin permissions
- Updates user's `tenant_id`
- Initializes settings with basic features

**Error Responses**:
- `400 Bad Request` - Slug already taken

---

### 3.2 Get Current Organization

#### GET /api/organizations/current
**Description**: Get current user's organization details

**Authentication**: Required
**Tenant Context**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "organization": {
      "organization_id": "uuid",
      "name": "Acme Corporation",
      "slug": "acme-corp",
      "industry": "technology",
      "size": "small",
      "subscription_plan": "trial",
      "subscription_status": "trial",
      "trial_ends_at": "2024-02-24T10:00:00Z",
      "members": [
        {
          "member_id": "uuid",
          "role": "owner",
          "is_primary": true,
          "user": {
            "id": "uuid",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@acme.com"
          }
        }
      ]
    }
  }
}
```

---

### 3.3 Update Current Organization

#### PUT /api/organizations/current
**Description**: Update organization settings

**Authentication**: Required
**Authorization**: organization-management:write permission

**Request Body**:
```json
{
  "name": "Acme Corp International",
  "industry": "technology",
  "timezone": "Europe/London",
  "settings": {
    "features": ["advanced_analytics"]
  }
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Organization updated successfully",
  "data": {
    "organization": { ... }
  }
}
```

---

### 3.4 Organization Members

#### GET /api/organizations/members
**Description**: List organization members with pagination

**Query Parameters**:
- `page` (integer, default: 1)
- `limit` (integer, default: 20)
- `role` (string) - Filter by role
- `status` (string, default: "active")

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "member_id": "uuid",
        "role": "employee",
        "department": "Engineering",
        "is_primary": false,
        "joined_at": "2024-01-15T10:00:00Z",
        "user": {
          "id": "uuid",
          "first_name": "John",
          "last_name": "Doe",
          "email": "john@acme.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

---

### 3.5 Invite Member

#### POST /api/organizations/members/invite
**Description**: Invite user to organization

**Authentication**: Required
**Authorization**: organization-management:write with invite_members scope

**Request Body**:
```json
{
  "email": "newuser@acme.com",
  "role": "employee",
  "department": "Engineering",
  "permissions": {
    "view_analytics": true
  }
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "User added to organization successfully",
  "data": {
    "membership": { ... }
  }
}
```

**Error Responses**:
- `400 Bad Request` - User already member
- `501 Not Implemented` - Email invitations for new users

---

### 3.6 Organization Statistics

#### GET /api/organizations/stats
**Description**: Get organization statistics and metrics

**Authentication**: Required
**Tenant Context**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "members": {
      "active": 45,
      "total": 50,
      "by_role": {
        "owner": 1,
        "admin": 3,
        "manager": 8,
        "employee": 33
      }
    },
    "organization": {
      "created_at": "2024-01-15T10:00:00Z",
      "subscription_status": "trial",
      "subscription_plan": "trial",
      "trial_ends_at": "2024-02-24T10:00:00Z"
    }
  }
}
```

---

### 3.7 SysAdmin Organization Endpoints

#### GET /api/organizations
**Description**: List all organizations (SysAdmin only)

**Authorization**: SysAdmin role required

**Response**: List of all organizations across tenants

---

#### GET /api/organizations/:id
**Description**: Get organization by ID (SysAdmin)

---

#### POST /api/organizations/admin
**Description**: Create organization (SysAdmin)

---

#### PUT /api/organizations/:id
**Description**: Update organization (SysAdmin)

---

#### DELETE /api/organizations/:id
**Description**: Delete organization (SysAdmin)

---

## 4. Leave Management API

### 4.1 Create Leave Request

#### POST /api/leave/requests
**Description**: Create new leave request

**Authentication**: Required
**Role**: Any authenticated user

**Request Body**:
```json
{
  "employeeId": "uuid",
  "leaveTypeId": "uuid",
  "startDate": "2024-06-01",
  "endDate": "2024-06-05",
  "reason": "Family vacation",
  "totalDays": 5
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "leaveRequest": {
      "id": "uuid",
      "status": "pending",
      "startDate": "2024-06-01",
      "endDate": "2024-06-05",
      "totalDays": 5
    }
  }
}
```

---

### 4.2 Get Leave Requests

#### GET /api/leave/requests
**Description**: List leave requests (role-based filtering)

**Authentication**: Required

**Query Parameters**:
- `status` (string) - Filter by status (pending/approved/rejected)
- `employeeId` (uuid) - Filter by employee
- `startDate` (date) - Filter from date
- `endDate` (date) - Filter to date

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "uuid",
        "employee": { ... },
        "leaveType": "Annual Leave",
        "startDate": "2024-06-01",
        "endDate": "2024-06-05",
        "status": "pending",
        "totalDays": 5
      }
    ]
  }
}
```

---

### 4.3 Approve Leave Request

#### PUT /api/leave/requests/:id/approve
**Description**: Approve pending leave request

**Authentication**: Required
**Authorization**: manager or hr role

**Request Body**:
```json
{
  "approverComments": "Approved for team capacity"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Leave request approved",
  "data": {
    "leaveRequest": {
      "id": "uuid",
      "status": "approved",
      "approvedBy": "uuid",
      "approvedAt": "2024-01-20T10:00:00Z"
    }
  }
}
```

---

### 4.4 Reject Leave Request

#### PUT /api/leave/requests/:id/reject
**Description**: Reject pending leave request

**Authentication**: Required
**Authorization**: manager or hr role

**Request Body**:
```json
{
  "rejectionReason": "Insufficient coverage during period"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Leave request rejected"
}
```

---

### 4.5 Get Leave Balance

#### GET /api/leave/balance/:employeeId
**Description**: Get employee leave balance

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "employeeId": "uuid",
    "balances": {
      "vacation": {
        "total": 25.0,
        "used": 10.0,
        "remaining": 15.0
      },
      "sick": {
        "total": 10.0,
        "used": 2.0,
        "remaining": 8.0
      }
    },
    "year": 2024
  }
}
```

---

## 5. HR Copilot API

### 5.1 Copilot Info

#### GET /api/copilot
**Description**: Get HR Copilot capabilities and endpoints

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "message": "HR Copilot - AI Assistant per HR",
  "version": "1.0",
  "capabilities": [
    "Q&A su policy HR aziendali",
    "Ricerca semantica nella knowledge base",
    "Risposte contestualizzate e personalizzate",
    "Supporto multilingue (IT/EN)"
  ],
  "endpoints": {
    "POST /api/copilot/ask": "Fai una domanda all'HR Copilot",
    "GET /api/copilot/topics": "Lista argomenti disponibili"
  },
  "knowledgeBase": [
    "Politica ferie e permessi",
    "Processo di recruiting",
    "Gestione performance",
    "Policy formazione e sviluppo"
  ]
}
```

---

### 5.2 Ask HR Copilot

#### POST /api/copilot/ask
**Description**: Ask question to HR Copilot

**Authentication**: Required

**Request Body**:
```json
{
  "question": "What is the company's remote work policy?",
  "language": "en"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "answer": "According to company policy, employees can work remotely up to 3 days per week...",
    "confidence": 0.95,
    "sources": [
      {
        "document": "Remote Work Policy 2024",
        "section": "Eligibility and Guidelines"
      }
    ],
    "relatedTopics": ["hybrid-work", "office-requirements"]
  }
}
```

---

### 5.3 Get Available Topics

#### GET /api/copilot/topics
**Description**: List available knowledge base topics

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": "leave-policy",
        "name": "Leave & Time Off Policy",
        "description": "Annual leave, sick leave, and other time off policies"
      },
      {
        "id": "recruitment",
        "name": "Recruitment Process",
        "description": "Hiring procedures and guidelines"
      }
    ]
  }
}
```

---

### 5.4 Enhanced Query

#### POST /api/copilot/enhanced/query
**Description**: Process natural language query with enhanced AI

**Authentication**: Optional (uses default user if not authenticated)

**Request Body**:
```json
{
  "query": "How many vacation days do I have left?",
  "context": {
    "employeeId": "uuid",
    "department": "Engineering"
  }
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "type": "leave_balance",
    "message": "You have 15 vacation days remaining",
    "data": {
      "remaining": 15,
      "used": 10,
      "total": 25
    },
    "followUpSuggestions": [
      "Request time off",
      "View leave history"
    ]
  },
  "processedAt": "2024-01-24T10:00:00Z"
}
```

---

### 5.5 Chat Interface

#### POST /api/copilot/chat
**Description**: Enhanced chat with conversation context

**Authentication**: Optional

**Request Body**:
```json
{
  "message": "I need to take time off next month",
  "conversationId": "conv_12345",
  "context": {
    "previousMessages": []
  }
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "I can help you request time off. How many days do you need?",
    "type": "leave_request_assistance",
    "suggestions": [
      "1-3 days",
      "1 week",
      "2 weeks"
    ],
    "conversationId": "conv_12345",
    "timestamp": "2024-01-24T10:00:00Z"
  }
}
```

---

## 6. Common Response Patterns

### 6.1 Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### 6.2 Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### 6.3 Pagination Pattern
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## 7. Error Codes Reference

### Authentication Errors
- `NO_TOKEN` - Missing authorization token
- `TOKEN_EXPIRED` - JWT token has expired
- `INVALID_TOKEN` - Token signature invalid
- `INVALID_CREDENTIALS` - Wrong email/password
- `ACCOUNT_LOCKED` - Account locked after failed attempts

### Authorization Errors
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `CROSS_TENANT_ACCESS_DENIED` - Cross-tenant operation not allowed
- `SYSADMIN_ONLY` - Endpoint requires SysAdmin role
- `CROSS_TENANT_MANAGER` - Manager must be from same tenant

### Resource Errors
- `NOT_FOUND` - Resource not found
- `ALREADY_EXISTS` - Resource already exists
- `SLUG_TAKEN` - Organization slug already in use
- `ALREADY_MEMBER` - User already organization member

### Validation Errors
- `VALIDATION_ERROR` - Request validation failed
- `MISSING_REQUIRED_FIELDS` - Required fields missing

### Feature Errors
- `FEATURE_NOT_IMPLEMENTED` - Feature not yet available

---

## 8. Rate Limiting

**Current Status**: ⚠️ Not implemented

**Recommended Implementation**:
- **Window**: 15 minutes
- **Max Requests**: 100 per window per user
- **Response Header**: `X-RateLimit-Remaining`
- **Error Code**: `429 Too Many Requests`

---

## 9. API Security Best Practices

### For API Consumers:

1. **Token Management**:
   - Store JWT securely (HttpOnly cookies recommended)
   - Refresh tokens before expiration
   - Implement token rotation

2. **Request Security**:
   - Always use HTTPS in production
   - Include tenant context headers when available
   - Sanitize all user inputs

3. **Error Handling**:
   - Never expose error details to end users
   - Log failed requests for monitoring
   - Implement retry logic with exponential backoff

4. **Multi-Tenant Isolation**:
   - Always include tenant context headers
   - Verify tenant_id in responses
   - Never hardcode tenant identifiers

---

## 10. Postman Collection

**Collection Structure**:
```
AI-HRMS-2025/
├── Authentication
│   ├── Login
│   ├── Get Current User
│   ├── Logout
│   └── Test Users (Dev)
├── Employees
│   ├── List Employees
│   ├── Get Employee
│   ├── Create Employee
│   ├── Update Employee
│   └── Delete Employee
├── Organizations
│   ├── Create Organization
│   ├── Get Current Org
│   ├── Update Current Org
│   ├── List Members
│   ├── Invite Member
│   └── Get Stats
├── Leave Management
│   ├── Create Leave Request
│   ├── List Leave Requests
│   ├── Approve Leave
│   ├── Reject Leave
│   └── Get Leave Balance
└── HR Copilot
    ├── Copilot Info
    ├── Ask Question
    ├── Get Topics
    ├── Enhanced Query
    └── Chat
```

**Environment Variables**:
```json
{
  "baseUrl": "http://localhost:3000/api",
  "authToken": "{{token}}",
  "tenantSlug": "acme-corp",
  "organizationSlug": "engineering"
}
```

---

## 11. API Changelog

### v1.0 (Current)
- ✅ JWT authentication with bcrypt
- ✅ Employee CRUD operations
- ✅ Organization management
- ✅ Leave request workflow
- ✅ HR Copilot AI assistant
- ✅ Multi-tenant data isolation
- ✅ Role-based access control

### Future Enhancements
- [ ] API versioning (/api/v1/)
- [ ] Rate limiting implementation
- [ ] CSRF protection
- [ ] Refresh token rotation
- [ ] GraphQL endpoint
- [ ] Webhook subscriptions
- [ ] Batch operations

---

**Document Status**: ✅ Complete - Based on live route analysis
**API Version**: 1.0 (January 2025)
**Last Updated**: January 24, 2025