import assert from 'assert';
import { Sequelize, DataTypes, Op } from 'sequelize';
import cuid from 'cuid';
import {
  createSequelizeModelFromAST,
  mapGraphQLFieldToSequelize,
  buildSequelizeIndexes,
  wireSequelizeAssociations,
  buildSequelizeWhereClause,
} from '../src/autoGenerate/models/sqlModelGenerator';
import { createDataLoaders } from '../src/dataloader';
import {
  registerModelRLSPolicy,
  getModelRLSPolicy,
  applyRowLevelSecurity,
  applyRLSToInput,
  verifyRLSOwnership,
  clearRLSPolicies,
} from '../src/security/rls';
import QueryController from '../src/autoGenerate/graphql/controllers/QueryController';

/**
 * Attaches in-memory mock query handlers to a Sequelize model for ultra-fast offline unit testing.
 *
 * @param {Object} Model
 */
const attachMockSequelizeEngine = (Model) => {
  const store = new Map();

  Model.create = async (data) => {
    const id = data.id || `proj_${cuid()}`;
    const record = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      toJSON: function toJSON() {
        const { toJSON: _, ...rest } = this;
        return rest;
      },
    };
    store.set(id, record);
    return record;
  };

  Model.findAll = async ({ where = {}, limit, offset = 0 } = {}) => {
    let results = Array.from(store.values());

    if (where && Object.keys(where).length > 0) {
      results = results.filter((item) => {
        return Object.keys(where).every((key) => {
          const expected = where[key];
          if (Array.isArray(expected)) {
            return expected.includes(item[key]);
          }
          return item[key] === expected;
        });
      });
    }

    if (offset) {
      results = results.slice(offset);
    }
    if (limit) {
      results = results.slice(0, limit);
    }

    return results;
  };

  Model.findOne = async ({ where = {} } = {}) => {
    const matches = await Model.findAll({ where });
    return matches.length > 0 ? matches[0] : null;
  };

  Model.count = async ({ where = {} } = {}) => {
    const matches = await Model.findAll({ where });
    return matches.length;
  };

  Model.destroy = async ({ where = {}, truncate = false } = {}) => {
    if (truncate || Object.keys(where).length === 0) {
      const count = store.size;
      store.clear();
      return count;
    }
    const matches = await Model.findAll({ where });
    matches.forEach((m) => store.delete(m.id));
    return matches.length;
  };
};

describe('AutoGraphQL Phase 4: Architecture Expansion', () => {
  let testSequelize;
  let ProjectModel;

  before(() => {
    testSequelize = new Sequelize('postgres://postgres:postgres@localhost:5432/testdb', {
      dialect: 'postgres',
      logging: false,
    });

    // Dynamically compile a model from GraphQL AST fields using sqlModelGenerator
    const projectFieldsAST = {
      title: { type: 'String', required: true },
      budget: { type: 'Number', required: false },
      isActive: { type: 'Boolean', default: true },
      deadline: { type: 'Date' },
      tenantId: { type: 'String', required: true, index: true },
    };

    ProjectModel = createSequelizeModelFromAST('Project', projectFieldsAST, testSequelize);
    attachMockSequelizeEngine(ProjectModel);
  });

  afterEach(() => {
    clearRLSPolicies();
  });

  describe('1. Dynamic PostgreSQL (Sequelize) AST Model Generator', () => {
    it('should map GraphQL field AST types to appropriate Sequelize DataTypes', () => {
      assert.strictEqual(mapGraphQLFieldToSequelize({ type: 'String' }).type.key, DataTypes.STRING.key);
      assert.strictEqual(mapGraphQLFieldToSequelize({ type: 'Int' }).type.key, DataTypes.INTEGER.key);
      assert.strictEqual(mapGraphQLFieldToSequelize({ type: 'Float' }).type.key, DataTypes.FLOAT.key);
      assert.strictEqual(mapGraphQLFieldToSequelize({ type: 'Boolean' }).type.key, DataTypes.BOOLEAN.key);
      assert.strictEqual(mapGraphQLFieldToSequelize({ type: 'Date' }).type.key, DataTypes.DATE.key);
      assert.strictEqual(mapGraphQLFieldToSequelize({ type: 'JSONB' }).type.key, (DataTypes.JSONB || DataTypes.TEXT).key);
    });

    it('should dynamically define Sequelize model with primary key, timestamps, and isPgModel flag', () => {
      assert.ok(ProjectModel, 'ProjectModel must be defined');
      assert.strictEqual(ProjectModel.isPgModel, true);

      const rawAttributes = ProjectModel.rawAttributes;
      assert.ok(rawAttributes.id, 'Must have primary key id');
      assert.strictEqual(rawAttributes.id.primaryKey, true);
      assert.strictEqual(rawAttributes.title.allowNull, false);
      assert.strictEqual(rawAttributes.budget.allowNull, true);
      assert.strictEqual(rawAttributes.isActive.defaultValue, true);
    });
  });

  describe('2. Comprehensive PostgreSQL Indexes (B-Tree, GIN, Composite, Unique)', () => {
    it('should generate B-Tree indexes for standard fields and GIN indexes for JSONB and Array fields', () => {
      const fieldsSchema = {
        email: { type: 'String', unique: true, index: true },
        tags: [{ type: 'String' }],
        metadata: { type: 'JSONB', index: true },
      };

      const indexes = buildSequelizeIndexes(fieldsSchema);
      assert.ok(indexes.length >= 2, 'Should create indexes for indexed/unique fields');

      const emailIdx = indexes.find((idx) => idx.fields.includes('email'));
      assert.ok(emailIdx);
      assert.strictEqual(emailIdx.unique, true);

      const metadataIdx = indexes.find((idx) => idx.fields.includes('metadata'));
      assert.ok(metadataIdx);
      assert.strictEqual(metadataIdx.using, 'GIN', 'PostgreSQL JSONB/Array index must use GIN');
    });

    it('should support custom composite multi-column indexes', () => {
      const fieldsSchema = {
        tenantId: { type: 'String' },
        createdAt: { type: 'Date' },
      };
      const customIndexes = [
        { fields: ['tenantId', 'createdAt'], name: 'idx_tenant_created' },
      ];

      const indexes = buildSequelizeIndexes(fieldsSchema, customIndexes);
      const composite = indexes.find((idx) => idx.name === 'idx_tenant_created');
      assert.ok(composite);
      assert.deepStrictEqual(composite.fields, ['tenantId', 'createdAt']);
    });
  });

  describe('3. PostgreSQL Associations & Joins (1:1, 1:N, N:N)', () => {
    let UserModel;
    let ProfileModel;
    let PostModel;
    let TagModel;

    before(() => {
      UserModel = testSequelize.define('PGUser', { name: DataTypes.STRING }, { timestamps: false });
      ProfileModel = testSequelize.define('PGProfile', { bio: DataTypes.STRING }, { timestamps: false });
      PostModel = testSequelize.define('PGPost', { title: DataTypes.STRING }, { timestamps: false });
      TagModel = testSequelize.define('PGTag', { name: DataTypes.STRING }, { timestamps: false });
    });

    it('should wire 1:1 (hasOne / belongsTo) associations between Sequelize models', () => {
      const modelsMap = { PGUser: UserModel, PGProfile: ProfileModel };
      wireSequelizeAssociations(modelsMap, [
        { type: '1:1', source: 'PGUser', target: 'PGProfile', foreignKey: 'userId', as: 'profile' },
      ]);

      assert.ok(UserModel.associations.profile, 'UserModel must have profile association');
      assert.strictEqual(UserModel.associations.profile.associationType, 'HasOne');
      assert.ok(ProfileModel.associations.pguser, 'ProfileModel must have belongsTo pguser association');
      assert.strictEqual(ProfileModel.associations.pguser.associationType, 'BelongsTo');
    });

    it('should wire 1:N (hasMany / belongsTo) associations between Sequelize models', () => {
      const modelsMap = { PGUser: UserModel, PGPost: PostModel };
      wireSequelizeAssociations(modelsMap, [
        { type: '1:N', source: 'PGUser', target: 'PGPost', foreignKey: 'authorId', as: 'posts' },
      ]);

      assert.ok(UserModel.associations.posts, 'UserModel must have posts association');
      assert.strictEqual(UserModel.associations.posts.associationType, 'HasMany');
      assert.ok(PostModel.associations.pguser, 'PostModel must have belongsTo author association');
    });

    it('should wire N:N (belongsToMany) associations with join table between Sequelize models', () => {
      const modelsMap = { PGPost: PostModel, PGTag: TagModel };
      wireSequelizeAssociations(modelsMap, [
        { type: 'N:N', source: 'PGPost', target: 'PGTag', through: 'PGPostTags', foreignKey: 'postId', otherKey: 'tagId', as: 'tags' },
      ]);

      assert.ok(PostModel.associations.tags, 'PostModel must have tags belongsToMany association');
      assert.strictEqual(PostModel.associations.tags.associationType, 'BelongsToMany');
    });
  });

  describe('4. Advanced PostgreSQL Filter-to-SQL Translation', () => {
    it('should translate comparison and string matchers to Sequelize Op operators', () => {
      const filter = {
        title_contains: 'Alpha',
        budget_gte: 10000,
        budget_lte: 90000,
        status_in: ['ACTIVE', 'PENDING'],
      };

      const where = buildSequelizeWhereClause(filter);

      assert.strictEqual(where.title[Op.iLike], '%Alpha%', 'Must use case-insensitive iLike for Postgres');
      assert.strictEqual(where.budget[Op.gte], 10000);
      assert.strictEqual(where.budget[Op.lte], 90000);
      assert.deepStrictEqual(where.status[Op.in], ['ACTIVE', 'PENDING']);
    });

    it('should translate logical and/or/not operators', () => {
      const filter = {
        and: [
          { isActive: true },
          { or: [{ budget_gt: 50000 }, { deadline_exists: true }] },
        ],
      };

      const where = buildSequelizeWhereClause(filter);

      assert.ok(where[Op.and]);
      assert.strictEqual(where[Op.and][0].isActive, true);
      assert.ok(where[Op.and][1][Op.or]);
      assert.strictEqual(where[Op.and][1][Op.or][0].budget[Op.gt], 50000);
      assert.strictEqual(where[Op.and][1][Op.or][1].deadline[Op.ne], null);
    });
  });

  describe('5. Polymorphic Database Query Execution on Sequelize Models', () => {
    beforeEach(async () => {
      await ProjectModel.destroy({ truncate: true });

      await ProjectModel.create({
        id: 'proj_1',
        title: 'Project Alpha',
        budget: 50000,
        tenantId: 'tenant_enterprise_a',
      });

      await ProjectModel.create({
        id: 'proj_2',
        title: 'Project Beta',
        budget: 75000,
        tenantId: 'tenant_enterprise_b',
      });
    });

    it('should execute fetchById on Sequelize model and return plain object', async () => {
      const controller = new QueryController('Project', { bypass: true });
      controller.Model = ProjectModel;

      const result = await controller.fetchById('proj_1');

      assert.ok(result, 'Result must exist');
      assert.strictEqual(result.id, 'proj_1');
      assert.strictEqual(result.title, 'Project Alpha');
      assert.strictEqual(result.budget, 50000);
    });

    it('should execute fetchOne on Sequelize model matching criteria', async () => {
      const controller = new QueryController('Project', { bypass: true });
      controller.Model = ProjectModel;

      const result = await controller.fetchOne({ title: 'Project Beta' });

      assert.ok(result, 'Result must exist');
      assert.strictEqual(result.id, 'proj_2');
      assert.strictEqual(result.tenantId, 'tenant_enterprise_b');
    });

    it('should execute fetchMany on Sequelize model and return plain objects', async () => {
      const controller = new QueryController('Project', { bypass: true });
      controller.Model = ProjectModel;

      const results = await controller.fetchMany({});

      assert.strictEqual(Array.isArray(results), true);
      assert.strictEqual(results.length, 2);
      const titles = results.map((r) => r.title);
      assert.ok(titles.includes('Project Alpha'));
      assert.ok(titles.includes('Project Beta'));
    });
  });

  describe('6. Polymorphic DataLoader Batching on Sequelize Models', () => {
    it('should batch multiple findById lookups on Sequelize model into a single query', async () => {
      const mockModels = { Project: ProjectModel };
      const dataLoaders = createDataLoaders(mockModels);
      const loader = dataLoaders.getLoader('Project');

      assert.ok(loader, 'DataLoader must be created for Sequelize Project model');

      const [p1, p2, pMissing] = await Promise.all([
        loader.load('proj_1'),
        loader.load('proj_2'),
        loader.load('non_existent_id'),
      ]);

      assert.strictEqual(p1.id, 'proj_1');
      assert.strictEqual(p1.title, 'Project Alpha');
      assert.strictEqual(p2.id, 'proj_2');
      assert.strictEqual(p2.title, 'Project Beta');
      assert.strictEqual(pMissing, null);
    });
  });

  describe('7. Declarative Row-Level Security (RLS) & Multi-Tenancy Engine', () => {
    beforeEach(() => {
      registerModelRLSPolicy('Project', {
        field: 'tenantId',
        claim: 'tenantId',
        type: 'tenant',
      });
    });

    it('should register and retrieve RLS policy for a model', () => {
      const policy = getModelRLSPolicy('Project');
      assert.deepStrictEqual(policy, {
        field: 'tenantId',
        claim: 'tenantId',
        type: 'tenant',
      });
    });

    it('should inject tenantId into query filters and prevent cross-tenant data access', () => {
      const contextTenantA = { tenantId: 'tenant_enterprise_a' };
      const clientFilter = { budget: 50000 };

      const securedFilter = applyRowLevelSecurity({
        modelName: 'Project',
        filter: clientFilter,
        context: contextTenantA,
      });

      assert.strictEqual(securedFilter.tenantId, 'tenant_enterprise_a');
      assert.strictEqual(securedFilter.budget, 50000);
    });

    it('should strictly override spoofed tenantId supplied in client filter', () => {
      const contextTenantA = { tenantId: 'tenant_enterprise_a' };
      const maliciousFilter = { tenantId: 'tenant_enterprise_b' }; // Attacker trying to view Tenant B's data

      const securedFilter = applyRowLevelSecurity({
        modelName: 'Project',
        filter: maliciousFilter,
        context: contextTenantA,
      });

      assert.strictEqual(securedFilter.tenantId, 'tenant_enterprise_a', 'Must overwrite spoofed tenantId');
    });

    it('should throw PermissionDeniedError if execution context lacks required tenant claim', () => {
      const contextWithoutTenant = {};

      assert.throws(() => {
        applyRowLevelSecurity({
          modelName: 'Project',
          filter: {},
          context: contextWithoutTenant,
        });
      }, (err) => err.name === 'PermissionDeniedError' || (err.data && err.data.message.includes('Multi-Tenancy Access Denied')));
    });

    it('should exempt ADMIN users and bypass flag from RLS filtering', () => {
      const adminContext = { user: { id: 'admin_1', role: 'ADMIN' } };
      const clientFilter = { budget: 50000 };

      const securedFilter = applyRowLevelSecurity({
        modelName: 'Project',
        filter: clientFilter,
        context: adminContext,
      });

      assert.strictEqual(securedFilter.tenantId, undefined, 'Admin should query across all tenants');
    });

    it('should automatically inject tenantId into record creation input', () => {
      const contextTenantA = { tenantId: 'tenant_enterprise_a' };
      const rawInput = { title: 'New Secret Project', budget: 10000 };

      const securedInput = applyRLSToInput({
        modelName: 'Project',
        input: rawInput,
        context: contextTenantA,
      });

      assert.strictEqual(securedInput.tenantId, 'tenant_enterprise_a');
      assert.strictEqual(securedInput.title, 'New Secret Project');
    });

    it('should verify ownership before update/delete mutations and reject cross-tenant changes', () => {
      const contextTenantA = { tenantId: 'tenant_enterprise_a' };
      const ownRecord = { id: '1', tenantId: 'tenant_enterprise_a' };
      const foreignRecord = { id: '2', tenantId: 'tenant_enterprise_b' };

      // Own record modification is allowed
      assert.strictEqual(
        verifyRLSOwnership({ modelName: 'Project', record: ownRecord, context: contextTenantA }),
        true,
      );

      // Foreign tenant record modification is rejected
      assert.throws(() => {
        verifyRLSOwnership({ modelName: 'Project', record: foreignRecord, context: contextTenantA });
      }, (err) => err.name === 'PermissionDeniedError' || (err.data && err.data.message.includes('Multi-Tenancy Access Denied')));
    });
  });

  describe('8. Environment-Configurable Default Database Dialect Selection', () => {
    const originalEnv = process.env.DEFAULT_DATABASE_DIALECT;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.DEFAULT_DATABASE_DIALECT = originalEnv;
      } else {
        delete process.env.DEFAULT_DATABASE_DIALECT;
      }
    });

    it('should default to mongoose when DEFAULT_DATABASE_DIALECT is unset', () => {
      delete process.env.DEFAULT_DATABASE_DIALECT;
      delete process.env.DEFAULT_DATABASE;
      delete process.env.DATABASE_DIALECT;

      const { getDefaultDatabaseDialect } = require('../constants');
      assert.strictEqual(getDefaultDatabaseDialect(), 'mongoose');
    });

    it('should configure postgres as default when DEFAULT_DATABASE_DIALECT=postgres', () => {
      process.env.DEFAULT_DATABASE_DIALECT = 'postgres';

      const { getDefaultDatabaseDialect } = require('../constants');
      assert.strictEqual(getDefaultDatabaseDialect(), 'postgres');
    });

    it('should handle dialect aliases and case-insensitivity (e.g. postgresql, SQL, Mongo, Sequelize)', () => {
      const { getDefaultDatabaseDialect } = require('../constants');

      process.env.DEFAULT_DATABASE_DIALECT = 'PostgreSQL';
      assert.strictEqual(getDefaultDatabaseDialect(), 'postgres');

      process.env.DEFAULT_DATABASE_DIALECT = 'SQL';
      assert.strictEqual(getDefaultDatabaseDialect(), 'postgres');

      process.env.DEFAULT_DATABASE_DIALECT = 'SEQUELIZE';
      assert.strictEqual(getDefaultDatabaseDialect(), 'postgres');

      process.env.DEFAULT_DATABASE_DIALECT = 'MongoDB';
      assert.strictEqual(getDefaultDatabaseDialect(), 'mongoose');
    });
  });
});

