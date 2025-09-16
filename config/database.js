const { Sequelize } = require('sequelize');
const logger = require('../src/utils/logger');

let sequelize;

const connectDB = async () => {
    try {
        sequelize = new Sequelize(process.env.DATABASE_URL, {
            dialect: 'postgres',
            // Fix logging - usa console.log o disabilita
            logging: process.env.NODE_ENV === 'development' ? console.log : false,
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        });

        await sequelize.authenticate();
        logger.info('PostgreSQL connection established successfully');

    } catch (error) {
        logger.error('Unable to connect to PostgreSQL:', error);
        throw error;
    }
};

const getSequelize = () => sequelize;

module.exports = { connectDB, sequelize, getSequelize };
