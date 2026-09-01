import assert from 'assert';
import fs from 'fs';
import path from 'path';
import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import { discoverAndLoadUserSchemas } from '../src/autoGenerate/utils/schemaAutoDiscovery';
import { discoverAndLoadUserHooks } from '../src/autoGenerate/utils/hookAutoDiscovery';
import { getStudioSchemaMetadata, getStudioDatabaseInfo, getStudioHooksList } from '../src/studio/schemaScanner';
import studioRouter from '../src/studio/studioRoutes';

describe('AutoGraphQL Zero-Config Drop-in & Studio UI Platform', () => {
  const tempDir = path.resolve(__dirname, 'temp_studio_test');
  const tempSchemasDir = path.join(tempDir, 'schemas');
  const tempHooksDir = path.join(tempDir, 'hooks');

  let server;
  let baseUrl;

  before((done) => {
    if (!fs.existsSync(tempSchemasDir)) fs.mkdirSync(tempSchemasDir, { recursive: true });
    if (!fs.existsSync(tempHooksDir)) fs.mkdirSync(tempHooksDir, { recursive: true });

    const app = express();
    app.use(bodyParser.json());
    app.use(studioRouter);

    server = http.createServer(app);
    server.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      done();
    });
  });

  after((done) => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  describe('1. Zero-Config Schema Auto-Discovery (schemas/)', () => {
    it('should discover and load .graphql schema files from directory', () => {
      const sampleSDL = `
        type Course @model {
          id: ID!
          title: String!
          price: Float!
        }
      `;
      fs.writeFileSync(path.join(tempSchemasDir, 'Course.graphql'), sampleSDL, 'utf8');

      const discovered = discoverAndLoadUserSchemas(tempSchemasDir);
      assert.strictEqual(Array.isArray(discovered), true);
      assert.strictEqual(discovered.length, 1);
      assert.strictEqual(discovered[0].includes('type Course @model'), true);
    });

    it('should discover nested .gql schema files in subdirectories', () => {
      const subDir = path.join(tempSchemasDir, 'ecommerce');
      if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });

      const productSDL = `
        type Product @model(database: postgres) {
          id: ID!
          sku: String! @unique
        }
      `;
      fs.writeFileSync(path.join(subDir, 'Product.gql'), productSDL, 'utf8');

      const discovered = discoverAndLoadUserSchemas(tempSchemasDir);
      assert.strictEqual(discovered.length >= 2, true);
      assert.strictEqual(discovered.some((s) => s.includes('type Product @model')), true);
    });

    it('should return empty array if schemas directory does not exist', () => {
      const discovered = discoverAndLoadUserSchemas(path.join(tempDir, 'non_existent'));
      assert.deepStrictEqual(discovered, []);
    });
  });

  describe('2. Zero-Config Hook Auto-Discovery (hooks/)', () => {
    it('should discover pre-hooks and post-hooks exported from JS files', () => {
      const hookFileContent = `
        const addCoursePreHook = [
          (input) => {
            input.slug = 'auto-slug';
            return input;
          },
        ];
        const addCoursePostHook = [
          (result) => result,
        ];
        module.exports = {
          addCoursePreHook,
          addCoursePostHook,
        };
      `;
      fs.writeFileSync(path.join(tempHooksDir, 'courseHooks.js'), hookFileContent, 'utf8');

      const hooks = discoverAndLoadUserHooks(tempHooksDir);
      assert.strictEqual(typeof hooks, 'object');
      assert.strictEqual(Array.isArray(hooks.addCoursePreHook), true);
      assert.strictEqual(hooks.addCoursePreHook.length, 1);
      assert.strictEqual(Array.isArray(hooks.addCoursePostHook), true);

      // Execute discovered hook
      const modifiedInput = hooks.addCoursePreHook[0]({ title: 'Intro to AI' });
      assert.strictEqual(modifiedInput.slug, 'auto-slug');
    });
  });

  describe('3. Studio Diagnostics & Metadata Scanners', () => {
    it('should scan and return studio schema metadata', () => {
      const metadata = getStudioSchemaMetadata();
      assert.strictEqual(typeof metadata, 'object');
      assert.strictEqual(typeof metadata.defaultDatabaseDialect, 'string');
      assert.strictEqual(typeof metadata.schemasCount, 'number');
      assert.strictEqual(Array.isArray(metadata.schemas), true);
    });

    it('should return database connection states and model lists', () => {
      const dbInfo = getStudioDatabaseInfo();
      assert.strictEqual(typeof dbInfo, 'object');
      assert.strictEqual(typeof dbInfo.mongodb, 'object');
      assert.strictEqual(typeof dbInfo.postgres, 'object');
      assert.strictEqual(Array.isArray(dbInfo.mongodb.models), true);
    });

    it('should list registered user hooks', () => {
      const hooksList = getStudioHooksList();
      assert.strictEqual(Array.isArray(hooksList), true);
    });
  });

  describe('4. Studio REST API Endpoints (/api/studio/*)', () => {
    it('GET /api/studio/schemas - should return schema metadata', async () => {
      const res = await fetch(`${baseUrl}/api/studio/schemas`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(typeof body.data.defaultDatabaseDialect, 'string');
    });

    it('POST /api/studio/schemas - should save a new .graphql file to schemas/', async () => {
      const schemaSDL = 'type TestLesson @model { id: ID! title: String! }';
      const res = await fetch(`${baseUrl}/api/studio/schemas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'TestLesson', content: schemaSDL }),
      });
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.message.includes('TestLesson.graphql'), true);

      // Clean up
      await fetch(`${baseUrl}/api/studio/schemas/TestLesson`, { method: 'DELETE' });
    });

    it('GET /api/studio/db-info - should return database status', async () => {
      const res = await fetch(`${baseUrl}/api/studio/db-info`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(typeof body.data.mongodb, 'object');
    });

    it('POST /api/studio/generate-token - should generate a signed JWT test token', async () => {
      const res = await fetch(`${baseUrl}/api/studio/generate-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'ADMIN', userId: 'usr_100', tenantId: 'tenant_abc' }),
      });
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(typeof body.token, 'string');
      assert.strictEqual(body.payload.tenantId, 'tenant_abc');
    });
  });
});
