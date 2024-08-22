const pino = require('pino');
const pretty = require('pino-pretty');
const path = require('path');
var fs = require('node:fs');
require('dotenv').config(); // Load environment variables

const logDir = (process.env.npm_lifecycle_event == 'dev' ? process.env.LOG_DIR : process.env.REMOTE_LOG_DIR) || 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const { format } = require('date-fns');
function formatTimestamp() {
  const now = new Date();
  return `,"time":"${format(now, 'yyyy-MM-dd HH:mm:ss')}"`;
}

var streams = [
  { level: 'trace', stream: pretty({ singleLine: true }) }, // log console with trace level  
  { level: 'trace', stream: fs.createWriteStream(path.join(logDir, 'app.log'), { flags: 'a' }) }, // log to file as well 
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
 * to use anywhere: 
 * const logger = require('<relative_path>/configs/pino_logger').createLogger(__filename);
 * logger.info( "Info: test message");
 * logger.debug("Debug: test message");
 * logger.trace("Trace: test message");
 */