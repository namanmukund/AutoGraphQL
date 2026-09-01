# ⚡ AutoGraphQL

> **Schema-First, AST-Driven Auto-Generated GraphQL Backend Engine & Database Framework for Node.js**  
> Define your database models once using standard GraphQL SDL with declarative directives (`@model`, `@relation`, `@defaultValue`, `@unique`, `@readOnly`, `@writeOnly`, `@clamp`, `@allow`, `@deny`), and immediately get dynamic MongoDB / PostgreSQL models, full-featured CRUD APIs, complex nested filtering, batch mutations, relational connectors, and real-time WebSocket subscriptions.

---

## 📑 Table of Contents

- [🌟 Core Features Overview](#-core-features-overview)
- [📦 Starter Template & Reference Schema (User & UserProfile)](#-starter-template--reference-schema-user--userprofile)
- [🎯 Real-World Use Cases](#-real-world-use-cases)
  - [1. Headless CMS & Content Publishing](#1-headless-cms--content-publishing)
  - [2. Multi-Tenant B2B SaaS & Project Management](#2-multi-tenant-b2b-saas--project-management)
  - [3. E-Commerce & Marketplace Backend](#3-e-commerce--marketplace-backend)
  - [4. Real-Time Chat & Collaborative Platforms](#4-real-time-chat--collaborative-platforms)
- [⚡ Quickstart (60-Second Setup)](#-quickstart-60-second-setup)
- [🛠️ How It Works: The 1-Step Workflow](#️-how-it-works-the-1-step-workflow)
- [📖 GraphQL API Surface & Examples](#-graphql-api-surface--examples)
  - [Single & Plural Queries with Filtering and Pagination](#single--plural-queries-with-filtering-and-pagination)
  - [Aggregation & Metadata Queries](#aggregation--metadata-queries)
  - [CRUD Mutations & Batch Operations](#crud-mutations--batch-operations)
  - [Relational Connectors & Foreign Key Joins](#relational-connectors--foreign-key-joins)
  - [Real-Time WebSocket Subscriptions](#real-time-websocket-subscriptions)
- [🛡️ Declarative Schema Directives Reference](#️-declarative-schema-directives-reference)
- [🔍 Advanced Filtering & Operator Engine](#-advanced-filtering--operator-engine)
- [🔐 Authentication & Token Lifecycle](#-authentication--token-lifecycle)
- [💾 Multi-Database Architecture (MongoDB & PostgreSQL)](#-multi-database-architecture-mongodb--postgresql)
- [🏢 Multi-Tenancy & Row-Level Security (RLS)](#-multi-tenancy--row-level-security-rls)
- [🛡️ Production Reliability & Safeguards](#-production-reliability--safeguards)
- [⚡ Event-Driven Automation & Webhooks (Birdwatch)](#-event-driven-automation--webhooks-birdwatch)
- [🛠️ Developer & CI/CD Tooling](#️-developer--cicd-tooling)
- [🧪 Automated Test Suite (`npm test`)](#-automated-test-suite-npm-test)
- [📁 Project Directory Structure](#-project-directory-structure)
- [📄 License](#-license)

---

## 🌟 Core Features Overview

| Feature | Description |
| :--- | :--- |
| 🚀 **Pure Schema-Driven (AST)** | Define `.graphql` or `.js` SDL types with `@model` and the AST compiler automatically generates GraphQL queries, mutations, subscriptions, inputs, and resolvers. |
| 🗄️ **Multi-Database Models** | Dynamic **MongoDB (Mongoose)** and **PostgreSQL (Sequelize)** model compilation with automatic index sync and timestamps (`createdAt`, `updatedAt`). |
| 🏢 **Declarative Multi-Tenancy (RLS)** | Row-Level Security directives (`@tenantScoped`, `@ownerScoped`) automatically inject tenant isolation constraints into queries and mutations, preventing cross-tenant data leaks. |
| 🔗 **Relational Connectors** | Bidirectional (1-to-1, 1-to-N, N-to-N) and OneWay relation joins with automatic connector mutations (`ConnectId`, `ConnectIds`, `addTo<Relation>`, `removeFrom<Relation>`). |
| ⚡ **DataLoader & N+1 Prevention** | Request-scoped DataLoader batching merges relational lookups into single database queries across MongoDB and PostgreSQL. |
relational lookups into single database queries with in-memory tick memoization. |
| 🛡️ **Query Depth & Complexity Protection** | AST visitor validation rules reject runaway, deeply-nested, or computationally prohibitive queries before resolver execution. |
| 🩺 **Kubernetes Health Probes** | Cloud-native `/health/live` (liveness) and `/health/ready` (readiness verifying MongoDB, Postgres, and Redis connections) endpoints. |
| 📡 **Transactional Outbox & Webhooks** | Guaranteed event delivery with HMAC-SHA256 signing, exponential backoff retries, and in-process Birdwatch listeners. |
| 🛡️ **Schema Governance & Diffing** | Automated breaking-change detection in CI/CD pipelines classifying `BREAKING`, `DANGEROUS`, and `SAFE` changes. |
| 📦 **Automated TypeScript SDK** | One-command compilation of schema AST into strongly-typed TypeScript models, input types, and `AutoGraphQLClient`. |
| ⚡ **Persisted Queries (APQ) & Safelisting** | Automatic Persisted Queries with SHA256 hashing and optional production safelisting (`PERSISTED_QUERIES_ONLY=true`). |
| 🔍 **Powerful Filter Engine** | Nested boolean logic (`and`, `or`), string matchers (`contains`, `startsWith`, `endsWith`), numerical/date ranges (`gt`, `gte`, `lt`, `lte`), and array operators. |
| ⚡ **Real-Time Subscriptions** | Instant WebSocket subscriptions over `subscriptions-transport-ws` and `graphql-ws` with optional Redis PubSub clustering. |
| 🛡️ **Declarative RBAC & Directives** | Enforce field and model level permissions with `@allow` / `@deny` rules across standard framework roles (`ADMIN`, `USER`, `GUEST`). |
| 🔑 **Built-in JWT Authentication** | Signed user tokens, application tokens, static service tokens, configurable expiry, and token blacklisting. |
| 📁 **Multipart File Management** | Built-in `File` model with MIME validation, AWS S3 storage support, and CloudFront CDN asset signing. |
| 🎮 **Interactive GraphQL Playground** | Embedded dark-mode GraphQL IDE available out of the box at `http://localhost:3000/graphql/core`. |
| 🧪 **Comprehensive Test Suite** | Pre-configured Mocha/Babel test suite validating AST generation, models, auth, execution, and reliability safeguards. |

---

## 📦 Starter Template & Reference Schema (User & UserProfile)

> 💡 **Educational Starter Reference**: The `User` and `UserProfile` types included in [`graphqlSchema/core/types/`](graphqlSchema/core/types/) are provided purely as a **starter template and reference schema**. They demonstrate 1-to-1 bidirectional relationships, declarative directives, and authentication handling.  
> **You can freely modify, extend, or completely remove these types** to design whatever custom domain models your application needs!

```graphql
type User @model {
  name: String @trim @nameCase
  role: UserRole! @defaultValue(value: "user")
  status: Status! @defaultValue(value: "active") @readOnly
  username: String @uniqueOrEmpty @trim
  password: String @filterOff @writeOnly
  email: String @uniqueOrEmpty @trim
  emailVerified: Boolean @defaultValue(value: "false") @readOnly
  phone: Phone @uniqueOrEmpty
  profile: UserProfile @relation(name: "UserProfileRelation")
  posts: [Post] @relation(name: "UserPosts")
  comments: [Comment] @relation(name: "UserComments")
}

type UserProfile @model {
  user: User @relation(name: "UserProfileRelation")
  headline: String @trim
  bio: String
  website: String @trim
  github: String @trim
  twitter: String @trim
  linkedin: String @trim
  location: String
  company: String
  skills: [String]
}
```

---

## 🎯 Real-World Use Cases

### 1. Headless CMS & Content Publishing
Build backends for publishing platforms, blogs, and news feeds:
- **Models**: `Post`, `Category`, `Tag`, `Comment`, `File`, `User`.
- **Key Features**: Slug uniqueness, tag relations, media file attachments, and nested comment trees.

```graphql
type Post @model {
  title: String! @trim
  slug: String! @unique
  content: String!
  status: PostStatus! @defaultValue(value: "draft")
  viewsCount: Int @defaultValue(value: "0")
  author: User! @relation(name: "UserPosts")
  category: Category @relation(name: "CategoryPosts", direction: "OneWay")
  tags: [Tag] @relation(name: "TagPosts")
  comments: [Comment] @relation(name: "PostComments")
}
```

---

### 2. Multi-Tenant B2B SaaS & Project Management
Create scalable backends for SaaS platforms with multi-tenancy and team hierarchy:
- **Models**: `Organization`, `Workspace`, `Project`, `Task`, `Member`.
- **Key Features**: Declarative `@allow` per role (`ADMIN`, `USER`), compound filtering by workspace ID, and real-time task updates.

```graphql
type Project @model {
  name: String! @trim
  description: String
  status: ProjectStatus! @defaultValue(value: "active")
  lead: User @relation(name: "LeadProjects", direction: "OneWay")
  tasks: [Task] @relation(name: "ProjectTasks")
}
```

---

### 3. E-Commerce & Marketplace Backend
Power modern online stores and digital marketplaces:
- **Models**: `Product`, `Category`, `Order`, `OrderItem`, `Review`, `Customer`.
- **Key Features**: Numerical validation with `@clamp`, SKU indexing with `@unique`, relational aggregation (`productsMeta { count }`), and inventory tracking.

```graphql
type Product @model {
  title: String! @trim @nameCase
  sku: String! @unique
  price: Float! @clamp(min: 0)
  stockQuantity: Int! @defaultValue(value: "0")
  category: Category @relation(name: "CategoryProducts")
}
```

---

### 4. Real-Time Chat & Collaborative Platforms
Build real-time messaging, notifications, and live presence:
- **Models**: `ChatRoom`, `Message`, `Participant`.
- **Key Features**: Auto-generated GraphQL subscriptions (`message(filter: { chatRoom_id: $roomId })`), relational connectors, and unread counters.

```graphql
type Message @model {
  content: String!
  chatRoom: ChatRoom! @relation(name: "ChatRoomMessages")
  sender: User! @relation(name: "UserMessages", direction: "OneWay")
}
```

---

## ⚡ Quickstart (60-Second Setup)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/autographql.git
cd autographql
npm install
```

### 2. Configure Environment & Start Local Databases
```bash
cp .env.example .env
npm run db:up    # Starts MongoDB, PostgreSQL, and Redis via Docker Compose
```

### 3. Launch the Development Server
```bash
npm run dev
```

### 4. Open GraphQL Playground
Navigate to **`http://localhost:3000/graphql/core`** in your browser to start querying your API!

---

## 🛠️ How It Works: The 1-Step Workflow

To create a new database collection and a complete GraphQL API, create a file in `graphqlSchema/core/types/<name>/<Name>.js`:

```graphql
// graphqlSchema/core/types/product/Product.js
const Product = `
  type Product @model {
    name: String! @trim
    sku: String! @unique
    price: Float! @clamp(min: 0)
    stock: Int @defaultValue(value: "0")
    category: Category @relation(name: "CategoryProducts")
  }
`;
export default [Product];
```

**That's it.** AutoGraphQL will automatically:
1. Compile Mongoose / PostgreSQL database models with indexes and validation.
2. Generate queries: `product(id: ID)`, `products(filter, first, skip, orderBy)`, `productsMeta(filter)`.
3. Generate CRUD mutations: `addProduct`, `updateProduct`, `updateProducts`, `deleteProduct`, `deleteProducts`.
4. Generate relational connectors: `categoryConnectId`, `addToCategory`, `removeFromCategory`.
5. Generate real-time subscriptions: `product(filter: ...)` WebSocket events.

---

## 📖 GraphQL API Surface & Examples

### Single & Plural Queries with Filtering and Pagination

```graphql
# Fetch users with filtering, sorting, and relational profile expansion
query FetchActiveUsers {
  users(
    filter: {
      and: [
        { status: active }
        { email_contains: "@example.com" }
      ]
    }
    first: 10
    skip: 0
    orderBy: { createdAt: DESC }
  ) {
    id
    name
    email
    username
    role
    profile {
      headline
      bio
      company
      skills
    }
    createdAt
  }
}
```

---

### Aggregation & Metadata Queries

> [!TIP]
> 📖 **Full Guide**: See **[`docs/count-and-aggregations-guide.md`](docs/count-and-aggregations-guide.md)** for total counts, filtered counts, group-by segmentations (`@groupBy`), relational child counts (`@relationalMeta`), and multi-tenant RLS.

```graphql
# Count total users matching filter criteria
query CountActiveUsers {
  usersMeta(filter: { status: active }) {
    count
  }
}
```

---

### CRUD Mutations & Batch Operations

```graphql
# 1. Create a new User
mutation CreateUser {
  addUser(
    input: {
      name: "Alex Mercer"
      email: "alex@example.com"
      username: "alexmercer"
      password: "SuperSecurePassword123"
    }
  ) {
    id
    name
    email
    username
  }
}

# 2. Update a User by ID
mutation UpdateUser {
  updateUser(
    id: "USER_ID_HERE"
    input: {
      name: "Alex J. Mercer"
      bio: "Software Architect & Open Source Contributor"
    }
  ) {
    id
    name
    bio
    updatedAt
  }
}

# 3. Delete a User
mutation DeleteUser {
  deleteUser(id: "USER_ID_HERE") {
    id
  }
}
```

---

### Relational Connectors & Foreign Key Joins

```graphql
# Create a UserProfile and connect it directly to an existing User
mutation CreateAndConnectProfile {
  addUserProfile(
    input: {
      headline: "Senior Cloud Engineer"
      company: "Tech Corp"
      skills: ["GraphQL", "Node.js", "Docker"]
    }
    userConnectId: "USER_ID_HERE"
  ) {
    id
    headline
    company
    user {
      id
      name
      email
    }
  }
}
```

---

### Real-Time WebSocket Subscriptions

```graphql
# Listen in real time to newly created or updated users
subscription OnUserUpdated {
  user(filter: { role: user }) {
    mutation
    node {
      id
      name
      email
      status
    }
    updatedFields
  }
}
```

---

## 🛡️ Declarative Schema Directives Reference

> [!TIP]
> 📖 **Full Reference Guide**: See **[`docs/directives-reference.md`](docs/directives-reference.md)** for exhaustive documentation, arguments, behavior, and code examples for all 25+ supported schema directives.

| Directive | Target | Purpose | Example |
| :--- | :--- | :--- | :--- |
| **`@model`** | `Type` | Registers type for dynamic database model compilation and GraphQL CRUD generation. | `type Post @model { ... }` |
| **`@relation`** | `Field` | Establishes 1-to-1, 1-to-N, or N-to-N joins between models. | `author: User @relation(name: "UserPosts")` |
| **`@defaultValue`** | `Field` | Sets a default value on creation. | `status: Status @defaultValue(value: "active")` |
| **`@unique`** | `Field` | Enforces unique index constraint in database. | `sku: String! @unique` |
| **`@uniqueOrEmpty`** | `Field` | Enforces unique constraint while permitting null/empty strings. | `email: String @uniqueOrEmpty` |
| **`@readOnly`** | `Field` | Prevents client mutation (system-managed field). | `emailVerified: Boolean @readOnly` |
| **`@writeOnly`** | `Field` | Strips field from GraphQL query responses (e.g. password). | `password: String @writeOnly` |
| **`@filterOff`** | `Field` | Excludes field from generated Filter input types. | `password: String @filterOff` |
| **`@clamp`** | `Field` | Validates minimum / maximum numeric values or string lengths. | `price: Float @clamp(min: 0)` |
| **`@trim`** | `Field` | Automatically trims leading/trailing whitespace. | `name: String @trim` |
| **`@nameCase`** | `Field` | Capitalizes words to proper title/name case. | `name: String @nameCase` |
| **`@allow`** / **`@deny`** | `Type`/`Field`| Declarative role-based access control. | `@allow(role: ["admin"], operations: [create, delete])` |

---

## 🔍 Advanced Filtering & Operator Engine

AutoGraphQL supports deep MongoDB-style filtering across all queries:

```graphql
# Complex filter combinations
filter: {
  and: [
    { price_gte: 50.0 }
    { price_lte: 500.0 }
    {
      or: [
        { category_id: "CAT_1" }
        { tags_contains: "featured" }
      ]
    }
  ]
}
```

### Available Filter Operators

- **Logical**: `and`, `or`, `not`
- **Equality**: `field`, `field_not`
- **Substring Matchers**: `field_contains`, `field_startsWith`, `field_endsWith`, `field_not_contains`
- **Numeric & Date Comparisons**: `field_gt`, `field_gte`, `field_lt`, `field_lte`
- **Set Inclusion**: `field_in`, `field_not_in`, `field_exists`
- **Array Mutations**: `push`, `pushMany`, `pushToSet`, `pop`, `popFront`, `popBack`, `popAll`, `replace`

---

## 🔐 Authentication & Token Lifecycle

AutoGraphQL comes with a full JWT authentication suite:

```javascript
import { createToken, verifyToken, createAppToken, verifyAppToken } from './src/auth';

// 1. Generate User JWT
const token = createToken({ id: 'user_123', username: 'alex', role: 'user' });

// 2. Verify User JWT
const decoded = verifyToken(token);
// => { userInfo: { id: 'user_123', username: 'alex' } }

// 3. Application Static Tokens
const appToken = createAppToken('web');
const appData = verifyAppToken(appToken);
// => { appInfo: { name: 'web' } }
```

---

## 💾 Multi-Database Architecture (MongoDB & PostgreSQL)

AutoGraphQL provides seamless support for dual databases:
- **MongoDB (Primary)**: Powered by Mongoose for unstructured/semi-structured application models.
- **PostgreSQL (Secondary)**: Powered by Sequelize for relational schemas, transactional ledger data, and analytical tables.

> [!TIP]
> 📖 **Comprehensive Guides & Examples**:
> - 🍃 **[MongoDB Guide & Examples (`docs/mongodb-guide.md`)](docs/mongodb-guide.md)**: Embedded sub-documents, multi-key indexes, aggregations, and real-time subscriptions.
> - 🐘 **[PostgreSQL Guide & Examples (`docs/postgresql-guide.md`)](docs/postgresql-guide.md)**: Sequelize data types, B-Tree and GIN indexes, 1:1 / 1:N / N:N relational joins, ILIKE filter operators, and multi-tenant RLS.

### Dynamic PostgreSQL Model Compilation
Declare a model with `database: postgres` in GraphQL SDL, and AutoGraphQL automatically compiles the AST into a Sequelize model at startup:

```graphql
# Direct a model to PostgreSQL instead of MongoDB:
type SalesRecord @model(database: postgres) {
  id: ID!
  transactionId: String! @unique
  amount: Float!
  currency: String!
  isSettled: Boolean! @defaultValue(value: "false")
  createdAt: Date!
}
```

- **Type Mapping**: Converts GraphQL types (`String`, `Int`, `Float`, `Boolean`, `Date`, `JSON`) into native Sequelize `DataTypes` (`STRING`, `INTEGER`, `FLOAT`, `BOOLEAN`, `DATE`, `JSONB`).
- **Constraints & Indexes**: Automatically configures `unique`, `allowNull`, `defaultValue`, and `@createIndex` indexes.
- **Polymorphic Execution**: `QueryController` and `DataLoader` automatically detect PostgreSQL models (`isPgModel: true`) and route operations through Sequelize (`findAll`, `findByPk`, `findOne`, `count`).

---

## 🏢 Multi-Tenancy & Row-Level Security (RLS)

AutoGraphQL provides declarative Row-Level Security (RLS) and multi-tenancy enforcement directly within your GraphQL schema:

### 1. Declarative Schema Directives

```graphql
# Enforce tenant isolation on organization-scoped entities
type Project @model @tenantScoped(field: "organizationId", claim: "organizationId") {
  id: ID!
  name: String!
  budget: Float
  organizationId: String!
}

# Enforce user-ownership isolation on private documents
type UserNote @model @ownerScoped(field: "userId", claim: "userId") {
  id: ID!
  content: String!
  userId: String!
}
```

### 2. Automatic Read Query Constraint Injection
When a user or tenant queries a scoped entity (`projects`, `project(id: ...)`), the RLS engine automatically:
- Extracts the tenant claim (`context.tenantId`, `context.user.organizationId`, or `context.app.tenantId`).
- Injects the isolation filter: `{ organizationId: "org_123" }`.
- **Anti-Spoofing Guarantee**: If a client passes `{ organizationId: "other_org" }` in the GraphQL filter argument, the RLS engine strictly overrides it with the verified token claim.

### 3. Automatic Write Tagging & Mutation Ownership
- **Create Mutations**: Automatically attaches `organizationId` or `userId` to the incoming record payload.
- **Update & Delete Mutations**: Validates that the record belongs to the active tenant before allowing modifications, rejecting cross-tenant mutations with `PermissionDeniedError`.
- **Admin Bypass**: Users with role `ADMIN`, `SYSTEM`, or internal bypass tokens (`context.bypass = true`) can query and manage data across all tenants freely.

---

## 🛡️ Production Reliability & Safeguards

AutoGraphQL includes built-in protection against common GraphQL production vulnerabilities and bottlenecks:

### 1. Request-Scoped DataLoader (N+1 Query Resolution)
When resolving nested relations (e.g., `users { profile { ... } }`), AutoGraphQL instantiates request-scoped DataLoaders inside the Apollo and WebSocket execution context. Sibling lookups are batched into a single `$in` query across MongoDB and PostgreSQL:
```javascript
// Automatically batches individual lookups:
// MongoDB:   Model.find({ id: { $in: ['id1', 'id2', 'id3', ...] } })
// Sequelize: Model.findAll({ where: { id: ['id1', 'id2', 'id3', ...] } })
```
- **Memoization**: Duplicate IDs within the same request tick are deduplicated automatically.
- **Isolation**: Fresh loaders are instantiated per request, preventing cross-tenant or cross-request memory leaks.

### 2. Query Depth & Complexity Limiting
Protect production servers from denial-of-service (DoS) and runaway recursive queries before resolvers touch the database:
- **Depth Limiting**: Enforces a maximum selection depth (configured via `GRAPHQL_MAX_DEPTH`, default `8`). Introspection queries (`__schema`, `__type`) are automatically exempted.
- **Complexity / Cost Analysis**: Computes computational cost based on scalar fields, relations, and pagination multipliers (`first`, `last`). Rejects queries exceeding `GRAPHQL_MAX_COMPLEXITY` (default `1000`).

### 3. Kubernetes Health & Readiness Probes
Cloud-native health endpoints designed for Kubernetes, ECS, or Docker Swarm:
- `GET /health/live` (or `/live`, `/healthz`): Liveness probe verifying process responsiveness and uptime.
- `GET /health/ready` (or `/ready`, `/readyz`): Readiness probe validating active connections to MongoDB (`readyState === 1`), PostgreSQL, and Redis. Returns HTTP 503 if critical dependencies are down.
- `GET /health`: Detailed service health breakdown with backward compatibility.

---

## 🧪 Automated Test Suite (`npm test`)

AutoGraphQL includes a complete automated test suite verifying all core features using `User` and `UserProfile` as baseline models:

```bash
npm test
```

### Test Coverage Highlights:
- ✅ **AST Schema Generation**: Validates single queries, list queries, filters, metadata queries, and real-time subscriptions.
- ✅ **Dynamic Database Models**: Validates Mongoose schema compilation, path mappings, and auto-timestamps.
- ✅ **Authentication & Token Lifecycle**: Validates JWT creation, expiry calculation, tamper resistance, and RBAC roles.
- ✅ **Execution Engine**: Validates AST introspection and end-to-end `graphql()` query execution.
- ✅ **Phase 1 Reliability & Performance**: Validates request-scoped DataLoader batching, ID deduplication, depth limiting, complexity limiting, and Kubernetes health probes.
- ✅ **Phase 2 Event-Driven Automation**: Validates mutation event extraction, in-process listener argument mapping, transactional outbox persistence, HMAC-SHA256 signature generation, exponential backoff, and end-to-end HTTP webhook delivery.
- ✅ **Phase 3 Developer & CI/CD Tooling**: Validates AST schema diffing & breaking-change detection, automated TypeScript client SDK compilation, and Automatic Persisted Queries (APQ) with safelisting.
- ✅ **Phase 4 Architecture Expansion**: Validates dynamic PostgreSQL (Sequelize) AST model compilation, polymorphic queries, Sequelize DataLoader batching, and declarative Row-Level Security (RLS) multi-tenant isolation.

```
  70 passing (53ms)
```

---

## ⚡ Event-Driven Automation & Webhooks (Birdwatch)

AutoGraphQL features a production-grade, event-driven engine combining **in-process listeners**, a **Transactional Outbox**, and an **authenticated HTTP Webhook Dispatcher**.

### 1. Standard Event Schema
Every successful mutation produces a standardized event payload:
```json
{
  "id": "evt_clx123abc456",
  "event": "addUser",
  "operation": "CREATE",
  "entityName": "User",
  "data": { "id": "u_1", "name": "Alice", "email": "alice@example.com" },
  "params": { "input": { "name": "Alice" } },
  "metadata": {
    "timestamp": "2026-09-01T10:00:00.000Z",
    "appName": "admin-portal",
    "userId": "usr_999",
    "userRole": "ADMIN"
  }
}
```

### 2. In-Process Mutation Listeners (`birdwatchConfig.js`)
Trigger asynchronous in-process tasks, analytics, or background side-effects:
```javascript
// src/birdwatch/birdwatchConfig.js
const birdWatch = [
  {
    on: ['addUser', 'addPost'],
    do: [
      {
        action: async ({ record, operation, context, event }) => {
          // Send welcome email, trigger notification, or sync to CRM
          console.log(`Event triggered for ${operation} on ${record.id}`);
        },
      },
    ],
  },
];
```

### 3. Outgoing Webhooks & HMAC-SHA256 Signing
Subscribe external microservices, Zapier, Make, or custom HTTP endpoints to mutation events:
```javascript
import { registerWebhook } from './src/birdwatch';

registerWebhook({
  url: 'https://api.external-service.com/webhooks/autographql',
  events: ['addUser', 'update*'], // Exact names or wildcard patterns
  secret: process.env.AUTOGRAPHQL_WEBHOOK_SECRET,
  headers: {
    Authorization: 'Bearer external-api-token',
  },
});
```

#### Security Headers Sent to Webhooks:
- `X-AutoGraphQL-Event`: The name of the mutation event (e.g. `addUser`).
- `X-AutoGraphQL-Delivery`: Unique delivery attempt ID (`del_...`).
- `X-AutoGraphQL-Signature`: HMAC-SHA256 signature (`sha256=<hex>`) calculated over the raw JSON payload using the configured secret.
- `X-AutoGraphQL-Timestamp`: ISO timestamp to guard against replay attacks.

### 4. Transactional Outbox & Exponential Backoff
- **Non-Blocking**: User mutations return immediately; events are enqueued to the Outbox.
- **Reliable Worker**: The background outbox worker polls and delivers events to all registered webhooks.
- **Exponential Backoff**: If an endpoint returns HTTP 4xx/5xx or encounters network errors, retries are scheduled with exponential delays ($\min(2^{\text{attempt}} \times 1000, 60000)\text{ms}$). Events are marked permanently `FAILED` only after exceeding max attempts (default 5).

---

## 🛠️ Developer & CI/CD Tooling

### 1. Schema Governance & Breaking-Change Linter
Prevent breaking GraphQL schema changes from reaching production:

```bash
# 1. Export current executable schema to baseline file
npm run schema:dump

# 2. Compare current schema against baseline in CI/CD (exits with code 1 on breaking changes)
npm run schema:diff -- --base schema.graphql
```

#### Diff Report Formats:
- `--format console` (default): Colored terminal output for developer CLI workflows.
- `--format markdown`: GitHub Actions PR comment markdown table.
- `--format json`: Machine-readable JSON output for automated pipelines.

### 2. Automated TypeScript Client SDK Generator
Generate a fully type-safe TypeScript client and interfaces directly from your schema AST:

```bash
npm run codegen:sdk
```

Outputs `sdk/index.ts` containing:
- TypeScript interfaces for all `@model` entities (`User`, `UserProfile`, `Post`, etc.).
- Input types (`CreateUserInput`, `UpdateUserInput`, `UsersFilter`, etc.).
- `AutoGraphQLClient` with type-safe methods:

```typescript
import { AutoGraphQLClient } from './sdk';

const client = new AutoGraphQLClient({
  endpoint: 'http://localhost:3000/graphql/core',
  token: 'user_jwt_token',
});

// Type-safe entity queries and mutations
const user = await client.user.findById('usr_123', 'id name email');
const users = await client.user.findMany({ name: { contains: 'Alice' } }, 'id name');
const newUser = await client.user.create({ name: 'Bob', email: 'bob@example.com' }, 'id name');
const updated = await client.user.update('usr_123', { name: 'Alice Smith' });
await client.user.delete('usr_123');
```

### 3. Automatic Persisted Queries (APQ) & Production Safelisting
Reduce bandwidth and protect production servers from arbitrary large queries:

- **Standard APQ**: Clients send `{ extensions: { persistedQuery: { version: 1, sha256Hash: "<hash>" } } }`. The server caches queries in memory or Redis and resolves hashes instantly.
- **Production Safelisting (`PERSISTED_QUERIES_ONLY=true`)**: Locks down execution to only pre-approved queries loaded from `PERSISTED_QUERIES_MANIFEST` (e.g. `persisted-queries.json`). Any unregistered arbitrary queries are rejected with `PERSISTED_QUERY_NOT_SUPPORTED`.

---

## 📁 Project Directory Structure

```
AutoGraphQL/
├── config/                       # Mongoose, Sequelize, Redis, APM & SMS configs
│   ├── authParams/               # JWT token secrets and expiry rules
│   ├── mongoDb/                  # MongoDB connection URI settings
│   ├── postgreSQL/               # PostgreSQL credentials and options
│   └── redis/                    # Redis cache and PubSub configuration
├── constants/                    # Directives, filters, scalar types & sanitized error definitions
│   ├── errors/                   # Generic GraphQL & Database error classes
│   └── roles.js                  # Standard framework roles (ADMIN, USER, GUEST)
├── docs/                         # In-depth architectural guides & query/mutation examples
│   ├── count-and-aggregations-guide.md # Total counts, filtered counts, groupBy, and relational counts
│   ├── directives-reference.md   # Exhaustive reference guide for all 25+ schema directives
│   ├── file-management-guide.md  # GraphQL multipart uploads, AWS S3/CloudFront, and entity linking
│   ├── mongodb-guide.md          # Complete MongoDB schema, query, mutation & aggregation guide
│   └── postgresql-guide.md       # Complete PostgreSQL joins, GIN indexes, and RLS guide
├── docker-compose.yml            # Docker stack (MongoDB, PostgreSQL, Redis)
├── graphqlSchema/                # GraphQL SDL models (User, UserProfile, Post, Comment, Category, Tag, File)
├── scripts/                      # DB index synchronization utilities
├── src/                          # Pure AutoGraphQL AST & GraphQL core engine
│   ├── app.js                    # Express + Apollo Server lifecycle with GraphQL Playground
│   ├── auth/                     # JWT token signing, verification, and expiry helpers
│   ├── autoGenerate/             # Core AST Parser, Model & Resolver Auto-Generator
│   ├── connectDB.js              # Database connection manager (MongoDB + PostgreSQL)
│   ├── graphql/                  # Executable Schema & Directive Resolvers
│   └── serverCloud.js            # Server entry point
├── test/                         # Comprehensive unit & integration test suites
├── utils/                        # Authentication, date, math, and logging utilities
├── .env.example                  # Comprehensive environment variable template
├── package.json                  # Modernized dependencies (Node 18+)
├── LICENSE                       # MIT License
└── README.md                     # Documentation & usage guide
```

---

## 📄 License

This project is open-sourced under the [MIT License](LICENSE).
AutoGraphQL Contributors &copy; 2026.
