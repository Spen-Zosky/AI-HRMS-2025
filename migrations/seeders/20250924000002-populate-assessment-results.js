const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get completed assessment responses
    const responses = await queryInterface.sequelize.query(
      `SELECT id as response_id, assessment_id, candidate_id
       FROM asm_assessment_responses
       WHERE status = 'completed'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (responses.length === 0) {
      console.log('⚠️  Skipping seed: No completed assessment responses found');
      return;
    }

    // Get questions for each assessment
    const questionsMap = {};
    for (const response of responses) {
      if (!questionsMap[response.assessment_id]) {
        const questions = await queryInterface.sequelize.query(
          `SELECT id, question_type, correct_answer, points
           FROM asm_assessment_questions
           WHERE assessment_id = :assessmentId`,
          {
            replacements: { assessmentId: response.assessment_id },
            type: Sequelize.QueryTypes.SELECT
          }
        );
        questionsMap[response.assessment_id] = questions;
      }
    }

    const results = [];
    const now = new Date();

    // Generate results for each response
    for (const response of responses) {
      const questions = questionsMap[response.assessment_id];
      if (!questions || questions.length === 0) continue;

      // 70% pass rate - some get 70%+ correct, others get less
      const shouldPass = Math.random() > 0.3;
      const correctRate = shouldPass ? 0.7 + (Math.random() * 0.3) : 0.3 + (Math.random() * 0.3);

      for (const question of questions) {
        const isCorrect = Math.random() < correctRate;
        const timeSpent = Math.floor(Math.random() * 180) + 30; // 30-210 seconds per question

        let answer;
        if (question.question_type === 'single_choice' || question.question_type === 'multiple_choice') {
          if (isCorrect) {
            // correct_answer is a plain string, wrap it in JSON
            answer = question.correct_answer;
          } else {
            // Parse options and select a wrong answer
            try {
              const options = JSON.parse(question.options || '[]');
              const wrongOptions = options.filter(opt => opt !== question.correct_answer);
              answer = wrongOptions[0] || 'Wrong answer';
            } catch (e) {
              answer = 'Wrong answer';
            }
          }
        } else if (question.question_type === 'text' || question.question_type === 'essay') {
          answer = isCorrect ? question.correct_answer : 'Incorrect text response';
        } else {
          answer = isCorrect ? question.correct_answer : 'Incorrect answer';
        }

        results.push({
          id: uuidv4(),
          response_id: response.response_id,
          question_id: question.id,
          answer: JSON.stringify(answer),
          is_correct: isCorrect,
          score: isCorrect ? question.points : 0,
          time_spent: timeSpent,
          ai_evaluation: null,
          manual_evaluation: null,
          evaluator_id: null,
          evaluated_at: null,
          created_at: now,
          updated_at: now
        });
      }
    }

    if (results.length > 0) {
      await queryInterface.bulkInsert('asm_assessment_results', results);
      console.log(`✅ Populated ${results.length} assessment results`);

      const correct = results.filter(r => r.is_correct).length;
      const incorrect = results.length - correct;
      const accuracy = ((correct / results.length) * 100).toFixed(1);
      console.log(`   📊 Correct: ${correct}, Incorrect: ${incorrect}, Accuracy: ${accuracy}%`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('asm_assessment_results', null, {});
  }
};