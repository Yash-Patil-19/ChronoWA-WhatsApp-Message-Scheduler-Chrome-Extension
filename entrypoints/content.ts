import { defineContentScript } from 'wxt/sandbox';
import { saveScheduledMessage, getQuickSnippets, saveFollowUpReminder } from '../utils/storage';
import { ScheduledMessage, QuickSnippet, FollowUpReminder } from '../utils/types';

export default defineContentScript({
  matches: ['*://web.whatsapp.com/*'],
  runAt: 'document_idle',
  main() {
    console.log('[ChronoWA Pro] Content Script active on WhatsApp Web.');

    // 1. Listen for background & popup communication
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('[ChronoWA Pro] Content received action:', request.action);

      if (request.action === 'GET_ACTIVE_CHAT') {
        const info = getActiveChatInfo();
        sendResponse(info);
        return true;
      }

      if (request.action === 'OPEN_DIRECT_CHAT') {
        // Handled via URL or background
        sendResponse({ success: true });
        return true;
      }

      if (request.action === 'TRIGGER_SEND_BUTTON') {
        handleTriggerSend(request.useHumanDelay, request.minJitter, request.maxJitter)
          .then(() => sendResponse({ success: true }))
          .catch((err) => sendResponse({ success: false, error: err.message }));
        return true;
      }

      if (request.action === 'DISPATCH_BY_CONTACT_NAME') {
        handleDirectNameDispatch(request.contactName, request.message, request.useHumanDelay)
          .then(() => sendResponse({ success: true }))
          .catch((err) => sendResponse({ success: false, error: err.message }));
        return true;
      }
    });

    // 2. Inject In-Chat Toolbar & Slash Snippet Expander
    initInChatUI();
    initSlashSnippetListener();
  },
});

/**
 * Extracts active chat contact name & header info
 */
function getActiveChatInfo(): { chatTitle: string; phone?: string } {
  const header = document.querySelector('header');
  if (!header) return { chatTitle: 'Active WhatsApp Chat' };

  const titleEl =
    header.querySelector('div[role="button"] span[title]') ||
    header.querySelector('span[dir="auto"]');
  const chatTitle = titleEl?.textContent?.trim() || 'Active WhatsApp Chat';

  return { chatTitle };
}

/**
 * Robust Send Click & Enter Key Simulation
 */
async function handleTriggerSend(useHumanDelay: boolean = true, minJitter = 1500, maxJitter = 3500) {
  if (useHumanDelay) {
    const jitter = Math.floor(Math.random() * (maxJitter - minJitter + 1)) + minJitter;
    console.log(`[ChronoWA Pro] Applying anti-ban typing jitter: ${jitter}ms`);
    await new Promise((r) => setTimeout(r, jitter));
  }

  // 1. Try finding send button
  const sendBtn = findSendButton();
  if (sendBtn) {
    console.log('[ChronoWA Pro] Found Send button, clicking...');
    sendBtn.click();
    return;
  }

  // 2. Fallback: Dispatch Enter key event
  const composeBox = findComposeBox();
  if (composeBox) {
    console.log('[ChronoWA Pro] Triggering Enter key event on compose box...');
    composeBox.focus();
    const eventParams = {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
    };
    composeBox.dispatchEvent(new KeyboardEvent('keydown', eventParams));
    composeBox.dispatchEvent(new KeyboardEvent('keypress', eventParams));
    composeBox.dispatchEvent(new KeyboardEvent('keyup', eventParams));
    return;
  }

  throw new Error('Unable to locate WhatsApp Web Send button or input field.');
}

/**
 * Search contact in sidebar, type message, and dispatch
 */
async function handleDirectNameDispatch(contactName: string, text: string, useHumanDelay: boolean = true) {
  const searchInput = (
    document.querySelector('div[contenteditable="true"][data-tab="3"]') ||
    document.querySelector('div[role="textbox"]')
  ) as HTMLElement;

  if (searchInput) {
    searchInput.focus();
    document.execCommand('insertText', false, contactName);
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 2000));

    // Click top search result
    const contactRow = document.querySelector('div[role="listitem"]') as HTMLElement;
    if (contactRow) {
      contactRow.click();
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  const composeBox = findComposeBox();
  if (!composeBox) {
    throw new Error('Chat compose box not found for message insertion.');
  }

  composeBox.focus();
  document.execCommand('insertText', false, text);
  composeBox.dispatchEvent(new Event('input', { bubbles: true }));

  await handleTriggerSend(useHumanDelay);
}

/**
 * Find Send Button across WhatsApp Web updates
 */
function findSendButton(): HTMLElement | null {
  const selectors = [
    'button[aria-label="Send"]',
    'button[data-testid="send"]',
    'button[data-tab="11"]',
    'span[data-icon="send"]',
    'footer button span[data-icon="send"]',
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      return (el.closest('button') as HTMLElement) || (el as HTMLElement);
    }
  }
  return null;
}

/**
 * Find WhatsApp Web Compose Box
 */
function findComposeBox(): HTMLElement | null {
  const selectors = [
    'footer div[contenteditable="true"]',
    'div[data-testid="conversation-compose-box-input"]',
    'div[role="textbox"][contenteditable="true"]',
    'footer div[role="textbox"]',
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      return el as HTMLElement;
    }
  }
  return null;
}

/**
 * Injects In-Chat Multi-Tool Bar (Schedule + Remind Me + Snippets)
 */
function initInChatUI() {
  const observer = new MutationObserver(() => {
    const footer = document.querySelector('footer');
    if (!footer || document.getElementById('chronowa-toolbar-group')) return;

    const inputRow = footer.querySelector('div[contenteditable="true"]')?.parentElement?.parentElement;
    if (!inputRow) return;

    const container = document.createElement('div');
    container.id = 'chronowa-toolbar-group';
    container.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin: 0 4px;
      z-index: 100;
    `;

    // 1. Schedule Button
    const schedBtn = document.createElement('button');
    schedBtn.title = 'Schedule Message (ChronoWA)';
    schedBtn.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #2563EB;
      color: #CCFF00;
      border: 1px solid rgba(204, 255, 0, 0.35);
      border-radius: 8px;
      padding: 5px 9px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 700;
      box-shadow: 0 0 10px rgba(37, 99, 235, 0.4);
      transition: all 0.2s ease;
    `;
    schedBtn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      Schedule
    `;
    schedBtn.onclick = (e) => {
      e.preventDefault();
      openInChatScheduleModal();
    };

    // 2. Follow-Up Reminder Button
    const remindBtn = document.createElement('button');
    remindBtn.title = 'Set Follow-Up Reminder for this chat';
    remindBtn.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #0F121A;
      color: #60A5FA;
      border: 1px solid rgba(96, 165, 250, 0.3);
      border-radius: 8px;
      padding: 5px 8px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      transition: all 0.2s ease;
    `;
    remindBtn.innerHTML = `⏰ Remind`;
    remindBtn.onclick = (e) => {
      e.preventDefault();
      openInChatReminderModal();
    };

    // 3. Snippets Quick Button
    const snipBtn = document.createElement('button');
    snipBtn.title = 'Insert Quick Template Snippet';
    snipBtn.style.cssText = `
      display: inline-flex;
      align-items: center;
      background: #0F121A;
      color: #94A3B8;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 5px 8px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      transition: all 0.2s ease;
    `;
    snipBtn.innerHTML = `📝 /snip`;
    snipBtn.onclick = (e) => {
      e.preventDefault();
      openInChatSnippetsMenu(snipBtn);
    };

    container.appendChild(schedBtn);
    container.appendChild(remindBtn);
    container.appendChild(snipBtn);
    inputRow.appendChild(container);
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Listens for user typing "/shortcut" in compose box to show floating suggestion
 */
function initSlashSnippetListener() {
  document.addEventListener('input', async (e) => {
    const target = e.target as HTMLElement;
    if (!target || !target.isContentEditable) return;

    const text = target.textContent || '';
    if (text.startsWith('/')) {
      const snippets = await getQuickSnippets();
      const match = snippets.find((s) => s.shortcut.toLowerCase() === text.trim().toLowerCase());
      if (match) {
        showSlashTriggerBadge(target, match);
      }
    } else {
      removeSlashBadge();
    }
  });
}

function showSlashTriggerBadge(composeEl: HTMLElement, snippet: QuickSnippet) {
  removeSlashBadge();
  const badge = document.createElement('div');
  badge.id = 'chronowa-slash-badge';
  badge.style.cssText = `
    position: absolute;
    bottom: 55px;
    left: 80px;
    background: #0F121A;
    border: 1px solid #CCFF00;
    box-shadow: 0 0 16px rgba(204, 255, 0, 0.35);
    border-radius: 10px;
    padding: 8px 12px;
    color: #FFFFFF;
    font-size: 11px;
    z-index: 9999;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  badge.innerHTML = `
    <span style="color:#CCFF00; font-weight:bold;">${snippet.shortcut}</span>: 
    <span style="color:#94A3B8;">${snippet.title}</span>
    <span style="background:#2563EB; color:white; padding:2px 6px; border-radius:6px; font-size:10px;">Press Enter / Click to Expand</span>
  `;

  badge.onclick = () => {
    composeEl.focus();
    document.execCommand('selectAll', false);
    document.execCommand('insertText', false, snippet.content);
    removeSlashBadge();
  };

  document.body.appendChild(badge);
}

function removeSlashBadge() {
  document.getElementById('chronowa-slash-badge')?.remove();
}

/**
 * Open Quick Snippets menu in chat
 */
async function openInChatSnippetsMenu(anchorEl: HTMLElement) {
  document.getElementById('chronowa-snippets-menu')?.remove();

  const snippets = await getQuickSnippets();
  const rect = anchorEl.getBoundingClientRect();

  const menu = document.createElement('div');
  menu.id = 'chronowa-snippets-menu';
  menu.style.cssText = `
    position: fixed;
    bottom: ${window.innerHeight - rect.top + 8}px;
    right: 20px;
    background: #0F121A;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.8);
    width: 280px;
    max-height: 320px;
    overflow-y: auto;
    z-index: 99999;
    padding: 8px;
  `;

  menu.innerHTML = `
    <div style="font-size:11px; font-weight:bold; color:#60A5FA; padding:4px 8px; border-bottom:1px solid rgba(255,255,255,0.08); margin-bottom:6px; display:flex; justify-content:space-between;">
      <span>⚡ QUICK SNIPPETS</span>
      <span style="color:#94A3B8; cursor:pointer;" id="close-snip-menu">✕</span>
    </div>
    ${snippets
      .map(
        (s) => `
      <div class="chrono-snip-item" data-id="${s.id}" style="padding:6px 8px; border-radius:8px; cursor:pointer; margin-bottom:4px; background:#151924; transition:background 0.2s;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="color:#CCFF00; font-family:monospace; font-weight:bold; font-size:11px;">${s.shortcut}</span>
          <span style="color:#94A3B8; font-size:10px;">${s.title}</span>
        </div>
        <div style="color:#CBD5E1; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px;">
          ${s.content}
        </div>
      </div>
    `
      )
      .join('')}
  `;

  document.body.appendChild(menu);

  menu.querySelector('#close-snip-menu')?.addEventListener('click', () => menu.remove());

  menu.querySelectorAll('.chrono-snip-item').forEach((item) => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-id');
      const found = snippets.find((s) => s.id === id);
      if (found) {
        const box = findComposeBox();
        if (box) {
          box.focus();
          document.execCommand('insertText', false, found.content);
        }
      }
      menu.remove();
    });
  });

  const closeDocListener = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node) && e.target !== anchorEl) {
      menu.remove();
      document.removeEventListener('click', closeDocListener);
    }
  };
  setTimeout(() => document.addEventListener('click', closeDocListener), 50);
}

/**
 * Creates and displays an In-Page Floating Modal for Follow-Up Reminders
 */
function openInChatReminderModal() {
  if (document.getElementById('chronowa-reminder-backdrop')) return;
  const chatInfo = getActiveChatInfo();

  const backdrop = document.createElement('div');
  backdrop.id = 'chronowa-reminder-backdrop';
  backdrop.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: #0F121A;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    width: 360px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.8);
    padding: 18px;
    color: #E2E8F0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  modal.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:16px;">⏰</span>
        <div style="font-weight:700; font-size:13px; color:#FFFFFF;">Set Follow-Up Reminder</div>
      </div>
      <button id="close-remind-modal" style="background:transparent; border:none; color:#64748B; font-size:18px; cursor:pointer;">✕</button>
    </div>

    <div style="font-size:11px; color:#94A3B8; margin-bottom:10px;">
      Target: <span style="color:#60A5FA; font-weight:600;">${chatInfo.chatTitle}</span>
    </div>

    <!-- Quick Hours -->
    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px; margin-bottom:12px;">
      <button id="remind-1h" type="button" style="background:#151924; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:6px; color:#E2E8F0; font-size:11px; cursor:pointer;">In 1 Hour</button>
      <button id="remind-2h" type="button" style="background:#151924; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:6px; color:#E2E8F0; font-size:11px; cursor:pointer;">In 2 Hours</button>
      <button id="remind-tomorrow" type="button" style="background:#151924; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:6px; color:#CCFF00; font-size:11px; cursor:pointer;">Tomorrow 10 AM</button>
    </div>

    <!-- Reminder Note -->
    <div style="margin-bottom:14px;">
      <label style="display:block; font-size:10px; color:#94A3B8; margin-bottom:4px;">NOTE / PURPOSE</label>
      <input id="remind-note" type="text" value="Follow up regarding pending conversation" style="width:100%; box-sizing:border-box; background:#151924; border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px 10px; color:#FFFFFF; font-size:12px;" />
    </div>

    <button id="remind-save-btn" type="button" style="width:100%; background:#2563EB; color:#FFFFFF; font-weight:bold; border:none; border-radius:10px; padding:10px; font-size:12px; cursor:pointer;">
      Save Follow-Up Reminder
    </button>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  let targetEpoch = Date.now() + 60 * 60 * 1000;

  modal.querySelector('#close-remind-modal')?.addEventListener('click', () => backdrop.remove());
  modal.querySelector('#remind-1h')?.addEventListener('click', () => {
    targetEpoch = Date.now() + 60 * 60 * 1000;
    alert('Selected: In 1 Hour');
  });
  modal.querySelector('#remind-2h')?.addEventListener('click', () => {
    targetEpoch = Date.now() + 120 * 60 * 1000;
    alert('Selected: In 2 Hours');
  });
  modal.querySelector('#remind-tomorrow')?.addEventListener('click', () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    targetEpoch = d.getTime();
    alert('Selected: Tomorrow at 10:00 AM');
  });

  modal.querySelector('#remind-save-btn')?.addEventListener('click', async () => {
    const note = (modal.querySelector('#remind-note') as HTMLInputElement).value;
    const reminder: FollowUpReminder = {
      id: 'rem_' + Date.now(),
      chatTitle: chatInfo.chatTitle,
      note,
      remindAt: targetEpoch,
      status: 'pending',
      createdAt: Date.now(),
    };
    await saveFollowUpReminder(reminder);
    alert(`✓ Reminder saved! You will receive a desktop alert at ${new Date(targetEpoch).toLocaleTimeString()}.`);
    backdrop.remove();
  });
}

/**
 * Creates and displays an In-Page Floating Modal for Scheduling directly inside WhatsApp Web
 */
function openInChatScheduleModal() {
  if (document.getElementById('chronowa-modal-backdrop')) return;

  const chatInfo = getActiveChatInfo();

  const backdrop = document.createElement('div');
  backdrop.id = 'chronowa-modal-backdrop';
  backdrop.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: #0F121A;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    width: 400px;
    max-width: 90vw;
    box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 30px rgba(37,99,235,0.25);
    padding: 20px;
    color: #E2E8F0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

  modal.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <div style="width:28px; height:28px; border-radius:8px; background:#2563EB; display:flex; align-items:center; justify-content:center; color:#CCFF00; font-weight:bold;">
          ⚡
        </div>
        <div>
          <div style="font-weight:700; font-size:14px; color:#FFFFFF;">ChronoWA Scheduler</div>
          <div style="font-size:11px; color:#94A3B8;">Target: <span style="color:#60A5FA; font-weight:600;">${chatInfo.chatTitle}</span></div>
        </div>
      </div>
      <button id="chronowa-close-btn" style="background:transparent; border:none; color:#64748B; font-size:18px; cursor:pointer;">✕</button>
    </div>

    <!-- Quick Presets -->
    <div style="margin-bottom:14px;">
      <div style="font-size:11px; font-weight:600; color:#94A3B8; margin-bottom:6px;">QUICK TRIGGER PRESETS</div>
      <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px;">
        <button id="chrono-btn-2h" type="button" style="background:#151924; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:6px; color:#E2E8F0; font-size:11px; cursor:pointer;">⏱️ In 2 Hours</button>
        <button id="chrono-btn-midnight" type="button" style="background:#151924; border:1px solid rgba(204,255,0,0.3); border-radius:8px; padding:6px; color:#CCFF00; font-weight:bold; font-size:11px; cursor:pointer;">🌙 12:00 AM</button>
        <button id="chrono-btn-1h" type="button" style="background:#151924; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:6px; color:#E2E8F0; font-size:11px; cursor:pointer;">⏱️ In 1 Hour</button>
      </div>
    </div>

    <!-- Date & Time Picker -->
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:12px;">
      <div>
        <label style="display:block; font-size:10px; color:#94A3B8; margin-bottom:4px;">DATE</label>
        <input id="chronowa-modal-date" type="date" value="${new Date().toISOString().split('T')[0]}" style="width:100%; box-sizing:border-box; background:#151924; border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:6px 10px; color:#FFFFFF; font-size:12px;" />
      </div>
      <div>
        <label style="display:block; font-size:10px; color:#94A3B8; margin-bottom:4px;">TIME (24h)</label>
        <input id="chronowa-modal-time" type="time" value="00:00" style="width:100%; box-sizing:border-box; background:#151924; border:1px solid rgba(204,255,0,0.3); border-radius:8px; padding:6px 10px; color:#CCFF00; font-weight:bold; font-size:12px; font-family:monospace;" />
      </div>
    </div>

    <!-- Message Content -->
    <div style="margin-bottom:14px;">
      <label style="display:block; font-size:10px; color:#94A3B8; margin-bottom:4px;">MESSAGE</label>
      <textarea id="chronowa-modal-msg" rows="3" style="width:100%; box-sizing:border-box; background:#151924; border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px 10px; color:#FFFFFF; font-size:12px; resize:none;">Happy Birthday! 🎂🎉 Wishing you massive success and joy!</textarea>
    </div>

    <!-- Submit CTA -->
    <button id="chronowa-modal-submit" type="button" style="width:100%; background:#2563EB; color:#FFFFFF; font-weight:bold; border:none; border-radius:10px; padding:10px; font-size:12px; cursor:pointer; box-shadow:0 0 15px rgba(37,99,235,0.4); display:flex; align-items:center; justify-content:center; gap:6px;">
      <span style="color:#CCFF00;">✓</span> Schedule for Dispatch
    </button>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  const closeModal = () => backdrop.remove();
  modal.querySelector('#chronowa-close-btn')?.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  modal.querySelector('#chrono-btn-midnight')?.addEventListener('click', () => {
    (modal.querySelector('#chronowa-modal-time') as HTMLInputElement).value = '00:00';
    (modal.querySelector('#chronowa-modal-date') as HTMLInputElement).value = tomorrowDateStr;
  });

  modal.querySelector('#chrono-btn-2h')?.addEventListener('click', () => {
    const future = new Date(Date.now() + 120 * 60 * 1000);
    (modal.querySelector('#chronowa-modal-date') as HTMLInputElement).value = future.toISOString().split('T')[0];
    const h = String(future.getHours()).padStart(2, '0');
    const m = String(future.getMinutes()).padStart(2, '0');
    (modal.querySelector('#chronowa-modal-time') as HTMLInputElement).value = `${h}:${m}`;
  });

  modal.querySelector('#chrono-btn-1h')?.addEventListener('click', () => {
    const future = new Date(Date.now() + 60 * 60 * 1000);
    (modal.querySelector('#chronowa-modal-date') as HTMLInputElement).value = future.toISOString().split('T')[0];
    const h = String(future.getHours()).padStart(2, '0');
    const m = String(future.getMinutes()).padStart(2, '0');
    (modal.querySelector('#chronowa-modal-time') as HTMLInputElement).value = `${h}:${m}`;
  });

  modal.querySelector('#chronowa-modal-submit')?.addEventListener('click', async () => {
    const dateVal = (modal.querySelector('#chronowa-modal-date') as HTMLInputElement).value;
    const timeVal = (modal.querySelector('#chronowa-modal-time') as HTMLInputElement).value;
    const msgVal = (modal.querySelector('#chronowa-modal-msg') as HTMLTextAreaElement).value.trim();

    if (!msgVal) {
      alert('Please enter a message.');
      return;
    }

    const scheduledEpoch = new Date(`${dateVal}T${timeVal}:00`).getTime();
    if (isNaN(scheduledEpoch) || scheduledEpoch <= Date.now()) {
      alert('Please select a future date and time!');
      return;
    }

    const newMsg: ScheduledMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      recipient: chatInfo.chatTitle,
      message: msgVal,
      scheduledTime: scheduledEpoch,
      status: 'pending',
      createdAt: Date.now(),
      useHumanDelay: true,
    };

    await saveScheduledMessage(newMsg);
    alert(`✓ ChronoWA: Message scheduled successfully for ${new Date(scheduledEpoch).toLocaleString()}!`);
    closeModal();
  });
}
