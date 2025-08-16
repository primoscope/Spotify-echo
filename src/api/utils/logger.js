class JsonLogger {
  info(message, meta = {}) {
    try {
      console.info(JSON.stringify({ level: 'info', message, time: new Date().toISOString(), ...meta }));
    } catch (_) {
      console.info(`[info] ${message}`);
    }
  }
  error(message, meta = {}) {
    try {
      console.error(JSON.stringify({ level: 'error', message, time: new Date().toISOString(), ...meta }));
    } catch (_) {
      console.error(`[error] ${message}`);
    }
  }
}

module.exports = new JsonLogger();