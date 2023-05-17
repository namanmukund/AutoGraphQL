const SERVICE_NAME = process.env.APPLICATION || 'core';
const TIMEZONE = process.env.TZ || 'Asia/Kolkata';
const LOG_DIR = 'var/log/tekie';

const winstonConfig = {
  serviceName: SERVICE_NAME,
  timezone: TIMEZONE,
  logDir: LOG_DIR,
  winstonTransportConfig: {
    consoleConfig: {
      level: 'debug',
      handleExceptions: true,
    },
    fileRotateConfig: {
      level: 'info',
      filename: `${SERVICE_NAME}-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      dirname: `${LOG_DIR}/${process.env.NODE_ENV}/${SERVICE_NAME}`,
      maxSize: '20m',
      maxFiles: 14,
      handleExceptions: true,
      zippedArchive: true,
    },
  },
};

export default winstonConfig;
