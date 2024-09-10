const pino = require('pino');
const pretty = require('pino-pretty');
const path = require('path');
var fs = require('node:fs');
const rfs = require('rotating-file-stream'); // Import rotating-file-stream
require('dotenv').config(); // Load environment variables

// Determine log directory based on environment
const logDir = (process.env.npm_lifecycle_event == 'dev' ? process.env.LOG_DIR : process.env.REMOTE_LOG_DIR) || 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const { format } = require('date-fns');
function formatTimestamp() {
  const now = new Date();
  return `,"time":"${format(now, 'yyyy-MM-dd HH:mm:ss')}"`;
}

// Create rotating file stream for log rotation
const rotatingLogStream = rfs.createStream('app.log', {
  size: '1G', // Rotate the file when it reaches 1GB
  interval: '1d', // Rotate daily (you can remove this if only size-based rotation is needed)
  compress: 'gzip', // Compress rotated logs
  path: logDir, // Log directory
});

var streams = [
  
  { level: 'trace', stream: pretty({ singleLine: true }) }, // log console with trace level  
  { level: 'trace', stream: rotatingLogStream }, // log to rotating file stream 
];

const logger = pino({
  level: 'trace', // Capture trace logs and above
  timestamp: formatTimestamp,
  base: { pid: process.pid }
}, pino.multistream(streams));

function getModuleName(fileName) {
  return path.basename(fileName);
}

function createLogger(fileName) {
  return logger.child({ module: getModuleName(fileName) });
}

module.exports = { getModuleName, createLogger };

/**
 * Usage: 
 * const logger = require('<relative_path>/configs/pino_logger').createLogger(__filename);
 * logger.info("Info: test message");
 * logger.debug("Debug: test message");
 * logger.trace("Trace: test message");
 */
