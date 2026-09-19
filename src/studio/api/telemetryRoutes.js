import express from 'express';
import os from 'os';
import db from '../../db';

const router = express.Router();

// In-memory circular log buffer
const MAX_LOGS = 150;
const logBuffer = [];

export const recordLog = (level, message) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message: typeof message === 'object' ? JSON.stringify(message) : String(message),
  };
  logBuffer.unshift(entry);
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.pop();
  }
};

// Seed initial startup logs
recordLog('STATUS', `AutoGraphQL Enterprise Server initialized on port ${process.env.PORT || 3001}`);
recordLog('STATUS', `MongoDB Connection state: ${db.mongoose && db.mongoose.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'}`);
recordLog('INFO', `Platform: ${os.platform()} ${os.arch()}, Node.js: ${process.version}`);

// 1. GET /api/studio/telemetry/stats
router.get('/api/studio/telemetry/stats', (req, res) => {
  try {
    const mem = process.memoryUsage();
    const stats = {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        cpus: os.cpus().length,
        freeMemMB: Math.round(os.freemem() / 1024 / 1024),
        totalMemMB: Math.round(os.totalmem() / 1024 / 1024),
      },
      process: {
        pid: process.pid,
        rssMB: Math.round(mem.rss / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        externalMB: Math.round(mem.external / 1024 / 1024),
      },
      databases: {
        mongodb: {
          status: db.mongoose && db.mongoose.readyState === 1 ? 'connected' : 'disconnected',
          readyState: db.mongoose ? db.mongoose.readyState : 0,
          modelsCount: db.mongoose && db.mongoose.models ? Object.keys(db.mongoose.models).length : 0,
        },
        postgres: {
          status: db.sequelize ? 'configured' : 'disabled',
          modelsCount: db.sequelize && db.sequelize.models ? Object.keys(db.sequelize.models).length : 0,
        },
        redis: {
          status: process.env.REDIS_HOST ? 'configured' : 'disabled',
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: process.env.REDIS_PORT || 6379,
        },
      },
    };

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET /api/studio/telemetry/logs
router.get('/api/studio/telemetry/logs', (req, res) => {
  try {
    const { level, limit = 50 } = req.query;
    let logs = [...logBuffer];

    if (level && level !== 'ALL') {
      logs = logs.filter((l) => l.level === level.toUpperCase());
    }

    res.json({
      success: true,
      data: logs.slice(0, parseInt(limit, 10) || 50),
      total: logs.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
