require('dotenv').config();
const { Sequelize } = require('sequelize');
const { initReferenceSource } = require('./models/ReferenceSource');

const referenceSources = [
  {
    source_id: '3c74d3d7-08bb-4b64-a3aa-4ab37e84b4bd',
    source_key: 'SFIA',
    description: 'Digital & IT competencies framework',
    url: 'https://sfia-online.org/',
    is_active: true
  },
  {
    source_id: '6ec52f5f-71d1-4416-8dfc-20c20a80051a',
    source_key: 'ISO 14001/50001',
    description: 'Environment/Energy management frameworks',
    url: 'https://www.iso.org/',
    is_active: true
  },
  {
    source_id: '0a71c47e-6d77-4031-b3d1-568ca17af95e',
    source_key: 'ESCO',
    description: 'EU Occupations/Skills (multilingual)',
    url: 'https://esco.ec.europa.eu/',
    is_active: true
  },
  {
    source_id: '906de8ae-c25d-44ff-acfb-0607fd80ba90',
    source_key: 'O*NET',
    description: 'US DoL roles, tasks and KSAs',
    url: 'https://www.onetonline.org/',
    is_active: true
  }
];

async function importReferenceSources() {
  try {
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false
    });

    await sequelize.authenticate();
    console.log('Database connected successfully');

    const ReferenceSource = initReferenceSource(sequelize);

    console.log('Checking existing reference sources...');
    const existingCount = await ReferenceSource.count();

    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing reference sources. Skipping import.`);
      return;
    }

    console.log('Importing reference sources...');
    for (const source of referenceSources) {
      await ReferenceSource.create(source);
      console.log(`Created reference source: ${source.source_key}`);
    }

    console.log('Successfully imported all reference sources!');
    process.exit(0);
  } catch (error) {
    console.error('Error importing reference sources:', error);
    process.exit(1);
  }
}

importReferenceSources();