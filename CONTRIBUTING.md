# Contributing to AutoGraphQL

Thank you for your interest in contributing to **AutoGraphQL**! 🎉

AutoGraphQL is an open-source, schema-first, AST-driven GraphQL backend engine designed to make building high-performance Node.js APIs instantaneous and enjoyable. We welcome contributions of all kinds: bug reports, feature proposals, documentation improvements, architectural reviews, and code contributions.

Please take a moment to review this document to understand our development workflow and contribution standards.

---

## 📜 Code of Conduct

All contributors and maintainers are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you pledge to foster an inclusive, respectful, and harassment-free community for everyone.

---

## 🧭 How Can I Contribute?

### 1. Reporting Bugs
Before submitting a new issue, please check existing [Open Issues](https://github.com/namanmukund/AutoGraphQL/issues) to ensure the bug has not already been reported.

When opening a bug report via our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.yml), please include:
- A clear, descriptive title.
- Steps to reproduce the behavior.
- Relevant GraphQL schema definition or mutation payloads.
- Expected vs. actual behavior.
- Environment details (Node version, OS, database dialect: MongoDB vs. PostgreSQL).
- Relevant server logs or terminal stack traces.

### 2. Suggesting Enhancements
Have an idea for a new directive, database connector, or Studio capability? We would love to hear it!
Open an issue using our [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.yml) describing:
- The problem or use-case you are trying to solve.
- Proposed solution or API syntax.
- Any alternative solutions or workarounds considered.

### 3. Improving Documentation
Clear documentation is essential. If you find typos, unclear instructions, or missing examples in our guides or README:
- Edit the file directly or open a Pull Request.
- All documentation files are organized in `docs/` and `README.md`.

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher (we recommend managing via [nvm](https://github.com/nvm-sh/nvm)).
- **npm**: `v9.0.0` or higher.
- **Docker & Docker Compose** *(optional, for running local databases)*.

### 1. Fork and Clone the Repository
```bash
git clone https://github.com/<your-username>/AutoGraphQL.git
cd AutoGraphQL
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```
Ensure your database connection string and ports are set appropriately:
```ini
PORT=3000
DEFAULT_DATABASE_DIALECT=mongoose
MONGO_DB_URL=mongodb://localhost:27017/autographql_dev
DATABASE_URL=postgres://autographql:secret@localhost:5432/autographql_dev
```

### 4. Start Local Databases (Optional)
If you have Docker installed:
```bash
npm run db:up
```

### 5. Launch the Development Server
```bash
npm run dev
```
Once started:
- **AutoGraphQL Studio:** [`http://localhost:3000/studio`](http://localhost:3000/studio)
- **GraphQL Playground:** [`http://localhost:3000/graphql/core`](http://localhost:3000/graphql/core)
- **Health Probes:** [`http://localhost:3000/health/live`](http://localhost:3000/health/live)

---

## 🧪 Running Tests & Quality Checks

Always verify that the test suite passes before opening a Pull Request.

### Run Automated Tests
```bash
npm test
```
AutoGraphQL uses Mocha/Jest for unit, reliability, and integration tests across:
- **Reliability:** Request-scoped DataLoader batching, depth limits, query complexity, and Kubernetes health probes.
- **Event Automation:** Transactional Outbox, webhook dispatcher, and HMAC signatures.
- **Architecture:** PostgreSQL Sequelize model generator, MongoDB dynamic schemas, RLS isolation, and TypeScript SDK codegen.

### Code Linting
```bash
npm run lint
# Or automatically fix lint issues:
npm run lint:fix
```

---

## 🌿 Git Branching & Commit Guidelines

### Branch Naming Conventions
Prefix your branch name according to the nature of your change:
- `feat/<feature-name>`: New features or directives (e.g. `feat/sqlite-connector`)
- `fix/<bug-name>`: Bug fixes (e.g. `fix/auth-cache-poisoning`)
- `docs/<doc-name>`: Documentation updates (e.g. `docs/add-aggregations-tutorial`)
- `test/<test-name>`: Test improvements or additional coverage
- `refactor/<area>`: Code refactoring without behavior change

### Commit Message Guidelines
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
```text
<type>(<optional scope>): <short description in present tense>

[optional body explaining motivation and context]

[optional footer(s)]
```

**Examples:**
- `feat(studio): add real-time telemetry metrics and streaming console`
- `fix(auth): prevent caching null records on database misses`
- `docs(readme): add visual screenshots for studio tabs`
- `test(dataloader): add test for request-scoped batching with multi-db`

---

## 🚀 Pull Request Checklist

When you are ready to submit your work:
1. Ensure your branch is rebased on the latest `main` branch.
2. Verify all automated tests pass: `npm test`.
3. Check code formatting: `npm run lint`.
4. Open a Pull Request on GitHub targeting `main`.
5. Fill out the Pull Request template completely, detailing:
   - What changed and why.
   - Any breaking changes or schema migrations.
   - Verification steps and testing evidence.
6. A maintainer will review your Pull Request, provide feedback, and merge upon approval.

---

## 💬 Community & Questions

- **Discussions & Q&A:** Open a topic on [GitHub Discussions](https://github.com/namanmukund/AutoGraphQL/discussions).
- **Security Inquiries:** Please review our [Security Policy](SECURITY.md) before reporting security-sensitive issues.

Thank you for contributing to the future of AutoGraphQL! 🚀
