const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get active assessments
    const assessments = await queryInterface.sequelize.query(
      `SELECT id, type, title, time_limit, passing_score
       FROM asm_assessments
       WHERE is_active = true
       LIMIT 10`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Get employees (as candidates)
    const employees = await queryInterface.sequelize.query(
      `SELECT id, user_id
       FROM emp_employees
       WHERE status = 'active'
       LIMIT 30`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (assessments.length === 0 || employees.length === 0) {
      console.log('⚠️  Skipping seed: Missing required data (assessments or employees)');
      return;
    }

    const responses = [];
    const now = new Date();

    // Create assessment responses for each employee-assessment combination
    for (const employee of employees) {
      // Each employee takes 2-3 random assessments
      const assessmentCount = Math.floor(Math.random() * 2) + 2;
      const selectedAssessments = assessments
        .sort(() => 0.5 - Math.random())
        .slice(0, assessmentCount);

      for (const assessment of selectedAssessments) {
        const startTime = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Within last 30 days
        const timeSpent = Math.floor(Math.random() * (assessment.time_limit || 3600)) + 300; // Random time up to limit
        const completedTime = new Date(startTime.getTime() + timeSpent * 1000);

        // 80% completed, 20% in progress
        const status = Math.random() > 0.2 ? 'completed' : 'in_progress';

        responses.push({
          id: uuidv4(),
          assessment_id: assessment.id,
          candidate_id: employee.user_id,
          job_application_id: null, // Not linked to job applications for now
          started_at: startTime,
          completed_at: status === 'completed' ? completedTime : null,
          status: status,
          time_spent: status === 'completed' ? timeSpent : null,
          ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
          browser_info: JSON.stringify({
            browser: ['Chrome', 'Firefox', 'Safari'][Math.floor(Math.random() * 3)],
            os: ['Windows', 'macOS', 'Linux'][Math.floor(Math.random() * 3)],
            version: `${Math.floor(Math.random() * 100)}.0`
          }),
          created_at: startTime,
          updated_at: status === 'completed' ? completedTime : now
        });
      }
    }

    if (responses.length > 0) {
      await queryInterface.bulkInsert('asm_assessment_responses', responses);
      console.log(`✅ Populated ${responses.length} assessment responses`);

      const completed = responses.filter(r => r.status === 'completed').length;
      const inProgress = responses.length - completed;
      console.log(`   📊 Completed: ${completed}, In Progress: ${inProgress}`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('asm_assessment_responses', null, {});
  }
};