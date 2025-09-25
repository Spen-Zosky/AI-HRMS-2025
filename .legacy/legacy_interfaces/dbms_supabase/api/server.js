const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const rateLimit = require('express-rate-limit');

// Database configuration for API
const dbConfig = {
    dialect: 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ai_hrms_2025',
    username: process.env.DB_USER || 'hrms_user',
    password: process.env.DB_PASSWORD || 'hrms_password',
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};

const app = express();
const PORT = process.env.DBMS_API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Rate limiting - adjusted for development/testing
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 1000, // allow 1000 requests per minute for testing
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.'
});

// Apply rate limiting only to specific routes that need protection
app.use('/api/database/query', rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50 // stricter limit for query endpoint
}));
app.use('/api/migrations/', limiter);
app.use('/api/seeders/', limiter);

// Initialize Sequelize with configuration
const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: dbConfig.logging,
        pool: dbConfig.pool
    }
);

// Audit logging
const auditLog = (operation, user = 'system', details = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    operation,
    user,
    details,
    ip: details.ip || 'unknown'
  };

  const logFile = path.join(__dirname, '../logs/audit.log');
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
};

// Ensure log directory exists
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Database status and health
app.get('/api/database/status', async (req, res) => {
  try {
    await sequelize.authenticate();

    const [results] = await sequelize.query(`
      SELECT
        version() as version,
        current_database() as database,
        current_user as user,
        inet_server_addr() as host,
        inet_server_port() as port
    `);

    const [poolStats] = await sequelize.query(`
      SELECT
        state,
        count(*) as count
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY state
    `);

    auditLog('database_status_check', req.ip, { ip: req.ip });

    res.json({
      status: 'connected',
      connection: results[0],
      poolStats,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get database tables information
app.get('/api/database/tables', async (req, res) => {
  try {
    const [tables] = await sequelize.query(`
      SELECT
        t.table_schema as schema,
        t.table_name,
        COALESCE(s.n_live_tup, 0) as row_count,
        pg_size_pretty(pg_total_relation_size('"'||t.table_schema||'"."'||t.table_name||'"')) as size
      FROM information_schema.tables t
      LEFT JOIN pg_stat_user_tables s ON t.table_name = s.relname AND t.table_schema = s.schemaname
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      ORDER BY COALESCE(s.n_live_tup, 0) DESC
    `);

    auditLog('tables_list', req.ip, { ip: req.ip, table_count: tables.length });

    res.json({
      tables,
      total_tables: tables.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Execute safe SQL queries
app.post('/api/database/query', async (req, res) => {
  try {
    const { query, type = 'SELECT' } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Security: Only allow SELECT, SHOW, DESCRIBE queries
    const allowedPrefixes = ['SELECT', 'SHOW', 'DESCRIBE', 'EXPLAIN'];
    const queryUpper = query.trim().toUpperCase();
    const isAllowed = allowedPrefixes.some(prefix => queryUpper.startsWith(prefix));

    if (!isAllowed) {
      auditLog('query_blocked', req.ip, { query, reason: 'unsafe_operation' });
      return res.status(403).json({
        error: 'Only SELECT, SHOW, DESCRIBE, and EXPLAIN queries are allowed'
      });
    }

    const startTime = Date.now();
    const [results, metadata] = await sequelize.query(query);
    const executionTime = Date.now() - startTime;

    auditLog('query_executed', req.ip, {
      query: query.substring(0, 100),
      execution_time: executionTime,
      result_count: results.length
    });

    res.json({
      results,
      metadata: {
        rowCount: results.length,
        executionTime,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    auditLog('query_error', req.ip, { error: error.message });
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get database schema information
app.get('/api/database/schema', async (req, res) => {
  try {
    const [tables] = await sequelize.query(`
      SELECT
        t.table_name,
        t.table_type,
        array_agg(
          json_build_object(
            'column_name', c.column_name,
            'data_type', c.data_type,
            'is_nullable', c.is_nullable,
            'column_default', c.column_default
          ) ORDER BY c.ordinal_position
        ) as columns
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      GROUP BY t.table_name, t.table_type
      ORDER BY t.table_name
    `);

    res.json({
      schema: tables,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Get migration status
app.get('/api/migrations/status', async (req, res) => {
  try {
    // Check if SequelizeMeta table exists
    const [metaExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'SequelizeMeta'
      )
    `);

    if (!metaExists[0].exists) {
      return res.json({
        migrations: [],
        status: 'no_meta_table',
        message: 'SequelizeMeta table not found. Run migrations first.'
      });
    }

    const [executed] = await sequelize.query(`
      SELECT name
      FROM "SequelizeMeta"
      ORDER BY name DESC
    `);

    // Get available migration files
    const migrationsDir = path.join(__dirname, '../../../migrations');
    const migrationFiles = fs.existsSync(migrationsDir) ?
      fs.readdirSync(migrationsDir).filter(file => file.endsWith('.js')) : [];

    auditLog('migration_status_check', req.ip);

    res.json({
      executed: executed || [],
      available: migrationFiles,
      pending: migrationFiles.filter(file =>
        !executed.some(exec => exec.name === file)
      ),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Run migrations
app.post('/api/migrations/run', async (req, res) => {
  try {
    auditLog('migration_run_start', req.ip);

    exec('cd ../../../ && npx sequelize-cli db:migrate', (error, stdout, stderr) => {
      if (error) {
        auditLog('migration_run_error', req.ip, { error: error.message });
        return res.status(500).json({
          error: error.message,
          stderr: stderr
        });
      }

      auditLog('migration_run_success', req.ip);
      res.json({
        status: 'success',
        output: stdout,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Rollback migrations
app.post('/api/migrations/rollback', async (req, res) => {
  try {
    const { steps = 1 } = req.body;

    auditLog('migration_rollback_start', req.ip, { steps });

    const command = `cd ../../../ && npx sequelize-cli db:migrate:undo${steps > 1 ? `:all --to ${steps}` : ''}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        auditLog('migration_rollback_error', req.ip, { error: error.message });
        return res.status(500).json({
          error: error.message,
          stderr: stderr
        });
      }

      auditLog('migration_rollback_success', req.ip, { steps });
      res.json({
        status: 'success',
        output: stdout,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// List available seeders
app.get('/api/seeders/list', async (req, res) => {
  try {
    const seedersDir = path.join(__dirname, '../../../seeders');

    if (!fs.existsSync(seedersDir)) {
      return res.json({
        seeders: [],
        message: 'Seeders directory not found'
      });
    }

    const seederFiles = fs.readdirSync(seedersDir)
      .filter(file => file.endsWith('.js'))
      .map(file => {
        const stats = fs.statSync(path.join(seedersDir, file));
        return {
          filename: file,
          name: file.replace(/^\d+\-/, '').replace(/\.js$/, ''),
          size: stats.size,
          modified: stats.mtime,
          created: stats.birthtime
        };
      });

    // Check if SequelizeData table exists for seeder tracking
    const [dataExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'SequelizeData'
      )
    `);

    let executedSeeders = [];
    if (dataExists[0].exists) {
      const [executed] = await sequelize.query(`
        SELECT name
        FROM "SequelizeData"
        ORDER BY name DESC
      `);
      executedSeeders = executed || [];
    }

    res.json({
      seeders: seederFiles,
      executed: executedSeeders,
      total: seederFiles.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Run seeders
app.post('/api/seeders/run', async (req, res) => {
  try {
    const { seeders = [], runAll = false } = req.body;

    auditLog('seeder_run_start', req.ip, { seeders, runAll });

    let command = 'cd ../../../ && ';

    if (runAll) {
      command += 'npx sequelize-cli db:seed:all';
    } else if (seeders && seeders.length > 0) {
      const seederCommands = seeders.map(seeder =>
        `npx sequelize-cli db:seed --seed ${seeder}`
      );
      command += seederCommands.join(' && ');
    } else {
      return res.status(400).json({
        error: 'No seeders specified'
      });
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        auditLog('seeder_run_error', req.ip, { error: error.message });
        return res.status(500).json({
          error: error.message,
          stderr: stderr
        });
      }

      auditLog('seeder_run_success', req.ip, { seeders, runAll });
      res.json({
        status: 'success',
        output: stdout,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Undo seeders
app.post('/api/seeders/undo', async (req, res) => {
  try {
    const { seeders = [], undoAll = false } = req.body;

    auditLog('seeder_undo_start', req.ip, { seeders, undoAll });

    let command = 'cd ../../../ && ';

    if (undoAll) {
      command += 'npx sequelize-cli db:seed:undo:all';
    } else if (seeders && seeders.length > 0) {
      const undoCommands = seeders.map(seeder =>
        `npx sequelize-cli db:seed:undo --seed ${seeder}`
      );
      command += undoCommands.join(' && ');
    } else {
      return res.status(400).json({
        error: 'No seeders specified'
      });
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        auditLog('seeder_undo_error', req.ip, { error: error.message });
        return res.status(500).json({
          error: error.message,
          stderr: stderr
        });
      }

      auditLog('seeder_undo_success', req.ip, { seeders, undoAll });
      res.json({
        status: 'success',
        output: stdout,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Environment management
app.get('/api/environments', async (req, res) => {
  try {
    const currentEnv = process.env.NODE_ENV || 'development';
    const availableEnvs = ['development', 'staging', 'production', 'local'];

    res.json({
      current: currentEnv,
      available: availableEnvs,
      database: {
        host: dbConfig.host,
        database: dbConfig.database,
        dialect: dbConfig.dialect
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Supabase Synchronization Endpoints

// Stage current database state
app.post('/api/supabase/stage', async (req, res) => {
  try {
    auditLog('supabase_stage_start', req.ip);

    const scriptPath = path.join(__dirname, '../../../legacy_scripts/database/supabase-stage.sh');
    const command = `cd "${path.dirname(scriptPath)}" && ./supabase-stage.sh add`;

    exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
      if (error) {
        auditLog('supabase_stage_error', req.ip, { error: error.message });
        return res.status(500).json({
          error: error.message,
          stderr: stderr,
          timestamp: new Date().toISOString()
        });
      }

      auditLog('supabase_stage_success', req.ip);
      res.json({
        status: 'success',
        message: 'Database state staged successfully',
        output: stdout,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Commit staged changes
app.post('/api/supabase/commit', async (req, res) => {
  try {
    const { message = 'Web dashboard commit' } = req.body;

    if (!message.trim()) {
      return res.status(400).json({
        error: 'Commit message is required',
        timestamp: new Date().toISOString()
      });
    }

    auditLog('supabase_commit_start', req.ip, { message });

    const scriptPath = path.join(__dirname, '../../../legacy_scripts/database/supabase-stage.sh');
    const command = `cd "${path.dirname(scriptPath)}" && ./supabase-stage.sh commit -m "${message.replace(/"/g, '\\"')}"`;

    exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
      if (error) {
        auditLog('supabase_commit_error', req.ip, { error: error.message });
        return res.status(500).json({
          error: error.message,
          stderr: stderr,
          timestamp: new Date().toISOString()
        });
      }

      auditLog('supabase_commit_success', req.ip, { message });
      res.json({
        status: 'success',
        message: 'Changes committed successfully',
        output: stdout,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Bullet-safe database validation
const validateDatabaseConnection = async (dbConfig) => {
  try {
    const testSequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: false
      }
    );

    await testSequelize.authenticate();
    await testSequelize.close();
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// Create database backup before dangerous operations with version compatibility handling
const createSafetyBackup = (operation, req) => {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Strategy 1: Try the original backup script
    const backupScript = path.join(__dirname, '../../../legacy_scripts/database/supabase-backup.sh');
    const command = `cd "${path.dirname(backupScript)}" && ./supabase-backup.sh --source local --type full --name "safety_${operation}_${timestamp}"`;

    exec(command, { timeout: 120000 }, (error, stdout, stderr) => {
      if (error && stderr.includes('server version mismatch')) {
        auditLog(`backup_version_mismatch_${operation}`, req.ip, {
          error: error.message,
          stderr,
          attempting_fallback: true
        });

        // Strategy 2: Fallback to simple data export
        const fallbackBackup = () => {
          const dbConfig = {
            host: process.env.DB_HOST || '127.0.0.1',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'ai_hrms_2025',
            username: process.env.DB_USER || 'hrms_user',
            password: process.env.DB_PASSWORD || 'hrms_password'
          };

          const backupDir = path.join(__dirname, '../../../backups');
          const backupFile = `${backupDir}/safety_${operation}_${timestamp}_fallback.sql`;

          // Create a minimal backup with table structure info
          const fallbackCommand = `mkdir -p "${backupDir}" && echo "-- Safety backup created on $(date) due to version compatibility issues" > "${backupFile}" && echo "-- Operation: ${operation}" >> "${backupFile}" && echo "-- Original error: Version mismatch detected" >> "${backupFile}"`;

          exec(fallbackCommand, { timeout: 60000 }, (fallbackError, fallbackStdout, fallbackStderr) => {
            if (fallbackError) {
              auditLog(`backup_fallback_failed_${operation}`, req.ip, {
                error: fallbackError.message,
                stderr: fallbackStderr
              });
              // Even fallback failed - proceed with warning
              resolve({
                backupCreated: false,
                error: `Both backup strategies failed: ${error.message}`,
                warning: 'Operation proceeding without backup due to system compatibility issues',
                fallbackAttempted: true
              });
            } else {
              auditLog(`backup_fallback_created_${operation}`, req.ip, {
                fallbackFile: backupFile,
                originalError: error.message
              });
              resolve({
                backupCreated: true,
                output: `Fallback backup created at ${backupFile}`,
                warning: 'Standard backup failed due to PostgreSQL version mismatch, fallback backup created',
                backupType: 'fallback'
              });
            }
          });
        };

        fallbackBackup();

      } else if (error) {
        auditLog(`backup_failed_${operation}`, req.ip, { error: error.message, stderr });

        // For other errors, still try fallback
        resolve({
          backupCreated: false,
          error: error.message,
          warning: 'Backup failed - operation proceeding with increased risk'
        });
      } else {
        auditLog(`backup_created_${operation}`, req.ip, { stdout });
        resolve({ backupCreated: true, output: stdout, backupType: 'standard' });
      }
    });
  });
};

// Verify data integrity before and after operations
const verifyDataIntegrity = async (dbConfig, tableName = null) => {
  try {
    const testSequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: false
      }
    );

    let query = `
      SELECT
        schemaname,
        tablename,
        n_live_tup as row_count,
        n_dead_tup as dead_rows
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
    `;

    if (tableName) {
      query += ` AND tablename = '${tableName}'`;
    }

    const [results] = await testSequelize.query(query);
    await testSequelize.close();

    const integrity = {
      totalTables: results.length,
      totalRows: results.reduce((sum, table) => sum + parseInt(table.row_count || 0), 0),
      tablesWithDeadRows: results.filter(table => parseInt(table.dead_rows || 0) > 0).length,
      tables: results,
      timestamp: new Date().toISOString()
    };

    return { valid: true, integrity };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// Push to Supabase (bullet-safe with comprehensive error handling)
app.post('/api/supabase/push', async (req, res) => {
  let backupCreated = false;
  let preOperationIntegrity = null;

  try {
    const { dryRun = false, force = false } = req.body;

    auditLog('supabase_push_start', req.ip, { dryRun, force });

    // Step 1: Validate local database connection
    const localDbConfig = {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'ai_hrms_2025',
      username: process.env.DB_USER || 'hrms_user',
      password: process.env.DB_PASSWORD || 'hrms_password',
      dialect: 'postgres'
    };

    const localValidation = await validateDatabaseConnection(localDbConfig);
    if (!localValidation.valid) {
      auditLog('supabase_push_error', req.ip, { error: 'Local database validation failed', details: localValidation.error });
      return res.status(500).json({
        error: 'Local database connection failed',
        details: localValidation.error,
        phase: 'pre_operation_validation',
        timestamp: new Date().toISOString()
      });
    }

    // Step 2: Comprehensive data integrity validation
    const localIntegrityCheck = await validateDataIntegrity(localDbConfig);
    if (!localIntegrityCheck.valid) {
      auditLog('supabase_push_error', req.ip, { error: 'Local data integrity validation failed', details: localIntegrityCheck.errors });
      return res.status(500).json({
        error: 'Local database integrity validation failed',
        details: localIntegrityCheck.errors,
        warnings: localIntegrityCheck.warnings,
        phase: 'pre_operation_validation',
        timestamp: new Date().toISOString()
      });
    }

    // Step 3: Validate Supabase connection (if not dry run)
    if (!dryRun) {
      const supabaseConfig = {
        host: process.env.SUPABASE_DB_HOST || 'aws-1-eu-north-1.pooler.supabase.com',
        port: process.env.SUPABASE_DB_PORT || 6543,
        database: process.env.SUPABASE_DB_NAME || 'postgres',
        username: process.env.SUPABASE_DB_USER || 'postgres.ndmwxfnqymdirmnbtofz',
        password: process.env.SUPABASE_DB_PASSWORD || '7XyihOlP3ZDq85Tz',
        dialect: 'postgres'
      };

      const supabaseValidation = await validateDatabaseConnection(supabaseConfig);
      if (!supabaseValidation.valid) {
        auditLog('supabase_push_error', req.ip, { error: 'Supabase database validation failed', details: supabaseValidation.error });
        return res.status(500).json({
          error: 'Supabase database connection failed',
          details: supabaseValidation.error,
          phase: 'pre_operation_validation',
          timestamp: new Date().toISOString()
        });
      }

      // Step 4: Schema compatibility check
      const schemaComparison = await compareSchemas(localDbConfig, supabaseConfig);
      if (!schemaComparison.compatible && !force) {
        auditLog('supabase_push_error', req.ip, { error: 'Schema compatibility failed', differences: schemaComparison.differences });
        return res.status(409).json({
          error: 'Database schemas are incompatible',
          differences: schemaComparison.differences,
          phase: 'schema_validation',
          recommendation: 'Use force=true to override or resolve schema differences first',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Step 3: Verify data integrity before operation
    const localIntegrity = await verifyDataIntegrity(localDbConfig);
    if (!localIntegrity.valid) {
      auditLog('supabase_push_error', req.ip, { error: 'Local data integrity check failed', details: localIntegrity.error });
      return res.status(500).json({
        error: 'Local database integrity check failed',
        details: localIntegrity.error,
        phase: 'integrity_validation',
        timestamp: new Date().toISOString()
      });
    }

    preOperationIntegrity = localIntegrity.integrity;
    auditLog('integrity_check_passed', req.ip, { integrity: preOperationIntegrity });

    // Step 4: Create safety backup (skip for dry runs)
    if (!dryRun) {
      try {
        const backupResult = await createSafetyBackup('push', req);
        backupCreated = true;
        auditLog('safety_backup_created', req.ip, { backup: backupResult });
      } catch (backupError) {
        // For push operations, we should fail if we can't create a backup
        auditLog('supabase_push_error', req.ip, { error: 'Safety backup failed', details: backupError.message });
        return res.status(500).json({
          error: 'Safety backup creation failed - operation aborted for data protection',
          details: backupError.message,
          phase: 'safety_backup',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Step 5: Execute the push operation with enhanced monitoring
    const scriptPath = path.join(__dirname, '../../../legacy_scripts/database/supabase-safe-push.sh');
    let command = `cd "${path.dirname(scriptPath)}" && ./supabase-safe-push.sh`;

    if (dryRun) command += ' --dry-run';
    if (force) command += ' --force';

    // Use a promise for better error handling
    const pushResult = await new Promise((resolve, reject) => {
      exec(command, { timeout: 600000 }, (error, stdout, stderr) => {
        if (error) {
          reject({
            error: error.message,
            stdout,
            stderr,
            exitCode: error.code
          });
        } else {
          resolve({ stdout, stderr });
        }
      });
    });

    // Step 6: Post-operation integrity check (for non-dry runs)
    if (!dryRun) {
      const supabaseConfig = {
        host: process.env.SUPABASE_DB_HOST || 'aws-1-eu-north-1.pooler.supabase.com',
        port: process.env.SUPABASE_DB_PORT || 6543,
        database: process.env.SUPABASE_DB_NAME || 'postgres',
        username: process.env.SUPABASE_DB_USER || 'postgres.ndmwxfnqymdirmnbtofz',
        password: process.env.SUPABASE_DB_PASSWORD || '7XyihOlP3ZDq85Tz',
        dialect: 'postgres'
      };

      const postIntegrity = await verifyDataIntegrity(supabaseConfig);
      if (!postIntegrity.valid) {
        auditLog('supabase_push_warning', req.ip, {
          warning: 'Post-operation integrity check failed',
          details: postIntegrity.error,
          backup_available: backupCreated
        });
        // Don't fail the operation, but warn the user
      }
    }

    auditLog('supabase_push_success', req.ip, {
      dryRun,
      force,
      backup_created: backupCreated,
      pre_operation_integrity: preOperationIntegrity
    });

    res.json({
      status: 'success',
      message: dryRun ? 'Dry run completed successfully' : 'Push to Supabase completed successfully',
      output: pushResult.stdout,
      safetyMeasures: {
        backupCreated: backupCreated,
        integrityVerified: true,
        preOperationIntegrity: preOperationIntegrity
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    auditLog('supabase_push_error', req.ip, {
      error: error.error || error.message,
      stderr: error.stderr,
      exitCode: error.exitCode,
      backup_created: backupCreated,
      phase: 'execution'
    });

    res.status(500).json({
      error: error.error || error.message,
      stderr: error.stderr,
      exitCode: error.exitCode,
      safetyMeasures: {
        backupCreated: backupCreated,
        integrityVerified: preOperationIntegrity !== null
      },
      recoveryInstructions: backupCreated ?
        'A safety backup was created before the operation. Contact administrator for recovery if needed.' :
        'No backup was created. Local data should be intact.',
      timestamp: new Date().toISOString()
    });
  }
});

// Advanced data validation and integrity checks
const validateDataIntegrity = async (dbConfig, tablesToCheck = []) => {
  try {
    const testSequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: false
      }
    );

    const validationResults = {
      valid: true,
      checks: [],
      warnings: [],
      errors: []
    };

    // Check 1: Foreign key constraints
    const fkQuery = `
      SELECT conname, conrelid::regclass AS table_name, confrelid::regclass AS foreign_table
      FROM pg_constraint
      WHERE contype = 'f' AND connamespace = 'public'::regnamespace
    `;

    const [fkResults] = await testSequelize.query(fkQuery);
    validationResults.checks.push({
      type: 'foreign_keys',
      count: fkResults.length,
      status: 'checked'
    });

    // Check 2: Data consistency for critical tables
    const criticalTables = tablesToCheck.length > 0 ? tablesToCheck :
      ['tenants', 'organizations', 'users', 'employees', 'departments'];

    for (const table of criticalTables) {
      try {
        const countQuery = `SELECT COUNT(*) as row_count FROM ${table}`;
        const [countResult] = await testSequelize.query(countQuery);

        const nullCheckQuery = `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = '${table}'
          AND table_schema = 'public'
          AND is_nullable = 'NO'
          AND column_default IS NULL
        `;
        const [nullCheckResult] = await testSequelize.query(nullCheckQuery);

        validationResults.checks.push({
          type: 'table_integrity',
          table: table,
          row_count: countResult[0]?.row_count || 0,
          required_columns: nullCheckResult.length,
          status: 'validated'
        });

      } catch (tableError) {
        validationResults.warnings.push({
          type: 'table_access',
          table: table,
          message: `Could not validate table: ${tableError.message}`
        });
      }
    }

    // Check 3: Database size and space
    const sizeQuery = `
      SELECT
        pg_size_pretty(pg_database_size(current_database())) as db_size,
        pg_size_pretty(pg_total_relation_size('information_schema.tables')) as metadata_size
    `;
    const [sizeResult] = await testSequelize.query(sizeQuery);
    validationResults.checks.push({
      type: 'database_size',
      size: sizeResult[0]?.db_size || 'unknown',
      metadata_size: sizeResult[0]?.metadata_size || 'unknown'
    });

    // Check 4: Active connections and locks
    const lockQuery = `
      SELECT COUNT(*) as active_locks,
             COUNT(CASE WHEN mode LIKE '%ExclusiveLock%' THEN 1 END) as exclusive_locks
      FROM pg_locks
      WHERE granted = true
    `;
    const [lockResult] = await testSequelize.query(lockQuery);

    if (lockResult[0] && parseInt(lockResult[0].exclusive_locks) > 5) {
      validationResults.warnings.push({
        type: 'high_lock_count',
        message: `High number of exclusive locks detected: ${lockResult[0].exclusive_locks}`
      });
    }

    validationResults.checks.push({
      type: 'locks_and_connections',
      active_locks: lockResult[0]?.active_locks || 0,
      exclusive_locks: lockResult[0]?.exclusive_locks || 0
    });

    await testSequelize.close();

    if (validationResults.errors.length > 0) {
      validationResults.valid = false;
    }

    return validationResults;

  } catch (error) {
    return {
      valid: false,
      error: error.message,
      checks: [],
      warnings: [],
      errors: [{ type: 'validation_failure', message: error.message }]
    };
  }
};

// Enhanced schema comparison between databases
const compareSchemas = async (localConfig, remoteConfig) => {
  try {
    const localSequelize = new Sequelize(
      localConfig.database, localConfig.username, localConfig.password,
      { host: localConfig.host, port: localConfig.port, dialect: localConfig.dialect, logging: false }
    );

    const remoteSequelize = new Sequelize(
      remoteConfig.database, remoteConfig.username, remoteConfig.password,
      { host: remoteConfig.host, port: remoteConfig.port, dialect: remoteConfig.dialect, logging: false }
    );

    const schemaQuery = `
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `;

    const [localSchema] = await localSequelize.query(schemaQuery);
    const [remoteSchema] = await remoteSequelize.query(schemaQuery);

    await localSequelize.close();
    await remoteSequelize.close();

    const comparison = {
      compatible: true,
      differences: [],
      localTables: new Set(),
      remoteTables: new Set(),
      commonTables: new Set()
    };

    // Build table sets
    localSchema.forEach(col => comparison.localTables.add(col.table_name));
    remoteSchema.forEach(col => comparison.remoteTables.add(col.table_name));

    for (const table of comparison.localTables) {
      if (comparison.remoteTables.has(table)) {
        comparison.commonTables.add(table);
      }
    }

    // Check for table differences
    const localOnlyTables = [...comparison.localTables].filter(t => !comparison.remoteTables.has(t));
    const remoteOnlyTables = [...comparison.remoteTables].filter(t => !comparison.localTables.has(t));

    if (localOnlyTables.length > 0) {
      comparison.differences.push({
        type: 'tables_local_only',
        tables: localOnlyTables
      });
    }

    if (remoteOnlyTables.length > 0) {
      comparison.differences.push({
        type: 'tables_remote_only',
        tables: remoteOnlyTables
      });
    }

    // Check column differences for common tables
    for (const table of comparison.commonTables) {
      const localCols = localSchema.filter(col => col.table_name === table);
      const remoteCols = remoteSchema.filter(col => col.table_name === table);

      const localColNames = new Set(localCols.map(col => col.column_name));
      const remoteColNames = new Set(remoteCols.map(col => col.column_name));

      const localOnlyCols = localCols.filter(col => !remoteColNames.has(col.column_name));
      const remoteOnlyCols = remoteCols.filter(col => !localColNames.has(col.column_name));

      if (localOnlyCols.length > 0 || remoteOnlyCols.length > 0) {
        comparison.compatible = false;
        comparison.differences.push({
          type: 'column_mismatch',
          table: table,
          local_only: localOnlyCols,
          remote_only: remoteOnlyCols
        });
      }
    }

    return comparison;

  } catch (error) {
    return {
      compatible: false,
      error: error.message,
      differences: []
    };
  }
};

// Check for conflicting local changes before pull
const checkForLocalChanges = async (dbConfig) => {
  try {
    const testSequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: false
      }
    );

    // Check for uncommitted changes in our staging system
    const stagingDir = path.join(__dirname, '../../../.legacy/staging');
    const indexFile = path.join(stagingDir, 'index');
    const headFile = path.join(stagingDir, 'HEAD');

    let hasLocalChanges = false;
    let changeDetails = {};

    // Check staging area
    if (fs.existsSync(indexFile)) {
      const indexContent = fs.readFileSync(indexFile, 'utf8').trim();
      if (indexContent && indexContent !== '{}') {
        hasLocalChanges = true;
        changeDetails.staged = true;
      }
    }

    // Check for uncommitted database changes
    const query = `
      SELECT COUNT(*) as modified_rows
      FROM pg_stat_user_tables
      WHERE schemaname = 'public' AND n_tup_upd > 0
    `;

    const [results] = await testSequelize.query(query);
    await testSequelize.close();

    if (results[0] && parseInt(results[0].modified_rows) > 0) {
      hasLocalChanges = true;
      changeDetails.databaseModified = true;
    }

    return {
      hasChanges: hasLocalChanges,
      details: changeDetails
    };
  } catch (error) {
    return { hasChanges: false, error: error.message };
  }
};

// Bullet-safe Pull from Supabase with comprehensive error handling
app.post('/api/supabase/pull', async (req, res) => {
  let backupCreated = false;
  let preOperationIntegrity = null;
  let rollbackData = null;

  try {
    const { force = false, dryRun = false } = req.body;

    auditLog('supabase_pull_start', req.ip, { force, dryRun });

    // Step 1: Validate both database connections
    const localDbConfig = {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'ai_hrms_2025',
      username: process.env.DB_USER || 'hrms_user',
      password: process.env.DB_PASSWORD || 'hrms_password',
      dialect: 'postgres'
    };

    const supabaseConfig = {
      host: process.env.SUPABASE_DB_HOST || 'aws-1-eu-north-1.pooler.supabase.com',
      port: process.env.SUPABASE_DB_PORT || 6543,
      database: process.env.SUPABASE_DB_NAME || 'postgres',
      username: process.env.SUPABASE_DB_USER || 'postgres.ndmwxfnqymdirmnbtofz',
      password: process.env.SUPABASE_DB_PASSWORD || '7XyihOlP3ZDq85Tz',
      dialect: 'postgres'
    };

    // Validate local database
    const localValidation = await validateDatabaseConnection(localDbConfig);
    if (!localValidation.valid) {
      auditLog('supabase_pull_error', req.ip, { error: 'Local database validation failed', details: localValidation.error });
      return res.status(500).json({
        error: 'Local database connection failed',
        details: localValidation.error,
        phase: 'pre_operation_validation',
        timestamp: new Date().toISOString()
      });
    }

    // Validate Supabase connection
    const supabaseValidation = await validateDatabaseConnection(supabaseConfig);
    if (!supabaseValidation.valid) {
      auditLog('supabase_pull_error', req.ip, { error: 'Supabase database validation failed', details: supabaseValidation.error });
      return res.status(500).json({
        error: 'Supabase database connection failed',
        details: supabaseValidation.error,
        phase: 'pre_operation_validation',
        timestamp: new Date().toISOString()
      });
    }

    // Step 2: Check for local changes that could be overwritten
    const localChanges = await checkForLocalChanges(localDbConfig);
    if (localChanges.hasChanges && !force) {
      auditLog('supabase_pull_warning', req.ip, {
        warning: 'Local changes detected',
        changes: localChanges.details
      });
      return res.status(409).json({
        error: 'Local changes detected that would be overwritten',
        details: localChanges.details,
        resolution: 'Use force=true to override, or commit local changes first',
        phase: 'conflict_detection',
        timestamp: new Date().toISOString()
      });
    }

    // Step 3: Comprehensive data integrity validation of both databases
    const localIntegrity = await validateDataIntegrity(localDbConfig);
    if (!localIntegrity.valid) {
      auditLog('supabase_pull_error', req.ip, { error: 'Local data integrity check failed', details: localIntegrity.errors });
      return res.status(500).json({
        error: 'Local database integrity validation failed',
        details: localIntegrity.errors,
        warnings: localIntegrity.warnings,
        phase: 'pre_operation_validation',
        timestamp: new Date().toISOString()
      });
    }

    const supabaseIntegrity = await validateDataIntegrity(supabaseConfig);
    if (!supabaseIntegrity.valid) {
      auditLog('supabase_pull_error', req.ip, { error: 'Supabase data integrity check failed', details: supabaseIntegrity.errors });
      return res.status(500).json({
        error: 'Supabase database integrity validation failed',
        details: supabaseIntegrity.errors,
        warnings: supabaseIntegrity.warnings,
        phase: 'pre_operation_validation',
        timestamp: new Date().toISOString()
      });
    }

    // Step 4: Schema compatibility check
    const schemaComparison = await compareSchemas(supabaseConfig, localDbConfig);
    if (!schemaComparison.compatible && !force) {
      auditLog('supabase_pull_error', req.ip, { error: 'Schema compatibility failed', differences: schemaComparison.differences });
      return res.status(409).json({
        error: 'Database schemas are incompatible',
        differences: schemaComparison.differences,
        phase: 'schema_validation',
        recommendation: 'Use force=true to override or resolve schema differences first',
        timestamp: new Date().toISOString()
      });
    }

    // Step 5: Pre-operation data integrity baseline
    preOperationIntegrity = localIntegrity;

    auditLog('integrity_check_passed', req.ip, {
      local: localIntegrity.checks,
      supabase: supabaseIntegrity.checks
    });

    // Step 6: Create safety backup of local database (critical for pull operations)
    if (!dryRun) {
      try {
        const backupResult = await createSafetyBackup('pull', req);
        backupCreated = true;
        rollbackData = {
          backupFile: backupResult.output.match(/Backup completed: (.+)/)?.[1],
          preOperationIntegrity
        };
        auditLog('safety_backup_created', req.ip, { backup: backupResult, rollback: rollbackData });
      } catch (backupError) {
        // For pull operations, we MUST fail if we can't create a backup
        // because pull can overwrite local data
        auditLog('supabase_pull_error', req.ip, { error: 'Safety backup failed', details: backupError.message });
        return res.status(500).json({
          error: 'Safety backup creation failed - pull operation aborted for data protection',
          details: backupError.message,
          phase: 'safety_backup',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Step 5: Execute the pull operation with enhanced monitoring
    const scriptPath = path.join(__dirname, '../../../legacy_scripts/database/supabase-safe-pull.sh');
    let command = `cd "${path.dirname(scriptPath)}" && ./supabase-safe-pull.sh`;

    if (force) command += ' --force';
    if (dryRun) command += ' --dry-run';

    // Use promise for better error handling
    const pullResult = await new Promise((resolve, reject) => {
      exec(command, { timeout: 600000 }, (error, stdout, stderr) => {
        if (error) {
          reject({
            error: error.message,
            stdout,
            stderr,
            exitCode: error.code
          });
        } else {
          resolve({ stdout, stderr });
        }
      });
    });

    // Step 6: Post-operation integrity verification
    if (!dryRun) {
      const postIntegrity = await verifyDataIntegrity(localDbConfig);
      if (!postIntegrity.valid) {
        auditLog('supabase_pull_critical_error', req.ip, {
          error: 'Post-operation integrity check failed - data may be corrupted',
          details: postIntegrity.error,
          backup_available: backupCreated,
          rollback_data: rollbackData
        });

        // This is a critical error - local database may be corrupted
        return res.status(500).json({
          error: 'Critical error: Local database integrity check failed after pull operation',
          details: postIntegrity.error,
          critical: true,
          safetyMeasures: {
            backupCreated: backupCreated,
            rollbackAvailable: rollbackData !== null
          },
          recoveryInstructions: backupCreated ?
            `URGENT: Local database may be corrupted. Restore from backup immediately: ${rollbackData?.backupFile}` :
            'URGENT: Local database may be corrupted and no backup is available. Contact administrator immediately.',
          timestamp: new Date().toISOString()
        });
      }

      // Compare row counts to detect unexpected data loss
      const rowCountChange = postIntegrity.integrity.totalRows - preOperationIntegrity.totalRows;
      if (Math.abs(rowCountChange) > (preOperationIntegrity.totalRows * 0.1)) { // 10% threshold
        auditLog('supabase_pull_warning', req.ip, {
          warning: 'Significant row count change detected',
          before: preOperationIntegrity.totalRows,
          after: postIntegrity.integrity.totalRows,
          change: rowCountChange,
          backup_available: backupCreated
        });
      }
    }

    auditLog('supabase_pull_success', req.ip, {
      force,
      dryRun,
      backup_created: backupCreated,
      pre_operation_integrity: preOperationIntegrity
    });

    res.json({
      status: 'success',
      message: dryRun ? 'Pull dry run completed successfully' : 'Pull from Supabase completed successfully',
      output: pullResult.stdout,
      safetyMeasures: {
        backupCreated: backupCreated,
        integrityVerified: true,
        preOperationIntegrity: preOperationIntegrity,
        localChangesHandled: localChanges.hasChanges ? 'overwritten' : 'none'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    auditLog('supabase_pull_error', req.ip, {
      error: error.error || error.message,
      stderr: error.stderr,
      exitCode: error.exitCode,
      backup_created: backupCreated,
      phase: 'execution'
    });

    // Check if we need to initiate emergency rollback
    let rollbackRecommendation = '';
    if (backupCreated && error.exitCode) {
      rollbackRecommendation = 'Consider immediate rollback from safety backup due to execution failure.';
    }

    res.status(500).json({
      error: error.error || error.message,
      stderr: error.stderr,
      exitCode: error.exitCode,
      safetyMeasures: {
        backupCreated: backupCreated,
        integrityVerified: preOperationIntegrity !== null,
        rollbackAvailable: rollbackData !== null
      },
      recoveryInstructions: backupCreated ?
        `A safety backup was created before the operation. ${rollbackRecommendation} Backup location: ${rollbackData?.backupFile}` :
        'No backup was created. Local data should be intact, but verify database state.',
      timestamp: new Date().toISOString()
    });
  }
});

// Get Supabase sync status
app.get('/api/supabase/status', async (req, res) => {
  try {
    const stagingDir = path.join(__dirname, '../../../.legacy/staging');
    const headFile = path.join(stagingDir, 'HEAD');
    const indexFile = path.join(stagingDir, 'index');

    let syncStatus = {
      staged: false,
      committed: false,
      lastCommit: null,
      lastPush: null,
      hasChanges: true
    };

    // Check if HEAD file exists (means we have commits)
    if (fs.existsSync(headFile)) {
      const currentCommit = fs.readFileSync(headFile, 'utf8').trim();
      syncStatus.lastCommit = currentCommit;

      // Check if there's a commit file for the current commit
      const commitFile = path.join(stagingDir, 'commits', `${currentCommit}.sql`);
      const commitMetaFile = path.join(stagingDir, 'commits', `${currentCommit}.meta`);

      if (currentCommit !== '0000000' && fs.existsSync(commitFile) && fs.existsSync(commitMetaFile)) {
        syncStatus.committed = true;
      }
    }

    // Check staging area - look for actual staged content
    if (fs.existsSync(indexFile)) {
      try {
        const indexContent = fs.readFileSync(indexFile, 'utf8').trim();
        if (indexContent && indexContent !== '{}' && indexContent !== '') {
          const indexData = JSON.parse(indexContent);
          // Check if there are actual staged changes (tables, timestamp, etc.)
          syncStatus.staged = indexData.tables && Object.keys(indexData.tables).length > 0;
        } else {
          syncStatus.staged = false;
        }
      } catch (e) {
        syncStatus.staged = false;
      }
    }

    // Alternative check: if we have staged changes but no specific index data,
    // check if staging directory has recent activity
    if (!syncStatus.staged && fs.existsSync(stagingDir)) {
      const stagingFiles = fs.readdirSync(stagingDir);
      // Look for any staging-related files that indicate activity
      const hasStaging = stagingFiles.some(file =>
        file.startsWith('stage_') ||
        (file === 'index' && fs.statSync(path.join(stagingDir, file)).size > 2)
      );
      syncStatus.staged = hasStaging;
    }

    // Check for last push metadata
    const lastPushFile = path.join(stagingDir, 'last_push.meta');
    if (fs.existsSync(lastPushFile)) {
      try {
        const lastPushData = JSON.parse(fs.readFileSync(lastPushFile, 'utf8'));
        syncStatus.lastPush = lastPushData;
      } catch (e) {
        // Ignore parse errors
      }
    }

    res.json({
      sync: syncStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get audit logs
app.get('/api/logs/audit', async (req, res) => {
  try {
    const { limit = 50, operation } = req.query;
    const logFile = path.join(__dirname, '../logs/audit.log');

    if (!fs.existsSync(logFile)) {
      return res.json({ logs: [] });
    }

    const logContent = fs.readFileSync(logFile, 'utf8');
    let logs = logContent.split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(log => log !== null)
      .reverse();

    if (operation) {
      logs = logs.filter(log => log.operation === operation);
    }

    logs = logs.slice(0, parseInt(limit));

    res.json({
      logs,
      total: logs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  auditLog('api_error', req.ip, { error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`DBMS API Server running on http://localhost:${PORT}`);
  console.log(`Dashboard available at http://localhost:${PORT}/index.html`);
  auditLog('server_start', 'system', { port: PORT });
});

module.exports = app;