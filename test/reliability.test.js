import assert from 'assert';
import { validate, parse, graphql } from 'graphql';
import schema from '../src/graphql';
import { createDataLoaders } from '../src/dataloader';
import { createDepthLimitRule, createComplexityLimitRule } from '../src/autoGenerate/graphql/validation/rules';
import app from '../src/app';

describe('AutoGraphQL Phase 1: Reliability & Performance', () => {
  describe('1. Request-Scoped DataLoader Batching Engine', () => {
    it('should create request-scoped loaders container with model loaders', () => {
      const container = createDataLoaders();
      assert.ok(container, 'DataLoader container must be created');
      assert.strictEqual(typeof container.getLoader, 'function', 'getLoader must be a function');
      assert.strictEqual(typeof container.clear, 'function', 'clear must be a function');
      assert.strictEqual(typeof container.clearAll, 'function', 'clearAll must be a function');

      const userLoader = container.getLoader('User');
      assert.ok(userLoader, 'DataLoader for User model must exist');
    });

    it('should batch multiple load requests into a single database find query with $in', async () => {
      let queryCount = 0;
      let executedQuery = null;

      // Mock Mongoose model that captures database queries
      const mockModel = {
        find: (query) => {
          queryCount += 1;
          executedQuery = query;
          return {
            lean: () => ({
              exec: async () => [
                { id: 'user-1', name: 'Alice' },
                { id: 'user-2', name: 'Bob' },
                { id: 'user-3', name: 'Charlie' },
              ],
            }),
          };
        },
      };

      const container = createDataLoaders({ MockUser: mockModel });
      const loader = container.getLoader('MockUser');
      assert.ok(loader, 'Mock loader created');

      // Issue 3 simultaneous loads in the same execution tick (simulating N+1 relational resolution)
      const [u1, u2, u3] = await Promise.all([
        loader.load('user-1'),
        loader.load('user-2'),
        loader.load('user-3'),
      ]);

      // Assert that exactly 1 database query was fired
      assert.strictEqual(queryCount, 1, 'DataLoader must batch all 3 lookups into exactly 1 database query');
      assert.deepStrictEqual(
        executedQuery,
        { id: { $in: ['user-1', 'user-2', 'user-3'] } },
        'Query should use $in operator with all requested IDs',
      );

      // Verify returned objects match requested IDs
      assert.strictEqual(u1.name, 'Alice');
      assert.strictEqual(u2.name, 'Bob');
      assert.strictEqual(u3.name, 'Charlie');
    });

    it('should deduplicate repeated IDs and memoize within the same request', async () => {
      let queryCount = 0;
      const mockModel = {
        find: (query) => {
          queryCount += 1;
          return {
            lean: () => ({
              exec: async () => [
                { id: 'author-99', name: 'Author 99' },
              ],
            }),
          };
        },
      };

      const container = createDataLoaders({ MockAuthor: mockModel });
      const loader = container.getLoader('MockAuthor');

      // 5 different posts referencing the same author
      const results = await Promise.all([
        loader.load('author-99'),
        loader.load('author-99'),
        loader.load('author-99'),
        loader.load('author-99'),
        loader.load('author-99'),
      ]);

      assert.strictEqual(queryCount, 1, 'Should execute only 1 DB query for 5 duplicate loads');
      assert.strictEqual(results.length, 5);
      results.forEach((res) => {
        assert.strictEqual(res.name, 'Author 99');
      });
    });

    it('should support clearing cache on mutation updates', async () => {
      let callCount = 0;
      const mockModel = {
        find: () => {
          callCount += 1;
          return {
            lean: () => ({
              exec: async () => [{ id: 'user-1', name: `Alice v${callCount}` }],
            }),
          };
        },
      };

      const container = createDataLoaders({ MockUser: mockModel });
      const loader = container.getLoader('MockUser');

      const firstLoad = await loader.load('user-1');
      assert.strictEqual(firstLoad.name, 'Alice v1');

      // Clear cached ID
      container.clear('MockUser', 'user-1');

      const secondLoad = await loader.load('user-1');
      assert.strictEqual(secondLoad.name, 'Alice v2');
      assert.strictEqual(callCount, 2, 'Should re-fetch after clear');
    });
  });

  describe('2. Query Depth Limiting Protection', () => {
    it('should allow queries within the depth limit', () => {
      const query = `
        query ShallowQuery {
          users {
            id
            name
            profile {
              headline
            }
          }
        }
      `;
      const ast = parse(query);
      const errors = validate(schema, ast, [createDepthLimitRule(5)]);
      assert.strictEqual(errors.length, 0, 'Query within depth limit should have no errors');
    });

    it('should reject queries that exceed the depth limit', () => {
      const deeplyNestedQuery = `
        query DeepQuery {
          users {
            posts {
              comments {
                author {
                  profile {
                    user {
                      posts {
                        title
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;
      const ast = parse(deeplyNestedQuery);
      // Set strict maxDepth of 3
      const errors = validate(schema, ast, [createDepthLimitRule(3)]);
      assert.ok(errors.length > 0, 'Deeply nested query must be rejected');
      assert.ok(
        errors[0].message.includes('exceeds maximum query depth of 3'),
        `Error message should specify depth limit: ${errors[0].message}`,
      );
    });

    it('should exempt introspection queries (__schema, __type) from depth limits', () => {
      const introspectionQuery = `
        query Introspect {
          __schema {
            types {
              fields {
                type {
                  fields {
                    type {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      `;
      const ast = parse(introspectionQuery);
      const errors = validate(schema, ast, [createDepthLimitRule(2, { ignore: ['__schema', '__type'] })]);
      assert.strictEqual(errors.length, 0, 'Introspection query should be exempted from depth limits');
    });
  });

  describe('3. Query Complexity Cost Limiting Protection', () => {
    it('should allow queries within complexity cost threshold', () => {
      const simpleQuery = `
        query SimpleUser {
          user(id: "123") {
            id
            name
            email
          }
        }
      `;
      const ast = parse(simpleQuery);
      const errors = validate(schema, ast, [createComplexityLimitRule(500)]);
      assert.strictEqual(errors.length, 0, 'Simple query should be within complexity limit');
    });

    it('should reject queries exceeding the complexity cost threshold', () => {
      const heavyQuery = `
        query HeavyQuery {
          users(first: 50) {
            id
            name
            posts(first: 20) {
              id
              title
              comments(first: 20) {
                id
                content
              }
            }
          }
        }
      `;
      const ast = parse(heavyQuery);
      // Set very small limit to trigger violation
      const errors = validate(schema, ast, [createComplexityLimitRule(50)]);
      assert.ok(errors.length > 0, 'Heavy query must be rejected by complexity rule');
      assert.ok(
        errors[0].message.includes('exceeds maximum query complexity of 50'),
        `Error message should mention complexity threshold: ${errors[0].message}`,
      );
    });
  });

  describe('4. Kubernetes Health Probes (Liveness & Readiness)', () => {
    it('should expose liveness probe at /health/live with process uptime and alive status', (done) => {
      // Mock Express request/response simulation
      const req = {};
      const res = {
        statusCode: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          assert.strictEqual(this.statusCode, 200, 'Liveness probe must return 200');
          assert.strictEqual(data.status, 'alive');
          assert.ok(typeof data.uptime === 'number');
          assert.ok(data.timestamp);
          done();
        },
      };

      // Retrieve the route handler from app._router.stack
      const livenessLayer = app._router.stack.find(
        (layer) => layer.route && layer.route.path && (
          Array.isArray(layer.route.path) ? layer.route.path.includes('/health/live') : layer.route.path === '/health/live'
        ),
      );
      assert.ok(livenessLayer, 'Liveness route must be registered on express app');
      livenessLayer.route.stack[0].handle(req, res);
    });

    it('should expose readiness probe at /health/ready reporting dependency states', async () => {
      const req = {};
      let responseData = null;
      let statusCode = null;

      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          responseData = data;
        },
      };

      const readinessLayer = app._router.stack.find(
        (layer) => layer.route && layer.route.path && (
          Array.isArray(layer.route.path) ? layer.route.path.includes('/health/ready') : layer.route.path === '/health/ready'
        ),
      );
      assert.ok(readinessLayer, 'Readiness route must be registered on express app');

      await readinessLayer.route.stack[0].handle(req, res);

      assert.ok(statusCode === 200 || statusCode === 503, 'Readiness should return either 200 or 503');
      assert.ok(responseData, 'Response data must be returned');
      assert.ok(responseData.checks, 'Checks object must be present');
      assert.ok(responseData.checks.mongodb, 'MongoDB check must be included');
    });

    it('should expose backward-compatible /health endpoint with service breakdown', (done) => {
      const req = {};
      const res = {
        statusCode: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          assert.strictEqual(this.statusCode, 200);
          assert.strictEqual(data.status, 'ok');
          assert.ok(data.services);
          assert.ok(data.services.mongodb);
          done();
        },
      };

      const healthLayer = app._router.stack.find(
        (layer) => layer.route && layer.route.path === '/health',
      );
      assert.ok(healthLayer, '/health route must be registered');
      healthLayer.route.stack[0].handle(req, res);
    });
  });
});
