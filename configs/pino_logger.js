const pino = require('pino');
const pretty = require('pino-pretty');
const path = require('path');
var fs = require('node:fs')
require('dotenv').config(); // Load environment variables

/*
 for log rotation it can be done by using a utility at the server level
*/
const logDir = (process.env.npm_lifecycle_event == 'dev' ? process.env.LOG_DIR: process.env.REMOTE_LOG_DIR) || 'logs';
// create a logDir if it does not exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
 }

 // date formatting
const { format } = require('date-fns');
function formatTimestamp() {
  const now = new Date();
  return `,"time":"${format(now, 'yyyy-MM-dd HH:mm:ss')}"`;
}

// streams
var streams = [
    {level: 'debug', stream: pretty({singleLine: true}) }, // log console
    {level: 'debug', stream: fs.createWriteStream(path.join(logDir, 'app.log'), {flags:'a'}) }, // log to file as well     
  ]

const logger = pino({
  level: 'debug',
  timestamp: formatTimestamp,
  base: { pid: process.pid }},pino.multistream(streams));

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
 */