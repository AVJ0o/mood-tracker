window.AppState = {
  moods: [
    { value: 1, label: 'Very Sad', emoji: '😞', color: '#6B7FD7' },
    { value: 2, label: 'Sad', emoji: '😕', color: '#8B9FE8' },
    { value: 3, label: 'Low', emoji: '😟', color: '#A0B4E0' },
    { value: 4, label: 'Meh', emoji: '😐', color: '#B8BCC8' },
    { value: 5, label: 'Neutral', emoji: '😑', color: '#D4C59E' },
    { value: 6, label: 'Okay', emoji: '🙂', color: '#F0A86B' },
    { value: 7, label: 'Happy', emoji: '😊', color: '#F6C667' },
    { value: 8, label: 'Great', emoji: '😄', color: '#F5A852' },
    { value: 9, label: 'Euphoric', emoji: '🤩', color: '#EE8B60' }
  ],

  emotions: [
    { id: 'happy', label: 'Happy', emoji: '😊' },
    { id: 'anxious', label: 'Anxious', emoji: '😰' },
    { id: 'scared', label: 'Scared', emoji: '😨' },
    { id: 'tired', label: 'Tired', emoji: '😴' },
    { id: 'focused', label: 'Focused', emoji: '🎯' },
    { id: 'scattered', label: 'Scattered', emoji: '😵' },
    { id: 'calm', label: 'Calm', emoji: '🧘' },
    { id: 'angry', label: 'Angry', emoji: '😠' },
    { id: 'lonely', label: 'Lonely', emoji: '😞' },
    { id: 'energized', label: 'Energized', emoji: '⚡' }
  ],

  presetTags: [
    { id: 'sleep_poor', label: 'Sleep <6h' },
    { id: 'sleep_good', label: 'Sleep 7-9h' },
    { id: 'exercise', label: 'Exercise' },
    { id: 'work_stress', label: 'Work stress' },
    { id: 'productive', label: 'Productive' },
    { id: 'social', label: 'Social time' },
    { id: 'family', label: 'Family time' }
  ],

  db: null,

  entries: [],
  customTags: [],
  todayEntry: null,

  draftEntry: {
    mood: null,
    emotions: [],
    tags: [],
    note: ''
  },

  settings: {
    reminderEnabled: false,
    reminderTime: '20:00'
  },

  ui: {
    currentScreen: 'today',
    currentHistoryTab: 'calendar',
    activeEntryModalDate: null,
    editingTagId: null
  }
};