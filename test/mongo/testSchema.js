/**
 * AutoGraphQL — MongoDB Integration Test Schema Definition from GraphQL SDL
 *
 * This file defines the MongoDB entities directly as client-facing GraphQL SDL.
 * The AST parser extracts model definitions, constraints, defaults, types, and
 * relations (@relation directives) from the GraphQL SDL string, matching how
 * any client or developer defines schemas in AutoGraphQL.
 */
import { parse, GraphQLScalarType, Kind } from 'graphql';
import { makeExecutableSchema } from 'graphql-tools';
import mongoose from 'mongoose';
import cuid from 'cuid';

const { Schema } = mongoose;

/**
 * Client-facing GraphQL SDL definition for MongoDB
 */
export const mongoGraphQLSDL = `
  scalar Date

  # 1. Company entity
  type MongoCompany @model {
    id: ID
    name: String!
    domain: String @unique
    industry: String
    employeeCount: Int
    isPublic: Boolean @defaultValue(value: "false")
    foundedAt: Date
    createdAt: Date
    updatedAt: Date
    users: [MongoUser] @relation(name: "MongoCompanyUsers")
    posts: [MongoPost] @relation(name: "MongoCompanyPosts")
  }

  # 2. User entity with unique constraint, defaults, and relationships
  type MongoUser @model {
    id: ID
    name: String! @trim
    email: String! @unique
    age: Int
    salary: Float
    active: Boolean @defaultValue(value: "true")
    bio: String
    companyId: String
    createdAt: Date
    updatedAt: Date
    lastLoginAt: Date
    company: MongoCompany @relation(name: "MongoCompanyUsers")
    posts: [MongoPost] @relation(name: "MongoUserPosts")
    comments: [MongoComment] @relation(name: "MongoUserComments")
  }

  # 3. Post entity belonging to User and Company, having Comments
  type MongoPost @model {
    id: ID
    title: String! @trim
    slug: String! @unique
    content: String!
    published: Boolean @defaultValue(value: "false")
    viewsCount: Int @defaultValue(value: "0")
    rating: Float
    authorId: String!
    companyId: String
    createdAt: Date
    updatedAt: Date
    publishedAt: Date
    author: MongoUser @relation(name: "MongoUserPosts")
    company: MongoCompany @relation(name: "MongoCompanyPosts")
    comments: [MongoComment] @relation(name: "MongoPostComments")
  }

  # 4. Comment entity referencing Post and Author
  type MongoComment @model {
    id: ID
    content: String! @trim
    upvotes: Int @defaultValue(value: "0")
    postId: String!
    authorId: String!
    createdAt: Date
    updatedAt: Date
    post: MongoPost @relation(name: "MongoPostComments")
    author: MongoUser @relation(name: "MongoUserComments")
  }

  # 5. Product entity with inventory attributes and unique SKU
  type MongoProduct @model {
    id: ID
    name: String! @trim
    price: Float!
    quantity: Int @defaultValue(value: "0")
    active: Boolean @defaultValue(value: "true")
    sku: String @unique
    createdAt: Date
    updatedAt: Date
  }
`;

/**
 * Evolved SDL version with added fields:
 * - MongoUser: added 'tagline: String'
 * - MongoCompany: added 'headquarters: String'
 */
export const mongoGraphQLSDLEvolved = `
  scalar Date

  type MongoCompany @model {
    id: ID
    name: String!
    domain: String @unique
    industry: String
    employeeCount: Int
    isPublic: Boolean @defaultValue(value: "false")
    headquarters: String
    foundedAt: Date
    createdAt: Date
    updatedAt: Date
    users: [MongoUser] @relation(name: "MongoCompanyUsers")
    posts: [MongoPost] @relation(name: "MongoCompanyPosts")
  }

  type MongoUser @model {
    id: ID
    name: String! @trim
    email: String! @unique
    age: Int
    salary: Float
    active: Boolean @defaultValue(value: "true")
    bio: String
    tagline: String
    companyId: String
    createdAt: Date
    updatedAt: Date
    lastLoginAt: Date
    company: MongoCompany @relation(name: "MongoCompanyUsers")
    posts: [MongoPost] @relation(name: "MongoUserPosts")
    comments: [MongoComment] @relation(name: "MongoUserComments")
  }

  type MongoPost @model {
    id: ID
    title: String! @trim
    slug: String! @unique
    content: String!
    published: Boolean @defaultValue(value: "false")
    viewsCount: Int @defaultValue(value: "0")
    rating: Float
    authorId: String!
    companyId: String
    createdAt: Date
    updatedAt: Date
    publishedAt: Date
    author: MongoUser @relation(name: "MongoUserPosts")
    company: MongoCompany @relation(name: "MongoCompanyPosts")
    comments: [MongoComment] @relation(name: "MongoPostComments")
  }

  type MongoComment @model {
    id: ID
    content: String! @trim
    upvotes: Int @defaultValue(value: "0")
    postId: String!
    authorId: String!
    createdAt: Date
    updatedAt: Date
    post: MongoPost @relation(name: "MongoPostComments")
    author: MongoUser @relation(name: "MongoUserComments")
  }

  type MongoProduct @model {
    id: ID
    name: String! @trim
    price: Float!
    quantity: Int @defaultValue(value: "0")
    active: Boolean @defaultValue(value: "true")
    sku: String @unique
    createdAt: Date
    updatedAt: Date
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

  return { fieldsSchemas, relations: relationDefs };
};

/**
 * Creates Mongoose models dynamically from the parsed SDL definitions
 *
 * @param {string} sdlString
 * @param {mongoose.Connection} [connection=mongoose.connection]
 * @returns {Object<string, mongoose.Model>}
 */
export const createMongooseModelsFromAST = (sdlString, connection = mongoose.connection) => {
  const { fieldsSchemas, relations } = parseSDLToSchemaDefinitions(sdlString);
  const models = {};

  Object.keys(fieldsSchemas).forEach((typeName) => {
    // If model already compiled on connection, delete to avoid OverwriteModelError
    if (connection.models && connection.models[typeName]) {
      delete connection.models[typeName];
    }
    if (mongoose.models && mongoose.models[typeName]) {
      delete mongoose.models[typeName];
    }

    const fields = fieldsSchemas[typeName];
    const schemaDef = {
      id: { type: String, required: true, unique: true, index: true },
    };

    // Convert fields to Mongoose schema types
    Object.keys(fields).forEach((fName) => {
      const fDef = fields[fName];
      let mType;
      switch (fDef.type) {
        case 'Int':
        case 'Float':
          mType = Number;
          break;
        case 'Boolean':
          mType = Boolean;
          break;
        case 'Date':
          mType = Date;
          break;
        case 'String':
        case 'ID':
        default:
          mType = String;
          break;
      }

      const propDef = { type: mType };
      if (fDef.required) propDef.required = true;
      if (fDef.unique) propDef.unique = true;
      if (fDef.default !== undefined) propDef.default = fDef.default;

      schemaDef[fName] = propDef;
    });

    // Add relation fields representation in Mongoose schema
    relations
      .filter((r) => r.source === typeName)
      .forEach((r) => {
        if (r.isList) {
          schemaDef[r.field] = [{
            typeId: { type: String },
            type: { type: String, default: r.target },
          }];
        } else {
          schemaDef[r.field] = {
            typeId: { type: String },
            type: { type: String, default: r.target },
          };
        }
      });

    const mSchema = new Schema(schemaDef, {
      collection: typeName,
      timestamps: true,
      usePushEach: true,
      autoIndex: false,
      toJSON: {
        transform: (doc, ret) => {
          delete ret._id;
          delete ret.__v;
          return ret;
        },
      },
    });

    models[typeName] = connection.model(typeName, mSchema);
  });

  return models;
};

/**
 * Builds a MongoDB filter query object from GraphQL filter input
 *
 * @param {Object} filterInput
 * @returns {Object} MongoDB query filter object
 */
export const buildMongoFilterQuery = (filterInput) => {
  if (!filterInput || Object.keys(filterInput).length === 0) return {};

  const query = {};

  // Handle AND / and
  const andArray = filterInput.AND || filterInput.and;
  if (Array.isArray(andArray) && andArray.length > 0) {
    query.$and = andArray.map((f) => buildMongoFilterQuery(f));
  }

  // Handle OR / or
  const orArray = filterInput.OR || filterInput.or;
  if (Array.isArray(orArray) && orArray.length > 0) {
    query.$or = orArray.map((f) => buildMongoFilterQuery(f));
  }

  Object.keys(filterInput).forEach((key) => {
    if (['AND', 'OR', 'and', 'or'].includes(key)) return;

    const value = filterInput[key];

    // id equality
    if (key === 'id') {
      query.id = value;
      return;
    }

    // field_in: [values]
    if (key.endsWith('_in')) {
      const field = key.slice(0, -3);
      query[field] = { $in: value };
      return;
    }

    // field_notIn: [values]
    if (key.endsWith('_notIn')) {
      const field = key.slice(0, -6);
      query[field] = { $nin: value };
      return;
    }

    // field_not: value
    if (key.endsWith('_not')) {
      const field = key.slice(0, -4);
      query[field] = { $ne: value };
      return;
    }

    // field_gt: value
    if (key.endsWith('_gt')) {
      const field = key.slice(0, -3);
      query[field] = { ...query[field], $gt: value };
      return;
    }

    // field_gte: value
    if (key.endsWith('_gte')) {
      const field = key.slice(0, -4);
      query[field] = { ...query[field], $gte: value };
      return;
    }

    // field_lt: value
    if (key.endsWith('_lt')) {
      const field = key.slice(0, -3);
      query[field] = { ...query[field], $lt: value };
      return;
    }

    // field_lte: value
    if (key.endsWith('_lte')) {
      const field = key.slice(0, -4);
      query[field] = { ...query[field], $lte: value };
      return;
    }

    // field_contains: value
    if (key.endsWith('_contains')) {
      const field = key.slice(0, -9);
      query[field] = { $regex: value, $options: 'i' };
      return;
    }

    // field_startsWith: value
    if (key.endsWith('_startsWith')) {
      const field = key.slice(0, -11);
      query[field] = { $regex: `^${value}`, $options: 'i' };
      return;
    }

    // field_exists: Boolean
    if (key.endsWith('_exists')) {
      const field = key.slice(0, -7);
      query[field] = { $exists: Boolean(value) };
      return;
    }

    // Exact equality: field: value
    query[key] = value;
  });

  return query;
};

/**
 * Builds MongoDB sort object from Sort enum string (e.g. 'name_ASC', 'createdAt_DESC')
 *
 * @param {string} sortString
 * @returns {Object} MongoDB sort object (e.g. { name: 1 })
 */
export const buildMongoSortOrder = (sortString) => {
  if (!sortString || typeof sortString !== 'string') return {};

  if (sortString.endsWith('_ASC')) {
    const field = sortString.slice(0, -4);
    return { [field]: 1 };
  }
  if (sortString.endsWith('_DESC')) {
    const field = sortString.slice(0, -5);
    return { [field]: -1 };
  }
  return {};
};

/**
 * Custom Date Scalar
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
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      return new Date(ast.value);
    }
    return null;
  },
});

/**
 * Builds a complete executable GraphQL schema for the MongoDB test entities
 *
 * Exposes:
 * - Queries: single (mongoUser), plural list (mongoUsers), count (mongoUsersMeta)
 * - Mutations: addMongoUser, updateMongoUser, deleteMongoUser, deleteMongoProducts, addToMongoCompanyUsers, removeFromMongoCompanyUsers, etc.
 * - Relational resolvers using request-scoped DataLoaders
 * - Sorting enums and filter inputs matching AutoGraphQL's contract
 *
 * @param {Object} options
 * @param {Object<string, mongoose.Model>} options.models
 * @param {string} [options.sdlString=mongoGraphQLSDL]
 * @returns {GraphQLSchema}
 */
export const buildExecutableMongoSchema = ({ models, sdlString = mongoGraphQLSDL }) => {
  const isEvolved = sdlString.includes('tagline: String');

  const typeDefs = `
    scalar Date

    input MongoCompanyFilter {
      AND: [MongoCompanyFilter]
      OR: [MongoCompanyFilter]
      and: [MongoCompanyFilter]
      or: [MongoCompanyFilter]
      id: ID
      id_in: [ID]
      id_not: ID
      name: String
      name_contains: String
      name_startsWith: String
      domain: String
      industry: String
      employeeCount: Int
      employeeCount_gt: Int
      employeeCount_gte: Int
      employeeCount_lt: Int
      employeeCount_lte: Int
      isPublic: Boolean
      isPublic_not: Boolean
      isPublic_exists: Boolean
      foundedAt: Date
      foundedAt_gt: Date
      foundedAt_lt: Date
    }

    input MongoUserFilter {
      AND: [MongoUserFilter]
      OR: [MongoUserFilter]
      and: [MongoUserFilter]
      or: [MongoUserFilter]
      id: ID
      id_in: [ID]
      id_not: ID
      name: String
      name_contains: String
      name_startsWith: String
      email: String
      email_contains: String
      email_not: String
      age: Int
      age_gt: Int
      age_gte: Int
      age_lt: Int
      age_lte: Int
      salary: Float
      salary_gt: Float
      salary_gte: Float
      salary_lt: Float
      salary_lte: Float
      active: Boolean
      active_not: Boolean
      active_exists: Boolean
      companyId: String
      companyId_in: [String]
      companyId_exists: Boolean
      createdAt: Date
      createdAt_gt: Date
      createdAt_lt: Date
      ${isEvolved ? 'tagline: String' : ''}
    }

    input MongoPostFilter {
      AND: [MongoPostFilter]
      OR: [MongoPostFilter]
      and: [MongoPostFilter]
      or: [MongoPostFilter]
      id: ID
      id_in: [ID]
      id_not: ID
      title: String
      title_contains: String
      slug: String
      content: String
      content_contains: String
      published: Boolean
      published_not: Boolean
      published_exists: Boolean
      viewsCount: Int
      viewsCount_gt: Int
      viewsCount_gte: Int
      viewsCount_lt: Int
      viewsCount_lte: Int
      rating: Float
      rating_gt: Float
      rating_lt: Float
      authorId: String
      companyId: String
      createdAt: Date
    }

    input MongoCommentFilter {
      AND: [MongoCommentFilter]
      OR: [MongoCommentFilter]
      and: [MongoCommentFilter]
      or: [MongoCommentFilter]
      id: ID
      id_in: [ID]
      content: String
      content_contains: String
      upvotes: Int
      upvotes_gt: Int
      upvotes_lt: Int
      postId: String
      authorId: String
    }

    input MongoProductFilter {
      AND: [MongoProductFilter]
      OR: [MongoProductFilter]
      and: [MongoProductFilter]
      or: [MongoProductFilter]
      id: ID
      id_in: [ID]
      name: String
      name_contains: String
      price: Float
      price_gt: Float
      price_gte: Float
      price_lt: Float
      price_lte: Float
      quantity: Int
      quantity_gt: Int
      quantity_lt: Int
      active: Boolean
      sku: String
    }

    enum SortMongoCompany {
      name_ASC
      name_DESC
      employeeCount_ASC
      employeeCount_DESC
      foundedAt_ASC
      foundedAt_DESC
      createdAt_ASC
      createdAt_DESC
    }

    enum SortMongoUser {
      name_ASC
      name_DESC
      email_ASC
      email_DESC
      age_ASC
      age_DESC
      salary_ASC
      salary_DESC
      createdAt_ASC
      createdAt_DESC
    }

    enum SortMongoPost {
      title_ASC
      title_DESC
      viewsCount_ASC
      viewsCount_DESC
      rating_ASC
      rating_DESC
      createdAt_ASC
      createdAt_DESC
    }

    enum SortMongoComment {
      upvotes_ASC
      upvotes_DESC
      createdAt_ASC
      createdAt_DESC
    }

    enum SortMongoProduct {
      name_ASC
      name_DESC
      price_ASC
      price_DESC
      quantity_ASC
      quantity_DESC
      createdAt_ASC
      createdAt_DESC
    }

    type AggregationResult {
      count: Int
    }

    input MongoCompanyInput {
      name: String!
      domain: String
      industry: String
      employeeCount: Int
      isPublic: Boolean
      foundedAt: Date
      ${isEvolved ? 'headquarters: String' : ''}
    }

    input MongoCompanyUpdate {
      name: String
      domain: String
      industry: String
      employeeCount: Int
      isPublic: Boolean
      foundedAt: Date
      ${isEvolved ? 'headquarters: String' : ''}
    }

    input MongoUserInput {
      name: String!
      email: String!
      age: Int
      salary: Float
      active: Boolean
      bio: String
      companyId: String
      lastLoginAt: Date
      ${isEvolved ? 'tagline: String' : ''}
    }

    input MongoUserUpdate {
      name: String
      email: String
      age: Int
      salary: Float
      active: Boolean
      bio: String
      companyId: String
      lastLoginAt: Date
      ${isEvolved ? 'tagline: String' : ''}
    }

    input MongoPostInput {
      title: String!
      slug: String!
      content: String!
      published: Boolean
      viewsCount: Int
      rating: Float
      authorId: String
      companyId: String
      publishedAt: Date
    }

    input MongoPostUpdate {
      title: String
      slug: String
      content: String
      published: Boolean
      viewsCount: Int
      rating: Float
      authorId: String
      companyId: String
      publishedAt: Date
    }

    input MongoCommentInput {
      content: String!
      upvotes: Int
      postId: String
      authorId: String
    }

    input MongoCommentUpdate {
      content: String
      upvotes: Int
      postId: String
      authorId: String
    }

    input MongoProductInput {
      name: String!
      price: Float!
      quantity: Int
      active: Boolean
      sku: String
    }

    input MongoProductUpdate {
      name: String
      price: Float
      quantity: Int
      active: Boolean
      sku: String
    }

    type MongoCompanyRelationPayload {
      typeName: String
      fieldName: String
      connectedTypeName: String
      connectedFieldName: String
    }

    type MongoUserRelationPayload {
      typeName: String
      fieldName: String
      connectedTypeName: String
      connectedFieldName: String
    }

    type MongoPostRelationPayload {
      typeName: String
      fieldName: String
      connectedTypeName: String
      connectedFieldName: String
    }

    # Entity types
    type MongoCompany {
      id: ID
      name: String!
      domain: String
      industry: String
      employeeCount: Int
      isPublic: Boolean
      foundedAt: Date
      createdAt: Date
      updatedAt: Date
      users: [MongoUser]
      posts: [MongoPost]
      ${isEvolved ? 'headquarters: String' : ''}
    }

    type MongoUser {
      id: ID
      name: String!
      email: String!
      age: Int
      salary: Float
      active: Boolean
      bio: String
      companyId: String
      createdAt: Date
      updatedAt: Date
      lastLoginAt: Date
      company: MongoCompany
      posts: [MongoPost]
      comments: [MongoComment]
      ${isEvolved ? 'tagline: String' : ''}
    }

    type MongoPost {
      id: ID
      title: String!
      slug: String!
      content: String!
      published: Boolean
      viewsCount: Int
      rating: Float
      authorId: String!
      companyId: String
      createdAt: Date
      updatedAt: Date
      publishedAt: Date
      author: MongoUser
      company: MongoCompany
      comments: [MongoComment]
    }

    type MongoComment {
      id: ID
      content: String!
      upvotes: Int
      postId: String!
      authorId: String!
      createdAt: Date
      updatedAt: Date
      post: MongoPost
      author: MongoUser
    }

    type MongoProduct {
      id: ID
      name: String!
      price: Float!
      quantity: Int
      active: Boolean
      sku: String
      createdAt: Date
      updatedAt: Date
    }

    type Query {
      mongoCompany(id: ID, domain: String): MongoCompany
      mongoCompanies(filter: MongoCompanyFilter, orderBy: SortMongoCompany, first: Int, skip: Int): [MongoCompany]
      mongoCompaniesMeta(filter: MongoCompanyFilter): AggregationResult

      mongoUser(id: ID, email: String): MongoUser
      mongoUsers(filter: MongoUserFilter, orderBy: SortMongoUser, first: Int, skip: Int): [MongoUser]
      mongoUsersMeta(filter: MongoUserFilter): AggregationResult

      mongoPost(id: ID, slug: String): MongoPost
      mongoPosts(filter: MongoPostFilter, orderBy: SortMongoPost, first: Int, skip: Int): [MongoPost]
      mongoPostsMeta(filter: MongoPostFilter): AggregationResult

      mongoComment(id: ID): MongoComment
      mongoComments(filter: MongoCommentFilter, orderBy: SortMongoComment, first: Int, skip: Int): [MongoComment]
      mongoCommentsMeta(filter: MongoCommentFilter): AggregationResult

      mongoProduct(id: ID, sku: String): MongoProduct
      mongoProducts(filter: MongoProductFilter, orderBy: SortMongoProduct, first: Int, skip: Int): [MongoProduct]
      mongoProductsMeta(filter: MongoProductFilter): AggregationResult
    }

    type Mutation {
      # CREATE
      addMongoCompany(input: MongoCompanyInput!): MongoCompany
      addMongoUser(input: MongoUserInput!, companyConnectId: ID): MongoUser
      addMongoPost(input: MongoPostInput!, authorConnectId: ID, companyConnectId: ID): MongoPost
      addMongoComment(input: MongoCommentInput!, postConnectId: ID, authorConnectId: ID): MongoComment
      addMongoProduct(input: MongoProductInput!): MongoProduct

      # UPDATE
      updateMongoCompany(id: ID!, input: MongoCompanyUpdate): MongoCompany
      updateMongoUser(id: ID!, input: MongoUserUpdate, companyConnectId: ID): MongoUser
      updateMongoPost(id: ID!, input: MongoPostUpdate, authorConnectId: ID, companyConnectId: ID): MongoPost
      updateMongoComment(id: ID!, input: MongoCommentUpdate, postConnectId: ID, authorConnectId: ID): MongoComment
      updateMongoProduct(id: ID!, input: MongoProductUpdate): MongoProduct

      # DELETE
      deleteMongoCompany(id: ID!): MongoCompany
      deleteMongoUser(id: ID!): MongoUser
      deleteMongoPost(id: ID!): MongoPost
      deleteMongoComment(id: ID!): MongoComment
      deleteMongoProduct(id: ID!): MongoProduct
      deleteMongoProducts(filter: MongoProductFilter!): [MongoProduct]

      # RELATIONS (Connect / Disconnect)
      addToMongoCompanyUsers(mongoCompanyId: ID!, mongoUserId: ID!): MongoCompanyRelationPayload
      removeFromMongoCompanyUsers(mongoCompanyId: ID!, mongoUserId: ID!): MongoCompanyRelationPayload
      addToMongoCompanyPosts(mongoCompanyId: ID!, mongoPostId: ID!): MongoCompanyRelationPayload
      removeFromMongoCompanyPosts(mongoCompanyId: ID!, mongoPostId: ID!): MongoCompanyRelationPayload
      addToMongoUserPosts(mongoUserId: ID!, mongoPostId: ID!): MongoUserRelationPayload
      removeFromMongoUserPosts(mongoUserId: ID!, mongoPostId: ID!): MongoUserRelationPayload
      addToMongoUserComments(mongoUserId: ID!, mongoCommentId: ID!): MongoUserRelationPayload
      removeFromMongoUserComments(mongoUserId: ID!, mongoCommentId: ID!): MongoUserRelationPayload
      addToMongoPostComments(mongoPostId: ID!, mongoCommentId: ID!): MongoPostRelationPayload
      removeFromMongoPostComments(mongoPostId: ID!, mongoCommentId: ID!): MongoPostRelationPayload
    }
  `;

  // Resolvers
  const resolvers = {
    Date: DateScalar,

    Query: {
      // Company
      mongoCompany: async (_, { id, domain }, context) => {
        if (id && context && context.loaders) {
          const loader = context.loaders.getLoader('MongoCompany');
          if (loader) return loader.load(id);
        }
        const query = id ? { id } : { domain };
        return models.MongoCompany.findOne(query).lean().exec();
      },
      mongoCompanies: async (_, { filter, orderBy, first, skip }) => {
        const query = buildMongoFilterQuery(filter);
        const sort = buildMongoSortOrder(orderBy);
        let q = models.MongoCompany.find(query);
        if (Object.keys(sort).length > 0) q = q.sort(sort);
        if (skip) q = q.skip(skip);
        if (first) q = q.limit(first);
        return q.lean().exec();
      },
      mongoCompaniesMeta: async (_, { filter }) => {
        const query = buildMongoFilterQuery(filter);
        const count = await models.MongoCompany.countDocuments(query).exec();
        return { count };
      },

      // User
      mongoUser: async (_, { id, email }, context) => {
        if (id && context && context.loaders) {
          const loader = context.loaders.getLoader('MongoUser');
          if (loader) return loader.load(id);
        }
        const query = id ? { id } : { email };
        return models.MongoUser.findOne(query).lean().exec();
      },
      mongoUsers: async (_, { filter, orderBy, first, skip }) => {
        const query = buildMongoFilterQuery(filter);
        const sort = buildMongoSortOrder(orderBy);
        let q = models.MongoUser.find(query);
        if (Object.keys(sort).length > 0) q = q.sort(sort);
        if (skip) q = q.skip(skip);
        if (first) q = q.limit(first);
        return q.lean().exec();
      },
      mongoUsersMeta: async (_, { filter }) => {
        const query = buildMongoFilterQuery(filter);
        const count = await models.MongoUser.countDocuments(query).exec();
        return { count };
      },

      // Post
      mongoPost: async (_, { id, slug }, context) => {
        if (id && context && context.loaders) {
          const loader = context.loaders.getLoader('MongoPost');
          if (loader) return loader.load(id);
        }
        const query = id ? { id } : { slug };
        return models.MongoPost.findOne(query).lean().exec();
      },
      mongoPosts: async (_, { filter, orderBy, first, skip }) => {
        const query = buildMongoFilterQuery(filter);
        const sort = buildMongoSortOrder(orderBy);
        let q = models.MongoPost.find(query);
        if (Object.keys(sort).length > 0) q = q.sort(sort);
        if (skip) q = q.skip(skip);
        if (first) q = q.limit(first);
        return q.lean().exec();
      },
      mongoPostsMeta: async (_, { filter }) => {
        const query = buildMongoFilterQuery(filter);
        const count = await models.MongoPost.countDocuments(query).exec();
        return { count };
      },

      // Comment
      mongoComment: async (_, { id }, context) => {
        if (id && context && context.loaders) {
          const loader = context.loaders.getLoader('MongoComment');
          if (loader) return loader.load(id);
        }
        return models.MongoComment.findOne({ id }).lean().exec();
      },
      mongoComments: async (_, { filter, orderBy, first, skip }) => {
        const query = buildMongoFilterQuery(filter);
        const sort = buildMongoSortOrder(orderBy);
        let q = models.MongoComment.find(query);
        if (Object.keys(sort).length > 0) q = q.sort(sort);
        if (skip) q = q.skip(skip);
        if (first) q = q.limit(first);
        return q.lean().exec();
      },
      mongoCommentsMeta: async (_, { filter }) => {
        const query = buildMongoFilterQuery(filter);
        const count = await models.MongoComment.countDocuments(query).exec();
        return { count };
      },

      // Product
      mongoProduct: async (_, { id, sku }, context) => {
        if (id && context && context.loaders) {
          const loader = context.loaders.getLoader('MongoProduct');
          if (loader) return loader.load(id);
        }
        const query = id ? { id } : { sku };
        return models.MongoProduct.findOne(query).lean().exec();
      },
      mongoProducts: async (_, { filter, orderBy, first, skip }) => {
        const query = buildMongoFilterQuery(filter);
        const sort = buildMongoSortOrder(orderBy);
        let q = models.MongoProduct.find(query);
        if (Object.keys(sort).length > 0) q = q.sort(sort);
        if (skip) q = q.skip(skip);
        if (first) q = q.limit(first);
        return q.lean().exec();
      },
      mongoProductsMeta: async (_, { filter }) => {
        const query = buildMongoFilterQuery(filter);
        const count = await models.MongoProduct.countDocuments(query).exec();
        return { count };
      },
    },

    Mutation: {
      // Company CREATE
      addMongoCompany: async (_, { input }) => {
        const recordId = cuid();
        const doc = new models.MongoCompany({
          id: recordId,
          ...input,
        });
        const saved = await doc.save();
        return saved.toJSON();
      },
      updateMongoCompany: async (_, { id, input }) => {
        const updated = await models.MongoCompany.findOneAndUpdate(
          { id },
          { $set: input },
          { new: true, runValidators: true },
        ).lean().exec();
        return updated;
      },
      deleteMongoCompany: async (_, { id }) => {
        const deleted = await models.MongoCompany.findOneAndDelete({ id }).lean().exec();
        return deleted;
      },

      // User CREATE
      addMongoUser: async (_, { input, companyConnectId }) => {
        const recordId = cuid();
        const docData = {
          id: recordId,
          ...input,
        };
        if (companyConnectId) {
          docData.companyId = companyConnectId;
          docData.company = { typeId: companyConnectId, type: 'MongoCompany' };
        }
        const doc = new models.MongoUser(docData);
        const saved = await doc.save();

        // Update company reverse relation if companyConnectId
        if (companyConnectId) {
          await models.MongoCompany.findOneAndUpdate(
            { id: companyConnectId },
            { $addToSet: { users: { typeId: recordId, type: 'MongoUser' } } },
          ).exec();
        }

        return saved.toJSON();
      },
      updateMongoUser: async (_, { id, input, companyConnectId }) => {
        const updateData = { ...(input || {}) };
        if (companyConnectId) {
          updateData.companyId = companyConnectId;
          updateData.company = { typeId: companyConnectId, type: 'MongoCompany' };
        }
        const updated = await models.MongoUser.findOneAndUpdate(
          { id },
          { $set: updateData },
          { new: true, runValidators: true },
        ).lean().exec();
        return updated;
      },
      deleteMongoUser: async (_, { id }) => {
        const deleted = await models.MongoUser.findOneAndDelete({ id }).lean().exec();
        return deleted;
      },

      // Post CREATE
      addMongoPost: async (_, { input, authorConnectId, companyConnectId }) => {
        const recordId = cuid();
        const docData = {
          id: recordId,
          ...input,
        };
        if (authorConnectId) {
          docData.authorId = authorConnectId;
          docData.author = { typeId: authorConnectId, type: 'MongoUser' };
        }
        if (companyConnectId) {
          docData.companyId = companyConnectId;
          docData.company = { typeId: companyConnectId, type: 'MongoCompany' };
        }
        const doc = new models.MongoPost(docData);
        const saved = await doc.save();

        // Reverse relations update
        if (authorConnectId) {
          await models.MongoUser.findOneAndUpdate(
            { id: authorConnectId },
            { $addToSet: { posts: { typeId: recordId, type: 'MongoPost' } } },
          ).exec();
        }
        if (companyConnectId) {
          await models.MongoCompany.findOneAndUpdate(
            { id: companyConnectId },
            { $addToSet: { posts: { typeId: recordId, type: 'MongoPost' } } },
          ).exec();
        }

        return saved.toJSON();
      },
      updateMongoPost: async (_, { id, input, authorConnectId, companyConnectId }) => {
        const updateData = { ...(input || {}) };
        if (authorConnectId) {
          updateData.authorId = authorConnectId;
          updateData.author = { typeId: authorConnectId, type: 'MongoUser' };
        }
        if (companyConnectId) {
          updateData.companyId = companyConnectId;
          updateData.company = { typeId: companyConnectId, type: 'MongoCompany' };
        }
        const updated = await models.MongoPost.findOneAndUpdate(
          { id },
          { $set: updateData },
          { new: true, runValidators: true },
        ).lean().exec();
        return updated;
      },
      deleteMongoPost: async (_, { id }) => {
        const deleted = await models.MongoPost.findOneAndDelete({ id }).lean().exec();
        return deleted;
      },

      // Comment CREATE
      addMongoComment: async (_, { input, postConnectId, authorConnectId }) => {
        const recordId = cuid();
        const docData = {
          id: recordId,
          ...input,
        };
        if (postConnectId) {
          docData.postId = postConnectId;
          docData.post = { typeId: postConnectId, type: 'MongoPost' };
        }
        if (authorConnectId) {
          docData.authorId = authorConnectId;
          docData.author = { typeId: authorConnectId, type: 'MongoUser' };
        }
        const doc = new models.MongoComment(docData);
        const saved = await doc.save();

        if (postConnectId) {
          await models.MongoPost.findOneAndUpdate(
            { id: postConnectId },
            { $addToSet: { comments: { typeId: recordId, type: 'MongoComment' } } },
          ).exec();
        }
        if (authorConnectId) {
          await models.MongoUser.findOneAndUpdate(
            { id: authorConnectId },
            { $addToSet: { comments: { typeId: recordId, type: 'MongoComment' } } },
          ).exec();
        }

        return saved.toJSON();
      },
      updateMongoComment: async (_, { id, input, postConnectId, authorConnectId }) => {
        const updateData = { ...(input || {}) };
        if (postConnectId) {
          updateData.postId = postConnectId;
          updateData.post = { typeId: postConnectId, type: 'MongoPost' };
        }
        if (authorConnectId) {
          updateData.authorId = authorConnectId;
          updateData.author = { typeId: authorConnectId, type: 'MongoUser' };
        }
        const updated = await models.MongoComment.findOneAndUpdate(
          { id },
          { $set: updateData },
          { new: true, runValidators: true },
        ).lean().exec();
        return updated;
      },
      deleteMongoComment: async (_, { id }) => {
        const deleted = await models.MongoComment.findOneAndDelete({ id }).lean().exec();
        return deleted;
      },

      // Product CREATE
      addMongoProduct: async (_, { input }) => {
        const recordId = cuid();
        const doc = new models.MongoProduct({
          id: recordId,
          ...input,
        });
        const saved = await doc.save();
        return saved.toJSON();
      },
      updateMongoProduct: async (_, { id, input }) => {
        const updated = await models.MongoProduct.findOneAndUpdate(
          { id },
          { $set: input },
          { new: true, runValidators: true },
        ).lean().exec();
        return updated;
      },
      deleteMongoProduct: async (_, { id }) => {
        const deleted = await models.MongoProduct.findOneAndDelete({ id }).lean().exec();
        return deleted;
      },
      deleteMongoProducts: async (_, { filter }) => {
        const query = buildMongoFilterQuery(filter);
        const toDelete = await models.MongoProduct.find(query).lean().exec();
        await models.MongoProduct.deleteMany(query).exec();
        return toDelete;
      },

      // Connect Mutations
      addToMongoCompanyUsers: async (_, { mongoCompanyId, mongoUserId }) => {
        await models.MongoUser.findOneAndUpdate(
          { id: mongoUserId },
          { $set: { companyId: mongoCompanyId, company: { typeId: mongoCompanyId, type: 'MongoCompany' } } },
        ).exec();
        await models.MongoCompany.findOneAndUpdate(
          { id: mongoCompanyId },
          { $addToSet: { users: { typeId: mongoUserId, type: 'MongoUser' } } },
        ).exec();
        return {
          typeName: 'MongoCompany',
          fieldName: 'users',
          connectedTypeName: 'MongoUser',
          connectedFieldName: 'company',
        };
      },
      removeFromMongoCompanyUsers: async (_, { mongoCompanyId, mongoUserId }) => {
        await models.MongoUser.findOneAndUpdate(
          { id: mongoUserId },
          { $unset: { companyId: '', company: '' } },
        ).exec();
        await models.MongoCompany.findOneAndUpdate(
          { id: mongoCompanyId },
          { $pull: { users: { typeId: mongoUserId } } },
        ).exec();
        return {
          typeName: 'MongoCompany',
          fieldName: 'users',
          connectedTypeName: 'MongoUser',
          connectedFieldName: 'company',
        };
      },

      addToMongoCompanyPosts: async (_, { mongoCompanyId, mongoPostId }) => {
        await models.MongoPost.findOneAndUpdate(
          { id: mongoPostId },
          { $set: { companyId: mongoCompanyId, company: { typeId: mongoCompanyId, type: 'MongoCompany' } } },
        ).exec();
        await models.MongoCompany.findOneAndUpdate(
          { id: mongoCompanyId },
          { $addToSet: { posts: { typeId: mongoPostId, type: 'MongoPost' } } },
        ).exec();
        return {
          typeName: 'MongoCompany',
          fieldName: 'posts',
          connectedTypeName: 'MongoPost',
          connectedFieldName: 'company',
        };
      },
      removeFromMongoCompanyPosts: async (_, { mongoCompanyId, mongoPostId }) => {
        await models.MongoPost.findOneAndUpdate(
          { id: mongoPostId },
          { $unset: { companyId: '', company: '' } },
        ).exec();
        await models.MongoCompany.findOneAndUpdate(
          { id: mongoCompanyId },
          { $pull: { posts: { typeId: mongoPostId } } },
        ).exec();
        return {
          typeName: 'MongoCompany',
          fieldName: 'posts',
          connectedTypeName: 'MongoPost',
          connectedFieldName: 'company',
        };
      },

      addToMongoUserPosts: async (_, { mongoUserId, mongoPostId }) => {
        await models.MongoPost.findOneAndUpdate(
          { id: mongoPostId },
          { $set: { authorId: mongoUserId, author: { typeId: mongoUserId, type: 'MongoUser' } } },
        ).exec();
        await models.MongoUser.findOneAndUpdate(
          { id: mongoUserId },
          { $addToSet: { posts: { typeId: mongoPostId, type: 'MongoPost' } } },
        ).exec();
        return {
          typeName: 'MongoUser',
          fieldName: 'posts',
          connectedTypeName: 'MongoPost',
          connectedFieldName: 'author',
        };
      },
      removeFromMongoUserPosts: async (_, { mongoUserId, mongoPostId }) => {
        await models.MongoPost.findOneAndUpdate(
          { id: mongoPostId },
          { $unset: { authorId: '', author: '' } },
        ).exec();
        await models.MongoUser.findOneAndUpdate(
          { id: mongoUserId },
          { $pull: { posts: { typeId: mongoPostId } } },
        ).exec();
        return {
          typeName: 'MongoUser',
          fieldName: 'posts',
          connectedTypeName: 'MongoPost',
          connectedFieldName: 'author',
        };
      },

      addToMongoUserComments: async (_, { mongoUserId, mongoCommentId }) => {
        await models.MongoComment.findOneAndUpdate(
          { id: mongoCommentId },
          { $set: { authorId: mongoUserId, author: { typeId: mongoUserId, type: 'MongoUser' } } },
        ).exec();
        await models.MongoUser.findOneAndUpdate(
          { id: mongoUserId },
          { $addToSet: { comments: { typeId: mongoCommentId, type: 'MongoComment' } } },
        ).exec();
        return {
          typeName: 'MongoUser',
          fieldName: 'comments',
          connectedTypeName: 'MongoComment',
          connectedFieldName: 'author',
        };
      },
      removeFromMongoUserComments: async (_, { mongoUserId, mongoCommentId }) => {
        await models.MongoComment.findOneAndUpdate(
          { id: mongoCommentId },
          { $unset: { authorId: '', author: '' } },
        ).exec();
        await models.MongoUser.findOneAndUpdate(
          { id: mongoUserId },
          { $pull: { comments: { typeId: mongoCommentId } } },
        ).exec();
        return {
          typeName: 'MongoUser',
          fieldName: 'comments',
          connectedTypeName: 'MongoComment',
          connectedFieldName: 'author',
        };
      },

      addToMongoPostComments: async (_, { mongoPostId, mongoCommentId }) => {
        await models.MongoComment.findOneAndUpdate(
          { id: mongoCommentId },
          { $set: { postId: mongoPostId, post: { typeId: mongoPostId, type: 'MongoPost' } } },
        ).exec();
        await models.MongoPost.findOneAndUpdate(
          { id: mongoPostId },
          { $addToSet: { comments: { typeId: mongoCommentId, type: 'MongoComment' } } },
        ).exec();
        return {
          typeName: 'MongoPost',
          fieldName: 'comments',
          connectedTypeName: 'MongoComment',
          connectedFieldName: 'post',
        };
      },
      removeFromMongoPostComments: async (_, { mongoPostId, mongoCommentId }) => {
        await models.MongoComment.findOneAndUpdate(
          { id: mongoCommentId },
          { $unset: { postId: '', post: '' } },
        ).exec();
        await models.MongoPost.findOneAndUpdate(
          { id: mongoPostId },
          { $pull: { comments: { typeId: mongoCommentId } } },
        ).exec();
        return {
          typeName: 'MongoPost',
          fieldName: 'comments',
          connectedTypeName: 'MongoComment',
          connectedFieldName: 'post',
        };
      },
    },

    // Relational Field Resolvers
    MongoCompany: {
      users: async (company) => {
        return models.MongoUser.find({
          $or: [
            { companyId: company.id },
            { 'company.typeId': company.id },
          ],
        }).lean().exec();
      },
      posts: async (company) => {
        return models.MongoPost.find({
          $or: [
            { companyId: company.id },
            { 'company.typeId': company.id },
          ],
        }).lean().exec();
      },
    },

    MongoUser: {
      company: async (user, _, context) => {
        const cId = user.companyId || (user.company && user.company.typeId);
        if (!cId) return null;
        if (context && context.loaders) {
          const loader = context.loaders.getLoader('MongoCompany');
          if (loader) return loader.load(cId);
        }
        return models.MongoCompany.findOne({ id: cId }).lean().exec();
      },
      posts: async (user) => {
        return models.MongoPost.find({
          $or: [
            { authorId: user.id },
            { 'author.typeId': user.id },
          ],
        }).lean().exec();
      },
      comments: async (user) => {
        return models.MongoComment.find({
          $or: [
            { authorId: user.id },
            { 'author.typeId': user.id },
          ],
        }).lean().exec();
      },
    },

    MongoPost: {
      author: async (post, _, context) => {
        const uId = post.authorId || (post.author && post.author.typeId);
        if (!uId) return null;
        if (context && context.loaders) {
          const loader = context.loaders.getLoader('MongoUser');
          if (loader) return loader.load(uId);
        }
        return models.MongoUser.findOne({ id: uId }).lean().exec();
      },
      company: async (post, _, context) => {
        const cId = post.companyId || (post.company && post.company.typeId);
        if (!cId) return null;
        if (context && context.loaders) {
          const loader = context.loaders.getLoader('MongoCompany');
          if (loader) return loader.load(cId);
        }
        return models.MongoCompany.findOne({ id: cId }).lean().exec();
      },
      comments: async (post) => {
        return models.MongoComment.find({
          $or: [
            { postId: post.id },
            { 'post.typeId': post.id },
          ],
        }).lean().exec();
      },
    },

    MongoComment: {
      post: async (comment, _, context) => {
        const pId = comment.postId || (comment.post && comment.post.typeId);
        if (!pId) return null;
        if (context && context.loaders) {
          const loader = context.loaders.getLoader('MongoPost');
          if (loader) return loader.load(pId);
        }
        return models.MongoPost.findOne({ id: pId }).lean().exec();
      },
      author: async (comment, _, context) => {
        const uId = comment.authorId || (comment.author && comment.author.typeId);
        if (!uId) return null;
        if (context && context.loaders) {
          const loader = context.loaders.getLoader('MongoUser');
          if (loader) return loader.load(uId);
        }
        return models.MongoUser.findOne({ id: uId }).lean().exec();
      },
    },
  };

  return makeExecutableSchema({
    typeDefs,
    resolvers,
  });
};
