# 🎯 Drop-in GraphQL Schemas Directory

Welcome to the **AutoGraphQL Drop-in Schemas** directory!

Any `.graphql`, `.gql`, or `.js` file you place in this folder (or any sub-folder) is **automatically discovered and compiled** by AutoGraphQL upon server boot.

---

## ⚡ Quick Example

Create `schemas/Product.graphql`:

```graphql
type Product @model {
  id: ID!
  title: String! @trim
  sku: String! @unique
  price: Float! @clamp(min: 0)
  inStock: Boolean @defaultValue(value: "true")
  category: Category @relation(name: "CategoryProducts", direction: "IN")
  tags: [String] @createIndex(value: 1)
  createdAt: Date!
  updatedAt: Date!
}
```

### ✨ Auto-Generated Instant Capabilities:
1. **Database Model**: MongoDB Mongoose or PostgreSQL Sequelize model (based on `DEFAULT_DATABASE_DIALECT` in `.env`).
2. **Queries**: `product(id: ID)`, `products(filter, first, skip, orderBy)`, `productsMeta(filter, groupBy)`.
3. **Mutations**: `addProduct`, `addProducts`, `updateProduct`, `updateProducts`, `deleteProduct`, `deleteProducts`.
4. **Relational Connectors**: `addCategoryProductsRelation`, `removeCategoryProductsRelation`.
5. **DataLoader**: Batching and caching with zero $N+1$ queries.
6. **Subscriptions**: Live real-time WebSocket events.

---

## 🐘 Routing to PostgreSQL:
To route a model to PostgreSQL instead of MongoDB, simply add `database: postgres`:

```graphql
type Order @model(database: postgres) {
  id: ID!
  orderNumber: String! @unique
  totalAmount: Float!
  createdAt: Date!
}
```
