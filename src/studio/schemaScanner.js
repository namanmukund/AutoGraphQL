import fs from 'fs';
import path from 'path';
import { getDefaultDatabaseDialect, DATABASE_DIALECTS } from '../../constants';
import { getModelRLSPolicy, listRLSPolicies } from '../security/rls';
import db from '../db';

/**
 * Returns metadata about all discovered schemas, models, fields, and directives.
 *
 * @returns {Object} Studio schema metadata
 */
export const getStudioSchemaMetadata = () => {
  const schemasDir = path.resolve(process.cwd(), 'schemas');
  const userSchemas = [];

  if (fs.existsSync(schemasDir)) {
    const files = fs.readdirSync(schemasDir);
    files.forEach((file) => {
      if (file.endsWith('.graphql') || file.endsWith('.gql')) {
        const fullPath = path.join(schemasDir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        userSchemas.push({
          name: file.replace(/\.(graphql|gql)$/, ''),
          filename: file,
          path: fullPath,
          content,
        });
      }
    });
  }

  const defaultDialect = getDefaultDatabaseDialect();

  return {
    defaultDatabaseDialect: defaultDialect,
    schemasCount: userSchemas.length,
    schemas: userSchemas,
    rlsPolicies: listRLSPolicies(),
  };
};

/**
 * Returns database information, connection states, and model definitions.
 *
 * @returns {Object} Database diagnostics
 */
export const getStudioDatabaseInfo = () => {
  const defaultDialect = getDefaultDatabaseDialect();
  const info = {
    defaultDialect,
    mongodb: {
      status: (db && db.mongoose && db.mongoose.readyState === 1) ? 'connected' : 'disconnected',
      models: [],
    },
    postgres: {
      status: (db && db.sequelize) ? 'configured' : 'disabled',
      models: [],
    },
    redis: {
      status: process.env.REDIS_HOST ? 'configured' : 'disabled',
    },
  };

  if (db && db.mongoose && db.mongoose.models) {
    info.mongodb.models = Object.keys(db.mongoose.models);
  }

  if (db && db.sequelize && db.sequelize.models) {
    info.postgres.models = Object.keys(db.sequelize.models);
  }

  return info;
};

/**
 * Returns list of custom hooks discovered from root `hooks/` folder.
 *
 * @returns {Array} List of hook files and code
 */
export const getStudioHooksList = () => {
  const hooksDir = path.resolve(process.cwd(), 'hooks');
  const hooks = [];

  if (fs.existsSync(hooksDir)) {
    const files = fs.readdirSync(hooksDir);
    files.forEach((file) => {
      if (file.endsWith('.js') && !file.startsWith('_')) {
        const fullPath = path.join(hooksDir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        hooks.push({
          name: file.replace(/\.js$/, ''),
          filename: file,
          path: fullPath,
          content,
        });
      }
    });
  }

  return hooks;
};
