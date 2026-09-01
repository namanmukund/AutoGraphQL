import fs from 'fs';
import path from 'path';
import { log } from '../../../utils/log';

/**
 * Recursively scans a directory for schema files (.graphql, .gql, .js)
 *
 * @param {string} dir Directory path
 * @param {string[]} fileList Accumulated file paths
 * @returns {string[]} List of absolute file paths
 */
const scanDirectoryForSchemaFiles = (dir, fileList = []) => {
  if (!fs.existsSync(dir)) return fileList;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectoryForSchemaFiles(fullPath, fileList);
    } else if (
      entry.isFile()
      && (entry.name.endsWith('.graphql') || entry.name.endsWith('.gql') || (entry.name.endsWith('.js') && !entry.name.startsWith('_')))
    ) {
      fileList.push(fullPath);
    }
  });

  return fileList;
};

/**
 * Discovers and loads all user-defined GraphQL schemas from the root `schemas/` folder.
 *
 * @param {string} [customSchemasDir] Optional custom directory path for testing
 * @returns {string[]} Array of GraphQL SDL type definitions
 */
export const discoverAndLoadUserSchemas = (customSchemasDir = null) => {
  const schemasDir = customSchemasDir || path.resolve(process.cwd(), 'schemas');
  const discoveredTypes = [];

  if (!fs.existsSync(schemasDir)) {
    return discoveredTypes;
  }

  const files = scanDirectoryForSchemaFiles(schemasDir);

  files.forEach((filePath) => {
    try {
      if (filePath.endsWith('.graphql') || filePath.endsWith('.gql')) {
        const content = fs.readFileSync(filePath, 'utf8').trim();
        if (content) {
          discoveredTypes.push(content);
        }
      } else if (filePath.endsWith('.js')) {
        // Node ES/CommonJS dynamic require for .js schemas
        // eslint-disable-next-line global-require, import/no-dynamic-require
        const exported = require(filePath);
        const schemaData = exported.default || exported;
        if (typeof schemaData === 'string' && schemaData.trim()) {
          discoveredTypes.push(schemaData);
        } else if (Array.isArray(schemaData)) {
          schemaData.forEach((s) => {
            if (typeof s === 'string' && s.trim()) discoveredTypes.push(s);
          });
        }
      }
    } catch (err) {
      log(`Error loading user schema from ${filePath}: ${err.message}`, 'error');
    }
  });

  return discoveredTypes;
};

export default discoverAndLoadUserSchemas;
