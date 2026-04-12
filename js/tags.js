window.Tags = {
  getAllSelectableTags() {
    return [
      ...window.AppState.presetTags.map((tag) => ({
        ...tag,
        isCustom: false
      })),
      ...window.AppState.customTags.map((tag) => ({
        ...tag,
        isCustom: true
      }))
    ];
  },

  isSelected(tagId, entry = window.AppState.draftEntry) {
    return Array.isArray(entry.tags) && entry.tags.includes(tagId);
  },

  toggleTag(tagId) {
    const draft = window.AppState.draftEntry;

    if (!Array.isArray(draft.tags)) {
      draft.tags = [];
    }

    if (draft.tags.includes(tagId)) {
      draft.tags = draft.tags.filter((id) => id !== tagId);
    } else {
      draft.tags = [...draft.tags, tagId];
    }

    window.UI.renderTagGrid();
  },

  async createTag(label) {
    const cleanLabel = label.trim();
    if (!cleanLabel) return;

    const alreadyExists = this.getAllSelectableTags().some(
      (tag) => tag.label.toLowerCase() === cleanLabel.toLowerCase()
    );

    if (alreadyExists) {
      alert('That tag already exists.');
      return;
    }

    const id =
      'custom_' +
      Date.now().toString(36) +
      '_' +
      Math.random().toString(36).slice(2, 7);

    const newTag = {
      id,
      label: cleanLabel
    };

    await window.DB.saveCustomTag(newTag);
    window.AppState.customTags.push(newTag);

    window.UI.renderTagGrid();
    window.UI.renderTagManagerList();
  },

  async updateTag(tagId, nextLabel) {
    const cleanLabel = nextLabel.trim();
    if (!cleanLabel) return;

    const tag = window.AppState.customTags.find((item) => item.id === tagId);
    if (!tag) return;

    const duplicate = this.getAllSelectableTags().some(
      (item) =>
        item.id !== tagId &&
        item.label.toLowerCase() === cleanLabel.toLowerCase()
    );

    if (duplicate) {
      alert('That tag already exists.');
      return;
    }

    tag.label = cleanLabel;
    await window.DB.saveCustomTag(tag);

    window.UI.renderTagGrid();
    window.UI.renderTagManagerList();

    if (
      window.AppState.ui.activeEntryModalDate &&
      document.getElementById('entry-modal') &&
      !document.getElementById('entry-modal').classList.contains('hidden')
    ) {
      const entry = window.AppState.entries.find(
        (item) => item.date === window.AppState.ui.activeEntryModalDate
      );

      if (entry) {
        window.UI.renderEntryModal(entry.date);
      }
    }
  },

  async deleteTag(tagId) {
    const tag = window.AppState.customTags.find((item) => item.id === tagId);
    if (!tag) return;

    const confirmed = window.confirm(`Delete tag "${tag.label}"?`);
    if (!confirmed) return;

    await window.DB.deleteCustomTag(tagId);

    window.AppState.customTags = window.AppState.customTags.filter(
      (item) => item.id !== tagId
    );

    if (Array.isArray(window.AppState.draftEntry.tags)) {
      window.AppState.draftEntry.tags = window.AppState.draftEntry.tags.filter(
        (id) => id !== tagId
      );
    }

    window.AppState.entries = window.AppState.entries.map((entry) => ({
      ...entry,
      tags: Array.isArray(entry.tags)
        ? entry.tags.filter((id) => id !== tagId)
        : []
    }));

    if (window.AppState.todayEntry) {
      window.AppState.todayEntry = {
        ...window.AppState.todayEntry,
        tags: Array.isArray(window.AppState.todayEntry.tags)
          ? window.AppState.todayEntry.tags.filter((id) => id !== tagId)
          : []
      };
    }

    for (const entry of window.AppState.entries) {
      await window.DB.saveEntry(entry);
    }

    window.UI.renderTagGrid();
    window.UI.renderTagManagerList();

    if (
      window.AppState.ui.activeEntryModalDate &&
      document.getElementById('entry-modal') &&
      !document.getElementById('entry-modal').classList.contains('hidden')
    ) {
      const entry = window.AppState.entries.find(
        (item) => item.date === window.AppState.ui.activeEntryModalDate
      );

      if (entry) {
        window.UI.renderEntryModal(entry.date);
      }
    }
  },

  beginEdit(tagId) {
    const tag = window.AppState.customTags.find((item) => item.id === tagId);
    if (!tag) return;

    window.AppState.ui.editingTagId = tagId;

    const input = document.getElementById('tag-name-input');
    const saveBtn = document.getElementById('tag-save-btn');

    if (input) input.value = tag.label;
    if (saveBtn) saveBtn.textContent = 'Update Tag';
  },

  cancelEdit() {
    window.AppState.ui.editingTagId = null;

    const input = document.getElementById('tag-name-input');
    const saveBtn = document.getElementById('tag-save-btn');

    if (input) input.value = '';
    if (saveBtn) saveBtn.textContent = 'Save Tag';
  },

  async handleTagFormSubmit(event) {
    if (!event) return;

    event.preventDefault();

    const input = document.getElementById('tag-name-input');
    if (!input) return;

    const value = input.value.trim();
    if (!value) return;

    if (window.AppState.ui.editingTagId) {
      await this.updateTag(window.AppState.ui.editingTagId, value);
    } else {
      await this.createTag(value);
    }

    this.cancelEdit();
  }
};