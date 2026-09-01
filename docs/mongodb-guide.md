# 🍃 MongoDB Guide & Examples in AutoGraphQL

This guide provides a comprehensive walkthrough of defining, querying, mutating, indexing, and aggregating **MongoDB** collections using AutoGraphQL's pure schema-driven AST compiler and Mongoose dynamic model generation.

---

## 📑 Table of Contents

1. [Defining MongoDB Schemas](#1-defining-mongodb-schemas)
2. [Supported Field Types & Embedded Schemas](#2-supported-field-types--embedded-schemas)
3. [Directives & Index Strategies](#3-directives--index-strategies)
4. [Relational Connectors & Foreign Keys](#4-relational-connectors--foreign-keys)
5. [Query Examples (Single, List, Filtering & Pagination)](#5-query-examples)
6. [Aggregation & Metadata Queries (`*Meta`)](#6-aggregation--metadata-queries-meta)
7. [Array Mutation Operators (`push`, `pop`, `replace`, etc.)](#7-array-mutation-operators)
8. [CRUD Mutations & Batch Operations](#8-crud-mutations--batch-operations)
9. [Real-Time WebSocket Subscriptions](#9-real-time-websocket-subscriptions)
10. [MongoDB Aggregation Pipelines (`AggregationController`)](#10-mongodb-aggregation-pipelines-aggregationcontroller)

---

## 1. Defining MongoDB Schemas

In AutoGraphQL, types annotated with `@model` route to MongoDB whenever `DEFAULT_DATABASE_DIALECT=mongoose` (the default) in `.env`, or when explicitly configured via `@model(database: mongoose)`:

```graphql
# graphqlSchema/core/types/collections/User.graphql
type User @model {
  id: ID!
  username: String! @unique
  email: String! @unique
  status: Status @defaultValue(value: "active")
  roles: [String] @defaultValue(value: "['user']")
  phone: Phone
  skills: [String]
  profile: UserProfile @relation(name: "UserToProfile", direction: "OUT")
  posts: [Post] @relation(name: "UserToPosts", direction: "OUT")
  createdAt: Date!
  updatedAt: Date!
}

enum Status {
  active
  inactive
  blocked
}
```

AutoGraphQL automatically compiles this SDL into a Mongoose model:
- Collection name: `users`
- Automatic timestamps: `createdAt`, `updatedAt`
- Dynamic field type mapping with nested validation

---

## 2. Supported Field Types & Embedded Schemas

MongoDB natively supports rich document nesting and sub-documents:

```graphql
# Embedded Type (without @model directive, treated as nested subdocument)
type Phone {
  countryCode: String
  number: String
  isVerified: Boolean @defaultValue(value: "false")
}

type Address {
  street: String
  city: String
  zipCode: String
  coordinates: [Float] # GeoJSON [longitude, latitude]
}

type Organization @model {
  id: ID!
  name: String!
  billingAddress: Address
  emergencyContacts: [Phone]
}
```

---

## 3. Directives & Index Strategies

AutoGraphQL allows declarative indexing and default values:

```graphql
type Product @model {
  id: ID!
  sku: String! @unique                          # Unique index: { sku: 1 }, { unique: true }
  title: String! @createIndex(value: 1)         # Standard ascending index: { title: 1 }
  category: String! @createIndex(value: 1)      # Categorical index
  price: Float! @createIndex(value: -1)         # Descending index for sorting
  tags: [String] @createIndex(value: 1)         # Multi-key index on array elements
  isPublished: Boolean @defaultValue(value: "true")
}
```

---

## 4. Relational Connectors & Foreign Keys

AutoGraphQL generates relational joins and foreign keys automatically:

```graphql
# Bidirectional 1-to-1 Relation
type User @model {
  id: ID!
  username: String!
  profile: UserProfile @relation(name: "UserToProfile", direction: "OUT")
}

type UserProfile @model {
  id: ID!
  bio: String
  avatarUrl: String
  user: User @relation(name: "UserToProfile", direction: "IN")
}

# 1-to-Many Relation
type Author @model {
  id: ID!
  name: String!
  posts: [Post] @relation(name: "AuthorToPosts", direction: "OUT")
}

type Post @model {
  id: ID!
  title: String!
  content: String!
  author: Author @relation(name: "AuthorToPosts", direction: "IN")
}
```

---

## 5. Query Examples

### Single Record Query
```graphql
query GetUserById {
  user(id: "usr_clx123abc456") {
    id
    username
    email
    status
    phone {
      countryCode
      number
    }
    profile {
      bio
      avatarUrl
    }
  }
}
```

### Filtered List Query with Pagination & Sorting
```graphql
query ListActiveUsers {
  users(
    filter: {
      and: [
        { status: "active" },
        { createdAt_gte: "2026-01-01T00:00:00.000Z" },
        { username_contains: "alex" }
      ]
    }
    orderBy: "createdAt_DESC"
    first: 10
    skip: 0
  ) {
    id
    username
    email
    createdAt
  }
}
```

---

## 6. Aggregation & Metadata Queries (`*Meta`)

AutoGraphQL generates companion `*Meta` queries for statistical insights:

```graphql
query GetUsersMetadata {
  usersMeta(
    filter: {
      status: "active"
    }
  ) {
    count
  }
}
```

---

## 7. Array Mutation Operators

AutoGraphQL provides a complete array manipulation suite inside `update*` mutations, enabling precise item management without overwriting entire documents:

```graphql
type Classroom @model {
  id: ID!
  title: String!
  tags: [String]
  instructors: [Instructor]
}

type Instructor {
  id: ID!
  name: String!
  role: String!
}
```

### 1. `push`: Append a Single Element
Appends one element to the end of the array:
```graphql
mutation AppendSingleTag {
  updateClassroom(
    input: {
      id: "class_101"
      tags: {
        push: "ComputerScience"
      }
    }
  ) {
    id
    tags
  }
}
```

### 2. `pushMany`: Append Multiple Elements
Appends multiple elements in a single operation:
```graphql
mutation AppendMultipleTags {
  updateClassroom(
    input: {
      id: "class_101"
      tags: {
        pushMany: ["Algorithms", "DataStructures", "AI"]
      }
    }
  ) {
    id
    tags
  }
}
```

### 3. `pushToSet`: Append Unique Element (Set Semantics)
Appends an element **only if it does not already exist** in the array:
```graphql
mutation AddUniqueTag {
  updateClassroom(
    input: {
      id: "class_101"
      tags: {
        pushToSet: "Algorithms" # If 'Algorithms' already exists, no duplicate is added
      }
    }
  ) {
    id
    tags
  }
}
```

### 4. `replace`: Overwrite Entire Array
Replaces the entire array with a new array and cleanly unlinks any disconnected relation references:
```graphql
mutation OverwriteAllTags {
  updateClassroom(
    input: {
      id: "class_101"
      tags: {
        replace: ["DistributedSystems", "Microservices"]
      }
    }
  ) {
    id
    tags
  }
}
```

### 5. `update`: Find and Update Matching Array Elements
Finds elements matching an `inputWhere` filter and updates their properties:
```graphql
mutation UpdateInstructorRole {
  updateClassroom(
    input: {
      id: "class_101"
      instructors: {
        update: {
          inputWhere: { id: "inst_99" }
          inputWith: { role: "LeadProfessor" }
        }
      }
    }
  ) {
    id
    instructors {
      id
      name
      role
    }
  }
}
```

### 6. `updateAll`: Update All Elements in an Array
Merges properties into every element in the array:
```graphql
mutation UpdateAllInstructors {
  updateClassroom(
    input: {
      id: "class_101"
      instructors: {
        updateAll: {
          role: "Faculty"
        }
      }
    }
  ) {
    id
    instructors {
      name
      role
    }
  }
}
```

### 7. `pop`: Filter and Remove Matching Elements
Removes all elements that match the filter criteria:
```graphql
mutation RemoveInstructorById {
  updateClassroom(
    input: {
      id: "class_101"
      instructors: {
        pop: { id: "inst_99" }
      }
    }
  ) {
    id
    instructors {
      id
      name
    }
  }
}
```

### 8. `popFront`: Remove First Element
Removes the first element ($0$-index) from the array:
```graphql
mutation RemoveFirstTag {
  updateClassroom(
    input: {
      id: "class_101"
      tags: {
        popFront: true
      }
    }
  ) {
    id
    tags
  }
}
```

### 9. `popBack`: Remove Last Element
Removes the last element from the array:
```graphql
mutation RemoveLastTag {
  updateClassroom(
    input: {
      id: "class_101"
      tags: {
        popBack: true
      }
    }
  ) {
    id
    tags
  }
}
```

### 10. `popAll`: Clear Entire Array
Empties the entire array:
```graphql
mutation ClearAllTags {
  updateClassroom(
    input: {
      id: "class_101"
      tags: {
        popAll: true
      }
    }
  ) {
    id
    tags
  }
}
```

---

## 8. CRUD Mutations & Batch Operations

### Create Record
```graphql
mutation CreateUser {
  addUser(
    input: {
      username: "alex"
      email: "alex@example.com"
      status: active
      phone: {
        countryCode: "+1"
        number: "5551234567"
      }
    }
  ) {
    id
    username
    status
    createdAt
  }
}
```

### Batch Add Records
```graphql
mutation BatchCreateUsers {
  addUsers(
    input: [
      { username: "bob", email: "bob@example.com" },
      { username: "carol", email: "carol@example.com" }
    ]
  ) {
    id
    username
  }
}
```

### Update Record
```graphql
mutation UpdateUserProfile {
  updateUser(
    input: {
      id: "usr_clx123abc456"
      email: "alex.new@example.com"
    }
  ) {
    id
    username
    email
    updatedAt
  }
}
```

### Delete Record
```graphql
mutation RemoveUser {
  deleteUser(
    input: {
      id: "usr_clx123abc456"
    }
  ) {
    id
    username
  }
}
```

### Connect & Disconnect Relational Foreign Keys
```graphql
# Connect an existing UserProfile to a User
mutation ConnectProfile {
  addUserToProfileRelation(
    userId: "usr_123"
    userProfileId: "prof_456"
  ) {
    id
    profile {
      id
      bio
    }
  }
}

# Disconnect
mutation DisconnectProfile {
  removeUserToProfileRelation(
    userId: "usr_123"
    userProfileId: "prof_456"
  ) {
    id
    profile {
      id
    }
  }
}
```

---

## 9. Real-Time WebSocket Subscriptions

AutoGraphQL generates live pub/sub subscriptions for all `@model` entities:

```graphql
subscription OnUserUpdated {
  user(id: "usr_clx123abc456") {
    mutation
    node {
      id
      username
      email
      status
      updatedAt
    }
    updatedFields
  }
}
```

---

## 10. MongoDB Aggregation Pipelines (`AggregationController`)

AutoGraphQL includes **`AggregationController`** (`src/autoGenerate/graphql/controllers/AggregationController.js`), which dynamically translates GraphQL queries into native, multi-stage MongoDB Aggregation Pipelines:

### 1. Enabling Aggregation Mode
Annotate the type in your schema with `@databaseController(mode: aggregation)`:

```graphql
type AnalyticsSummary @model @databaseController(mode: aggregation) {
  id: ID!
  category: String!
  totalRevenue: Float!
  orderCount: Int!
  orders: [Order] @relation(name: "SummaryToOrders", direction: "OUT")
}
```

### 2. Generated Pipeline Stages

When executing a GraphQL query against an aggregation-enabled model, `AggregationController` dynamically builds the following MongoDB pipeline stages:

#### `$match` Stage (Filters & Security)
Translates GraphQL filter arguments and tenant isolation rules into initial `$match` conditions:
```javascript
{
  $match: {
    category: "Electronics",
    totalRevenue: { $gte: 10000 },
    tenantId: "tenant_enterprise_a" // Injected by RLS
  }
}
```

#### `$lookup` Stage (Relational Foreign Key Joins)
Converts `@relation` fields into MongoDB `$lookup` stages with sub-pipelines:
```javascript
{
  $lookup: {
    from: "orders",
    localField: "id",
    foreignField: "summaryId",
    as: "orders"
  }
}
```

#### `$project` Stage (Projections & Null Handling)
Maps the exact fields requested in the GraphQL selection set:
- **1:1 Relations**: Wraps in `{ $arrayElemAt: ["$relationName", 0] }` to project a single subdocument instead of an array.
- **Lists / Arrays**: Wraps in `{ $ifNull: ["$relationName", []] }` to prevent `null` array reference exceptions.
- **Default Values**: Uses `{ $ifNull: ["$field", defaultValue] }` to honor `@defaultValue` directives.
- **Aliases**: Automatically renames output fields matching GraphQL alias definitions.

#### `$sort`, `$skip`, `$limit` Stages (Pagination)
```javascript
{ $sort: { totalRevenue: -1 } },
{ $skip: 0 },
{ $limit: 25 }
```

### 3. Benefits of Aggregation Mode
- **Zero In-Memory Overhead**: Database joins and projections are executed in the database kernel rather than Node.js memory.
- **Complex Projections**: Computes field aliases, defaults, and sub-object extractions in a single database roundtrip.
