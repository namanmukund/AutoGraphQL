# 🪝 Drop-in Mutation Lifecycle Hooks Directory

Welcome to the **AutoGraphQL Drop-in Hooks** directory!

Any JavaScript file in this folder exporting `${mutationName}PreHook` or `${mutationName}PostHook` functions is **automatically discovered and executed** around database mutations.

---

## ⚡ Quick Example

Create `hooks/orderHooks.js`:

```javascript
// hooks/orderHooks.js

/**
 * Pre-Hook for addOrder:
 * Executed BEFORE database insertion.
 * Use for input validation, slug generation, password hashing, and enrichment.
 */
export const addOrderPreHook = [
  async (input, context) => {
    // 1. Auto-generate order number if not supplied
    if (!input.orderNumber) {
      input.orderNumber = `ORD-${Date.now()}`;
    }

    // 2. Validate price threshold
    if (input.totalAmount < 0) {
      throw new Error('Total amount cannot be negative');
    }

    return input; // Return modified input for database insertion
  },
];

/**
 * Post-Hook for addOrder:
 * Executed AFTER database insertion succeeds.
 * Use for sending confirmation emails, push notifications, and CRM sync.
 */
export const addOrderPostHook = [
  async (result, input, context) => {
    console.log(`Order #${result.orderNumber} successfully created with ID: ${result.id}`);
    // Trigger async side-effects
    return result;
  },
];
```

---

## 📌 Available Hook Conventions:
- **`add<Model>PreHook`** & **`add<Model>PostHook`** (e.g. `addUserPreHook`, `addOrderPostHook`)
- **`update<Model>PreHook`** & **`update<Model>PostHook`** (e.g. `updateUserPreHook`, `updateOrderPostHook`)
- **`delete<Model>PreHook`** & **`delete<Model>PostHook`** (e.g. `deleteUserPreHook`, `deleteOrderPostHook`)
