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
- [🧪 Automated Test Suite (`npm test`)](#-automated-test-suite-npm-test)
- [🔌 Lifecycle Hooks & Event Bus (Birdwatch)](#-lifecycle-hooks--event-bus-birdwatch)
- [📁 Project Directory Structure](#-project-directory-structure)
- [📄 License](#-license)

---

## 🌟 Core Features Overview

| Feature | Description |
| :--- | :--- |
| 🚀 **Pure Schema-Driven (AST)** | Define `.graphql` or `.js` SDL types with `@model` and the AST compiler automatically generates GraphQL queries, mutations, subscriptions, inputs, and resolvers. |
| 🗄️ **Multi-Database Models** | Dynamic **MongoDB (Mongoose)** and **PostgreSQL (Sequelize)** model compilation with automatic index sync and timestamps (`createdAt`, `updatedAt`). |
| 🔗 **Relational Connectors** | Bidirectional (1-to-1, 1-to-N, N-to-N) and OneWay relation joins with automatic connector mutations (`ConnectId`, `ConnectIds`, `addTo<Relation>`, `removeFrom<Relation>`). |
| 🔍 **Powerful Filter Engine** | Nested boolean logic (`and`, `or`), string matchers (`contains`, `startsWith`, `endsWith`), numerical/date ranges (`gt`, `gte`, `lt`, `lte`), and array operators. |
| ⚡ **Real-Time Subscriptions** | Instant WebSocket subscriptions over `subscriptions-transport-ws` and `graphql-ws` with optional Redis PubSub clustering. |
| 🛡️ **Declarative RBAC & Directives** | Enforce field and model level permissions with `@allow` / `@deny` rules across standard framework roles (`ADMIN`, `USER`, `GUEST`). |
| 🔑 **Built-in JWT Authentication** | Signed user tokens, application tokens, static service tokens, configurable expiry, and token blacklisting. |
| 📁 **Multipart File Management** | Built-in `File` model with MIME validation, AWS S3 storage support, and CloudFront CDN asset signing. |
| 🎮 **Interactive GraphQL Playground** | Embedded dark-mode GraphQL IDE available out of the box at `http://localhost:3000/graphql/core`. |
| 🧪 **Comprehensive Test Suite** | Pre-configured Mocha/Babel test suite validating AST generation, models, auth, and query execution. |

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

```graphql
# Direct a model to PostgreSQL instead of MongoDB:
type SalesRecord @model(database: postgres) {
  transactionId: String! @unique
  amount: Float!
  currency: String!
}
```

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

```
  22 passing (14ms)
```

---

## 🔌 Lifecycle Hooks & Event Bus (Birdwatch)

Attach custom asynchronous side-effects, event listeners, and business logic before and after mutations execute:

```javascript
// src/birdwatch/birdwatchConfig.js
const birdWatch = [
  {
    on: ['addUser', 'addPost'],
    do: [
      {
        action: async ({ record, operation, context }) => {
          // Trigger email notification, analytics tracking, webhook, etc.
          console.log(`Event triggered for ${operation}:`, record.id);
        },
      },
    ],
  },
];
```

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
