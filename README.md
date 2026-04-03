# ✨ FixMyPrompt

**Write better AI prompts. Instantly.**

FixMyPrompt is a free Chrome extension that scores your prompts on ChatGPT and Claude, identifies what's missing, and walks you through 3 quick questions to generate a dramatically better prompt — before you hit send.

---

## How it works

1. Type a prompt on ChatGPT or Claude
2. FixMyPrompt scores it (0–10) and identifies gaps
3. Answer 3 quick chip questions to add context
4. Get an improved prompt — accept it with one click

---

## Install

**[Add to Chrome — Free](https://chrome.google.com/webstore/detail/fixmyprompt)**

No account required. No sign-up. Completely free.

---

## Supported platforms

- ✅ ChatGPT (chatgpt.com)
- ✅ Claude (claude.ai)
- 🔜 Gemini (coming soon)

---

## Website

- **Homepage:** [fixmyprompt.com](https://fixmyprompt.com)
- **Support:** [fixmyprompt.com/support.html](https://fixmyprompt.com/support.html)
- **Privacy Policy:** [fixmyprompt.com/privacy.html](https://fixmyprompt.com/privacy.html)

---

## Repository structure

```
├── index.html          # Landing page (GitHub Pages / fixmyprompt.com)
├── privacy.html        # Privacy policy
├── support.html        # Support & FAQ
├── src/                # Extension source code
│   ├── content/        # Content scripts (balloon, button, analyzers)
│   ├── background/     # Service worker
│   └── shared/         # Shared utilities (backend API, prompt scorer)
├── FixMyPrompt/        # Compiled extension (load unpacked in Chrome)
├── build.js            # esbuild build script
├── manifest.json       # Extension manifest (MV3)
└── store-package/      # Chrome Web Store assets
    ├── listing/        # Store description, permissions, checklist
    ├── screenshots/    # Formatted 1280×800 screenshots
    └── promotional/    # Promo banners (HTML → PNG)
```

---

## Build from source

Requires [Node.js](https://nodejs.org) and esbuild:

```bash
npm install
node build.js
```

Output goes to `FixMyPrompt/`.

---

## Privacy

FixMyPrompt does not store your prompts. Prompt text is sent to our backend API in real-time, processed, and immediately discarded. No account, no tracking, no data retention.

See [privacy.html](privacy.html) for the full policy.

---

## License

MIT
