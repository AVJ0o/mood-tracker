window.UI = {
  renderApp() {
    this.renderTodayScreen();
    this.renderHistoryScreen();
    this.renderSettingsScreen();
  },

  renderTodayScreen() {
    this.renderMoodScale();
    this.renderEmotionGrid();
    this.renderTagGrid();
    this.renderTodayFormState();
    this.renderTodayInsights();
  },

  renderMoodScale() {
    const container = document.getElementById('mood-scale');
    if (!container) return;

    const isLocked = !!window.AppState.todayEntry;
    const source = isLocked ? window.AppState.todayEntry : window.AppState.draftEntry;
    const selectedMood = source?.mood ?? null;

    container.innerHTML = window.AppState.moods
      .map((mood) => {
        return `
          <button
            class="mood-btn ${selectedMood === mood.value ? 'selected' : ''}"
            type="button"
            data-mood="${mood.value}"
            ${isLocked ? 'disabled' : ''}
          >
            <div class="mood-circle" style="background:${mood.color}">
              ${mood.emoji}
            </div>
            <div class="mood-label">${mood.label}</div>
          </button>
        `;
      })
      .join('');

    if (!isLocked) {
      container.querySelectorAll('[data-mood]').forEach((button) => {
        button.addEventListener('click', () => {
          window.AppState.draftEntry.mood = Number(button.dataset.mood);
          this.renderMoodScale();
          this.renderTodayFormState();
        });
      });
    }
  },

  renderEmotionGrid() {
    const container = document.getElementById('emotion-grid');
    if (!container) return;

    const isLocked = !!window.AppState.todayEntry;
    const source = isLocked ? window.AppState.todayEntry : window.AppState.draftEntry;
    const selected = Array.isArray(source?.emotions) ? source.emotions : [];

    container.innerHTML = window.AppState.emotions
      .map((emotion) => {
        const active = selected.includes(emotion.id);
        return `
          <button
            class="emotion-btn ${active ? 'active' : ''}"
            type="button"
            data-emotion="${emotion.id}"
            ${isLocked ? 'disabled' : ''}
          >
            ${emotion.emoji} ${emotion.label}
          </button>
        `;
      })
      .join('');

    if (!isLocked) {
      container.querySelectorAll('[data-emotion]').forEach((button) => {
        button.addEventListener('click', () => {
          const emotionId = button.dataset.emotion;
          const emotions = Array.isArray(window.AppState.draftEntry.emotions)
            ? [...window.AppState.draftEntry.emotions]
            : [];

          if (emotions.includes(emotionId)) {
            window.AppState.draftEntry.emotions = emotions.filter((id) => id !== emotionId);
          } else if (emotions.length < 3) {
            window.AppState.draftEntry.emotions = [...emotions, emotionId];
          }

          this.renderEmotionGrid();
        });
      });
    }
  },

  renderTagGrid() {
    const container = document.getElementById('tag-grid');
    if (!container) return;

    const isLocked = !!window.AppState.todayEntry;
    const source = isLocked ? window.AppState.todayEntry : window.AppState.draftEntry;
    const selected = Array.isArray(source?.tags) ? source.tags : [];
    const allTags = window.Tags.getAllSelectableTags();

    container.innerHTML = allTags
      .map((tag) => {
        return `
          <button
            class="tag-btn ${selected.includes(tag.id) ? 'active' : ''}"
            type="button"
            data-tag="${tag.id}"
            ${isLocked ? 'disabled' : ''}
          >
            ${tag.label}
          </button>
        `;
      })
      .join('');

    if (!isLocked) {
      container.querySelectorAll('[data-tag]').forEach((button) => {
        button.addEventListener('click', () => {
          window.Tags.toggleTag(button.dataset.tag);
        });
      });
    }
  },

  renderTodayFormState() {
    const noteInput = document.getElementById('note-input');
    const submitBtn = document.getElementById('submit-btn');
    const loggedConfirm = document.getElementById('logged-confirm');
    const manageTagsBtn = document.getElementById('open-tag-modal-btn');
    const editBtn = document.getElementById('edit-today-btn');

    const isLocked = !!window.AppState.todayEntry;

    if (noteInput) {
      noteInput.value = isLocked
        ? window.AppState.todayEntry?.note || ''
        : window.AppState.draftEntry?.note || '';

      noteInput.disabled = isLocked;
      noteInput.readOnly = isLocked;
    }

    if (submitBtn) {
      submitBtn.disabled = !window.AppState.draftEntry?.mood;
      submitBtn.classList.toggle('hidden', isLocked);
    }

    if (loggedConfirm) {
      loggedConfirm.classList.toggle('hidden', !isLocked);
    }

    if (manageTagsBtn) {
      manageTagsBtn.disabled = isLocked;
    }

    if (editBtn) {
      editBtn.classList.toggle('hidden', !isLocked);
    }
  },

  renderTodayInsights() {
    const container = document.getElementById('today-insights');
    if (!container) return;

    const entries = window.AppState.entries;

    if (!entries.length) {
      container.innerHTML = `<div class="section-subtle">No data yet</div>`;
      return;
    }

    const tagStats = {};

    entries.forEach((entry) => {
      if (!entry.tags || !entry.tags.length || !entry.mood) return;

      entry.tags.forEach((tagId) => {
        if (!tagStats[tagId]) {
          tagStats[tagId] = {
            totalMood: 0,
            count: 0
          };
        }

        tagStats[tagId].totalMood += entry.mood;
        tagStats[tagId].count += 1;
      });
    });

    const results = Object.entries(tagStats)
      .map(([tagId, data]) => ({
        tagId,
        avg: data.totalMood / data.count,
        count: data.count
      }))
      .filter((item) => item.count >= 2)
      .sort((a, b) => b.avg - a.avg);

    if (!results.length) {
      container.innerHTML = `<div class="section-subtle">Not enough data yet</div>`;
      return;
    }

    const best = results[0];
    const worst = results[results.length - 1];

    container.innerHTML = `
      <div class="card" style="padding:12px;">
        <div style="font-weight:600;">Best Tag</div>
        <div style="font-size:18px; margin-top:4px;">
          ${window.Utils.getTagLabel(best.tagId)}
        </div>
        <div class="section-subtle">
          Avg mood ${best.avg.toFixed(1)} across ${best.count} entries
        </div>
      </div>

      <div class="card" style="padding:12px;">
        <div style="font-weight:600;">Lowest Tag</div>
        <div style="font-size:18px; margin-top:4px;">
          ${window.Utils.getTagLabel(worst.tagId)}
        </div>
        <div class="section-subtle">
          Avg mood ${worst.avg.toFixed(1)} across ${worst.count} entries
        </div>
      </div>
    `;
  },

  renderHistoryScreen() {
    const currentTab = window.AppState.ui.currentHistoryTab || 'calendar';

    document.querySelectorAll('.tab-btn').forEach((button) => {
      button.classList.toggle('active', button.dataset.tab === currentTab);
    });

    document.querySelectorAll('.tab-panel').forEach((panel) => {
      panel.classList.remove('active');
    });

    const activePanel = document.getElementById(`tab-${currentTab}`);
    if (activePanel) activePanel.classList.add('active');

    if (currentTab === 'calendar') this.renderCalendarTab();
    if (currentTab === 'weekly') this.renderWeeklyTab();
    if (currentTab === 'trends') this.renderTrendsTab();
  },

  renderCalendarTab() {
    const panel = document.getElementById('tab-calendar');
    if (!panel) return;

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstWeekday = monthStart.getDay();
    const gridStart = new Date(today.getFullYear(), today.getMonth(), 1 - firstWeekday);

    let html = `
      <div class="card section-card">
        <div class="section-heading-row">
          <h2 class="section-heading">${window.Utils.formatMonthYear(today)}</h2>
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:10px;font-size:11px;color:var(--text-sub);text-align:center;">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;">
    `;

    for (let i = 0; i < 42; i += 1) {
      const date = window.Utils.addDays(gridStart, i);
      const dateStr = window.Utils.getLocalDateString(date);
      const entry = window.AppState.entries.find((item) => item.date === dateStr);
      const mood = entry ? window.Utils.getMoodMeta(entry.mood) : null;
      const inCurrentMonth = date.getMonth() === today.getMonth();

      html += `
        <button
          type="button"
          data-date="${dateStr}"
          ${entry ? '' : 'disabled'}
          style="
            aspect-ratio:1;
            border:none;
            border-radius:14px;
            background:${entry ? mood.color : 'var(--surface)'};
            opacity:${inCurrentMonth ? '1' : '0.35'};
            cursor:${entry ? 'pointer' : 'default'};
            font-size:12px;
          "
        >
          ${entry ? mood.emoji : date.getDate()}
        </button>
      `;
    }

    html += `
        </div>
      </div>
    `;

    panel.innerHTML = html;

    panel.querySelectorAll('[data-date]').forEach((button) => {
      if (button.disabled) return;
      button.addEventListener('click', () => {
        this.openEntryModal(button.dataset.date);
      });
    });
  },

  renderWeeklyTab() {
    const panel = document.getElementById('tab-weekly');
    if (!panel) return;

    const entries = window.Utils.sortEntriesDescending(window.AppState.entries);

    if (!entries.length) {
      panel.innerHTML = `<div class="card section-card"><div>No data yet</div></div>`;
      return;
    }

    let html = '';

    for (let i = 0; i < Math.min(entries.length, 8); i += 1) {
      const entry = entries[i];
      const mood = window.Utils.getMoodMeta(entry.mood);

      html += `
        <div class="card section-card" style="margin-bottom:12px;">
          <div class="section-heading-row">
            <h2 class="section-heading">${window.Utils.formatDisplayDate(entry.date)}</h2>
            <div>${mood ? mood.emoji : '—'}</div>
          </div>
          <div>${mood ? mood.label : 'Unknown mood'}</div>
        </div>
      `;
    }

    panel.innerHTML = html;
  },

  renderTrendsTab() {
    const panel = document.getElementById('tab-trends');
    if (!panel) return;

    const entries = window.Utils.sortEntriesAscending(window.AppState.entries);

    if (entries.length < 2) {
      panel.innerHTML = `<div class="card section-card"><div>Need at least 2 entries to show trends</div></div>`;
      return;
    }

    const recent = entries.slice(-30);
    const height = 180;

    const points = recent
      .map((entry, index) => {
        const x = (index / (recent.length - 1)) * 100;
        const y = ((9 - entry.mood) / 9) * height;
        return `${x},${y}`;
      })
      .join(' ');

    panel.innerHTML = `
      <div class="card section-card">
        <div class="section-heading-row">
          <h2 class="section-heading">Mood Trend</h2>
        </div>
        <svg viewBox="0 0 100 ${height}" style="width:100%;height:220px;">
          <polyline
            points="${points}"
            fill="none"
            stroke="var(--text)"
            stroke-width="1.5"
            vector-effect="non-scaling-stroke"
          />
        </svg>
      </div>
    `;
  },

  renderSettingsScreen() {
    const timezoneLabel = document.getElementById('timezone-label');
    const reminderToggle = document.getElementById('reminder-enabled');
    const reminderTime = document.getElementById('reminder-time');

    if (timezoneLabel) {
      timezoneLabel.textContent = window.Utils.getDeviceTimezone();
    }

    if (reminderToggle) {
      reminderToggle.textContent = window.AppState.settings.reminderEnabled
        ? 'Reminder On'
        : 'Reminder Off';
    }

    if (reminderTime) {
      reminderTime.value = window.AppState.settings.reminderTime || '20:00';
    }
  },

  renderTagManagerList() {
    const container = document.getElementById('tag-manager-list');
    if (!container) return;

    if (!window.AppState.customTags.length) {
      container.innerHTML = `<div>No custom tags yet</div>`;
      return;
    }

    container.innerHTML = window.AppState.customTags
      .map((tag) => {
        return `
          <div class="card" style="padding:12px;display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
            <span>${tag.label}</span>
            <div style="display:flex;gap:8px;">
              <button type="button" class="secondary-btn" data-edit-tag="${tag.id}">Edit</button>
              <button type="button" class="danger-btn" data-delete-tag="${tag.id}">Delete</button>
            </div>
          </div>
        `;
      })
      .join('');

    container.querySelectorAll('[data-edit-tag]').forEach((button) => {
      button.addEventListener('click', () => {
        window.Tags.beginEdit(button.dataset.editTag);
      });
    });

    container.querySelectorAll('[data-delete-tag]').forEach((button) => {
      button.addEventListener('click', async () => {
        await window.Tags.deleteTag(button.dataset.deleteTag);
      });
    });
  },

  openEntryModal(date) {
    this.renderEntryModal(date);
    const modal = document.getElementById('entry-modal');
    if (!modal) return;

    window.AppState.ui.activeEntryModalDate = date;
    modal.classList.remove('hidden');
  },

  closeEntryModal() {
    const modal = document.getElementById('entry-modal');
    if (!modal) return;

    modal.classList.add('hidden');
    window.AppState.ui.activeEntryModalDate = null;
  },

  renderEntryModal(date) {
    const entry = window.AppState.entries.find((item) => item.date === date);
    const content = document.getElementById('entry-modal-content');
    if (!content || !entry) return;

    const mood = window.Utils.getMoodMeta(entry.mood);
    const emotions = (entry.emotions || [])
      .map((id) => {
        const found = window.AppState.emotions.find((emotion) => emotion.id === id);
        return found ? `${found.emoji} ${found.label}` : id;
      })
      .join(', ') || 'None';

    const tags = (entry.tags || [])
      .map((tagId) => window.Utils.getTagLabel(tagId))
      .join(', ') || 'None';

    content.innerHTML = `
      <div class="card section-card">
        <div><strong>${window.Utils.formatDisplayDate(entry.date)}</strong></div>
        <div>Mood: ${mood ? `${mood.emoji} ${mood.label}` : 'Unknown'}</div>
        <div>Emotions: ${emotions}</div>
        <div>Tags: ${tags}</div>
        <div>Note: ${entry.note ? this.escapeHtml(entry.note) : 'No note'}</div>
      </div>
    `;
  },

  openTagModal() {
    const modal = document.getElementById('tag-modal');
    if (!modal) return;

    window.Tags.cancelEdit();
    this.renderTagManagerList();
    modal.classList.remove('hidden');
  },

  closeTagModal() {
    const modal = document.getElementById('tag-modal');
    if (!modal) return;

    window.Tags.cancelEdit();
    modal.classList.add('hidden');
  },

  switchScreen(screenName) {
    window.AppState.ui.currentScreen = screenName;

    document.querySelectorAll('.screen').forEach((screen) => {
      screen.classList.remove('active');
    });

    const nextScreen = document.getElementById(`screen-${screenName}`);
    if (nextScreen) nextScreen.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach((button) => {
      button.classList.toggle('active', button.dataset.screen === screenName);
    });

    if (screenName === 'today') this.renderTodayScreen();
    if (screenName === 'history') this.renderHistoryScreen();
    if (screenName === 'settings') this.renderSettingsScreen();
  },

  switchHistoryTab(tabName) {
    window.AppState.ui.currentHistoryTab = tabName;
    this.renderHistoryScreen();
  },

  escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
};