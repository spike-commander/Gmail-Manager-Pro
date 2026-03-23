chrome.runtime.onInstalled.addListener(() => {
  console.log('Gmail Manager Pro extension installed');
  
  chrome.storage.local.set({
    savedFilters: [],
    settings: {
      autoRefresh: false,
      showNotifications: true
    }
  });
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Gmail Manager Pro starting up');
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('mail.google.com')) {
    chrome.tabs.sendMessage(tabId, { action: 'init' }).catch(() => {});
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url?.includes('mail.google.com')) {
    chrome.tabs.create({ url: 'https://mail.google.com/mail/u/0/#inbox' });
  } else {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'showNotification') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon.svg',
      title: 'Gmail Manager Pro',
      message: message.message || 'Action completed'
    });
  }
  return true;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('reminder_')) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon.svg',
      title: 'Gmail Reminder',
      message: 'You have a reminder to check your email'
    });
    
    if (tabs[0]?.url?.includes('mail.google.com')) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'reminderTriggered' });
    }
  }
});

chrome.contextMenus?.removeAll(() => {
  chrome.contextMenus?.create({
    id: 'gmail-manager-archive',
    title: 'Archive in Gmail',
    contexts: ['page'],
    documentUrlPatterns: ['https://mail.google.com/*']
  });
  
  chrome.contextMenus?.create({
    id: 'gmail-manager-delete',
    title: 'Delete in Gmail',
    contexts: ['page'],
    documentUrlPatterns: ['https://mail.google.com/*']
  });
});

chrome.contextMenus?.onClicked.addListener((info, tab) => {
  if (tab?.id && tab.url?.includes('mail.google.com')) {
    const actionMap = {
      'gmail-manager-archive': 'archive',
      'gmail-manager-delete': 'delete'
    };
    
    if (actionMap[info.menuItemId]) {
      chrome.tabs.sendMessage(tab.id, { action: actionMap[info.menuItemId] });
    }
  }
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
