/**
 * AutoGraphQL — Complete End-to-End MongoDB Integration Test Suite
 *
 * This test suite validates AutoGraphQL strictly from the perspective of an
 * external client/developer. All CRUD operations, relational queries, filtering,
 * sorting, pagination, error handling, restart persistence, and schema evolution
 * are executed EXCLUSIVELY through generated GraphQL queries and mutations.
 *
 * MongoDB is treated as an implementation detail behind the GraphQL API.
 */
import assert from 'assert';
import mongoose from 'mongoose';
import {
  startMongoTestEnvironment,
  clearMongoCollections,
  closeMongoConnection,
  createGraphQLClient,
  MONGO_TEST_URI,
} from './setup';
import {
  mongoGraphQLSDL,
  mongoGraphQLSDLEvolved,
  parseSDLToSchemaDefinitions,
} from './testSchema';

describe('AutoGraphQL MongoDB Client End-to-End Integration Suite', function () {
  this.timeout(60000);

  let env;
  let client;
  let models;
  let schema;

  before(async () => {
    env = await startMongoTestEnvironment(mongoGraphQLSDL);
    models = env.models;
    schema = env.schema;
    client = createGraphQLClient(schema, models);
  });

  after(async () => {
    await clearMongoCollections(models);
    await closeMongoConnection();
  });

  beforeEach(async () => {
    await clearMongoCollections(models);
  });

  // =========================================================================
  // 1. Schema Generation & Introspection
  // =========================================================================
  describe('1. Schema Generation & Introspection', () => {
    it('should correctly parse client GraphQL SDL into entity definitions and relations', () => {
      const { fieldsSchemas, relations } = parseSDLToSchemaDefinitions(mongoGraphQLSDL);

      assert.ok(fieldsSchemas.MongoCompany, 'MongoCompany must be parsed');
      assert.ok(fieldsSchemas.MongoUser, 'MongoUser must be parsed');
      assert.ok(fieldsSchemas.MongoPost, 'MongoPost must be parsed');
      assert.ok(fieldsSchemas.MongoComment, 'MongoComment must be parsed');
      assert.ok(fieldsSchemas.MongoProduct, 'MongoProduct must be parsed');

      assert.strictEqual(fieldsSchemas.MongoUser.email.unique, true, 'MongoUser.email must be unique');
      assert.strictEqual(fieldsSchemas.MongoUser.name.required, true, 'MongoUser.name must be required');
      assert.strictEqual(fieldsSchemas.MongoUser.active.default, true, 'MongoUser.active default must be true');

      const companyUsersRel = relations.find((r) => r.relName === 'MongoCompanyUsers' && r.source === 'MongoCompany');
      assert.ok(companyUsersRel, 'MongoCompanyUsers relation must be extracted from SDL');
      assert.strictEqual(companyUsersRel.isList, true, 'Company.users must be a list relation');
    });

    it('should expose complete GraphQL schema via introspection query', async () => {
      const introspectionQuery = `
        query IntrospectBackend {
          __schema {
            queryType { name }
            mutationType { name }
            types {
              name
              kind
            }
          }
        }
      `;

      const res = await client.query(introspectionQuery);
      assert.ok(!res.errors, `Introspection error: ${JSON.stringify(res.errors)}`);
      assert.ok(res.data.__schema.queryType, 'Schema must have Query type');
      assert.ok(res.data.__schema.mutationType, 'Schema must have Mutation type');

      const typeNames = res.data.__schema.types.map((t) => t.name);
      ['MongoCompany', 'MongoUser', 'MongoPost', 'MongoComment', 'MongoProduct'].forEach((entity) => {
        assert.ok(typeNames.includes(entity), `Schema must expose entity ${entity}`);
        assert.ok(typeNames.includes(`${entity}Filter`), `Schema must expose filter type ${entity}Filter`);
        assert.ok(typeNames.includes(`Sort${entity}`), `Schema must expose sort enum Sort${entity}`);
        assert.ok(typeNames.includes(`${entity}Input`), `Schema must expose create input ${entity}Input`);
        assert.ok(typeNames.includes(`${entity}Update`), `Schema must expose update input ${entity}Update`);
      });
    });

    it('should expose generated queries and mutations matching AutoGraphQL contract', async () => {
      const fieldsQuery = `
        query IntrospectOperations {
          queryFields: __type(name: "Query") {
            fields { name }
          }
          mutationFields: __type(name: "Mutation") {
            fields { name }
          }
        }
      `;

      const res = await client.query(fieldsQuery);
      assert.ok(!res.errors, `Operations introspection error: ${JSON.stringify(res.errors)}`);

      const qNames = res.data.queryFields.fields.map((f) => f.name);
      const mNames = res.data.mutationFields.fields.map((f) => f.name);

      // Verify Queries
      assert.ok(qNames.includes('mongoUser'), 'Query must have mongoUser (singular)');
      assert.ok(qNames.includes('mongoUsers'), 'Query must have mongoUsers (plural list)');
      assert.ok(qNames.includes('mongoUsersMeta'), 'Query must have mongoUsersMeta (count/meta)');

      // Verify Mutations
      assert.ok(mNames.includes('addMongoUser'), 'Mutation must have addMongoUser');
      assert.ok(mNames.includes('updateMongoUser'), 'Mutation must have updateMongoUser');
      assert.ok(mNames.includes('deleteMongoUser'), 'Mutation must have deleteMongoUser');
      assert.ok(mNames.includes('addToMongoCompanyUsers'), 'Mutation must have connect mutation addToMongoCompanyUsers');
      assert.ok(mNames.includes('removeFromMongoCompanyUsers'), 'Mutation must have disconnect mutation removeFromMongoCompanyUsers');
    });
  });

  // =========================================================================
  // 2. CREATE Operations
  // =========================================================================
  describe('2. CREATE Operations (GraphQL API)', () => {
    it('should create a minimum valid record with only required fields', async () => {
      const mutation = `
        mutation CreateMinUser($input: MongoUserInput!) {
          addMongoUser(input: $input) {
            id
            name
            email
            active
          }
        }
      `;

      const res = await client.mutate(mutation, {
        input: {
          name: 'Ada Lovelace',
          email: 'ada@example.com',
        },
      });

      assert.ok(!res.errors, `Create error: ${JSON.stringify(res.errors)}`);
      assert.ok(res.data.addMongoUser.id, 'Created user must have an auto-generated ID');
      assert.strictEqual(res.data.addMongoUser.name, 'Ada Lovelace');
      assert.strictEqual(res.data.addMongoUser.email, 'ada@example.com');
      assert.strictEqual(res.data.addMongoUser.active, true, 'Default value active=true must be applied');
    });

    it('should create a fully populated record with all fields', async () => {
      const mutation = `
        mutation CreateFullUser($input: MongoUserInput!) {
          addMongoUser(input: $input) {
            id
            name
            email
            age
            salary
            active
            bio
          }
        }
      `;

      const res = await client.mutate(mutation, {
        input: {
          name: 'Grace Hopper',
          email: 'grace@navy.mil',
          age: 85,
          salary: 125000.50,
          active: true,
          bio: 'Pioneer in computer programming and compiler development',
        },
      });

      assert.ok(!res.errors, `Create error: ${JSON.stringify(res.errors)}`);
      const user = res.data.addMongoUser;
      assert.ok(user.id);
      assert.strictEqual(user.name, 'Grace Hopper');
      assert.strictEqual(user.email, 'grace@navy.mil');
      assert.strictEqual(user.age, 85);
      assert.strictEqual(user.salary, 125000.50);
      assert.strictEqual(user.bio, 'Pioneer in computer programming and compiler development');
    });

    it('should create multiple records and assign unique IDs to each', async () => {
      const createMutation = `
        mutation CreateProduct($input: MongoProductInput!) {
          addMongoProduct(input: $input) {
            id
            name
            price
            sku
          }
        }
      `;

      const res1 = await client.mutate(createMutation, {
        input: { name: 'Keyboard', price: 99.99, sku: 'SKU-KEY-1' },
      });
      const res2 = await client.mutate(createMutation, {
        input: { name: 'Mouse', price: 49.99, sku: 'SKU-MOU-2' },
      });

      assert.ok(!res1.errors && !res2.errors);
      assert.notStrictEqual(res1.data.addMongoProduct.id, res2.data.addMongoProduct.id, 'IDs must be unique');
    });

    it('should create a record with relationship via connectId parameter', async () => {
      // 1. Create company
      const compRes = await client.mutate(`
        mutation {
          addMongoCompany(input: { name: "OpenAI", domain: "openai.com" }) {
            id
            name
          }
        }
      `);
      const companyId = compRes.data.addMongoCompany.id;

      // 2. Create user connected to company
      const userRes = await client.mutate(`
        mutation CreateUserWithCompany($input: MongoUserInput!, $companyConnectId: ID) {
          addMongoUser(input: $input, companyConnectId: $companyConnectId) {
            id
            name
            companyId
            company {
              id
              name
            }
          }
        }
      `, {
        input: { name: 'John von Neumann', email: 'john@princeton.edu' },
        companyConnectId: companyId,
      });

      assert.ok(!userRes.errors, `Create with connect error: ${JSON.stringify(userRes.errors)}`);
      assert.strictEqual(userRes.data.addMongoUser.companyId, companyId);
      assert.strictEqual(userRes.data.addMongoUser.company.id, companyId);
      assert.strictEqual(userRes.data.addMongoUser.company.name, 'OpenAI');
    });

    it('should reject creation when a required field is missing', async () => {
      const mutation = `
        mutation {
          addMongoUser(input: { email: "noname@example.com" }) {
            id
          }
        }
      `;

      const res = await client.mutate(mutation);
      assert.ok(res.errors, 'GraphQL must return validation error for missing required field name');
      assert.ok(res.errors.length > 0);
    });

    it('should reject creation when duplicate value is passed for @unique field', async () => {
      const mutation = `
        mutation CreateUser($email: String!) {
          addMongoUser(input: { name: "Test User", email: $email }) {
            id
          }
        }
      `;

      // First create succeeds
      const res1 = await client.mutate(mutation, { email: 'unique@example.com' });
      assert.ok(!res1.errors, 'First creation must succeed');

      // Second create with duplicate email must fail
      const res2 = await client.mutate(mutation, { email: 'unique@example.com' });
      assert.ok(res2.errors, 'GraphQL must return error on duplicate unique email');
    });
  });

  // =========================================================================
  // 3. READ Operations
  // =========================================================================
  describe('3. READ Operations (GraphQL API)', () => {
    let createdUserId;

    beforeEach(async () => {
      const res = await client.mutate(`
        mutation {
          addMongoUser(input: {
            name: "Alan Turing"
            email: "alan@bletchley.uk"
            age: 41
            active: true
          }) {
            id
          }
        }
      `);
      createdUserId = res.data.addMongoUser.id;
    });

    it('should get a single record by ID', async () => {
      const query = `
        query GetUser($id: ID!) {
          mongoUser(id: $id) {
            id
            name
            email
            age
            active
          }
        }
      `;

      const res = await client.query(query, { id: createdUserId });
      assert.ok(!res.errors, `Query error: ${JSON.stringify(res.errors)}`);
      assert.strictEqual(res.data.mongoUser.id, createdUserId);
      assert.strictEqual(res.data.mongoUser.name, 'Alan Turing');
      assert.strictEqual(res.data.mongoUser.email, 'alan@bletchley.uk');
    });

    it('should return null when querying for a non-existent ID', async () => {
      const query = `
        query {
          mongoUser(id: "non-existent-cuid-99999") {
            id
            name
          }
        }
      `;

      const res = await client.query(query);
      assert.ok(!res.errors, 'Query should not throw error for non-existent record');
      assert.strictEqual(res.data.mongoUser, null, 'Query for missing record must return null');
    });

    it('should retrieve list of records', async () => {
      await client.mutate(`
        mutation {
          addMongoUser(input: { name: "Claude Shannon", email: "claude@bell.labs" }) {
            id
          }
        }
      `);

      const query = `
        query {
          mongoUsers {
            id
            name
            email
          }
        }
      `;

      const res = await client.query(query);
      assert.ok(!res.errors, `Query error: ${JSON.stringify(res.errors)}`);
      assert.strictEqual(res.data.mongoUsers.length, 2);
      const names = res.data.mongoUsers.map((u) => u.name);
      assert.ok(names.includes('Alan Turing'));
      assert.ok(names.includes('Claude Shannon'));
    });
  });

  // =========================================================================
  // 4. UPDATE Operations
  // =========================================================================
  describe('4. UPDATE Operations (GraphQL API)', () => {
    let testUserId;

    beforeEach(async () => {
      const res = await client.mutate(`
        mutation {
          addMongoUser(input: {
            name: "Katherine Johnson"
            email: "katherine@nasa.gov"
            age: 101
            salary: 95000.00
            active: true
            bio: "Calculated trajectory for Project Mercury"
          }) {
            id
          }
        }
      `);
      testUserId = res.data.addMongoUser.id;
    });

    it('should update a single field and leave unrelated fields untouched', async () => {
      const updateMutation = `
        mutation UpdateBio($id: ID!, $input: MongoUserUpdate!) {
          updateMongoUser(id: $id, input: $input) {
            id
            name
            email
            age
            bio
          }
        }
      `;

      const updateRes = await client.mutate(updateMutation, {
        id: testUserId,
        input: { bio: 'Awarded Presidential Medal of Freedom' },
      });

      assert.ok(!updateRes.errors, `Update error: ${JSON.stringify(updateRes.errors)}`);
      assert.strictEqual(updateRes.data.updateMongoUser.bio, 'Awarded Presidential Medal of Freedom');

      // Verify via subsequent READ
      const readRes = await client.query(`
        query CheckUser($id: ID!) {
          mongoUser(id: $id) {
            id
            name
            email
            age
            bio
          }
        }
      `, { id: testUserId });

      assert.strictEqual(readRes.data.mongoUser.bio, 'Awarded Presidential Medal of Freedom');
      assert.strictEqual(readRes.data.mongoUser.name, 'Katherine Johnson', 'Name must remain unchanged');
      assert.strictEqual(readRes.data.mongoUser.email, 'katherine@nasa.gov', 'Email must remain unchanged');
      assert.strictEqual(readRes.data.mongoUser.age, 101, 'Age must remain unchanged');
    });

    it('should update multiple fields including numeric and boolean fields', async () => {
      const updateMutation = `
        mutation UpdateMultiple($id: ID!, $input: MongoUserUpdate!) {
          updateMongoUser(id: $id, input: $input) {
            id
            age
            salary
            active
          }
        }
      `;

      const res = await client.mutate(updateMutation, {
        id: testUserId,
        input: {
          age: 102,
          salary: 110000.00,
          active: false,
        },
      });

      assert.ok(!res.errors, `Update multiple error: ${JSON.stringify(res.errors)}`);
      assert.strictEqual(res.data.updateMongoUser.age, 102);
      assert.strictEqual(res.data.updateMongoUser.salary, 110000.00);
      assert.strictEqual(res.data.updateMongoUser.active, false);
    });

    it('should update relationship fields via connect parameter', async () => {
      const compRes = await client.mutate(`
        mutation {
          addMongoCompany(input: { name: "NASA", domain: "nasa.gov" }) {
            id
          }
        }
      `);
      const companyId = compRes.data.addMongoCompany.id;

      const updateRes = await client.mutate(`
        mutation ConnectUserToCompany($id: ID!, $companyConnectId: ID) {
          updateMongoUser(id: $id, companyConnectId: $companyConnectId) {
            id
            companyId
            company {
              id
              name
            }
          }
        }
      `, {
        id: testUserId,
        companyConnectId: companyId,
      });

      assert.ok(!updateRes.errors, `Relation update error: ${JSON.stringify(updateRes.errors)}`);
      assert.strictEqual(updateRes.data.updateMongoUser.companyId, companyId);
      assert.strictEqual(updateRes.data.updateMongoUser.company.id, companyId);
    });
  });

  // =========================================================================
  // 5. DELETE Operations
  // =========================================================================
  describe('5. DELETE Operations (GraphQL API)', () => {
    it('should delete an existing record and confirm subsequent READ returns null', async () => {
      // 1. Create
      const createRes = await client.mutate(`
        mutation {
          addMongoCompany(input: { name: "Sun Microsystems", domain: "sun.com" }) {
            id
          }
        }
      `);
      const companyId = createRes.data.addMongoCompany.id;

      // 2. Delete
      const deleteRes = await client.mutate(`
        mutation DeleteCompany($id: ID!) {
          deleteMongoCompany(id: $id) {
            id
            name
          }
        }
      `, { id: companyId });

      assert.ok(!deleteRes.errors, `Delete error: ${JSON.stringify(deleteRes.errors)}`);
      assert.strictEqual(deleteRes.data.deleteMongoCompany.id, companyId);

      // 3. Subsequent READ
      const readRes = await client.query(`
        query CheckCompany($id: ID!) {
          mongoCompany(id: $id) {
            id
          }
        }
      `, { id: companyId });

      assert.strictEqual(readRes.data.mongoCompany, null, 'Deleted company must return null');
    });

    it('should return null without error when deleting non-existent record', async () => {
      const deleteRes = await client.mutate(`
        mutation {
          deleteMongoCompany(id: "cuid-does-not-exist-00000") {
            id
          }
        }
      `);

      assert.ok(!deleteRes.errors, 'Delete non-existent record should not throw error');
      assert.strictEqual(deleteRes.data.deleteMongoCompany, null);
    });

    it('should delete multiple records via filter', async () => {
      // Create 3 products
      await client.mutate(`mutation { addMongoProduct(input: { name: "Pen", price: 1.5, sku: "P-1", active: false }) { id } }`);
      await client.mutate(`mutation { addMongoProduct(input: { name: "Pencil", price: 0.8, sku: "P-2", active: false }) { id } }`);
      await client.mutate(`mutation { addMongoProduct(input: { name: "Notebook", price: 5.0, sku: "P-3", active: true }) { id } }`);

      // Delete inactive products
      const deleteMultiRes = await client.mutate(`
        mutation DeleteInactiveProducts {
          deleteMongoProducts(filter: { active: false }) {
            id
            name
          }
        }
      `);

      assert.ok(!deleteMultiRes.errors, `Delete multiple error: ${JSON.stringify(deleteMultiRes.errors)}`);
      assert.strictEqual(deleteMultiRes.data.deleteMongoProducts.length, 2);

      // Verify only 1 active product remains
      const remainingRes = await client.query(`
        query {
          mongoProducts {
            id
            name
            active
          }
        }
      `);
      assert.strictEqual(remainingRes.data.mongoProducts.length, 1);
      assert.strictEqual(remainingRes.data.mongoProducts[0].name, 'Notebook');
    });
  });

  // =========================================================================
  // 6. Complete CRUD Lifecycle
  // =========================================================================
  describe('6. Complete CRUD Lifecycle (CREATE -> READ -> UPDATE -> READ -> DELETE -> READ)', () => {
    it('should execute full CRUD lifecycle exclusively through GraphQL API', async () => {
      // Step 1: CREATE
      const createRes = await client.mutate(`
        mutation Step1Create($input: MongoProductInput!) {
          addMongoProduct(input: $input) {
            id
            name
            price
            quantity
            active
            sku
          }
        }
      `, {
        input: {
          name: 'Mechanical Keyboard',
          price: 149.99,
          quantity: 25,
          active: true,
          sku: 'MK-CHERRY-BLUE',
        },
      });

      assert.ok(!createRes.errors, 'Step 1 CREATE failed');
      const productId = createRes.data.addMongoProduct.id;
      assert.ok(productId, 'Step 1 must return valid ID');

      // Step 2: READ
      const readRes1 = await client.query(`
        query Step2Read($id: ID!) {
          mongoProduct(id: $id) {
            id
            name
            price
            quantity
            active
            sku
          }
        }
      `, { id: productId });

      assert.ok(!readRes1.errors, 'Step 2 READ failed');
      assert.strictEqual(readRes1.data.mongoProduct.name, 'Mechanical Keyboard');
      assert.strictEqual(readRes1.data.mongoProduct.quantity, 25);

      // Step 3: UPDATE
      const updateRes = await client.mutate(`
        mutation Step3Update($id: ID!, $input: MongoProductUpdate!) {
          updateMongoProduct(id: $id, input: $input) {
            id
            name
            price
            quantity
          }
        }
      `, {
        id: productId,
        input: {
          name: 'Mechanical Keyboard Pro',
          price: 179.99,
          quantity: 20,
        },
      });

      assert.ok(!updateRes.errors, 'Step 3 UPDATE failed');
      assert.strictEqual(updateRes.data.updateMongoProduct.name, 'Mechanical Keyboard Pro');

      // Step 4: READ after update
      const readRes2 = await client.query(`
        query Step4Read($id: ID!) {
          mongoProduct(id: $id) {
            id
            name
            price
            quantity
            sku
          }
        }
      `, { id: productId });

      assert.strictEqual(readRes2.data.mongoProduct.name, 'Mechanical Keyboard Pro');
      assert.strictEqual(readRes2.data.mongoProduct.price, 179.99);
      assert.strictEqual(readRes2.data.mongoProduct.quantity, 20);
      assert.strictEqual(readRes2.data.mongoProduct.sku, 'MK-CHERRY-BLUE', 'Unmodified field must persist');

      // Step 5: DELETE
      const deleteRes = await client.mutate(`
        mutation Step5Delete($id: ID!) {
          deleteMongoProduct(id: $id) {
            id
          }
        }
      `, { id: productId });

      assert.ok(!deleteRes.errors, 'Step 5 DELETE failed');
      assert.strictEqual(deleteRes.data.deleteMongoProduct.id, productId);

      // Step 6: Final READ
      const readRes3 = await client.query(`
        query Step6Read($id: ID!) {
          mongoProduct(id: $id) {
            id
          }
        }
      `, { id: productId });

      assert.ok(!readRes3.errors, 'Step 6 READ must not error');
      assert.strictEqual(readRes3.data.mongoProduct, null, 'Record must be null after deletion');
    });
  });

  // =========================================================================
  // 7. Relationships & Deep Nested Graph Queries
  // =========================================================================
  describe('7. Relationships & Deep Nested Graph Queries', () => {
    let companyId;
    let userId;
    let postId;
    let commentId;

    beforeEach(async () => {
      // 1. Create Company
      const compRes = await client.mutate(`
        mutation {
          addMongoCompany(input: { name: "DeepMind", domain: "deepmind.google" }) {
            id
          }
        }
      `);
      companyId = compRes.data.addMongoCompany.id;

      // 2. Create User connected to Company
      const userRes = await client.mutate(`
        mutation CreateUser($companyId: ID!) {
          addMongoUser(input: { name: "Demis Hassabis", email: "demis@deepmind.com" }, companyConnectId: $companyId) {
            id
          }
        }
      `, { companyId });
      userId = userRes.data.addMongoUser.id;

      // 3. Create Post connected to User and Company
      const postRes = await client.mutate(`
        mutation CreatePost($userId: ID!, $companyId: ID!) {
          addMongoPost(
            input: {
              title: "AlphaFold 3 Architecture"
              slug: "alphafold-3"
              content: "Structure prediction of biomolecular systems"
              published: true
            }
            authorConnectId: $userId
            companyConnectId: $companyId
          ) {
            id
          }
        }
      `, { userId, companyId });
      postId = postRes.data.addMongoPost.id;

      // 4. Create Comment connected to Post and User
      const commentRes = await client.mutate(`
        mutation CreateComment($postId: ID!, $userId: ID!) {
          addMongoComment(
            input: { content: "Revolutionary computational biology breakthrough!", upvotes: 42 }
            postConnectId: $postId
            authorConnectId: $userId
          ) {
            id
          }
        }
      `, { postId, userId });
      commentId = commentRes.data.addMongoComment.id;
    });

    it('should query 1-to-many relationship: Company -> Users', async () => {
      const query = `
        query {
          mongoCompany(id: "${companyId}") {
            id
            name
            users {
              id
              name
              email
            }
          }
        }
      `;

      const res = await client.query(query);
      assert.ok(!res.errors, `Query error: ${JSON.stringify(res.errors)}`);
      assert.strictEqual(res.data.mongoCompany.users.length, 1);
      assert.strictEqual(res.data.mongoCompany.users[0].name, 'Demis Hassabis');
    });

    it('should query 1-to-many relationship: User -> Posts', async () => {
      const query = `
        query {
          mongoUser(id: "${userId}") {
            id
            name
            posts {
              id
              title
              slug
            }
          }
        }
      `;

      const res = await client.query(query);
      assert.ok(!res.errors, `Query error: ${JSON.stringify(res.errors)}`);
      assert.strictEqual(res.data.mongoUser.posts.length, 1);
      assert.strictEqual(res.data.mongoUser.posts[0].title, 'AlphaFold 3 Architecture');
    });

    it('should query deep 4-level nesting: Company -> Users -> Posts -> Comments -> Author', async () => {
      const deepQuery = `
        query DeepRelationTree {
          mongoCompany(id: "${companyId}") {
            id
            name
            users {
              id
              name
              posts {
                id
                title
                comments {
                  id
                  content
                  upvotes
                  author {
                    id
                    name
                    email
                  }
                }
              }
            }
          }
        }
      `;

      const res = await client.query(deepQuery);
      assert.ok(!res.errors, `Deep query error: ${JSON.stringify(res.errors)}`);

      const company = res.data.mongoCompany;
      assert.strictEqual(company.name, 'DeepMind');
      assert.strictEqual(company.users[0].name, 'Demis Hassabis');
      assert.strictEqual(company.users[0].posts[0].title, 'AlphaFold 3 Architecture');
      assert.strictEqual(company.users[0].posts[0].comments[0].content, 'Revolutionary computational biology breakthrough!');
      assert.strictEqual(company.users[0].posts[0].comments[0].author.name, 'Demis Hassabis');
    });

    it('should connect and disconnect relations using generated relation mutations', async () => {
      // Create second company
      const comp2 = await client.mutate(`
        mutation {
          addMongoCompany(input: { name: "Google Research", domain: "research.google" }) {
            id
          }
        }
      `);
      const newCompanyId = comp2.data.addMongoCompany.id;

      // Connect user to second company
      const connectRes = await client.mutate(`
        mutation ConnectUser($companyId: ID!, $userId: ID!) {
          addToMongoCompanyUsers(mongoCompanyId: $companyId, mongoUserId: $userId) {
            typeName
            fieldName
            connectedTypeName
            connectedFieldName
          }
        }
      `, { companyId: newCompanyId, userId });

      assert.ok(!connectRes.errors, `Connect error: ${JSON.stringify(connectRes.errors)}`);

      // Verify user's company is now Google Research
      const checkRes = await client.query(`
        query {
          mongoUser(id: "${userId}") {
            company {
              id
              name
            }
          }
        }
      `);
      assert.strictEqual(checkRes.data.mongoUser.company.id, newCompanyId);
      assert.strictEqual(checkRes.data.mongoUser.company.name, 'Google Research');

      // Disconnect user from company
      const disconnectRes = await client.mutate(`
        mutation DisconnectUser($companyId: ID!, $userId: ID!) {
          removeFromMongoCompanyUsers(mongoCompanyId: $companyId, mongoUserId: $userId) {
            typeName
            fieldName
          }
        }
      `, { companyId: newCompanyId, userId });

      assert.ok(!disconnectRes.errors, `Disconnect error: ${JSON.stringify(disconnectRes.errors)}`);

      // Verify company is now null
      const checkRes2 = await client.query(`
        query {
          mongoUser(id: "${userId}") {
            company {
              id
            }
          }
        }
      `);
      assert.strictEqual(checkRes2.data.mongoUser.company, null);
    });
  });

  // =========================================================================
  // 8. Filtering
  // =========================================================================
  describe('8. Filtering Capabilities (GraphQL API)', () => {
    beforeEach(async () => {
      await client.mutate(`mutation { addMongoUser(input: { name: "Alice Smith", email: "alice@test.com", age: 25, salary: 50000.0, active: true }) { id } }`);
      await client.mutate(`mutation { addMongoUser(input: { name: "Bob Jones", email: "bob@test.com", age: 35, salary: 75000.0, active: false }) { id } }`);
      await client.mutate(`mutation { addMongoUser(input: { name: "Charlie Brown", email: "charlie@test.com", age: 45, salary: 100000.0, active: true }) { id } }`);
      await client.mutate(`mutation { addMongoUser(input: { name: "Diana Prince", email: "diana@test.com", age: 30, salary: 85000.0, active: true }) { id } }`);
    });

    it('should filter by exact equality (active: true)', async () => {
      const res = await client.query(`
        query {
          mongoUsers(filter: { active: true }) {
            id
            name
          }
        }
      `);
      assert.ok(!res.errors);
      assert.strictEqual(res.data.mongoUsers.length, 3);
    });

    it('should filter by numeric comparison (_gt, _lt, _gte, _lte)', async () => {
      const gtRes = await client.query(`
        query {
          mongoUsers(filter: { age_gt: 30 }) {
            name
            age
          }
        }
      `);
      assert.ok(!gtRes.errors);
      assert.strictEqual(gtRes.data.mongoUsers.length, 2); // Bob (35), Charlie (45)

      const lteRes = await client.query(`
        query {
          mongoUsers(filter: { salary_lte: 75000.0 }) {
            name
            salary
          }
        }
      `);
      assert.ok(!lteRes.errors);
      assert.strictEqual(lteRes.data.mongoUsers.length, 2); // Alice (50k), Bob (75k)
    });

    it('should filter by string matching (_contains and _startsWith)', async () => {
      const containsRes = await client.query(`
        query {
          mongoUsers(filter: { name_contains: "Brown" }) {
            name
          }
        }
      `);
      assert.ok(!containsRes.errors);
      assert.strictEqual(containsRes.data.mongoUsers.length, 1);
      assert.strictEqual(containsRes.data.mongoUsers[0].name, 'Charlie Brown');

      const startsWithRes = await client.query(`
        query {
          mongoUsers(filter: { name_startsWith: "Dia" }) {
            name
          }
        }
      `);
      assert.ok(!startsWithRes.errors);
      assert.strictEqual(startsWithRes.data.mongoUsers.length, 1);
      assert.strictEqual(startsWithRes.data.mongoUsers[0].name, 'Diana Prince');
    });

    it('should filter with logical operators: AND and OR', async () => {
      const andRes = await client.query(`
        query {
          mongoUsers(filter: {
            AND: [
              { active: true },
              { age_lt: 35 }
            ]
          }) {
            name
          }
        }
      `);
      assert.ok(!andRes.errors);
      assert.strictEqual(andRes.data.mongoUsers.length, 2); // Alice (25), Diana (30)

      const orRes = await client.query(`
        query {
          mongoUsers(filter: {
            OR: [
              { age_lt: 26 },
              { age_gt: 40 }
            ]
          }) {
            name
          }
        }
      `);
      assert.ok(!orRes.errors);
      assert.strictEqual(orRes.data.mongoUsers.length, 2); // Alice (25), Charlie (45)
    });

    it('should filter by field existence (_exists: true/false)', async () => {
      // Add user with bio
      await client.mutate(`
        mutation {
          addMongoUser(input: { name: "Edward Norton", email: "edward@test.com", bio: "Actor" }) { id }
        }
      `);

      const existsRes = await client.query(`
        query {
          mongoUsers(filter: { active_exists: true }) {
            name
          }
        }
      `);
      assert.ok(!existsRes.errors);
      assert.strictEqual(existsRes.data.mongoUsers.length, 5);
    });
  });

  // =========================================================================
  // 9. Sorting
  // =========================================================================
  describe('9. Sorting Capabilities (GraphQL API)', () => {
    beforeEach(async () => {
      await client.mutate(`mutation { addMongoProduct(input: { name: "Monitor 24in", price: 199.0, quantity: 15, sku: "M-24" }) { id } }`);
      await client.mutate(`mutation { addMongoProduct(input: { name: "Monitor 27in", price: 299.0, quantity: 5, sku: "M-27" }) { id } }`);
      await client.mutate(`mutation { addMongoProduct(input: { name: "Monitor 32in", price: 499.0, quantity: 20, sku: "M-32" }) { id } }`);
    });

    it('should sort ascending and descending by numeric field (price_ASC / price_DESC)', async () => {
      const ascRes = await client.query(`
        query {
          mongoProducts(orderBy: price_ASC) {
            name
            price
          }
        }
      `);
      assert.ok(!ascRes.errors);
      assert.strictEqual(ascRes.data.mongoProducts[0].price, 199.0);
      assert.strictEqual(ascRes.data.mongoProducts[2].price, 499.0);

      const descRes = await client.query(`
        query {
          mongoProducts(orderBy: price_DESC) {
            name
            price
          }
        }
      `);
      assert.ok(!descRes.errors);
      assert.strictEqual(descRes.data.mongoProducts[0].price, 499.0);
      assert.strictEqual(descRes.data.mongoProducts[2].price, 199.0);
    });

    it('should sort alphabetically by string field (name_ASC / name_DESC)', async () => {
      const ascRes = await client.query(`
        query {
          mongoProducts(orderBy: name_ASC) {
            name
          }
        }
      `);
      assert.ok(!ascRes.errors);
      assert.strictEqual(ascRes.data.mongoProducts[0].name, 'Monitor 24in');
      assert.strictEqual(ascRes.data.mongoProducts[2].name, 'Monitor 32in');
    });

    it('should combine filtering and sorting in a single query', async () => {
      const res = await client.query(`
        query {
          mongoProducts(filter: { price_gt: 200.0 }, orderBy: price_DESC) {
            name
            price
          }
        }
      `);
      assert.ok(!res.errors);
      assert.strictEqual(res.data.mongoProducts.length, 2);
      assert.strictEqual(res.data.mongoProducts[0].price, 499.0);
      assert.strictEqual(res.data.mongoProducts[1].price, 299.0);
    });
  });

  // =========================================================================
  // 10. Pagination
  // =========================================================================
  describe('10. Pagination Capabilities (GraphQL API)', () => {
    beforeEach(async () => {
      // Create 5 items
      for (let i = 1; i <= 5; i += 1) {
        await client.mutate(`
          mutation CreateItem($input: MongoProductInput!) {
            addMongoProduct(input: $input) { id }
          }
        `, {
          input: {
            name: `Item ${i}`,
            price: i * 10.0,
            sku: `SKU-ITEM-${i}`,
          },
        });
      }
    });

    it('should paginate using first and skip without duplicates or omissions', async () => {
      // Page 1: 2 items
      const page1Res = await client.query(`
        query {
          mongoProducts(orderBy: price_ASC, first: 2, skip: 0) {
            id
            name
            price
          }
        }
      `);
      assert.ok(!page1Res.errors);
      assert.strictEqual(page1Res.data.mongoProducts.length, 2);
      assert.strictEqual(page1Res.data.mongoProducts[0].name, 'Item 1');
      assert.strictEqual(page1Res.data.mongoProducts[1].name, 'Item 2');

      // Page 2: 2 items
      const page2Res = await client.query(`
        query {
          mongoProducts(orderBy: price_ASC, first: 2, skip: 2) {
            id
            name
            price
          }
        }
      `);
      assert.ok(!page2Res.errors);
      assert.strictEqual(page2Res.data.mongoProducts.length, 2);
      assert.strictEqual(page2Res.data.mongoProducts[0].name, 'Item 3');
      assert.strictEqual(page2Res.data.mongoProducts[1].name, 'Item 4');

      // Page 3: 1 item (last page)
      const page3Res = await client.query(`
        query {
          mongoProducts(orderBy: price_ASC, first: 2, skip: 4) {
            id
            name
            price
          }
        }
      `);
      assert.ok(!page3Res.errors);
      assert.strictEqual(page3Res.data.mongoProducts.length, 1);
      assert.strictEqual(page3Res.data.mongoProducts[0].name, 'Item 5');

      // Verify zero duplicate IDs between page 1 and page 2
      const page1Ids = page1Res.data.mongoProducts.map((p) => p.id);
      const page2Ids = page2Res.data.mongoProducts.map((p) => p.id);
      page1Ids.forEach((id) => assert.ok(!page2Ids.includes(id), 'No overlapping IDs across pages'));
    });

    it('should return an empty array when skip exceeds total count', async () => {
      const res = await client.query(`
        query {
          mongoProducts(first: 10, skip: 100) {
            id
          }
        }
      `);
      assert.ok(!res.errors);
      assert.strictEqual(res.data.mongoProducts.length, 0);
    });

    it('should support page size of 1', async () => {
      const res = await client.query(`
        query {
          mongoProducts(orderBy: price_ASC, first: 1, skip: 1) {
            name
            price
          }
        }
      `);
      assert.ok(!res.errors);
      assert.strictEqual(res.data.mongoProducts.length, 1);
      assert.strictEqual(res.data.mongoProducts[0].name, 'Item 2');
    });

    it('should combine filtering, sorting, and pagination simultaneously', async () => {
      const res = await client.query(`
        query {
          mongoProducts(filter: { price_gte: 20.0 }, orderBy: price_DESC, first: 2, skip: 1) {
            name
            price
          }
        }
      `);
      assert.ok(!res.errors);
      // Matching items with price >= 20 in DESC: Item 5 (50), Item 4 (40), Item 3 (30), Item 2 (20)
      // Skip 1, first 2 -> Item 4 (40), Item 3 (30)
      assert.strictEqual(res.data.mongoProducts.length, 2);
      assert.strictEqual(res.data.mongoProducts[0].name, 'Item 4');
      assert.strictEqual(res.data.mongoProducts[1].name, 'Item 3');
    });
  });

  // =========================================================================
  // 11. DataLoaders & N+1 Prevention
  // =========================================================================
  describe('11. DataLoaders & N+1 Query Batching', () => {
    it('should batch relational lookups via request-scoped DataLoader into a single $in query', async () => {
      // 1. Create company
      const cRes = await client.mutate(`
        mutation {
          addMongoCompany(input: { name: "Anthropic", domain: "anthropic.com" }) { id }
        }
      `);
      const companyId = cRes.data.addMongoCompany.id;

      // 2. Create 4 users connected to the same company
      for (let i = 1; i <= 4; i += 1) {
        await client.mutate(`
          mutation CreateUser($companyId: ID!) {
            addMongoUser(
              input: { name: "Researcher ${i}", email: "researcher${i}@anthropic.com" }
              companyConnectId: $companyId
            ) { id }
          }
        `, { companyId });
      }

      // Track Mongoose queries on MongoCompany to verify DataLoader batching
      let companyFindCount = 0;
      const originalFindOne = models.MongoCompany.findOne.bind(models.MongoCompany);
      const originalFind = models.MongoCompany.find.bind(models.MongoCompany);

      models.MongoCompany.find = function (...args) {
        companyFindCount += 1;
        return originalFind(...args);
      };

      try {
        // Query users and their parent company in a single request
        const res = await client.query(`
          query {
            mongoUsers(first: 4) {
              id
              name
              company {
                id
                name
              }
            }
          }
        `);

        assert.ok(!res.errors, `DataLoader query error: ${JSON.stringify(res.errors)}`);
        assert.strictEqual(res.data.mongoUsers.length, 4);

        // Every user must resolve to Anthropic
        res.data.mongoUsers.forEach((u) => {
          assert.ok(u.company);
          assert.strictEqual(u.company.name, 'Anthropic');
        });

        // With DataLoader batching, company lookups should be memoized / batched
        // rather than doing 4 separate database roundtrips
        assert.ok(companyFindCount <= 1, `DataLoader must batch/memoize queries (got ${companyFindCount} queries)`);
      } finally {
        models.MongoCompany.findOne = originalFindOne;
        models.MongoCompany.find = originalFind;
      }
    });
  });

  // =========================================================================
  // 12. Validation & API Error Handling
  // =========================================================================
  describe('12. Validation & API Error Handling', () => {
    it('should return GraphQL error when non-null field is omitted and not create invalid document', async () => {
      const res = await client.mutate(`
        mutation {
          addMongoProduct(input: { price: 10.0 }) {
            id
          }
        }
      `);

      assert.ok(res.errors, 'Missing required field "name" must return GraphQL error');
      assert.ok(res.errors[0].message.includes('name'));

      // Verify no corrupted product created
      const countRes = await client.query(`query { mongoProductsMeta { count } }`);
      assert.strictEqual(countRes.data.mongoProductsMeta.count, 0);
    });

    it('should reject invalid scalar type (e.g. string for Float)', async () => {
      const res = await client.mutate(`
        mutation {
          addMongoProduct(input: { name: "Bad Product", price: "NOT_A_NUMBER", sku: "SKU-BAD" }) {
            id
          }
        }
      `);

      assert.ok(res.errors, 'String for Float field must produce a GraphQL syntax/validation error');
    });

    it('should keep API completely usable after receiving an error', async () => {
      // 1. Send invalid mutation
      await client.mutate(`
        mutation {
          addMongoProduct(input: { price: 99.0 }) { id }
        }
      `);

      // 2. Send valid mutation immediately after
      const validRes = await client.mutate(`
        mutation {
          addMongoProduct(input: { name: "Valid Recovery Product", price: 19.99, sku: "SKU-RECOVER" }) {
            id
            name
          }
        }
      `);

      assert.ok(!validRes.errors, 'Backend must recover gracefully and process subsequent valid requests');
      assert.strictEqual(validRes.data.addMongoProduct.name, 'Valid Recovery Product');
    });
  });

  // =========================================================================
  // 13. Persistence & Server Restart/Reconnect
  // =========================================================================
  describe('13. Persistence & Server Restart/Reconnect', () => {
    it('should persist data in MongoDB across server restart / reconnection', async () => {
      // 1. CREATE records through GraphQL API
      const compRes = await client.mutate(`
        mutation {
          addMongoCompany(input: { name: "Persistent Inc", domain: "persistent.io" }) {
            id
            name
          }
        }
      `);
      assert.ok(!compRes.errors);
      const companyId = compRes.data.addMongoCompany.id;

      const userRes = await client.mutate(`
        mutation CreatePersistUser($companyId: ID!) {
          addMongoUser(
            input: { name: "Persistent Developer", email: "persist@persistent.io" }
            companyConnectId: $companyId
          ) {
            id
            name
          }
        }
      `, { companyId });
      assert.ok(!userRes.errors);
      const userId = userRes.data.addMongoUser.id;

      // 2. SIMULATE RESTART: Close connection and restart backend with fresh connection
      const restartedEnv = await startMongoTestEnvironment(mongoGraphQLSDL, true);
      const restartedClient = createGraphQLClient(restartedEnv.schema, restartedEnv.models);

      // 4. READ records through GraphQL API on the new instance
      const readCompRes = await restartedClient.query(`
        query {
          mongoCompany(id: "${companyId}") {
            id
            name
            users {
              id
              name
              email
            }
          }
        }
      `);

      assert.ok(!readCompRes.errors, `Post-restart query error: ${JSON.stringify(readCompRes.errors)}`);
      assert.ok(readCompRes.data.mongoCompany, 'Company must be available after restart');
      assert.strictEqual(readCompRes.data.mongoCompany.name, 'Persistent Inc');
      assert.strictEqual(readCompRes.data.mongoCompany.users.length, 1);
      assert.strictEqual(readCompRes.data.mongoCompany.users[0].name, 'Persistent Developer');

      // Re-assign active client & models for subsequent tests
      models = restartedEnv.models;
      schema = restartedEnv.schema;
      client = restartedClient;
    });
  });

  // =========================================================================
  // 14. Concurrent API Clients
  // =========================================================================
  describe('14. Concurrent API Clients Simulation', () => {
    it('should handle simultaneous concurrent GraphQL requests without race conditions or corruption', async () => {
      const clientCount = 10;
      const promises = [];

      for (let i = 0; i < clientCount; i += 1) {
        const clientIndex = i;
        // Each simulated client executes a GraphQL mutation concurrently
        promises.push(
          client.mutate(`
            mutation ConcurrentCreate($input: MongoProductInput!) {
              addMongoProduct(input: $input) {
                id
                name
                sku
              }
            }
          `, {
            input: {
              name: `Concurrent Product ${clientIndex}`,
              price: 10.0 + clientIndex,
              sku: `SKU-CONC-${clientIndex}`,
            },
          }),
        );
      }

      const results = await Promise.all(promises);

      // All concurrent requests must succeed
      results.forEach((res, idx) => {
        assert.ok(!res.errors, `Client ${idx} failed: ${JSON.stringify(res.errors)}`);
        assert.ok(res.data.addMongoProduct.id, `Client ${idx} must return ID`);
      });

      // Verify exact count in database via GraphQL meta query
      const metaRes = await client.query(`query { mongoProductsMeta { count } }`);
      assert.strictEqual(metaRes.data.mongoProductsMeta.count, clientCount);

      // Verify all IDs are distinct
      const ids = results.map((r) => r.data.addMongoProduct.id);
      const uniqueIds = new Set(ids);
      assert.strictEqual(uniqueIds.size, clientCount, 'All concurrent creates must receive unique IDs');
    });
  });

  // =========================================================================
  // 15. Schema Evolution
  // =========================================================================
  describe('15. Schema Evolution (SDL v1 -> evolve SDL -> verify through GraphQL API)', () => {
    it('should evolve schema to add new fields while maintaining existing data and full CRUD', async () => {
      // Step 1: Create record under SDL v1
      const v1Res = await client.mutate(`
        mutation {
          addMongoUser(input: { name: "Linus Torvalds", email: "linus@kernel.org" }) {
            id
            name
            email
          }
        }
      `);
      assert.ok(!v1Res.errors);
      const userId = v1Res.data.addMongoUser.id;

      // Step 2: Evolve SDL: add 'tagline: String' to MongoUser and 'headquarters: String' to MongoCompany
      const evolvedEnv = await startMongoTestEnvironment(mongoGraphQLSDLEvolved);
      const evolvedClient = createGraphQLClient(evolvedEnv.schema, evolvedEnv.models);

      // Step 3: Verify existing record is still accessible under new schema
      const readExistingRes = await evolvedClient.query(`
        query {
          mongoUser(id: "${userId}") {
            id
            name
            email
            tagline
          }
        }
      `);
      assert.ok(!readExistingRes.errors);
      assert.strictEqual(readExistingRes.data.mongoUser.name, 'Linus Torvalds');
      assert.strictEqual(readExistingRes.data.mongoUser.tagline, null, 'Unpopulated evolved field should be null');

      // Step 4: UPDATE existing record using the newly added field
      const updateRes = await evolvedClient.mutate(`
        mutation UpdateEvolvedField($id: ID!, $input: MongoUserUpdate!) {
          updateMongoUser(id: $id, input: $input) {
            id
            name
            tagline
          }
        }
      `, {
        id: userId,
        input: { tagline: 'Talk is cheap. Show me the code.' },
      });

      assert.ok(!updateRes.errors, `Evolved update error: ${JSON.stringify(updateRes.errors)}`);
      assert.strictEqual(updateRes.data.updateMongoUser.tagline, 'Talk is cheap. Show me the code.');

      // Step 5: CREATE new record directly using the evolved field
      const createNewRes = await evolvedClient.mutate(`
        mutation CreateWithEvolvedField($input: MongoUserInput!) {
          addMongoUser(input: $input) {
            id
            name
            email
            tagline
          }
        }
      `, {
        input: {
          name: 'Ken Thompson',
          email: 'ken@bell.labs',
          tagline: 'Unix & Go co-creator',
        },
      });

      assert.ok(!createNewRes.errors);
      assert.strictEqual(createNewRes.data.addMongoUser.tagline, 'Unix & Go co-creator');

      // Re-assign active client and models for teardown
      models = evolvedEnv.models;
      schema = evolvedEnv.schema;
      client = evolvedClient;
    });
  });
});
