const SERVICE_NAME = 'test';
const CORRELATION_ID = '123';
const TIMEZONE = 'time';
const LOG_DIR = 'var/log/tekie';

const winstonConfig = {
  serviceName: SERVICE_NAME,
  correlationId: CORRELATION_ID,
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
    },
  },
};

export default winstonConfig;
