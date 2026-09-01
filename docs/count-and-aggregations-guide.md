# 🔢 Count & Aggregation Queries Guide in AutoGraphQL

This guide provides a comprehensive walkthrough of AutoGraphQL's **statistical aggregation and count query architecture**, covering total record counts, filtered counts, group-by segmentations, relational child counts, and multi-tenant isolation across MongoDB and PostgreSQL.

---

## 📑 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Companion `*Meta` Queries](#2-companion-meta-queries)
3. [Total & Filtered Count Queries](#3-total--filtered-count-queries)
4. [Group-By Aggregations (`groupBy`)](#4-group-by-aggregations-groupby)
5. [Relational Child Counts (`@relationalMeta`)](#5-relational-child-counts-relationalmeta)
6. [Row-Level Security (RLS) & Multi-Tenancy on Counts](#6-row-level-security-rls--multi-tenancy-on-counts)
7. [Database Execution Engine (MongoDB vs PostgreSQL)](#7-database-execution-engine-mongodb-vs-postgresql)
8. [Complete GraphQL Query Examples](#8-complete-graphql-query-examples)

---

## 1. Architecture Overview

In standard GraphQL setups, determining the total number of matching records often requires fetching the entire array of objects over the network and checking its length, wasting CPU, memory, and database bandwidth.

AutoGraphQL solves this by automatically generating a companion **`*Meta`** query for every `@model` entity in your schema:

```
[ Client Request ]
       │
       ▼
[ *Meta Query Resolver (fetchListAggregationQueryResolver) ]
       │
       ├──► [ RLS Multi-Tenant Injection (Tenant Filter) ]
       ├──► [ Filter Validator & Permission Check ]
       │
       ▼
[ QueryController.fetchCount() ]
       ├──► [ MongoDB: Model.countDocuments() / $group Pipeline ]
       └──► [ PostgreSQL: SELECT COUNT(*) / GROUP BY Query ]
```

---

## 2. Companion `*Meta` Queries

For every type declared with `@model`, AutoGraphQL generates a companion query with the `Meta` suffix:

| Entity Type | Auto-Generated List Query | Auto-Generated Meta Query |
| :--- | :--- | :--- |
| `User` | `users(...)` | **`usersMeta(...)`** |
| `Order` | `orders(...)` | **`ordersMeta(...)`** |
| `Product` | `products(...)` | **`productsMeta(...)`** |
| `AuditLog` | `auditLogs(...)` | **`auditLogsMeta(...)`** |

### The `Meta` Return Type
```graphql
type Meta {
  count: Int!
  groupByFieldName: String
  groupByData: [GroupByResult]
}

type GroupByResult {
  groupByFieldValue: String!
  count: Int!
}
```

---

## 3. Total & Filtered Count Queries

### A. Total Collection Count
Fetch the total number of records in the database with zero overhead:

```graphql
query GetTotalUsersCount {
  usersMeta {
    count
  }
}
```

### B. Filtered Count (Search Matches)
Calculate how many documents match complex filter conditions without loading any rows into memory:

```graphql
query CountActiveSubscribers {
  usersMeta(
    filter: {
      and: [
        { status: "active" }
        { isSubscribed: true }
        { createdAt_gte: "2026-01-01T00:00:00.000Z" }
      ]
    }
  ) {
    count
  }
}
```

---

## 4. Group-By Aggregations (`groupBy`)

To segment records and calculate counts per category or status, enable the `@groupBy` directive on the target field:

```graphql
type Order @model {
  id: ID!
  orderNumber: String!
  status: OrderStatus! @groupBy   # Enables groupBy segmentation on this field
  country: String! @groupBy      # Enables groupBy segmentation by country
  totalAmount: Float!
}
```

### Group-By Query Example
Segment and count orders by their current `status`:

```graphql
query OrdersCountByStatus {
  ordersMeta(groupBy: "status") {
    count                       # Total count across all statuses
    groupByFieldName            # "status"
    groupByData {
      groupByFieldValue         # e.g. "COMPLETED", "PENDING", "CANCELLED"
      count                     # Count for this specific status
    }
  }
}
```

### Sample Response:
```json
{
  "data": {
    "ordersMeta": {
      "count": 1450,
      "groupByFieldName": "status",
      "groupByData": [
        { "groupByFieldValue": "COMPLETED", "count": 1200 },
        { "groupByFieldValue": "PENDING", "count": 200 },
        { "groupByFieldValue": "CANCELLED", "count": 50 }
      ]
    }
  }
}
```

### Filtered Group-By Query
Combine filters with `groupBy` to segment only a subset of data (e.g. Orders created this month segmented by country):

```graphql
query MonthlyOrdersByCountry {
  ordersMeta(
    filter: {
      createdAt_gte: "2026-09-01T00:00:00.000Z"
    }
    groupBy: "country"
  ) {
    count
    groupByData {
      groupByFieldValue
      count
    }
  }
}
```

---

## 5. Relational Child Counts (`@relationalMeta`)

When fetching parent records (e.g. Authors or Users), you often need to show the count of child items (e.g. total posts written) without loading the entire child list.

Annotate the relation with `@relationalMeta`:

```graphql
type User @model {
  id: ID!
  username: String!
  posts: [Post] @relation(name: "UserToPosts", direction: "OUT")
  postsMeta: Meta @relationalMeta # Exposes child count on the user object
}
```

### Querying Relational Counts:
```graphql
query GetUsersWithPostCounts {
  users(first: 10) {
    id
    username
    postsMeta {
      count # Resolves child post count without loading post contents
    }
  }
}
```

---

## 6. Row-Level Security (RLS) & Multi-Tenancy on Counts

AutoGraphQL strictly enforces multi-tenancy and Row-Level Security (RLS) on all count queries:

```graphql
type Invoice @model @tenantScoped(field: "organizationId", claim: "organizationId") {
  id: ID!
  amount: Float!
  organizationId: String!
}
```

### Security Guarantees:
1. **Tenant Isolation**: When an authenticated user calls `invoicesMeta`, the query automatically receives `{ organizationId: context.organizationId }`. The client only ever receives the count of invoices belonging to their tenant.
2. **Anti-Spoofing**: If a malicious tenant calls `invoicesMeta(filter: { organizationId: "victim_tenant" })`, the RLS engine overrides the filter with their verified JWT claim.
3. **Admin Exemption**: Users with role `ADMIN` or `bypass: true` receive global cross-tenant count statistics.

---

## 7. Database Execution Engine (MongoDB vs PostgreSQL)

AutoGraphQL optimizes count operations according to the backing database dialect:

### MongoDB Execution:
- **Total / Filtered Count**: Executes native `Model.countDocuments(whereQuery)`.
- **Group-By Aggregation**: Executes a single `$group` aggregation pipeline stage:
  ```javascript
  Model.aggregate([
    { $match: whereQuery },
    { $group: { _id: `$${groupByField}`, count: { $sum: 1 } } }
  ])
  ```

### PostgreSQL Execution:
- **Total / Filtered Count**: Executes `SELECT COUNT(*) FROM "table" WHERE ...`.
- **Group-By Aggregation**: Executes an optimized SQL `GROUP BY` query:
  ```sql
  SELECT "status", COUNT("id") AS "count"
  FROM "orders"
  WHERE "organizationId" = 'tenant_123'
  GROUP BY "status";
  ```

---

## 8. Complete GraphQL Query Examples

### Scenario 1: Dashboard Metric Cards
```graphql
query DashboardSummaryMetrics {
  totalUsers: usersMeta {
    count
  }
  activeUsers: usersMeta(filter: { status: "active" }) {
    count
  }
  pendingOrders: ordersMeta(filter: { status: "PENDING" }) {
    count
  }
  totalRevenueRecords: salesMeta {
    count
  }
}
```

### Scenario 2: Segmented Chart Data
```graphql
query UserDistributionByRole {
  usersMeta(groupBy: "role") {
    count
    groupByData {
      groupByFieldValue
      count
    }
  }
}
```
