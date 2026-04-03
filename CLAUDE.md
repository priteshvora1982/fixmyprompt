# CLAUDE.md — FixMyPrompt

This file is read by Claude Code at the start of every session. It contains everything needed to work on this project without re-explanation.

---

## What this project is

FixMyPrompt is a **Manifest V3 Chrome extension** that:
1. Detects when a user types a prompt on ChatGPT (`chatgpt.com`) or Claude (`claude.ai`)
2. Scores it locally (0–10) using `MockBackendAnalyzer`
3. Shows a balloon UI if the score is low, with clarifying question chips
4. Sends the prompt + answers to a backend API which calls OpenAI GPT-4 to rewrite it
5. Injects the improved prompt back into the chat input box

**No frameworks. Vanilla JS. MV3.**

---

## Repo structure

```
src/
  content/         Content scripts (injected into chatgpt.com + claude.ai)
    index.js       Entry point — imports and wires everything
    button.js      ★ MOST IMPORTANT — balloon trigger, conversation tracking, ✨ button
    auto-detect-balloon.js   6-state balloon UI component
    mock-backend-analyzer.js Local 0–10 scorer (no network call)
    input-monitor.js         Fires onPause after 2.5s typing inactivity
    balloon-question-bank.js Static question banks per domain
    improved-modal.js        Modal shown after improvement completes
    modal.js                 Generic modal helper
    backend-analyzer.js      Wrapper around backend API calls
    prompt-analyzer.js       Local prompt analysis
    prompt-capture.js        Captures submitted prompt text
    button-gap-formatter.js  Formats gap descriptions for display
  background/
    service-worker.js        MV3 service worker (message passing, alarms)
  shared/
    backend-api.js     ★ Backend API client — Railway endpoint, score normalization
    domain-detector.js       Classifies prompt into 1 of 8 domains
    prompt-scorer.js         Scoring logic
    context-manager.js       Session context accumulation
    incremental-context.js   Incremental context building
    constants.js             Shared constants
    platform.js              Platform detection (chatgpt vs claude)
    gap-finder.js            Identifies gaps in prompts
    question-generator.js    Generates clarifying questions
    dom-utils.js             DOM helpers
    chrome-utils.js          Chrome API helpers
    toast.js                 Toast notifications
    validation.js            Input validation

FixMyPrompt/        Compiled extension — load this in Chrome (Load Unpacked)
  content-script.js (161KB bundled)
  service-worker.js (21KB bundled)
  extension.css
  manifest.json
  icon16/32/48/128.png

store-package/
  listing/          Chrome Web Store copy (description, permissions, data usage, checklist)
  screenshots/      Formatted 1280×800 screenshots + rendered promo tiles
  promotional/      HTML source for promo banners
  web-pages/        Source copies of index/privacy/support HTML

index.html          Landing page (served via GitHub Pages)
privacy.html        Privacy policy
support.html        Support + FAQ
```

---

## How to build

Requires esbuild. If running locally for the first time, download the binary:

```bash
curl -s https://registry.npmjs.org/@esbuild/darwin-arm64/latest \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['dist']['tarball'])" \
  | xargs curl -sL | tar -xz -C /tmp
# Binary is now at /tmp/package/bin/esbuild
```

Then build:

```bash
/tmp/package/bin/esbuild src/content/index.js \
  --bundle --format=iife --outfile=FixMyPrompt/content-script.js --minify

/tmp/package/bin/esbuild src/background/service-worker.js \
  --bundle --format=iife --outfile=FixMyPrompt/service-worker.js --minify
```

Or use the build script (requires Node.js):
```bash
node build.js
```

**Expected build warnings (safe to ignore):** 4 files have dual `module.exports`/`export` patterns — harmless, build succeeds.

---

## Backend

- **URL:** `https://web-production-b82f2.up.railway.app`
- **Hosting:** Railway
- **Runtime:** Node.js + Express
- **AI:** OpenAI GPT-4 Turbo (`gpt-4-turbo-preview`)
- **Key endpoints:**
  - `POST /api/analyze` — scores a prompt (returns 0–100, frontend normalizes to 0–10)
  - `POST /api/improve` — rewrites prompt using answers to questions
  - `POST /api/questions` — generates clarifying questions for a prompt

**Score normalization** (in `src/shared/backend-api.js`):
Backend returns 0–100. Frontend expects 0–10. Always divide by 10.

---

## Key patterns & gotchas

### Balloon only shows on first message
`balloonShownInCurrentConversation` flag in `button.js`. Once set to `true`, balloon never shows again in that conversation. Reset only on genuine new conversation.

### Conversation detection
`detectConversationId()` in `button.js` — URL-based only:
- ChatGPT: `/c/[uuid]`
- Claude: `/chat/[uuid]`
- Returns `null` on new chat pages (no URL yet)

`checkForNewConversation()` treats `null → real_id` as the **same** conversation (URL gets assigned after first send). Only a `real_id → different_real_id` transition counts as a new conversation and resets the balloon state.

### Domain detection
8 domains: `business`, `creative_writing`, `creative_media`, `technical`, `finance`, `academic`, `career`, `personal`.
Logic in `src/shared/domain-detector.js` — phrase patterns (2× weight) + keyword matching.
Finance is checked before business to avoid misclassification.

### Platform detection
`_detectPlatform()` in `auto-detect-balloon.js` — checks `window.location.href` for `claude.ai` vs defaulting to `chatgpt`. Must be called at request time, not at module load.

### Context accumulation
`incrementalContextManager` in `button.js` — accumulates prompts sent in a session. Used by the backend to provide context-aware improvements on follow-up messages.

---

## Known issues / tech debt

| Issue | Location | Priority |
|---|---|---|
| `getContext()` sends POST with empty body instead of GET `/api/context/:id` | `src/shared/backend-api.js` | Low |
| Duplicate question banks — `_localQuestions()` in balloon + `balloon-question-bank.js` | Both files | Low |
| Manual ✨ Improve button disabled for follow-up messages | `button.js` | Planned v0.2 |
| No Gemini support | All platform detection | Roadmap |

---

## Testing changes

There is no automated test suite. To test manually:

1. Make code changes in `src/`
2. Rebuild (`/tmp/package/bin/esbuild ...` commands above)
3. Open Chrome → `chrome://extensions/`
4. Enable **Developer mode**
5. Click **Load unpacked** → select the `FixMyPrompt/` folder
6. If already loaded: click the **refresh** (↺) button on the extension card
7. Open `chatgpt.com` or `claude.ai` in a new tab
8. Type a vague prompt (e.g. "write an email") and wait 3 seconds

**Console logs:** All `[FixMyPrompt]` prefixed. Open DevTools on the ChatGPT/Claude tab to see them.

---

## Chrome Web Store

All submission assets are in `store-package/listing/`. Start with `submission-checklist.md`.

Pages are hosted on GitHub Pages: `https://priteshvora1982.github.io/fixmyprompt/`

---

## What NOT to do

- Do not add npm dependencies without checking if they'll bloat the bundle
- Do not add `console.log` without the `[FixMyPrompt]` prefix
- Do not change the score scale — backend is 0–100, UI always shows 0–10
- Do not reset `balloonShownInCurrentConversation` on URL changes without checking `checkForNewConversation()` logic
- Do not hardcode `platform: 'chatgpt'` anywhere — always use `_detectPlatform()`
