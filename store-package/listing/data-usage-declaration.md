# FixMyPrompt — Data Usage Declaration
*(Chrome Web Store → Privacy practices tab → Data usage)*

---

## Certifications (check all three boxes in the store)

- [x] **I certify that the following disclosures are accurate and that I will keep them up-to-date.**
- [x] **I don't sell or transfer user data to third parties, outside of the approved use cases.**
- [x] **I don't use or transfer user data for purposes that are unrelated to my item's single purpose.**
- [x] **I don't use or transfer user data to determine creditworthiness or for lending purposes.**

---

## Data types collected

For each data type below, answer whether you collect it and fill in the required fields if yes.

---

### Personally identifiable information
**Collected:** No

---

### Health info
**Collected:** No

---

### Financial and payment info
**Collected:** No

---

### Authentication info
**Collected:** No

---

### Personal communications
**Collected:** No

---

### Location
**Collected:** No

---

### Web history
**Collected:** No

---

### User activity
**Collected:** Yes

| Field | Answer |
|---|---|
| **What is this data used for?** | Core extension functionality |
| **Is this data encrypted in transit?** | Yes (HTTPS) |
| **Is this data collected at the user's discretion (optional)?** | No — required for the extension to function |
| **How is this data used?** | The prompt text typed by the user is sent to our backend API to generate an improved version. It is processed in real-time and immediately discarded. It is never stored in a database, log file, or any persistent storage. |
| **Is this data shared with third parties?** | Yes — shared with OpenAI API solely to generate the improved prompt (core functionality). Not shared for any other purpose. |
| **Is this data sold?** | No |
| **Is this data used for advertising?** | No |

---

### Website content
**Collected:** No
*(The extension reads the prompt text typed in the chat input box, but does not collect or transmit any other website content.)*

---

## How to fill this in on the Chrome Web Store

1. Go to your extension's listing in the [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **Privacy practices** tab
3. Scroll to **Data usage**
4. Check all 3 certification checkboxes
5. For each data type, select **"No"** except for **"User activity"** — select **"Yes"**
6. For User activity:
   - **Purpose:** Core functionality
   - **Encrypted in transit:** Yes
   - **User discretion:** No (required)
7. Click **Save**

---

## Notes

- **Why "User activity" and not "Website content":** The extension only reads the specific text box the user is actively typing in — not general page content, browsing history, or other elements.
- **OpenAI is the only third party** that receives prompt text, and only for the purpose of generating the improvement (core functionality). This satisfies the "approved use cases" exception.
- **Railway (hosting)** receives standard server access logs (IP, timestamp, request size) for operational purposes only — not prompt content.
