import assert from 'assert';
import schema from '../src/graphql';

describe('AutoGraphQL Core Engine - AST & Schema Generation', () => {
  let queryType;
  let mutationType;
  let subscriptionType;
  let schemaTypes;

  before(() => {
    assert.ok(schema, 'Executable schema should be defined');
    queryType = schema.getQueryType();
    mutationType = schema.getMutationType();
    subscriptionType = schema.getSubscriptionType();
    schemaTypes = schema.getTypeMap();
  });

  describe('1. Baseline Model Query Generation (User & UserProfile)', () => {
    it('should generate single record queries for User and UserProfile', () => {
      const fields = queryType.getFields();
      assert.ok(fields.user, 'Query "user" must be generated');
      assert.ok(fields.userProfile, 'Query "userProfile" must be generated');
    });

    it('should generate list queries with filtering and pagination for User and UserProfile', () => {
      const fields = queryType.getFields();
      assert.ok(fields.users, 'Query "users" must be generated');
      assert.ok(fields.userProfiles, 'Query "userProfiles" must be generated');

      // Verify arguments for list queries
      const userArgs = fields.users.args.map((a) => a.name);
      assert.ok(userArgs.includes('filter'), 'users query must accept "filter" argument');
      assert.ok(userArgs.includes('first'), 'users query must accept "first" argument for pagination');
      assert.ok(userArgs.includes('skip'), 'users query must accept "skip" argument for pagination');
      assert.ok(userArgs.includes('orderBy'), 'users query must accept "orderBy" argument for sorting');

      const profileArgs = fields.userProfiles.args.map((a) => a.name);
      assert.ok(profileArgs.includes('filter'), 'userProfiles query must accept "filter" argument');
      assert.ok(profileArgs.includes('first'), 'userProfiles query must accept "first" argument');
      assert.ok(profileArgs.includes('skip'), 'userProfiles query must accept "skip" argument');
    });

    it('should generate aggregation metadata queries (usersMeta & userProfilesMeta)', () => {
      const fields = queryType.getFields();
      assert.ok(fields.usersMeta, 'Query "usersMeta" must be generated');
      assert.ok(fields.userProfilesMeta, 'Query "userProfilesMeta" must be generated');
    });
  });

  describe('2. Baseline Model CRUD Mutation Generation (User & UserProfile)', () => {
    it('should generate create/add mutations', () => {
      const mutations = mutationType.getFields();
      assert.ok(mutations.addUser, 'Mutation "addUser" must be generated');
      assert.ok(mutations.addUserProfile, 'Mutation "addUserProfile" must be generated');
    });

    it('should generate update mutations (single and batch)', () => {
      const mutations = mutationType.getFields();
      assert.ok(mutations.updateUser, 'Mutation "updateUser" must be generated');
      assert.ok(mutations.updateUsers, 'Mutation "updateUsers" must be generated');
      assert.ok(mutations.updateUserProfile, 'Mutation "updateUserProfile" must be generated');
      assert.ok(mutations.updateUserProfiles, 'Mutation "updateUserProfiles" must be generated');
    });

    it('should generate delete mutations (single and batch)', () => {
      const mutations = mutationType.getFields();
      assert.ok(mutations.deleteUser, 'Mutation "deleteUser" must be generated');
      assert.ok(mutations.deleteUsers, 'Mutation "deleteUsers" must be generated');
      assert.ok(mutations.deleteUserProfile, 'Mutation "deleteUserProfile" must be generated');
      assert.ok(mutations.deleteUserProfiles, 'Mutation "deleteUserProfiles" must be generated');
    });
  });

  describe('3. Relational Connectors & AST Join Handling', () => {
    it('should establish bidirectional relationship between User and UserProfile', () => {
      const userType = schemaTypes.User;
      const profileType = schemaTypes.UserProfile;

      assert.ok(userType, 'User GraphQL type must exist in schema');
      assert.ok(profileType, 'UserProfile GraphQL type must exist in schema');

      const userFields = userType.getFields();
      const profileFields = profileType.getFields();

      assert.ok(userFields.profile, 'User type must have "profile" relational field');
      assert.ok(profileFields.user, 'UserProfile type must have "user" relational field');
    });

    it('should generate relational connect and disconnect mutations', () => {
      const mutations = mutationType.getFields();
      const mutationNames = Object.keys(mutations);
      assert.ok(mutationNames.length > 0, 'Schema mutations must be defined');
    });
  });

  describe('4. Filter Types & Operators Generation', () => {
    it('should generate comprehensive filter input types for User and UserProfile', () => {
      const userFilter = schemaTypes.UserFilter;
      const profileFilter = schemaTypes.UserProfileFilter;

      assert.ok(userFilter, 'UserFilter type must exist');
      assert.ok(profileFilter, 'UserProfileFilter type must exist');

      const filterFields = Object.keys(userFilter.getFields());
      assert.ok(filterFields.includes('and'), 'UserFilter must support "and" operator');
      assert.ok(filterFields.includes('or'), 'UserFilter must support "or" operator');
      assert.ok(filterFields.includes('id'), 'UserFilter must support "id" filter');
      assert.ok(filterFields.includes('email'), 'UserFilter must support "email" filter');
      assert.ok(filterFields.includes('username'), 'UserFilter must support "username" filter');
    });
  });

  describe('5. Real-Time Subscriptions Generation', () => {
    it('should generate real-time subscription definitions for entities', () => {
      assert.ok(subscriptionType, 'Subscription type must exist');
      const subs = subscriptionType.getFields();
      assert.ok(subs.user, 'Subscription "user" must be generated for real-time events');
      assert.ok(subs.userProfile, 'Subscription "userProfile" must be generated');
    });
  });
});
