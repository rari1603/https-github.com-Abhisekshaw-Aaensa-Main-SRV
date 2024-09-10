const pino = require('pino');
const pretty = require('pino-pretty');
const path = require('path');
var fs = require('node:fs');
const rfs = require('rotating-file-stream');
require('dotenv').config();
const { format } = require('date-fns');

// Determine log directory based on environment
const logDir = (process.env.npm_lifecycle_event == 'dev' ? process.env.LOG_DIR : process.env.REMOTE_LOG_DIR) || 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Function to format timestamp
function formatTimestamp() {
  const now = new Date();
  return `,"time":"${format(now, 'yyyy-MM-dd HH:mm:ss')}"`;
}

// Function to generate dynamic log file names based on a passed file name
function getLogFilename(fileName, time, index) {
  if (!time) return `${fileName}.log`; // If no time, return the base file name
  const date = format(new Date(time), 'yyyy-MM-dd'); // Use current date for file name
  return `${date}-${fileName}.log.gz`; // Example: 2024-09-07-app.log.gz
}

// Function to create a rotating log stream for a given file name
function createRotatingLogStream(fileName) {
  return rfs.createStream((time, index) => getLogFilename(fileName, time, index), {
    size: '1G',     // Rotate the file when it reaches 1GB
    interval: '1d', // Rotate daily
    compress: 'gzip', // Compress rotated logs
    path: logDir,   // Log directory
  });
}

// Cache to store rotating streams by file name to avoid recreating streams for the same file
const logStreams = {};

// Main logger function that handles dynamic file names
function log(level, fileName, message) {
  if (!logStreams[fileName]) {
    // Create a new rotating log stream for the file if it doesn't exist
    logStreams[fileName] = createRotatingLogStream(fileName);
  }

  // Create a logger with a multistream (console + dynamic log file)
  const streams = [
    { level: 'trace', stream: pretty({ singleLine: true }) },  // Console logging
    { level: 'trace', stream: logStreams[fileName] },          // File logging with rotation
  ];

  const logger = pino({
    level: 'trace', // Capture trace logs and above
    timestamp: formatTimestamp,
    base: { pid: process.pid, module: fileName }
  }, pino.multistream(streams));

  // Log the message with the specified level
  logger[level](message);
}

// Export log functions
module.exports = {
  // info: General operational messages, for regular logging of the app’s state.
  info: (fileName, message) => log('info', fileName, message),

  // debug: Detailed debugging messages, used to diagnose issues during development.
  debug: (fileName, message) => log('debug', fileName, message),

  // trace: The most detailed level of logging, for tracing the execution flow step by step.
  trace: (fileName, message) => log('trace', fileName, message),

  // warn: Warnings about potential issues or unusual situations that don’t necessarily affect the application immediately.
  warn: (fileName, message) => log('warn', fileName, message),

  // error: Logs errors that occurred but the application can still continue running.
  error: (fileName, message) => log('error', fileName, message),

  // fatal: Logs critical errors that indicate the application must shut down or a serious failure occurred.
  fatal: (fileName, message) => log('fatal', fileName, message)
};

