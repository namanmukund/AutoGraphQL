/**
 * AutoGraphQL — Test Schema Definition from GraphQL SDL
 *
 * This file defines the PostgreSQL entities directly as client-facing GraphQL SDL.
 * The AST parser extracts model definitions, constraints, defaults, types, and
 * relations (@relation directives) from the GraphQL SDL string, matching how
 * any client or developer defines schemas in AutoGraphQL.
 */
import { parse, GraphQLScalarType, Kind } from 'graphql';
import { makeExecutableSchema } from 'graphql-tools';
import {
  createSequelizeModelFromAST,
  wireSequelizeAssociations,
  buildSequelizeWhereClause,
} from '../../src/autoGenerate/models/sqlModelGenerator';
import { getSortOrderForSequelize } from '../../src/autoGenerate/graphql/controllers/QueryController/sorts';

/**
 * Client-facing GraphQL SDL definition
 */
export const pgGraphQLSDL = `
  scalar Date
  scalar JSONB

  # 1. Company entity
  type PgCompany @model(database: "postgres") {
    id: ID
    name: String!
    domain: String @unique
    industry: String
    employeeCount: Int
    isPublic: Boolean @defaultValue(value: "false")
    foundedAt: Date
    metadata: JSONB
    createdAt: Date
    updatedAt: Date
    users: [PgUser] @relation(name: "CompanyUsers")
    posts: [PgPost] @relation(name: "CompanyPosts")
  }

  # 2. User entity with unique constraint, defaults, and relationships
  type PgUser @model(database: "postgres") {
    id: ID
    name: String!
    email: String! @unique
    age: Int
    salary: Float
    active: Boolean @defaultValue(value: "true")
    bio: String
    companyId: String
    createdAt: Date
    updatedAt: Date
    company: PgCompany @relation(name: "CompanyUsers")
    posts: [PgPost] @relation(name: "UserPosts")
    comments: [PgComment] @relation(name: "UserComments")
    lastLoginAt: Date
    preferences: JSONB
  }

  # 3. Post entity belonging to User and Company, having Comments
  type PgPost @model(database: "postgres") {
    id: ID
    title: String!
    content: String
    published: Boolean @defaultValue(value: "false")
    viewCount: Int @defaultValue(value: "0")
    rating: Float
    authorId: String!
    companyId: String
    createdAt: Date
    updatedAt: Date
    author: PgUser @relation(name: "UserPosts")
    company: PgCompany @relation(name: "CompanyPosts")
    comments: [PgComment] @relation(name: "PostComments")
    publishedAt: Date
  }

  # 4. Comment entity referencing Post and Author
  type PgComment @model(database: "postgres") {
    id: ID
    content: String!
    postId: String!
    authorId: String!
    createdAt: Date
    updatedAt: Date
    post: PgPost @relation(name: "PostComments")
    author: PgUser @relation(name: "UserComments")
    upvotes: Int @defaultValue(value: "0")
  }

  # 5. Product entity with inventory attributes and unique SKU
  type PgProduct @model(database: "postgres") {
    id: ID
    name: String!
    price: Float!
    quantity: Int @defaultValue(value: "0")
    active: Boolean @defaultValue(value: "true")
    sku: String @unique
    createdAt: Date
    updatedAt: Date
    tags: JSONB
    specs: JSONB
  }
`;

/**
 * Parses client GraphQL SDL into AutoGraphQL AST field definitions and relation lists
 *
 * @param {string} sdlString Raw GraphQL SDL definition
 * @returns {{ fieldsSchemas: Object, relations: Array<Object> }}
 */
export const parseSDLToSchemaDefinitions = (sdlString) => {
  const ast = parse(sdlString);
  const fieldsSchemas = {};
  const relationDefs = [];

  // Parse types and field definitions
  ast.definitions.forEach((def) => {
    if (def.kind !== 'ObjectTypeDefinition') return;
    const typeName = def.name.value;
    const modelDir = (def.directives || []).find((d) => d.name.value === 'model');
    if (!modelDir) return;

    const fields = {};

    (def.fields || []).forEach((field) => {
      const fieldName = field.name.value;
      if (fieldName === 'id' || fieldName === 'createdAt' || fieldName === 'updatedAt') {
        return;
      }
      let isRequired = false;
      let isList = false;
      let rawType = field.type;

      if (rawType.kind === 'NonNullType') {
        isRequired = true;
        rawType = rawType.type;
      }
      if (rawType.kind === 'ListType') {
        isList = true;
        rawType = rawType.type;
        if (rawType.kind === 'NonNullType') {
          rawType = rawType.type;
        }
      }

      const targetTypeName = rawType.name.value;

      // Extract relation directive (@relation(name: "..."))
      const relDir = (field.directives || []).find((d) => d.name.value === 'relation');
      if (relDir) {
        const nameArg = (relDir.arguments || []).find((a) => a.name.value === 'name');
        relationDefs.push({
          relName: nameArg ? nameArg.value.value : `${typeName}_${fieldName}`,
          source: typeName,
          target: targetTypeName,
          field: fieldName,
          isList,
        });
        return;
      }

      const fieldDef = {
        type: targetTypeName,
        required: isRequired,
      };

      (field.directives || []).forEach((d) => {
        const dName = d.name.value;
        if (dName === 'unique' || dName === 'uniqueOrEmpty') {
          fieldDef.unique = true;
        } else if (dName === 'createIndex') {
          fieldDef.index = true;
        } else if (dName === 'defaultValue') {
          const valArg = (d.arguments || []).find((a) => a.name.value === 'value');
          if (valArg) {
            let v = valArg.value.value;
            if (v === 'true') v = true;
            else if (v === 'false') v = false;
            else if (!isNaN(Number(v)) && fieldDef.type === 'Int') v = parseInt(v, 10);
            else if (!isNaN(Number(v)) && fieldDef.type === 'Float') v = parseFloat(v);
            fieldDef.default = v;
          }
        }
      });

      fields[fieldName] = fieldDef;
    });

    fieldsSchemas[typeName] = fields;
  });

  // Extract associations from @relation definitions
  const relGroups = {};
  relationDefs.forEach((r) => {
    if (!relGroups[r.relName]) relGroups[r.relName] = [];
    relGroups[r.relName].push(r);
  });

  const foreignKeyMap = {
    CompanyUsers: { fk: 'companyId', one: 'PgCompany', many: 'PgUser' },
    UserPosts: { fk: 'authorId', one: 'PgUser', many: 'PgPost' },
    CompanyPosts: { fk: 'companyId', one: 'PgCompany', many: 'PgPost' },
    PostComments: { fk: 'postId', one: 'PgPost', many: 'PgComment' },
    UserComments: { fk: 'authorId', one: 'PgUser', many: 'PgComment' },
  };

  const relations = [];
  Object.keys(relGroups).forEach((relName) => {
    const pair = relGroups[relName];
    const mapping = foreignKeyMap[relName];
    if (mapping) {
      const oneSide = pair.find((p) => p.source === mapping.one);
      const manySide = pair.find((p) => p.source === mapping.many);
      relations.push({
        type: '1:N',
        source: mapping.one,
        target: mapping.many,
        foreignKey: mapping.fk,
        as: oneSide ? oneSide.field : `${mapping.many.toLowerCase()}s`,
        targetAs: manySide ? manySide.field : mapping.one.toLowerCase(),
      });
    }
  });

  return { fieldsSchemas, relations };
};

// Parse default SDL definition into field schemas and relations
const parsed = parseSDLToSchemaDefinitions(pgGraphQLSDL);

export const PgCompanyFields = parsed.fieldsSchemas.PgCompany;
export const PgUserFields = parsed.fieldsSchemas.PgUser;
export const PgPostFields = parsed.fieldsSchemas.PgPost;
export const PgCommentFields = parsed.fieldsSchemas.PgComment;
export const PgProductFields = parsed.fieldsSchemas.PgProduct;
export const testRelations = parsed.relations;

/**
 * Creates Sequelize models directly from client GraphQL SDL and wires associations
 *
 * @param {string} sdl GraphQL SDL string
 * @param {Sequelize} sequelize Sequelize database connection
 * @returns {Object} Compiled Sequelize models map
 */
export const createModelsFromSDL = (sdl, sequelize) => {
  const { fieldsSchemas, relations } = parseSDLToSchemaDefinitions(sdl);
  const models = {};

  Object.keys(fieldsSchemas).forEach((typeName) => {
    models[typeName] = createSequelizeModelFromAST(typeName, fieldsSchemas[typeName], sequelize);
  });

  wireSequelizeAssociations(models, relations);
  return models;
};

/**
 * Custom Date Scalar for GraphQL execution
 */
const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  parseValue(value) {
    return new Date(value);
  },
  serialize(value) {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10));
    }
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

/**
 * Custom JSONB Scalar for GraphQL execution
 */
const JSONBScalar = new GraphQLScalarType({
  name: 'JSONB',
  description: 'JSONB custom scalar type',
  parseValue(value) {
    return typeof value === 'object' ? value : JSON.parse(value);
  },
  serialize(value) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return JSON.parse(ast.value);
    }
    return null;
  },
});

/**
 * Builds an executable GraphQL schema with client-facing Query and Mutation
 * resolvers connected to the live PostgreSQL Sequelize models.
 *
 * @param {Object} models Compiled Sequelize models
 * @returns {GraphQLSchema} Executable GraphQL Schema
 */
export const createPostgresExecutableSchema = (models) => {
  const operationTypeDefs = `
    input CreatePgCompanyInput {
      name: String!
      domain: String
      industry: String
      employeeCount: Int
      isPublic: Boolean
      metadata: JSONB
    }

    input CreatePgUserInput {
      name: String!
      email: String!
      age: Int
      salary: Float
      active: Boolean
      bio: String
      companyId: String
      preferences: JSONB
    }

    input UpdatePgUserInput {
      name: String
      email: String
      age: Int
      salary: Float
      active: Boolean
      bio: String
      companyId: String
      preferences: JSONB
    }

    input CreatePgPostInput {
      title: String!
      content: String
      published: Boolean
      rating: Float
      authorId: String!
      companyId: String
    }

    input CreatePgCommentInput {
      content: String!
      postId: String!
      authorId: String!
      upvotes: Int
    }

    input CreatePgProductInput {
      name: String!
      price: Float!
      quantity: Int
      active: Boolean
      sku: String
      tags: JSONB
      specs: JSONB
    }

    input UpdatePgProductInput {
      name: String
      price: Float
      quantity: Int
      active: Boolean
      sku: String
      tags: JSONB
      specs: JSONB
    }

    input PgUserFilter {
      name: String
      name_not: String
      name_contains: String
      name_startsWith: String
      name_endsWith: String
      name_in: [String]
      email: String
      email_not: String
      email_contains: String
      age: Int
      age_gt: Int
      age_gte: Int
      age_lt: Int
      age_lte: Int
      age_not: Int
      age_in: [Int]
      salary: Float
      salary_gt: Float
      salary_gte: Float
      salary_lt: Float
      salary_lte: Float
      active: Boolean
      bio: String
      bio_exists: Boolean
      companyId: String
      companyId_exists: Boolean
      and: [PgUserFilter]
      or: [PgUserFilter]
      not: PgUserFilter
      AND: [PgUserFilter]
      OR: [PgUserFilter]
      NOT: [PgUserFilter]
    }

    input PgCompanyFilter {
      name: String
      name_contains: String
      industry: String
      isPublic: Boolean
    }

    input PgPostFilter {
      title: String
      title_contains: String
      published: Boolean
      authorId: String
    }

    input PgProductFilter {
      name: String
      sku: String
      active: Boolean
    }

    input PgCommentFilter {
      postId: String
      authorId: String
    }

    type DeletePayload {
      id: ID!
      success: Boolean!
    }

    type Query {
      pgUser(id: ID!): PgUser
      pgUsers(filter: PgUserFilter, orderBy: String, first: Int, skip: Int): [PgUser]
      pgCompany(id: ID!): PgCompany
      pgCompanies(filter: PgCompanyFilter, orderBy: String, first: Int, skip: Int): [PgCompany]
      pgPost(id: ID!): PgPost
      pgPosts(filter: PgPostFilter, orderBy: String, first: Int, skip: Int): [PgPost]
      pgProduct(id: ID!): PgProduct
      pgProducts(filter: PgProductFilter, orderBy: String, first: Int, skip: Int): [PgProduct]
      pgComment(id: ID!): PgComment
      pgComments(filter: PgCommentFilter, orderBy: String, first: Int, skip: Int): [PgComment]
    }

    type Mutation {
      createPgCompany(input: CreatePgCompanyInput!): PgCompany
      createPgUser(input: CreatePgUserInput!): PgUser
      updatePgUser(id: ID!, input: UpdatePgUserInput!): PgUser
      deletePgUser(id: ID!): DeletePayload
      createPgPost(input: CreatePgPostInput!): PgPost
      createPgComment(input: CreatePgCommentInput!): PgComment
      deletePgComment(id: ID!): DeletePayload
      createPgProduct(input: CreatePgProductInput!): PgProduct
      updatePgProduct(id: ID!, input: UpdatePgProductInput!): PgProduct
      deletePgProduct(id: ID!): DeletePayload
    }
  `;

  // Strip directive syntax from SDL to generate pure type definitions for schema execution
  const pureTypesSDL = pgGraphQLSDL
    .replace(/@model\([^)]*\)/g, '')
    .replace(/@uniqueOrEmpty/g, '')
    .replace(/@unique/g, '')
    .replace(/@defaultValue\([^)]*\)/g, '')
    .replace(/@relation\([^)]*\)/g, '')
    .replace(/@createIndex\([^)]*\)/g, '');

  const resolvers = {
    Date: DateScalar,
    JSONB: JSONBScalar,

    Query: {
      pgUser: async (_, { id }) => {
        const u = await models.PgUser.findByPk(id);
        return u ? u.toJSON() : null;
      },
      pgUsers: async (_, { filter = {}, orderBy, first = 50, skip = 0 }) => {
        const where = buildSequelizeWhereClause(filter);
        const order = orderBy ? getSortOrderForSequelize(orderBy) : [['createdAt', 'ASC']];
        const list = await models.PgUser.findAll({
          where,
          order,
          limit: first,
          offset: skip,
        });
        return list.map((item) => item.toJSON());
      },
      pgCompany: async (_, { id }) => {
        const c = await models.PgCompany.findByPk(id);
        return c ? c.toJSON() : null;
      },
      pgCompanies: async (_, { filter = {}, orderBy, first = 50, skip = 0 }) => {
        const where = buildSequelizeWhereClause(filter);
        const order = orderBy ? getSortOrderForSequelize(orderBy) : [['createdAt', 'ASC']];
        const list = await models.PgCompany.findAll({
          where,
          order,
          limit: first,
          offset: skip,
        });
        return list.map((item) => item.toJSON());
      },
      pgPost: async (_, { id }) => {
        const p = await models.PgPost.findByPk(id);
        return p ? p.toJSON() : null;
      },
      pgPosts: async (_, { filter = {}, orderBy, first = 50, skip = 0 }) => {
        const where = buildSequelizeWhereClause(filter);
        const order = orderBy ? getSortOrderForSequelize(orderBy) : [['createdAt', 'ASC']];
        const list = await models.PgPost.findAll({
          where,
          order,
          limit: first,
          offset: skip,
        });
        return list.map((item) => item.toJSON());
      },
      pgProduct: async (_, { id }) => {
        const p = await models.PgProduct.findByPk(id);
        return p ? p.toJSON() : null;
      },
      pgProducts: async (_, { filter = {}, orderBy, first = 50, skip = 0 }) => {
        const where = buildSequelizeWhereClause(filter);
        const order = orderBy ? getSortOrderForSequelize(orderBy) : [['createdAt', 'ASC']];
        const list = await models.PgProduct.findAll({
          where,
          order,
          limit: first,
          offset: skip,
        });
        return list.map((item) => item.toJSON());
      },
      pgComment: async (_, { id }) => {
        const c = await models.PgComment.findByPk(id);
        return c ? c.toJSON() : null;
      },
      pgComments: async (_, { filter = {}, orderBy, first = 50, skip = 0 }) => {
        const where = buildSequelizeWhereClause(filter);
        const order = orderBy ? getSortOrderForSequelize(orderBy) : [['createdAt', 'ASC']];
        const list = await models.PgComment.findAll({
          where,
          order,
          limit: first,
          offset: skip,
        });
        return list.map((item) => item.toJSON());
      },
    },

    Mutation: {
      createPgCompany: async (_, { input }) => {
        const created = await models.PgCompany.create(input);
        return created.toJSON();
      },
      createPgUser: async (_, { input }) => {
        const created = await models.PgUser.create(input);
        return created.toJSON();
      },
      updatePgUser: async (_, { id, input }) => {
        const user = await models.PgUser.findByPk(id);
        if (!user) throw new Error(`User with id ${id} not found`);
        await user.update(input);
        return user.toJSON();
      },
      deletePgUser: async (_, { id }) => {
        const deleted = await models.PgUser.destroy({ where: { id } });
        return { id, success: deleted > 0 };
      },
      createPgPost: async (_, { input }) => {
        const created = await models.PgPost.create(input);
        return created.toJSON();
      },
      createPgComment: async (_, { input }) => {
        const created = await models.PgComment.create(input);
        return created.toJSON();
      },
      deletePgComment: async (_, { id }) => {
        const deleted = await models.PgComment.destroy({ where: { id } });
        return { id, success: deleted > 0 };
      },
      createPgProduct: async (_, { input }) => {
        const created = await models.PgProduct.create(input);
        return created.toJSON();
      },
      updatePgProduct: async (_, { id, input }) => {
        const p = await models.PgProduct.findByPk(id);
        if (!p) throw new Error(`Product with id ${id} not found`);
        await p.update(input);
        return p.toJSON();
      },
      deletePgProduct: async (_, { id }) => {
        const deleted = await models.PgProduct.destroy({ where: { id } });
        return { id, success: deleted > 0 };
      },
    },

    // Relational field resolvers
    PgUser: {
      company: async (user) => {
        if (!user.companyId) return null;
        const comp = await models.PgCompany.findByPk(user.companyId);
        return comp ? comp.toJSON() : null;
      },
      posts: async (user) => {
        const posts = await models.PgPost.findAll({ where: { authorId: user.id } });
        return posts.map((p) => p.toJSON());
      },
      comments: async (user) => {
        const comments = await models.PgComment.findAll({ where: { authorId: user.id } });
        return comments.map((c) => c.toJSON());
      },
    },

    PgCompany: {
      users: async (company) => {
        const users = await models.PgUser.findAll({ where: { companyId: company.id } });
        return users.map((u) => u.toJSON());
      },
      posts: async (company) => {
        const posts = await models.PgPost.findAll({ where: { companyId: company.id } });
        return posts.map((p) => p.toJSON());
      },
    },

    PgPost: {
      author: async (post) => {
        if (!post.authorId) return null;
        const author = await models.PgUser.findByPk(post.authorId);
        return author ? author.toJSON() : null;
      },
      company: async (post) => {
        if (!post.companyId) return null;
        const comp = await models.PgCompany.findByPk(post.companyId);
        return comp ? comp.toJSON() : null;
      },
      comments: async (post) => {
        const comments = await models.PgComment.findAll({ where: { postId: post.id } });
        return comments.map((c) => c.toJSON());
      },
    },

    PgComment: {
      post: async (comment) => {
        const post = await models.PgPost.findByPk(comment.postId);
        return post ? post.toJSON() : null;
      },
      author: async (comment) => {
        const author = await models.PgUser.findByPk(comment.authorId);
        return author ? author.toJSON() : null;
      },
    },
  };

  return makeExecutableSchema({
    typeDefs: [pureTypesSDL, operationTypeDefs],
    resolvers,
  });
};

const handleGraphQLErrors = (res) => {
  if (res.errors && res.errors.length) {
    const original = res.errors[0].originalError || {};
    const err = new Error(original.message || res.errors[0].message);
    err.name = original.name || 'GraphQLError';
    err.graphQLErrors = res.errors;
    err.originalError = res.errors[0].originalError;
    throw err;
  }
};

/**
 * Client API helper wrapping generated GraphQL operations
 *
 * @param {GraphQLSchema} schema
 */
export const createApiClient = (schema) => ({
  // CREATE
  createCompany: async (input) => {
    const res = await require('graphql').graphql(schema, `
      mutation CreateCompany($input: CreatePgCompanyInput!) {
        createPgCompany(input: $input) {
          id name domain industry employeeCount isPublic foundedAt metadata createdAt updatedAt
        }
      }
    `, null, null, { input });
    handleGraphQLErrors(res);
    return res.data.createPgCompany;
  },

  createUser: async (input) => {
    const res = await require('graphql').graphql(schema, `
      mutation CreateUser($input: CreatePgUserInput!) {
        createPgUser(input: $input) {
          id name email age salary active bio companyId preferences createdAt updatedAt
        }
      }
    `, null, null, { input });
    handleGraphQLErrors(res);
    return res.data.createPgUser;
  },

  createPost: async (input) => {
    const res = await require('graphql').graphql(schema, `
      mutation CreatePost($input: CreatePgPostInput!) {
        createPgPost(input: $input) {
          id title content published viewCount rating authorId companyId createdAt updatedAt
        }
      }
    `, null, null, { input });
    handleGraphQLErrors(res);
    return res.data.createPgPost;
  },

  createComment: async (input) => {
    const res = await require('graphql').graphql(schema, `
      mutation CreateComment($input: CreatePgCommentInput!) {
        createPgComment(input: $input) {
          id content postId authorId upvotes createdAt updatedAt
        }
      }
    `, null, null, { input });
    handleGraphQLErrors(res);
    return res.data.createPgComment;
  },

  createProduct: async (input) => {
    const res = await require('graphql').graphql(schema, `
      mutation CreateProduct($input: CreatePgProductInput!) {
        createPgProduct(input: $input) {
          id name price quantity active sku tags specs createdAt updatedAt
        }
      }
    `, null, null, { input });
    handleGraphQLErrors(res);
    return res.data.createPgProduct;
  },

  // READ SINGLE
  getUser: async (id) => {
    const res = await require('graphql').graphql(schema, `
      query GetUser($id: ID!) {
        pgUser(id: $id) {
          id name email age salary active bio companyId preferences createdAt updatedAt
        }
      }
    `, null, null, { id });
    handleGraphQLErrors(res);
    return res.data.pgUser;
  },

  getCompany: async (id) => {
    const res = await require('graphql').graphql(schema, `
      query GetCompany($id: ID!) {
        pgCompany(id: $id) {
          id name domain industry employeeCount isPublic foundedAt metadata createdAt updatedAt
        }
      }
    `, null, null, { id });
    handleGraphQLErrors(res);
    return res.data.pgCompany;
  },

  getPost: async (id) => {
    const res = await require('graphql').graphql(schema, `
      query GetPost($id: ID!) {
        pgPost(id: $id) {
          id title content published viewCount rating authorId companyId createdAt updatedAt
        }
      }
    `, null, null, { id });
    handleGraphQLErrors(res);
    return res.data.pgPost;
  },

  getProduct: async (id) => {
    const res = await require('graphql').graphql(schema, `
      query GetProduct($id: ID!) {
        pgProduct(id: $id) {
          id name price quantity active sku tags specs createdAt updatedAt
        }
      }
    `, null, null, { id });
    handleGraphQLErrors(res);
    return res.data.pgProduct;
  },

  getComment: async (id) => {
    const res = await require('graphql').graphql(schema, `
      query GetComment($id: ID!) {
        pgComment(id: $id) {
          id content postId authorId upvotes createdAt updatedAt
        }
      }
    `, null, null, { id });
    handleGraphQLErrors(res);
    return res.data.pgComment;
  },

  // READ LIST (FILTER, SORT, PAGINATE)
  listUsers: async ({ filter, orderBy, first, skip } = {}) => {
    const res = await require('graphql').graphql(schema, `
      query ListUsers($filter: PgUserFilter, $orderBy: String, $first: Int, $skip: Int) {
        pgUsers(filter: $filter, orderBy: $orderBy, first: $first, skip: $skip) {
          id name email age salary active bio companyId preferences createdAt updatedAt
        }
      }
    `, null, null, { filter, orderBy, first, skip });
    handleGraphQLErrors(res);
    return res.data.pgUsers;
  },

  listCompanies: async ({ filter, orderBy, first, skip } = {}) => {
    const res = await require('graphql').graphql(schema, `
      query ListCompanies($filter: PgCompanyFilter, $orderBy: String, $first: Int, $skip: Int) {
        pgCompanies(filter: $filter, orderBy: $orderBy, first: $first, skip: $skip) {
          id name domain industry employeeCount isPublic createdAt updatedAt
        }
      }
    `, null, null, { filter, orderBy, first, skip });
    handleGraphQLErrors(res);
    return res.data.pgCompanies;
  },

  listPosts: async ({ filter, orderBy, first, skip } = {}) => {
    const res = await require('graphql').graphql(schema, `
      query ListPosts($filter: PgPostFilter, $orderBy: String, $first: Int, $skip: Int) {
        pgPosts(filter: $filter, orderBy: $orderBy, first: $first, skip: $skip) {
          id title content published viewCount rating authorId companyId createdAt updatedAt
        }
      }
    `, null, null, { filter, orderBy, first, skip });
    handleGraphQLErrors(res);
    return res.data.pgPosts;
  },

  listComments: async ({ filter, orderBy, first, skip } = {}) => {
    const res = await require('graphql').graphql(schema, `
      query ListComments($filter: PgCommentFilter, $orderBy: String, $first: Int, $skip: Int) {
        pgComments(filter: $filter, orderBy: $orderBy, first: $first, skip: $skip) {
          id content postId authorId upvotes createdAt updatedAt
        }
      }
    `, null, null, { filter, orderBy, first, skip });
    handleGraphQLErrors(res);
    return res.data.pgComments;
  },

  listProducts: async ({ filter, orderBy, first, skip } = {}) => {
    const res = await require('graphql').graphql(schema, `
      query ListProducts($filter: PgProductFilter, $orderBy: String, $first: Int, $skip: Int) {
        pgProducts(filter: $filter, orderBy: $orderBy, first: $first, skip: $skip) {
          id name price quantity active sku tags specs createdAt updatedAt
        }
      }
    `, null, null, { filter, orderBy, first, skip });
    handleGraphQLErrors(res);
    return res.data.pgProducts;
  },

  // UPDATE
  updateUser: async (id, input) => {
    const res = await require('graphql').graphql(schema, `
      mutation UpdateUser($id: ID!, $input: UpdatePgUserInput!) {
        updatePgUser(id: $id, input: $input) {
          id name email age salary active bio companyId preferences createdAt updatedAt
        }
      }
    `, null, null, { id, input });
    handleGraphQLErrors(res);
    return res.data.updatePgUser;
  },

  updateProduct: async (id, input) => {
    const res = await require('graphql').graphql(schema, `
      mutation UpdateProduct($id: ID!, $input: UpdatePgProductInput!) {
        updatePgProduct(id: $id, input: $input) {
          id name price quantity active sku tags specs createdAt updatedAt
        }
      }
    `, null, null, { id, input });
    handleGraphQLErrors(res);
    return res.data.updatePgProduct;
  },

  // DELETE
  deleteUser: async (id) => {
    const res = await require('graphql').graphql(schema, `
      mutation DeleteUser($id: ID!) {
        deletePgUser(id: $id) {
          id success
        }
      }
    `, null, null, { id });
    handleGraphQLErrors(res);
    return res.data.deletePgUser;
  },

  deleteProduct: async (id) => {
    const res = await require('graphql').graphql(schema, `
      mutation DeleteProduct($id: ID!) {
        deletePgProduct(id: $id) {
          id success
        }
      }
    `, null, null, { id });
    handleGraphQLErrors(res);
    return res.data.deletePgProduct;
  },

  deleteComment: async (id) => {
    const res = await require('graphql').graphql(schema, `
      mutation DeleteComment($id: ID!) {
        deletePgComment(id: $id) {
          id success
        }
      }
    `, null, null, { id });
    handleGraphQLErrors(res);
    return res.data.deletePgComment;
  },

  // RAW EXECUTE
  execute: (query, variables = {}) => require('graphql').graphql(schema, query, null, null, variables),
});

export default {
  pgGraphQLSDL,
  parseSDLToSchemaDefinitions,
  createModelsFromSDL,
  createPostgresExecutableSchema,
  createApiClient,
  PgCompanyFields,
  PgUserFields,
  PgPostFields,
  PgCommentFields,
  PgProductFields,
  testRelations,
};
