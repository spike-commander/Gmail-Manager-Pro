# Gmail Manager Pro

> A powerful Chrome Extension for advanced Gmail management — smart triage, bulk actions, rule-based sorting, and productivity tools, all within a sleek side panel.

![Manifest Version](https://img.shields.io/badge/Manifest-V3-blue)
![Chrome Extension](https://img.shields.io/badge/Platform-Chrome-yellow)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- **Smart Triage** — Automatically categorizes and prioritizes your inbox
- **Bulk Actions** — Select all, archive, delete, mark read/unread, star, or report spam in one click
- **Rule-Based Sorting** — Create custom filters and sorting rules via the Rules Panel
- **Quick Filters** — Instantly filter by Unread, Starred, Important, or emails with Attachments
- **Saved Filters** — Save and reuse your favorite filter combinations
- **Newsletter Scanner** — Detect and manage newsletters with one click
- **Quick Unsubscribe** — Unsubscribe from emails directly from Gmail
- **Reminders** — Set email reminders using Chrome alarms
- **Side Panel UI** — All tools accessible from a sleek, non-intrusive sidebar
- **Email Stats** — Real-time display of total, unread, and selected email counts

---

## 📁 Project Structure

```
Chrome Extension/
├── manifest.json        # Extension manifest (Manifest V3)
├── background.js        # Service worker (alarms, notifications, context menus)
├── content.js           # Content script injected into Gmail
├── popup.html           # Extension popup UI
├── popup.css            # Popup styling
├── popup.js             # Popup logic
├── sidebar.html         # Side panel UI
├── sidebar.css          # Sidebar styling
├── sidebar.js           # Sidebar logic
└── icons/
    └── icon.svg         # Extension icon
```

---

## 🚀 Installation (Developer Mode)

> No Chrome Web Store listing yet — install manually in developer mode.

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/gmail-manager-pro.git
   ```

2. **Open Chrome Extensions page**
   - Navigate to `chrome://extensions/`

3. **Enable Developer Mode**
   - Toggle the **Developer mode** switch in the top-right corner

4. **Load the extension**
   - Click **Load unpacked**
   - Select the cloned `gmail-manager-pro` folder

5. **Open Gmail**
   - Navigate to [Gmail](https://mail.google.com)
   - The extension icon will appear in your toolbar

---

## 🔐 Permissions

| Permission | Reason |
|---|---|
| `storage` | Save filters, rules, and settings locally |
| `activeTab` | Interact with the current Gmail tab |
| `scripting` | Inject content scripts into Gmail |
| `alarms` | Schedule and fire email reminders |
| `notifications` | Show desktop notifications for reminders |
| `sidePanel` | Display the sidebar panel |
| `host: mail.google.com` | Operate exclusively within Gmail |

---

## 🛠️ Tech Stack

- **Manifest V3** Chrome Extension API
- Vanilla **HTML / CSS / JavaScript**
- Chrome APIs: `storage`, `sidePanel`, `alarms`, `notifications`, `contextMenus`, `scripting`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
