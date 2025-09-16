'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert('reference_sources', [
      {
        source_id: '3c74d3d7-08bb-4b64-a3aa-4ab37e84b4bd',
        source_key: 'SFIA',
        description: 'Digital & IT competencies framework',
        url: 'https://sfia-online.org/',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        source_id: '6ec52f5f-71d1-4416-8dfc-20c20a80051a',
        source_key: 'ISO 14001/50001',
        description: 'Environment/Energy management frameworks',
        url: 'https://www.iso.org/',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        source_id: '0a71c47e-6d77-4031-b3d1-568ca17af95e',
        source_key: 'ESCO',
        description: 'EU Occupations/Skills (multilingual)',
        url: 'https://esco.ec.europa.eu/',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        source_id: '906de8ae-c25d-44ff-acfb-0607fd80ba90',
        source_key: 'O*NET',
        description: 'US DoL roles, tasks and KSAs',
        url: 'https://www.onetonline.org/',
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('reference_sources', null, {});
  }
};