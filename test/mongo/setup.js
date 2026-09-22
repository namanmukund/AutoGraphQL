/**
 * MongoDB Integration Test Setup & Teardown
 *
 * Manages the lifecycle of the test MongoDB database, Mongoose connection,
 * dynamic model compilation, collection cleanup, and the client GraphQL execution harness.
 */
import mongoose from 'mongoose';
import { execSync } from 'child_process';
import { graphql } from 'graphql';
import { createDataLoaders } from '../../src/dataloader';
import {
  mongoGraphQLSDL,
  createMongooseModelsFromAST,
  buildExecutableMongoSchema,
} from './testSchema';

const MONGO_PORT = process.env.DATABASE_PORT || 27017;
const MONGO_HOST = process.env.DATABASE_HOST || 'localhost';
const MONGO_DB = process.env.MONGO_TEST_DB || 'autographql_mongo_test';
export const MONGO_TEST_URI = process.env.MONGODB_URI || `mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`;

let testConnection = null;
let testModels = {};
let executableSchema = null;

/**
 * Check if MongoDB is reachable
 */
export const isMongoReachable = async () => {
  try {
    const conn = await mongoose.createConnection(MONGO_TEST_URI, {
      serverSelectionTimeoutMS: 2000,
    }).asPromise();
    await conn.close();
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Start MongoDB container if not already reachable
 */
export const ensureMongoRunning = async () => {
  if (await isMongoReachable()) {
    return;
  }

  // Try docker compose or docker run
  try {
    execSync('docker compose up -d mongodb 2>/dev/null || docker-compose up -d mongodb 2>/dev/null', { stdio: 'pipe' });
  } catch (e) {
    try {
      execSync('docker start autographql-mongodb 2>/dev/null || docker run -d --name autographql-mongodb -p 27017:27017 mongo:5.0', { stdio: 'pipe' });
    } catch (err) {
      // Continue to retry loop
    }
  }

  // Wait for MongoDB to become ready
  const maxRetries = 20;
  for (let i = 0; i < maxRetries; i += 1) {
    if (await isMongoReachable()) {
      return;
    }
    await new Promise((res) => setTimeout(res, 1000));
  }
  throw new Error(`MongoDB was not reachable at ${MONGO_TEST_URI} after ${maxRetries} retries`);
};

/**
 * Connect to test MongoDB database and initialize models & schema
 */
export const startMongoTestEnvironment = async (sdl = mongoGraphQLSDL, forceNew = false) => {
  await ensureMongoRunning();

  if (forceNew && testConnection) {
    if (testConnection.readyState !== 0) {
      await testConnection.close();
    }
    testConnection = null;
  }

  if (!testConnection || testConnection.readyState !== 1) {
    testConnection = await mongoose.createConnection(MONGO_TEST_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
  }

  testModels = createMongooseModelsFromAST(sdl, testConnection);
  // Ensure indexes (such as unique constraints) are initialized
  for (const m of Object.values(testModels)) {
    if (m && typeof m.init === 'function') {
      await m.init().catch(() => {});
    }
  }

  executableSchema = buildExecutableMongoSchema({ models: testModels, sdlString: sdl });

  return {
    connection: testConnection,
    models: testModels,
    schema: executableSchema,
  };
};

/**
 * Clears all records in test collections
 */
export const clearMongoCollections = async (models = testModels) => {
  if (!models) return;
  const modelKeys = Object.keys(models);
  for (const key of modelKeys) {
    const Model = models[key];
    if (Model && typeof Model.deleteMany === 'function') {
      await Model.deleteMany({}).exec();
    }
  }
};

/**
 * Teardown and close database connection
 */
export const closeMongoConnection = async () => {
  if (testConnection && testConnection.readyState !== 0) {
    await testConnection.close();
  }
};

/**
 * Creates an AutoGraphQL client wrapper that interacts with the backend
 * EXCLUSIVELY through GraphQL queries and mutations.
 *
 * @param {GraphQLSchema} schema
 * @param {Object} [models=testModels]
 * @returns {Object} Client API instance with .query() and .mutate()
 */
export const createGraphQLClient = (schema = executableSchema, models = testModels) => {
  const executeOperation = async (queryStr, variables = {}, customContext = {}) => {
    const loaders = createDataLoaders(models);
    const context = {
      loaders,
      models,
      ...customContext,
    };

    const result = await graphql({
      schema,
      source: queryStr,
      variableValues: variables,
      contextValue: context,
    });

    return result;
  };

  return {
    query: (queryStr, variables = {}, context = {}) => executeOperation(queryStr, variables, context),
    mutate: (mutationStr, variables = {}, context = {}) => executeOperation(mutationStr, variables, context),
  };
};
