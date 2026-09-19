# Security Policy

The AutoGraphQL team takes security issues seriously and appreciates responsible disclosure from the community.

---

## 🛡️ Supported Versions

We actively provide security patches and updates for the following versions of AutoGraphQL:

| Version | Supported          | Security Patches |
| ------- | ------------------ | ---------------- |
| 1.x.x   | :white_check_mark: | Active           |
| < 1.0.0 | :x:                | End of Life      |

If you are using an older version, we strongly recommend upgrading to the latest release to ensure you receive security and stability enhancements.

---

## 🚨 Reporting a Vulnerability

**Please DO NOT report security vulnerabilities through public GitHub issues.**

If you believe you have discovered a security vulnerability in AutoGraphQL, please report it confidentially using one of the following methods:

1. **GitHub Private Vulnerability Reporting (Preferred):**
   - Navigate to the repository's [Security Advisories](https://github.com/namanmukund/AutoGraphQL/security/advisories) tab.
   - Click **"Report a vulnerability"** to open a confidential report directly with repository maintainers.

2. **Direct Email Disclosure:**
   - Send an email to **namanmukund@gmail.com** with the subject line: `[SECURITY] AutoGraphQL Vulnerability Report`.

### What to Include in Your Report
To help us triage and resolve the issue quickly, please provide:
- A description of the vulnerability and its potential impact.
- Clear, reproducible steps or a proof-of-concept (POC) script or GraphQL query.
- The affected component (e.g. Authentication middleware, AST engine, DataLoader, Webhook HMAC dispatcher, RLS engine).
- Any proposed remediations or patches if available.

### Response Timeline
- **Initial Acknowledgment:** Within **48 hours** of receiving your report.
- **Triage & Assessment:** We will investigate and confirm the impact within **5 business days**.
- **Fix & Public Advisory:** Once resolved, we will publish a security patch release and coordinate the public advisory with proper attribution.

---

## 🔒 Built-in Security Safeguards in AutoGraphQL

AutoGraphQL incorporates defense-in-depth principles across the engine:

1. **Row-Level Security (RLS) & Multi-Tenancy:**
   - Declarative `@tenantScoped` and `@ownerScoped` directives enforce automatic query filtering at the database layer, overriding client-supplied tenant claims.
2. **Query Complexity & Depth Safeguards:**
   - Built-in validation rules reject malicious nested queries exceeding configurable depth and complexity thresholds before execution.
3. **Cryptographic Webhook Signatures:**
   - Transactional outbox webhooks are signed using `HMAC-SHA256` (`x-autographql-signature`) to guarantee payload integrity.
4. **Request-Scoped DataLoader Memoization:**
   - DataLoaders are isolated per HTTP request to prevent cross-tenant or cross-user cache leakage.
5. **AST Strict Directives:**
   - Directives such as `@readOnly`, `@writeOnly`, `@clamp`, and `@trim` prevent mass-assignment and parameter tampering.

---

## 🏅 Attribution & Recognition

We deeply value researchers and developers who contribute to the security of open source software. If you report a valid security vulnerability, we will gladly credit your contribution in our release notes and security advisories (unless you prefer to remain anonymous).
