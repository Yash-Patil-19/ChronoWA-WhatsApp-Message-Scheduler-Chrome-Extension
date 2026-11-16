var content=(function(){"use strict";var ke=Object.defineProperty;var Ce=(P,v,k)=>v in P?ke(P,v,{enumerable:!0,configurable:!0,writable:!0,value:k}):P[v]=k;var F=(P,v,k)=>Ce(P,typeof v!="symbol"?v+"":v,k);function P(r){return r}const v="chronowa_scheduled_messages",k="chronowa_quick_snippets",z="chronowa_followup_reminders",q=[{id:"snip_upi",shortcut:"/upi",title:"UPI Payment Info",content:"You can transfer via UPI to: pay.chronowa@okaxis (Please share a screenshot once done! 👍)"},{id:"snip_address",shortcut:"/address",title:"Office Address",content:"Our location: Suite 402, Apex Towers, Innovation Hub, Tech City, 560100."},{id:"snip_pricing",shortcut:"/pricing",title:"Service Packages",content:"Thanks for reaching out! Packages: 1) Starter ($49), 2) Pro Growth ($120), 3) Custom Enterprise. Which fits best?"},{id:"snip_hello",shortcut:"/hello",title:"Friendly Welcome",content:"Hi {name}! 👋 Hope you are having a productive day. How can I assist you today?"}];async function ee(){try{return(await chrome.storage.local.get(v))[v]||[]}catch(r){return console.error("[ChronoWA] Failed to load messages:",r),[]}}async function te(r){const t=await ee(),e=[r,...t.filter(n=>n.id!==r.id)];if(await chrome.storage.local.set({[v]:e}),r.status==="pending"){const n=Math.max(.05,(r.scheduledTime-Date.now())/6e4);await chrome.alarms.create(r.id,{delayInMinutes:n}),console.log(`[ChronoWA] Alarm registered for ${r.id} in ${n.toFixed(2)} min.`)}}async function Y(){try{const t=(await chrome.storage.local.get(k))[k];return!t||t.length===0?(await chrome.storage.local.set({[k]:q}),q):t}catch(r){return console.error("[ChronoWA] Failed to get snippets:",r),q}}async function re(){try{return(await chrome.storage.local.get(z))[z]||[]}catch{return[]}}async function ne(r){const t=await re(),e=[r,...t.filter(n=>n.id!==r.id)];if(await chrome.storage.local.set({[z]:e}),r.status==="pending"){const n=Math.max(.05,(r.remindAt-Date.now())/6e4);await chrome.alarms.create(`reminder_${r.id}`,{delayInMinutes:n}),console.log(`[ChronoWA] Follow-up reminder alarm set for ${r.chatTitle} in ${n.toFixed(2)} min.`)}}const oe={matches:["*://web.whatsapp.com/*"],runAt:"document_idle",main(){console.log("[ChronoWA Pro] Content Script active on WhatsApp Web."),chrome.runtime.onMessage.addListener((r,t,e)=>{if(console.log("[ChronoWA Pro] Content received action:",r.action),r.action==="GET_ACTIVE_CHAT"){const n=H();return e(n),!0}if(r.action==="OPEN_DIRECT_CHAT")return e({success:!0}),!0;if(r.action==="TRIGGER_SEND_BUTTON")return Q(r.useHumanDelay,r.minJitter,r.maxJitter).then(()=>e({success:!0})).catch(n=>e({success:!1,error:n.message})),!0;if(r.action==="DISPATCH_BY_CONTACT_NAME")return se(r.contactName,r.message,r.useHumanDelay).then(()=>e({success:!0})).catch(n=>e({success:!1,error:n.message})),!0}),ae(),le()}};function H(){var n;const r=document.querySelector("header");if(!r)return{chatTitle:"Active WhatsApp Chat"};const t=r.querySelector('div[role="button"] span[title]')||r.querySelector('span[dir="auto"]');return{chatTitle:((n=t==null?void 0:t.textContent)==null?void 0:n.trim())||"Active WhatsApp Chat"}}async function Q(r=!0,t=1500,e=3500){if(r){const s=Math.floor(Math.random()*(e-t+1))+t;console.log(`[ChronoWA Pro] Applying anti-ban typing jitter: ${s}ms`),await new Promise(l=>setTimeout(l,s))}const n=ie();if(n){console.log("[ChronoWA Pro] Found Send button, clicking..."),n.click();return}const a=W();if(a){console.log("[ChronoWA Pro] Triggering Enter key event on compose box..."),a.focus();const s={key:"Enter",code:"Enter",keyCode:13,which:13,bubbles:!0,cancelable:!0};a.dispatchEvent(new KeyboardEvent("keydown",s)),a.dispatchEvent(new KeyboardEvent("keypress",s)),a.dispatchEvent(new KeyboardEvent("keyup",s));return}throw new Error("Unable to locate WhatsApp Web Send button or input field.")}async function se(r,t,e=!0){const n=document.querySelector('div[contenteditable="true"][data-tab="3"]')||document.querySelector('div[role="textbox"]');if(n){n.focus(),document.execCommand("insertText",!1,r),n.dispatchEvent(new Event("input",{bubbles:!0})),await new Promise(l=>setTimeout(l,2e3));const s=document.querySelector('div[role="listitem"]');s&&(s.click(),await new Promise(l=>setTimeout(l,1500)))}const a=W();if(!a)throw new Error("Chat compose box not found for message insertion.");a.focus(),document.execCommand("insertText",!1,t),a.dispatchEvent(new Event("input",{bubbles:!0})),await Q(e)}function ie(){const r=['button[aria-label="Send"]','button[data-testid="send"]','button[data-tab="11"]','span[data-icon="send"]','footer button span[data-icon="send"]'];for(const t of r){const e=document.querySelector(t);if(e)return e.closest("button")||e}return null}function W(){const r=['footer div[contenteditable="true"]','div[data-testid="conversation-compose-box-input"]','div[role="textbox"][contenteditable="true"]','footer div[role="textbox"]'];for(const t of r){const e=document.querySelector(t);if(e)return e}return null}function ae(){new MutationObserver(()=>{var g,f;const t=document.querySelector("footer");if(!t||document.getElementById("chronowa-toolbar-group"))return;const e=(f=(g=t.querySelector('div[contenteditable="true"]'))==null?void 0:g.parentElement)==null?void 0:f.parentElement;if(!e)return;const n=document.createElement("div");n.id="chronowa-toolbar-group",n.style.cssText=`
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin: 0 4px;
      z-index: 100;
    `;const a=document.createElement("button");a.title="Schedule Message (ChronoWA)",a.style.cssText=`
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
    `,a.innerHTML=`
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      Schedule
    `,a.onclick=u=>{u.preventDefault(),me()};const s=document.createElement("button");s.title="Set Follow-Up Reminder for this chat",s.style.cssText=`
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
    `,s.innerHTML="⏰ Remind",s.onclick=u=>{u.preventDefault(),ge()};const l=document.createElement("button");l.title="Insert Quick Template Snippet",l.style.cssText=`
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
    `,l.innerHTML="📝 /snip",l.onclick=u=>{u.preventDefault(),de(l)},n.appendChild(a),n.appendChild(s),n.appendChild(l),e.appendChild(n)}).observe(document.body,{childList:!0,subtree:!0})}function le(){document.addEventListener("input",async r=>{const t=r.target;if(!t||!t.isContentEditable)return;const e=t.textContent||"";if(e.startsWith("/")){const a=(await Y()).find(s=>s.shortcut.toLowerCase()===e.trim().toLowerCase());a&&ce(t,a)}else K()})}function ce(r,t){K();const e=document.createElement("div");e.id="chronowa-slash-badge",e.style.cssText=`
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
  `,e.innerHTML=`
    <span style="color:#CCFF00; font-weight:bold;">${t.shortcut}</span>: 
    <span style="color:#94A3B8;">${t.title}</span>
    <span style="background:#2563EB; color:white; padding:2px 6px; border-radius:6px; font-size:10px;">Press Enter / Click to Expand</span>
  `,e.onclick=()=>{r.focus(),document.execCommand("selectAll",!1),document.execCommand("insertText",!1,t.content),K()},document.body.appendChild(e)}function K(){var r;(r=document.getElementById("chronowa-slash-badge"))==null||r.remove()}async function de(r){var s,l;(s=document.getElementById("chronowa-snippets-menu"))==null||s.remove();const t=await Y(),e=r.getBoundingClientRect(),n=document.createElement("div");n.id="chronowa-snippets-menu",n.style.cssText=`
    position: fixed;
    bottom: ${window.innerHeight-e.top+8}px;
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
  `,n.innerHTML=`
    <div style="font-size:11px; font-weight:bold; color:#60A5FA; padding:4px 8px; border-bottom:1px solid rgba(255,255,255,0.08); margin-bottom:6px; display:flex; justify-content:space-between;">
      <span>⚡ QUICK SNIPPETS</span>
      <span style="color:#94A3B8; cursor:pointer;" id="close-snip-menu">✕</span>
    </div>
    ${t.map(g=>`
      <div class="chrono-snip-item" data-id="${g.id}" style="padding:6px 8px; border-radius:8px; cursor:pointer; margin-bottom:4px; background:#151924; transition:background 0.2s;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="color:#CCFF00; font-family:monospace; font-weight:bold; font-size:11px;">${g.shortcut}</span>
          <span style="color:#94A3B8; font-size:10px;">${g.title}</span>
        </div>
        <div style="color:#CBD5E1; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px;">
          ${g.content}
        </div>
      </div>
    `).join("")}
  `,document.body.appendChild(n),(l=n.querySelector("#close-snip-menu"))==null||l.addEventListener("click",()=>n.remove()),n.querySelectorAll(".chrono-snip-item").forEach(g=>{g.addEventListener("click",()=>{const f=g.getAttribute("data-id"),u=t.find(A=>A.id===f);if(u){const A=W();A&&(A.focus(),document.execCommand("insertText",!1,u.content))}n.remove()})});const a=g=>{!n.contains(g.target)&&g.target!==r&&(n.remove(),document.removeEventListener("click",a))};setTimeout(()=>document.addEventListener("click",a),50)}function ge(){var a,s,l,g,f;if(document.getElementById("chronowa-reminder-backdrop"))return;const r=H(),t=document.createElement("div");t.id="chronowa-reminder-backdrop",t.style.cssText=`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
  `;const e=document.createElement("div");e.style.cssText=`
    background: #0F121A;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    width: 360px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.8);
    padding: 18px;
    color: #E2E8F0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `,e.innerHTML=`
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:16px;">⏰</span>
        <div style="font-weight:700; font-size:13px; color:#FFFFFF;">Set Follow-Up Reminder</div>
      </div>
      <button id="close-remind-modal" style="background:transparent; border:none; color:#64748B; font-size:18px; cursor:pointer;">✕</button>
    </div>

    <div style="font-size:11px; color:#94A3B8; margin-bottom:10px;">
      Target: <span style="color:#60A5FA; font-weight:600;">${r.chatTitle}</span>
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
  `,t.appendChild(e),document.body.appendChild(t);let n=Date.now()+3600*1e3;(a=e.querySelector("#close-remind-modal"))==null||a.addEventListener("click",()=>t.remove()),(s=e.querySelector("#remind-1h"))==null||s.addEventListener("click",()=>{n=Date.now()+36e5,alert("Selected: In 1 Hour")}),(l=e.querySelector("#remind-2h"))==null||l.addEventListener("click",()=>{n=Date.now()+72e5,alert("Selected: In 2 Hours")}),(g=e.querySelector("#remind-tomorrow"))==null||g.addEventListener("click",()=>{const u=new Date;u.setDate(u.getDate()+1),u.setHours(10,0,0,0),n=u.getTime(),alert("Selected: Tomorrow at 10:00 AM")}),(f=e.querySelector("#remind-save-btn"))==null||f.addEventListener("click",async()=>{const u=e.querySelector("#remind-note").value,A={id:"rem_"+Date.now(),chatTitle:r.chatTitle,note:u,remindAt:n,status:"pending",createdAt:Date.now()};await ne(A),alert(`✓ Reminder saved! You will receive a desktop alert at ${new Date(n).toLocaleTimeString()}.`),t.remove()})}function me(){var l,g,f,u,A;if(document.getElementById("chronowa-modal-backdrop"))return;const r=H(),t=document.createElement("div");t.id="chronowa-modal-backdrop",t.style.cssText=`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
  `;const e=document.createElement("div");e.style.cssText=`
    background: #0F121A;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    width: 400px;
    max-width: 90vw;
    box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 30px rgba(37,99,235,0.25);
    padding: 20px;
    color: #E2E8F0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;const n=new Date;n.setDate(n.getDate()+1);const a=n.toISOString().split("T")[0];e.innerHTML=`
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <div style="width:28px; height:28px; border-radius:8px; background:#2563EB; display:flex; align-items:center; justify-content:center; color:#CCFF00; font-weight:bold;">
          ⚡
        </div>
        <div>
          <div style="font-weight:700; font-size:14px; color:#FFFFFF;">ChronoWA Scheduler</div>
          <div style="font-size:11px; color:#94A3B8;">Target: <span style="color:#60A5FA; font-weight:600;">${r.chatTitle}</span></div>
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
        <input id="chronowa-modal-date" type="date" value="${new Date().toISOString().split("T")[0]}" style="width:100%; box-sizing:border-box; background:#151924; border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:6px 10px; color:#FFFFFF; font-size:12px;" />
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
  `,t.appendChild(e),document.body.appendChild(t);const s=()=>t.remove();(l=e.querySelector("#chronowa-close-btn"))==null||l.addEventListener("click",s),t.addEventListener("click",b=>{b.target===t&&s()}),(g=e.querySelector("#chrono-btn-midnight"))==null||g.addEventListener("click",()=>{e.querySelector("#chronowa-modal-time").value="00:00",e.querySelector("#chronowa-modal-date").value=a}),(f=e.querySelector("#chrono-btn-2h"))==null||f.addEventListener("click",()=>{const b=new Date(Date.now()+72e5);e.querySelector("#chronowa-modal-date").value=b.toISOString().split("T")[0];const C=String(b.getHours()).padStart(2,"0"),S=String(b.getMinutes()).padStart(2,"0");e.querySelector("#chronowa-modal-time").value=`${C}:${S}`}),(u=e.querySelector("#chrono-btn-1h"))==null||u.addEventListener("click",()=>{const b=new Date(Date.now()+36e5);e.querySelector("#chronowa-modal-date").value=b.toISOString().split("T")[0];const C=String(b.getHours()).padStart(2,"0"),S=String(b.getMinutes()).padStart(2,"0");e.querySelector("#chronowa-modal-time").value=`${C}:${S}`}),(A=e.querySelector("#chronowa-modal-submit"))==null||A.addEventListener("click",async()=>{const b=e.querySelector("#chronowa-modal-date").value,C=e.querySelector("#chronowa-modal-time").value,S=e.querySelector("#chronowa-modal-msg").value.trim();if(!S){alert("Please enter a message.");return}const T=new Date(`${b}T${C}:00`).getTime();if(isNaN(T)||T<=Date.now()){alert("Please select a future date and time!");return}const _={id:"msg_"+Date.now()+"_"+Math.random().toString(36).substr(2,5),recipient:r.chatTitle,message:S,scheduledTime:T,status:"pending",createdAt:Date.now(),useHumanDelay:!0};await te(_),alert(`✓ ChronoWA: Message scheduled successfully for ${new Date(T).toLocaleString()}!`),s()})}function ue(r){return r&&r.__esModule&&Object.prototype.hasOwnProperty.call(r,"default")?r.default:r}var D={exports:{}},pe=D.exports,Z;function xe(){return Z||(Z=1,(function(r,t){(function(e,n){n(r)})(typeof globalThis<"u"?globalThis:typeof self<"u"?self:pe,function(e){if(!(globalThis.chrome&&globalThis.chrome.runtime&&globalThis.chrome.runtime.id))throw new Error("This script should only be loaded in a browser extension.");if(globalThis.browser&&globalThis.browser.runtime&&globalThis.browser.runtime.id)e.exports=globalThis.browser;else{const n="The message port closed before a response was received.",a=s=>{const l={alarms:{clear:{minArgs:0,maxArgs:1},clearAll:{minArgs:0,maxArgs:0},get:{minArgs:0,maxArgs:1},getAll:{minArgs:0,maxArgs:0}},bookmarks:{create:{minArgs:1,maxArgs:1},get:{minArgs:1,maxArgs:1},getChildren:{minArgs:1,maxArgs:1},getRecent:{minArgs:1,maxArgs:1},getSubTree:{minArgs:1,maxArgs:1},getTree:{minArgs:0,maxArgs:0},move:{minArgs:2,maxArgs:2},remove:{minArgs:1,maxArgs:1},removeTree:{minArgs:1,maxArgs:1},search:{minArgs:1,maxArgs:1},update:{minArgs:2,maxArgs:2}},browserAction:{disable:{minArgs:0,maxArgs:1,fallbackToNoCallback:!0},enable:{minArgs:0,maxArgs:1,fallbackToNoCallback:!0},getBadgeBackgroundColor:{minArgs:1,maxArgs:1},getBadgeText:{minArgs:1,maxArgs:1},getPopup:{minArgs:1,maxArgs:1},getTitle:{minArgs:1,maxArgs:1},openPopup:{minArgs:0,maxArgs:0},setBadgeBackgroundColor:{minArgs:1,maxArgs:1,fallbackToNoCallback:!0},setBadgeText:{minArgs:1,maxArgs:1,fallbackToNoCallback:!0},setIcon:{minArgs:1,maxArgs:1},setPopup:{minArgs:1,maxArgs:1,fallbackToNoCallback:!0},setTitle:{minArgs:1,maxArgs:1,fallbackToNoCallback:!0}},browsingData:{remove:{minArgs:2,maxArgs:2},removeCache:{minArgs:1,maxArgs:1},removeCookies:{minArgs:1,maxArgs:1},removeDownloads:{minArgs:1,maxArgs:1},removeFormData:{minArgs:1,maxArgs:1},removeHistory:{minArgs:1,maxArgs:1},removeLocalStorage:{minArgs:1,maxArgs:1},removePasswords:{minArgs:1,maxArgs:1},removePluginData:{minArgs:1,maxArgs:1},settings:{minArgs:0,maxArgs:0}},commands:{getAll:{minArgs:0,maxArgs:0}},contextMenus:{remove:{minArgs:1,maxArgs:1},removeAll:{minArgs:0,maxArgs:0},update:{minArgs:2,maxArgs:2}},cookies:{get:{minArgs:1,maxArgs:1},getAll:{minArgs:1,maxArgs:1},getAllCookieStores:{minArgs:0,maxArgs:0},remove:{minArgs:1,maxArgs:1},set:{minArgs:1,maxArgs:1}},devtools:{inspectedWindow:{eval:{minArgs:1,maxArgs:2,singleCallbackArg:!1}},panels:{create:{minArgs:3,maxArgs:3,singleCallbackArg:!0},elements:{createSidebarPane:{minArgs:1,maxArgs:1}}}},downloads:{cancel:{minArgs:1,maxArgs:1},download:{minArgs:1,maxArgs:1},erase:{minArgs:1,maxArgs:1},getFileIcon:{minArgs:1,maxArgs:2},open:{minArgs:1,maxArgs:1,fallbackToNoCallback:!0},pause:{minArgs:1,maxArgs:1},removeFile:{minArgs:1,maxArgs:1},resume:{minArgs:1,maxArgs:1},search:{minArgs:1,maxArgs:1},show:{minArgs:1,maxArgs:1,fallbackToNoCallback:!0}},extension:{isAllowedFileSchemeAccess:{minArgs:0,maxArgs:0},isAllowedIncognitoAccess:{minArgs:0,maxArgs:0}},history:{addUrl:{minArgs:1,maxArgs:1},deleteAll:{minArgs:0,maxArgs:0},deleteRange:{minArgs:1,maxArgs:1},deleteUrl:{minArgs:1,maxArgs:1},getVisits:{minArgs:1,maxArgs:1},search:{minArgs:1,maxArgs:1}},i18n:{detectLanguage:{minArgs:1,maxArgs:1},getAcceptLanguages:{minArgs:0,maxArgs:0}},identity:{launchWebAuthFlow:{minArgs:1,maxArgs:1}},idle:{queryState:{minArgs:1,maxArgs:1}},management:{get:{minArgs:1,maxArgs:1},getAll:{minArgs:0,maxArgs:0},getSelf:{minArgs:0,maxArgs:0},setEnabled:{minArgs:2,maxArgs:2},uninstallSelf:{minArgs:0,maxArgs:1}},notifications:{clear:{minArgs:1,maxArgs:1},create:{minArgs:1,maxArgs:2},getAll:{minArgs:0,maxArgs:0},getPermissionLevel:{minArgs:0,maxArgs:0},update:{minArgs:2,maxArgs:2}},pageAction:{getPopup:{minArgs:1,maxArgs:1},getTitle:{minArgs:1,maxArgs:1},hide:{minArgs:1,maxArgs:1,fallbackToNoCallback:!0},setIcon:{minArgs:1,maxArgs:1},setPopup:{minArgs:1,maxArgs:1,fallbackToNoCallback:!0},setTitle:{minArgs:1,maxArgs:1,fallbackToNoCallback:!0},show:{minArgs:1,maxArgs:1,fallbackToNoCallback:!0}},permissions:{contains:{minArgs:1,maxArgs:1},getAll:{minArgs:0,maxArgs:0},remove:{minArgs:1,maxArgs:1},request:{minArgs:1,maxArgs:1}},runtime:{getBackgroundPage:{minArgs:0,maxArgs:0},getPlatformInfo:{minArgs:0,maxArgs:0},openOptionsPage:{minArgs:0,maxArgs:0},requestUpdateCheck:{minArgs:0,maxArgs:0},sendMessage:{minArgs:1,maxArgs:3},sendNativeMessage:{minArgs:2,maxArgs:2},setUninstallURL:{minArgs:1,maxArgs:1}},sessions:{getDevices:{minArgs:0,maxArgs:1},getRecentlyClosed:{minArgs:0,maxArgs:1},restore:{minArgs:0,maxArgs:1}},storage:{local:{clear:{minArgs:0,maxArgs:0},get:{minArgs:0,maxArgs:1},getBytesInUse:{minArgs:0,maxArgs:1},remove:{minArgs:1,maxArgs:1},set:{minArgs:1,maxArgs:1}},managed:{get:{minArgs:0,maxArgs:1},getBytesInUse:{minArgs:0,maxArgs:1}},sync:{clear:{minArgs:0,maxArgs:0},get:{minArgs:0,maxArgs:1},getBytesInUse:{minArgs:0,maxArgs:1},remove:{minArgs:1,maxArgs:1},set:{minArgs:1,maxArgs:1}}},tabs:{captureVisibleTab:{minArgs:0,maxArgs:2},create:{minArgs:1,maxArgs:1},detectLanguage:{minArgs:0,maxArgs:1},discard:{minArgs:0,maxArgs:1},duplicate:{minArgs:1,maxArgs:1},executeScript:{minArgs:1,maxArgs:2},get:{minArgs:1,maxArgs:1},getCurrent:{minArgs:0,maxArgs:0},getZoom:{minArgs:0,maxArgs:1},getZoomSettings:{minArgs:0,maxArgs:1},goBack:{minArgs:0,maxArgs:1},goForward:{minArgs:0,maxArgs:1},highlight:{minArgs:1,maxArgs:1},insertCSS:{minArgs:1,maxArgs:2},move:{minArgs:2,maxArgs:2},query:{minArgs:1,maxArgs:1},reload:{minArgs:0,maxArgs:2},remove:{minArgs:1,maxArgs:1},removeCSS:{minArgs:1,maxArgs:2},sendMessage:{minArgs:2,maxArgs:3},setZoom:{minArgs:1,maxArgs:2},setZoomSettings:{minArgs:1,maxArgs:2},update:{minArgs:1,maxArgs:2}},topSites:{get:{minArgs:0,maxArgs:0}},webNavigation:{getAllFrames:{minArgs:1,maxArgs:1},getFrame:{minArgs:1,maxArgs:1}},webRequest:{handlerBehaviorChanged:{minArgs:0,maxArgs:0}},windows:{create:{minArgs:0,maxArgs:1},get:{minArgs:1,maxArgs:2},getAll:{minArgs:0,maxArgs:1},getCurrent:{minArgs:0,maxArgs:1},getLastFocused:{minArgs:0,maxArgs:1},remove:{minArgs:1,maxArgs:1},update:{minArgs:2,maxArgs:2}}};if(Object.keys(l).length===0)throw new Error("api-metadata.json has not been included in browser-polyfill");class g extends WeakMap{constructor(i,d=void 0){super(d),this.createItem=i}get(i){return this.has(i)||this.set(i,this.createItem(i)),super.get(i)}}const f=o=>o&&typeof o=="object"&&typeof o.then=="function",u=(o,i)=>(...d)=>{s.runtime.lastError?o.reject(new Error(s.runtime.lastError.message)):i.singleCallbackArg||d.length<=1&&i.singleCallbackArg!==!1?o.resolve(d[0]):o.resolve(d)},A=o=>o==1?"argument":"arguments",b=(o,i)=>function(m,...x){if(x.length<i.minArgs)throw new Error(`Expected at least ${i.minArgs} ${A(i.minArgs)} for ${o}(), got ${x.length}`);if(x.length>i.maxArgs)throw new Error(`Expected at most ${i.maxArgs} ${A(i.maxArgs)} for ${o}(), got ${x.length}`);return new Promise((h,y)=>{if(i.fallbackToNoCallback)try{m[o](...x,u({resolve:h,reject:y},i))}catch(c){console.warn(`${o} API method doesn't seem to support the callback parameter, falling back to call it without a callback: `,c),m[o](...x),i.fallbackToNoCallback=!1,i.noCallback=!0,h()}else i.noCallback?(m[o](...x),h()):m[o](...x,u({resolve:h,reject:y},i))})},C=(o,i,d)=>new Proxy(i,{apply(m,x,h){return d.call(x,o,...h)}});let S=Function.call.bind(Object.prototype.hasOwnProperty);const T=(o,i={},d={})=>{let m=Object.create(null),x={has(y,c){return c in o||c in m},get(y,c,w){if(c in m)return m[c];if(!(c in o))return;let p=o[c];if(typeof p=="function")if(typeof i[c]=="function")p=C(o,o[c],i[c]);else if(S(d,c)){let I=b(c,d[c]);p=C(o,o[c],I)}else p=p.bind(o);else if(typeof p=="object"&&p!==null&&(S(i,c)||S(d,c)))p=T(p,i[c],d[c]);else if(S(d,"*"))p=T(p,i[c],d["*"]);else return Object.defineProperty(m,c,{configurable:!0,enumerable:!0,get(){return o[c]},set(I){o[c]=I}}),p;return m[c]=p,p},set(y,c,w,p){return c in m?m[c]=w:o[c]=w,!0},defineProperty(y,c,w){return Reflect.defineProperty(m,c,w)},deleteProperty(y,c){return Reflect.deleteProperty(m,c)}},h=Object.create(o);return new Proxy(h,x)},_=o=>({addListener(i,d,...m){i.addListener(o.get(d),...m)},hasListener(i,d){return i.hasListener(o.get(d))},removeListener(i,d){i.removeListener(o.get(d))}}),Se=new g(o=>typeof o!="function"?o:function(d){const m=T(d,{},{getContent:{minArgs:0,maxArgs:0}});o(m)}),J=new g(o=>typeof o!="function"?o:function(d,m,x){let h=!1,y,c=new Promise(B=>{y=function(E){h=!0,B(E)}}),w;try{w=o(d,m,y)}catch(B){w=Promise.reject(B)}const p=w!==!0&&f(w);if(w!==!0&&!p&&!h)return!1;const I=B=>{B.then(E=>{x(E)},E=>{let V;E&&(E instanceof Error||typeof E.message=="string")?V=E.message:V="An unexpected error occurred",x({__mozWebExtensionPolyfillReject__:!0,message:V})}).catch(E=>{console.error("Failed to send onMessage rejected reply",E)})};return I(p?w:c),!0}),Ee=({reject:o,resolve:i},d)=>{s.runtime.lastError?s.runtime.lastError.message===n?i():o(new Error(s.runtime.lastError.message)):d&&d.__mozWebExtensionPolyfillReject__?o(new Error(d.message)):i(d)},X=(o,i,d,...m)=>{if(m.length<i.minArgs)throw new Error(`Expected at least ${i.minArgs} ${A(i.minArgs)} for ${o}(), got ${m.length}`);if(m.length>i.maxArgs)throw new Error(`Expected at most ${i.maxArgs} ${A(i.maxArgs)} for ${o}(), got ${m.length}`);return new Promise((x,h)=>{const y=Ee.bind(null,{resolve:x,reject:h});m.push(y),d.sendMessage(...m)})},Te={devtools:{network:{onRequestFinished:_(Se)}},runtime:{onMessage:_(J),onMessageExternal:_(J),sendMessage:X.bind(null,"sendMessage",{minArgs:1,maxArgs:3})},tabs:{sendMessage:X.bind(null,"sendMessage",{minArgs:2,maxArgs:3})}},G={clear:{minArgs:1,maxArgs:1},get:{minArgs:1,maxArgs:1},set:{minArgs:1,maxArgs:1}};return l.privacy={network:{"*":G},services:{"*":G},websites:{"*":G}},T(s,Te,l)};e.exports=a(chrome)}})})(D)),D.exports}var Ae=xe();const L=ue(Ae);function $(r,...t){}const be={debug:(...r)=>$(console.debug,...r),log:(...r)=>$(console.log,...r),warn:(...r)=>$(console.warn,...r),error:(...r)=>$(console.error,...r)},R=class R extends Event{constructor(t,e){super(R.EVENT_NAME,{}),this.newUrl=t,this.oldUrl=e}};F(R,"EVENT_NAME",U("wxt:locationchange"));let O=R;function U(r){var t;return`${(t=L==null?void 0:L.runtime)==null?void 0:t.id}:content:${r}`}function he(r){let t,e;return{run(){t==null&&(e=new URL(location.href),t=r.setInterval(()=>{let n=new URL(location.href);n.href!==e.href&&(window.dispatchEvent(new O(n,e)),e=n)},1e3))}}}const M=class M{constructor(t,e){F(this,"isTopFrame",window.self===window.top);F(this,"abortController");F(this,"locationWatcher",he(this));F(this,"receivedMessageIds",new Set);this.contentScriptName=t,this.options=e,this.abortController=new AbortController,this.isTopFrame?(this.listenForNewerScripts({ignoreFirstEvent:!0}),this.stopOldScripts()):this.listenForNewerScripts()}get signal(){return this.abortController.signal}abort(t){return this.abortController.abort(t)}get isInvalid(){return L.runtime.id==null&&this.notifyInvalidated(),this.signal.aborted}get isValid(){return!this.isInvalid}onInvalidated(t){return this.signal.addEventListener("abort",t),()=>this.signal.removeEventListener("abort",t)}block(){return new Promise(()=>{})}setInterval(t,e){const n=setInterval(()=>{this.isValid&&t()},e);return this.onInvalidated(()=>clearInterval(n)),n}setTimeout(t,e){const n=setTimeout(()=>{this.isValid&&t()},e);return this.onInvalidated(()=>clearTimeout(n)),n}requestAnimationFrame(t){const e=requestAnimationFrame((...n)=>{this.isValid&&t(...n)});return this.onInvalidated(()=>cancelAnimationFrame(e)),e}requestIdleCallback(t,e){const n=requestIdleCallback((...a)=>{this.signal.aborted||t(...a)},e);return this.onInvalidated(()=>cancelIdleCallback(n)),n}addEventListener(t,e,n,a){var s;e==="wxt:locationchange"&&this.isValid&&this.locationWatcher.run(),(s=t.addEventListener)==null||s.call(t,e.startsWith("wxt:")?U(e):e,n,{...a,signal:this.signal})}notifyInvalidated(){this.abort("Content script context invalidated"),be.debug(`Content script "${this.contentScriptName}" context invalidated`)}stopOldScripts(){window.postMessage({type:M.SCRIPT_STARTED_MESSAGE_TYPE,contentScriptName:this.contentScriptName,messageId:Math.random().toString(36).slice(2)},"*")}verifyScriptStartedEvent(t){var s,l,g;const e=((s=t.data)==null?void 0:s.type)===M.SCRIPT_STARTED_MESSAGE_TYPE,n=((l=t.data)==null?void 0:l.contentScriptName)===this.contentScriptName,a=!this.receivedMessageIds.has((g=t.data)==null?void 0:g.messageId);return e&&n&&a}listenForNewerScripts(t){let e=!0;const n=a=>{if(this.verifyScriptStartedEvent(a)){this.receivedMessageIds.add(a.data.messageId);const s=e;if(e=!1,s&&(t!=null&&t.ignoreFirstEvent))return;this.notifyInvalidated()}};addEventListener("message",n),this.onInvalidated(()=>removeEventListener("message",n))}};F(M,"SCRIPT_STARTED_MESSAGE_TYPE",U("wxt:content-script-started"));let j=M;const fe=Symbol("null");let ye=0;class we extends Map{constructor(...t){super(),this._objectHashes=new WeakMap,this._symbolHashes=new Map,this._publicKeys=new Map;const[e]=t;if(e!=null){if(typeof e[Symbol.iterator]!="function")throw new TypeError(typeof e+" is not iterable (cannot read property Symbol(Symbol.iterator))");for(const[n,a]of e)this.set(n,a)}}_getPublicKeys(t,e=!1){if(!Array.isArray(t))throw new TypeError("The keys parameter must be an array");const n=this._getPrivateKey(t,e);let a;return n&&this._publicKeys.has(n)?a=this._publicKeys.get(n):e&&(a=[...t],this._publicKeys.set(n,a)),{privateKey:n,publicKey:a}}_getPrivateKey(t,e=!1){const n=[];for(const a of t){const s=a===null?fe:a;let l;if(typeof s=="object"||typeof s=="function"?l="_objectHashes":typeof s=="symbol"?l="_symbolHashes":l=!1,!l)n.push(s);else if(this[l].has(s))n.push(this[l].get(s));else if(e){const g=`@@mkm-ref-${ye++}@@`;this[l].set(s,g),n.push(g)}else return!1}return JSON.stringify(n)}set(t,e){const{publicKey:n}=this._getPublicKeys(t,!0);return super.set(n,e)}get(t){const{publicKey:e}=this._getPublicKeys(t);return super.get(e)}has(t){const{publicKey:e}=this._getPublicKeys(t);return super.has(e)}delete(t){const{publicKey:e,privateKey:n}=this._getPublicKeys(t);return!!(e&&super.delete(e)&&this._publicKeys.delete(n))}clear(){super.clear(),this._symbolHashes.clear(),this._publicKeys.clear()}get[Symbol.toStringTag](){return"ManyKeysMap"}get size(){return super.size}}new we;function Pe(){}function N(r,...t){}const ve={debug:(...r)=>N(console.debug,...r),log:(...r)=>N(console.log,...r),warn:(...r)=>N(console.warn,...r),error:(...r)=>N(console.error,...r)};return(async()=>{try{const{main:r,...t}=oe,e=new j("content",t);return await r(e)}catch(r){throw ve.error('The content script "content" crashed on startup!',r),r}})()})();
content;
