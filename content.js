(function() {
  'use strict';

  function getEmailRows() {
    return Array.from(document.querySelectorAll('tr[data-thread-id], div[data-legacy-thread-id]'));
  }

  function getSelectedEmails() {
    return Array.from(document.querySelectorAll('tr[data-thread-id][aria-selected="true"], div[aria-selected="true"].zA, tr.Xa[aria-selected="true"]'));
  }

  function getAllEmails() {
    return Array.from(document.querySelectorAll('tr[data-thread-id], div.zA, table.F table tbody tr'));
  }

  function getEmailCount() {
    const countEl = document.querySelector('.bsU') || 
                   document.querySelector('[role="status"]') ||
                   document.querySelector('.aK');
    if (countEl) {
      const text = countEl.textContent || '';
      const match = text.match(/(\d+)/);
      if (match) return parseInt(match[1]);
    }
    return getEmailRows().length || 25;
  }

  function getUnreadCount() {
    const unreadEl = document.querySelector('[data-tooltip="Unread"]') ||
                    document.querySelector('span[aria-label*="Unread"]');
    if (unreadEl) {
      const text = unreadEl.textContent || '';
      const match = text.match(/(\d+)/);
      if (match) return parseInt(match[1]);
    }
    return 0;
  }

  async function selectAll() {
    const selectors = [
      'div[aria-label="Select all"]',
      'div[aria-checked="false"][role="checkbox"]',
      'div[data-tooltip="Select all"]',
      '[data-tooltip="Select"]',
      '.J-Jh',
      'div[aria-label="Select all conversations"]'
    ];
    
    for (const sel of selectors) {
      const checkbox = document.querySelector(sel);
      if (checkbox) {
        checkbox.click();
        await delay(150);
        return true;
      }
    }
    
    sendKeyboardShortcut('* a');
    await delay(300);
    return true;
  }

  async function deselectAll() {
    const selected = getSelectedEmails();
    for (const el of selected) {
      el.click();
      await delay(50);
    }
  }

  async function archiveSelected() {
    const archiveBtn = document.querySelector('[data-tooltip="Archive"]') ||
                       document.querySelector('[aria-label="Archive"]') ||
                       document.querySelector('.T-I[aria-label*="Archive"]') ||
                       document.querySelector('[data-tooltip="Archive (e)"]');
    
    if (archiveBtn) {
      archiveBtn.click();
      await delay(300);
      return true;
    }
    
    sendKeyboardShortcut('e');
    await delay(300);
    return true;
  }

  async function deleteSelected() {
    const deleteBtn = document.querySelector('[data-tooltip="Delete"]') ||
                     document.querySelector('[aria-label="Delete"]') ||
                     document.querySelector('[data-tooltip="Delete (##)"]');
    
    if (deleteBtn) {
      deleteBtn.click();
      await delay(300);
      return true;
    }
    
    sendKeyboardShortcut('#');
    await delay(300);
    return true;
  }

  async function markAsRead() {
    const readBtn = document.querySelector('[data-tooltip="Mark as read"]') ||
                   document.querySelector('[data-tooltip="Mark as read (i)"]');
    
    if (readBtn) {
      readBtn.click();
      await delay(300);
      return true;
    }
    
    sendKeyboardShortcut('r');
    await delay(300);
    return true;
  }

  async function markAsUnread() {
    const unreadBtn = document.querySelector('[data-tooltip="Mark as unread"]') ||
                     document.querySelector('[data-tooltip="Mark as unread (u)"]');
    
    if (unreadBtn) {
      unreadBtn.click();
      await delay(300);
      return true;
    }
    
    sendKeyboardShortcut('u');
    await delay(300);
    return true;
  }

  async function markAsImportant() {
    const importantBtn = document.querySelector('[data-tooltip="Mark as important"]') ||
                        document.querySelector('[data-tooltip="Mark as important (+)"]');
    
    if (importantBtn) {
      importantBtn.click();
      await delay(300);
      return true;
    }
    
    sendKeyboardShortcut('+');
    await delay(300);
    return true;
  }

  async function reportSpam() {
    const spamBtn = document.querySelector('[data-tooltip="Report spam"]') ||
                   document.querySelector('[data-tooltip="Report spam (!)"]');
    
    if (spamBtn) {
      spamBtn.click();
      await delay(300);
      return true;
    }
    
    sendKeyboardShortcut('!');
    await delay(300);
    return true;
  }

  async function starEmail() {
    document.activeElement?.blur();
    await delay(50);
    sendKeyboardShortcut('s');
    await delay(300);
    return true;
  }

  async function muteConversation() {
    document.activeElement?.blur();
    await delay(50);
    sendKeyboardShortcut('m');
    await delay(300);
    return true;
  }

  function sendKeyboardShortcut(key) {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: key,
      code: `Key${key.toUpperCase()}`,
      bubbles: true,
      cancelable: true
    }));
  }

  async function applyLabel(labelName) {
    const moreBtn = document.querySelector('.T-I[data-tooltip="More actions"]') ||
                    document.querySelector('[data-tooltip="More actions"]') ||
                    document.querySelector('.T-I[aria-label*="More"]');
    
    if (!moreBtn) {
      sendKeyboardShortcut('l');
      await delay(500);
      return typeAndEnter(labelName);
    }
    
    moreBtn.click();
    await delay(300);
    
    const moveToItem = Array.from(document.querySelectorAll('[role="menuitem"]'))
      .find(el => el.textContent.includes('Move to'));
    
    if (moveToItem) {
      moveToItem.click();
      await delay(300);
      
      const labelOption = Array.from(document.querySelectorAll('[role="menuitem"]'))
        .find(el => el.textContent.toLowerCase().includes(labelName.toLowerCase()));
      
      if (labelOption) {
        labelOption.click();
        return true;
      }
    }
    return false;
  }

  async function typeAndEnter(text) {
    const labelInput = document.querySelector('input[aria-label="Apply label"]') ||
                      document.querySelector('input[placeholder="Labels"]');
    if (labelInput) {
      labelInput.focus();
      labelInput.value = text;
      labelInput.dispatchEvent(new Event('input', { bubbles: true }));
      await delay(200);
      sendKeyboardShortcut('Enter');
      await delay(300);
      return true;
    }
    return false;
  }

  function getCurrentFilterQuery() {
    const searchInput = document.querySelector('input[aria-label="Search mail"]') ||
                       document.querySelector('#gs_lc0 input') ||
                       document.querySelector('input[name="q"]');
    return searchInput?.value || '';
  }

  async function applyQuickFilter(filterType) {
    const filterMap = {
      'unread': 'is:unread',
      'starred': 'is:starred',
      'important': 'is:important',
      'attachments': 'has:attachment'
    };

    const query = filterMap[filterType];
    if (!query) return false;

    const searchInput = document.querySelector('input[aria-label="Search mail"]') ||
                       document.querySelector('#gs_lc0 input') ||
                       document.querySelector('input[name="q"]');
    
    if (!searchInput) return false;

    searchInput.focus();
    searchInput.value = query;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    await delay(100);
    sendKeyboardShortcut('Enter');
    await delay(500);
    
    return true;
  }

  function getStats() {
    return {
      total: getEmailCount(),
      unread: getUnreadCount(),
      selected: getSelectedEmails().length
    };
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function evaluateCondition(emailEl, condition) {
    const field = condition.field;
    const operator = condition.operator;
    const value = condition.value.toLowerCase();
    
    let emailText = '';
    
    switch (field) {
      case 'from':
        const fromEl = emailEl.querySelector('.zF, [email]');
        emailText = fromEl?.textContent?.toLowerCase() || fromEl?.getAttribute('email') || '';
        break;
      case 'subject':
        const subjectEl = emailEl.querySelector('.bog, .subject');
        emailText = subjectEl?.textContent?.toLowerCase() || '';
        break;
      case 'hasAttachment':
        const attachment = emailEl.querySelector('.wk, [aria-label*="attachment"]');
        return operator === 'equals' ? !!attachment : !attachment;
      case 'listUnsubscribe':
        return emailEl.outerHTML.toLowerCase().includes('unsubscribe');
      default:
        emailText = emailEl.textContent?.toLowerCase() || '';
    }
    
    switch (operator) {
      case 'contains':
        return emailText.includes(value);
      case 'notContains':
        return !emailText.includes(value);
      case 'equals':
        return emailText === value;
      case 'startsWith':
        return emailText.startsWith(value);
      case 'regex':
        try {
          return new RegExp(value, 'i').test(emailText);
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  async function executeRule(rule) {
    const emails = getAllEmails().slice(0, 50);
    const matchedEmails = emails.filter(el => evaluateCondition(el, rule.condition));
    
    for (const emailEl of matchedEmails.slice(0, 10)) {
      emailEl.click();
      await delay(200);
      
      for (const action of rule.actions) {
        await executeAction(action);
        await delay(150);
      }
    }
    
    return matchedEmails.length;
  }

  async function executeAction(action) {
    switch (action.type) {
      case 'archive': return await archiveSelected();
      case 'delete': return await deleteSelected();
      case 'markRead': return await markAsRead();
      case 'star': return await starEmail();
      case 'applyLabel': return await applyLabel(action.value);
      case 'notify': 
        chrome.runtime.sendMessage({ type: 'showNotification', message: action.value || 'Rule executed' });
        return true;
      default: return false;
    }
  }

  async function scanForNewsletters() {
    const newsletters = new Map();
    const emails = getAllEmails().slice(0, 50);
    
    for (const emailEl of emails) {
      const html = emailEl.outerHTML.toLowerCase();
      
      if (html.includes('unsubscribe') || html.includes('newsletter')) {
        const fromEl = emailEl.querySelector('.zF, [email]') || emailEl;
        const fromText = fromEl?.textContent || '';
        const emailMatch = fromText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        
        if (emailMatch) {
          const email = emailMatch[1];
          if (!newsletters.has(email)) {
            newsletters.set(email, {
              name: fromText.split('@')[0].trim() || email,
              email: email
            });
          }
        }
      }
    }
    
    return Array.from(newsletters.values());
  }

  async function unsubscribe(email) {
    const searchInput = document.querySelector('input[aria-label="Search mail"]') ||
                       document.querySelector('#gs_lc0 input');
    if (!searchInput) return false;

    searchInput.focus();
    searchInput.value = `from:${email}`;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    await delay(100);
    sendKeyboardShortcut('Enter');
    
    await delay(1000);
    
    const firstEmail = getAllEmails()[0];
    if (firstEmail) {
      firstEmail.click();
      await delay(500);
      
      document.body.innerHTML.toLowerCase().includes('unsubscribe') && 
        (() => {
          const links = Array.from(document.querySelectorAll('a'));
          const unsubLink = links.find(a => 
            a.textContent.toLowerCase().includes('unsubscribe') || 
            a.href.toLowerCase().includes('unsubscribe')
          );
          if (unsubLink) {
            unsubLink.click();
            return true;
          }
          return false;
        })();
    }
    
    return true;
  }

  async function performSmartTriage(settings) {
    if (!settings.enabled) return;
    
    const emails = getAllEmails().slice(0, 30);
    const vipEmails = settings.vipSenders || [];
    
    for (const emailEl of emails) {
      const fromEl = emailEl.querySelector('.zF');
      const fromText = fromEl?.textContent?.toLowerCase() || '';
      const isVip = vipEmails.some(vip => fromText.includes(vip.toLowerCase()));
      
      const subjectEl = emailEl.querySelector('.bog');
      const subjectText = subjectEl?.textContent?.toLowerCase() || '';
      const hasImportantKeywords = ['urgent', 'important', 'asap', 'critical', 'priority'].some(
        kw => subjectText.includes(kw)
      );
      
      const isPriority = isVip || hasImportantKeywords;
      
      let action = isPriority ? settings.highPriorityAction : settings.lowPriorityAction;
      
      if (action && action !== 'none') {
        emailEl.click();
        await delay(300);
        
        if (action === 'archive') await archiveSelected();
        else if (action === 'star') await starEmail();
        else if (action === 'mute') await muteConversation();
        
        await delay(200);
      }
    }
  }

  function getSelectedEmailInfo() {
    const selected = getSelectedEmails();
    if (selected.length === 0) return null;
    
    const emailEl = selected[0];
    const fromEl = emailEl.querySelector('.zF');
    const subjectEl = emailEl.querySelector('.bog');
    
    return {
      id: emailEl.dataset?.threadId || Date.now().toString(),
      from: fromEl?.textContent || '',
      subject: subjectEl?.textContent || ''
    };
  }

  const handler = (request, sender, sendResponse) => {
    const action = request.action;
    
    if (action === 'getStats') {
      sendResponse(getStats());
      return;
    }
    
    if (action === 'getCurrentFilter') {
      sendResponse(getCurrentFilterQuery());
      return;
    }

    if (action === 'getSelectedEmail') {
      sendResponse(getSelectedEmailInfo());
      return;
    }

    if (action === 'scanNewsletters') {
      scanForNewsletters().then(newsletters => {
        sendResponse(newsletters);
      });
      return true;
    }

    if (action === 'unsubscribe') {
      unsubscribe(request.newsletterEmail).then(success => {
        sendResponse(success);
      });
      return true;
    }

    if (action === 'runRule') {
      executeRule(request.rule).then(count => {
        sendResponse({ success: true, processed: count });
      });
      return true;
    }

    if (action === 'runSmartTriage') {
      performSmartTriage(request.settings).then(() => {
        sendResponse({ success: true });
      });
      return true;
    }

    if (action.startsWith('applyLabel:')) {
      const labelId = action.split(':')[1];
      applyLabel(labelId).then(success => {
        sendResponse({ success });
      });
      return true;
    }

    if (action.startsWith('applyQuickFilter:')) {
      const filter = action.split(':')[1];
      applyQuickFilter(filter).then(success => {
        sendResponse({ success });
      });
      return true;
    }

    if (action.startsWith('applyFilter:')) {
      const query = action.split(':')[1];
      applyQuickFilter(query).then(success => {
        sendResponse({ success });
      });
      return true;
    }

    const actionHandlers = {
      selectAll: async () => { return await selectAll(); },
      deselectAll: async () => { await deselectAll(); return true; },
      archive: async () => { return await archiveSelected(); },
      delete: async () => { return await deleteSelected(); },
      markRead: async () => { return await markAsRead(); },
      markUnread: async () => { return await markAsUnread(); },
      star: async () => { return await starEmail(); },
      spam: async () => { return await reportSpam(); }
    };

    if (actionHandlers[action]) {
      actionHandlers[action]().then(success => {
        sendResponse({ success });
      });
      return true;
    }

    sendResponse({ success: false });
  };

  chrome.runtime.onMessage.addListener(handler);

  console.log('Gmail Manager Pro loaded');
})();
