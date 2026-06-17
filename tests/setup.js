class MemoryStorage {
  constructor() {
    this.store = new Map();
  }

  get length() {
    return this.store.size;
  }

  key(index) {
    return [...this.store.keys()][index] ?? null;
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    this.store.set(String(key), String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

function localStorageWorks(storage) {
  if (!storage || typeof storage.setItem !== "function") {
    return false;
  }
  try {
    storage.setItem("__vitest_localstorage_check__", "1");
    storage.removeItem("__vitest_localstorage_check__");
    return true;
  } catch {
    return false;
  }
}

if (typeof window !== "undefined" && !localStorageWorks(window.localStorage)) {
  Object.defineProperty(window, "localStorage", {
    value: new MemoryStorage(),
    writable: true,
    configurable: true,
  });
}