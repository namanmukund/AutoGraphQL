import assert from 'assert';
import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import studioRouter from '../src/studio/studioRoutes';
import {
  buildSystemPrompt,
  extractSDL,
  inspectGeneratedSDL,
} from '../src/studio/api/aiRoutes';

describe('AutoGraphQL Studio AI Copilot & Universal LLM Gateway', () => {
  let server;
  let baseUrl;

  before((done) => {
    const app = express();
    app.use(bodyParser.json());
    app.use(studioRouter);

    server = http.createServer(app);
    server.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      done();
    });
  });

  after((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  describe('1. AutoGraphQL Directive Knowledge & System Prompt Engine', () => {
    it('should build a comprehensive prompt containing all core AutoGraphQL directives', () => {
      const prompt = buildSystemPrompt([]);
      assert.strictEqual(typeof prompt, 'string');
      assert.strictEqual(prompt.includes('@model'), true);
      assert.strictEqual(prompt.includes('@tenantScoped'), true);
      assert.strictEqual(prompt.includes('@ownerScoped'), true);
      assert.strictEqual(prompt.includes('@history'), true);
      assert.strictEqual(prompt.includes('@relation'), true);
      assert.strictEqual(prompt.includes('@clamp'), true);
      assert.strictEqual(prompt.includes('@validate'), true);
      assert.strictEqual(prompt.includes('@defaultValue'), true);
      assert.strictEqual(prompt.includes('@trim'), true);
      assert.strictEqual(prompt.includes('@unique'), true);
    });

    it('should inject active project schemas into prompt for context-aware relationships', () => {
      const existingSchemas = [
        { name: 'User' },
        { name: 'Course' },
        { name: 'Category' },
      ];
      const prompt = buildSystemPrompt(existingSchemas);
      assert.strictEqual(prompt.includes('ACTIVE SCHEMAS CURRENTLY IN PROJECT:'), true);
      assert.strictEqual(prompt.includes('- User'), true);
      assert.strictEqual(prompt.includes('- Course'), true);
      assert.strictEqual(prompt.includes('- Category'), true);
    });
  });

  describe('2. Markdown SDL Cleaner & Code Block Extractor', () => {
    it('should extract SDL from ```graphql code block', () => {
      const rawResponse = `
Here is your requested schema:
\`\`\`graphql
type Invoice @model(database: postgres) {
  id: ID!
  amount: Float!
}
\`\`\`
Hope this helps!`;

      const extracted = extractSDL(rawResponse);
      assert.strictEqual(extracted.includes('type Invoice @model(database: postgres)'), true);
      assert.strictEqual(extracted.includes('Here is your requested'), false);
      assert.strictEqual(extracted.includes('Hope this helps'), false);
    });

    it('should handle raw SDL without markdown fences gracefully', () => {
      const raw = `type Order @model { id: ID! }`;
      assert.strictEqual(extractSDL(raw), raw);
    });
  });

  describe('3. GraphQL AST Syntax Inspection & Linter', () => {
    it('should parse valid SDL with custom enums, postgres database, and directives', () => {
      const sdl = `
enum OrderStatus {
  PENDING
  PAID
  SHIPPED
}

type Order @model(database: postgres) @history @tenantScoped {
  id: ID!
  orderNumber: String! @unique @upperCase
  total: Float! @clamp(min: 0, max: 100000)
  status: OrderStatus @defaultValue(value: "PENDING")
}
`;

      const metadata = inspectGeneratedSDL(sdl);
      assert.strictEqual(metadata.models.length, 1);
      assert.strictEqual(metadata.models[0].name, 'Order');
      assert.strictEqual(metadata.models[0].isModel, true);
      assert.strictEqual(metadata.models[0].database, 'postgres');
      assert.strictEqual(metadata.enums.length, 1);
      assert.strictEqual(metadata.enums[0].name, 'OrderStatus');
      assert.deepStrictEqual(metadata.enums[0].values, ['PENDING', 'PAID', 'SHIPPED']);
    });

    it('should throw syntax error on invalid or broken SDL', () => {
      const brokenSDL = `type BrokenModel @model { id: ID! missingBrace`;
      assert.throws(() => {
        inspectGeneratedSDL(brokenSDL);
      }, /Syntax Error/);
    });
  });

  describe('4. AI Studio API Validation & Security Guardrails', () => {
    it('should reject generate-schema without prompt with 400', async () => {
      const res = await fetch(`${baseUrl}/api/studio/ai/generate-schema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: '' }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error.includes('prompt is required'), true);
    });

    it('should reject generate-schema when API key is missing for cloud providers', async () => {
      const res = await fetch(`${baseUrl}/api/studio/ai/generate-schema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Create Order model', provider: 'openai' }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error.includes('API key is missing'), true);
    });

    it('should reject test-connection when API key is missing for cloud providers', async () => {
      const res = await fetch(`${baseUrl}/api/studio/ai/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'openai', apiKey: '' }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error.includes('API key is required'), true);
    });
  });

  describe('5. Google Cloud Vertex AI (Gemini + Google SDK)', () => {
    it('should allow vertex-ai provider in test-connection without requiring client-side API key', async function () {
      this.timeout(20000);
      const res = await fetch(`${baseUrl}/api/studio/ai/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'vertex-ai',
          projectId: 'test-mock-project',
          location: 'us-central1',
          baseUrl: 'http://127.0.0.1:59999/mock-vertex',
        }),
      });
      // It should not fail with "API key is required for commercial LLM providers" (status 400)
      assert.notStrictEqual(res.status, 400);
    });

    it('should require Project ID for Vertex AI when not configured', async () => {
      const res = await fetch(`${baseUrl}/api/studio/ai/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'vertex-ai',
          apiKey: 'fake-token',
          projectId: '',
        }),
      });
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error.includes('Project ID is required'), true);
    });
  });
});
