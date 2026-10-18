import dotenv from 'dotenv';

dotenv.config();

import seedDatabase from './seeds/index.js';

const isSeedArg = process.argv.includes('--seed') || process.argv.includes('-s');

if (isSeedArg) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export default seedDatabase;
