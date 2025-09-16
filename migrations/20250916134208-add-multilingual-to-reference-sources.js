'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add multilingual description columns
    await queryInterface.addColumn('reference_sources', 'description_en', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('reference_sources', 'description_it', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('reference_sources', 'description_fr', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('reference_sources', 'description_es', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Add multilingual name columns
    await queryInterface.addColumn('reference_sources', 'name_en', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('reference_sources', 'name_it', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('reference_sources', 'name_fr', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('reference_sources', 'name_es', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('reference_sources', 'description_en');
    await queryInterface.removeColumn('reference_sources', 'description_it');
    await queryInterface.removeColumn('reference_sources', 'description_fr');
    await queryInterface.removeColumn('reference_sources', 'description_es');
    await queryInterface.removeColumn('reference_sources', 'name_en');
    await queryInterface.removeColumn('reference_sources', 'name_it');
    await queryInterface.removeColumn('reference_sources', 'name_fr');
    await queryInterface.removeColumn('reference_sources', 'name_es');
  }
};