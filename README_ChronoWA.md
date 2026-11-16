<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Space+Grotesk&weight=700&size=34&duration=2600&pause=800&color=CCFF00&center=true&vCenter=true&width=850&lines=CHRONOWA;Schedule+it+now.+Send+it+on+time.;WhatsApp+message+scheduling%2C+made+simple." alt="ChronoWA animated heading" />

<p><strong>A browser-based WhatsApp message scheduler built as a Manifest V3 Chrome Extension.</strong></p>

<img src="https://img.shields.io/badge/Chrome-Manifest_V3-2563EB?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Chrome Manifest V3" />
<img src="https://img.shields.io/badge/WXT-Extension_Framework-8B5CF6?style=for-the-badge" alt="WXT" />
<img src="https://img.shields.io/badge/React-UI-22D3EE?style=for-the-badge&logo=react&logoColor=08090D" alt="React" />
<img src="https://img.shields.io/badge/TypeScript-Application-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />

<br />

[Repository](https://github.com/Yash-Patil-19/ChronoWA-WhatsApp-Message-Scheduler-Chrome-Extension) · [LinkedIn](https://www.linkedin.com/in/yash-patil-19022004f/)

</div>

---

## 🔷 01 · Overview

**ChronoWA** is a Chrome Extension for scheduling WhatsApp messages through WhatsApp Web. It gives users a way to prepare a message, choose when it should be sent, and manage scheduled items from a simple queue dashboard.

Built with **WXT, React, TypeScript, and Chrome Extension APIs**, ChronoWA uses a local-first approach for its scheduling data. It does not require a dedicated application server or a paid third-party messaging API.

> **Schedule it now. Send it on time.**

## 🟢 02 · Features

| Feature | What it does |
|:--|:--|
| 🗓️ Custom scheduling | Choose a specific date and time for a message. |
| ⚡ Quick presets | Use shortcuts such as in one hour, in two hours, or midnight. |
| 💬 In-chat scheduling | Open the scheduling experience from the WhatsApp Web chat interface. |
| 📋 Queue dashboard | Review scheduled and pending messages in one place. |
| ✏️ Message management | Edit, reschedule, or delete pending messages. |
| 🔁 Recurring schedules | Configure daily and weekly message schedules. |
| ⏰ Background alarms | Use Chrome Alarms API to trigger due scheduling tasks. |
| 💾 Local storage | Keep scheduling and queue information in browser storage. |
| 🔔 Notifications | Show browser notifications about message dispatch status. |

## 🟣 03 · Technology

<p align="center">
  <img src="https://img.shields.io/badge/WXT-5B4BDB?style=flat-square" alt="WXT" />
  <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=111111" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Chrome_Extensions-4285F4?style=flat-square&logo=googlechrome&logoColor=white" alt="Chrome Extensions" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
</p>

| Layer | Technology |
|:--|:--|
| Extension framework | WXT |
| UI | React |
| Language | TypeScript, JavaScript |
| Styling | Tailwind CSS |
| Browser platform | Chrome Extension Manifest V3 |
| Scheduling | Chrome Alarms API |
| Persistence | Chrome Storage API |
| Notifications | Chrome Notifications API |
| Messaging interface | WhatsApp Web |
| Tooling | Node.js, npm, Git |

## 🔵 04 · Architecture

ChronoWA follows a client-side Chrome Extension architecture. The UI creates and manages schedules, browser storage keeps queue data, and Chrome's alarm mechanism triggers the background scheduling workflow.

```text
                    CHRONOWA EXTENSION
                            |
              +-------------+-------------+
              |                           |
         Extension UI                WhatsApp Web
              |                           |
        React + WXT                 Content Script
              |                           |
              +-------------+-------------+
                            |
                    Scheduling Engine
                            |
                     Chrome Alarms API
                            |
                      Local Storage
                            |
                       Message Queue
                            |
                    Message Dispatcher
                            |
                       WhatsApp Web
                            |
                    Browser Notification
```

### Core components

- **Extension UI:** Popup, scheduling controls, quick presets, and queue dashboard.
- **Scheduling engine:** Checks due times and uses Chrome Alarms API to trigger scheduled work.
- **Local storage:** Stores scheduled-message and queue information in the browser.
- **Message dispatcher:** Interacts with WhatsApp Web to insert and dispatch a due message.

## 🧩 05 · Installation

### Prerequisites

- Google Chrome
- Node.js and npm
- A WhatsApp account
- An authenticated WhatsApp Web session

### 1. Clone the repository

```bash
git clone https://github.com/Yash-Patil-19/ChronoWA-WhatsApp-Message-Scheduler-Chrome-Extension.git
cd ChronoWA-WhatsApp-Message-Scheduler-Chrome-Extension
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development environment

```bash
npm run dev
```

Follow the WXT terminal output and load the generated development extension in Chrome.

### 4. Load the extension

1. Open `chrome://extensions/` in Chrome.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose the generated Chrome extension output directory shown by WXT.
5. Pin ChronoWA to the browser toolbar.

### Production build

Use the production build script configured in `package.json`:

```bash
npm run build
```

The exact output directory depends on the WXT configuration in the repository.

## 🚀 06 · How to use

1. Open WhatsApp Web and sign in.
2. Open ChronoWA from the browser toolbar or its in-chat scheduling control.
3. Select a contact or use the currently open chat.
4. Enter the message you want to schedule.
5. Choose a quick preset or select a custom date and time.
6. Select **Schedule Message**.
7. Review the message in the queue dashboard.
8. Edit, reschedule, or cancel it while it is pending.

## 🎨 07 · Visual identity

The interface uses a high-contrast dark theme with bright accents for actions and status indicators.

| Color | Hex | Role |
|:--|:--|:--|
| <img src="https://singlecolorimage.com/get/08090D/18x18" alt="Midnight Black swatch" /> Midnight Black | `#08090D` | Background and surfaces |
| <img src="https://singlecolorimage.com/get/2563EB/18x18" alt="Cobalt swatch" /> Electric Cobalt Blue | `#2563EB` | Primary actions and active states |
| <img src="https://singlecolorimage.com/get/CCFF00/18x18" alt="Acid Lime swatch" /> Acid Lime | `#CCFF00` | Highlights and status accents |
| <img src="https://singlecolorimage.com/get/8B5CF6/18x18" alt="Violet swatch" /> Violet | `#8B5CF6` | Secondary accent |
| <img src="https://singlecolorimage.com/get/22D3EE/18x18" alt="Cyan swatch" /> Cyan | `#22D3EE` | Supporting accent |

## 🔐 08 · Privacy, reliability & limitations

ChronoWA is designed around a local-first approach to scheduling data. It does not require a dedicated application server or paid third-party messaging API.

Please note these operational constraints:

- Chrome and the computer need to remain running at the scheduled time.
- WhatsApp Web needs an authenticated session and a working internet connection.
- Sleep, shutdown, browser closure, or network interruptions can prevent dispatch.
- Changes to WhatsApp Web may affect browser automation and require maintenance.
- A dispatch attempt does not guarantee successful delivery or that the recipient has read the message.
- Browser storage is not automatically encrypted. Protect access to your device and browser.
- Automated messaging should be used responsibly and in accordance with applicable WhatsApp terms and policies.

**ChronoWA does not claim ban-proof automation or guaranteed delivery.** Its behavior depends on the browser session and WhatsApp Web.

## 🛠️ 09 · Roadmap

- [ ] Scheduled image and document attachments
- [ ] More flexible recurring schedules
- [ ] Improved dispatch and failure status visibility
- [ ] Better recovery from browser and network interruptions
- [ ] Message history and usage insights
- [ ] Expanded reliability and integration testing

## 📁 10 · Project structure

The following is an illustrative WXT layout. Update it to match the actual repository structure if your files differ.

```text
ChronoWA/
├── assets/
├── components/
├── entrypoints/
│   ├── background.ts
│   ├── content.ts
│   └── popup/
├── public/
├── package.json
├── tsconfig.json
├── wxt.config.ts
└── README.md
```

## 🤝 11 · Contributing

Suggestions, bug reports, and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Open a pull request with a clear description.

## ⚖️ 12 · Disclaimer

ChronoWA is an independent project and is not affiliated with, endorsed by, or officially associated with WhatsApp or Meta. Product names and trademarks belong to their respective owners. Use the extension responsibly and follow applicable platform terms and policies.

## 👨‍💻 13 · Author

<div align="center">

**Yash Patil**  
B.E. Information Technology · Software Development

<a href="https://github.com/Yash-Patil-19">
  <img src="https://img.shields.io/badge/GitHub-Yash--Patil--19-08090D?style=for-the-badge&logo=github" alt="GitHub profile" />
</a>
<a href="https://www.linkedin.com/in/yash-patil-19022004f/">
  <img src="https://img.shields.io/badge/LinkedIn-Connect-2563EB?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn profile" />
</a>

<br />

<img src="https://readme-typing-svg.demolab.com?font=Space+Grotesk&weight=600&size=18&duration=2800&pause=900&color=22D3EE&center=true&vCenter=true&width=500&lines=Schedule+smarter.;Stay+on+time.;Built+with+focus+by+Yash+Patil." alt="Animated ChronoWA sign-off" />

</div>
