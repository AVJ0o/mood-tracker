window.DB = {
  DB_NAME: 'MoodTrackerClean',
  DB_VERSION: 1,
  ENTRIES_STORE: 'entries',
  TAGS_STORE: 'custom_tags',
  SETTINGS_STORE: 'settings',

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(this.ENTRIES_STORE)) {
          const entriesStore = db.createObjectStore(this.ENTRIES_STORE, {
            keyPath: 'id'
          });
          entriesStore.createIndex('date', 'date', { unique: true });
        }

        if (!db.objectStoreNames.contains(this.TAGS_STORE)) {
          db.createObjectStore(this.TAGS_STORE, {
            keyPath: 'id'
          });
        }

        if (!db.objectStoreNames.contains(this.SETTINGS_STORE)) {
          db.createObjectStore(this.SETTINGS_STORE, {
            keyPath: 'key'
          });
        }
      };

      request.onsuccess = () => {
        window.AppState.db = request.result;
        resolve(request.result);
      };
    });
  },

  getStore(storeName, mode = 'readonly') {
    const tx = window.AppState.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  },

  async saveEntry(entry) {
    return new Promise((resolve, reject) => {
      const store = this.getStore(this.ENTRIES_STORE, 'readwrite');
      const request = store.put(entry);

      request.onsuccess = () => resolve(entry);
      request.onerror = () => reject(request.error);
    });
  },

  async getEntryByDate(date) {
    return new Promise((resolve, reject) => {
      const store = this.getStore(this.ENTRIES_STORE, 'readonly');
      const index = store.index('date');
      const request = index.get(date);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllEntries() {
    return new Promise((resolve, reject) => {
      const store = this.getStore(this.ENTRIES_STORE, 'readonly');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteAllEntries() {
    return new Promise((resolve, reject) => {
      const store = this.getStore(this.ENTRIES_STORE, 'readwrite');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async saveCustomTag(tag) {
    return new Promise((resolve, reject) => {
      const store = this.getStore(this.TAGS_STORE, 'readwrite');
      const request = store.put(tag);

      request.onsuccess = () => resolve(tag);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllCustomTags() {
    return new Promise((resolve, reject) => {
      const store = this.getStore(this.TAGS_STORE, 'readonly');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteCustomTag(tagId) {
    return new Promise((resolve, reject) => {
      const store = this.getStore(this.TAGS_STORE, 'readwrite');
      const request = store.delete(tagId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async saveSetting(key, value) {
    return new Promise((resolve, reject) => {
      const store = this.getStore(this.SETTINGS_STORE, 'readwrite');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve({ key, value });
      request.onerror = () => reject(request.error);
    });
  },

  async getSetting(key) {
    return new Promise((resolve, reject) => {
      const store = this.getStore(this.SETTINGS_STORE, 'readonly');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result ? request.result.value : null);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllSettings() {
    return new Promise((resolve, reject) => {
      const store = this.getStore(this.SETTINGS_STORE, 'readonly');
      const request = store.getAll();

      request.onsuccess = () => {
        const rows = request.result || [];
        const settings = {};

        for (const row of rows) {
          settings[row.key] = row.value;
        }

        resolve(settings);
      };

      request.onerror = () => reject(request.error);
    });
  },

  async resetAllData() {
    await this.deleteAllEntries();

    const customTags = await this.getAllCustomTags();
    for (const tag of customTags) {
      await this.deleteCustomTag(tag.id);
    }

    const settings = await this.getAllSettings();
    for (const key of Object.keys(settings)) {
      await this.saveSetting(key, null);
    }
  }
};