const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get assessments that have responses but no questions
    const assessmentsNeedingQuestions = await queryInterface.sequelize.query(
      `SELECT DISTINCT a.id, a.title, a.type, a.difficulty_level
       FROM asm_assessments a
       INNER JOIN asm_assessment_responses r ON a.id = r.assessment_id
       LEFT JOIN asm_assessment_questions q ON a.id = q.assessment_id
       WHERE q.id IS NULL`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (assessmentsNeedingQuestions.length === 0) {
      console.log('⚠️  No assessments need questions');
      return;
    }

    const questions = [];
    const now = new Date();

    // Generate questions for each assessment based on type
    for (const assessment of assessmentsNeedingQuestions) {
      let questionCount = 10; // Default
      let questionTemplates = [];

      if (assessment.type === 'technical') {
        questionCount = 8;
        questionTemplates = [
          {
            text: 'What is the primary purpose of this technology/concept?',
            type: 'single_choice',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correct: 0,
            points: 10
          },
          {
            text: 'Which of the following statements is correct?',
            type: 'single_choice',
            options: ['Statement 1', 'Statement 2', 'Statement 3', 'Statement 4'],
            correct: 1,
            points: 10
          },
          {
            text: 'Identify the best practice in this scenario.',
            type: 'single_choice',
            options: ['Practice A', 'Practice B', 'Practice C', 'Practice D'],
            correct: 2,
            points: 15
          },
          {
            text: 'What is the expected output of this code/operation?',
            type: 'single_choice',
            options: ['Output 1', 'Output 2', 'Output 3', 'Error'],
            correct: 0,
            points: 15
          },
          {
            text: 'This statement about the technology is true or false?',
            type: 'single_choice',
            options: ['True', 'False'],
            correct: 0,
            points: 5
          },
          {
            text: 'Which approach provides the best performance?',
            type: 'single_choice',
            options: ['Approach A', 'Approach B', 'Approach C', 'Approach D'],
            correct: 1,
            points: 15
          },
          {
            text: 'This optimization technique is recommended - true or false?',
            type: 'single_choice',
            options: ['True', 'False'],
            correct: 0,
            points: 5
          },
          {
            text: 'What is the main advantage of this method?',
            type: 'single_choice',
            options: ['Advantage A', 'Advantage B', 'Advantage C', 'Advantage D'],
            correct: 2,
            points: 15
          }
        ];
      } else if (assessment.type === 'behavioral') {
        questionCount = 6;
        questionTemplates = [
          {
            text: 'In a team conflict situation, what would you do?',
            type: 'single_choice',
            options: ['Action A', 'Action B', 'Action C', 'Action D'],
            correct: 1,
            points: 15
          },
          {
            text: 'How do you handle tight deadlines?',
            type: 'single_choice',
            options: ['Strategy A', 'Strategy B', 'Strategy C', 'Strategy D'],
            correct: 2,
            points: 15
          },
          {
            text: 'Describe your leadership style.',
            type: 'single_choice',
            options: ['Style A', 'Style B', 'Style C', 'Style D'],
            correct: 0,
            points: 20
          },
          {
            text: 'How do you prioritize tasks?',
            type: 'single_choice',
            options: ['Method A', 'Method B', 'Method C', 'Method D'],
            correct: 1,
            points: 15
          },
          {
            text: 'You believe in collaborative decision making - agree or disagree?',
            type: 'single_choice',
            options: ['Strongly Agree', 'Agree', 'Disagree', 'Strongly Disagree'],
            correct: 0,
            points: 10
          },
          {
            text: 'What motivates you most at work?',
            type: 'single_choice',
            options: ['Factor A', 'Factor B', 'Factor C', 'Factor D'],
            correct: 2,
            points: 15
          }
        ];
      } else {
        // personality, skill-based, or other
        questionCount = 5;
        questionTemplates = [
          {
            text: 'Rate your proficiency in this area.',
            type: 'single_choice',
            options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
            correct: 2,
            points: 15
          },
          {
            text: 'Which scenario best describes your experience?',
            type: 'single_choice',
            options: ['Scenario A', 'Scenario B', 'Scenario C', 'Scenario D'],
            correct: 1,
            points: 20
          },
          {
            text: 'You are comfortable with this type of work.',
            type: 'single_choice',
            options: ['Very Comfortable', 'Comfortable', 'Neutral', 'Uncomfortable'],
            correct: 0,
            points: 15
          },
          {
            text: 'Select the statement that best applies to you.',
            type: 'single_choice',
            options: ['Statement A', 'Statement B', 'Statement C', 'Statement D'],
            correct: 0,
            points: 20
          },
          {
            text: 'How would you approach this challenge?',
            type: 'single_choice',
            options: ['Approach A', 'Approach B', 'Approach C', 'Approach D'],
            correct: 2,
            points: 20
          }
        ];
      }

      // Generate questions based on templates
      const numQuestions = Math.min(questionCount, questionTemplates.length);
      for (let i = 0; i < numQuestions; i++) {
        const template = questionTemplates[i % questionTemplates.length];
        const difficulty = ['easy', 'medium', 'hard'][Math.floor(i / (numQuestions / 3))];

        questions.push({
          id: uuidv4(),
          assessment_id: assessment.id,
          question_text: `${assessment.title} - ${template.text}`,
          question_type: template.type,
          options: JSON.stringify(template.options),
          correct_answer: JSON.stringify(template.options[template.correct]),
          points: template.points,
          order_index: i + 1,
          skill_id: null,
          difficulty: difficulty,
          explanation: `This question tests understanding of key concepts in ${assessment.title.toLowerCase()}.`,
          time_limit: template.type === 'true_false' ? 30 : 120,
          created_at: now,
          updated_at: now
        });
      }
    }

    if (questions.length > 0) {
      await queryInterface.bulkInsert('asm_assessment_questions', questions);
      console.log(`✅ Generated ${questions.length} questions for ${assessmentsNeedingQuestions.length} assessments`);

      // Show breakdown by assessment type
      const breakdown = {};
      assessmentsNeedingQuestions.forEach(a => {
        breakdown[a.type] = (breakdown[a.type] || 0) + 1;
      });
      console.log('   📊 Breakdown:', JSON.stringify(breakdown));
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove only the questions we just added
    await queryInterface.sequelize.query(
      `DELETE FROM asm_assessment_questions
       WHERE assessment_id IN (
         SELECT DISTINCT a.id
         FROM asm_assessments a
         INNER JOIN asm_assessment_responses r ON a.id = r.assessment_id
       )`
    );
  }
};