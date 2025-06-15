import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

// Determine the logs directory relative to the script's location
const logsDir = path.join(__dirname, '..', '..', 'logs');

// Daily Rotate File transport
const fileRotateTransport = new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'noctua-backend' },
    transports: [
        fileRotateTransport
    ]
});

// If we're not in production, log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Helper function for masking sensitive env vars
function maskEnvValue(key: string, value: string) {
  if (key.includes('KEY') || key.includes('SECRET') || key.includes('TOKEN')) {
    return value ? value.slice(0, 4) + '***' : '';
  }
  return value;
}

// Log environment variables on startup
logger.info('--- ENVIRONMENT VARIABLES ---');
Object.entries(process.env).forEach(([k, v]) => {
    if (typeof v === 'string') {
        logger.info(`${k}=${maskEnvValue(k, v)}`);
    }
});

export default logger; 