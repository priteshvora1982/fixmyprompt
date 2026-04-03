# AGENTS.md — FixMyPrompt

This file provides context for AI coding agents (Cursor, Copilot, Codex, etc.).
For Claude Code specifically, see `CLAUDE.md` which has deeper detail.

---

## Project summary

FixMyPrompt is a Chrome extension (Manifest V3, vanilla JS) that improves AI prompts on ChatGPT and Claude. It detects low-quality prompts, shows a scoring balloon, asks 3 clarifying questions via chip UI, then uses a Node.js/OpenAI backend to rewrite the prompt.

---

## Stack

| Layer | Technology |
|---|---|
| Extension | Vanilla JS, Chrome MV3, esbuild bundler |
| Content scripts | `src/content/` — injected into chatgpt.com + claude.ai |
| Service worker | `src/background/service-worker.js` |
| Backend | Node.js + Express on Railway |
| AI | OpenAI GPT-4 Turbo |
| Hosting (web) | GitHub Pages |

---

## Entry points

- **Content script:** `src/content/index.js`
- **Service worker:** `src/background/service-worker.js`
- **Main logic:** `src/content/button.js` — balloon trigger and conversation tracking
- **Backend client:** `src/shared/backend-api.js` — Railway API calls

---

## Build

```bash
esbuild src/content/index.js --bundle --format=iife --outfile=FixMyPrompt/content-script.js --minify
esbuild src/background/service-worker.js --bundle --format=iife --outfile=FixMyPrompt/service-worker.js --minify
```

Output goes to `FixMyPrompt/` — this is the folder loaded in Chrome.

---

## Critical rules

1. **Score scale:** Backend returns 0–100. UI always shows 0–10. Always normalize: `score / 10`.
2. **Balloon shown once:** `balloonShownInCurrentConversation` flag must not be reset on URL changes unless it's a genuinely new conversation (different UUID in URL).
3. **Platform detection:** Never hardcode `'chatgpt'`. Always call `_detectPlatform()` which checks `window.location.href`.
4. **No frameworks:** This is vanilla JS. Do not import React, Vue, or any UI library.
5. **Prefix logs:** All `console.log` must start with `[FixMyPrompt]`.

---

## File to read first

`CLAUDE.md` — contains the full architecture, known issues, build instructions, and testing workflow.
