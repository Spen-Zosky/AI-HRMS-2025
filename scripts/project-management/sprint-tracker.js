#!/usr/bin/env node

/**
 * AI-HRMS-2025 Sprint Tracking System
 *
 * Comprehensive sprint management and tracking tool for monitoring
 * task progress, team velocity, and sprint deliverables.
 *
 * @author AI-HRMS-2025 Development Team
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class SprintTracker {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.sprintsConfigPath = path.join(this.projectRoot, 'config', 'sprints.json');
    this.tasksDataPath = path.join(this.projectRoot, 'data', 'tasks');
    this.reportsPath = path.join(this.projectRoot, 'reports', 'sprints');

    this.sprintConfig = {
      duration: 14, // days
      workingDaysPerWeek: 5,
      hoursPerDay: 8,
      velocityWindow: 3 // sprints for velocity calculation
    };

    this.taskStatuses = {
      TODO: 'todo',
      IN_PROGRESS: 'in_progress',
      IN_REVIEW: 'in_review',
      TESTING: 'testing',
      BLOCKED: 'blocked',
      DONE: 'done'
    };

    this.taskPriorities = {
      CRITICAL: 'critical',
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low'
    };
  }

  /**
   * Main sprint tracking execution
   */
  async track(sprintId = null) {
    try {
      console.log('📈 AI-HRMS-2025 Sprint Tracker');
      console.log('===============================\n');

      // Initialize sprint data
      await this.initializeSprintData();

      // Load current sprint or specific sprint
      const sprint = await this.loadSprint(sprintId);
      console.log(`📊 Tracking Sprint: ${sprint.name} (${sprint.id})`);

      // Calculate sprint metrics
      const metrics = await this.calculateSprintMetrics(sprint);

      // Generate sprint reports
      await this.generateSprintReports(sprint, metrics);

      // Update sprint dashboards
      await this.updateSprintDashboards(sprint, metrics);

      // Check for alerts and notifications
      await this.checkSprintAlerts(sprint, metrics);

      console.log('\n✅ Sprint tracking completed successfully');
      this.displaySprintSummary(sprint, metrics);

    } catch (error) {
      console.error('❌ Sprint tracking failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Initialize sprint data structure
   */
  async initializeSprintData() {
    console.log('🔧 Initializing sprint data...');

    try {
      // Ensure directories exist
      await this.ensureDirectoryExists(path.dirname(this.sprintsConfigPath));
      await this.ensureDirectoryExists(this.tasksDataPath);
      await this.ensureDirectoryExists(this.reportsPath);

      // Load or create sprint configuration
      const sprintsConfig = await this.loadOrCreateSprintsConfig();
      this.sprints = sprintsConfig.sprints;
      this.teams = sprintsConfig.teams;

      console.log(`   ✅ Loaded ${this.sprints.length} sprints`);
      console.log(`   ✅ Configured ${this.teams.length} teams`);

    } catch (error) {
      throw new Error(`Sprint data initialization failed: ${error.message}`);
    }
  }

  /**
   * Load sprint configuration or create default
   */
  async loadOrCreateSprintsConfig() {
    try {
      const configData = await fs.readFile(this.sprintsConfigPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      // Create default configuration
      const defaultConfig = {
        project: {
          name: 'AI-HRMS-2025 Web GUI Implementation',
          startDate: '2025-09-22',
          estimatedEndDate: '2026-06-30',
          phases: 4
        },
        teams: [
          {
            id: 'web-gui-team',
            name: 'Web GUI Development Team',
            members: [
              { name: 'Tech Lead', role: 'tech_lead', capacity: 8 },
              { name: 'Frontend Dev', role: 'frontend_dev', capacity: 8 },
              { name: 'Backend Dev', role: 'backend_dev', capacity: 8 },
              { name: 'UX Designer', role: 'ux_designer', capacity: 8 },
              { name: 'QA Engineer', role: 'qa_engineer', capacity: 8 }
            ],
            totalCapacity: 40
          }
        ],
        sprints: [
          {
            id: 'sprint-01',
            name: 'Sprint 1: Core Infrastructure',
            phase: 1,
            startDate: '2025-09-22',
            endDate: '2025-10-05',
            status: 'active',
            goals: [
              'Implement JWT-based authentication system',
              'Create role-based route guards',
              'Build responsive layout components',
              'Establish navigation framework'
            ],
            team: 'web-gui-team',
            capacity: 80, // person-hours
            commitments: []
          },
          {
            id: 'sprint-02',
            name: 'Sprint 2: User Management Interface',
            phase: 1,
            startDate: '2025-10-06',
            endDate: '2025-10-19',
            status: 'planned',
            goals: [
              'Build user management interface',
              'Implement permission management UI',
              'Create dashboard framework',
              'Develop notification system'
            ],
            team: 'web-gui-team',
            capacity: 80,
            commitments: []
          }
        ]
      };

      await fs.writeFile(this.sprintsConfigPath, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    }
  }

  /**
   * Load specific sprint or current active sprint
   */
  async loadSprint(sprintId) {
    if (sprintId) {
      const sprint = this.sprints.find(s => s.id === sprintId);
      if (!sprint) {
        throw new Error(`Sprint not found: ${sprintId}`);
      }
      return sprint;
    }

    // Find current active sprint
    const activeSprint = this.sprints.find(s => s.status === 'active');
    if (!activeSprint) {
      throw new Error('No active sprint found');
    }

    return activeSprint;
  }

  /**
   * Calculate comprehensive sprint metrics
   */
  async calculateSprintMetrics(sprint) {
    console.log('📊 Calculating sprint metrics...');

    try {
      // Load sprint tasks
      const tasks = await this.loadSprintTasks(sprint.id);

      // Basic task metrics
      const taskMetrics = this.calculateTaskMetrics(tasks);

      // Time and progress metrics
      const timeMetrics = this.calculateTimeMetrics(sprint);

      // Velocity metrics
      const velocityMetrics = await this.calculateVelocityMetrics(sprint, tasks);

      // Quality metrics
      const qualityMetrics = await this.calculateQualityMetrics(sprint, tasks);

      // Team performance metrics
      const teamMetrics = await this.calculateTeamMetrics(sprint, tasks);

      // Burn-down metrics
      const burnDownMetrics = await this.calculateBurnDownMetrics(sprint, tasks);

      const metrics = {
        sprint: sprint.id,
        calculatedAt: new Date(),
        tasks: taskMetrics,
        time: timeMetrics,
        velocity: velocityMetrics,
        quality: qualityMetrics,
        team: teamMetrics,
        burnDown: burnDownMetrics
      };

      console.log(`   ✅ Task Completion: ${taskMetrics.completionPercentage}%`);
      console.log(`   ✅ Sprint Progress: ${timeMetrics.progressPercentage}%`);
      console.log(`   ✅ Team Velocity: ${velocityMetrics.current} points/day`);

      return metrics;

    } catch (error) {
      throw new Error(`Sprint metrics calculation failed: ${error.message}`);
    }
  }

  /**
   * Load tasks for specific sprint
   */
  async loadSprintTasks(sprintId) {
    try {
      const tasksFile = path.join(this.tasksDataPath, `${sprintId}.json`);
      const tasksData = await fs.readFile(tasksFile, 'utf8');
      return JSON.parse(tasksData).tasks;
    } catch (error) {
      // Create default tasks for demonstration
      const defaultTasks = this.createDefaultTasks(sprintId);
      await this.saveSprintTasks(sprintId, defaultTasks);
      return defaultTasks;
    }
  }

  /**
   * Create default tasks for demonstration
   */
  createDefaultTasks(sprintId) {
    const tasks = [
      {
        id: `${sprintId}-task-01`,
        title: 'Implement JWT Authentication',
        description: 'Set up JWT-based authentication with refresh tokens',
        assignee: 'Backend Dev',
        status: this.taskStatuses.DONE,
        priority: this.taskPriorities.CRITICAL,
        storyPoints: 8,
        hoursEstimated: 16,
        hoursSpent: 14,
        tags: ['backend', 'security', 'authentication'],
        dependencies: [],
        createdAt: '2025-01-06',
        updatedAt: '2025-01-09'
      },
      {
        id: `${sprintId}-task-02`,
        title: 'Create Role-Based Route Guards',
        description: 'Implement route protection based on user roles and permissions',
        assignee: 'Frontend Dev',
        status: this.taskStatuses.IN_PROGRESS,
        priority: this.taskPriorities.HIGH,
        storyPoints: 5,
        hoursEstimated: 10,
        hoursSpent: 6,
        tags: ['frontend', 'routing', 'security'],
        dependencies: [`${sprintId}-task-01`],
        createdAt: '2025-01-07',
        updatedAt: '2025-01-10'
      },
      {
        id: `${sprintId}-task-03`,
        title: 'Build Base Layout Components',
        description: 'Create responsive layout components for different user types',
        assignee: 'Frontend Dev',
        status: this.taskStatuses.TODO,
        priority: this.taskPriorities.HIGH,
        storyPoints: 8,
        hoursEstimated: 16,
        hoursSpent: 0,
        tags: ['frontend', 'ui', 'layout'],
        dependencies: [`${sprintId}-task-02`],
        createdAt: '2025-01-08',
        updatedAt: '2025-01-08'
      },
      {
        id: `${sprintId}-task-04`,
        title: 'Design Navigation Framework',
        description: 'Create role-aware navigation system with tenant context',
        assignee: 'UX Designer',
        status: this.taskStatuses.IN_REVIEW,
        priority: this.taskPriorities.MEDIUM,
        storyPoints: 3,
        hoursEstimated: 6,
        hoursSpent: 8,
        tags: ['ux', 'design', 'navigation'],
        dependencies: [],
        createdAt: '2025-01-06',
        updatedAt: '2025-01-09'
      },
      {
        id: `${sprintId}-task-05`,
        title: 'Set Up Testing Framework',
        description: 'Configure Jest and TestSprite for component testing',
        assignee: 'QA Engineer',
        status: this.taskStatuses.TESTING,
        priority: this.taskPriorities.MEDIUM,
        storyPoints: 5,
        hoursEstimated: 10,
        hoursSpent: 8,
        tags: ['testing', 'framework', 'quality'],
        dependencies: [],
        createdAt: '2025-01-07',
        updatedAt: '2025-01-10'
      }
    ];

    return tasks;
  }

  /**
   * Calculate basic task metrics
   */
  calculateTaskMetrics(tasks) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === this.taskStatuses.DONE).length;
    const inProgressTasks = tasks.filter(t => t.status === this.taskStatuses.IN_PROGRESS).length;
    const blockedTasks = tasks.filter(t => t.status === this.taskStatuses.BLOCKED).length;

    const totalStoryPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    const completedStoryPoints = tasks
      .filter(t => t.status === this.taskStatuses.DONE)
      .reduce((sum, task) => sum + (task.storyPoints || 0), 0);

    const totalHoursEstimated = tasks.reduce((sum, task) => sum + (task.hoursEstimated || 0), 0);
    const totalHoursSpent = tasks.reduce((sum, task) => sum + (task.hoursSpent || 0), 0);

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      pendingTasks: totalTasks - completedTasks - inProgressTasks - blockedTasks,
      completionPercentage: Math.round((completedTasks / totalTasks) * 100),
      totalStoryPoints,
      completedStoryPoints,
      storyPointsCompletion: Math.round((completedStoryPoints / totalStoryPoints) * 100),
      totalHoursEstimated,
      totalHoursSpent,
      hoursBurnRate: totalHoursSpent / totalHoursEstimated * 100
    };
  }

  /**
   * Calculate time-based metrics
   */
  calculateTimeMetrics(sprint) {
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const currentDate = new Date();

    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)));

    const workingDays = Math.floor(totalDays * (this.sprintConfig.workingDaysPerWeek / 7));
    const elapsedWorkingDays = Math.floor(elapsedDays * (this.sprintConfig.workingDaysPerWeek / 7));
    const remainingWorkingDays = Math.max(0, workingDays - elapsedWorkingDays);

    return {
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      totalDays,
      elapsedDays,
      remainingDays,
      workingDays,
      elapsedWorkingDays,
      remainingWorkingDays,
      progressPercentage: Math.round((elapsedDays / totalDays) * 100)
    };
  }

  /**
   * Calculate velocity metrics
   */
  async calculateVelocityMetrics(sprint, tasks) {
    const completedStoryPoints = tasks
      .filter(t => t.status === this.taskStatuses.DONE)
      .reduce((sum, task) => sum + (task.storyPoints || 0), 0);

    // Historical velocity (would come from previous sprints)
    const historicalVelocity = await this.getHistoricalVelocity(sprint);

    const currentSprintDays = Math.ceil((new Date() - new Date(sprint.startDate)) / (1000 * 60 * 60 * 24));
    const currentVelocity = currentSprintDays > 0 ? completedStoryPoints / currentSprintDays : 0;

    const totalStoryPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    const remainingStoryPoints = totalStoryPoints - completedStoryPoints;

    const sprintEndDate = new Date(sprint.endDate);
    const remainingDays = Math.max(1, Math.ceil((sprintEndDate - new Date()) / (1000 * 60 * 60 * 24)));
    const requiredVelocity = remainingStoryPoints / remainingDays;

    return {
      historical: historicalVelocity,
      current: Math.round(currentVelocity * 100) / 100,
      required: Math.round(requiredVelocity * 100) / 100,
      completedStoryPoints,
      remainingStoryPoints,
      velocityTrend: currentVelocity >= historicalVelocity ? 'improving' : 'declining',
      onTrack: requiredVelocity <= historicalVelocity * 1.2 // 20% tolerance
    };
  }

  /**
   * Get historical velocity from previous sprints
   */
  async getHistoricalVelocity(currentSprint) {
    // This would query previous sprint data
    // For demonstration, returning a calculated value
    return 2.5; // story points per day average
  }

  /**
   * Calculate quality metrics
   */
  async calculateQualityMetrics(sprint, tasks) {
    const testingTasks = tasks.filter(t =>
      t.tags.includes('testing') || t.status === this.taskStatuses.TESTING
    );

    const bugTasks = tasks.filter(t =>
      t.tags.includes('bug') || t.priority === this.taskPriorities.CRITICAL
    );

    const reviewTasks = tasks.filter(t => t.status === this.taskStatuses.IN_REVIEW);

    return {
      testCoverage: await this.getTestCoverage(),
      tasksInTesting: testingTasks.length,
      tasksInReview: reviewTasks.length,
      bugCount: bugTasks.length,
      qualityScore: this.calculateQualityScore(tasks),
      codeReviewMetrics: await this.getCodeReviewMetrics()
    };
  }

  /**
   * Calculate team performance metrics
   */
  async calculateTeamMetrics(sprint, tasks) {
    const team = this.teams.find(t => t.id === sprint.team);
    if (!team) return {};

    const tasksByAssignee = this.groupTasksByAssignee(tasks);
    const memberMetrics = team.members.map(member => {
      const memberTasks = tasksByAssignee[member.name] || [];
      const completedTasks = memberTasks.filter(t => t.status === this.taskStatuses.DONE);
      const hoursSpent = memberTasks.reduce((sum, task) => sum + (task.hoursSpent || 0), 0);

      return {
        name: member.name,
        role: member.role,
        tasksAssigned: memberTasks.length,
        tasksCompleted: completedTasks.length,
        hoursSpent,
        utilization: Math.round((hoursSpent / (member.capacity * 10)) * 100), // Assuming 10 days
        productivity: completedTasks.length > 0 ? Math.round((completedTasks.length / memberTasks.length) * 100) : 0
      };
    });

    const totalCapacityUsed = memberMetrics.reduce((sum, m) => sum + m.hoursSpent, 0);
    const averageUtilization = Math.round(memberMetrics.reduce((sum, m) => sum + m.utilization, 0) / memberMetrics.length);

    return {
      teamSize: team.members.length,
      totalCapacity: team.totalCapacity * 10, // 10 days
      capacityUsed: totalCapacityUsed,
      capacityUtilization: Math.round((totalCapacityUsed / (team.totalCapacity * 10)) * 100),
      averageUtilization,
      members: memberMetrics,
      collaboration: await this.calculateCollaborationScore(tasks),
      bottlenecks: this.identifyBottlenecks(memberMetrics)
    };
  }

  /**
   * Calculate burn-down metrics
   */
  async calculateBurnDownMetrics(sprint, tasks) {
    const startDate = new Date(sprint.startDate);
    const currentDate = new Date();
    const totalStoryPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);

    // Generate ideal burn-down line
    const sprintDays = Math.ceil((new Date(sprint.endDate) - startDate) / (1000 * 60 * 60 * 24));
    const idealBurnDown = [];

    for (let day = 0; day <= sprintDays; day++) {
      idealBurnDown.push({
        day,
        remaining: totalStoryPoints - (totalStoryPoints * (day / sprintDays))
      });
    }

    // Calculate actual burn-down (simplified)
    const completedStoryPoints = tasks
      .filter(t => t.status === this.taskStatuses.DONE)
      .reduce((sum, task) => sum + (task.storyPoints || 0), 0);

    const currentDay = Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24));
    const actualRemaining = totalStoryPoints - completedStoryPoints;
    const idealRemaining = totalStoryPoints - (totalStoryPoints * (currentDay / sprintDays));

    return {
      idealBurnDown,
      actualRemaining,
      idealRemaining,
      variance: actualRemaining - idealRemaining,
      trend: actualRemaining <= idealRemaining ? 'ahead' : 'behind',
      projectedCompletion: this.calculateProjectedCompletion(tasks, sprint)
    };
  }

  /**
   * Helper methods
   */

  groupTasksByAssignee(tasks) {
    return tasks.reduce((groups, task) => {
      const assignee = task.assignee || 'Unassigned';
      if (!groups[assignee]) groups[assignee] = [];
      groups[assignee].push(task);
      return groups;
    }, {});
  }

  calculateQualityScore(tasks) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === this.taskStatuses.DONE).length;
    const blockedTasks = tasks.filter(t => t.status === this.taskStatuses.BLOCKED).length;
    const bugTasks = tasks.filter(t => t.tags.includes('bug')).length;

    const completionRate = completedTasks / totalTasks;
    const blockageRate = blockedTasks / totalTasks;
    const bugRate = bugTasks / totalTasks;

    // Simple quality score calculation
    return Math.round((completionRate * 0.5 + (1 - blockageRate) * 0.3 + (1 - bugRate) * 0.2) * 100);
  }

  async getTestCoverage() {
    try {
      // This would integrate with actual test coverage tools
      return {
        percentage: 75,
        lines: 750,
        functions: 180,
        branches: 120
      };
    } catch (error) {
      return { percentage: 0, error: error.message };
    }
  }

  async getCodeReviewMetrics() {
    return {
      averageReviewTime: 4.5, // hours
      reviewParticipation: 85, // percentage
      issuesFound: 12,
      issuesResolved: 10
    };
  }

  async calculateCollaborationScore(tasks) {
    // Simple collaboration score based on task dependencies and assignments
    const tasksWithDependencies = tasks.filter(t => t.dependencies && t.dependencies.length > 0);
    const totalTasks = tasks.length;

    return Math.round((tasksWithDependencies.length / totalTasks) * 100);
  }

  identifyBottlenecks(memberMetrics) {
    return memberMetrics
      .filter(m => m.utilization > 120 || m.productivity < 50)
      .map(m => ({
        member: m.name,
        issue: m.utilization > 120 ? 'overutilized' : 'low_productivity',
        severity: m.utilization > 150 || m.productivity < 25 ? 'high' : 'medium'
      }));
  }

  calculateProjectedCompletion(tasks, sprint) {
    const completedStoryPoints = tasks
      .filter(t => t.status === this.taskStatuses.DONE)
      .reduce((sum, task) => sum + (task.storyPoints || 0), 0);

    const totalStoryPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    const remainingStoryPoints = totalStoryPoints - completedStoryPoints;

    const currentDate = new Date();
    const startDate = new Date(sprint.startDate);
    const elapsedDays = Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24));
    const currentVelocity = elapsedDays > 0 ? completedStoryPoints / elapsedDays : 0;

    if (currentVelocity === 0) return null;

    const daysToCompletion = remainingStoryPoints / currentVelocity;
    const projectedEndDate = new Date();
    projectedEndDate.setDate(projectedEndDate.getDate() + daysToCompletion);

    return {
      projectedEndDate: projectedEndDate.toISOString().split('T')[0],
      daysToCompletion: Math.ceil(daysToCompletion),
      onSchedule: projectedEndDate <= new Date(sprint.endDate)
    };
  }

  /**
   * Generate comprehensive sprint reports
   */
  async generateSprintReports(sprint, metrics) {
    console.log('📊 Generating sprint reports...');

    try {
      const timestamp = new Date().toISOString().split('T')[0];

      // JSON report
      const jsonReport = {
        sprint: sprint,
        metrics: metrics,
        generatedAt: new Date(),
        version: '1.0.0'
      };

      const jsonReportPath = path.join(this.reportsPath, `${sprint.id}-${timestamp}.json`);
      await fs.writeFile(jsonReportPath, JSON.stringify(jsonReport, null, 2));

      // Markdown report
      const markdownReport = await this.generateMarkdownSprintReport(sprint, metrics);
      const mdReportPath = path.join(this.reportsPath, `${sprint.id}-${timestamp}.md`);
      await fs.writeFile(mdReportPath, markdownReport);

      console.log(`   ✅ JSON Report: ${jsonReportPath}`);
      console.log(`   ✅ Markdown Report: ${mdReportPath}`);

    } catch (error) {
      console.error(`   ❌ Report generation failed: ${error.message}`);
    }
  }

  async generateMarkdownSprintReport(sprint, metrics) {
    return `# Sprint Report: ${sprint.name}

## Sprint Overview
- **Sprint ID**: ${sprint.id}
- **Duration**: ${sprint.startDate} to ${sprint.endDate}
- **Status**: ${sprint.status}
- **Phase**: ${sprint.phase}

## Progress Summary
- **Overall Progress**: ${metrics.time.progressPercentage}%
- **Task Completion**: ${metrics.tasks.completionPercentage}%
- **Story Points**: ${metrics.tasks.completedStoryPoints}/${metrics.tasks.totalStoryPoints} (${metrics.tasks.storyPointsCompletion}%)

## Velocity Metrics
- **Current Velocity**: ${metrics.velocity.current} points/day
- **Historical Velocity**: ${metrics.velocity.historical} points/day
- **Status**: ${metrics.velocity.onTrack ? '✅ On Track' : '⚠️ At Risk'}

## Team Performance
- **Team Size**: ${metrics.team.teamSize} members
- **Capacity Utilization**: ${metrics.team.capacityUtilization}%
- **Average Utilization**: ${metrics.team.averageUtilization}%

## Quality Metrics
- **Test Coverage**: ${metrics.quality.testCoverage.percentage}%
- **Quality Score**: ${metrics.quality.qualityScore}/100
- **Tasks in Review**: ${metrics.quality.tasksInReview}

## Sprint Goals Progress
${sprint.goals.map((goal, index) => `${index + 1}. ${goal}`).join('\n')}

## Recommendations
${this.generateSprintRecommendations(metrics).map(rec => `- ${rec}`).join('\n')}

---
*Generated on ${new Date().toISOString()}*`;
  }

  generateSprintRecommendations(metrics) {
    const recommendations = [];

    if (!metrics.velocity.onTrack) {
      recommendations.push('🚨 Sprint velocity is below target - consider scope adjustment');
    }

    if (metrics.team.bottlenecks.length > 0) {
      recommendations.push(`⚠️ Team bottlenecks identified: ${metrics.team.bottlenecks.map(b => b.member).join(', ')}`);
    }

    if (metrics.quality.testCoverage.percentage < 80) {
      recommendations.push('📊 Test coverage below 80% - increase testing focus');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Sprint is progressing well - continue current approach');
    }

    return recommendations;
  }

  /**
   * Update sprint dashboards
   */
  async updateSprintDashboards(sprint, metrics) {
    console.log('📊 Updating sprint dashboards...');

    try {
      const dashboardsPath = path.join(this.projectRoot, 'dashboards', 'sprints');
      await this.ensureDirectoryExists(dashboardsPath);

      // Current sprint dashboard
      const currentSprintData = {
        sprint: sprint,
        metrics: metrics,
        lastUpdated: new Date()
      };

      const currentDashboardPath = path.join(dashboardsPath, 'current-sprint.json');
      await fs.writeFile(currentDashboardPath, JSON.stringify(currentSprintData, null, 2));

      // Historical sprint data
      const historicalPath = path.join(dashboardsPath, 'historical.json');
      const historical = await this.loadHistoricalData(historicalPath);
      historical.sprints.push({
        id: sprint.id,
        name: sprint.name,
        metrics: metrics,
        updatedAt: new Date()
      });

      await fs.writeFile(historicalPath, JSON.stringify(historical, null, 2));

      console.log('   ✅ Sprint dashboards updated');

    } catch (error) {
      console.error(`   ❌ Dashboard update failed: ${error.message}`);
    }
  }

  async loadHistoricalData(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return { sprints: [] };
    }
  }

  /**
   * Check for sprint alerts and notifications
   */
  async checkSprintAlerts(sprint, metrics) {
    const alerts = [];

    // Velocity alerts
    if (!metrics.velocity.onTrack) {
      alerts.push({
        type: 'velocity',
        severity: 'high',
        message: 'Sprint velocity below target',
        action: 'Consider scope adjustment or additional resources'
      });
    }

    // Burndown alerts
    if (metrics.burnDown.trend === 'behind') {
      alerts.push({
        type: 'burndown',
        severity: 'medium',
        message: 'Sprint burndown behind schedule',
        action: 'Review task priorities and blockers'
      });
    }

    // Quality alerts
    if (metrics.quality.qualityScore < 70) {
      alerts.push({
        type: 'quality',
        severity: 'high',
        message: 'Sprint quality score below threshold',
        action: 'Increase testing and code review focus'
      });
    }

    // Team alerts
    if (metrics.team.bottlenecks.length > 0) {
      alerts.push({
        type: 'team',
        severity: 'medium',
        message: `Team bottlenecks identified: ${metrics.team.bottlenecks.length} members`,
        action: 'Redistribute workload and provide support'
      });
    }

    if (alerts.length > 0) {
      console.log('\n🚨 Sprint Alerts:');
      alerts.forEach(alert => {
        const severity = alert.severity === 'high' ? '🔴' : '🟡';
        console.log(`   ${severity} ${alert.message}`);
        console.log(`      Action: ${alert.action}`);
      });

      // Save alerts to file
      const alertsPath = path.join(this.projectRoot, 'alerts', 'sprint-alerts.json');
      await this.ensureDirectoryExists(path.dirname(alertsPath));
      await fs.writeFile(alertsPath, JSON.stringify(alerts, null, 2));
    }
  }

  /**
   * Display sprint summary
   */
  displaySprintSummary(sprint, metrics) {
    console.log('\n📋 Sprint Summary');
    console.log('=================');
    console.log(`Sprint: ${sprint.name}`);
    console.log(`Progress: ${metrics.tasks.completionPercentage}% complete`);
    console.log(`Velocity: ${metrics.velocity.current} points/day (target: ${metrics.velocity.historical})`);
    console.log(`Quality: ${metrics.quality.qualityScore}/100`);
    console.log(`Team Utilization: ${metrics.team.averageUtilization}%`);
    console.log(`Status: ${metrics.velocity.onTrack ? '✅ On Track' : '⚠️ Needs Attention'}`);
  }

  /**
   * Save sprint tasks
   */
  async saveSprintTasks(sprintId, tasks) {
    const tasksFile = path.join(this.tasksDataPath, `${sprintId}.json`);
    await this.ensureDirectoryExists(path.dirname(tasksFile));
    await fs.writeFile(tasksFile, JSON.stringify({ tasks }, null, 2));
  }

  /**
   * Utility methods
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const sprintId = args.find(arg => arg.startsWith('--sprint='))?.split('=')[1];

  try {
    const tracker = new SprintTracker();
    await tracker.track(sprintId);
  } catch (error) {
    console.error('Sprint tracking failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = SprintTracker;