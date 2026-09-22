# ⚡ AutoGraphQL

### Let AI design your backend. Let AutoGraphQL build it.

<p align="center">
  <a href="https://github.com/namanmukund/AutoGraphQL/actions/workflows/ci.yml"><img src="https://github.com/namanmukund/AutoGraphQL/actions/workflows/ci.yml/badge.svg" alt="AutoGraphQL CI" /></a>
  <a href="https://github.com/namanmukund/AutoGraphQL/stargazers"><img src="https://img.shields.io/github/stars/namanmukund/AutoGraphQL?style=flat&color=yellow" alt="GitHub Stars" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="package.json"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node.js Version" /></a>
  <a href="https://graphql.org"><img src="https://img.shields.io/badge/GraphQL-15.8-E10098.svg?logo=graphql&logoColor=white" alt="GraphQL" /></a>
  <a href="docs/postgresql-guide.md"><img src="https://img.shields.io/badge/Databases-MongoDB%20%7C%20PostgreSQL-336791.svg" alt="Databases" /></a>
  <a href="sdk"><img src="https://img.shields.io/badge/TypeScript-SDK%20Ready-3178C6.svg?logo=typescript&logoColor=white" alt="TypeScript SDK Ready" /></a>
</p>

AI coding tools like Claude Code, Cursor and Copilot have changed how we build software. You can describe a feature and get working code in minutes.

But there is a catch.

As applications and teams get larger, **everyone — and sometimes every AI agent — starts building the backend differently.**

One developer writes one pattern.  
Another uses a different one.  
An AI agent generates another.  
Then comes the debugging, refactoring, testing and maintaining.  

And every iteration consumes more AI context and tokens.

### What if AI didn't have to write all that backend code?

That's the idea behind **AutoGraphQL**.

Instead of asking AI to generate hundreds of lines of backend code for every feature, you define **what your data and APIs should look like** — using GraphQL SDL or through the Studio.

AutoGraphQL takes care of the rest.

**Schema → Backend**

Define your schema once, and AutoGraphQL generates the backend infrastructure around it — database models, CRUD APIs, relations, filtering, authentication, subscriptions, DataLoaders, webhooks and more.

So your workflow becomes:

**You + AI → Design the schema**  
**AutoGraphQL → Builds the backend**  
**You → Build the product**  

### 🚀 Why this matters

| Metric | Traditional AI Code Generation (Cursor / Claude) | ⚡ AutoGraphQL + AI |
| :--- | :--- | :--- |
| **Token Consumption** | ~5,000 – 15,000 tokens (reading/writing routers, ORMs, resolvers) | **~150 – 300 tokens** (1 concise SDL definition) |
| **Files Modified** | 4 to 8 files per feature | **1 file** (`schemas/*.graphql`) |
| **Architectural Drift** | High (different agents/devs invent different patterns) | **Zero** (100% deterministic framework compiler) |
| **N+1 Query & DataLoader Bugs** | Common AI hallucination / oversight | **Automated** (Zero N+1 via built-in DataLoaders) |
| **Testing & Debugging Loops** | Multiple iterations to fix imports, types, and syntax | **Instant** (Compiles at boot; zero glue code) |

<br />

**Less AI code generation**  
Don't spend thousands of tokens asking an AI agent to repeatedly create CRUD operations, resolvers, models and boilerplate.

**More consistency**  
The framework generates the backend using the same architecture and conventions every time — regardless of which developer or AI agent is working on the application.

**Less code to maintain**  
You define the intent. The framework handles the repetitive implementation.

**Faster development**  
What might take an AI coding agent multiple iterations of reading files, generating code, running tests and fixing issues can become a schema change that AutoGraphQL turns into a working backend in seconds.

**AI becomes the architect, not the boilerplate generator.**

### 🧠 Think of it this way

Traditional AI-assisted development:

> "Claude, build me a users API."

Then Claude reads your repository, decides how to implement it, writes code, runs tests, fixes errors and potentially changes multiple files.

With AutoGraphQL:

> "Here is my User schema."

And AutoGraphQL generates the backend around it.

AI can still be used — and we think it should be.

Use AI to:

* design your schema
* model your entities
* understand your data relationships
* evolve your API
* explore your application requirements

But let **AutoGraphQL generate the repetitive backend machinery.**

### ⚡ The result

**Less code generation.**  
**Less token consumption.**  
**Less inconsistency.**  
**Less boilerplate.**  
**More control.**  
**More predictable backends.**  

If your application is getting large and you're starting to feel that your AI coding agent is becoming part of the problem as well as the solution, AutoGraphQL is built for that exact space.

---

<p align="center">
  <a href="#-the-magic-example"><strong>The Magic Example</strong></a> •
  <a href="#-why-autographql"><strong>Why AutoGraphQL</strong></a> •
  <a href="#-who-is-autographql-for"><strong>Who It's For</strong></a> •
  <a href="#-quick-start"><strong>Quick Start</strong></a> •
  <a href="#-key-features"><strong>Features</strong></a> •
  <a href="#-autographql-studio--visual-control-plane"><strong>Studio</strong></a> •
  <a href="#️-what-happens-under-the-hood"><strong>Architecture</strong></a> •
  <a href="#-documentation"><strong>Documentation</strong></a>
</p>

<p align="center">
  <em>⭐ If you find AutoGraphQL useful, please consider <a href="https://github.com/namanmukund/AutoGraphQL">starring the repository</a>!</em>
</p>

---

## 🪄 The Magic Example

### 1. Prompt Cursor, Claude Code, or Copilot:

> *"Create a Product model in AutoGraphQL with price clamping, capitalized name, and default stock."*

### 2. The AI writes this single file in `schemas/Product.graphql`:

```graphql
type Product @model {
  id: ID!
  name: String! @trim @nameCase
  price: Float! @clamp(min: 0)
  stock: Int! @defaultValue(value: "0")
  createdAt: Date!
}
```

> 💡 *That's literally all your AI agent generates! AutoGraphQL's AST engine handles the remaining 500+ lines of Mongoose/Sequelize models, CRUD resolvers, DataLoader batches, and WebSocket subscriptions automatically.*

Start the engine:

```bash
npm run dev
```

AutoGraphQL compiles your schema into a fully functional backend:

```
GraphQL SDL (schemas/Product.graphql)
   ↓
⚡ AutoGraphQL AST Engine
   ↓
Database Models (MongoDB / PostgreSQL) + CRUD + Filtering + Relational Joins + WebSocket Subscriptions
   ↓
Production-Ready GraphQL API
```

### Run a query immediately:

```graphql
query GetAffordableProducts {
  products(
    filter: { price_lte: 100, stock_gt: 0 }
    orderBy: price_asc
    first: 10
  ) {
    id
    name
    price
    stock
  }
}
```

### Execute a mutation:

```graphql
mutation CreateProduct {
  addProduct(
    input: {
      name: "mechanical keyboard" # Formatted to "Mechanical Keyboard" via @nameCase
      price: 89.99
      stock: 25
    }
  ) {
    id
    name
    price
  }
}
```

**No resolvers to write. No database migrations to run. No router boilerplate.**

---

## 💡 Why AutoGraphQL?

In a standard Node.js GraphQL project, every entity requires writing and maintaining multiple redundant layers: database schemas, ORM mappings, input types, CRUD resolvers, DataLoader batches, filter parsers, and access rules.

AutoGraphQL eliminates this manual plumbing. By treating your **GraphQL schema as the single source of truth**, the framework automatically derives the database models, queries, mutations, connectors, and subscriptions at startup.

### Architectural Comparison

| Capability | ⚡ AutoGraphQL | 🐘 Hasura | 💎 Prisma | 📜 PostGraphile |
| :--- | :---: | :---: | :---: | :---: |
| **Workflow** | **Pure GraphQL SDL** | DB Console + YAML | Proprietary DSL | SQL DDL Tables |
| **Runtime** | **100% Native Node.js** | Haskell / Go Engine | Node.js / Rust | Node.js |
| **Databases** | ✅ **MongoDB & PostgreSQL** | ⚠️ SQL-first | ⚠️ ORM only, no API | ❌ PostgreSQL only |
| **Resolver Generation** | ✅ **Automatic** | ✅ Automatic | ❌ Manual code | ✅ Automatic |
| **In-Process Lifecycle Hooks**| ✅ **Drop-in JS Hooks** | ❌ External Webhooks | ✅ Middleware | ⚠️ SQL / Extensions |
| **Multi-Tenancy (RLS)** | ✅ **Directives (`@tenantScoped`)** | ⚠️ Metadata DSL | ❌ Manual WHERE filters | ⚠️ PostgreSQL RLS |
| **Visual Studio UI** | ✅ **Data + ERD + AI Copilot** | ⚠️ Console | ⚠️ Data Studio only | ❌ GraphiQL only |

> 📊 For a detailed technical analysis, see [`docs/competitor-analysis.md`](docs/competitor-analysis.md) or run the server and view the slide deck at [`http://localhost:3000/slides`](http://localhost:3000/slides).

---

## 👥 Who is AutoGraphQL for?

AutoGraphQL is designed for developers and engineering teams who:
- Build Node.js backends and prefer GraphQL over manually designed REST endpoints.
- Value a **schema-first workflow** where GraphQL SDL is the single source of truth.
- Want to avoid repeatedly hand-writing CRUD resolvers, validation logic, and migration scripts.
- Need MongoDB, PostgreSQL, or a polyglot architecture combining both.
- Require built-in relations, multi-tenancy, deep filtering, or real-time subscriptions without glue code.

### It may not be for you if:
- You need a REST-first architecture with OpenAPI as your primary interface.
- You want a database-first workflow where existing SQL DDL schemas drive the API.
- You require a fully managed, proprietary backend-as-a-service (AutoGraphQL is self-hosted framework software).

---

## 🚀 What can you build?

- **Multi-Tenant B2B SaaS**: Tenant-isolated workspaces using `@tenantScoped` Row-Level Security with zero manual filter injection.
- **Internal Tools & Admin Consoles**: Rapid backends paired with the built-in Studio data browser.
- **E-Commerce & Marketplaces**: Product catalogs, nested categories, inventory clamping, and order mutations.
- **Content Platforms & Headless CMS**: Hierarchical taxonomies, relational author/article trees, and multipart media attachments.
- **Real-Time Collaborative Applications**: Live WebSocket updates via Redis PubSub with zero manual socket wiring.

---

## ⚡ Quick Start

### ⏱️ 60-Second Setup (Copy & Paste)

```bash
git clone https://github.com/namanmukund/AutoGraphQL.git && cd AutoGraphQL && npm install && npm run db:up && cp .env.example .env && npm run dev
```

> 🚀 *Starts MongoDB, PostgreSQL, and Redis in Docker, compiles your schemas, and opens AutoGraphQL Studio at [`http://localhost:3000/studio`](http://localhost:3000/studio).*

---

### Step-by-Step Setup

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/namanmukund/AutoGraphQL.git
cd AutoGraphQL
npm install
```

### 2. Start Local Databases (Docker)

```bash
npm run db:up   # Starts MongoDB, PostgreSQL, and Redis in the background
```

### 3. Configure Environment

```bash
cp .env.example .env
```

*(Default settings connect automatically to the local Docker containers.)*

### 4. Launch the Development Server

```bash
npm run dev
```

### 5. Open Your Local Interfaces

After starting the server, access the following **local development URLs**:

| Interface | Local URL | Purpose |
| :--- | :--- | :--- |
| **🎨 AutoGraphQL Studio** | [`http://localhost:3000/studio`](http://localhost:3000/studio) | Visual data browser, AI schema architect, ERD canvas, and telemetry |
| **🎮 GraphQL Playground** | [`http://localhost:3000/graphql/core`](http://localhost:3000/graphql/core) | Interactive query and mutation explorer |
| **🩺 Liveness Probe** | [`http://localhost:3000/health/live`](http://localhost:3000/health/live) | Kubernetes process liveness healthcheck |
| **🩺 Readiness Probe** | [`http://localhost:3000/health/ready`](http://localhost:3000/health/ready) | Validates MongoDB, PostgreSQL, and Redis connections |

> 🎥 **[Watch the Setup & Architecture Walkthrough on YouTube](https://www.youtube.com/watch?v=h7C2RLe4sik)**

> [!TIP]
> **🤖 Using Cursor, Windsurf, or Claude Code?**  
> AutoGraphQL includes a ready-to-use [`.cursorrules`](.cursorrules) file and an [AI Prompting Guide](docs/ai-prompting-guide.md). Teach your AI agent all schema directives (`@model`, `@relation`, `@clamp`, `@tenantScoped`) so it can architect valid AutoGraphQL schemas on demand without generating messy backend boilerplate.

---

## ✨ Key Features

- **🗄️ Multi-Database Polyglot (MongoDB & PostgreSQL)**: Configure your global database engine in `.env` (`DEFAULT_DATABASE_DIALECT=mongoose` or `postgres`), or route individual entities via `@model(database: postgres)`.
- **🔗 Relational Connectors & Zero N+1 Queries**: Define 1:1, 1:N, or N:N associations with `@relation`. AutoGraphQL automatically batches relational lookups with request-scoped DataLoaders.
- **🏢 Declarative Row-Level Security (RLS)**: Enforce tenant and owner isolation using `@tenantScoped` and `@ownerScoped`. Verified token claims automatically constrain read and write operations.
- **⚡ Real-Time WebSocket Subscriptions**: Subscribe to live document creations, updates, and deletions using `graphql-ws` or `subscriptions-transport-ws` backed by Redis PubSub.
- **🪝 Drop-in Mutation Lifecycle Hooks**: Add custom business logic, password hashing, or validations by creating files in `hooks/` exporting `${mutation}PreHook` or `${mutation}PostHook`.
- **📡 Transactional Outbox & Webhooks**: Deliver event payloads reliably with in-process Birdwatch listeners, automatic retries with exponential backoff, and HMAC-SHA256 request signatures.
- **🛠️ Automated TypeScript Client SDK**: Run `npm run codegen:sdk` to compile your schema AST into strongly typed TypeScript models and a type-safe `AutoGraphQLClient`.
- **🛡️ Production Reliability & DoS Protection**: Built-in query depth limiting (`GRAPHQL_MAX_DEPTH`), complexity cost limiting (`GRAPHQL_MAX_COMPLEXITY`), and Automatic Persisted Queries (APQ) with safelisting.

---

## 🎨 AutoGraphQL Studio — Visual Control Plane

AutoGraphQL includes an embedded visual developer console running locally at [`http://localhost:3000/studio`](http://localhost:3000/studio):

<div align="center">
  <img src="docs/assets/studio/01-studio-data-browser.png" alt="AutoGraphQL Studio Universal Data Browser" width="100%" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.35);" />
</div>

<br />

AutoGraphQL Studio gives you six integrated tools:
1. **Universal Data Browser**: Inline cell editing, field-level filtering, 1-click synthetic mock data seeding, and CSV/JSON export/import across MongoDB and PostgreSQL.
2. **AI Schema Architect (BYO-LLM)**: Generate production-grade GraphQL SDL from natural language prompts using Google Cloud Vertex AI (native ADC), OpenAI, Anthropic Claude, Gemini, or local Ollama instances.
3. **Visual ERD Canvas**: Interactive entity-relationship diagram displaying relationships, foreign keys, and database dialect badges (`🍃 Mongo` vs `🐘 Postgres`).
4. **RBAC & RLS Matrix**: Visual access control diagnostics across roles (`ADMIN`, `USER`, `GUEST`) with a 1-click test JWT generator.
5. **Webhooks & Outbox Monitor**: Inspect event deliveries, retry status, and outgoing HMAC-SHA256 signatures.
6. **Real-Time Telemetry**: Monitor server uptime, heap memory usage, active database connections, and streaming Winston logs.

> 📖 Read the complete Studio guide in [`docs/studio-user-guide.md`](docs/studio-user-guide.md).

---

## 🏗️ What Happens Under the Hood?

```
GraphQL SDL (schemas/*.graphql)
   ↓
Schema Auto-Discovery & AST Parser
   ↓
Dynamic Model & Resolver Compilation
   ↓
Runtime Gateway (Auth, DataLoader, RLS, Safeguards)
   ↓
Storage Layer (MongoDB / PostgreSQL)
```

1. **Schema as Source of Truth**: At server boot, the schema scanner discovers all `.graphql` and `.js` files in `schemas/` and parses them into a unified AST.
2. **Dynamic Compilation**: The AST compiler interprets schema directives (`@model`, `@relation`, `@tenantScoped`), compiling Mongoose schemas or Sequelize models, mapping indexes, and synthesizing CRUD resolvers.
3. **Runtime Execution**: Incoming requests pass through JWT verification, query depth/complexity validation, and declarative RLS filters before execution.
4. **Batched Resolution**: Relational fields are resolved through request-scoped DataLoaders, merging individual lookups into batched `$in` or `findAll` database queries.
5. **Extensibility**: In-process Pre/Post hooks (`hooks/`) and Birdwatch event listeners run around database operations to execute custom domain logic without modifying framework code.

---

## 🛡️ Declarative Directives

AutoGraphQL provides over 20 built-in directives to declare database behavior, relationships, transformations, and security directly in your schema.

### Core Directives at a Glance:

| Directive | Scope | Purpose | Example |
| :--- | :---: | :--- | :--- |
| **`@model`** | `Type` | Registers type for dynamic MongoDB or PostgreSQL model compilation | `type Product @model { ... }` |
| **`@relation`** | `Field` | Establishes 1:1, 1:N, or N:N relational associations & foreign keys | `category: Category @relation(name: "CatProd")` |
| **`@tenantScoped`** | `Type` | Enforces row-level multi-tenant isolation based on verified JWT claims | `@tenantScoped(field: "orgId", claim: "orgId")` |
| **`@ownerScoped`** | `Type` | Restricts document access to the record owner | `@ownerScoped(field: "userId", claim: "userId")` |
| **`@userPermissions`**| `Type`/`Field` | Granular role-based access control (`read`, `create`, `update`, `delete`) | `@userPermissions(read: ["ADMIN", "USER"])` |
| **`@unique`** | `Field` | Enforces unique index constraint in the database | `sku: String! @unique` |
| **`@defaultValue`** | `Field` | Assigns default value on document creation | `status: Status @defaultValue(value: "active")` |
| **`@cacheControl`** | `Type`/`Field` | Sets HTTP Cache-Control and Redis caching policies | `@cacheControl(maxAge: 3600, scope: PUBLIC)` |

> 📖 **Directives Reference**: Over 20 directives are available for modeling, validation (`@clamp`), sanitization (`@trim`, `@nameCase`), audit logging (`@history`), and indexing (`@createIndex`). See [`docs/directives-reference.md`](docs/directives-reference.md) for full signatures and examples.

---

## 🧰 TypeScript SDK & Developer Tooling

### Automated Client SDK Generation

Compile your schema AST into a strongly typed TypeScript client:

```bash
npm run codegen:sdk
```

Use the generated client in frontend or service code:

```typescript
import { AutoGraphQLClient } from './sdk';

const client = new AutoGraphQLClient({
  endpoint: 'http://localhost:3000/graphql/core',
  token: 'user_jwt_token',
});

// Fully typed queries and mutations
const products = await client.product.findMany({ stock: { gt: 0 } }, 'id name price');
const newProduct = await client.product.create({ name: 'Mouse', price: 29.99 }, 'id name');
```

### Schema Governance & Breaking-Change Linter

Verify schema compatibility in CI/CD before deploying:

```bash
# 1. Dump current executable schema
npm run schema:dump

# 2. Compare against baseline (fails with exit code 1 on breaking changes)
npm run schema:diff -- --base schema.graphql
```

---

## 🧪 Automated Test Suite

AutoGraphQL includes a complete automated test suite verifying AST generation, database models, DataLoader batching, webhooks, multi-tenancy, and reliability safeguards:

```bash
npm test
```

Continuous integration runs automatically on every pull request across **Node.js 18.x, 20.x, and 22.x** via GitHub Actions.

---

## 📚 Documentation

Detailed architectural and implementation guides are available in [`docs/`](docs/):

- 🤖 **[AI Prompting & Agent Guide](docs/ai-prompting-guide.md)**: Prompt templates for Cursor, Claude Code, and Windsurf to write AutoGraphQL schemas.
- 🛡️ **[Schema Directives Reference](docs/directives-reference.md)**: Full reference for all schema directives.
- 🎨 **[AutoGraphQL Studio Guide](docs/studio-user-guide.md)**: Complete guide to data browsing, AI schema design, and ERD mapping.
- 🪝 **[Developer Extension & Hooks Guide](docs/developer-extension-and-hooks-guide.md)**: Pre/post hooks, custom queries, and lifecycle extensions.
- 🐘 **[PostgreSQL Integration Guide](docs/postgresql-guide.md)**: Sequelize configuration, GIN/B-Tree indexing, and relational queries.
- 🍃 **[MongoDB Integration Guide](docs/mongodb-guide.md)**: Mongoose compilation, aggregation pipelines, and embedded documents.
- 📊 **[Counts & Aggregations Guide](docs/count-and-aggregations-guide.md)**: Metadata queries, groupBy segmentation, and child counts.
- 📁 **[File Management Guide](docs/file-management-guide.md)**: Multipart uploads, AWS S3 storage, and CloudFront signing.
- 🏆 **[Competitor Analysis](docs/competitor-analysis.md)**: Architectural comparison with Hasura, Prisma, PostGraphile, and Strapi.

---

## ⭐ Try AutoGraphQL

AutoGraphQL turns GraphQL SDL into a complete backend so you can focus on building your product rather than writing repetitive plumbing.

- ⭐ **Star the repository**: Keep up to date with releases and support open-source development.
- 🚀 **Run the Quick Start**: Experience the 60-second setup locally.
- 🐛 **Report an issue**: Found a bug or need a feature? Open an [Issue](https://github.com/namanmukund/AutoGraphQL/issues).
- 🤝 **Contribute**: Read our [Contributing Guidelines](CONTRIBUTING.md) and join development.

---

## 📄 License

AutoGraphQL is open-source software licensed under the [MIT License](LICENSE).  
&copy; 2026 AutoGraphQL Contributors.
