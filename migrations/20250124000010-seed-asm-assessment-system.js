'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT
          o.org_id as tenant_id,
          o.org_name,
          o.org_industry
         FROM org_organizations o
         ORDER BY o.org_name`,
        { transaction }
      );

      const [systemUser] = await queryInterface.sequelize.query(
        `SELECT usr_id FROM sys_users ORDER BY usr_id LIMIT 1`,
        { transaction }
      );

      const createdBy = systemUser[0]?.usr_id;
      if (!createdBy) {
        throw new Error('No system user found to create assessments');
      }

      const assessments = [];
      const assessmentQuestions = [];
      const currentDate = new Date();

      const assessmentTemplates = {
        technical_coding: {
          title: 'Technical Coding Assessment',
          description: 'Evaluates programming skills, algorithm knowledge, and problem-solving ability',
          type: 'technical',
          difficulty_level: 'intermediate',
          time_limit: 90,
          passing_score: 70,
          instructions: 'Complete all questions within the time limit. You may use documentation but not external help.',
          questions: [
            {
              question_text: 'What is the time complexity of binary search algorithm?',
              question_type: 'single_choice',
              options: JSON.stringify([
                { id: 'a', text: 'O(n)' },
                { id: 'b', text: 'O(log n)' },
                { id: 'c', text: 'O(n log n)' },
                { id: 'd', text: 'O(n²)' }
              ]),
              correct_answer: JSON.stringify({ id: 'b' }),
              points: 10,
              difficulty: 'easy',
              explanation: 'Binary search divides the search space in half with each iteration, resulting in logarithmic time complexity.'
            },
            {
              question_text: 'Which data structure uses LIFO (Last In First Out) principle?',
              question_type: 'single_choice',
              options: JSON.stringify([
                { id: 'a', text: 'Queue' },
                { id: 'b', text: 'Stack' },
                { id: 'c', text: 'Linked List' },
                { id: 'd', text: 'Hash Table' }
              ]),
              correct_answer: JSON.stringify({ id: 'b' }),
              points: 10,
              difficulty: 'easy',
              explanation: 'Stack follows LIFO principle where the last element added is the first to be removed.'
            },
            {
              question_text: 'Implement a function to reverse a linked list.',
              question_type: 'code',
              options: JSON.stringify({
                language: 'javascript',
                template: 'function reverseLinkedList(head) {\n  // Your code here\n}'
              }),
              correct_answer: JSON.stringify({
                test_cases: [
                  { input: '[1,2,3,4,5]', output: '[5,4,3,2,1]' },
                  { input: '[1]', output: '[1]' },
                  { input: '[]', output: '[]' }
                ]
              }),
              points: 25,
              difficulty: 'medium',
              time_limit: 30
            },
            {
              question_text: 'What are the benefits of using TypeScript over JavaScript? (Select all that apply)',
              question_type: 'multiple_choice',
              options: JSON.stringify([
                { id: 'a', text: 'Static type checking' },
                { id: 'b', text: 'Better IDE support' },
                { id: 'c', text: 'Faster runtime performance' },
                { id: 'd', text: 'Enhanced code maintainability' }
              ]),
              correct_answer: JSON.stringify({ ids: ['a', 'b', 'd'] }),
              points: 15,
              difficulty: 'medium'
            }
          ]
        },
        personality_big_five: {
          title: 'Big Five Personality Assessment',
          description: 'Measures the five major dimensions of personality: Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism',
          type: 'personality',
          difficulty_level: 'beginner',
          time_limit: 30,
          passing_score: 0,
          instructions: 'Rate each statement on a scale of 1-5 based on how accurately it describes you. There are no right or wrong answers.',
          questions: [
            {
              question_text: 'I am always prepared and pay attention to details.',
              question_type: 'rating',
              options: JSON.stringify({
                scale: 5,
                labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
                dimension: 'Conscientiousness'
              }),
              correct_answer: JSON.stringify({ no_correct_answer: true }),
              points: 5,
              difficulty: 'easy'
            },
            {
              question_text: 'I enjoy being the center of attention in social situations.',
              question_type: 'rating',
              options: JSON.stringify({
                scale: 5,
                labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
                dimension: 'Extraversion'
              }),
              correct_answer: JSON.stringify({ no_correct_answer: true }),
              points: 5,
              difficulty: 'easy'
            },
            {
              question_text: 'I am interested in abstract ideas and theoretical concepts.',
              question_type: 'rating',
              options: JSON.stringify({
                scale: 5,
                labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
                dimension: 'Openness'
              }),
              correct_answer: JSON.stringify({ no_correct_answer: true }),
              points: 5,
              difficulty: 'easy'
            },
            {
              question_text: 'I try to be courteous and considerate to everyone.',
              question_type: 'rating',
              options: JSON.stringify({
                scale: 5,
                labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
                dimension: 'Agreeableness'
              }),
              correct_answer: JSON.stringify({ no_correct_answer: true }),
              points: 5,
              difficulty: 'easy'
            },
            {
              question_text: 'I often worry about things that might go wrong.',
              question_type: 'rating',
              options: JSON.stringify({
                scale: 5,
                labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
                dimension: 'Neuroticism'
              }),
              correct_answer: JSON.stringify({ no_correct_answer: true }),
              points: 5,
              difficulty: 'easy'
            }
          ]
        },
        situational_judgment: {
          title: 'Situational Judgment Test - Leadership',
          description: 'Evaluates decision-making and problem-solving in realistic workplace scenarios',
          type: 'behavioral',
          difficulty_level: 'advanced',
          time_limit: 45,
          passing_score: 75,
          instructions: 'Read each scenario carefully and select the most appropriate response. Consider organizational values and team dynamics.',
          questions: [
            {
              question_text: 'You discover that a team member has been consistently missing deadlines, affecting the entire project. What do you do?',
              question_type: 'single_choice',
              options: JSON.stringify([
                { id: 'a', text: 'Immediately escalate to senior management', score: 2 },
                { id: 'b', text: 'Have a private conversation to understand the root cause', score: 5 },
                { id: 'c', text: 'Redistribute their work to other team members', score: 3 },
                { id: 'd', text: 'Document the issues and wait for formal review', score: 1 }
              ]),
              correct_answer: JSON.stringify({ id: 'b', scoring_type: 'weighted' }),
              points: 20,
              difficulty: 'medium',
              explanation: 'Direct communication to understand root causes shows leadership empathy and problem-solving skills.'
            },
            {
              question_text: 'Two senior team members have conflicting approaches to a critical project. How do you handle this?',
              question_type: 'single_choice',
              options: JSON.stringify([
                { id: 'a', text: 'Let them work it out themselves', score: 1 },
                { id: 'b', text: 'Choose the approach from the more experienced person', score: 3 },
                { id: 'c', text: 'Facilitate a discussion to find a hybrid solution', score: 5 },
                { id: 'd', text: 'Implement your own third approach', score: 2 }
              ]),
              correct_answer: JSON.stringify({ id: 'c', scoring_type: 'weighted' }),
              points: 20,
              difficulty: 'hard',
              explanation: 'Facilitating collaborative problem-solving demonstrates conflict resolution and team leadership.'
            },
            {
              question_text: 'Rank these actions in order of priority when a critical production bug is discovered: (1=highest priority)',
              question_type: 'multiple_choice',
              options: JSON.stringify([
                { id: 'a', text: 'Notify affected customers' },
                { id: 'b', text: 'Assemble emergency response team' },
                { id: 'c', text: 'Begin root cause analysis' },
                { id: 'd', text: 'Implement temporary fix' }
              ]),
              correct_answer: JSON.stringify({
                order: ['b', 'd', 'a', 'c'],
                explanation: 'Assemble team → Apply fix → Communicate → Analyze'
              }),
              points: 25,
              difficulty: 'hard'
            }
          ]
        },
        cognitive_ability: {
          title: 'Cognitive Ability Assessment',
          description: 'Measures problem-solving, logical reasoning, and analytical thinking',
          type: 'cognitive',
          difficulty_level: 'intermediate',
          time_limit: 60,
          passing_score: 70,
          instructions: 'Answer all questions to the best of your ability. Some questions have time limits.',
          questions: [
            {
              question_text: 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?',
              question_type: 'single_choice',
              options: JSON.stringify([
                { id: 'a', text: 'Yes' },
                { id: 'b', text: 'No' },
                { id: 'c', text: 'Cannot be determined' }
              ]),
              correct_answer: JSON.stringify({ id: 'a' }),
              points: 15,
              difficulty: 'medium',
              explanation: 'This follows transitive property: if A→B and B→C, then A→C'
            },
            {
              question_text: 'Complete the series: 2, 6, 12, 20, 30, ?',
              question_type: 'text',
              options: JSON.stringify({ unit: 'number' }),
              correct_answer: JSON.stringify({ value: 42, tolerance: 0 }),
              points: 15,
              difficulty: 'medium',
              explanation: 'Pattern: add consecutive even numbers (4, 6, 8, 10, 12)'
            },
            {
              question_text: 'A train travels 120 miles in 2 hours. At the same speed, how far will it travel in 5 hours?',
              question_type: 'text',
              options: JSON.stringify({ unit: 'miles' }),
              correct_answer: JSON.stringify({ value: 300, tolerance: 0 }),
              points: 15,
              difficulty: 'easy',
              time_limit: 120
            }
          ]
        }
      };

      for (const org of organizations) {
        const industryTemplates = ['technical_coding', 'personality_big_five', 'situational_judgment', 'cognitive_ability'];

        if (org.org_industry === 'Financial Services') {
          industryTemplates.push('technical_coding');
        } else if (org.org_industry === 'Technology' || org.org_industry === 'Information Technology') {
          industryTemplates.push('technical_coding', 'technical_coding');
        }

        for (const templateKey of industryTemplates.slice(0, 3)) {
          const template = assessmentTemplates[templateKey];
          const assessmentId = uuidv4();

          assessments.push({
            id: assessmentId,
            tenant_id: org.tenant_id,
            title: `${org.org_name} - ${template.title}`,
            description: template.description,
            type: template.type,
            job_role_id: null,
            difficulty_level: template.difficulty_level,
            time_limit: template.time_limit,
            passing_score: template.passing_score,
            instructions: template.instructions,
            is_active: true,
            created_by: createdBy,
            created_at: currentDate,
            updated_at: currentDate
          });

          template.questions.forEach((q, index) => {
            assessmentQuestions.push({
              id: uuidv4(),
              assessment_id: assessmentId,
              question_text: q.question_text,
              question_type: q.question_type,
              options: q.options,
              correct_answer: q.correct_answer,
              points: q.points,
              order_index: index + 1,
              skill_id: null,
              difficulty: q.difficulty,
              explanation: q.explanation || null,
              time_limit: q.time_limit || null,
              created_at: currentDate,
              updated_at: currentDate
            });
          });
        }
      }

      if (assessments.length > 0) {
        await queryInterface.bulkInsert('asm_assessments', assessments, { transaction });
        console.log(`✅ Seeded ${assessments.length} assessments`);
      }

      if (assessmentQuestions.length > 0) {
        await queryInterface.bulkInsert('asm_assessment_questions', assessmentQuestions, { transaction });
        console.log(`✅ Seeded ${assessmentQuestions.length} assessment questions`);
      }

      await transaction.commit();
      console.log(`\n✅ Successfully seeded assessment system:`);
      console.log(`   - ${assessments.length} assessments across ${organizations.length} organizations`);
      console.log(`   - ${assessmentQuestions.length} questions (avg ${Math.round(assessmentQuestions.length / assessments.length)} per assessment)`);
      console.log(`   - Question types: single_choice, multiple_choice, coding, likert_scale, ranking, numeric_input`);

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to seed assessment system:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('asm_assessment_questions', {
        created_at: {
          [Sequelize.Op.gte]: '2025-01-24 00:00:00'
        }
      }, { transaction });

      await queryInterface.bulkDelete('asm_assessments', {
        created_at: {
          [Sequelize.Op.gte]: '2025-01-24 00:00:00'
        }
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};