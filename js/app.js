window.App = {
  async init() {
    try {
      await window.DB.init();
      await window.NotificationsManager.init();

      await this.loadInitialData();
      this.bindEvents();
      window.UI.renderApp();
      await window.NotificationsManager.syncFromSettings();

      console.log('Mood Tracker initialized');
    } catch (error) {
      console.error('App initialization failed:', error);
      alert('App failed to initialize. Check console for details.');
    }
  },

  async loadInitialData() {
    const today = window.Utils.getLocalDateString();

    const [entries, customTags, savedSettings, todayEntry] = await Promise.all([
      window.DB.getAllEntries(),
      window.DB.getAllCustomTags(),
      window.DB.getAllSettings(),
      window.DB.getEntryByDate(today)
    ]);

    window.AppState.entries = Array.isArray(entries) ? entries : [];
    window.AppState.customTags = Array.isArray(customTags) ? customTags : [];
    window.AppState.settings = {
      reminderEnabled: savedSettings.reminderEnabled ?? false,
      reminderTime: savedSettings.reminderTime ?? '20:00'
    };

    window.AppState.todayEntry = todayEntry || null;
    window.AppState.draftEntry = todayEntry
      ? window.Utils.cloneDraftEntry(todayEntry)
      : window.Utils.cloneDraftEntry();
  },

  bindEvents() {
    this.bindTodayEvents();
    this.bindNavigationEvents();
    this.bindHistoryEvents();
    this.bindSettingsEvents();
    this.bindModalEvents();
    this.bindGlobalEvents();
  },

  bindTodayEvents() {
    const noteInput = document.getElementById('note-input');
    const submitBtn = document.getElementById('submit-btn');
    const openTagModalBtn = document.getElementById('open-tag-modal-btn');
    const editBtn = document.getElementById('edit-today-btn');

    if (noteInput) {
      noteInput.addEventListener('input', (event) => {
        if (window.AppState.todayEntry) return;
        window.AppState.draftEntry.note = event.target.value;
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', async () => {
        await this.submitTodayEntry();
      });
    }

    if (openTagModalBtn) {
      openTagModalBtn.addEventListener('click', () => {
        if (window.AppState.todayEntry) return;
        window.UI.openTagModal();
      });
    }

    if (editBtn) {
      editBtn.addEventListener('click', () => {
        const todayEntry = window.AppState.todayEntry;
        if (!todayEntry) return;

        window.AppState.todayEntry = null;
        window.AppState.draftEntry = window.Utils.cloneDraftEntry(todayEntry);
        window.UI.renderTodayScreen();
      });
    }
  },

  bindNavigationEvents() {
    document.querySelectorAll('.nav-btn').forEach((button) => {
      button.addEventListener('click', () => {
        window.UI.switchScreen(button.dataset.screen);
      });
    });
  },

  bindHistoryEvents() {
    document.querySelectorAll('.tab-btn').forEach((button) => {
      button.addEventListener('click', () => {
        window.UI.switchHistoryTab(button.dataset.tab);
      });
    });
  },

  bindSettingsEvents() {
    const reminderToggle = document.getElementById('reminder-enabled');
    const reminderTime = document.getElementById('reminder-time');
    const exportBtn = document.getElementById('export-btn');
    const resetBtn = document.getElementById('reset-btn');

    if (reminderToggle) {
      reminderToggle.addEventListener('click', async () => {
        const nextEnabled = !window.AppState.settings.reminderEnabled;
        const time = reminderTime?.value || window.AppState.settings.reminderTime || '20:00';
        await window.NotificationsManager.updateReminderState(nextEnabled, time);
      });
    }

    if (reminderTime) {
      reminderTime.addEventListener('change', async (event) => {
        const nextTime = event.target.value || '20:00';
        window.AppState.settings.reminderTime = nextTime;
        await window.DB.saveSetting('reminderTime', nextTime);

        if (window.AppState.settings.reminderEnabled) {
          await window.NotificationsManager.updateReminderState(true, nextTime);
        } else {
          window.UI.renderSettingsScreen();
        }
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const payload = {
          exportedAt: new Date().toISOString(),
          timezone: window.Utils.getDeviceTimezone(),
          entries: window.AppState.entries,
          customTags: window.AppState.customTags,
          settings: window.AppState.settings
        };

        window.Utils.downloadJson(
          `mood-tracker-export-${window.Utils.getLocalDateString()}.json`,
          payload
        );
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        const confirmed = window.confirm(
          'Reset all entries, tags, and settings? This cannot be undone.'
        );
        if (!confirmed) return;

        await window.DB.resetAllData();

        window.AppState.entries = [];
        window.AppState.customTags = [];
        window.AppState.todayEntry = null;
        window.AppState.draftEntry = window.Utils.cloneDraftEntry();
        window.AppState.settings = {
          reminderEnabled: false,
          reminderTime: '20:00'
        };

        await window.NotificationsManager.syncFromSettings();
        window.UI.renderApp();
        window.UI.closeEntryModal();
        window.UI.closeTagModal();
      });
    }
  },

  bindModalEvents() {
    const entryModal = document.getElementById('entry-modal');
    const entryModalClose = document.getElementById('entry-modal-close');
    const tagModal = document.getElementById('tag-modal');
    const tagModalClose = document.getElementById('tag-modal-close');
    const tagForm = document.getElementById('tag-form');

    if (entryModalClose) {
      entryModalClose.addEventListener('click', () => {
        window.UI.closeEntryModal();
      });
    }

    if (entryModal) {
      entryModal.addEventListener('click', (event) => {
        if (event.target === entryModal) {
          window.UI.closeEntryModal();
        }
      });
    }

    if (tagModalClose) {
      tagModalClose.addEventListener('click', () => {
        window.UI.closeTagModal();
      });
    }

    if (tagModal) {
      tagModal.addEventListener('click', (event) => {
        if (event.target === tagModal) {
          window.UI.closeTagModal();
        }
      });
    }

    if (tagForm) {
      tagForm.addEventListener('submit', async (event) => {
        await window.Tags.handleTagFormSubmit(event);
      });
    }
  },

  bindGlobalEvents() {
    document.addEventListener('visibilitychange', async () => {
      if (document.hidden) return;
      await this.refreshForTodayBoundary();
    });
  },

  async refreshForTodayBoundary() {
    const today = window.Utils.getLocalDateString();
    const freshTodayEntry = await window.DB.getEntryByDate(today);
    const allEntries = await window.DB.getAllEntries();

    window.AppState.entries = Array.isArray(allEntries) ? allEntries : [];
    window.AppState.todayEntry = freshTodayEntry || null;
    window.AppState.draftEntry = window.AppState.todayEntry
      ? window.Utils.cloneDraftEntry(window.AppState.todayEntry)
      : window.Utils.cloneDraftEntry();

    window.UI.renderApp();
  },

  async submitTodayEntry() {
    const draft = window.AppState.draftEntry;
    if (!draft?.mood) return;

    const today = window.Utils.getLocalDateString();

    const entry = {
      id: today,
      date: today,
      mood: draft.mood,
      emotions: Array.isArray(draft.emotions) ? [...draft.emotions] : [],
      tags: Array.isArray(draft.tags) ? [...draft.tags] : [],
      note: draft.note || '',
      createdAt: new Date().toISOString(),
      timezone: window.Utils.getDeviceTimezone()
    };

    await window.DB.saveEntry(entry);

    const existingIndex = window.AppState.entries.findIndex((item) => item.date === today);
    if (existingIndex >= 0) {
      window.AppState.entries[existingIndex] = entry;
    } else {
      window.AppState.entries.push(entry);
    }

    window.AppState.todayEntry = entry;
    window.AppState.draftEntry = window.Utils.cloneDraftEntry(entry);

    window.UI.renderApp();
  }
};

window.addEventListener('load', () => {
  window.App.init();
});