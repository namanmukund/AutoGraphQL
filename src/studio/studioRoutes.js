import express from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { printSchema } from 'graphql';
import { getStudioSchemaMetadata, getStudioDatabaseInfo, getStudioHooksList } from './schemaScanner';
import { listWebhooks, registerWebhook, unregisterWebhook } from '../birdwatch/webhooks/manager';
import { generateTypeScriptSDK } from '../codegen/sdkGenerator';
import schema from '../graphql';
import authParams from '../../config/authParams';

const router = express.Router();

// 1. Serve Studio Single-Page Application
router.get(['/studio', '/console'], (req, res) => {
  const htmlPath = path.resolve(__dirname, 'public', 'index.html');
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    res.status(404).send('AutoGraphQL Studio UI not found');
  }
});

// 2. GET /api/studio/schemas - List all schemas
router.get('/api/studio/schemas', (req, res) => {
  try {
    const metadata = getStudioSchemaMetadata();
    res.json({ success: true, data: metadata });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/studio/schemas - Save or create a schema file
router.post('/api/studio/schemas', (req, res) => {
  try {
    const { name, content } = req.body;
    if (!name || !content) {
      return res.status(400).json({ success: false, error: 'Schema name and content are required' });
    }

    const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, '');
    const schemasDir = path.resolve(process.cwd(), 'schemas');

    if (!fs.existsSync(schemasDir)) {
      fs.mkdirSync(schemasDir, { recursive: true });
    }

    const filePath = path.join(schemasDir, `${cleanName}.graphql`);
    fs.writeFileSync(filePath, content.trim(), 'utf8');

    res.json({
      success: true,
      message: `Schema '${cleanName}.graphql' saved successfully`,
      path: filePath,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const findSchemaFile = (name) => {
  const schemasDir = path.resolve(process.cwd(), 'schemas');
  if (!fs.existsSync(schemasDir)) return null;

  const baseName = name.replace(/\.(graphql|gql)$/i, '').replace(/[^a-zA-Z0-9_-]/g, '');
  const directPaths = [
    path.join(schemasDir, `${baseName}.graphql`),
    path.join(schemasDir, `${baseName}.gql`),
    path.join(schemasDir, name),
  ];

  for (let i = 0; i < directPaths.length; i += 1) {
    const p = directPaths[i];
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }

  // Recursive search in schemas/
  const searchRecursive = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = searchRecursive(fullPath);
        if (found) return found;
      } else if (
        entry.isFile()
        && (entry.name === `${baseName}.graphql` || entry.name === `${baseName}.gql` || entry.name === name)
      ) {
        return fullPath;
      }
    }
    return null;
  };

  return searchRecursive(schemasDir);
};

// 4. DELETE /api/studio/schemas/:name - Delete a schema file
router.delete('/api/studio/schemas/:name', (req, res) => {
  try {
    const { name } = req.params;
    const targetPath = findSchemaFile(name);

    if (targetPath && fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      res.json({ success: true, message: `Schema '${path.basename(targetPath)}' deleted successfully` });
    } else {
      res.status(404).json({ success: false, error: `Schema '${name}' not found` });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. GET /api/studio/hooks - List all hooks
router.get('/api/studio/hooks', (req, res) => {
  try {
    const hooks = getStudioHooksList();
    res.json({ success: true, data: hooks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. POST /api/studio/hooks - Save or update hook file
router.post('/api/studio/hooks', (req, res) => {
  try {
    const { name, content } = req.body;
    if (!name || !content) {
      return res.status(400).json({ success: false, error: 'Hook name and content are required' });
    }

    const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, '');
    const hooksDir = path.resolve(process.cwd(), 'hooks');

    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }

    const filePath = path.join(hooksDir, `${cleanName}.js`);
    fs.writeFileSync(filePath, content.trim(), 'utf8');

    res.json({
      success: true,
      message: `Hook '${cleanName}.js' saved successfully`,
      path: filePath,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. DELETE /api/studio/hooks/:name - Delete a hook file
router.delete('/api/studio/hooks/:name', (req, res) => {
  try {
    const { name } = req.params;
    const cleanName = name.replace(/\.js$/, '').replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = path.join(process.cwd(), 'hooks', `${cleanName}.js`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: `Hook '${cleanName}.js' deleted successfully` });
    } else {
      res.status(404).json({ success: false, error: `Hook '${cleanName}.js' not found` });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. GET /api/studio/db-info - Database diagnostics
router.get('/api/studio/db-info', (req, res) => {
  try {
    const info = getStudioDatabaseInfo();
    res.json({ success: true, data: info });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Webhooks APIs (Birdwatch)
router.get('/api/studio/webhooks', (req, res) => {
  try {
    const webhooks = listWebhooks();
    res.json({ success: true, data: webhooks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/studio/webhooks', (req, res) => {
  try {
    const { url, events = ['*'], secret } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'Webhook URL is required' });
    }
    const webhook = registerWebhook({ url, events, secret });
    res.json({ success: true, message: 'Webhook registered successfully', data: webhook });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/studio/webhooks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const removed = unregisterWebhook(id);
    res.json({ success: true, message: 'Webhook removed', removed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. TypeScript SDK Generator
router.get('/api/studio/sdk', (req, res) => {
  try {
    const sdkCode = generateTypeScriptSDK(schema);
    res.json({ success: true, data: sdkCode });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Full Schema SDL Dump
router.get('/api/studio/schema-dump', (req, res) => {
  try {
    const sdl = printSchema(schema);
    res.json({ success: true, data: sdl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. POST /api/studio/generate-token - Generate test JWT tokens
router.post('/api/studio/generate-token', (req, res) => {
  try {
    const {
      role = 'ADMIN',
      userId = 'usr_studio_test',
      tenantId = 'tenant_studio_default',
      expiresIn = '7d',
    } = req.body;

    const payload = {
      userInfo: {
        id: userId,
        username: userId,
        role,
        tenantId,
      },
      tenantId,
      role,
      appName: 'core',
    };

    const secret = (authParams && authParams.user && authParams.user.secret)
      || (authParams && authParams.SECRET)
      || 'development-jwt-secret-key-replace-in-production';

    const token = jwt.sign(payload, secret, { expiresIn });

    res.json({
      success: true,
      token,
      payload,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
