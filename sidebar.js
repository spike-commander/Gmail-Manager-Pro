(function() {
  'use strict';

  const STORAGE_KEYS = {
    RULES: 'gmailManagerRules',
    VIP_SENDERS: 'vipSenders',
    TRIAGE_SETTINGS: 'triageSettings',
    NEWSLETTERS: 'newsletters',
    REMINDERS: 'reminders',
    UNSUBSCRIBED_COUNT: 'unsubscribedCount'
  };

  let state = {
    rules: [],
    vipSenders: [],
    triageSettings: {
      enabled: true,
      highPriorityAction: 'important',
      lowPriorityAction: 'archive'
    },
    newsletters: [],
    reminders: []
  };

  async function init() {
    await loadState();
    setupTabs();
    setupEventListeners();
    renderAll();
  }

  async function loadState() {
    const stored = await chrome.storage.local.get(Object.values(STORAGE_KEYS));
    state.rules = stored[STORAGE_KEYS.RULES] || [];
    state.vipSenders = stored[STORAGE_KEYS.VIP_SENDERS] || [];
    state.triageSettings = stored[STORAGE_KEYS.TRIAGE_SETTINGS] || state.triageSettings;
    state.newsletters = stored[STORAGE_KEYS.NEWSLETTERS] || [];
    state.reminders = stored[STORAGE_KEYS.REMINDERS] || [];
  }

  async function saveState() {
    await chrome.storage.local.set({
      [STORAGE_KEYS.RULES]: state.rules,
      [STORAGE_KEYS.VIP_SENDERS]: state.vipSenders,
      [STORAGE_KEYS.TRIAGE_SETTINGS]: state.triageSettings,
      [STORAGE_KEYS.NEWSLETTERS]: state.newsletters,
      [STORAGE_KEYS.REMINDERS]: state.reminders
    });
  }

  function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
      });
    });

    document.querySelectorAll('.reminder-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.reminder-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderReminders(tab.dataset.type);
      });
    });
  }

  function setupEventListeners() {
    document.getElementById('addRuleBtn').addEventListener('click', () => openRuleModal());
    document.getElementById('closeRuleModal').addEventListener('click', () => closeRuleModal());
    document.getElementById('cancelRuleBtn').addEventListener('click', () => closeRuleModal());
    document.getElementById('saveRuleBtn').addEventListener('click', () => saveRule());
    document.getElementById('addActionBtn').addEventListener('click', () => addActionField());

    document.querySelectorAll('.template-btn').forEach(btn => {
      btn.addEventListener('click', () => applyTemplate(btn.dataset.template));
    });

    document.getElementById('enablePriorityTriage').addEventListener('change', (e) => {
      state.triageSettings.enabled = e.target.checked;
      saveState();
    });

    document.getElementById('highPriorityAction').addEventListener('change', (e) => {
      state.triageSettings.highPriorityAction = e.target.value;
      saveState();
    });

    document.getElementById('lowPriorityAction').addEventListener('change', (e) => {
      state.triageSettings.lowPriorityAction = e.target.value;
      saveState();
    });

    document.getElementById('addVipBtn').addEventListener('click', () => addVipSender());
    document.getElementById('vipEmail').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addVipSender();
    });

    document.getElementById('scanNewsletters').addEventListener('click', () => scanForNewsletters());
    document.getElementById('addReminderBtn').addEventListener('click', () => openReminderModal());
    document.getElementById('closeReminderModal').addEventListener('click', () => closeReminderModal());
    document.getElementById('cancelReminderBtn').addEventListener('click', () => closeReminderModal());
    document.getElementById('saveReminderBtn').addEventListener('click', () => saveReminder());

    document.getElementById('openSidebarBtn').addEventListener('click', () => {
      chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
    });

    document.querySelectorAll('.remove-action').forEach(btn => {
      btn.addEventListener('click', (e) => e.target.closest('.action-item').remove());
    });
  }

  function renderAll() {
    renderRules();
    renderVipSenders();
    renderNewsletters();
    renderReminders('pending');
    updateTriageSettings();
  }

  function renderRules() {
    const container = document.getElementById('rulesList');
    if (state.rules.length === 0) {
      container.innerHTML = '<div class="empty-state">No rules created yet</div>';
      return;
    }

    container.innerHTML = state.rules.map((rule, index) => `
      <div class="rule-item ${rule.enabled ? '' : 'disabled'}">
        <div class="rule-header">
          <span class="rule-name">${escapeHtml(rule.name)}</span>
          <label class="rule-toggle">
            <input type="checkbox" ${rule.enabled ? 'checked' : ''} data-rule-index="${index}">
            <span class="slider"></span>
          </label>
        </div>
        <div class="rule-conditions">${escapeHtml(rule.condition.field)} ${rule.condition.operator} "${escapeHtml(rule.condition.value)}"</div>
        <div class="rule-actions">
          <button class="rule-action-btn" data-action="run" data-index="${index}">Run Now</button>
          <button class="rule-action-btn" data-action="edit" data-index="${index}">Edit</button>
          <button class="rule-action-btn delete" data-action="delete" data-index="${index}">Delete</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.rule-toggle input').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.ruleIndex);
        state.rules[index].enabled = e.target.checked;
        saveState();
        renderRules();
      });
    });

    container.querySelectorAll('.rule-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        const index = parseInt(btn.dataset.index);
        if (action === 'delete') deleteRule(index);
        else if (action === 'edit') editRule(index);
        else if (action === 'run') runRule(index);
      });
    });
  }

  function renderVipSenders() {
    const container = document.getElementById('vipSenders');
    if (state.vipSenders.length === 0) {
      container.innerHTML = '<div class="empty-state small">No VIP senders added</div>';
      return;
    }

    container.innerHTML = state.vipSenders.map((email, index) => `
      <div class="vip-item">
        <span>${escapeHtml(email)}</span>
        <span class="remove" data-index="${index}">&times;</span>
      </div>
    `).join('');

    container.querySelectorAll('.remove').forEach(btn => {
      btn.addEventListener('click', () => {
        state.vipSenders.splice(parseInt(btn.dataset.index), 1);
        saveState();
        renderVipSenders();
      });
    });
  }

  function renderNewsletters() {
    const container = document.getElementById('unsubscribeList');
    document.getElementById('newsletterCount').textContent = state.newsletters.length;
    
    if (state.newsletters.length === 0) {
      container.innerHTML = '<div class="empty-state">No newsletters detected</div>';
      return;
    }

    container.innerHTML = state.newsletters.map((nl, index) => `
      <div class="newsletter-item">
        <div class="newsletter-info">
          <div class="newsletter-name">${escapeHtml(nl.name)}</div>
          <div class="newsletter-email">${escapeHtml(nl.email)}</div>
        </div>
        <button class="unsubscribe-btn" data-index="${index}">Unsubscribe</button>
      </div>
    `).join('');

    container.querySelectorAll('.unsubscribe-btn').forEach(btn => {
      btn.addEventListener('click', () => unsubscribe(btn.dataset.index));
    });
  }

  function renderReminders(type) {
    const container = document.getElementById('remindersList');
    const filtered = state.reminders.filter(r => r.status === type);

    if (filtered.length === 0) {
      container.innerHTML = '<div class="empty-state">No reminders</div>';
      return;
    }

    container.innerHTML = filtered.map((reminder, index) => {
      const actualIndex = state.reminders.indexOf(reminder);
      return `
        <div class="reminder-item">
          <div class="reminder-icon">${getReminderIcon(reminder.type)}</div>
          <div class="reminder-content">
            <div class="reminder-title">${escapeHtml(reminder.title)}</div>
            <div class="reminder-meta">Due: ${formatDate(reminder.dueDate)}</div>
            ${reminder.note ? `<div class="reminder-meta">Note: ${escapeHtml(reminder.note)}</div>` : ''}
          </div>
          <div class="reminder-actions">
            ${type === 'pending' ? `
              <button data-action="complete" data-index="${actualIndex}">Done</button>
              <button data-action="snooze" data-index="${actualIndex}">Snooze</button>
            ` : ''}
            <button data-action="delete" data-index="${actualIndex}">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.reminder-actions button').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const index = parseInt(btn.dataset.index);
        if (action === 'delete') deleteReminder(index);
        else if (action === 'complete') completeReminder(index);
        else if (action === 'snooze') snoozeReminder(index);
      });
    });
  }

  function updateTriageSettings() {
    document.getElementById('enablePriorityTriage').checked = state.triageSettings.enabled;
    document.getElementById('highPriorityAction').value = state.triageSettings.highPriorityAction;
    document.getElementById('lowPriorityAction').value = state.triageSettings.lowPriorityAction;
  }

  function openRuleModal(rule = null) {
    const modal = document.getElementById('ruleModal');
    const title = document.getElementById('modalTitle');
    
    if (rule) {
      title.textContent = 'Edit Rule';
      document.getElementById('ruleName').value = rule.name;
      document.getElementById('conditionField').value = rule.condition.field;
      document.getElementById('conditionOperator').value = rule.condition.operator;
      document.getElementById('conditionValue').value = rule.condition.value;
      document.getElementById('ruleEnabled').checked = rule.enabled;
      modal.dataset.editIndex = state.rules.indexOf(rule);
    } else {
      title.textContent = 'Create New Rule';
      document.getElementById('ruleName').value = '';
      document.getElementById('conditionField').value = 'from';
      document.getElementById('conditionOperator').value = 'contains';
      document.getElementById('conditionValue').value = '';
      document.getElementById('ruleEnabled').checked = true;
      delete modal.dataset.editIndex;
    }

    renderActions(rule?.actions || []);
    modal.classList.add('active');
  }

  function closeRuleModal() {
    document.getElementById('ruleModal').classList.remove('active');
  }

  function renderActions(actions) {
    const container = document.getElementById('actionsBuilder');
    
    if (actions.length === 0) {
      container.innerHTML = `
        <div class="action-item">
          <select class="action-select">
            <option value="archive">Archive</option>
            <option value="delete">Delete</option>
            <option value="markRead">Mark as Read</option>
            <option value="star">Star</option>
            <option value="applyLabel">Apply Label</option>
            <option value="removeLabel">Remove Label</option>
            <option value="forward">Forward to</option>
            <option value="notify">Show Notification</option>
          </select>
          <input type="text" class="action-value" placeholder="Label/Email...">
          <button class="remove-action">&times;</button>
        </div>
      `;
      return;
    }

    container.innerHTML = actions.map(action => `
      <div class="action-item">
        <select class="action-select">
          <option value="archive" ${action.type === 'archive' ? 'selected' : ''}>Archive</option>
          <option value="delete" ${action.type === 'delete' ? 'selected' : ''}>Delete</option>
          <option value="markRead" ${action.type === 'markRead' ? 'selected' : ''}>Mark as Read</option>
          <option value="star" ${action.type === 'star' ? 'selected' : ''}>Star</option>
          <option value="applyLabel" ${action.type === 'applyLabel' ? 'selected' : ''}>Apply Label</option>
          <option value="removeLabel" ${action.type === 'removeLabel' ? 'selected' : ''}>Remove Label</option>
          <option value="forward" ${action.type === 'forward' ? 'selected' : ''}>Forward to</option>
          <option value="notify" ${action.type === 'notify' ? 'selected' : ''}>Show Notification</option>
        </select>
        <input type="text" class="action-value" placeholder="Label/Email..." value="${action.value || ''}">
        <button class="remove-action">&times;</button>
      </div>
    `).join('');

    container.querySelectorAll('.remove-action').forEach(btn => {
      btn.addEventListener('click', (e) => e.target.closest('.action-item').remove());
    });
  }

  function addActionField() {
    const container = document.getElementById('actionsBuilder');
    const div = document.createElement('div');
    div.className = 'action-item';
    div.innerHTML = `
      <select class="action-select">
        <option value="archive">Archive</option>
        <option value="delete">Delete</option>
        <option value="markRead">Mark as Read</option>
        <option value="star">Star</option>
        <option value="applyLabel">Apply Label</option>
        <option value="removeLabel">Remove Label</option>
        <option value="forward">Forward to</option>
        <option value="notify">Show Notification</option>
      </select>
      <input type="text" class="action-value" placeholder="Label/Email...">
      <button class="remove-action">&times;</button>
    `;
    div.querySelector('.remove-action').addEventListener('click', () => div.remove());
    container.appendChild(div);
  }

  function saveRule() {
    const name = document.getElementById('ruleName').value.trim();
    if (!name) return alert('Please enter a rule name');

    const condition = {
      field: document.getElementById('conditionField').value,
      operator: document.getElementById('conditionOperator').value,
      value: document.getElementById('conditionValue').value
    };

    const actions = [];
    document.querySelectorAll('.action-item').forEach(item => {
      const type = item.querySelector('.action-select').value;
      const value = item.querySelector('.action-value').value;
      actions.push({ type, value });
    });

    const rule = {
      name,
      condition,
      actions,
      enabled: document.getElementById('ruleEnabled').checked,
      createdAt: Date.now()
    };

    const modal = document.getElementById('ruleModal');
    if (modal.dataset.editIndex !== undefined) {
      state.rules[parseInt(modal.dataset.editIndex)] = rule;
    } else {
      state.rules.push(rule);
    }

    saveState();
    closeRuleModal();
    renderRules();
  }

  function deleteRule(index) {
    if (confirm('Delete this rule?')) {
      state.rules.splice(index, 1);
      saveState();
      renderRules();
    }
  }

  function editRule(index) {
    openRuleModal(state.rules[index]);
  }

  async function runRule(index) {
    const rule = state.rules[index];
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.url?.includes('mail.google.com')) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'runRule', rule });
    }
  }

  function applyTemplate(template) {
    const templates = {
      newsletter: {
        name: 'Archive Newsletters',
        condition: { field: 'listUnsubscribe', operator: 'equals', value: 'true' },
        actions: [{ type: 'applyLabel', value: 'Newsletters' }]
      },
      social: {
        name: 'Social Media to Label',
        condition: { field: 'from', operator: 'contains', value: 'facebook.com|twitter.com|instagram.com|linkedin.com' },
        actions: [{ type: 'applyLabel', value: 'Social' }]
      },
      important: {
        name: 'VIP Priority',
        condition: { field: 'from', operator: 'contains', value: state.vipSenders.join('|') },
        actions: [{ type: 'star', value: '' }]
      },
      attachments: {
        name: 'Label Attachments',
        condition: { field: 'hasAttachment', operator: 'equals', value: 'true' },
        actions: [{ type: 'applyLabel', value: 'Has Attachments' }]
      }
    };

    const templateRule = templates[template];
    if (templateRule) {
      state.rules.push({
        ...templateRule,
        enabled: true,
        createdAt: Date.now()
      });
      saveState();
      renderRules();
    }
  }

  async function addVipSender() {
    const input = document.getElementById('vipEmail');
    const email = input.value.trim();
    if (email && !state.vipSenders.includes(email)) {
      state.vipSenders.push(email);
      saveState();
      renderVipSenders();
      input.value = '';
    }
  }

  async function scanForNewsletters() {
    const btn = document.getElementById('scanNewsletters');
    btn.textContent = 'Scanning...';
    btn.disabled = true;

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.url?.includes('mail.google.com')) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'scanNewsletters' }, (newsletters) => {
        state.newsletters = newsletters || [];
        saveState();
        renderNewsletters();
        btn.textContent = 'Scan for Newsletters';
        btn.disabled = false;
      });
    } else {
      btn.textContent = 'Scan for Newsletters';
      btn.disabled = false;
    }
  }

  async function unsubscribe(index) {
    const newsletter = state.newsletters[index];
    if (!newsletter) return;

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.url?.includes('mail.google.com')) {
      chrome.tabs.sendMessage(tabs[0].id, { 
        action: 'unsubscribe', 
        newsletterEmail: newsletter.email 
      }, (success) => {
        if (success) {
          state.newsletters.splice(index, 1);
          chrome.storage.local.get(STORAGE_KEYS.UNSUBSCRIBED_COUNT, (data) => {
            const count = (data[STORAGE_KEYS.UNSUBSCRIBED_COUNT] || 0) + 1;
            chrome.storage.local.set({ [STORAGE_KEYS.UNSUBSCRIBED_COUNT]: count });
            document.getElementById('unsubscribedCount').textContent = count;
          });
          saveState();
          renderNewsletters();
        }
      });
    }
  }

  function openReminderModal() {
    document.getElementById('reminderModal').classList.add('active');
  }

  function closeReminderModal() {
    document.getElementById('reminderModal').classList.remove('active');
  }

  async function saveReminder() {
    const type = document.getElementById('reminderType').value;
    const amount = parseInt(document.getElementById('reminderAmount').value);
    const unit = document.getElementById('reminderUnit').value;
    const note = document.getElementById('reminderNote').value;

    const now = Date.now();
    const msPerUnit = {
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      weeks: 7 * 24 * 60 * 60 * 1000
    };
    const dueDate = now + (amount * msPerUnit[unit]);

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    let title = 'Custom Reminder';
    let emailId = null;

    if (type !== 'custom' && tabs[0]?.url?.includes('mail.google.com')) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedEmail' }, (email) => {
        if (email) {
          title = email.subject || 'Email Reminder';
          emailId = email.id;
          createReminder();
        }
      });
    } else {
      title = note || 'Custom Reminder';
      createReminder();
    }

    function createReminder() {
      state.reminders.push({
        type,
        title,
        emailId,
        dueDate,
        note,
        status: 'pending',
        createdAt: Date.now()
      });
      saveState();
      closeReminderModal();
      renderReminders('pending');
      
      chrome.alarms.create(`reminder_${Date.now()}`, {
        delayInMinutes: amount * (unit === 'hours' ? 60 : unit === 'days' ? 1440 : unit === 'weeks' ? 10080 : 1)
      });
    }
  }

  function deleteReminder(index) {
    state.reminders.splice(index, 1);
    saveState();
    renderReminders('pending');
  }

  function completeReminder(index) {
    state.reminders[index].status = 'completed';
    state.reminders[index].completedAt = Date.now();
    saveState();
    renderReminders('pending');
  }

  function snoozeReminder(index) {
    const reminder = state.reminders[index];
    reminder.dueDate = Date.now() + (24 * 60 * 60 * 1000);
    saveState();
    renderReminders('pending');
  }

  function getReminderIcon(type) {
    const icons = {
      email: '📧',
      thread: '💬',
      custom: '📝'
    };
    return icons[type] || '📝';
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  chrome.storage.local.get(STORAGE_KEYS.UNSUBSCRIBED_COUNT, (data) => {
    document.getElementById('unsubscribedCount').textContent = data[STORAGE_KEYS.UNSUBSCRIBED_COUNT] || 0;
  });

  init();
})();
