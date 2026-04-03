# FixMyPrompt — Permission Justifications
## For Chrome Web Store Review

---

### Permission: `activeTab`

**Why it's needed:**
FixMyPrompt needs to read the content of the active tab to detect which AI platform the user is on (ChatGPT or Claude) and to inject the improvement UI into that page.

**Specific use:**
- Detects whether the current tab is `chatgpt.com` or `claude.ai`
- Reads the text the user has typed into the prompt input box
- Injects the FixMyPrompt button and balloon UI into the page

**What it does NOT do:**
- Does not access any other tabs
- Does not read any page content other than the AI prompt input field
- Does not capture browsing history

---

### Permission: `scripting`

**Why it's needed:**
Required to inject the content script into supported AI platform pages (ChatGPT and Claude). This is how the extension places its UI elements (button, balloon, modal) into the page.

**Specific use:**
- Injects `content-script.js` into `chatgpt.com` and `claude.ai` only
- Injects `extension.css` for styling the UI components

**What it does NOT do:**
- Does not inject scripts into any other websites
- Does not modify page content beyond adding the FixMyPrompt UI overlay

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
The extension only operates on these three domains — the two URLs for ChatGPT and the URL for Claude. Host permissions are required to allow the content script to run on these pages and to allow the extension to make API calls from within these pages to the FixMyPrompt backend.

**Specific use:**
- Content script runs only on these domains
- API calls to `web-production-b82f2.up.railway.app` (FixMyPrompt backend) are made from within these pages to generate improved prompts

**What it does NOT do:**
- Does not request access to any other domain
- Does not inject any code into any other website
- Does not track user behavior on these platforms beyond reading the prompt input field

---

### No other permissions are requested.

FixMyPrompt deliberately avoids requesting permissions it does not need:
- ❌ No `tabs` permission (does not enumerate or access other tabs)
- ❌ No `history` permission
- ❌ No `cookies` permission
- ❌ No `webRequest` permission
- ❌ No `identity` permission (no sign-in required)
- ❌ No `notifications` permission
- ❌ No `geolocation` permission
