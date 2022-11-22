import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';

import { dbConfig, sqlDBConfig } from '../utils';
import options from '../config/mongoDb/mongooseConfig';

// MongoDB Connection Setup
mongoose.connect(dbConfig.dbUri, options);

// Postgres Connection Setup
let sequelizeInstance;
if (sqlDBConfig.uri) {
  sequelizeInstance = new Sequelize(sqlDBConfig.uri, {
    logging: sqlDBConfig.logging,
  });
} else {
  sequelizeInstance = new Sequelize(sqlDBConfig.database, sqlDBConfig.username, sqlDBConfig.password, {
    host: sqlDBConfig.host,
    dialect: sqlDBConfig.dialect,
    logging: sqlDBConfig.logging,
  });
}

export default { mongoose: mongoose.connection, sequelize: sequelizeInstance };
