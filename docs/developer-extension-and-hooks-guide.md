# 🚀 Developer Extension & Lifecycle Hooks Guide

This guide explains how developers can build domain-centric applications on top of AutoGraphQL **without touching framework internals**, ensuring that upstream AutoGraphQL engine updates can be pulled at any time without merge conflicts or regressions.

---

## 📑 Table of Contents

1. [Architectural Separation: Core Engine vs Domain Code](#1-architectural-separation-core-engine-vs-domain-code)
2. [Adding New Domain Models in 2 Minutes](#2-adding-new-domain-models-in-2-minutes)
3. [Lifecycle Hooks Architecture (Pre-Hooks & Post-Hooks)](#3-lifecycle-hooks-architecture-pre-hooks--post-hooks)
4. [Writing Pre-Hooks (Validation, Normalization & Enrichment)](#4-writing-pre-hooks)
5. [Writing Post-Hooks (Emails, Side Effects & External APIs)](#5-writing-post-hooks)
6. [Event-Driven Listeners & Webhooks (Birdwatch)](#6-event-driven-listeners--webhooks-birdwatch)
7. [Adding Custom Resolvers & Standalone Operations](#7-adding-custom-resolvers--standalone-operations)
8. [Safe Upstream Upgrades Workflow (`git pull`)](#8-safe-upstream-upgrades-workflow)

---

## 1. Architectural Separation: Core Engine vs Domain Code

AutoGraphQL enforces strict separation between the **Engine** (which auto-generates models, resolvers, filters, DataLoaders, and AST compilers) and your **Domain Code**:

```
AutoGraphQL/
│
├── 🧠 FRAMEWORK CORE ENGINE (Do not modify - pulls upstream updates)
│   ├── src/autoGenerate/         # AST parser, ORM/ODM model generator, resolver builder
│   ├── src/dataloader/           # Request-scoped batching engine
│   ├── src/security/             # Row-level security (RLS) engine
│   ├── src/persistedQueries/     # APQ & safelisting
│   └── src/governance/           # Schema diffing & breaking change linter
│
└── 🎯 YOUR DOMAIN CODE (Modify freely - your business logic)
    ├── graphqlSchema/core/types/ # Define your entities & enums (e.g. Course, Order, Product)
    ├── graphqlSchema/core/functions/ # Custom Pre-Hooks and Post-Hooks
    ├── src/birdwatch/birdwatchConfig.js # Event listeners & background automations
    └── .env                      # Database configuration, JWT secrets & feature flags
```

---

## 2. Adding New Domain Models in 2 Minutes

To create a new collection / table with a complete GraphQL API (CRUD, pagination, filters, batching, metadata, subscriptions), you only need to create one file in `graphqlSchema/core/types/`.

### Step 1: Create your Type file
Create `graphqlSchema/core/types/course/Course.js`:

```javascript
// graphqlSchema/core/types/course/Course.js
const Course = `
  type Course @model {
    id: ID!
    title: String! @trim
    slug: String! @unique
    description: String
    price: Float! @clamp(min: 0)
    status: CourseStatus @defaultValue(value: "DRAFT")
    instructor: User @relation(name: "InstructorCourses", direction: "IN")
    tags: [String]
    createdAt: Date!
    updatedAt: Date!
  }

  enum CourseStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
  }
`;

export default [Course];
```

### Step 2: Register in `graphqlSchema/core/types/index.js`
Export your new type array in `graphqlSchema/core/types/index.js`:

```javascript
import Course from './course/Course';

export default [
  ...User,
  ...UserProfile,
  ...Course, // Add your entity here
];
```

### ✨ Auto-Generated Instant Capabilities:
AutoGraphQL automatically creates:
- **Database Model**: MongoDB Mongoose model or PostgreSQL Sequelize table (based on `DEFAULT_DATABASE_DIALECT` in `.env`).
- **Queries**: `course(id)`, `courses(filter, first, skip, orderBy)`, `coursesMeta(filter, groupBy)`.
- **Mutations**: `addCourse`, `addCourses`, `updateCourse`, `updateCourses`, `deleteCourse`, `deleteCourses`.
- **Relational Connectors**: `addInstructorCoursesRelation`, `removeInstructorCoursesRelation`.
- **Subscriptions**: Real-time `course(filter: ...)` WebSocket events.
- **Batching**: Request-scoped DataLoader batching with zero N+1 queries.

---

## 3. Lifecycle Hooks Architecture (Pre-Hooks & Post-Hooks)

Every mutation in AutoGraphQL passes through a deterministic lifecycle pipeline:

```
[ Client Mutation Request ]
           │
           ▼
[ 1. Input Sanitization & Directives ] (@trim, @clamp, @upperCase)
           │
           ▼
[ 2. Pre-Hooks Pipeline ] ──► (Synchronous validation, enrichment, password hashing)
           │                   * Throwing error halts mutation before database write
           ▼
[ 3. Database Execution ] ──► (Mongoose or Sequelize insert/update/delete)
           │
           ▼
[ 4. Post-Hooks Pipeline ] ──► (Synchronous data transformation or notification triggers)
           │
           ▼
[ 5. Event Bus & Outbox ] ──► (Birdwatch in-process listeners & Transactional Webhooks)
           │
           ▼
[ Client GraphQL Response ]
```

---

## 4. Writing Pre-Hooks

Pre-hooks execute **before** database writes. Use pre-hooks to:
- Normalize and sanitize inputs (e.g. generate URL slugs, hash passwords).
- Fetch data from external APIs or perform custom database validations.
- Halt execution by throwing sanitized GraphQL errors.

### Where to Register Pre-Hooks:
In `graphqlSchema/core/functions/hooks.js`:

```javascript
// graphqlSchema/core/functions/hooks.js
import slugify from 'slugify';
import { UserInputError } from '../../../../constants/errors';

// Pre-hook for addCourse mutation
const addCoursePreHook = [
  async (input, context) => {
    // 1. Auto-generate slug from title if not provided
    if (input.title && !input.slug) {
      input.slug = slugify(input.title, { lower: true, strict: true });
    }

    // 2. Custom business validation
    if (input.price > 10000 && !context.user.isAdmin) {
      throw new UserInputError({
        data: { message: 'Prices above $10,000 require Admin approval' },
      });
    }

    // Return modified input for database insertion
    return input;
  },
];

// Pre-hook for updateUser mutation
const updateUserPreHook = [
  async (input, context) => {
    if (input.email) {
      input.email = input.email.toLowerCase().trim();
    }
    return input;
  },
];

export {
  addCoursePreHook,
  updateUserPreHook,
};
```

---

## 5. Writing Post-Hooks

Post-hooks execute **after** the database write succeeds. Use post-hooks to:
- Trigger welcome emails or notifications.
- Invalidate custom external caches.
- Sync data with third-party CRMs (e.g. Stripe, Salesforce, HubSpot).

### Where to Register Post-Hooks:
In `graphqlSchema/core/functions/hooks.js`:

```javascript
// graphqlSchema/core/functions/hooks.js
import { sendWelcomeEmail } from '../../../../utils/emailService';

// Post-hook for addUser mutation
const addUserPostHook = [
  async (result, input, context) => {
    try {
      // Send async welcome email without blocking response
      if (result && result.email) {
        await sendWelcomeEmail(result.email, result.username);
      }
    } catch (err) {
      console.error('Failed to send welcome email:', err);
    }

    return result;
  },
];

export {
  addUserPostHook,
};
```

---

## 6. Event-Driven Listeners & Webhooks (Birdwatch)

For asynchronous, decoupled business logic, AutoGraphQL provides **Birdwatch**:

### 1. In-Process Event Listeners
Configure background actions in `src/birdwatch/birdwatchConfig.js`:

```javascript
// src/birdwatch/birdwatchConfig.js
export default [
  {
    event: 'addOrder', // Trigger on order creation
    actions: [
      {
        type: 'SEND_NOTIFICATION',
        handler: async (eventPayload) => {
          const { data, metadata } = eventPayload;
          console.log(`Order #${data.orderNumber} placed by user ${metadata.actor.id}`);
          // Send push notification / invoice PDF generator
        },
      },
    ],
  },
];
```

### 2. External Webhooks
Register HTTP webhook endpoints to receive signed mutation payloads with HMAC-SHA256 signatures and exponential backoff retry:

```javascript
import { registerWebhook } from './src/birdwatch';

registerWebhook({
  url: 'https://api.mycrm.com/webhooks/autographql',
  events: ['addOrder', 'updateUser'],
  secret: 'my_webhook_secret',
});
```

---

## 7. Adding Custom Resolvers & Standalone Operations

If you need custom GraphQL queries or mutations that don't map to a standard `@model` CRUD operation (e.g. `processPayment`, `exportPDF`):

1. Create a custom query/mutation in `graphqlSchema/core/custom/`:
```graphql
# graphqlSchema/core/custom/payment.graphql
extend type Mutation {
  processPayment(orderId: ID!, amount: Float!, paymentMethodId: String!): PaymentReceipt!
}

type PaymentReceipt {
  transactionId: String!
  status: String!
  receiptUrl: String
}
```

2. Attach your custom resolver:
```javascript
// graphqlSchema/core/custom/paymentResolver.js
export const processPaymentResolver = async (parent, args, context) => {
  const { orderId, amount, paymentMethodId } = args;
  // Custom Stripe / Razorpay logic
  return {
    transactionId: 'txn_12345',
    status: 'SUCCESS',
    receiptUrl: 'https://cdn.example.com/receipt.pdf',
  };
};
```

---

## 8. Safe Upstream Upgrades Workflow

Because your business logic is cleanly isolated in `graphqlSchema/` and `.env`, upgrading AutoGraphQL is as simple as pulling the latest changes from the upstream Git repository:

```bash
# 1. Fetch latest upstream framework changes
git fetch upstream main

# 2. Merge upstream updates into your project branch
git merge upstream/main

# 3. Run automated tests to verify compatibility
npm test
```

### Summary of What Lives Where:

| Component | Directory / File | Modified by Developer? | Upstream Upgradable? |
| :--- | :--- | :---: | :---: |
| **Domain Schemas** | `graphqlSchema/core/types/` | **YES** | Preserved |
| **Pre & Post Hooks** | `graphqlSchema/core/functions/` | **YES** | Preserved |
| **Event Automations** | `src/birdwatch/birdwatchConfig.js` | **YES** | Preserved |
| **Environment Settings** | `.env` | **YES** | Preserved |
| **Core AST Generator** | `src/autoGenerate/` | **NO** | Auto-Updated |
| **DataLoader Engine** | `src/dataloader/` | **NO** | Auto-Updated |
| **Security & RLS** | `src/security/` | **NO** | Auto-Updated |
| **CI/CD & Governance** | `src/governance/`, `.github/` | **NO** | Auto-Updated |
