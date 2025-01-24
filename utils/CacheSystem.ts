export interface CacheSystemDriver {
  open(ns: string): Promise<CacheStorageDriver>;
}

export interface CacheStorageDriver {
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  close(): Promise<void>;
}

export class InMemoryCacheSystem implements CacheSystemDriver {
  constructor(private kv = new Map<string, Map<string, string>>()) {}

  async open(ns: string): Promise<CacheStorageDriver> {
    const m = this.kv.get(ns) ?? new Map();

    this.kv.set(ns, m);
    
    return new InMemoryCacheStorage(m, () => {
      this.kv.delete(ns);
    });
  }
}

export class InMemoryCacheStorage implements CacheStorageDriver {
  constructor(private kv = new Map<string, string>(), private closeHandler = () => {}) {}

  async set(key: string, value: string): Promise<void> {
    this.kv.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.kv.get(key) ?? null;
  }

  async delete(key: string): Promise<void> {
    this.kv.delete(key);
  }

  async clear(): Promise<void> {
    this.kv.clear();
  }

  async close(): Promise<void> {
    this.closeHandler();
  }
}
