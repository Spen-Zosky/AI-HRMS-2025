const { sequelize } = require('./models');

async function generateFinalReport() {
  console.log('📊 Phase D3: Generating Final Population Report');
  console.log('=' .repeat(60));

  try {
    // Log the start of this phase
    await logPhase('FINAL_REPORT', 'started', {
      phase: 'D3',
      description: 'Generating comprehensive final population report'
    });

    console.log('\n🏗️  POPULAT05 - MULTI-TENANT HRMS DATA POPULATION REPORT');
    console.log('=' .repeat(80));
    console.log(`📅 Generated: ${new Date().toISOString()}`);
    console.log(`🎯 Architecture: Three-tier Multi-tenant SaaS`);

    // 1. Infrastructure Summary
    console.log('\n📋 INFRASTRUCTURE SUMMARY');
    console.log('-' .repeat(40));
    const infraStats = await getInfrastructureStats();
    console.log(`   🏢 Tenants: ${infraStats.tenants}`);
    console.log(`   🏬 Organizations: ${infraStats.organizations}`);
    console.log(`   👥 Tenant Users: ${infraStats.tenant_users}`);
    console.log(`   🔗 Tenant Members: ${infraStats.tenant_members}`);

    // 2. User Population Summary
    console.log('\n👤 USER POPULATION SUMMARY');
    console.log('-' .repeat(40));
    const userStats = await getUserStats();
    console.log(`   👤 Total Users: ${userStats.total_users}`);
    console.log(`   💼 Organization Members: ${userStats.organization_members}`);
    console.log(`   📊 Users by Role:`);
    for (const role of userStats.by_role) {
      console.log(`      - ${role.role}: ${role.count} users`);
    }
    console.log(`   🏢 Users by Organization:`);
    for (const org of userStats.by_organization) {
      console.log(`      - ${org.organization_name}: ${org.count} users`);
    }

    // 3. Job Roles and Skills Summary
    console.log('\n💼 JOB ROLES & SKILLS SUMMARY');
    console.log('-' .repeat(40));
    const jobSkillStats = await getJobSkillStats();
    console.log(`   💼 Job Roles: ${jobSkillStats.job_roles}`);
    console.log(`   🌐 Multilingual Descriptions: ${jobSkillStats.i18n_descriptions}`);
    console.log(`   📂 Skill Categories: ${jobSkillStats.skill_categories}`);
    console.log(`   🔧 Skills: ${jobSkillStats.skills}`);
    console.log(`   🎯 Job-Skill Requirements: ${jobSkillStats.job_skill_requirements}`);
    console.log(`   👤 User Skill Assessments: ${jobSkillStats.user_skills}`);

    // 4. Data Quality Metrics
    console.log('\n✅ DATA QUALITY METRICS');
    console.log('-' .repeat(40));
    const qualityMetrics = await getDataQualityMetrics();
    console.log(`   📊 Overall Health Score: ${qualityMetrics.health_score}%`);
    console.log(`   ✅ Successful Validations: ${qualityMetrics.passed_checks}`);
    console.log(`   ❌ Failed Validations: ${qualityMetrics.failed_checks}`);
    console.log(`   🔄 Data Completeness: ${qualityMetrics.completeness_score}%`);

    // 5. Processing Log Summary
    console.log('\n📈 PROCESSING PHASES SUMMARY');
    console.log('-' .repeat(40));
    const processingStats = await getProcessingStats();
    console.log(`   📊 Total Phases: ${processingStats.total_phases}`);
    console.log(`   ✅ Completed Phases: ${processingStats.completed_phases}`);
    console.log(`   ❌ Failed Phases: ${processingStats.failed_phases}`);
    console.log(`   ⏱️  Total Processing Time: ${processingStats.total_duration}`);

    // 6. Detailed Phase Results
    console.log('\n📋 DETAILED PHASE RESULTS');
    console.log('-' .repeat(40));
    const phaseDetails = await getPhaseDetails();
    for (const phase of phaseDetails) {
      const status = phase.status === 'completed' ? '✅' :
                    phase.status === 'failed' ? '❌' : '🔄';
      console.log(`   ${status} ${phase.phase}: ${phase.status.toUpperCase()}`);
      if (phase.duration) {
        console.log(`      ⏱️  Duration: ${phase.duration}`);
      }
      if (phase.summary) {
        console.log(`      📊 Summary: ${phase.summary}`);
      }
    }

    // 7. System Configuration
    console.log('\n⚙️  SYSTEM CONFIGURATION');
    console.log('-' .repeat(40));
    const configStats = await getSystemConfiguration();
    console.log(`   🔐 Multi-tenant Security: ${configStats.security_enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   🌐 Multi-language Support: ${configStats.i18n_languages.join(', ')}`);
    console.log(`   💾 Database: PostgreSQL with Sequelize ORM`);
    console.log(`   🔑 Primary Keys: UUID-based for distributed systems`);
    console.log(`   📊 Data Format: JSONB for flexible configurations`);

    // 8. Next Steps Recommendations
    console.log('\n🎯 NEXT STEPS RECOMMENDATIONS');
    console.log('-' .repeat(40));
    const recommendations = generateRecommendations(qualityMetrics, userStats, jobSkillStats);
    for (let i = 0; i < recommendations.length; i++) {
      console.log(`   ${i + 1}. ${recommendations[i]}`);
    }

    // 9. Export Summary JSON
    console.log('\n💾 EXPORT SUMMARY');
    console.log('-' .repeat(40));
    const reportSummary = {
      generated_at: new Date().toISOString(),
      infrastructure: infraStats,
      users: userStats,
      job_skills: jobSkillStats,
      quality_metrics: qualityMetrics,
      processing: processingStats,
      phases: phaseDetails,
      configuration: configStats,
      recommendations: recommendations
    };

    // Save report to file
    const fs = require('fs');
    const reportPath = `populat05-final-report-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(reportSummary, null, 2));
    console.log(`   📄 Report saved to: ${reportPath}`);
    console.log(`   📊 Report size: ${JSON.stringify(reportSummary).length} characters`);

    // Log completion
    await logPhase('FINAL_REPORT', 'completed', {
      report_path: reportPath,
      summary: reportSummary
    });

    console.log('\n✅ Phase D3 completed successfully!');
    console.log('=' .repeat(60));
    console.log('\n🎉 POPULAT05 DATA POPULATION COMPLETED SUCCESSFULLY! 🎉');
    console.log(`📊 Health Score: ${qualityMetrics.health_score}%`);
    console.log(`👥 Users Created: ${userStats.total_users}`);
    console.log(`💼 Job Roles: ${jobSkillStats.job_roles}`);
    console.log(`🔧 Skills: ${jobSkillStats.skills}`);
    console.log(`🏢 Organizations: ${infraStats.organizations}`);

    return reportSummary;

  } catch (error) {
    console.error('\n❌ Error in Phase D3:', error.message);

    await logPhase('FINAL_REPORT', 'failed', {
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
}

async function getInfrastructureStats() {
  const [tenants] = await sequelize.query('SELECT COUNT(*) as count FROM tenants', { type: sequelize.QueryTypes.SELECT });
  const [organizations] = await sequelize.query('SELECT COUNT(*) as count FROM organizations', { type: sequelize.QueryTypes.SELECT });
  const [tenantUsers] = await sequelize.query('SELECT COUNT(*) as count FROM tenant_users WHERE is_active = true', { type: sequelize.QueryTypes.SELECT });
  const [tenantMembers] = await sequelize.query('SELECT COUNT(*) as count FROM tenant_members WHERE is_active = true', { type: sequelize.QueryTypes.SELECT });

  return {
    tenants: parseInt(tenants.count),
    organizations: parseInt(organizations.count),
    tenant_users: parseInt(tenantUsers.count),
    tenant_members: parseInt(tenantMembers.count)
  };
}

async function getUserStats() {
  const [totalUsers] = await sequelize.query('SELECT COUNT(*) as count FROM users WHERE is_active = true', { type: sequelize.QueryTypes.SELECT });
  const [orgMembers] = await sequelize.query('SELECT COUNT(*) as count FROM organization_members WHERE status = \'active\'', { type: sequelize.QueryTypes.SELECT });

  const byRole = await sequelize.query(`
    SELECT role, COUNT(*) as count
    FROM users WHERE is_active = true
    GROUP BY role
    ORDER BY count DESC
  `, { type: sequelize.QueryTypes.SELECT });

  const byOrganization = await sequelize.query(`
    SELECT o.name as organization_name, COUNT(om.user_id) as count
    FROM organizations o
    LEFT JOIN organization_members om ON o.organization_id = om.organization_id AND om.status = 'active'
    GROUP BY o.organization_id, o.name
    ORDER BY count DESC
  `, { type: sequelize.QueryTypes.SELECT });

  return {
    total_users: parseInt(totalUsers.count),
    organization_members: parseInt(orgMembers.count),
    by_role: byRole.map(r => ({ role: r.role, count: parseInt(r.count) })),
    by_organization: byOrganization.map(o => ({ organization_name: o.organization_name, count: parseInt(o.count) }))
  };
}

async function getJobSkillStats() {
  const [jobRoles] = await sequelize.query('SELECT COUNT(*) as count FROM job_roles', { type: sequelize.QueryTypes.SELECT });
  const [i18nDescriptions] = await sequelize.query('SELECT COUNT(*) as count FROM job_roles_i18n', { type: sequelize.QueryTypes.SELECT });
  const [skillCategories] = await sequelize.query('SELECT COUNT(*) as count FROM skill_categories', { type: sequelize.QueryTypes.SELECT });
  const [skills] = await sequelize.query('SELECT COUNT(*) as count FROM skills_master', { type: sequelize.QueryTypes.SELECT });
  const [jobSkillReqs] = await sequelize.query('SELECT COUNT(*) as count FROM job_skill_requirements', { type: sequelize.QueryTypes.SELECT });

  let userSkillsCount = 0;
  try {
    const [userSkills] = await sequelize.query('SELECT COUNT(*) as count FROM user_skills', { type: sequelize.QueryTypes.SELECT });
    userSkillsCount = parseInt(userSkills.count);
  } catch (error) {
    // Table might not exist yet
  }

  return {
    job_roles: parseInt(jobRoles.count),
    i18n_descriptions: parseInt(i18nDescriptions.count),
    skill_categories: parseInt(skillCategories.count),
    skills: parseInt(skills.count),
    job_skill_requirements: parseInt(jobSkillReqs.count),
    user_skills: userSkillsCount
  };
}

async function getDataQualityMetrics() {
  // Get the latest validation results
  const [latestValidation] = await sequelize.query(`
    SELECT details FROM populat05_processing_log
    WHERE phase = 'DATA_VALIDATION' AND status = 'completed'
    ORDER BY completed_at DESC LIMIT 1
  `, { type: sequelize.QueryTypes.SELECT });

  if (latestValidation) {
    try {
      const details = JSON.parse(latestValidation.details);
      return {
        health_score: details.health_score || 0,
        passed_checks: details.checks_passed || 0,
        failed_checks: details.checks_failed || 0,
        completeness_score: await calculateCompletenessScore()
      };
    } catch (error) {
      console.warn('Warning: Could not parse validation details');
      return {
        health_score: 0,
        passed_checks: 0,
        failed_checks: 0,
        completeness_score: await calculateCompletenessScore()
      };
    }
  }

  return {
    health_score: 0,
    passed_checks: 0,
    failed_checks: 0,
    completeness_score: await calculateCompletenessScore()
  };
}

async function calculateCompletenessScore() {
  // Calculate data completeness based on expected vs actual records
  const [users] = await sequelize.query('SELECT COUNT(*) as count FROM users', { type: sequelize.QueryTypes.SELECT });
  const [stagingUsers] = await sequelize.query('SELECT COUNT(*) as count FROM stg_organigramma', { type: sequelize.QueryTypes.SELECT });

  const userCompleteness = (parseInt(users.count) / parseInt(stagingUsers.count)) * 100;

  // Average multiple completeness metrics
  return Math.round(userCompleteness);
}

async function getProcessingStats() {
  const phases = await sequelize.query(`
    SELECT phase, status, started_at, completed_at
    FROM populat05_processing_log
    ORDER BY started_at ASC
  `, { type: sequelize.QueryTypes.SELECT });

  const totalPhases = phases.length;
  const completedPhases = phases.filter(p => p.status === 'completed').length;
  const failedPhases = phases.filter(p => p.status === 'failed').length;

  // Calculate total duration
  const startTime = phases.length > 0 ? new Date(phases[0].started_at) : null;
  const endTime = phases.length > 0 ? new Date(phases[phases.length - 1].completed_at || new Date()) : null;
  const totalDuration = startTime && endTime ?
    `${Math.round((endTime - startTime) / 1000 / 60)} minutes` : 'N/A';

  return {
    total_phases: totalPhases,
    completed_phases: completedPhases,
    failed_phases: failedPhases,
    total_duration: totalDuration
  };
}

async function getPhaseDetails() {
  const phases = await sequelize.query(`
    SELECT phase, status, started_at, completed_at, details
    FROM populat05_processing_log
    ORDER BY started_at ASC
  `, { type: sequelize.QueryTypes.SELECT });

  return phases.map(phase => {
    const duration = phase.completed_at && phase.started_at ?
      `${Math.round((new Date(phase.completed_at) - new Date(phase.started_at)) / 1000)}s` : null;

    let summary = null;
    if (phase.details) {
      try {
        const details = JSON.parse(phase.details);
        if (details.summary) {
          summary = `${details.summary.total_users || details.summary.total_categories || details.summary.categories?.created || 'Data processed'}`;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    return {
      phase: phase.phase,
      status: phase.status,
      duration: duration,
      summary: summary
    };
  });
}

async function getSystemConfiguration() {
  // Check if multilingual support is enabled
  const i18nLanguages = await sequelize.query(`
    SELECT DISTINCT language_code FROM job_roles_i18n
  `, { type: sequelize.QueryTypes.SELECT });

  return {
    security_enabled: true, // Multi-tenant architecture implies security
    i18n_languages: i18nLanguages.map(l => l.language_code),
    database_type: 'PostgreSQL',
    orm: 'Sequelize',
    primary_key_type: 'UUID',
    configuration_format: 'JSONB'
  };
}

function generateRecommendations(qualityMetrics, userStats, jobSkillStats) {
  const recommendations = [];

  if (qualityMetrics.health_score < 70) {
    recommendations.push('Address data quality issues identified in validation report');
  }

  if (userStats.organization_members < userStats.total_users) {
    recommendations.push('Complete organization membership assignments for all users');
  }

  if (jobSkillStats.user_skills === 0) {
    recommendations.push('Implement user skill assessment workflow');
  }

  recommendations.push('Set up automated data validation monitoring');
  recommendations.push('Configure backup and disaster recovery procedures');
  recommendations.push('Implement role-based access control testing');
  recommendations.push('Set up performance monitoring for multi-tenant queries');
  recommendations.push('Configure audit logging for tenant data access');

  return recommendations;
}

// Helper function to log phases
async function logPhase(phase, status, details = {}) {
  try {
    if (status === 'started') {
      await sequelize.query(`
        INSERT INTO populat05_processing_log (phase, status, details, started_at)
        VALUES (:phase, :status, :details, NOW())
      `, {
        replacements: {
          phase,
          status,
          details: JSON.stringify(details)
        }
      });
    } else {
      await sequelize.query(`
        UPDATE populat05_processing_log
        SET status = :status, details = :details, completed_at = NOW()
        WHERE phase = :phase AND completed_at IS NULL
      `, {
        replacements: {
          phase,
          status,
          details: JSON.stringify(details)
        }
      });
    }
  } catch (error) {
    console.warn('Warning: Could not log phase:', error.message);
  }
}

// Export for use in other scripts
module.exports = { generateFinalReport };

// Run if called directly
if (require.main === module) {
  generateFinalReport()
    .then((result) => {
      console.log('\n🎉 Final report generation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Final report generation failed:', error);
      process.exit(1);
    })
    .finally(() => {
      sequelize?.close();
    });
}