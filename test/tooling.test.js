import assert from 'assert';
import { buildSchema } from 'graphql';
import schema from '../src/graphql';
import {
  compareSchemas,
  formatDiffReport,
} from '../src/governance/schemaDiff';
import { generateTypeScriptSDK } from '../src/codegen/sdkGenerator';
import {
  computeQueryHash,
  PersistedQueryManager,
  createPersistedQueryPlugin,
} from '../src/persistedQueries';

describe('AutoGraphQL Phase 3: Developer & CI/CD Tooling', () => {
  describe('1. Schema Governance & Breaking Change Linter', () => {
    it('should detect field removal as a breaking change and flag isCompatible = false', () => {
      const baseSdl = `
        type User {
          id: ID!
          name: String!
          email: String
        }
        type Query {
          user(id: ID!): User
        }
      `;

      const currentSdlWithRemovedField = `
        type User {
          id: ID!
          name: String!
        }
        type Query {
          user(id: ID!): User
        }
      `;

      const result = compareSchemas(baseSdl, currentSdlWithRemovedField);

      assert.strictEqual(result.isCompatible, false);
      assert.strictEqual(result.breakingChanges.length >= 1, true);
      const fieldRemoved = result.breakingChanges.find((c) => c.type === 'FIELD_REMOVED');
      assert.ok(fieldRemoved, 'Must detect FIELD_REMOVED');
      assert.ok(fieldRemoved.description.includes('User.email was removed'));
    });

    it('should allow adding new optional fields and mark schema as fully compatible', () => {
      const baseSdl = `
        type User {
          id: ID!
          name: String!
        }
        type Query {
          user(id: ID!): User
        }
      `;

      const currentSdlWithAddedField = `
        type User {
          id: ID!
          name: String!
          phoneNumber: String
        }
        type Query {
          user(id: ID!): User
        }
      `;

      const result = compareSchemas(baseSdl, currentSdlWithAddedField);

      assert.strictEqual(result.isCompatible, true);
      assert.strictEqual(result.breakingChanges.length, 0);
    });

    it('should format clean Markdown and Console reports for CI pipelines', () => {
      const baseSdl = 'type User { id: ID! name: String } type Query { user: User }';
      const currentSdl = 'type User { id: ID! } type Query { user: User }';

      const result = compareSchemas(baseSdl, currentSdl);

      const markdownReport = formatDiffReport(result, { format: 'markdown' });
      assert.ok(markdownReport.includes('AutoGraphQL Schema Governance Report'));
      assert.ok(markdownReport.includes('FAILED'));
      assert.ok(markdownReport.includes('FIELD_REMOVED'));

      const consoleReport = formatDiffReport(result, { format: 'console' });
      assert.ok(consoleReport.includes('BREAKING CHANGES DETECTED'));
    });
  });

  describe('2. Automated TypeScript Client SDK Generator', () => {
    it('should generate complete TypeScript interfaces and client SDK from schema AST', () => {
      const tsCode = generateTypeScriptSDK(schema, { clientName: 'TestAutoGraphQLClient' });

      // 1. Interfaces for baseline models
      assert.ok(tsCode.includes('export interface User {'), 'Must export User interface');
      assert.ok(tsCode.includes('id?: string;'), 'User must have id');
      assert.ok(tsCode.includes('export interface UserProfile {'), 'Must export UserProfile interface');
      assert.ok(tsCode.includes('export interface Post {'), 'Must export Post interface');

      // 2. Client class definition
      assert.ok(tsCode.includes('export class TestAutoGraphQLClient {'), 'Must define Client class');
      assert.ok(tsCode.includes('async raw<T = any>('), 'Client must have raw execution method');

      // 3. Entity namespaces
      assert.ok(tsCode.includes('get user()'), 'Client must expose user namespace');
      assert.ok(tsCode.includes('get userprofile()'), 'Client must expose userprofile namespace');
      assert.ok(tsCode.includes('findById(id: string'), 'Must generate findById');
      assert.ok(tsCode.includes('findMany(filter?: any'), 'Must generate findMany');
      assert.ok(tsCode.includes('create(input: any'), 'Must generate create');
      assert.ok(tsCode.includes('update(id: string'), 'Must generate update');
      assert.ok(tsCode.includes('delete(id: string'), 'Must generate delete');
    });
  });

  describe('3. Automatic Persisted Queries (APQ) & Safelisting', () => {
    it('should compute valid SHA256 hashes for query strings', () => {
      const query = 'query GetUsers { users { id name } }';
      const hash = computeQueryHash(query);

      assert.strictEqual(typeof hash, 'string');
      assert.strictEqual(hash.length, 64, 'SHA256 hex string must be 64 characters');
    });

    it('should register, retrieve, and load manifest into PersistedQueryManager', () => {
      const manager = new PersistedQueryManager();
      const query = 'query TestQuery { user { id } }';
      const hash = computeQueryHash(query);

      manager.registerQuery(hash, query, true);
      assert.strictEqual(manager.getQuery(hash), query);
      assert.strictEqual(manager.hasQuery(hash), true);
      assert.strictEqual(manager.isSafelisted(hash), true);

      // Load manifest
      const manifest = {
        'hash_abc_123': 'query ManifestQ { posts { id } }',
      };
      manager.loadManifest(manifest);
      assert.strictEqual(manager.getQuery('hash_abc_123'), 'query ManifestQ { posts { id } }');
      assert.strictEqual(manager.isSafelisted('hash_abc_123'), true);
    });

    it('should resolve persisted query from cache when client sends only hash', async () => {
      const manager = new PersistedQueryManager();
      const query = 'query UsersList { users { id } }';
      const hash = computeQueryHash(query);
      manager.registerQuery(hash, query);

      const plugin = createPersistedQueryPlugin({ manager, safelistOnly: false });
      const requestContext = {
        request: {
          extensions: {
            persistedQuery: { version: 1, sha256Hash: hash },
          },
        },
      };

      const hooks = await plugin.requestDidStart();
      await hooks.didResolveSource(requestContext);

      assert.strictEqual(requestContext.request.query, query, 'Query must be resolved from cache');
    });

    it('should throw PersistedQueryNotFound when hash is not in cache', async () => {
      const manager = new PersistedQueryManager();
      const plugin = createPersistedQueryPlugin({ manager, safelistOnly: false });
      const requestContext = {
        request: {
          extensions: {
            persistedQuery: { version: 1, sha256Hash: 'unknown_hash_999' },
          },
        },
      };

      const hooks = await plugin.requestDidStart();
      let errorThrown = null;
      try {
        await hooks.didResolveSource(requestContext);
      } catch (err) {
        errorThrown = err;
      }

      assert.ok(errorThrown, 'Must throw error');
      assert.strictEqual(errorThrown.extensions.code, 'PERSISTED_QUERY_NOT_FOUND');
    });

    it('should reject non-safelisted queries when safelistOnly mode is enabled', async () => {
      const manager = new PersistedQueryManager({ safelistOnly: true });
      const plugin = createPersistedQueryPlugin({ manager, safelistOnly: true });

      // Arbitrary query without persistedQuery extension
      const requestContext = {
        request: {
          query: 'query ArbitraryQuery { users { id } }',
        },
      };

      const hooks = await plugin.requestDidStart();
      let errorThrown = null;
      try {
        await hooks.didResolveSource(requestContext);
      } catch (err) {
        errorThrown = err;
      }

      assert.ok(errorThrown, 'Must reject arbitrary query in safelist-only mode');
      assert.strictEqual(errorThrown.extensions.code, 'PERSISTED_QUERY_NOT_SUPPORTED');
    });
  });
});
