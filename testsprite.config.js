/**
 * TestSprite Configuration for AI-HRMS-2025
 * Comprehensive testing setup for Express.js + EJS application
 */

module.exports = {
  // Project Information
  project: {
    name: "AI-HRMS-2025",
    version: "1.3.0",
    description: "Enterprise-grade AI-powered Human Resource Management System",
    type: "express-ejs",
    framework: "express"
  },

  // Server Configuration
  server: {
    host: "localhost",
    port: 3000,
    baseUrl: "http://localhost:3000",
    healthCheck: "/health",
    startup: {
      command: "npm start",
      timeout: 30000,
      waitForLog: "Server running on port"
    }
  },

  // Test Environment
  environment: {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://test:test@localhost:5432/ai_hrms_test",
    JWT_SECRET: "test-jwt-secret-key",
    PORT: 3001
  },

  // Testing Scope
  testScope: {
    // API Endpoints to Test
    api: {
      health: "/health",
      auth: [
        "/api/auth/login",
        "/api/auth/register"
      ],
      employees: [
        "/api/employees",
        "/api/employees/:id"
      ],
      analytics: [
        "/api/analytics/dashboard",
        "/api/analytics/retention"
      ],
      copilot: [
        "/api/copilot/query",
        "/api/copilot/enhanced/query"
      ]
    },

    // Static Assets
    static: [
      "/css/style.css",
      "/js/main.js",
      "/images/"
    ],

    // EJS Views (if accessible)
    views: [
      "/",
      "/dashboard",
      "/employees",
      "/reports"
    ]
  },

  // Test Categories
  tests: {
    // Unit Tests
    unit: {
      enabled: true,
      pattern: "tests/**/*.test.js",
      framework: "jest",
      coverage: true,
      timeout: 10000
    },

    // Integration Tests
    integration: {
      enabled: true,
      database: true,
      endpoints: true,
      middleware: true,
      timeout: 30000
    },

    // API Tests
    api: {
      enabled: true,
      authentication: true,
      validation: true,
      errorHandling: true,
      rateLimit: false, // Not implemented yet
      timeout: 15000
    },

    // Performance Tests
    performance: {
      enabled: true,
      loadTest: {
        users: 10,
        duration: "30s",
        endpoints: ["/health", "/api/employees"]
      },
      responseTime: {
        threshold: 2000 // 2 seconds
      }
    },

    // Security Tests
    security: {
      enabled: true,
      sqlInjection: true,
      xss: true,
      csrf: false, // Not implemented yet
      authBypass: true,
      timeout: 20000
    },

    // Accessibility Tests
    accessibility: {
      enabled: false, // EJS templates not directly accessible
      standard: "WCAG2.1"
    }
  },

  // Database Testing
  database: {
    enabled: true,
    type: "postgresql",
    migrations: true,
    seeders: true,
    cleanup: true,
    testData: {
      users: 5,
      employees: 20,
      organizations: 2
    }
  },

  // AI/ML Testing
  ai: {
    enabled: true,
    mocking: true, // Mock AI providers for testing
    providers: ["openai", "anthropic", "ollama"],
    endpoints: [
      "/api/ats/parse-cv",
      "/api/analytics/predict-retention",
      "/api/copilot/enhanced/query"
    ],
    timeout: 45000
  },

  // File Upload Testing
  fileUpload: {
    enabled: true,
    types: ["pdf", "docx", "txt"],
    maxSize: "10MB",
    endpoints: [
      "/api/ats/upload-cv",
      "/api/employees/upload-document"
    ]
  },

  // Reporting
  reporting: {
    formats: ["json", "html", "junit"],
    output: "./test-reports",
    coverage: {
      enabled: true,
      threshold: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70
      }
    },
    screenshots: true,
    videos: false
  },

  // Current Implementation Status
  implementation: {
    // ✅ Implemented Features
    completed: [
      "express-server",
      "database-models",
      "hierarchy-system",
      "health-endpoint",
      "logging",
      "cors-helmet",
      "static-assets",
      "ejs-templating"
    ],

    // 🚧 Partial Implementation
    partial: [
      "api-routes", // Routes defined but controllers missing
      "authentication", // JWT setup but no implementation
      "database-connection" // Config exists but not used
    ],

    // ❌ Not Implemented
    missing: [
      "react-frontend",
      "ai-services",
      "vector-database",
      "user-management",
      "employee-crud",
      "analytics-engine",
      "report-generation"
    ]
  },

  // TestSprite Specific Settings
  testsprite: {
    apiKey: process.env.TESTSPRITE_API_KEY || "sk-user-N0MfmwUokT9T9n-FaRlnmcv--Kh43LC0X0yz4OcJ51QeLs2EPj0FEior3beoBa5rZRifCv5lPOoaRqhSkl3qx32Eo72HXUnieGV-1aq8IBUMT83XjHb3jbVfr494QxwxfMs",
    retries: 3,
    parallel: false, // Sequential testing for stability
    browser: {
      headless: true,
      viewport: { width: 1280, height: 720 }
    },
    timeout: {
      default: 30000,
      navigation: 45000,
      element: 10000
    }
  },

  // Mock Services for Testing
  mocks: {
    ai: {
      openai: {
        response: "Mock AI response for testing",
        cost: 0.001
      },
      anthropic: {
        response: "Mock Claude response for testing",
        cost: 0.001
      }
    },
    database: {
      employees: [
        { id: 1, name: "Test Employee", email: "test@company.com" },
        { id: 2, name: "Jane Doe", email: "jane@company.com" }
      ]
    },
    vector: {
      similarity: 0.85,
      results: ["skill1", "skill2", "skill3"]
    }
  },

  // Cleanup
  cleanup: {
    afterEach: true,
    afterAll: true,
    database: true,
    uploads: true,
    logs: false
  }
};