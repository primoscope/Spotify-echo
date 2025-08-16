class KeyPool {
  constructor(keys = []) {
    const unique = Array.from(new Set((keys || []).filter(Boolean)));
    this.keys = unique.map((k) => ({ key: k, disabledUntil: 0, failures: 0, lastUsed: 0 }));
    this.index = 0;
    this.cooldowns = {
      rate_limit_ms: 60 * 1000, // 1 minute for 429
      auth_error_ms: 10 * 60 * 1000, // 10 minutes for 401/403
      server_error_ms: 30 * 1000, // 30 seconds for 5xx
    };
  }

  hasActiveKeys(now = Date.now()) {
    return this.keys.some((k) => k.disabledUntil <= now);
  }

  getCurrentKey(now = Date.now()) {
    if (this.keys.length === 0) return null;

    // Find the next enabled key round-robin
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.index + i) % this.keys.length;
      const entry = this.keys[idx];
      if (entry.disabledUntil <= now) {
        this.index = (idx + 1) % this.keys.length;
        entry.lastUsed = now;
        return entry.key;
      }
    }

    // All keys disabled, return the one that becomes available soonest
    const soonest = this.keys.reduce((a, b) => (a.disabledUntil < b.disabledUntil ? a : b));
    return soonest.key;
  }

  reportSuccess(key) {
    const entry = this.keys.find((k) => k.key === key);
    if (entry) {
      entry.failures = 0;
      entry.disabledUntil = 0;
    }
  }

  reportFailure(key, reason = 'unknown', now = Date.now()) {
    const entry = this.keys.find((k) => k.key === key);
    if (!entry) return;
    entry.failures += 1;

    let cooldown = 0;
    const r = String(reason).toLowerCase();
    if (r.includes('429') || r.includes('rate')) cooldown = this.cooldowns.rate_limit_ms;
    else if (r.includes('401') || r.includes('403') || r.includes('auth'))
      cooldown = this.cooldowns.auth_error_ms;
    else if (r.includes('5') || r.includes('server')) cooldown = this.cooldowns.server_error_ms;
    else cooldown = 15 * 1000;

    // Exponential backoff on consecutive failures
    const backoff = Math.min(
      cooldown * Math.pow(2, Math.max(0, entry.failures - 1)),
      30 * 60 * 1000
    );
    entry.disabledUntil = now + backoff;
  }

  getStats(now = Date.now()) {
    return this.keys.map((k) => ({
      lastUsed: k.lastUsed,
      failures: k.failures,
      disabled: k.disabledUntil > now,
      disabledForMs: Math.max(0, k.disabledUntil - now),
    }));
  }
}

module.exports = KeyPool;
