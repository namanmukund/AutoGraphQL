import fs from 'fs';
import path from 'path';
import { getDefaultDatabaseDialect, DATABASE_DIALECTS } from '../../constants';
import { getModelRLSPolicy, listRLSPolicies } from '../security/rls';
import db from '../db';

const BUILT_IN_MODELS = ['User', 'UserProfile', 'Post', 'Comment', 'Category', 'Tag', 'File'];

/**
 * Returns metadata about all discovered schemas, models, fields, and directives.
 *
 * @returns {Object} Studio schema metadata
 */
export const getStudioSchemaMetadata = () => {
  const schemasDir = path.resolve(process.cwd(), 'schemas');
  const userSchemas = [];
  const allModelNames = new Set(BUILT_IN_MODELS);
  const relations = [];

  if (fs.existsSync(schemasDir)) {
    const files = fs.readdirSync(schemasDir);
    files.forEach((file) => {
      if (file.endsWith('.graphql') || file.endsWith('.gql')) {
        const fullPath = path.join(schemasDir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        const modelName = file.replace(/\.(graphql|gql)$/, '');
        allModelNames.add(modelName);

        // Parse relations from content
        const relationMatches = content.matchAll(/(\w+)\s*:\s*(\[?\w+\]?)\s*@relation\s*\(\s*name\s*:\s*"(\w+)"(?:,\s*direction\s*:\s*"(\w+)")?\s*\)/g);
        for (const match of relationMatches) {
          const [, fieldName, targetTypeRaw, relationName, direction = 'BOTH'] = match;
          const targetType = targetTypeRaw.replace(/[\[\]!]/g, '');
          relations.push({
            source: modelName,
            field: fieldName,
            target: targetType,
            relationName,
            direction,
          });
        }

        userSchemas.push({
          name: modelName,
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
    allModels: Array.from(allModelNames),
    relations,
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
