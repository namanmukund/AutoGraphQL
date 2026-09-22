/**
 * AutoGraphQL — Comprehensive End-to-End PostgreSQL Integration Test
 *
 * Tests the full PostgreSQL path:
 *   GraphQL AST → Sequelize Model Generation → Database Operations → Response
 *
 * Requires Docker to run (starts a disposable PostgreSQL container).
 * Run with: npm run test:postgres
 */
import assert from 'assert';
import { Sequelize, DataTypes, Op } from 'sequelize';
import cuid from 'cuid';
import { graphql } from 'graphql';
import {
  startPostgres,
  stopPostgres,
  setupDatabase,
  resetData,
  teardownDatabase,
  getSequelize,
  getModels,
} from './setup';
import {
  pgGraphQLSDL,
  parseSDLToSchemaDefinitions,
  createModelsFromSDL,
  createPostgresExecutableSchema,
} from './testSchema';
import {
  createSequelizeModelFromAST,
  mapGraphQLFieldToSequelize,
  buildSequelizeIndexes,
  wireSequelizeAssociations,
  buildSequelizeWhereClause,
  getActiveSequelize,
} from '../../src/autoGenerate/models/sqlModelGenerator';
import { createDataLoaders } from '../../src/dataloader';
import { convertSortToSequelizeOrder, getSortOrderForSequelize } from '../../src/autoGenerate/graphql/controllers/QueryController/sorts';

let sequelize;
let models;

// ─── LIFECYCLE ────────────────────────────────────────────────────────────────

before(async function bootstrapPostgres() {
  this.timeout(60000);
  await startPostgres();
  const db = await setupDatabase();
  sequelize = db.sequelize;
  models = db.models;
});

afterEach(async function cleanBetweenSuites() {
  this.timeout(15000);
  await resetData();
});

after(async function shutdownPostgres() {
  this.timeout(15000);
  await teardownDatabase();
  stopPostgres();
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const createCompany = async (overrides = {}) => {
  const defaults = {
    id: cuid(),
    name: `Company ${Date.now()}`,
    domain: `company-${Date.now()}.com`,
    industry: 'Technology',
    employeeCount: 100,
    isPublic: false,
    foundedAt: new Date('2020-01-15'),
    metadata: { tier: 'enterprise' },
  };
  return models.PgCompany.create({ ...defaults, ...overrides });
};

const createUser = async (overrides = {}) => {
  const defaults = {
    id: cuid(),
    name: 'Test User',
    email: `user-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
    age: 30,
    salary: 75000.50,
    active: true,
    bio: 'A test user',
    lastLoginAt: new Date(),
    preferences: { theme: 'dark', notifications: true },
  };
  return models.PgUser.create({ ...defaults, ...overrides });
};

const createPost = async (authorId, overrides = {}) => {
  const defaults = {
    id: cuid(),
    title: `Post ${Date.now()}`,
    content: 'Lorem ipsum dolor sit amet',
    published: false,
    viewCount: 0,
    rating: 4.5,
    authorId,
    publishedAt: null,
  };
  return models.PgPost.create({ ...defaults, ...overrides });
};

const createComment = async (postId, authorId, overrides = {}) => {
  const defaults = {
    id: cuid(),
    content: 'Great post!',
    postId,
    authorId,
    upvotes: 0,
  };
  return models.PgComment.create({ ...defaults, ...overrides });
};

const createProduct = async (overrides = {}) => {
  const defaults = {
    id: cuid(),
    name: `Product ${Date.now()}`,
    price: 29.99,
    quantity: 100,
    active: true,
    sku: `SKU-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    tags: ['electronics', 'sale'],
    specs: { weight: '1.5kg', color: 'black' },
  };
  return models.PgProduct.create({ ...defaults, ...overrides });
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: DATABASE CONNECTION & SCHEMA GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('1. Database Connection & Schema Generation', () => {
  it('should connect to PostgreSQL successfully', async () => {
    await sequelize.authenticate();
  });

  it('should have a valid connection pool', () => {
    assert.ok(sequelize.config.pool, 'Pool config must exist');
    assert.ok(sequelize.config.pool.max >= 2, 'Pool should have at least 2 max connections');
  });

  it('should create all 5 tables', async () => {
    const rawTables = await sequelize.getQueryInterface().showAllTables();
    const tableNames = rawTables.map((t) => {
      const name = typeof t === 'string' ? t : (t.tableName || t.table_name || '');
      return name.toLowerCase();
    });
    assert.ok(tableNames.includes('pgcompany'), `Tables: ${tableNames.join(', ')} must include pgcompany`);
    assert.ok(tableNames.includes('pguser'), `Tables: ${tableNames.join(', ')} must include pguser`);
    assert.ok(tableNames.includes('pgpost'), `Tables: ${tableNames.join(', ')} must include pgpost`);
    assert.ok(tableNames.includes('pgcomment'), `Tables: ${tableNames.join(', ')} must include pgcomment`);
    assert.ok(tableNames.includes('pgproduct'), `Tables: ${tableNames.join(', ')} must include pgproduct`);
  });

  it('should create correct columns with proper data types', async () => {
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'pguser'
      ORDER BY ordinal_position;
    `);
    const colMap = {};
    columns.forEach((c) => { colMap[c.column_name] = c; });

    assert.ok(colMap.id, 'Must have id column');
    assert.ok(colMap.name, 'Must have name column');
    assert.ok(colMap.email, 'Must have email column');
    assert.ok(colMap.age, 'Must have age column');
    assert.ok(colMap.salary, 'Must have salary column');
    assert.ok(colMap.active, 'Must have active column');
    assert.ok(colMap.preferences, 'Must have preferences (JSONB) column');
    assert.ok(colMap['createdAt'] || colMap.createdat, 'Must have createdAt timestamp');
    assert.ok(colMap['updatedAt'] || colMap.updatedat, 'Must have updatedAt timestamp');

    // Verify data types
    assert.strictEqual(colMap.age.data_type, 'integer', 'age should be integer');
    assert.ok(['double precision', 'real'].includes(colMap.salary.data_type), `salary should be float, got: ${colMap.salary.data_type}`);
    assert.strictEqual(colMap.active.data_type, 'boolean', 'active should be boolean');
  });

  it('should create primary keys on id columns', async () => {
    const [pks] = await sequelize.query(`
      SELECT c.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage AS c ON c.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = 'pguser';
    `);
    assert.ok(pks.length > 0, 'Must have primary key');
    assert.strictEqual(pks[0].column_name, 'id', 'PK must be on id column');
  });

  it('should create unique constraints', async () => {
    const [constraints] = await sequelize.query(`
      SELECT tc.constraint_name, cc.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage cc ON cc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'UNIQUE' AND tc.table_name = 'pguser';
    `);
    const uniqueColumns = constraints.map((c) => c.column_name);
    assert.ok(uniqueColumns.includes('email'), 'email should have unique constraint');
  });

  it('should have isPgModel flag on all models', () => {
    Object.keys(models).forEach((modelName) => {
      assert.strictEqual(models[modelName].isPgModel, true, `${modelName} must have isPgModel=true`);
    });
  });

  it('should have timestamps enabled', () => {
    const attrs = models.PgUser.rawAttributes;
    assert.ok(attrs.createdAt, 'Must have createdAt');
    assert.ok(attrs.updatedAt, 'Must have updatedAt');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: CREATE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

describe('2. CREATE Operations', () => {
  it('should create a minimal valid user record', async () => {
    const user = await createUser({ name: 'Minimal User', email: 'minimal@test.com' });
    assert.ok(user.id, 'Must have id');
    assert.strictEqual(user.name, 'Minimal User');
    assert.strictEqual(user.email, 'minimal@test.com');
  });

  it('should create a fully populated user record', async () => {
    const user = await createUser({
      name: 'Full User',
      email: 'full@test.com',
      age: 35,
      salary: 120000.75,
      active: true,
      bio: 'Complete profile',
      preferences: { theme: 'light', lang: 'en' },
    });
    const plain = user.toJSON ? user.toJSON() : user;
    assert.strictEqual(plain.name, 'Full User');
    assert.strictEqual(plain.age, 35);
    assert.strictEqual(plain.salary, 120000.75);
    assert.strictEqual(plain.active, true);
    assert.deepStrictEqual(plain.preferences, { theme: 'light', lang: 'en' });
  });

  it('should create multiple records sequentially', async () => {
    await createUser({ email: 'batch1@test.com' });
    await createUser({ email: 'batch2@test.com' });
    await createUser({ email: 'batch3@test.com' });
    const count = await models.PgUser.count();
    assert.strictEqual(count, 3);
  });

  it('should handle nullable fields correctly', async () => {
    const user = await createUser({ bio: null, age: null });
    const plain = user.toJSON ? user.toJSON() : user;
    assert.strictEqual(plain.bio, null);
    assert.strictEqual(plain.age, null);
  });

  it('should apply default values', async () => {
    const product = await createProduct({ active: undefined });
    const plain = product.toJSON ? product.toJSON() : product;
    assert.strictEqual(plain.active, true, 'active should default to true');
  });

  it('should generate cuid-format ids when using createSequelizeModelFromAST default', async () => {
    const product = await models.PgProduct.create({
      name: 'Auto ID Product',
      price: 9.99,
      sku: `auto-${Date.now()}`,
    });
    assert.ok(product.id, 'Must auto-generate id');
    assert.ok(product.id.length > 10, 'ID should be cuid format');
  });

  it('should reject missing required fields', async () => {
    try {
      await models.PgUser.create({ bio: 'no name or email' });
      assert.fail('Should have thrown');
    } catch (err) {
      assert.ok(err.message, 'Should have error message');
    }
  });

  it('should reject duplicate unique values', async () => {
    await createUser({ email: 'duplicate@test.com' });
    try {
      await createUser({ email: 'duplicate@test.com' });
      assert.fail('Should have thrown on duplicate email');
    } catch (err) {
      assert.ok(err.name === 'SequelizeUniqueConstraintError' || err.message.includes('unique'), `Expected unique constraint error, got: ${err.message}`);
    }
  });

  it('should store JSONB data correctly', async () => {
    const product = await createProduct({
      specs: { weight: '2kg', dimensions: { w: 10, h: 20, d: 5 } },
      tags: ['premium', 'new'],
    });
    const plain = product.toJSON ? product.toJSON() : product;
    assert.deepStrictEqual(plain.specs, { weight: '2kg', dimensions: { w: 10, h: 20, d: 5 } });
    assert.deepStrictEqual(plain.tags, ['premium', 'new']);
  });

  it('should verify the created record exists in PostgreSQL directly', async () => {
    const user = await createUser({ name: 'DB Verify', email: 'dbverify@test.com' });
    const [rows] = await sequelize.query(`SELECT * FROM pguser WHERE id = '${user.id}'`);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].name, 'DB Verify');
    assert.strictEqual(rows[0].email, 'dbverify@test.com');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: READ OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

describe('3. READ Operations', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await createUser({ name: 'Read User', email: 'read@test.com' });
  });

  it('should find a record by primary key', async () => {
    const found = await models.PgUser.findByPk(testUser.id);
    assert.ok(found);
    assert.strictEqual(found.id, testUser.id);
    assert.strictEqual(found.name, 'Read User');
  });

  it('should find a record using findOne with where clause', async () => {
    const found = await models.PgUser.findOne({ where: { email: 'read@test.com' } });
    assert.ok(found);
    assert.strictEqual(found.email, 'read@test.com');
  });

  it('should return null for non-existent ID', async () => {
    const found = await models.PgUser.findByPk('non-existent-id-12345');
    assert.strictEqual(found, null);
  });

  it('should return empty array for no matching records', async () => {
    const results = await models.PgUser.findAll({ where: { name: 'NoSuchUser' } });
    assert.ok(Array.isArray(results));
    assert.strictEqual(results.length, 0);
  });

  it('should fetch multiple records', async () => {
    await createUser({ email: 'read2@test.com' });
    await createUser({ email: 'read3@test.com' });
    const results = await models.PgUser.findAll();
    assert.ok(results.length >= 3);
  });

  it('should convert to plain objects with toJSON', async () => {
    const found = await models.PgUser.findByPk(testUser.id);
    const plain = found.toJSON();
    assert.ok(typeof plain === 'object');
    assert.ok(!plain.dataValues, 'toJSON should not have dataValues wrapper');
    assert.strictEqual(plain.name, 'Read User');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: FILTERING (buildSequelizeWhereClause)
// ═══════════════════════════════════════════════════════════════════════════════

describe('4. Filtering', () => {
  beforeEach(async () => {
    await createUser({ name: 'Alice', email: 'alice@test.com', age: 25, salary: 50000, active: true });
    await createUser({ name: 'Bob', email: 'bob@test.com', age: 35, salary: 80000, active: true });
    await createUser({ name: 'Charlie', email: 'charlie@test.com', age: 45, salary: 120000, active: false });
    await createUser({ name: 'Diana', email: 'diana@test.com', age: 28, salary: 65000, active: true });
  });

  it('should filter by exact equality', async () => {
    const where = buildSequelizeWhereClause({ name: 'Alice' });
    const results = await models.PgUser.findAll({ where });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].name, 'Alice');
  });

  it('should filter with _not (inequality)', async () => {
    const where = buildSequelizeWhereClause({ name_not: 'Alice' });
    const results = await models.PgUser.findAll({ where });
    assert.ok(results.length >= 3);
    results.forEach((r) => assert.notStrictEqual(r.name, 'Alice'));
  });

  it('should filter with _gt (greater than)', async () => {
    const where = buildSequelizeWhereClause({ age_gt: 30 });
    const results = await models.PgUser.findAll({ where });
    assert.ok(results.length >= 2);
    results.forEach((r) => assert.ok(r.age > 30));
  });

  it('should filter with _gte (greater than or equal)', async () => {
    const where = buildSequelizeWhereClause({ age_gte: 35 });
    const results = await models.PgUser.findAll({ where });
    assert.ok(results.length >= 2);
    results.forEach((r) => assert.ok(r.age >= 35));
  });

  it('should filter with _lt (less than)', async () => {
    const where = buildSequelizeWhereClause({ salary_lt: 70000 });
    const results = await models.PgUser.findAll({ where });
    assert.ok(results.length >= 2);
    results.forEach((r) => assert.ok(r.salary < 70000));
  });

  it('should filter with _lte (less than or equal)', async () => {
    const where = buildSequelizeWhereClause({ salary_lte: 65000 });
    const results = await models.PgUser.findAll({ where });
    assert.ok(results.length >= 2);
    results.forEach((r) => assert.ok(r.salary <= 65000));
  });

  it('should filter with _in (set inclusion)', async () => {
    const where = buildSequelizeWhereClause({ name_in: ['Alice', 'Bob'] });
    const results = await models.PgUser.findAll({ where });
    assert.strictEqual(results.length, 2);
  });

  it('should filter with _contains (case-insensitive ILIKE)', async () => {
    const where = buildSequelizeWhereClause({ name_contains: 'li' });
    const results = await models.PgUser.findAll({ where });
    // Alice and Charlie both contain 'li'
    assert.ok(results.length >= 2);
  });

  it('should filter with _startsWith', async () => {
    const where = buildSequelizeWhereClause({ name_startsWith: 'Al' });
    const results = await models.PgUser.findAll({ where });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].name, 'Alice');
  });

  it('should filter with _endsWith', async () => {
    const where = buildSequelizeWhereClause({ name_endsWith: 'ob' });
    const results = await models.PgUser.findAll({ where });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].name, 'Bob');
  });

  it('should filter with _exists (null check)', async () => {
    await createUser({ name: 'NoBio', email: 'nobio@test.com', bio: null });
    const where = buildSequelizeWhereClause({ bio_exists: false });
    const results = await models.PgUser.findAll({ where });
    assert.ok(results.length >= 1);
  });

  it('should filter with boolean values', async () => {
    const where = buildSequelizeWhereClause({ active: false });
    const results = await models.PgUser.findAll({ where });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].name, 'Charlie');
  });

  it('should filter with AND logical operator', async () => {
    const where = buildSequelizeWhereClause({
      and: [{ active: true }, { age_gte: 30 }],
    });
    const results = await models.PgUser.findAll({ where });
    assert.ok(results.length >= 1);
    results.forEach((r) => {
      assert.strictEqual(r.active, true);
      assert.ok(r.age >= 30);
    });
  });

  it('should filter with OR logical operator', async () => {
    const where = buildSequelizeWhereClause({
      or: [{ name: 'Alice' }, { name: 'Bob' }],
    });
    const results = await models.PgUser.findAll({ where });
    assert.strictEqual(results.length, 2);
  });

  it('should filter with NOT logical operator', async () => {
    const where = buildSequelizeWhereClause({ not: { active: false } });
    const results = await models.PgUser.findAll({ where });
    assert.ok(results.length >= 3);
    results.forEach((r) => assert.strictEqual(r.active, true));
  });

  it('should handle combined filters', async () => {
    const where = buildSequelizeWhereClause({
      and: [
        { active: true },
        { or: [{ age_gt: 30 }, { salary_gt: 60000 }] },
      ],
    });
    const results = await models.PgUser.findAll({ where });
    assert.ok(results.length >= 2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: PAGINATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('5. Pagination', () => {
  beforeEach(async () => {
    for (let i = 1; i <= 10; i += 1) {
      await createUser({
        name: `Paginated User ${String(i).padStart(2, '0')}`,
        email: `paginated${i}@test.com`,
        age: 20 + i,
      });
    }
  });

  it('should limit results with first/limit', async () => {
    const results = await models.PgUser.findAll({ limit: 3 });
    assert.strictEqual(results.length, 3);
  });

  it('should skip results with offset', async () => {
    const all = await models.PgUser.findAll({ order: [['name', 'ASC']] });
    const offset = await models.PgUser.findAll({ offset: 3, order: [['name', 'ASC']] });
    assert.ok(offset.length <= all.length - 3);
    assert.strictEqual(offset[0].name, all[3].name);
  });

  it('should combine limit and offset for paging', async () => {
    const page1 = await models.PgUser.findAll({ limit: 3, offset: 0, order: [['name', 'ASC']] });
    const page2 = await models.PgUser.findAll({ limit: 3, offset: 3, order: [['name', 'ASC']] });
    assert.strictEqual(page1.length, 3);
    assert.strictEqual(page2.length, 3);
    // No overlap
    const ids1 = page1.map((r) => r.id);
    const ids2 = page2.map((r) => r.id);
    ids1.forEach((id) => assert.ok(!ids2.includes(id), 'Pages should not overlap'));
  });

  it('should return empty for offset beyond total', async () => {
    const results = await models.PgUser.findAll({ offset: 1000 });
    assert.strictEqual(results.length, 0);
  });

  it('should not duplicate or skip records across pages', async () => {
    const allIds = new Set();
    const pageSize = 3;
    let offset = 0;
    let page;
    do {
      page = await models.PgUser.findAll({ limit: pageSize, offset, order: [['id', 'ASC']] });
      page.forEach((r) => {
        assert.ok(!allIds.has(r.id), `Duplicate record: ${r.id}`);
        allIds.add(r.id);
      });
      offset += pageSize;
    } while (page.length === pageSize);

    const totalCount = await models.PgUser.count();
    assert.strictEqual(allIds.size, totalCount, 'All records should be seen exactly once');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: SORTING
// ═══════════════════════════════════════════════════════════════════════════════

describe('6. Sorting', () => {
  beforeEach(async () => {
    await createUser({ name: 'Zara', email: 'zara@test.com', age: 22, salary: 30000 });
    await createUser({ name: 'Alice', email: 'alice@test.com', age: 45, salary: 120000 });
    await createUser({ name: 'Mike', email: 'mike@test.com', age: 30, salary: 75000 });
  });

  it('should sort ascending by name', async () => {
    const results = await models.PgUser.findAll({ order: [['name', 'ASC']] });
    for (let i = 1; i < results.length; i += 1) {
      assert.ok(results[i].name >= results[i - 1].name);
    }
  });

  it('should sort descending by age', async () => {
    const results = await models.PgUser.findAll({ order: [['age', 'DESC']] });
    for (let i = 1; i < results.length; i += 1) {
      assert.ok(results[i].age <= results[i - 1].age);
    }
  });

  it('should sort numeric fields correctly', async () => {
    const results = await models.PgUser.findAll({ order: [['salary', 'ASC']] });
    for (let i = 1; i < results.length; i += 1) {
      assert.ok(results[i].salary >= results[i - 1].salary);
    }
  });

  it('should sort by createdAt timestamp', async () => {
    const results = await models.PgUser.findAll({ order: [['createdAt', 'ASC']] });
    for (let i = 1; i < results.length; i += 1) {
      assert.ok(new Date(results[i].createdAt) >= new Date(results[i - 1].createdAt));
    }
  });

  it('should handle nullable fields in sorting', async () => {
    await createUser({ name: 'NullAge', email: 'nullage@test.com', age: null });
    const results = await models.PgUser.findAll({ order: [['age', 'ASC NULLS LAST']] });
    assert.ok(results.length >= 4);
    // Null should be last
    assert.strictEqual(results[results.length - 1].age, null);
  });

  it('should convert MongoDB sort format to Sequelize format', () => {
    const mongoSort = { name: 1, age: -1 };
    const seqOrder = convertSortToSequelizeOrder(mongoSort);
    assert.deepStrictEqual(seqOrder, [['name', 'ASC'], ['age', 'DESC']]);
  });

  it('should parse orderBy string to Sequelize format', () => {
    const order = getSortOrderForSequelize('createdAt_ASC');
    assert.deepStrictEqual(order, [['createdAt', 'ASC']]);
    const order2 = getSortOrderForSequelize('salary_DESC');
    assert.deepStrictEqual(order2, [['salary', 'DESC']]);
  });

  it('should combine sorting with pagination', async () => {
    const page1 = await models.PgUser.findAll({ order: [['salary', 'DESC']], limit: 2, offset: 0 });
    const page2 = await models.PgUser.findAll({ order: [['salary', 'DESC']], limit: 2, offset: 2 });
    if (page1.length && page2.length) {
      assert.ok(page1[page1.length - 1].salary >= page2[0].salary);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: UPDATE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

describe('7. UPDATE Operations', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await createUser({ name: 'Update Me', email: 'update@test.com', age: 25, salary: 50000 });
  });

  it('should update a single field', async () => {
    const record = await models.PgUser.findByPk(testUser.id);
    await record.update({ name: 'Updated Name' });
    const refreshed = await models.PgUser.findByPk(testUser.id);
    assert.strictEqual(refreshed.name, 'Updated Name');
  });

  it('should update multiple fields', async () => {
    const record = await models.PgUser.findByPk(testUser.id);
    await record.update({ name: 'Multi Updated', age: 30, salary: 60000 });
    const refreshed = await models.PgUser.findByPk(testUser.id);
    assert.strictEqual(refreshed.name, 'Multi Updated');
    assert.strictEqual(refreshed.age, 30);
    assert.strictEqual(refreshed.salary, 60000);
  });

  it('should preserve fields not being updated', async () => {
    const record = await models.PgUser.findByPk(testUser.id);
    await record.update({ name: 'New Name' });
    const refreshed = await models.PgUser.findByPk(testUser.id);
    assert.strictEqual(refreshed.email, 'update@test.com', 'Email should remain unchanged');
    assert.strictEqual(refreshed.age, 25, 'Age should remain unchanged');
  });

  it('should set a field to null', async () => {
    const record = await models.PgUser.findByPk(testUser.id);
    await record.update({ bio: null });
    const refreshed = await models.PgUser.findByPk(testUser.id);
    assert.strictEqual(refreshed.bio, null);
  });

  it('should update JSONB fields', async () => {
    const record = await models.PgUser.findByPk(testUser.id);
    await record.update({ preferences: { theme: 'light', lang: 'fr' } });
    const refreshed = await models.PgUser.findByPk(testUser.id);
    const plain = refreshed.toJSON();
    assert.deepStrictEqual(plain.preferences, { theme: 'light', lang: 'fr' });
  });

  it('should update boolean fields', async () => {
    const record = await models.PgUser.findByPk(testUser.id);
    await record.update({ active: false });
    const refreshed = await models.PgUser.findByPk(testUser.id);
    assert.strictEqual(refreshed.active, false);
  });

  it('should update updatedAt timestamp', async () => {
    const record = await models.PgUser.findByPk(testUser.id);
    const before = new Date(record.updatedAt);
    // Small delay to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 100));
    await record.update({ name: 'Timestamp Test' });
    const refreshed = await models.PgUser.findByPk(testUser.id);
    assert.ok(new Date(refreshed.updatedAt) >= before);
  });

  it('should verify update in PostgreSQL directly', async () => {
    const record = await models.PgUser.findByPk(testUser.id);
    await record.update({ name: 'Direct Verify' });
    const [rows] = await sequelize.query(`SELECT name FROM pguser WHERE id = '${testUser.id}'`);
    assert.strictEqual(rows[0].name, 'Direct Verify');
  });

  it('should reject invalid update (unique violation)', async () => {
    await createUser({ email: 'taken@test.com' });
    const record = await models.PgUser.findByPk(testUser.id);
    try {
      await record.update({ email: 'taken@test.com' });
      assert.fail('Should have thrown unique constraint error');
    } catch (err) {
      assert.ok(err.name === 'SequelizeUniqueConstraintError' || err.message.includes('unique'));
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8: DELETE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

describe('8. DELETE Operations', () => {
  it('should delete a record by ID', async () => {
    const user = await createUser({ email: 'delete@test.com' });
    const record = await models.PgUser.findByPk(user.id);
    assert.ok(record);
    await record.destroy();
    const deleted = await models.PgUser.findByPk(user.id);
    assert.strictEqual(deleted, null);
  });

  it('should verify deletion in PostgreSQL directly', async () => {
    const user = await createUser({ email: 'deleteverify@test.com' });
    const record = await models.PgUser.findByPk(user.id);
    await record.destroy();
    const [rows] = await sequelize.query(`SELECT * FROM pguser WHERE id = '${user.id}'`);
    assert.strictEqual(rows.length, 0);
  });

  it('should handle deletion of non-existent record gracefully', async () => {
    const result = await models.PgUser.destroy({ where: { id: 'non-existent-id' } });
    assert.strictEqual(result, 0, 'No rows should be affected');
  });

  it('should delete with destroy using where clause', async () => {
    await createUser({ email: 'batchdel1@test.com', active: false });
    await createUser({ email: 'batchdel2@test.com', active: false });
    await createUser({ email: 'batchdel3@test.com', active: true });
    const count = await models.PgUser.destroy({ where: { active: false } });
    assert.strictEqual(count, 2);
    const remaining = await models.PgUser.count();
    assert.strictEqual(remaining, 1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9: RELATIONSHIPS
// ═══════════════════════════════════════════════════════════════════════════════

describe('9. Relationships', () => {
  let company, user1, user2, post1, post2, comment1;

  beforeEach(async () => {
    company = await createCompany({ name: 'Acme Corp', domain: 'acme.com' });
    user1 = await createUser({ name: 'Author1', email: 'author1@test.com', companyId: company.id });
    user2 = await createUser({ name: 'Author2', email: 'author2@test.com', companyId: company.id });
    post1 = await createPost(user1.id, { title: 'Post One', companyId: company.id });
    post2 = await createPost(user1.id, { title: 'Post Two', companyId: company.id });
    comment1 = await createComment(post1.id, user2.id, { content: 'Nice post!' });
  });

  it('should query User → Posts (one-to-many)', async () => {
    const userWithPosts = await models.PgUser.findByPk(user1.id, {
      include: [{ model: models.PgPost, as: 'posts' }],
    });
    assert.ok(userWithPosts.posts);
    assert.strictEqual(userWithPosts.posts.length, 2);
  });

  it('should query Post → Author (many-to-one / belongsTo)', async () => {
    const postWithAuthor = await models.PgPost.findByPk(post1.id, {
      include: [{ model: models.PgUser, as: 'author' }],
    });
    assert.ok(postWithAuthor.author);
    assert.strictEqual(postWithAuthor.author.name, 'Author1');
  });

  it('should query Company → Users (one-to-many)', async () => {
    const companyWithUsers = await models.PgCompany.findByPk(company.id, {
      include: [{ model: models.PgUser, as: 'users' }],
    });
    assert.ok(companyWithUsers.users);
    assert.strictEqual(companyWithUsers.users.length, 2);
  });

  it('should query Post → Comments (one-to-many)', async () => {
    const postWithComments = await models.PgPost.findByPk(post1.id, {
      include: [{ model: models.PgComment, as: 'comments' }],
    });
    assert.ok(postWithComments.comments);
    assert.strictEqual(postWithComments.comments.length, 1);
    assert.strictEqual(postWithComments.comments[0].content, 'Nice post!');
  });

  it('should query nested relationships: User → Posts → Comments', async () => {
    const userDeep = await models.PgUser.findByPk(user1.id, {
      include: [{
        model: models.PgPost,
        as: 'posts',
        include: [{ model: models.PgComment, as: 'comments' }],
      }],
    });
    assert.ok(userDeep.posts);
    const postOne = userDeep.posts.find((p) => p.title === 'Post One');
    assert.ok(postOne);
    assert.ok(postOne.comments);
    assert.strictEqual(postOne.comments.length, 1);
  });

  it('should query Comment → Author (nested relationship)', async () => {
    const commentWithAuthor = await models.PgComment.findByPk(comment1.id, {
      include: [{ model: models.PgUser, as: 'author' }],
    });
    assert.ok(commentWithAuthor.author);
    assert.strictEqual(commentWithAuthor.author.name, 'Author2');
  });

  it('should query Comment → Post → Author (deep nested)', async () => {
    const commentDeep = await models.PgComment.findByPk(comment1.id, {
      include: [{
        model: models.PgPost,
        as: 'post',
        include: [{ model: models.PgUser, as: 'author' }],
      }],
    });
    assert.ok(commentDeep.post);
    assert.ok(commentDeep.post.author);
    assert.strictEqual(commentDeep.post.author.name, 'Author1');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10: DATALOADERS
// ═══════════════════════════════════════════════════════════════════════════════

describe('10. DataLoaders', () => {
  let user1, user2, user3;

  beforeEach(async () => {
    user1 = await createUser({ name: 'DL User 1', email: 'dl1@test.com' });
    user2 = await createUser({ name: 'DL User 2', email: 'dl2@test.com' });
    user3 = await createUser({ name: 'DL User 3', email: 'dl3@test.com' });
  });

  it('should batch multiple ID lookups into a single query', async () => {
    const loaders = createDataLoaders({ PgUser: models.PgUser });
    const loader = loaders.getLoader('PgUser');
    assert.ok(loader, 'DataLoader must be created for PgUser');

    const [r1, r2, r3] = await Promise.all([
      loader.load(user1.id),
      loader.load(user2.id),
      loader.load(user3.id),
    ]);

    assert.strictEqual(r1.id, user1.id);
    assert.strictEqual(r1.name, 'DL User 1');
    assert.strictEqual(r2.id, user2.id);
    assert.strictEqual(r3.id, user3.id);
  });

  it('should return null for non-existent IDs', async () => {
    const loaders = createDataLoaders({ PgUser: models.PgUser });
    const loader = loaders.getLoader('PgUser');
    const result = await loader.load('non-existent-id');
    assert.strictEqual(result, null);
  });

  it('should memoize repeated loads within same DataLoader instance', async () => {
    const loaders = createDataLoaders({ PgUser: models.PgUser });
    const loader = loaders.getLoader('PgUser');

    const [r1, r1Again] = await Promise.all([
      loader.load(user1.id),
      loader.load(user1.id),
    ]);
    assert.strictEqual(r1.id, r1Again.id);
    assert.strictEqual(r1.name, r1Again.name);
  });

  it('should handle mixed found and not-found IDs correctly', async () => {
    const loaders = createDataLoaders({ PgUser: models.PgUser });
    const loader = loaders.getLoader('PgUser');

    const [r1, rMissing, r2] = await Promise.all([
      loader.load(user1.id),
      loader.load('missing-id'),
      loader.load(user2.id),
    ]);

    assert.ok(r1);
    assert.strictEqual(rMissing, null);
    assert.ok(r2);
  });

  it('should clear cache when requested', async () => {
    const loaders = createDataLoaders({ PgUser: models.PgUser });
    const loader = loaders.getLoader('PgUser');

    await loader.load(user1.id);
    loaders.clear('PgUser', user1.id);

    // Should reload from DB after cache clear
    const result = await loader.load(user1.id);
    assert.ok(result);
    assert.strictEqual(result.id, user1.id);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 11: TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

describe('11. Transactions', () => {
  it('should commit all changes in a successful transaction', async () => {
    const t = await sequelize.transaction();
    try {
      const user = await models.PgUser.create({
        id: cuid(), name: 'TxUser', email: 'txuser@test.com',
      }, { transaction: t });
      const post = await models.PgPost.create({
        id: cuid(), title: 'TxPost', authorId: user.id, content: 'tx content',
      }, { transaction: t });
      await t.commit();

      // Verify both records exist
      const foundUser = await models.PgUser.findByPk(user.id);
      const foundPost = await models.PgPost.findByPk(post.id);
      assert.ok(foundUser, 'User should be committed');
      assert.ok(foundPost, 'Post should be committed');
    } catch (err) {
      await t.rollback();
      throw err;
    }
  });

  it('should rollback all changes in a failed transaction', async () => {
    const userId = cuid();
    const postId = cuid();

    const t = await sequelize.transaction();
    try {
      await models.PgUser.create({
        id: userId, name: 'RollbackUser', email: 'rollback@test.com',
      }, { transaction: t });

      // This will fail (missing required authorId)
      await models.PgPost.create({
        id: postId, title: null, content: 'fail', authorId: null,
      }, { transaction: t });

      await t.commit();
      assert.fail('Transaction should have failed');
    } catch (err) {
      await t.rollback();
    }

    // Verify neither record exists (rollback worked)
    const foundUser = await models.PgUser.findByPk(userId);
    const foundPost = await models.PgPost.findByPk(postId);
    assert.strictEqual(foundUser, null, 'User should be rolled back');
    assert.strictEqual(foundPost, null, 'Post should be rolled back');
  });

  it('should not have partially committed data after failure', async () => {
    const countBefore = await models.PgUser.count();
    const t = await sequelize.transaction();
    try {
      await models.PgUser.create({
        id: cuid(), name: 'Partial1', email: 'partial1@test.com',
      }, { transaction: t });
      await models.PgUser.create({
        id: cuid(), name: 'Partial2', email: 'partial2@test.com',
      }, { transaction: t });
      // Force failure
      throw new Error('Intentional failure');
    } catch (err) {
      await t.rollback();
    }

    const countAfter = await models.PgUser.count();
    assert.strictEqual(countAfter, countBefore, 'Count should not change after rollback');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 12: SCHEMA EVOLUTION
// ═══════════════════════════════════════════════════════════════════════════════

describe('12. Schema Evolution', () => {
  it('should add a new column via alter:true sync', async () => {
    // Add a new column dynamically
    const attrs = models.PgProduct.rawAttributes;
    if (!attrs.weight) {
      models.PgProduct.rawAttributes.weight = {
        type: DataTypes.FLOAT,
        allowNull: true,
        fieldName: 'weight',
        field: 'weight',
        _modelAttribute: true,
      };
      // Re-init to register new attribute
      models.PgProduct.init(
        { ...models.PgProduct.rawAttributes },
        { ...models.PgProduct.options, sequelize },
      );
    }
    await models.PgProduct.sync({ alter: true });

    const [cols] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'pgproduct' AND column_name = 'weight';
    `);
    assert.ok(cols.length > 0, 'weight column should exist after alter sync');
  });

  it('should preserve existing data after schema evolution', async () => {
    const product = await createProduct({ name: 'PreEvolve' });

    // Re-sync with alter (should not destroy data)
    await models.PgProduct.sync({ alter: true });

    const found = await models.PgProduct.findByPk(product.id);
    assert.ok(found, 'Record should still exist after alter sync');
    assert.strictEqual(found.name, 'PreEvolve');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 13: ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

describe('13. Error Handling', () => {
  it('should produce useful error on NOT NULL violation', async () => {
    try {
      await models.PgUser.create({ bio: 'missing name and email' });
      assert.fail('Should have thrown');
    } catch (err) {
      assert.ok(err.message);
      assert.ok(
        err.name === 'SequelizeValidationError' || err.name === 'SequelizeDatabaseError',
        `Expected validation/database error, got: ${err.name}`,
      );
    }
  });

  it('should produce useful error on unique constraint violation', async () => {
    await createUser({ email: 'unique@test.com' });
    try {
      await createUser({ email: 'unique@test.com' });
      assert.fail('Should have thrown');
    } catch (err) {
      assert.ok(err.name === 'SequelizeUniqueConstraintError');
    }
  });

  it('should produce useful error on invalid data type', async () => {
    try {
      await models.PgUser.create({
        id: cuid(), name: 'TypeTest', email: `typeerr${Date.now()}@test.com`,
        age: 'not-a-number',
      });
      assert.fail('Should have thrown');
    } catch (err) {
      assert.ok(err.message);
    }
  });

  it('should not corrupt database state after error', async () => {
    const countBefore = await models.PgUser.count();
    try {
      await models.PgUser.create({ bio: 'bad record' });
    } catch (e) { /* expected */ }
    const countAfter = await models.PgUser.count();
    assert.strictEqual(countBefore, countAfter);
  });

  it('should maintain healthy connection after errors', async () => {
    try {
      await models.PgUser.create({ bio: 'error' });
    } catch (e) { /* expected */ }

    // Connection should still work
    await sequelize.authenticate();
    const user = await createUser({ email: 'aftererror@test.com' });
    assert.ok(user.id);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 14: CONNECTION LIFECYCLE & POOLING
// ═══════════════════════════════════════════════════════════════════════════════

describe('14. Connection Lifecycle & Pooling', () => {
  it('should handle concurrent read operations', async () => {
    await createUser({ email: 'concurrent1@test.com' });
    await createUser({ email: 'concurrent2@test.com' });

    const promises = Array.from({ length: 20 }, () =>
      models.PgUser.findAll(),
    );
    const results = await Promise.all(promises);
    results.forEach((r) => {
      assert.ok(Array.isArray(r));
      assert.ok(r.length >= 2);
    });
  });

  it('should handle concurrent write operations', async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      createUser({ email: `concwrite${i}@test.com` }),
    );
    const results = await Promise.all(promises);
    assert.strictEqual(results.length, 10);
    results.forEach((r) => assert.ok(r.id));

    const count = await models.PgUser.count();
    assert.strictEqual(count, 10);
  });

  it('should reuse connections from pool', async () => {
    // Run sequential queries and verify they succeed
    for (let i = 0; i < 20; i += 1) {
      await sequelize.authenticate();
    }
    // If we get here without error, pooling is working
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 15: CONCURRENCY & RACE CONDITIONS
// ═══════════════════════════════════════════════════════════════════════════════

describe('15. Concurrency & Race Conditions', () => {
  it('should handle concurrent creates without losing records', async () => {
    const promises = Array.from({ length: 20 }, (_, i) =>
      createProduct({ name: `Concurrent Product ${i}`, sku: `conc-sku-${Date.now()}-${i}` }),
    );
    const results = await Promise.all(promises);
    assert.strictEqual(results.length, 20);
    const count = await models.PgProduct.count();
    assert.strictEqual(count, 20);
  });

  it('should handle concurrent updates to different records', async () => {
    const users = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        createUser({ name: `ConcUser${i}`, email: `concupd${i}@test.com`, age: 20 + i }),
      ),
    );

    // Update each user concurrently
    const updatePromises = users.map((u, i) =>
      models.PgUser.update({ age: 100 + i }, { where: { id: u.id } }),
    );
    await Promise.all(updatePromises);

    // Verify all updates applied
    for (let i = 0; i < users.length; i += 1) {
      const refreshed = await models.PgUser.findByPk(users[i].id);
      assert.strictEqual(refreshed.age, 100 + i);
    }
  });

  it('should handle mixed concurrent CRUD operations', async () => {
    const user = await createUser({ email: 'mixedcrud@test.com' });
    const product = await createProduct({ sku: 'mixed-sku-1' });

    const promises = [
      createUser({ email: 'mixedcrud2@test.com' }),
      models.PgUser.findByPk(user.id),
      models.PgProduct.update({ price: 99.99 }, { where: { id: product.id } }),
      models.PgUser.count(),
      createProduct({ sku: 'mixed-sku-2' }),
    ];

    const results = await Promise.all(promises);
    assert.ok(results.every((r) => r !== undefined));
  });

  it('should handle concurrent reads and writes without connection pool exhaustion', async () => {
    // Seed some data first
    await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        createUser({ email: `pooltest${i}@test.com` }),
      ),
    );

    // Now run 30 concurrent mixed ops
    const ops = Array.from({ length: 30 }, (_, i) => {
      if (i % 3 === 0) {
        return createUser({ email: `pooltestextra${i}@test.com` });
      }
      if (i % 3 === 1) {
        return models.PgUser.findAll();
      }
      return models.PgUser.count();
    });

    const results = await Promise.all(ops);
    assert.strictEqual(results.length, 30);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 16: TYPE MAPPING VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('16. Type Mapping Verification', () => {
  it('should map String to DataTypes.STRING', () => {
    const result = mapGraphQLFieldToSequelize({ type: 'String' });
    assert.strictEqual(result.type.key, DataTypes.STRING.key);
  });

  it('should map ID to DataTypes.STRING', () => {
    const result = mapGraphQLFieldToSequelize({ type: 'ID' });
    assert.strictEqual(result.type.key, DataTypes.STRING.key);
  });

  it('should map Int to DataTypes.INTEGER', () => {
    const result = mapGraphQLFieldToSequelize({ type: 'Int' });
    assert.strictEqual(result.type.key, DataTypes.INTEGER.key);
  });

  it('should map Float to DataTypes.FLOAT', () => {
    const result = mapGraphQLFieldToSequelize({ type: 'Float' });
    assert.strictEqual(result.type.key, DataTypes.FLOAT.key);
  });

  it('should map Boolean to DataTypes.BOOLEAN', () => {
    const result = mapGraphQLFieldToSequelize({ type: 'Boolean' });
    assert.strictEqual(result.type.key, DataTypes.BOOLEAN.key);
  });

  it('should map Date to DataTypes.DATE', () => {
    const result = mapGraphQLFieldToSequelize({ type: 'Date' });
    assert.strictEqual(result.type.key, DataTypes.DATE.key);
  });

  it('should map JSONB to DataTypes.JSONB', () => {
    const result = mapGraphQLFieldToSequelize({ type: 'JSONB' });
    assert.strictEqual(result.type.key, (DataTypes.JSONB || DataTypes.TEXT).key);
  });

  it('should respect required field (allowNull: false)', () => {
    const result = mapGraphQLFieldToSequelize({ type: 'String', required: true });
    assert.strictEqual(result.allowNull, false);
  });

  it('should respect optional field (allowNull: true)', () => {
    const result = mapGraphQLFieldToSequelize({ type: 'String' });
    assert.strictEqual(result.allowNull, true);
  });

  it('should set unique constraint', () => {
    const result = mapGraphQLFieldToSequelize({ type: 'String', unique: true });
    assert.strictEqual(result.unique, true);
  });

  it('should set default value', () => {
    const result = mapGraphQLFieldToSequelize({ type: 'Boolean', default: true });
    assert.strictEqual(result.defaultValue, true);
  });
});

describe('17. Client GraphQL SDL Input & End-to-End GraphQL Operation Execution', () => {
  let gqlSchema;

  before(() => {
    gqlSchema = createPostgresExecutableSchema(models);
  });

  it('should parse client GraphQL SDL directly into model field definitions and types', () => {
    const { fieldsSchemas } = parseSDLToSchemaDefinitions(pgGraphQLSDL);

    assert.ok(fieldsSchemas.PgCompany, 'Must extract PgCompany from SDL');
    assert.ok(fieldsSchemas.PgUser, 'Must extract PgUser from SDL');
    assert.ok(fieldsSchemas.PgPost, 'Must extract PgPost from SDL');
    assert.ok(fieldsSchemas.PgComment, 'Must extract PgComment from SDL');
    assert.ok(fieldsSchemas.PgProduct, 'Must extract PgProduct from SDL');

    // Verify parsed field types and constraints from SDL
    assert.strictEqual(fieldsSchemas.PgCompany.name.type, 'String');
    assert.strictEqual(fieldsSchemas.PgCompany.name.required, true);
    assert.strictEqual(fieldsSchemas.PgCompany.domain.unique, true);
    assert.strictEqual(fieldsSchemas.PgCompany.isPublic.default, false);
    assert.strictEqual(fieldsSchemas.PgCompany.metadata.type, 'JSONB');

    assert.strictEqual(fieldsSchemas.PgUser.email.required, true);
    assert.strictEqual(fieldsSchemas.PgUser.email.unique, true);
    assert.strictEqual(fieldsSchemas.PgUser.active.default, true);
    assert.strictEqual(fieldsSchemas.PgUser.salary.type, 'Float');
  });

  it('should extract relational graph associations directly from @relation directives in client GraphQL SDL', () => {
    const { relations } = parseSDLToSchemaDefinitions(pgGraphQLSDL);

    assert.ok(relations.length >= 4, `Must have extracted at least 4 relations, got ${relations.length}`);

    const companyUsersRel = relations.find((r) => r.source === 'PgCompany' && r.target === 'PgUser');
    assert.ok(companyUsersRel, 'Must have PgCompany -> PgUser relation from @relation(name: "CompanyUsers")');
    assert.strictEqual(companyUsersRel.foreignKey, 'companyId');
    assert.strictEqual(companyUsersRel.as, 'users');

    const userPostsRel = relations.find((r) => r.source === 'PgUser' && r.target === 'PgPost');
    assert.ok(userPostsRel, 'Must have PgUser -> PgPost relation from @relation(name: "UserPosts")');
    assert.strictEqual(userPostsRel.foreignKey, 'authorId');
    assert.strictEqual(userPostsRel.as, 'posts');

    const postCommentsRel = relations.find((r) => r.source === 'PgPost' && r.target === 'PgComment');
    assert.ok(postCommentsRel, 'Must have PgPost -> PgComment relation from @relation(name: "PostComments")');
    assert.strictEqual(postCommentsRel.foreignKey, 'postId');
    assert.strictEqual(postCommentsRel.as, 'comments');
  });

  it('should dynamically generate live Sequelize models from a custom client GraphQL SDL string', async () => {
    const customClientSDL = `
      type PgInvoice @model(database: "postgres") {
        invoiceNumber: String! @unique
        amount: Float!
        paid: Boolean @defaultValue(value: "false")
      }
    `;

    const customModels = createModelsFromSDL(customClientSDL, sequelize);
    assert.ok(customModels.PgInvoice, 'Must generate PgInvoice Sequelize model from custom SDL');
    assert.ok(customModels.PgInvoice.isPgModel, 'Must set isPgModel = true');

    // Sync table to live PostgreSQL database
    await customModels.PgInvoice.sync({ force: true });

    // Insert record into PostgreSQL through model generated from SDL
    const inv = await customModels.PgInvoice.create({
      invoiceNumber: `INV-${Date.now()}`,
      amount: 199.99,
    });

    assert.ok(inv.id, 'Must have auto-generated ID');
    assert.strictEqual(inv.paid, false, 'Must apply defaultValue from SDL');

    const found = await customModels.PgInvoice.findByPk(inv.id);
    assert.strictEqual(found.amount, 199.99);
  });

  it('should execute client GraphQL Mutation createPgCompany and persist directly to PostgreSQL', async () => {
    const mutation = `
      mutation CreateCompany($input: CreatePgCompanyInput!) {
        createPgCompany(input: $input) {
          id
          name
          domain
          industry
          isPublic
        }
      }
    `;

    const variables = {
      input: {
        name: 'Apollo Systems Inc',
        domain: `apollo-${Date.now()}.io`,
        industry: 'Software',
        isPublic: true,
      },
    };

    const res = await graphql(gqlSchema, mutation, null, null, variables);
    assert.ok(!res.errors, `GraphQL errors: ${JSON.stringify(res.errors)}`);
    assert.ok(res.data.createPgCompany.id, 'Must return created company ID');
    assert.strictEqual(res.data.createPgCompany.name, 'Apollo Systems Inc');
    assert.strictEqual(res.data.createPgCompany.isPublic, true);

    // Verify record exists in PostgreSQL directly
    const pgRecord = await models.PgCompany.findByPk(res.data.createPgCompany.id);
    assert.ok(pgRecord, 'Company must exist in PostgreSQL');
    assert.strictEqual(pgRecord.name, 'Apollo Systems Inc');
  });

  it('should execute client GraphQL Mutation createPgUser with GraphQL variables and relation foreign keys', async () => {
    const company = await createCompany({ name: 'GraphQL Ventures' });

    const mutation = `
      mutation CreateUser($input: CreatePgUserInput!) {
        createPgUser(input: $input) {
          id
          name
          email
          age
          active
          companyId
        }
      }
    `;

    const email = `client-gql-${Date.now()}@example.com`;
    const variables = {
      input: {
        name: 'GraphQL Client User',
        email,
        age: 28,
        active: true,
        companyId: company.id,
      },
    };

    const res = await graphql(gqlSchema, mutation, null, null, variables);
    assert.ok(!res.errors, `GraphQL errors: ${JSON.stringify(res.errors)}`);
    assert.strictEqual(res.data.createPgUser.name, 'GraphQL Client User');
    assert.strictEqual(res.data.createPgUser.email, email);
    assert.strictEqual(res.data.createPgUser.companyId, company.id);

    // Verify in PostgreSQL directly
    const userInDb = await models.PgUser.findByPk(res.data.createPgUser.id);
    assert.ok(userInDb, 'User must exist in PostgreSQL database');
    assert.strictEqual(userInDb.email, email);
  });

  it('should execute client GraphQL Query pgUser with single record retrieval', async () => {
    const user = await createUser({ name: 'Fetchable User', age: 32 });

    const query = `
      query GetUser($id: ID!) {
        pgUser(id: $id) {
          id
          name
          age
          email
        }
      }
    `;

    const res = await graphql(gqlSchema, query, null, null, { id: user.id });
    assert.ok(!res.errors, `GraphQL errors: ${JSON.stringify(res.errors)}`);
    assert.strictEqual(res.data.pgUser.id, user.id);
    assert.strictEqual(res.data.pgUser.name, 'Fetchable User');
    assert.strictEqual(res.data.pgUser.age, 32);
  });

  it('should execute nested client GraphQL relational query: pgUser -> company', async () => {
    const company = await createCompany({ name: 'Parent Enterprise', domain: `parent-${Date.now()}.com` });
    const user = await createUser({ name: 'Employee User', companyId: company.id });

    const query = `
      query GetUserWithCompany($id: ID!) {
        pgUser(id: $id) {
          id
          name
          company {
            id
            name
            domain
          }
        }
      }
    `;

    const res = await graphql(gqlSchema, query, null, null, { id: user.id });
    assert.ok(!res.errors, `GraphQL errors: ${JSON.stringify(res.errors)}`);
    assert.strictEqual(res.data.pgUser.name, 'Employee User');
    assert.ok(res.data.pgUser.company, 'Must resolve company relationship');
    assert.strictEqual(res.data.pgUser.company.id, company.id);
    assert.strictEqual(res.data.pgUser.company.name, 'Parent Enterprise');
  });

  it('should execute deep nested client GraphQL relational query: pgUser -> posts -> comments', async () => {
    const user = await createUser({ name: 'Author User' });
    const post = await createPost(user.id, { title: 'First Article' });
    const comment = await createComment(post.id, user.id, { content: 'Insightful article!' });

    const query = `
      query GetAuthorPostsComments($id: ID!) {
        pgUser(id: $id) {
          id
          name
          posts {
            id
            title
            comments {
              id
              content
            }
          }
        }
      }
    `;

    const res = await graphql(gqlSchema, query, null, null, { id: user.id });
    assert.ok(!res.errors, `GraphQL errors: ${JSON.stringify(res.errors)}`);
    assert.strictEqual(res.data.pgUser.name, 'Author User');
    assert.strictEqual(res.data.pgUser.posts.length, 1);
    assert.strictEqual(res.data.pgUser.posts[0].title, 'First Article');
    assert.strictEqual(res.data.pgUser.posts[0].comments.length, 1);
    assert.strictEqual(res.data.pgUser.posts[0].comments[0].content, 'Insightful article!');
  });

  it('should execute client GraphQL Query with pagination (first & skip)', async () => {
    for (let i = 1; i <= 5; i += 1) {
      await createUser({ name: `PageUser_${i}` });
    }

    const query = `
      query ListPagedUsers($first: Int, $skip: Int) {
        pgUsers(first: $first, skip: $skip) {
          id
          name
        }
      }
    `;

    const page1 = await graphql(gqlSchema, query, null, null, { first: 2, skip: 0 });
    assert.ok(!page1.errors);
    assert.strictEqual(page1.data.pgUsers.length, 2);

    const page2 = await graphql(gqlSchema, query, null, null, { first: 2, skip: 2 });
    assert.ok(!page2.errors);
    assert.strictEqual(page2.data.pgUsers.length, 2);

    // Verify non-overlapping results
    const page1Ids = page1.data.pgUsers.map((u) => u.id);
    const page2Ids = page2.data.pgUsers.map((u) => u.id);
    const intersection = page1Ids.filter((id) => page2Ids.includes(id));
    assert.strictEqual(intersection.length, 0, 'Paged results must not overlap');
  });

  it('should execute client GraphQL Mutation updatePgUser and reflect updated fields', async () => {
    const user = await createUser({ name: 'Before Update', age: 25 });

    const mutation = `
      mutation UpdateUser($id: ID!, $input: UpdatePgUserInput!) {
        updatePgUser(id: $id, input: $input) {
          id
          name
          age
        }
      }
    `;

    const res = await graphql(gqlSchema, mutation, null, null, {
      id: user.id,
      input: { name: 'After Update', age: 26 },
    });

    assert.ok(!res.errors, `GraphQL errors: ${JSON.stringify(res.errors)}`);
    assert.strictEqual(res.data.updatePgUser.name, 'After Update');
    assert.strictEqual(res.data.updatePgUser.age, 26);

    // Verify in PostgreSQL directly
    const updated = await models.PgUser.findByPk(user.id);
    assert.strictEqual(updated.name, 'After Update');
    assert.strictEqual(updated.age, 26);
  });

  it('should execute client GraphQL Mutation deletePgUser and confirm deletion in PostgreSQL', async () => {
    const user = await createUser({ name: 'To Be Deleted' });

    const mutation = `
      mutation DeleteUser($id: ID!) {
        deletePgUser(id: $id) {
          id
          success
        }
      }
    `;

    const res = await graphql(gqlSchema, mutation, null, null, { id: user.id });
    assert.ok(!res.errors, `GraphQL errors: ${JSON.stringify(res.errors)}`);
    assert.strictEqual(res.data.deletePgUser.id, user.id);
    assert.strictEqual(res.data.deletePgUser.success, true);

    // Verify in PostgreSQL directly
    const found = await models.PgUser.findByPk(user.id);
    assert.strictEqual(found, null, 'User record must be deleted from PostgreSQL');
  });

  it('should return GraphQL execution error on invalid input violating schema constraints', async () => {
    const mutation = `
      mutation InvalidCreate($input: CreatePgUserInput!) {
        createPgUser(input: $input) {
          id
        }
      }
    `;

    // Missing required non-null field 'name' and 'email'
    const res = await graphql(gqlSchema, mutation, null, null, { input: { age: 20 } });
    assert.ok(res.errors, 'Must produce GraphQL validation error');
    assert.ok(res.errors.length > 0, 'Errors array should not be empty');
  });
});

