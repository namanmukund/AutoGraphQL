# 🤖 AI Prompting & Agent Guide for AutoGraphQL

> **How to turn Cursor, Claude Code, Windsurf, and Copilot into world-class AutoGraphQL architects.**

AutoGraphQL was built from the ground up for the AI era: instead of asking your AI coding assistant to generate hundreds of lines of fragile ORM models, resolvers, and migrations, you instruct it to write concise, declarative GraphQL schemas.

---

## 🎯 The Core AI Mental Model

Tell your AI assistant:
> *"We are building an AutoGraphQL application. Do not write manual CRUD resolvers, database schemas, or migration files. Define data models strictly in `schemas/<Model>.graphql` using AutoGraphQL directives (`@model`, `@relation`, `@clamp`, `@defaultValue`, `@tenantScoped`). AutoGraphQL compiles the backend automatically."*

---

## 📋 Ready-to-Use Prompts

### 1. Multi-Tenant B2B SaaS Entity

**Prompt for Cursor / Claude:**
```
Create a multi-tenant Organization and TeamMember schema in schemas/Organization.graphql.
Ensure:
- Both models are @model.
- Organizations have a unique slug and plan with default "FREE".
- TeamMembers are tenant-scoped using @tenantScoped.
- Role must be an enum (OWNER, ADMIN, MEMBER).
- Relate TeamMembers to Organization using @relation.
```

**What the AI generates:**
```graphql
enum PlanType {
  FREE
  PRO
  ENTERPRISE
}

enum MemberRole {
  OWNER
  ADMIN
  MEMBER
}

type Organization @model {
  id: ID!
  name: String! @trim
  slug: String! @unique @trim @lowercase
  plan: PlanType! @defaultValue(value: "FREE")
  members: [TeamMember] @relation(name: "OrgMembers", field: "id", references: "orgId")
  createdAt: Date!
}

type TeamMember @model @tenantScoped(claim: "tenantId", field: "orgId") {
  id: ID!
  orgId: ID!
  userId: ID!
  email: String! @trim @lowercase
  role: MemberRole! @defaultValue(value: "MEMBER")
  organization: Organization @relation(name: "OrgMembers", field: "orgId", references: "id")
}
```

---

### 2. E-Commerce Product Catalog with Validation

**Prompt for Cursor / Claude:**
```
Design an E-Commerce Product and Category schema in schemas/Product.graphql.
- Categories have name and parentCategory (self-relation).
- Products have title, clamped price (minimum 0), stock (default 0), and formatted name (@nameCase).
- Link Product to Category with @relation.
```

---

### 3. Adding Custom Business Logic (Hooks)

When your AI needs to add business logic (e.g., password hashing, Stripe payment verification, or email notifications), prompt it to use in-process hooks instead of editing resolvers:

**Prompt for Cursor / Claude:**
```
Add a pre-mutation hook for 'addPayment' that verifies the transaction with Stripe 
before the database record is inserted.
Place it in hooks/paymentPreHook.js.
```

**What the AI generates in `hooks/paymentPreHook.js`:**
```javascript
export const addPaymentPreHook = async (input, context) => {
  const { stripeToken, amount } = input;
  
  // Call Stripe API
  const charge = await stripe.charges.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    source: stripeToken,
  });

  // Inject chargeId into the database mutation input
  return {
    ...input,
    stripeChargeId: charge.id,
    status: 'PAID',
  };
};
```

---

## ⚡ Directives Cheat-Sheet for AI Agents

| Directive | Target | Purpose | Example |
| :--- | :--- | :--- | :--- |
| **`@model`** | Type | Marks type as database entity | `type Product @model` |
| **`@model(database: postgres)`** | Type | Forces entity to PostgreSQL | `@model(database: postgres)` |
| **`@relation`** | Field | Defines 1:1, 1:N, or N:N links | `@relation(name: "Rel", field: "userId", references: "id")` |
| **`@trim`** | Field | Trims whitespace | `name: String! @trim` |
| **`@nameCase`** | Field | Capitalizes words | `fullName: String! @nameCase` |
| **`@clamp`** | Field | Enforces min/max numeric bounds | `discount: Float @clamp(min: 0, max: 100)` |
| **`@defaultValue`** | Field | Sets initial value on insert | `status: String @defaultValue(value: "active")` |
| **`@tenantScoped`** | Type | Injects automatic tenant isolation | `@tenantScoped(claim: "tenantId", field: "tenantId")` |
| **`@ownerScoped`** | Type | Restricts access to creator | `@ownerScoped(claim: "userId", field: "userId")` |
| **`@userPermissions`** | Type/Field | Role-based read/write access | `@userPermissions(read: ["ADMIN", "USER"])` |
