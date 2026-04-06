# FixMyPrompt — Permission Justifications
## For Chrome Web Store Review

---

### Permission: `storage`

**Why it's needed:**
Used to store lightweight session state within the browser. This allows the extension to remember whether the improvement balloon has already been shown in the current conversation, preventing it from appearing repeatedly.

**Specific use:**
- Stores the current conversation ID (to detect new vs. existing conversations)
- Stores session-level context about the current prompt improvement session
- All stored data is session-scoped and cleared automatically

**What it does NOT do:**
- Does not store any prompt text
- Does not store any personal information
- Does not sync data to any external server

---

### Host Permissions: `chatgpt.com`, `chat.openai.com`, `claude.ai`

**Why they're needed:**
The extension only operates on these three domains — the two URLs for ChatGPT and the URL for Claude. Host permissions are required to allow the content script to run on these pages.

**Specific use:**
- Content script runs only on these domains
- Reads the prompt text typed by the user in the chat input box
- Injects the FixMyPrompt balloon and button UI into the page

**What it does NOT do:**
- Does not read any page content other than the AI prompt input field
- Does not track user behaviour on these platforms

---

### Host Permission: `https://web-production-b82f2.up.railway.app/*`

**Why it's needed:**
This is the URL of the FixMyPrompt backend API (hosted on Railway). When the user triggers a prompt improvement, the content script sends the prompt text to this endpoint via an encrypted HTTPS request. Without this host permission, the cross-origin fetch from the content script would be blocked by Chrome.

**Specific use:**
- `POST /api/questions` — generates clarifying questions for the prompt
- `POST /api/improve` — rewrites the prompt using the user's answers
- All requests are over HTTPS and prompt data is immediately discarded after processing

**What it does NOT do:**
- Does not send any data to this endpoint without explicit user action (clicking Improve)
- Does not transmit any personal information — only the prompt text

---

### No other permissions are requested.

FixMyPrompt deliberately avoids requesting permissions it does not need:
- ❌ No `activeTab` permission (page access is granted via `host_permissions` + declarative `content_scripts`, not via user-gesture-triggered tab access)
- ❌ No `scripting` permission (content script is injected declaratively via manifest `content_scripts`, not programmatically)
- ❌ No `tabs` permission (does not enumerate or access other tabs)
- ❌ No `history` permission
- ❌ No `cookies` permission
- ❌ No `webRequest` permission
- ❌ No `identity` permission (no sign-in required)
- ❌ No `notifications` permission
- ❌ No `geolocation` permission
