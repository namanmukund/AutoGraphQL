# 🐘 PostgreSQL Guide & Examples in AutoGraphQL

This guide provides a comprehensive walkthrough of defining, querying, mutating, indexing, and securing **PostgreSQL** relational tables using AutoGraphQL's pure schema-driven AST compiler and Sequelize dynamic model generator.

---

## 📑 Table of Contents

1. [Defining PostgreSQL Schemas](#1-defining-postgresql-schemas)
2. [Sequelize DataTypes Mapping Matrix](#2-sequelize-datatypes-mapping-matrix)
3. [PostgreSQL Index Strategies (B-Tree, GIN, Composite, Unique)](#3-postgresql-index-strategies)
4. [Relational Joins & Associations (1:1, 1:N, N:N, Self-Referencing)](#4-relational-joins--associations)
5. [Advanced PostgreSQL Query Filters & ILIKE](#5-advanced-postgresql-query-filters--ilike)
6. [Polymorphic DataLoader Batching ($O(1)$ SQL Queries)](#6-polymorphic-dataloader-batching)
7. [Row-Level Security (RLS) & Multi-Tenancy](#7-row-level-security-rls--multi-tenancy)
8. [CRUD Mutations & Batch Operations](#8-crud-mutations--batch-operations)
9. [Relational Connector Mutations (Connect / Disconnect)](#9-relational-connector-mutations)
10. [Real-Time WebSocket Subscriptions & Outbox Events](#10-real-time-websocket-subscriptions--outbox-events)

---

## 1. Defining PostgreSQL Schemas

To route a GraphQL model to PostgreSQL instead of MongoDB, annotate the type with `database: postgres` in the `@model` directive (aliases `database: sql` and `database: sequelize` are also supported):

```graphql
# graphqlSchema/core/types/collections/Order.graphql
type Order @model(database: postgres) {
  id: ID!
  orderNumber: String! @unique
  totalAmount: Float!
  currency: String! @defaultValue(value: "USD")
  status: OrderStatus @defaultValue(value: "PENDING")
  customer: Customer @relation(name: "CustomerToOrders", direction: "IN")
  items: [OrderItem] @relation(name: "OrderToItems", direction: "OUT")
  metadata: JSONB @createIndex(value: 1)
  tags: [String] @createIndex(value: 1)
  tenantId: String! @createIndex(value: 1)
  createdAt: Date!
  updatedAt: Date!
}

enum OrderStatus {
  PENDING
  PROCESSING
  COMPLETED
  CANCELLED
}
```

### Auto-Generated PostgreSQL Table Structure:
AutoGraphQL compiles this AST directly into a Sequelize model:
- **Table Name**: `orders` (lowercase type name)
- **Primary Key**: `id` column (`DataTypes.STRING`, `primaryKey: true`, default `cuid()`)
- **Timestamps**: `createdAt` and `updatedAt` automatically managed by Sequelize
- **Model Flag**: Marked with `isPgModel: true` for polymorphic execution

---

## 2. Sequelize DataTypes Mapping Matrix

AutoGraphQL dynamically converts GraphQL schema types and scalar definitions into native Sequelize `DataTypes`:

| GraphQL Schema Type | PostgreSQL / Sequelize Type | SQL Column Definition | Description |
| :--- | :--- | :--- | :--- |
| `ID` / `String` | `DataTypes.STRING` | `VARCHAR(255)` | Standard string column |
| `String` (large) | `DataTypes.TEXT` | `TEXT` | Variable-length text |
| `Int` / `Integer` | `DataTypes.INTEGER` | `INTEGER` | 32-bit signed integer |
| `Float` / `Number` | `DataTypes.FLOAT` | `DOUBLE PRECISION` | Double-precision floating point |
| `Boolean` | `DataTypes.BOOLEAN` | `BOOLEAN` | True / False boolean |
| `Date` | `DataTypes.DATE` | `TIMESTAMP WITH TIME ZONE` | ISO-8601 date with timezone |
| `JSON` / `JSONB` | `DataTypes.JSONB` | `JSONB` | Binary JSON object with indexing support |
| `[String]` | `DataTypes.ARRAY(DataTypes.STRING)` | `VARCHAR(255)[]` | PostgreSQL native array of strings |
| `[Int]` | `DataTypes.ARRAY(DataTypes.INTEGER)` | `INTEGER[]` | PostgreSQL native array of integers |
| `Enum` | `DataTypes.STRING` | `VARCHAR(255)` | String column with enum validation |

### Field Directives & Column Constraints:
- `required: true` (or `!` in GraphQL) $\rightarrow$ `allowNull: false`
- `@unique` $\rightarrow$ `unique: true` constraint
- `@defaultValue(value: "...")` $\rightarrow$ `defaultValue`

---

## 3. PostgreSQL Index Strategies

AutoGraphQL provides declarative index configuration, automatically selecting the optimal PostgreSQL index algorithm:

```graphql
type AuditLog @model(database: postgres) {
  id: ID!
  action: String! @createIndex(value: 1)       # B-Tree index for exact/range matching
  traceId: String! @unique                     # Unique B-Tree index
  payload: JSONB @createIndex(value: 1)        # GIN index for JSONB key & value search
  tags: [String] @createIndex(value: 1)        # GIN index for array containment (@>)
  tenantId: String! @createIndex(value: 1)     # Tenant B-Tree index
  createdAt: Date!
}
```

### 1. B-Tree Indexes
Generated for standard scalar fields (`String`, `Int`, `Date`). Ideal for equality (`=`), sorting (`ORDER BY`), and range comparisons (`<`, `<=`, `>`, `>=`).

### 2. PostgreSQL GIN Indexes (`using: 'GIN'`)
When an indexed field is of type `JSONB` or `ARRAY`, AutoGraphQL automatically configures **`using: 'GIN'`** (Generalized Inverted Index). This enables microsecond containment queries:
```sql
-- Generated GIN index:
CREATE INDEX "auditlog_payload_gin" ON "auditlog" USING GIN ("payload");
CREATE INDEX "auditlog_tags_gin" ON "auditlog" USING GIN ("tags");

-- Optimized query using GIN index:
SELECT * FROM "auditlog" WHERE "payload" @> '{"status": "ERROR"}';
SELECT * FROM "auditlog" WHERE "tags" @> ARRAY['SECURITY'];
```

### 3. Composite Multi-Column Indexes
AutoGraphQL supports multi-column compound indexes spanning multiple fields (e.g. `(tenantId, createdAt)`):
```javascript
buildSequelizeIndexes(fieldsSchema, [
  { fields: ['tenantId', 'createdAt'], name: 'idx_tenant_created' }
]);
```

---

## 4. Relational Joins & Associations

AutoGraphQL inspects `@relation` directives and automatically establishes Sequelize associations using `wireSequelizeAssociations`:

### 1. One-to-One (1:1)
```graphql
type Company @model(database: postgres) {
  id: ID!
  name: String!
  settings: CompanySettings @relation(name: "CompanyToSettings", direction: "OUT")
}

type CompanySettings @model(database: postgres) {
  id: ID!
  theme: String
  company: Company @relation(name: "CompanyToSettings", direction: "IN")
}
```
*Sequelize Implementation:*
```javascript
Company.hasOne(CompanySettings, { foreignKey: 'companyId', as: 'settings' });
CompanySettings.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
```

### 2. One-to-Many (1:N)
```graphql
type Department @model(database: postgres) {
  id: ID!
  name: String!
  employees: [Employee] @relation(name: "DeptToEmployees", direction: "OUT")
}

type Employee @model(database: postgres) {
  id: ID!
  name: String!
  department: Department @relation(name: "DeptToEmployees", direction: "IN")
}
```
*Sequelize Implementation:*
```javascript
Department.hasMany(Employee, { foreignKey: 'departmentId', as: 'employees' });
Employee.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
```

### 3. Many-to-Many (N:N with Join Table)
```graphql
type Student @model(database: postgres) {
  id: ID!
  name: String!
  courses: [Course] @relation(name: "StudentToCourses", direction: "BOTH")
}

type Course @model(database: postgres) {
  id: ID!
  title: String!
  students: [Student] @relation(name: "StudentToCourses", direction: "BOTH")
}
```
*Sequelize Implementation:*
```javascript
Student.belongsToMany(Course, { through: 'StudentCourses', foreignKey: 'studentId', otherKey: 'courseId', as: 'courses' });
Course.belongsToMany(Student, { through: 'StudentCourses', foreignKey: 'courseId', otherKey: 'studentId', as: 'students' });
```

### 4. Self-Referencing / Hierarchical Joins
```graphql
type Category @model(database: postgres) {
  id: ID!
  name: String!
  parent: Category @relation(name: "CategoryHierarchy", direction: "IN")
  subcategories: [Category] @relation(name: "CategoryHierarchy", direction: "OUT")
}
```
*Sequelize Implementation:*
```javascript
Category.hasMany(Category, { foreignKey: 'parentId', as: 'subcategories' });
Category.belongsTo(Category, { foreignKey: 'parentId', as: 'parent' });
```

---

## 5. Advanced PostgreSQL Query Filters & ILIKE

AutoGraphQL translates GraphQL filter AST into native PostgreSQL Sequelize `Op` operators via `buildSequelizeWhereClause`:

```graphql
query ListFilteredOrders {
  orders(
    filter: {
      and: [
        { totalAmount_gte: 100.0 }
        { totalAmount_lte: 5000.0 }
        { orderNumber_startsWith: "ORD-2026" }
        { status_in: [PENDING, PROCESSING] }
        { currency_contains: "US" } # Case-insensitive ILIKE in PostgreSQL
      ]
    }
    orderBy: "createdAt_DESC"
    first: 20
  ) {
    id
    orderNumber
    totalAmount
    status
  }
}
```

### Operator Translation Matrix:
| GraphQL Filter | Sequelize Operator | Generated PostgreSQL SQL |
| :--- | :--- | :--- |
| `field_contains: "text"` | `[Op.iLike]: '%text%'` | `field ILIKE '%text%'` (case-insensitive) |
| `field_startsWith: "pre"` | `[Op.iLike]: 'pre%'` | `field ILIKE 'pre%'` |
| `field_endsWith: "post"` | `[Op.iLike]: '%post'` | `field ILIKE '%post'` |
| `field_not_contains: "bad"` | `[Op.notILike]: '%bad%'` | `field NOT ILIKE '%bad%'` |
| `field_gt: 100` | `[Op.gt]: 100` | `field > 100` |
| `field_gte: 100` | `[Op.gte]: 100` | `field >= 100` |
| `field_lt: 500` | `[Op.lt]: 500` | `field < 500` |
| `field_lte: 500` | `[Op.lte]: 500` | `field <= 500` |
| `field_in: [A, B]` | `[Op.in]: ['A', 'B']` | `field IN ('A', 'B')` |
| `field_not_in: [X, Y]` | `[Op.notIn]: ['X', 'Y']` | `field NOT IN ('X', 'Y')` |
| `field_exists: true` | `[Op.ne]: null` | `field IS NOT NULL` |
| `field_exists: false` | `[Op.is]: null` | `field IS NULL` |
| `and: [...]` | `[Op.and]: [...]` | `(...) AND (...)` |
| `or: [...]` | `[Op.or]: [...]` | `(...) OR (...)` |
| `not: {...}` | `[Op.not]: {...}` | `NOT (...)` |

---

## 6. Polymorphic DataLoader Batching

When querying nested relational fields across PostgreSQL models, AutoGraphQL's request-scoped DataLoader batches all lookups into a single SQL query:

```graphql
query GetCustomersWithOrders {
  customers(first: 5) {
    id
    name
    orders {
      id
      orderNumber
      totalAmount
    }
  }
}
```

### Generated SQL Queries:
```sql
-- 1. Fetch top-level customers
SELECT * FROM "customers" ORDER BY "createdAt" DESC LIMIT 5;

-- 2. Single batched query for all orders belonging to all 5 customers (N+1 eliminated)
SELECT * FROM "orders" WHERE "customerId" IN ('cust_1', 'cust_2', 'cust_3', 'cust_4', 'cust_5');
```

- **Guaranteed $O(1)$ roundtrips**: Regardless of the number of customers returned, exactly **1 SQL query** is issued for all child orders.
- **In-Memory Memoization**: Sibling nodes requesting identical IDs are resolved from cache within the request tick.

---

## 7. Row-Level Security (RLS) & Multi-Tenancy

AutoGraphQL provides declarative Row-Level Security (RLS) and multi-tenancy enforcement for PostgreSQL tables:

```graphql
type Invoice @model(database: postgres) @tenantScoped(field: "organizationId", claim: "organizationId") {
  id: ID!
  invoiceNumber: String!
  total: Float!
  organizationId: String!
}

type PrivateNote @model(database: postgres) @ownerScoped(field: "userId", claim: "userId") {
  id: ID!
  title: String!
  content: String!
  userId: String!
}
```

### Security Guarantees:
1. **Read Isolation**: Read queries automatically receive `{ organizationId: context.organizationId }` in their SQL `WHERE` clause.
2. **Anti-Spoofing Guarantee**: If a client passes `{ filter: { organizationId: "other_org" } }`, the RLS engine strictly overrides it with the verified JWT token claim.
3. **Write Injection**: Create mutations automatically tag the record with the active tenant ID.
4. **Ownership Verification**: Update and delete mutations verify that the target row belongs to the active tenant, rejecting unauthorized modifications with `PermissionDeniedError`.
5. **Admin Bypass**: Roles `ADMIN`, `SYSTEM`, or requests with `context.bypass = true` are exempt from tenant filtering.

---

## 8. CRUD Mutations & Batch Operations

### Create Record
```graphql
mutation CreateOrder {
  addOrder(
    input: {
      orderNumber: "ORD-2026-9901"
      totalAmount: 450.00
      currency: "USD"
      status: PENDING
    }
  ) {
    id
    orderNumber
    totalAmount
    status
    createdAt
  }
}
```

### Batch Create Records
```graphql
mutation CreateMultipleOrders {
  addOrders(
    input: [
      { orderNumber: "ORD-001", totalAmount: 100.0 },
      { orderNumber: "ORD-002", totalAmount: 250.0 }
    ]
  ) {
    id
    orderNumber
  }
}
```

### Update Record
```graphql
mutation UpdateOrderStatus {
  updateOrder(
    input: {
      id: "ord_clx789xyz"
      status: COMPLETED
    }
  ) {
    id
    orderNumber
    status
    updatedAt
  }
}
```

### Delete Record
```graphql
mutation DeleteOrder {
  deleteOrder(
    input: {
      id: "ord_clx789xyz"
    }
  ) {
    id
  }
}
```

---

## 9. Relational Connector Mutations

AutoGraphQL generates relational connector mutations to link and unlink foreign keys:

```graphql
# Connect an existing Order to a Customer
mutation LinkOrderToCustomer {
  addCustomerToOrdersRelation(
    customerId: "cust_123"
    orderId: "ord_456"
  ) {
    id
    orders {
      id
      orderNumber
    }
  }
}

# Unlink
mutation UnlinkOrderFromCustomer {
  removeCustomerToOrdersRelation(
    customerId: "cust_123"
    orderId: "ord_456"
  ) {
    id
    orders {
      id
    }
  }
}
```

---

## 10. Real-Time WebSocket Subscriptions & Outbox Events

AutoGraphQL supports real-time GraphQL subscriptions and event-driven automation for PostgreSQL models:

### WebSocket Subscription
```graphql
subscription OnOrderUpdated {
  order(id: "ord_clx789xyz") {
    mutation
    node {
      id
      orderNumber
      status
      totalAmount
      updatedAt
    }
    updatedFields
  }
}
```

### Transactional Outbox & Webhooks
Every PostgreSQL mutation produces a standardized event in the Transactional Outbox, automatically delivered with HMAC-SHA256 signature verification and exponential backoff:

```json
{
  "id": "evt_clx998877",
  "event": "addOrder",
  "operation": "CREATE",
  "entityName": "Order",
  "data": {
    "id": "ord_clx789xyz",
    "orderNumber": "ORD-2026-9901",
    "totalAmount": 450.00
  },
  "metadata": {
    "timestamp": "2026-09-01T12:00:00.000Z",
    "actor": { "id": "usr_1", "role": "USER" }
  }
}
```
