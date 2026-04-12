window.NotificationsManager = {
  async init() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('./sw.js');
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    }
  },

  isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator;
  },

  async requestPermission() {
    if (!this.isSupported()) return false;

    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  async updateReminderState(enabled, time) {
    window.AppState.settings.reminderEnabled = enabled;
    window.AppState.settings.reminderTime = time;

    await window.DB.saveSetting('reminderEnabled', enabled);
    await window.DB.saveSetting('reminderTime', time);

    if (!this.isSupported()) {
      window.UI.renderSettingsScreen();
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    if (!enabled) {
      registration.active?.postMessage({
        type: 'CLEAR_REMINDER'
      });
      window.UI.renderSettingsScreen();
      return;
    }

    const granted = await this.requestPermission();

    if (!granted) {
      window.AppState.settings.reminderEnabled = false;
      await window.DB.saveSetting('reminderEnabled', false);
      alert('Notifications are blocked or unavailable on this device/browser.');
      window.UI.renderSettingsScreen();
      return;
    }

    registration.active?.postMessage({
      type: 'SET_REMINDER',
      time
    });

    window.UI.renderSettingsScreen();
  },

  async syncFromSettings() {
    if (!this.isSupported()) return;

    const registration = await navigator.serviceWorker.ready;
    const { reminderEnabled, reminderTime } = window.AppState.settings;

    if (!reminderEnabled) {
      registration.active?.postMessage({ type: 'CLEAR_REMINDER' });
      return;
    }

    if (Notification.permission !== 'granted') return;

    registration.active?.postMessage({
      type: 'SET_REMINDER',
      time: reminderTime
    });
  }
};