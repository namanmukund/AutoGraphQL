import express from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { getStudioSchemaMetadata, getStudioDatabaseInfo, getStudioHooksList } from './schemaScanner';
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

// 4. DELETE /api/studio/schemas/:name - Delete a schema file
router.delete('/api/studio/schemas/:name', (req, res) => {
  try {
    const { name } = req.params;
    const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = path.join(process.cwd(), 'schemas', `${cleanName}.graphql`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: `Schema '${cleanName}.graphql' deleted successfully` });
    } else {
      res.status(404).json({ success: false, error: `Schema '${cleanName}.graphql' not found` });
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

// 7. GET /api/studio/db-info - Database diagnostics
router.get('/api/studio/db-info', (req, res) => {
  try {
    const info = getStudioDatabaseInfo();
    res.json({ success: true, data: info });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. POST /api/studio/generate-token - Generate test JWT tokens
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
