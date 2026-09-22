/**
 * PostgreSQL Integration Test Setup & Teardown
 *
 * Manages the lifecycle of a disposable PostgreSQL Docker container,
 * creates a Sequelize connection, compiles test models from AST definitions,
 * wires associations, and syncs the schema to the database.
 */
import { execSync } from 'child_process';
import path from 'path';
import { Sequelize } from 'sequelize';
import {
  createSequelizeModelFromAST,
  wireSequelizeAssociations,
} from '../../src/autoGenerate/models/sqlModelGenerator';
import {
  PgCompanyFields,
  PgUserFields,
  PgPostFields,
  PgCommentFields,
  PgProductFields,
  testRelations,
} from './testSchema';

const COMPOSE_FILE = path.resolve(__dirname, 'docker-compose.test.yml');
const PG_PORT = process.env.PG_PORT || 5433;
const PG_USER = process.env.PG_USER || 'pgtest';
const PG_PASSWORD = process.env.PG_PASSWORD || 'pgtest123';
const PG_DATABASE = process.env.PG_DATABASE || 'autographql_pg_test';
const PG_URI = process.env.PG_URI || `postgres://${PG_USER}:${PG_PASSWORD}@localhost:${PG_PORT}/${PG_DATABASE}`;

let sequelize = null;
let models = {};
let startedOwnContainer = false;

/**
 * Check if PostgreSQL is already reachable
 */
const isPostgresReachable = async () => {
  try {
    const testSeq = new Sequelize(PG_URI, { dialect: 'postgres', logging: false });
    await testSeq.authenticate();
    await testSeq.close();
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Detect available docker compose command ('docker compose' or 'docker-compose')
 */
const getComposeCommand = () => {
  try {
    execSync('docker compose version', { stdio: 'pipe' });
    return 'docker compose';
  } catch (e) {
    try {
      execSync('docker-compose --version', { stdio: 'pipe' });
      return 'docker-compose';
    } catch (err) {
      return null;
    }
  }
};

/**
 * Wait for PostgreSQL to accept connections
 */
const waitForPostgres = async (maxRetries = 30, delayMs = 1000) => {
  for (let i = 0; i < maxRetries; i += 1) {
    try {
      const testSeq = new Sequelize(PG_URI, { dialect: 'postgres', logging: false });
      await testSeq.authenticate();
      await testSeq.close();
      return true;
    } catch (err) {
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw new Error(`PostgreSQL did not become ready after ${maxRetries} retries`);
};

/**
 * Start the test PostgreSQL container
 */
export const startPostgres = async () => {
  // If PostgreSQL is already running and reachable (e.g. CI service container or external DB)
  if (await isPostgresReachable()) {
    return;
  }

  const composeCmd = getComposeCommand();
  if (composeCmd) {
    try {
      execSync(`${composeCmd} -f "${COMPOSE_FILE}" down -v 2>/dev/null || true`, { stdio: 'pipe' });
    } catch (e) {
      // Ignore cleanup errors
    }
    execSync(`${composeCmd} -f "${COMPOSE_FILE}" up -d`, { stdio: 'pipe' });
    startedOwnContainer = true;
  } else {
    // Fallback: try raw docker run
    try {
      execSync('docker rm -f autographql-postgres-test 2>/dev/null || true', { stdio: 'pipe' });
      execSync(
        `docker run -d --name autographql-postgres-test -p ${PG_PORT}:5432 -e POSTGRES_USER=${PG_USER} -e POSTGRES_PASSWORD=${PG_PASSWORD} -e POSTGRES_DB=${PG_DATABASE} postgres:14-alpine`,
        { stdio: 'pipe' },
      );
      startedOwnContainer = true;
    } catch (dockerErr) {
      throw new Error(
        `Failed to start PostgreSQL container. Neither "docker compose", "docker-compose", nor "docker run" succeeded, and no existing PostgreSQL instance was reachable at ${PG_URI}. Error: ${dockerErr.message}`,
      );
    }
  }

  // Wait for PostgreSQL to accept connections
  await waitForPostgres();
};

/**
 * Stop and remove the test PostgreSQL container
 */
export const stopPostgres = () => {
  if (!startedOwnContainer) {
    return;
  }
  const composeCmd = getComposeCommand();
  if (composeCmd) {
    try {
      execSync(`${composeCmd} -f "${COMPOSE_FILE}" down -v 2>/dev/null || true`, { stdio: 'pipe' });
    } catch (e) {
      // Ignore cleanup errors
    }
  } else {
    try {
      execSync('docker rm -f autographql-postgres-test 2>/dev/null || true', { stdio: 'pipe' });
    } catch (e) {
      // Ignore cleanup errors
    }
  }
};

/**
 * Create Sequelize connection and compile all test models
 */
export const setupDatabase = async () => {
  sequelize = new Sequelize(PG_URI, {
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
  });

  await sequelize.authenticate();

  // Compile models from AST field definitions (same as AutoGraphQL does at startup)
  models.PgCompany = createSequelizeModelFromAST('PgCompany', PgCompanyFields, sequelize);
  models.PgUser = createSequelizeModelFromAST('PgUser', PgUserFields, sequelize);
  models.PgPost = createSequelizeModelFromAST('PgPost', PgPostFields, sequelize);
  models.PgComment = createSequelizeModelFromAST('PgComment', PgCommentFields, sequelize);
  models.PgProduct = createSequelizeModelFromAST('PgProduct', PgProductFields, sequelize);

  // Wire associations
  wireSequelizeAssociations(models, testRelations);

  // Sync schema to database (force: true drops and recreates tables)
  await sequelize.sync({ force: true });

  return { sequelize, models };
};

/**
 * Reset all table data (truncate) between test suites
 */
export const resetData = async () => {
  if (!sequelize) return;

  // Disable FK checks, truncate all tables, re-enable FK checks
  await sequelize.query('SET session_replication_role = replica;');
  const modelNames = ['PgComment', 'PgPost', 'PgUser', 'PgCompany', 'PgProduct'];
  for (const name of modelNames) {
    if (models[name]) {
      await models[name].destroy({ where: {}, force: true });
    }
  }
  await sequelize.query('SET session_replication_role = DEFAULT;');
};

/**
 * Close Sequelize connection
 */
export const teardownDatabase = async () => {
  if (sequelize) {
    await sequelize.close();
    sequelize = null;
  }
  models = {};
};

/**
 * Get the active Sequelize instance
 */
export const getSequelize = () => sequelize;

/**
 * Get all compiled models
 */
export const getModels = () => models;

export default {
  startPostgres,
  stopPostgres,
  setupDatabase,
  resetData,
  teardownDatabase,
  getSequelize,
  getModels,
  PG_URI,
  PG_PORT,
  PG_USER,
  PG_PASSWORD,
  PG_DATABASE,
};
