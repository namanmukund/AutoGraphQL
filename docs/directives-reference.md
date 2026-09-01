# 🛡️ Schema Directives Reference Guide

This document is an exhaustive, technical reference for all **declarative GraphQL schema directives** supported by AutoGraphQL's AST parser, dynamic database model compiler, validation pipeline, and query/mutation resolver engine.

---

## 📑 Table of Contents

1. [Architecture & Model Directives](#1-architecture--model-directives)
2. [Multi-Tenancy & Security Directives](#2-multi-tenancy--security-directives)
3. [Relational & Association Directives](#3-relational--association-directives)
4. [Field Access & Mutation Behavior Directives](#4-field-access--mutation-behavior-directives)
5. [Role-Based Access Control (RBAC) Directives](#5-role-based-access-control-rbac-directives)
6. [Data Transformation & Sanitization Directives](#6-data-transformation--sanitization-directives)
7. [Database Indexing & Query Directives](#7-database-indexing--query-directives)
8. [Caching & Performance Directives](#8-caching--performance-directives)

---

## 1. Architecture & Model Directives

### `@model`
Declares a GraphQL `type` as a persistent database entity. AutoGraphQL automatically compiles CRUD queries, mutations, subscriptions, filter input types, and dynamic ORM/ODM models for this type.

```graphql
directive @model(
  database: DatabaseDialect = mongoose
  secondaryApplications: [String]
) on OBJECT | SCHEMA
```

- **Arguments**:
  - `database`: Specifies the backing database dialect:
    - `mongoose` (or `MONGO`): Compiles a dynamic Mongoose model with MongoDB collection.
    - `postgres` (or `POSTGRES`, `sql`, `sequelize`): Compiles a dynamic Sequelize model with PostgreSQL table.
  - `secondaryApplications`: Array of application names that have cross-app visibility to this model in multi-app setups.
- **Example**:
  ```graphql
  type User @model {
    id: ID!
    username: String!
  }

  type Transaction @model(database: postgres) {
    id: ID!
    amount: Float!
  }
  ```

---

### `@databaseController`
Configures the execution strategy used by `QueryController` when querying MongoDB.

```graphql
directive @databaseController(
  mode: DatabaseControllerMode = cascade
) on OBJECT | SCHEMA | FIELD_DEFINITION | FIELD
```

- **Modes**:
  - `cascade`: Resolves relations using request-scoped DataLoaders across multiple query ticks.
  - `aggregation`: Translates GraphQL selection sets into native, multi-stage MongoDB Aggregation Pipelines (`$match`, `$lookup`, `$project`, `$sort`, `$skip`, `$limit`) executed in a single database roundtrip.
- **Example**:
  ```graphql
  type AnalyticsReport @model @databaseController(mode: aggregation) {
    id: ID!
    category: String!
    revenue: Float!
  }
  ```

---

### `@history` & `@historyModel`
Enables automatic audit logging and temporal version tracking for an entity. Every mutation creates an immutable revision snapshot.

```graphql
directive @history on OBJECT | FIELD_DEFINITION
directive @historyModel on OBJECT | FIELD_DEFINITION
```

- **Behavior**: AutoGraphQL compiles a companion `*History` model and injects temporal queries allowing users to inspect the complete revision history of any document over time.
- **Example**:
  ```graphql
  type Contract @model @history {
    id: ID!
    terms: String!
    value: Float!
  }
  ```

---

## 2. Multi-Tenancy & Security Directives

### `@tenantScoped`
Enforces declarative, row-level multi-tenant data isolation directly on an entity.

```graphql
directive @tenantScoped(
  field: String = "tenantId"
  claim: String = "tenantId"
) on OBJECT
```

- **Arguments**:
  - `field`: The property name on the database model storing the tenant identifier.
  - `claim`: The claim property name extracted from the authenticated JWT token or GraphQL `context` (e.g. `tenantId`, `organizationId`).
- **Guarantees**:
  - **Read Queries**: Automatically injects `{ [field]: context[claim] }` into the query filter, preventing cross-tenant data leaks.
  - **Anti-Spoofing**: Overrides any client-supplied tenant ID argument with the verified token claim.
  - **Create Mutations**: Automatically tags new records with the tenant ID.
  - **Update/Delete Mutations**: Rejects modifications to records owned by other tenants with `PermissionDeniedError`.
  - **Admin Bypass**: Roles `ADMIN`, `SYSTEM`, or requests with `context.bypass = true` bypass tenant filtering.
- **Example**:
  ```graphql
  type Invoice @model @tenantScoped(field: "organizationId", claim: "organizationId") {
    id: ID!
    invoiceNumber: String!
    total: Float!
    organizationId: String!
  }
  ```

---

### `@ownerScoped`
Enforces private, user-level ownership isolation on personal documents.

```graphql
directive @ownerScoped(
  field: String = "userId"
  claim: String = "userId"
) on OBJECT
```

- **Arguments**:
  - `field`: The property name on the model storing the owner ID (default `"userId"`).
  - `claim`: The claim property name in `context.user.id` or `context.userId` (default `"userId"`).
- **Example**:
  ```graphql
  type PrivateNote @model @ownerScoped(field: "authorId", claim: "userId") {
    id: ID!
    content: String!
    authorId: String!
  }
  ```

---

## 3. Relational & Association Directives

### `@relation`
Defines 1:1, 1:N, or N:N relational associations between schema entities.

```graphql
directive @relation(
  name: String
  direction: String
  isSubset: Boolean
  fields: [String]
) on FIELD_DEFINITION | FIELD
```

- **Arguments**:
  - `name`: Unique relationship name linking two matching fields across types.
  - `direction`: Direction of foreign key storage:
    - `"OUT"`: The source entity stores the foreign key or initiates the relation.
    - `"IN"`: The target entity holds the foreign key back-reference.
    - `"BOTH"`: Bidirectional / Many-to-Many association.
  - `fields`: Specific fields included in composite foreign key joins.
- **Example**:
  ```graphql
  type User @model {
    id: ID!
    profile: UserProfile @relation(name: "UserToProfile", direction: "OUT")
    posts: [Post] @relation(name: "UserToPosts", direction: "OUT")
  }

  type UserProfile @model {
    id: ID!
    user: User @relation(name: "UserToProfile", direction: "IN")
  }
  ```

---

### `@relationalMeta`
Generates nested aggregation metadata fields on relational child queries, allowing clients to fetch counts without loading all records.

```graphql
directive @relationalMeta on FIELD_DEFINITION | FIELD
```

- **Example**:
  ```graphql
  type Author @model {
    id: ID!
    posts: [Post] @relation(name: "AuthorToPosts", direction: "OUT")
    postsMeta: Meta @relationalMeta
  }
  ```

---

## 4. Field Access & Mutation Behavior Directives

### `@readOnly`
Declares a field as strictly read-only. It can be queried via GraphQL but is excluded from all `add*` and `update*` mutation input types.

```graphql
directive @readOnly on FIELD_DEFINITION | FIELD
```

- **Example**:
  ```graphql
  type User @model {
    id: ID!
    loginCount: Int @readOnly
    lastLoginAt: Date @readOnly
  }
  ```

---

### `@writeOnly`
Declares a field as write-only. It can be provided in `add*` or `update*` mutation inputs, but is strictly omitted from GraphQL query selection types to prevent sensitive data leakage.

```graphql
directive @writeOnly on FIELD_DEFINITION | FIELD
```

- **Example**:
  ```graphql
  type User @model {
    id: ID!
    passwordHash: String! @writeOnly
    twoFactorSecret: String @writeOnly
  }
  ```

---

### `@defaultValue`
Assigns a static or dynamic default value to a field if not explicitly supplied during record creation.

```graphql
directive @defaultValue(
  value: String
) on FIELD_DEFINITION | FIELD
```

- **Example**:
  ```graphql
  type Account @model {
    id: ID!
    status: String @defaultValue(value: "active")
    roles: [String] @defaultValue(value: "['user']")
    isVerified: Boolean @defaultValue(value: "false")
  }
  ```

---

### `@auto`
Specifies that a field's value is automatically generated by server-side hooks or database triggers rather than client inputs.

```graphql
directive @auto on FIELD_DEFINITION | FIELD
```

---

### `@remote`
Indicates that a field's value is resolved dynamically from an external microservice or remote REST/gRPC endpoint.

```graphql
directive @remote on FIELD_DEFINITION | FIELD
```

---

## 5. Role-Based Access Control (RBAC) Directives

### `@userPermissions`
Enforces granular, role-based CRUD permissions on objects or individual fields.

```graphql
directive @userPermissions(
  permissions: [PermissionInput]
  rule: PermissionRule
  crud: [String]
  read: [String]
  create: [String]
  update: [String]
  delete: [String]
  exceptRead: [String]
  exceptCreate: [String]
  exceptUpdate: [String]
  exceptDelete: [String]
) on OBJECT | FIELD_DEFINITION | FIELD
```

- **Arguments**:
  - `crud`: Roles permitted for all operations (`["ADMIN"]`).
  - `read` / `create` / `update` / `delete`: Roles permitted for specific operations.
  - `exceptRead` / `exceptUpdate`: Blacklist specific roles from operations.
- **Example**:
  ```graphql
  type Salary @model @userPermissions(read: ["ADMIN", "HR"], update: ["ADMIN"]) {
    id: ID!
    amount: Float!
    bonus: Float @userPermissions(read: ["ADMIN"])
  }
  ```

---

### `@appPermissions`
Enforces application-level API token permissions, restricting operations based on client application identity (`web`, `mobile`, `backend_service`).

```graphql
directive @appPermissions(
  permissions: [PermissionInput]
  rule: PermissionRule
  read: [String]
  write: [String]
) on OBJECT | FIELD_DEFINITION | FIELD
```

---

## 6. Data Transformation & Sanitization Directives

### `@trim`
Automatically trims leading and trailing whitespace from string inputs before saving to the database.

```graphql
directive @trim on FIELD_DEFINITION | FIELD
```

- **Example**:
  ```graphql
  type User @model {
    id: ID!
    email: String! @trim
  }
  ```

---

### `@upperCase`
Transforms input string values to uppercase automatically before saving or resolving.

```graphql
directive @upperCase on FIELD_DEFINITION | FIELD
```

- **Example**:
  ```graphql
  type Account @model {
    id: ID!
    currencyCode: String! @upperCase # "usd" -> "USD"
  }
  ```

---

### `@nameCase`
Formats a string into Title Case / Name Case (capitalizes the first letter of each word).

```graphql
directive @nameCase on FIELD_DEFINITION | FIELD
```

- **Example**:
  ```graphql
  type Contact @model {
    id: ID!
    fullName: String! @nameCase # "john doe" -> "John Doe"
  }
  ```

---

### `@clamp`
Restricts numerical values (`Int` or `Float`) to stay strictly within a defined `min` and `max` range.

```graphql
directive @clamp(
  min: Float
  max: Float
) on FIELD_DEFINITION | FIELD
```

- **Example**:
  ```graphql
  type Review @model {
    id: ID!
    rating: Float! @clamp(min: 1.0, max: 5.0)
    percentage: Int! @clamp(min: 0, max: 100)
  }
  ```

---

## 7. Database Indexing & Query Directives

### `@createIndex`
Creates a database index on the specified field in MongoDB or PostgreSQL.

```graphql
directive @createIndex(
  value: Int = 1
  order: Int
) on FIELD_DEFINITION | FIELD
```

- **Behavior**:
  - **MongoDB**: Creates index `{ [field]: value }` (1 for ascending, -1 for descending).
  - **PostgreSQL**:
    - Standard scalars $\rightarrow$ B-Tree index.
    - `JSONB` / Array fields $\rightarrow$ **GIN index (`using: 'GIN'`)** for rapid containment queries (`@>`).
- **Example**:
  ```graphql
  type Product @model {
    id: ID!
    price: Float! @createIndex(value: -1)
    metadata: JSONB @createIndex(value: 1)
  }
  ```

---

### `@unique` & `@uniqueOrEmpty`
Declares a field as unique across all records in the database table/collection.

```graphql
directive @unique on FIELD_DEFINITION | FIELD
directive @uniqueOrEmpty on FIELD_DEFINITION | FIELD
```

- **`@unique`**: Enforces strict uniqueness; duplicate non-null entries cause mutation rejection.
- **`@uniqueOrEmpty`**: Creates a sparse unique index allowing multiple null or empty values while guaranteeing uniqueness for populated values.
- **Example**:
  ```graphql
  type User @model {
    id: ID!
    email: String! @unique
    ssn: String @uniqueOrEmpty
  }
  ```

---

### `@groupBy`
Enables `groupBy` aggregation queries on the target field inside `*Meta` queries.

```graphql
directive @groupBy on FIELD_DEFINITION | FIELD
```

---

### `@filterOff`
Disables filter input generation for this field in GraphQL list queries. Useful for unindexed or high-cardinality fields where filtering could cause slow full-table scans.

```graphql
directive @filterOff on FIELD_DEFINITION | FIELD
```

- **Example**:
  ```graphql
  type LogEntry @model {
    id: ID!
    rawBlob: String @filterOff
  }
  ```

---

## 8. Caching & Performance Directives

### `@cacheControl`
Configures HTTP Cache-Control headers and Redis caching policies for CDN edge nodes, proxies, and Apollo Server.

```graphql
directive @cacheControl(
  maxAge: Int
  scope: CacheControlScope = PUBLIC
  inheritMaxAge: Boolean
) on FIELD_DEFINITION | OBJECT | INTERFACE | UNION
```

- **Arguments**:
  - `maxAge`: Cache time-to-live (TTL) in seconds.
  - `scope`: `PUBLIC` (cacheable by shared CDNs) or `PRIVATE` (cacheable only by user browser).
- **Example**:
  ```graphql
  type GlobalConfig @model @cacheControl(maxAge: 3600, scope: PUBLIC) {
    id: ID!
    maintenanceMode: Boolean!
  }
  ```

---

## 📊 Complete Directives Summary Matrix

| Directive | Target | Primary Use Case |
| :--- | :--- | :--- |
| **`@model`** | `OBJECT` | Declares database model (MongoDB or PostgreSQL) |
| **`@tenantScoped`** | `OBJECT` | Multi-tenant row-level data isolation |
| **`@ownerScoped`** | `OBJECT` | User-ownership data isolation |
| **`@databaseController`** | `OBJECT` | Sets query mode (`cascade` or `aggregation`) |
| **`@history`** | `OBJECT` | Temporal revision history and audit tracking |
| **`@relation`** | `FIELD` | 1:1, 1:N, N:N relational associations & foreign keys |
| **`@relationalMeta`** | `FIELD` | Relational child counts & metadata aggregations |
| **`@readOnly`** | `FIELD` | Excludes field from mutation inputs |
| **`@writeOnly`** | `FIELD` | Excludes sensitive field from query selection sets |
| **`@defaultValue`** | `FIELD` | Sets default value when field is missing |
| **`@auto`** | `FIELD` | Server/database auto-generated value |
| **`@remote`** | `FIELD` | Resolved via external microservice |
| **`@userPermissions`** | `OBJECT`, `FIELD` | Role-based access control (RBAC) |
| **`@appPermissions`** | `OBJECT`, `FIELD` | Client application token permissions |
| **`@trim`** | `FIELD` | Trims leading/trailing whitespace |
| **`@upperCase`** | `FIELD` | Converts string to uppercase |
| **`@nameCase`** | `FIELD` | Formats string to Name / Title Case |
| **`@clamp`** | `FIELD` | Binds numbers within min/max bounds |
| **`@createIndex`** | `FIELD` | Creates B-Tree or GIN database index |
| **`@unique`** | `FIELD` | Enforces unique index constraint |
| **`@uniqueOrEmpty`** | `FIELD` | Sparse unique index allowing empty values |
| **`@filterOff`** | `FIELD` | Disables filter operators on field |
| **`@groupBy`** | `FIELD` | Enables groupBy aggregation in `*Meta` |
| **`@cacheControl`** | `OBJECT`, `FIELD` | HTTP CDN & Redis cache headers |
