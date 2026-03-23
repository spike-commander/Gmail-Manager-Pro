document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const labelsContainer = document.getElementById('labelsContainer');
  const savedFiltersContainer = document.getElementById('savedFilters');
  const totalEmailsEl = document.getElementById('totalEmails');
  const unreadEmailsEl = document.getElementById('unreadEmails');
  const selectedEmailsEl = document.getElementById('selectedEmails');

  const defaultLabels = [
    { name: 'Important', color: '#d93025', id: 'IMPORTANT' },
    { name: 'Starred', color: '#fbbc04', id: 'STARRED' },
    { name: 'Snoozed', color: '#34a853', id: 'SNOOZED' },
    { name: 'Sent', color: '#4285f4', id: 'SENT' },
    { name: 'Drafts', color: '#888888', id: 'DRAFT' },
    { name: 'Spam', color: '#fbbc04', id: 'SPAM' },
    { name: 'Trash', color: '#d93025', id: 'TRASH' },
    { name: 'Personal', color: '#34a853', id: 'CATEGORY_PERSONAL' },
    { name: 'Social', color: '#4285f4', id: 'CATEGORY_SOCIAL' },
    { name: 'Promotions', color: '#fbbc04', id: 'CATEGORY_PROMOTIONS' },
    { name: 'Updates', color: '#888888', id: 'CATEGORY_UPDATES' },
    { name: 'Forums', color: '#d93025', id: 'CATEGORY_FORUMS' }
  ];

  function setStatus(message, type = 'normal') {
    statusEl.textContent = message;
    statusEl.className = 'status ' + type;
  }

  function renderLabels(labels) {
    labelsContainer.innerHTML = labels.map(label => `
      <div class="label-item" data-label-id="${label.id}">
        <span class="color-dot" style="background: ${label.color}"></span>
        <span class="name">${label.name}</span>
      </div>
    `).join('');

    labelsContainer.querySelectorAll('.label-item').forEach(item => {
      item.addEventListener('click', () => {
        const labelId = item.dataset.labelId;
        applyLabel(labelId);
      });
    });
  }

  function renderSavedFilters(filters) {
    if (!filters || filters.length === 0) {
      savedFiltersContainer.innerHTML = '<div class="empty-state">No saved filters</div>';
      return;
    }

    savedFiltersContainer.innerHTML = filters.map((filter, index) => `
      <div class="saved-filter-item">
        <span class="name">${filter.name}</span>
        <div class="actions">
          <button class="apply" data-index="${index}">Apply</button>
          <button class="delete-filter" data-index="${index}">×</button>
        </div>
      </div>
    `).join('');

    savedFiltersContainer.querySelectorAll('.apply').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        applySavedFilter(filters[index]);
      });
    });

    savedFiltersContainer.querySelectorAll('.delete-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        deleteSavedFilter(index);
      });
    });
  }

  async function updateStats() {
    try {
      const response = await chrome.tabs.query({ active: true, currentWindow: true });
      if (response[0]?.url?.includes('mail.google.com')) {
        chrome.tabs.sendMessage(response[0].id, { action: 'getStats' }, (stats) => {
          if (stats) {
            totalEmailsEl.textContent = stats.total || '-';
            unreadEmailsEl.textContent = stats.unread || '-';
            selectedEmailsEl.textContent = stats.selected || '0';
          }
        });
      }
    } catch (err) {
      console.error('Error updating stats:', err);
    }
  }

  async function performAction(action) {
    setStatus(`Running "${action}"...`, 'normal');
    
    try {
      const response = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!response[0]?.url?.includes('mail.google.com')) {
        setStatus('Open Gmail to use this extension', 'error');
        return;
      }

      const tabId = response[0].id;
      
      try {
        await chrome.tabs.sendMessage(tabId, { action });
        setStatus(`"${action}" done!`, 'connected');
        setTimeout(updateStats, 800);
      } catch (msgErr) {
        console.error('Message error:', msgErr);
        setStatus('Refresh Gmail page & try again', 'error');
      }
    } catch (err) {
      console.error('Error:', err);
      setStatus('Error: ' + err.message, 'error');
    }
  }

  async function applyLabel(labelId) {
    await performAction('applyLabel:' + labelId);
  }

  async function applySavedFilter(filter) {
    try {
      const response = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(response[0].id, { 
        action: 'applyFilter', 
        filter: filter.query 
      });
    } catch (err) {
      console.error('Error applying filter:', err);
    }
  }

  async function deleteSavedFilter(index) {
    const { savedFilters = [] } = await chrome.storage.local.get('savedFilters');
    savedFilters.splice(index, 1);
    await chrome.storage.local.set({ savedFilters });
    renderSavedFilters(savedFilters);
  }

  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      performAction(action);
    });
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      performAction('applyQuickFilter:' + filter);
    });
  });

  document.getElementById('saveFilter').addEventListener('click', async () => {
    const nameInput = document.getElementById('filterName');
    const name = nameInput.value.trim();
    if (!name) return;

    try {
      const response = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(response[0].id, { action: 'getCurrentFilter' }, async (filterQuery) => {
        if (!filterQuery) {
          setStatus('Could not get current filter', 'error');
          return;
        }

        const { savedFilters = [] } = await chrome.storage.local.get('savedFilters');
        savedFilters.push({ name, query: filterQuery });
        await chrome.storage.local.set({ savedFilters });
        renderSavedFilters(savedFilters);
        nameInput.value = '';
        setStatus('Filter saved', 'connected');
      });
    } catch (err) {
      setStatus('Error saving filter', 'error');
    }
  });

  document.getElementById('openSidebar').addEventListener('click', async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.url?.includes('mail.google.com')) {
      chrome.sidePanel.open({ tabId: tabs[0].id });
    } else {
      chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
    }
  });

  document.getElementById('runSmartTriage').addEventListener('click', async () => {
    try {
      const response = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!response[0]?.url?.includes('mail.google.com')) {
        setStatus('Open Gmail to run smart triage', 'error');
        return;
      }

      const { vipSenders = [], triageSettings = {} } = await chrome.storage.local.get(['vipSenders', 'triageSettings']);
      
      chrome.tabs.sendMessage(response[0].id, { 
        action: 'runSmartTriage',
        settings: { ...triageSettings, vipSenders }
      }, (result) => {
        if (result?.success) {
          setStatus('Smart triage completed', 'connected');
        } else {
          setStatus('Smart triage failed', 'error');
        }
      });
    } catch (err) {
      setStatus('Error: ' + err.message, 'error');
    }
  });

  document.getElementById('setReminder').addEventListener('click', () => {
    chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
    setStatus('Open sidebar to set reminders', 'normal');
  });

  document.getElementById('scanNewsletters').addEventListener('click', async () => {
    try {
      const response = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!response[0]?.url?.includes('mail.google.com')) {
        setStatus('Open Gmail to scan newsletters', 'error');
        return;
      }

      chrome.tabs.sendMessage(response[0].id, { action: 'scanNewsletters' }, (newsletters) => {
        if (newsletters?.length > 0) {
          setStatus(`Found ${newsletters.length} newsletters`, 'connected');
          chrome.storage.local.set({ newsletters });
        } else {
          setStatus('No newsletters found', 'normal');
        }
      });
    } catch (err) {
      setStatus('Error scanning: ' + err.message, 'error');
    }
  });

  document.getElementById('quickUnsubscribe').addEventListener('click', () => {
    chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
    setStatus('Use sidebar to manage unsubscribes', 'normal');
  });

  renderLabels(defaultLabels);
  
  const { savedFilters = [] } = await chrome.storage.local.get('savedFilters');
  renderSavedFilters(savedFilters);

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]?.url?.includes('mail.google.com')) {
    setStatus('Connected to Gmail', 'connected');
    updateStats();
  } else {
    setStatus('Open Gmail to use this extension', 'error');
  }
});
