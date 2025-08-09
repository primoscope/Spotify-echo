/**
 * Consistent API response formatter
 */
function success(data = null, meta = {}) {
  return { ok: true, data, meta };
}

function error(message, code = 'ERR_GENERIC', meta = {}) {
  return { ok: false, error: { message, code }, meta };
}

module.exports = { success, error };
