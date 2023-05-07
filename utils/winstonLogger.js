// const { DateTime } = require("luxon");
import winston from 'winston';
import WinstonDailyRotateFile from 'winston-daily-rotate-file';
import winstonConfig from '../config/winstonConfig';
import cls from './cls';

// eslint-disable-next-line no-console, prefer-template
console.log('winstonLogger:process.env.NODE_ENV=' + process.env.NODE_ENV);

const serviceName = winstonConfig.serviceName;
const correlationIdHeader = winstonConfig.correlationId;

const timestampFormat = winston.format((info, opts) => {
  if (opts.zone) {
    // eslint-disable-next-line no-param-reassign
    info.timestamp = new Date().toISOString();
    // info.timestamp = DateTime.now().setZone(opts.zone).toISO();
  }
  return info;
});

const logLineFormat = winston.format.printf(
  (info) => `${info.timestamp} \
[${cls.get({ key: correlationIdHeader }) || '-'}]\[pid-${process.pid}] \
[${info.label.service}] \
${info.level.toUpperCase()}: ${info.message}`
);

const format = winston.format.combine(
  winston.format.label({ label: { service: serviceName } }),
  timestampFormat({ zone: winstonConfig.timezone }),
  logLineFormat,
);
const winstonTransports = [];
if (['stage', 'beta', 'production'].includes(process.env.NODE_ENV)) {
  winstonTransports.push(
    new WinstonDailyRotateFile(winstonConfig.winstonTransportConfig.fileRotateConfig),
  );
} else {
  winstonTransports.push(
    new winston.transports.Console(winstonConfig.winstonTransportConfig.consoleConfig),
  );
}

const winstonLogger = winston.createLogger({
  levels: winston.config.syslog.levels,
  transports: winstonTransports,
  format,
  exitOnError: false,
});

export default winstonLogger;
