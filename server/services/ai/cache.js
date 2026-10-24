class InMemoryTtlCache {
  constructor(defaultTtlMs = 10 * 60 * 1000) {
    this.store = new Map();
    this.defaultTtlMs = defaultTtlMs;

    if (typeof setInterval !== "undefined") {
      const timer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
      if (timer.unref) timer.unref();
    }
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    return this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

export const searchCache = new InMemoryTtlCache(15 * 60 * 1000);
export const llmResponseCache = new InMemoryTtlCache(5 * 60 * 1000);

export default InMemoryTtlCache;
