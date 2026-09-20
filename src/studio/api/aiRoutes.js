import express from 'express';
import fetch from 'node-fetch';
import { parse } from 'graphql';
import { GoogleAuth } from 'google-auth-library';
import { getStudioSchemaMetadata } from '../schemaScanner';

const router = express.Router();

/**
 * Exhaustive AutoGraphQL Directive Specification & Grammar
 */
const AUTOGRAPHQL_SPECIFICATION = `
AutoGraphQL compiles GraphQL SDL into dynamic Mongoose (MongoDB) or Sequelize (PostgreSQL) database models, queries, mutations, DataLoader resolvers, and real-time subscriptions.

CRITICAL RULES & NOMENCLATURE:
1. ENTITY DEFINITIONS & DATABASE ENGINES:
   - Every persistent database model MUST be marked with the '@model' directive.
   - Database dialect:
     - MongoDB (default): 'type Invoice @model { ... }'
     - PostgreSQL: 'type Invoice @model(database: postgres) { ... }'
   - Every model MUST have a unique primary identifier: 'id: ID!'

2. ROW-LEVEL SECURITY (RLS) & MULTI-TENANCY:
   - '@tenantScoped(field: "tenantId", claim: "tenantId")': Isolates records by tenant/organization automatically across queries and mutations.
   - '@ownerScoped(field: "userId", claim: "userId")': Restricts records to the creator / user ownership.

3. AUDIT TRAIL & VERSIONING:
   - '@history': Generates automatic, immutable temporal history tracking for every update and deletion.

4. DATABASE CONTROLLER:
   - '@databaseController(mode: aggregation)': Optimizes complex MongoDB queries via native aggregation pipelines instead of cascade.

5. RELATIONAL ASSOCIATIONS (@relation):
   - Used for 1:1, 1:N, or N:N links between entities.
   - Must specify 'name' and 'direction':
     - 'direction: "OUT"': Parent entity storing the foreign reference.
     - 'direction: "IN"': Child entity pointing back to the parent.
     - 'direction: "BOTH"': Many-to-many relationship.
   - Example Pair:
     type Author @model {
       id: ID!
       name: String!
       posts: [Post] @relation(name: "AuthorPosts", direction: "OUT")
       postsMeta: Meta @relationalMeta
     }
     type Post @model {
       id: ID!
       title: String!
       author: Author @relation(name: "AuthorPosts", direction: "IN")
     }

6. FIELD CONSTRAINTS & SANITIZATION:
   - '@trim': Strips whitespace from strings.
   - '@nameCase': Capitalizes words (e.g. "John Doe").
   - '@upperCase': Converts string to uppercase (e.g. SKU, ISO currency).
   - '@lowerCase': Converts string to lowercase (e.g. emails, usernames).
   - '@slug': Generates URL-safe slugs from strings.
   - '@unique': Enforces database uniqueness constraint.
   - '@uniqueOrEmpty': Sparse unique constraint (allows null/empty duplicates).
   - '@clamp(min: Float, max: Float)': Restricts numerical values to a range.
   - '@validate(regex: "...")': Validates string against regex before save.
   - '@defaultValue(value: "...")': Sets static or dynamic default value.
   - '@readOnly': Can be queried but excluded from add/update mutation inputs.
   - '@writeOnly': Allowed in mutation inputs, hidden from query output (e.g. passwords).
   - '@filterOff': Excluded from generated filter arguments.
   - '@encrypted': Encrypted at rest with AES-256.

7. DATABASE INDEXING:
   - '@createIndex(value: 1)': Creates ascending index (PostgreSQL B-Tree or MongoDB).
   - '@createIndex(value: -1)': Creates descending index.

8. CUSTOM ENUMS & DATA TYPES:
   - Declare enums before types:
     enum OrderStatus {
       PENDING
       PAID
       SHIPPED
       DELIVERED
       CANCELLED
     }
   - Supported scalar types: 'String', 'Int', 'Float', 'Boolean', 'ID', 'Date', 'JSONB'.
   - Non-null fields marked with '!' (e.g. 'String!').
   - Lists marked with square brackets (e.g. '[String]', '[Item]').
`;

/**
 * Builds the comprehensive system prompt for the LLM.
 */
export const buildSystemPrompt = (existingSchemas = []) => {
  let contextSection = '';
  if (existingSchemas && existingSchemas.length > 0) {
    const summary = existingSchemas.map((s) => `- ${s.name}`).join('\n');
    contextSection = `
ACTIVE SCHEMAS CURRENTLY IN PROJECT:
${summary}

If the user requests relationships linking to any of these existing entities, wire them correctly with '@relation(name: "<RelationName>", direction: "OUT" | "IN")'.
`;
  }

  return `You are an elite AutoGraphQL Schema Architect and GraphQL AST Compiler.
Your task is to take a developer's natural language request and generate production-ready, highly idiomatic AutoGraphQL SDL.

${AUTOGRAPHQL_SPECIFICATION}
${contextSection}

OUTPUT FORMAT RULES:
- Output ONLY valid GraphQL Schema Definition Language (SDL).
- Surround the SDL with \`\`\`graphql and \`\`\` code fences.
- Do NOT output conversational filler, introductory remarks, or post-generation explanations.
- Ensure all braces and brackets match and all directives have valid syntax.
`;
};

/**
 * Normalizes common SDL syntax variances from local LLMs (e.g. 'model Name' -> 'type Name', missing colons).
 */
export const normalizeSDL = (rawSdl) => {
  if (!rawSdl) return '';
  let sdl = rawSdl;

  // 1. Replace 'model <Name>' with 'type <Name>'
  sdl = sdl.replace(/\bmodel\s+([A-Z]\w*)/g, 'type $1');

  // 2. Fix field definitions missing colons (e.g. 'id ID!' -> 'id: ID!')
  sdl = sdl.replace(/^(\s+)([a-zA-Z]\w*)\s+([A-Z]\w*!?|\[[A-Z]\w*!?\])(.*)$/gm, (m, sp, fName, fType, rest) => {
    return `${sp}${fName}: ${fType}${rest}`;
  });

  return sdl;
};

/**
 * Cleans markdown code fences from LLM responses and normalizes syntax.
 */
export const extractSDL = (rawText) => {
  if (!rawText) return '';
  let text = rawText.trim();
  const graphqlBlockRegex = /```(?:graphql|gql)?\s*([\s\S]*?)\s*```/i;
  const match = text.match(graphqlBlockRegex);
  if (match && match[1]) {
    return normalizeSDL(match[1].trim());
  }
  // Fallback: strip leading/trailing backticks if any
  text = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');
  return normalizeSDL(text.trim());
};

/**
 * Extracts metadata from parsed GraphQL AST.
 */
export const inspectGeneratedSDL = (sdl) => {
  const ast = parse(sdl);
  const models = [];
  const enums = [];

  ast.definitions.forEach((def) => {
    if (def.kind === 'ObjectTypeDefinition') {
      const isModel = def.directives && def.directives.some((d) => d.name.value === 'model');
      const modelDirective = def.directives && def.directives.find((d) => d.name.value === 'model');
      let database = 'default';
      if (modelDirective && modelDirective.arguments) {
        const dbArg = modelDirective.arguments.find((a) => a.name.value === 'database');
        if (dbArg && dbArg.value) {
          database = dbArg.value.value || dbArg.value.name?.value || 'postgres';
        }
      }

      const fields = (def.fields || []).map((f) => ({
        name: f.name.value,
        type: f.type,
      }));

      models.push({
        name: def.name.value,
        isModel,
        database,
        fieldCount: fields.length,
      });
    } else if (def.kind === 'EnumTypeDefinition') {
      enums.push({
        name: def.name.value,
        values: (def.values || []).map((v) => v.name.value),
      });
    }
  });

  return { models, enums };
};

/**
 * Resolves Google Cloud access token and Project ID using Google SDK (ADC) or explicit inputs.
 */
export const resolveGoogleCloudCredentials = async (explicitApiKey, explicitProjectId) => {
  let token = explicitApiKey;
  let projectId = explicitProjectId || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;

  // If token is not provided or set to 'auto', attempt ADC using google-auth-library
  if (!token || token === 'auto') {
    try {
      const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
      const client = await auth.getClient();
      const tokenRes = await client.getAccessToken();
      token = (tokenRes && tokenRes.token) || tokenRes;
      if (!projectId) {
        projectId = await auth.getProjectId();
      }
    } catch (err) {
      if (!token) {
        throw new Error(
          `Google Cloud SDK authentication error: ${err.message}. Please login via 'gcloud auth application-default login' or provide a Bearer access token.`
        );
      }
    }
  }

  return { token, projectId };
};

/**
 * Dispatches a completion request to the configured LLM provider.
 */
export const callLLM = async ({
  provider = 'openai',
  apiKey,
  baseUrl,
  model,
  projectId,
  location,
  systemPrompt,
  userPrompt,
  temperature = 0.2,
}) => {
  const cleanProvider = (provider || 'openai').toLowerCase().trim();

  // 1a. Google Cloud Vertex AI (Gemini on GCP via Vertex AI REST API)
  if (
    cleanProvider === 'vertex'
    || cleanProvider === 'vertex-ai'
    || cleanProvider === 'vertexai'
    || cleanProvider === 'google-vertex'
  ) {
    const { token, projectId: gcpProject } = await resolveGoogleCloudCredentials(apiKey, projectId);
    if (!gcpProject) {
      throw new Error('Google Cloud Project ID is required for Vertex AI. Please configure via gcloud or specify in settings.');
    }

    const loc = location || process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    const modelName = model || 'gemini-1.5-pro';
    const endpoint = baseUrl || `https://${loc}-aiplatform.googleapis.com/v1/projects/${gcpProject}/locations/${loc}/publishers/google/models/${modelName}:generateContent`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          temperature,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Google Cloud Vertex AI error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      return data.candidates[0].content.parts.map((p) => p.text).join('\n');
    }
    throw new Error('Unexpected response structure from Vertex AI Gemini API');
  }

  // 1b. Anthropic (Claude)
  if (cleanProvider === 'anthropic' || cleanProvider === 'claude') {
    const endpoint = (baseUrl ? baseUrl.replace(/\/+$/, '') : 'https://api.anthropic.com/v1') + '/messages';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-20241022',
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        max_tokens: 4096,
        temperature,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    if (data.content && data.content[0] && data.content[0].text) {
      return data.content[0].text;
    }
    throw new Error('Unexpected response structure from Anthropic API');
  }

  // 2. Google Gemini Native Endpoint (if requested without custom OpenAI-compat proxy)
  if (cleanProvider === 'gemini' && (!baseUrl || baseUrl.includes('googleapis.com'))) {
    const modelName = model || 'gemini-2.0-flash';
    const endpoint = baseUrl
      ? (baseUrl.replace(/\/+$/, '') + '/chat/completions')
      : 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

    const headers = {
      'content-type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }
    throw new Error('Unexpected response structure from Gemini API');
  }

  // 3. OpenAI & OpenAI-Compatible Gateways (Ollama, Groq, OpenRouter, LocalAI, vLLM, etc.)
  let endpoint = 'https://api.openai.com/v1/chat/completions';
  if (cleanProvider === 'ollama') {
    endpoint = (baseUrl ? baseUrl.replace(/\/+$/, '') : 'http://localhost:11434/v1') + '/chat/completions';
  } else if (cleanProvider === 'groq') {
    endpoint = (baseUrl ? baseUrl.replace(/\/+$/, '') : 'https://api.groq.com/openai/v1') + '/chat/completions';
  } else if (cleanProvider === 'openrouter') {
    endpoint = (baseUrl ? baseUrl.replace(/\/+$/, '') : 'https://openrouter.ai/api/v1') + '/chat/completions';
  } else if (baseUrl) {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    endpoint = cleanBase.endsWith('/chat/completions') ? cleanBase : `${cleanBase}/chat/completions`;
  }

  const defaultModelMap = {
    openai: 'gpt-4o',
    ollama: 'llama3.2',
    groq: 'llama-3.3-70b-versatile',
    openrouter: 'openai/gpt-4o-mini',
  };

  const selectedModel = model || defaultModelMap[cleanProvider] || 'gpt-4o';

  const headers = {
    'content-type': 'application/json',
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`${provider.toUpperCase()} API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  }
  throw new Error(`Unexpected response structure from ${provider} API`);
};

/**
 * POST /api/studio/ai/test-connection
 * Pings the user's configured LLM endpoint to verify API key and connectivity.
 */
router.post('/api/studio/ai/test-connection', async (req, res) => {
  try {
    const {
      provider = req.headers['x-ai-provider'] || process.env.STUDIO_AI_PROVIDER || 'openai',
      apiKey = req.headers['x-ai-api-key'] || process.env.STUDIO_AI_API_KEY,
      baseUrl = req.headers['x-ai-base-url'] || process.env.STUDIO_AI_BASE_URL,
      model = req.headers['x-ai-model'] || process.env.STUDIO_AI_MODEL,
      projectId = req.headers['x-ai-project-id'] || process.env.GOOGLE_CLOUD_PROJECT || req.body?.projectId,
      location = req.headers['x-ai-location'] || process.env.GOOGLE_CLOUD_LOCATION || req.body?.location,
    } = req.body || {};

    const cleanProvider = (provider || 'openai').toLowerCase().trim();
    const isKeylessSupported = cleanProvider === 'ollama' || cleanProvider.startsWith('vertex');
    if (!apiKey && !isKeylessSupported) {
      return res.status(400).json({
        success: false,
        error: 'API key is required for commercial LLM providers',
      });
    }

    const startTime = Date.now();
    const result = await callLLM({
      provider: cleanProvider,
      apiKey,
      baseUrl,
      model,
      projectId,
      location,
      systemPrompt: 'You are a test responder. Output only the word OK.',
      userPrompt: 'Ping test',
      temperature: 0,
    });

    const latencyMs = Date.now() - startTime;

    res.json({
      success: true,
      message: `Successfully connected to ${cleanProvider} (${latencyMs}ms)`,
      latencyMs,
      response: result.trim().slice(0, 50),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/studio/ai/generate-schema
 * Main endpoint: Generates valid AutoGraphQL SDL with AST validation & auto-correction.
 */
router.post('/api/studio/ai/generate-schema', async (req, res) => {
  try {
    const {
      prompt,
      activeSchemaName,
      activeSchemaContent,
      mode = 'create', // 'create' or 'enhance'
      provider = req.headers['x-ai-provider'] || process.env.STUDIO_AI_PROVIDER || 'openai',
      apiKey = req.headers['x-ai-api-key'] || process.env.STUDIO_AI_API_KEY,
      baseUrl = req.headers['x-ai-base-url'] || process.env.STUDIO_AI_BASE_URL,
      model = req.headers['x-ai-model'] || process.env.STUDIO_AI_MODEL,
      projectId = req.headers['x-ai-project-id'] || process.env.GOOGLE_CLOUD_PROJECT || req.body?.projectId,
      location = req.headers['x-ai-location'] || process.env.GOOGLE_CLOUD_LOCATION || req.body?.location,
    } = req.body || {};

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'A natural language prompt is required to generate a schema',
      });
    }

    const cleanProvider = (provider || 'openai').toLowerCase().trim();
    const isKeylessSupported = cleanProvider === 'ollama' || cleanProvider.startsWith('vertex');
    if (!apiKey && !isKeylessSupported) {
      return res.status(400).json({
        success: false,
        error: 'API key is missing. Please configure your LLM settings in Studio.',
      });
    }

    // 1. Gather active schema context for RAG
    const metadata = getStudioSchemaMetadata();
    const existingSchemas = (metadata && metadata.schemas) || [];

    // 2. Build system and user prompts
    const systemPrompt = buildSystemPrompt(existingSchemas);
    let userPrompt = prompt.trim();

    if (mode === 'enhance' && activeSchemaContent) {
      userPrompt = `The developer wants to MODIFY or ENHANCE the following existing schema (${activeSchemaName || 'ActiveModel'}):\n\n\`\`\`graphql\n${activeSchemaContent.trim()}\n\`\`\`\n\nDeveloper Instructions for Modification:\n${prompt}\n\nPlease output the COMPLETE updated schema incorporating the requested additions or changes, maintaining existing fields and adding proper AutoGraphQL directives.`;
    }

    // 3. Initial LLM generation call
    let rawResult = await callLLM({
      provider: cleanProvider,
      apiKey,
      baseUrl,
      model,
      projectId,
      location,
      systemPrompt,
      userPrompt,
    });

    let generatedSDL = extractSDL(rawResult);
    let parsedMetadata = null;
    let attempts = 0;
    const maxRetries = 2;

    // 4. AST Validation & Self-Healing Loop
    while (attempts <= maxRetries) {
      try {
        parsedMetadata = inspectGeneratedSDL(generatedSDL);
        break; // Successfully parsed!
      } catch (parseError) {
        attempts += 1;
        if (attempts > maxRetries) {
          return res.status(422).json({
            success: false,
            error: `Failed to compile valid GraphQL AST after self-correction: ${parseError.message}`,
            rawOutput: generatedSDL,
          });
        }

        // Automatic retry prompt with AST error details
        const retryPrompt = `The previous GraphQL SDL you generated failed validation with the following syntax error:\n${parseError.message}\n\nHere was your previous code:\n\`\`\`graphql\n${generatedSDL}\n\`\`\`\n\nPlease fix this syntax error immediately and return ONLY the corrected valid GraphQL SDL enclosed in \`\`\`graphql ... \`\`\`.`;

        rawResult = await callLLM({
          provider: cleanProvider,
          apiKey,
          baseUrl,
          model,
          projectId,
          location,
          systemPrompt,
          userPrompt: retryPrompt,
        });

        generatedSDL = extractSDL(rawResult);
      }
    }

    // Extract primary model name
    const primaryModel = parsedMetadata.models[0] || { name: 'NewModel', database: 'default' };

    res.json({
      success: true,
      data: {
        sdl: generatedSDL,
        primaryModelName: primaryModel.name,
        database: primaryModel.database,
        models: parsedMetadata.models,
        enums: parsedMetadata.enums,
        selfHealed: attempts > 0,
        retriesCount: attempts,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
