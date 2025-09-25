# Darling DBMS Management Dashboard

A modern, minimalist database management console for the AI-HRMS system with real-time monitoring and comprehensive database operations.

## Features

### 🎨 **Darling Theme**
- Modern dark console aesthetic
- Compact, space-efficient design
- Single-color SVG icons (no emojis)
- Professional DevOps appearance
- Fully responsive layout

### 🔧 **Database Management**
- **Real-time Connection Monitoring**: Live database status and health checks
- **Query Execution**: Safe SQL query execution with validation
- **Migration Management**: Run, rollback, and monitor database migrations
- **Seeder Control**: Execute and manage database seeders
- **Schema Overview**: Real-time table statistics and information

### 📊 **Performance Monitoring**
- CPU and memory usage tracking
- Active connection monitoring
- Real-time performance metrics
- Connection pool statistics

### 🔍 **Activity Tracking**
- Comprehensive audit logging
- Recent activity monitoring
- Operation status tracking
- Real-time notifications

## Architecture

### Backend API (`/api/`)
- **Node.js/Express** server with real Sequelize integration
- **PostgreSQL** database connections
- **Rate limiting** and security measures
- **Audit logging** for all operations
- **RESTful API** design

### Frontend (`/public/`)
- **Vanilla JavaScript** with modular architecture
- **CSS Grid** layout system
- **Real-time updates** via polling
- **Interactive widgets** with live data
- **Responsive design** for all screen sizes

## Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL database
- Existing AI-HRMS project structure

### 1. Install Dependencies
```bash
cd /home/enzo/AI-HRMS-2025/.legacy/legacy_interfaces/dbms_supabase/api
npm install
```

### 2. Configure Environment
The API automatically uses the existing database configuration from:
- `/home/enzo/AI-HRMS-2025/src/config/database.js`

### 3. Start the API Server
```bash
cd api/
npm start
# or for development
npm run dev
```

### 4. Access the Dashboard
Open your browser to:
- **Dashboard**: http://localhost:3001/index.html
- **API Health**: http://localhost:3001/api/health

## API Endpoints

### Database Operations
- `GET /api/database/status` - Connection status and health
- `GET /api/database/tables` - List all tables with statistics
- `POST /api/database/query` - Execute safe SQL queries
- `GET /api/database/schema` - Get database schema information

### Migration Management
- `GET /api/migrations/status` - List migration status
- `POST /api/migrations/run` - Execute pending migrations
- `POST /api/migrations/rollback` - Rollback migrations

### Seeder Management
- `GET /api/seeders/list` - List available seeders
- `POST /api/seeders/run` - Execute specific seeders
- `POST /api/seeders/undo` - Undo seeder operations

### Monitoring & Logs
- `GET /api/environments` - List available environments
- `GET /api/logs/audit` - Retrieve audit logs
- `GET /api/health` - API health check

## File Structure

```
dbms_supabase/
├── api/
│   ├── server.js          # Main Express server
│   ├── package.json       # API dependencies
│   └── logs/              # Audit logs directory
├── public/
│   ├── index.html         # Main dashboard interface
│   ├── darling-theme.css  # Complete theme stylesheet
│   ├── darling-config.js  # Configuration settings
│   ├── api-client.js      # API client library
│   ├── darling-console.js # Base console functionality
│   └── dashboard.js       # Enhanced dashboard with real data
└── README.md              # This documentation
```

## Widget System

### Connection Status Widget
- Real-time database connection monitoring
- Connection pool statistics
- Environment information
- Uptime tracking

### Command Execution Widget
- Interactive SQL query editor
- Query validation and execution
- Results display with table formatting
- Query history management

### Performance Monitor Widget
- CPU and memory usage (simulated)
- Active connection tracking
- Performance metrics visualization
- Threshold-based status indicators

### Recent Activity Widget
- Live audit log feed
- Operation status updates
- Timestamped activity entries
- Error and success tracking

### Schema Overview Widget
- Live table statistics
- Row counts and table sizes
- Top tables by activity
- Schema information display

### Migration Status Widget
- Current migration version
- Pending migration count
- Migration execution controls
- Migration history access

## Security Features

- **Query Validation**: Only safe SELECT, SHOW, DESCRIBE, EXPLAIN queries allowed
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Audit Logging**: All operations logged with timestamps and user attribution
- **Input Sanitization**: Protection against SQL injection
- **Environment Isolation**: Separate configurations for different environments

## Configuration

### Environment Variables
- `DBMS_API_PORT` - API server port (default: 3001)
- `NODE_ENV` - Environment name (development/staging/production)

### Theme Customization
Edit `darling-config.js` to customize:
- Color schemes and themes
- Widget refresh intervals
- Performance thresholds
- Notification settings
- Security policies

## Integration with AI-HRMS

This dashboard is designed to work seamlessly with the existing AI-HRMS system:

- **Database Configuration**: Uses existing `src/config/database.js`
- **Sequelize Integration**: Leverages existing ORM setup
- **Seeders**: Works with seeders in `/seeders/` directory
- **Migrations**: Integrates with Sequelize CLI migrations
- **Non-invasive**: Completely separate in `.legacy/legacy_interfaces/`

## Development

### Adding New Widgets
1. Create widget class extending `DashboardWidget`
2. Add widget initialization in `dashboard.js`
3. Update HTML structure in `index.html`
4. Add styling in `darling-theme.css`

### API Extensions
1. Add new routes in `server.js`
2. Update `api-client.js` with new methods
3. Add audit logging for new operations
4. Update security validations as needed

### Theme Customization
- Modify CSS custom properties in `darling-theme.css`
- Update color palette in `:root` selector
- Adjust spacing and typography variables
- Customize component styles

## Troubleshooting

### Common Issues
1. **Connection Failed**: Check database configuration and credentials
2. **API Not Starting**: Verify Node.js version and dependencies
3. **Queries Failing**: Ensure database permissions and query syntax
4. **Widgets Not Loading**: Check browser console for JavaScript errors

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` and checking:
- Browser console for frontend errors
- API server logs for backend issues
- Network tab for API request/response details

## License

MIT License - Part of the AI-HRMS 2025 project.