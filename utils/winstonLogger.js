import { DateTime } from 'luxon';
import winston from 'winston';
import WinstonDailyRotateFile from 'winston-daily-rotate-file';
import winstonConfig from '../config/winstonConfig';

const serviceName = winstonConfig.serviceName;

const timestampFormat = winston.format((info, opts) => {
  if (opts.zone) {
    // eslint-disable-next-line no-param-reassign
    info.timestamp = DateTime.now().setZone(opts.zone).toISO();
  }
  return info;
});

const logLineFormat = winston.format.printf(
  (info) => `${info.timestamp} \
[pid-${process.pid}] \
[${info.label.service}] \
${info.level.toUpperCase()}: ${info.message}`,
);

const format = winston.format.combine(
  winston.format.label({ label: { service: serviceName } }),
  timestampFormat({ zone: winstonConfig.timezone }),
  logLineFormat,
);
const winstonTransports = [];
if (['production', 'staging'].includes(process.env.NODE_ENV) && !process.env.FORCE_WINSTON_CONSOLE) {
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
