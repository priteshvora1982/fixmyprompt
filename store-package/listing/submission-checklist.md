# FixMyPrompt — Chrome Web Store Submission Checklist

Complete every item before submitting. Estimated time: 30–45 minutes.

---

## Step 1 — Prepare the Extension ZIP

- [ ] Open Terminal in the `FixMyPrompt/` folder (the compiled extension folder — not the source folder)
- [ ] Run: `zip -r FixMyPrompt-v0.1.30.zip FixMyPrompt/`
- [ ] Verify the ZIP contains: `manifest.json`, `content-script.js`, `service-worker.js`, `extension.css`, `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`
- [ ] The ZIP must NOT contain the `src/` or `node_modules/` source folders

---

## Step 2 — Create a Google Developer Account

- [ ] Go to: https://chrome.google.com/webstore/devconsole
- [ ] Sign in with a Google account
- [ ] Pay the one-time **$5 developer registration fee** (required once, not per extension)
- [ ] Accept the Developer Agreement

---

## Step 3 — Create New Item

- [ ] In the Developer Dashboard, click **"New Item"**
- [ ] Upload your `FixMyPrompt-v0.1.30.zip`
- [ ] Wait for the upload to process (usually 30–60 seconds)

---

## Step 4 — Fill in Store Listing Details

Use the content from `store-package/listing/store-description.md`

**Product details tab:**
- [ ] **Extension name:** `FixMyPrompt — Smarter AI Prompts`
- [ ] **Short description** (132 chars max): `Instantly improve your ChatGPT & Claude prompts. Get a score, identify gaps, and generate better prompts in seconds. Free.`
- [ ] **Detailed description:** Copy the full long description from `store-description.md`
- [ ] **Category:** Productivity
- [ ] **Language:** English

**URLs (optional but recommended):**
- [ ] **Homepage URL:** https://priteshvora1982.github.io/fixmyprompt/
- [ ] **Support URL:** https://priteshvora1982.github.io/fixmyprompt/support.html

---

## Step 5 — Upload Graphics

**Store icon:**
- [ ] Upload `FixMyPrompt/icon128.png` as the **Store icon** (128×128 PNG)

**Screenshots (required — minimum 1, recommended 5):**
- [ ] `screenshot-1-balloon.png` — balloon appearing with score
- [ ] `screenshot-2-questions.png` — question chips shown
- [ ] `screenshot-3-chips-selected.png` — chips being selected
- [ ] `screenshot-4-improved.png` — improved prompt result
- [ ] `screenshot-5-improve-button.png` — ✨ button in toolbar

See `store-package/screenshots/SCREENSHOTS-GUIDE.md` for exact instructions.

**Promotional images (optional but improves visibility):**
- [ ] Small promo tile: 440×280 PNG (convert `tile-small-440x280.html`)
- [ ] Large promo tile: 920×680 PNG (convert `tile-large-920x680.html`)
- [ ] Marquee: 1400×560 PNG (convert `marquee-1400x560.html`)

---

## Step 6 — Privacy Practices Tab

Chrome requires you to declare data usage. Answer as follows:

**Does your extension collect or use any user data?**
- [ ] Select: **"Yes"** (because prompt text is sent to your backend)

**Data types — check the following:**
- [ ] **User activity** → "Prompt text is sent to backend for improvement" → Purpose: "Core extension functionality" → Not sold, not used for ads, not used to determine creditworthiness

**Single purpose description:**
- [ ] Enter: `FixMyPrompt analyzes prompts typed on ChatGPT and Claude, identifies what's missing, and rewrites them to be clearer and more effective — helping users get better AI responses.`

**Remote code:**
- [ ] Select: **"No"** — the extension does not execute remotely hosted code

**Permissions justifications** (use content from `permission-justifications.md`):
- [ ] `activeTab` — To read and modify the prompt text in the active ChatGPT or Claude tab
- [ ] `scripting` — To inject the content script that displays the improvement balloon
- [ ] `storage` — To remember whether the balloon has been shown in the current session
- [ ] `https://chatgpt.com/*` — Extension only works on ChatGPT
- [ ] `https://claude.ai/*` — Extension only works on Claude
- [ ] `https://web-production-b82f2.up.railway.app/*` — Backend API for prompt analysis

---

## Step 7 — Distribution Tab

- [ ] **Visibility:** Public
- [ ] **Distribution:** All regions (or select specific regions if preferred)
- [ ] **Pricing:** Free

---

## Step 8 — Review & Submit

- [ ] Click **"Save Draft"** and preview the listing
- [ ] Check that all screenshots look correct at the preview sizes
- [ ] Verify the description renders properly (check line breaks and formatting)
- [ ] Click **"Submit for Review"**

---

## After Submission

**Review timeline:**
- Google typically reviews new extensions within **1–3 business days**
- Some extensions take up to 7 days for first-time submissions
- You will receive an email when approved or if changes are needed

**Common rejection reasons to avoid:**
- Permissions not justified → covered in Step 6
- Privacy policy missing or inaccessible → make sure your support/privacy pages are live before submitting
- Screenshots not showing real functionality → use actual in-app screenshots, not mockups

**If rejected:**
- Read the rejection email carefully — Google usually gives a specific reason
- Make the requested changes to the ZIP or listing
- Re-upload and resubmit from the same developer console item

---

## Post-Launch

- [ ] Share the Chrome Web Store link on Product Hunt
- [ ] Submit to extension directories (e.g. extensionworkshop.com roundups)
- [ ] Set up `support@fixmyprompt.com` email to receive support enquiries
- [ ] Host web pages at fixmyprompt.com (deploy `store-package/web-pages/`)
- [ ] Monitor the Developer Dashboard for user reviews and respond promptly

---

## File Reference

```
store-package/
├── listing/
│   ├── store-description.md          ← Copy/paste for store listing
│   ├── permission-justifications.md  ← Use for Privacy Practices tab
│   └── submission-checklist.md       ← This file
├── web-pages/
│   ├── index.html                    ← Landing page (host at fixmyprompt.com)
│   ├── privacy.html                  ← Privacy policy (link in listing)
│   └── support.html                  ← Support page (link in listing)
├── promotional/
│   ├── marquee-1400x560.html         ← Convert to PNG for marquee banner
│   ├── tile-large-920x680.html       ← Convert to PNG for large tile
│   └── tile-small-440x280.html       ← Convert to PNG for small tile
└── screenshots/
    └── SCREENSHOTS-GUIDE.md          ← Instructions for taking screenshots

FixMyPrompt/                          ← The extension folder (zip this for upload)
├── manifest.json
├── content-script.js
├── service-worker.js
├── extension.css
├── icon16.png
├── icon32.png
├── icon48.png
└── icon128.png
```
