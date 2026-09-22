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
} from '../../src/autoGenerate/models/sqlModelGenerator';

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
      age: Int
      salary: Float
      active: Boolean
      bio: String
      companyId: String
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

    type DeletePayload {
      id: ID!
      success: Boolean!
    }

    type Query {
      pgUser(id: ID!): PgUser
      pgUsers(first: Int, skip: Int): [PgUser]
      pgCompany(id: ID!): PgCompany
      pgCompanies(first: Int, skip: Int): [PgCompany]
      pgPost(id: ID!): PgPost
      pgPosts(first: Int, skip: Int): [PgPost]
      pgProduct(id: ID!): PgProduct
    }

    type Mutation {
      createPgCompany(input: CreatePgCompanyInput!): PgCompany
      createPgUser(input: CreatePgUserInput!): PgUser
      updatePgUser(id: ID!, input: UpdatePgUserInput!): PgUser
      deletePgUser(id: ID!): DeletePayload
      createPgPost(input: CreatePgPostInput!): PgPost
      createPgComment(input: CreatePgCommentInput!): PgComment
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
      pgUsers: async (_, { first = 20, skip = 0 }) => {
        const list = await models.PgUser.findAll({ limit: first, offset: skip, order: [['createdAt', 'ASC']] });
        return list.map((item) => item.toJSON());
      },
      pgCompany: async (_, { id }) => {
        const c = await models.PgCompany.findByPk(id);
        return c ? c.toJSON() : null;
      },
      pgCompanies: async (_, { first = 20, skip = 0 }) => {
        const list = await models.PgCompany.findAll({ limit: first, offset: skip, order: [['createdAt', 'ASC']] });
        return list.map((item) => item.toJSON());
      },
      pgPost: async (_, { id }) => {
        const p = await models.PgPost.findByPk(id);
        return p ? p.toJSON() : null;
      },
      pgPosts: async (_, { first = 20, skip = 0 }) => {
        const list = await models.PgPost.findAll({ limit: first, offset: skip, order: [['createdAt', 'ASC']] });
        return list.map((item) => item.toJSON());
      },
      pgProduct: async (_, { id }) => {
        const p = await models.PgProduct.findByPk(id);
        return p ? p.toJSON() : null;
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

export default {
  pgGraphQLSDL,
  parseSDLToSchemaDefinitions,
  createModelsFromSDL,
  createPostgresExecutableSchema,
  PgCompanyFields,
  PgUserFields,
  PgPostFields,
  PgCommentFields,
  PgProductFields,
  testRelations,
};
