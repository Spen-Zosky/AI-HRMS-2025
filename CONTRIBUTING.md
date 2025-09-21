# Contributing to AI-HRMS-2025

Thank you for your interest in contributing to AI-HRMS-2025! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (LTS recommended)
- PostgreSQL 12+
- Git
- Basic knowledge of React, Node.js, and PostgreSQL

### Development Setup
1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Set up your environment variables (see `.env.example`)
5. Run database migrations: `npx sequelize-cli db:migrate`
6. Start development server: `npm run dev`

## 📋 Development Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/your-feature-name` - Individual features
- `hotfix/issue-description` - Critical bug fixes
- `release/version-number` - Release preparation

### Making Changes
1. Create a feature branch from `develop`
2. Make your changes following our coding standards
3. Add tests for new functionality
4. Ensure all tests pass: `npm test`
5. Update documentation if needed
6. Submit a pull request

### Commit Messages
Use conventional commit format:
- `feat: add new HR analytics feature`
- `fix: resolve CV parsing issue`
- `docs: update API documentation`
- `test: add unit tests for skills matching`
- `refactor: improve database query performance`

## 🧪 Testing

### Running Tests
```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run with coverage report
npm run test:ai          # Test AI providers
```

### Test Guidelines
- Write unit tests for all new functions
- Add integration tests for API endpoints
- Mock external services (OpenAI, Anthropic, etc.)
- Maintain >80% code coverage

## 📊 Code Standards

### JavaScript/Node.js
- Use ES6+ features
- Follow ESLint configuration
- Use async/await over promises
- Handle errors properly
- Add JSDoc comments for complex functions

### React/Frontend
- Use functional components with hooks
- Follow Material-UI design patterns
- Implement responsive design
- Use proper prop validation
- Optimize bundle size

### Database
- Use Sequelize ORM for all database operations
- Write proper migrations for schema changes
- Include both up and down migrations
- Use proper foreign key relationships
- Add appropriate indexes

## 🏗️ Architecture Guidelines

### Multi-Tenant Structure
Follow the three-tier architecture:
```
TENANTS (Enterprise Customers)
├── ORGANIZATIONS (Departments/Business Units)
└── USERS (Employees)
```

### API Design
- Use RESTful conventions
- Implement proper HTTP status codes
- Add request validation
- Include comprehensive error handling
- Document with Swagger/OpenAPI

### Security
- Never commit sensitive data
- Use environment variables for secrets
- Implement proper authentication/authorization
- Validate all user inputs
- Follow OWASP guidelines

## 📖 Documentation

### Code Documentation
- Add JSDoc comments for functions
- Document API endpoints
- Update README.md for major changes
- Include inline comments for complex logic

### API Documentation
- Use Swagger/OpenAPI specifications
- Include request/response examples
- Document error responses
- Provide integration examples

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Screenshots if applicable
- Console logs/error messages

### Bug Report Template
```markdown
## Bug Description
Brief description of the issue

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- OS: [e.g. macOS 12.0]
- Node.js: [e.g. 18.15.0]
- Browser: [e.g. Chrome 98.0]
- Version: [e.g. 1.0.0]

## Additional Context
Add any other context about the problem here
```

## ✨ Feature Requests

### Feature Request Template
```markdown
## Feature Description
Clear and concise description of the feature

## Problem Statement
What problem does this feature solve?

## Proposed Solution
Detailed description of the proposed solution

## Alternative Solutions
Alternative approaches considered

## Additional Context
Any additional context, mockups, or examples
```

## 🔄 Pull Request Process

### Before Submitting
- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No sensitive data included
- [ ] Branch is up-to-date with develop

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Other: ___________

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

## 🎯 Sprint Planning

Check the project development progress tracker for current sprint status and upcoming features:
- Sprint 1-5: Completed (83.3%)
- Sprint 6: Polish & Deployment (In Progress)

## 📞 Getting Help

- **Documentation**: Check `docs/` folder
- **Issues**: Search existing issues before creating new ones
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: Request reviews from maintainers

## 🏆 Recognition

Contributors will be acknowledged in:
- README.md contributors section
- Release notes
- GitHub contributor graphs
- Special recognition for significant contributions

## 📄 License

By contributing to AI-HRMS-2025, you agree that your contributions will be licensed under the ISC License.

---

Thank you for contributing to AI-HRMS-2025! Together we're building the future of HR technology. 🚀