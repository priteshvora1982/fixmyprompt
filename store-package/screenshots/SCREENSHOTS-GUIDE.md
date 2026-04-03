# FixMyPrompt — Screenshot Guide for Chrome Web Store

Chrome Web Store requires **1–5 screenshots**. All must be exactly **1280×800** or **640×400** pixels.
Recommended: use 1280×800. PNG format preferred.

---

## Required Screenshots (take all 5)

### Screenshot 1 — The Balloon Appearing (most important)
**File:** `screenshot-1-balloon.png`
**Content:** The FixMyPrompt balloon appearing below the chat input on ChatGPT or Claude.
**What to show:**
- ChatGPT or Claude open in Chrome
- A prompt typed in the input box (use: *"write a blog post about productivity"*)
- The score balloon visible below the input showing a score of ~3-5/10
- Domain badge visible (e.g. "✍️ Creative Writing" or "💼 Business")
- The "✨ Improve with Questions" button visible
**How to capture:**
1. Open ChatGPT or Claude
2. Type: `write a blog post about productivity`
3. Wait 3 seconds — the balloon appears
4. Take a full-browser screenshot (1280×800)
5. Crop to 1280×800 if needed

---

### Screenshot 2 — The Question Chips
**File:** `screenshot-2-questions.png`
**Content:** The balloon expanded showing the 3 clarifying question chips.
**What to show:**
- The balloon in the "questions" state (after clicking "Improve with Questions")
- 3 chip-based questions visible (e.g. "Who is this blog post for?", "What tone?", "What length?")
- Chips should be unselected (blue outline, white background)
- The title "Answer 3 quick questions" or similar visible
**How to capture:**
1. Trigger the balloon (same as above)
2. Click "✨ Improve with Questions"
3. Screenshot immediately when questions appear (before selecting any)

---

### Screenshot 3 — A Chip Selected / In Progress
**File:** `screenshot-3-chips-selected.png`
**Content:** User has tapped some answer chips.
**What to show:**
- 1–2 chips selected (filled, purple/gradient background)
- Remaining chips still unselected
- "Generate Improved Prompt →" button starting to become active
**How to capture:**
1. Continue from screenshot 2
2. Click one or two answer chips
3. Screenshot while in this state

---

### Screenshot 4 — The Improved Prompt Result
**File:** `screenshot-4-improved.png`
**Content:** The final improved prompt displayed, ready to accept.
**What to show:**
- The balloon in results state showing the improved prompt text
- A score comparison visible (e.g. "3.2 → 8.7")
- "✅ Accept & Replace" button visible
- The improved prompt text (multi-line, detailed, well-structured)
**How to capture:**
1. After selecting all chips, click "Generate Improved Prompt"
2. Wait for the result (2–4 seconds)
3. Screenshot the result state with the improved prompt visible

---

### Screenshot 5 — The Manual ✨ Button (Clean State)
**File:** `screenshot-5-improve-button.png`
**Content:** Shows the ✨ Improve button in the ChatGPT/Claude toolbar.
**What to show:**
- ChatGPT or Claude with an empty or partly-typed prompt
- The ✨ button visible in the top-right of the input box area
- A tooltip or hover state if possible: "Improve this prompt"
- Clean, uncluttered view
**How to capture:**
1. Open a new chat on ChatGPT or Claude
2. Type a short prompt: `help me write an email`
3. Screenshot showing the ✨ button in the input toolbar
4. Optionally hover over it to show the tooltip

---

## Screenshot Tips

### Dimensions
- Use browser zoom at **100%** (Cmd+0)
- Use a **1280×800** browser window (set in Chrome DevTools: Cmd+Shift+M → set 1280×800)
- Take screenshots with **Cmd+Shift+4** on Mac, then select exactly the browser window

### Setting exact window size in Chrome
1. Open DevTools (F12)
2. Toggle Device Toolbar (Cmd+Shift+M)
3. Set custom dimensions: **1280 × 800**
4. Screenshots taken this way will be exactly right

### Image quality
- Save as PNG (not JPEG)
- Do not scale after taking — upload at native size

### Which platform to use for screenshots
- Use **ChatGPT** for screenshots 1–4 (cleaner UI, more recognizable)
- Use **Claude** for screenshot 5 to show cross-platform support
- Or mix — both are fine

---

## Promo Tiles (already created as HTML files)

These are screenshot-ready HTML files in the `promotional/` folder. To convert to images:

| File | Size | Use |
|---|---|---|
| `marquee-1400x560.html` | 1400×560 | Chrome Web Store marquee banner (optional, shown at top of listing) |
| `tile-large-920x680.html` | 920×680 | Large promotional tile (optional) |
| `tile-small-440x280.html` | 440×280 | Small promotional tile (optional) |

### How to screenshot the HTML promo tiles
1. Open the HTML file in Chrome
2. Open DevTools → Device Toolbar → set exact dimensions (e.g. 1400×800 for marquee)
3. Use the DevTools "Capture screenshot" option (⋮ menu → Capture screenshot)
4. Or: set window to exact size and use Cmd+Shift+4

---

## Icons (already in FixMyPrompt/ folder)

The compiled extension folder already contains all required icons:
- `icon16.png` — 16×16 (toolbar)
- `icon32.png` — 32×32
- `icon48.png` — 48×48 (extension management)
- `icon128.png` — 128×128 (Chrome Web Store listing)

For the store listing, upload `icon128.png` as the extension icon.

---

## Summary Checklist

- [ ] screenshot-1-balloon.png (1280×800)
- [ ] screenshot-2-questions.png (1280×800)
- [ ] screenshot-3-chips-selected.png (1280×800)
- [ ] screenshot-4-improved.png (1280×800)
- [ ] screenshot-5-improve-button.png (1280×800)
- [ ] Promo tiles converted to PNG (optional but recommended)
- [ ] icon128.png ready (already in FixMyPrompt/ folder)
