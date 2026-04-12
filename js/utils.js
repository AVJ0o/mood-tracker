window.Utils = {
  getLocalDateParts(date = new Date()) {
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate()
    };
  },

  getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  parseDateString(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  },

  formatDisplayDate(dateString) {
    const date = this.parseDateString(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  },

  formatMonthYear(date = new Date()) {
    return date.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric'
    });
  },

  getDeviceTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown timezone';
    } catch {
      return 'Unknown timezone';
    }
  },

  cloneDraftEntry(entry = null) {
    if (!entry) {
      return {
        mood: null,
        emotions: [],
        tags: [],
        note: ''
      };
    }

    return {
      mood: entry.mood ?? null,
      emotions: Array.isArray(entry.emotions) ? [...entry.emotions] : [],
      tags: Array.isArray(entry.tags) ? [...entry.tags] : [],
      note: entry.note ?? ''
    };
  },

  isSameDateString(a, b) {
    return a === b;
  },

  getMoodMeta(value) {
    return window.AppState.moods.find((mood) => mood.value === value) || null;
  },

  getTagLabel(tagId) {
    const preset = window.AppState.presetTags.find((tag) => tag.id === tagId);
    if (preset) return preset.label;

    const custom = window.AppState.customTags.find((tag) => tag.id === tagId);
    if (custom) return custom.label;

    return tagId;
  },

  sortEntriesAscending(entries) {
    return [...entries].sort((a, b) => a.date.localeCompare(b.date));
  },

  sortEntriesDescending(entries) {
    return [...entries].sort((a, b) => b.date.localeCompare(a.date));
  },

  getStartOfWeek(date = new Date()) {
    const working = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = working.getDay();
    working.setDate(working.getDate() - day);
    return working;
  },

  addDays(date, days) {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    next.setDate(next.getDate() + days);
    return next;
  },

  average(numbers = []) {
    if (!numbers.length) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  },

  downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
};