# SmartMart AI — Mobile Minimal NFC Entrance Screen

A clean, mobile-first, and ultra-responsive entrance screen designed to trigger immediately when an NFC tag/card is tapped.

---

### Features & Color Palette

- **100% Mobile Responsive**:
  - Fits within `h-[100dvh]` with zero scrolling on mobile viewports.
  - Centered card layout with touch-friendly controls.

- **Sequence: "Welcome" then "Access Granted"**:
  - **Step 1 (Welcome)**:
    - Plays synthesized NFC melodic chime.
    - Displays *"Welcome, <Name>!"* with greeting badge.
    - Central orb pulses in **Blue**.
  - **Step 2 (Access Granted)**:
    - Flips seamlessly to **"✓ ACCESS GRANTED"**.
    - Gate wings swing open with a green floor threshold laser.
    - Plays turnstile relay release click & harmonic note.
    - Live **6s countdown timer** (`GATE OPEN: 6s`).

- **Color Palette Breakdown**:
  - ⚪ **White**: Main card background (`#ffffff`), contrast highlights.
  - 🔵 **Blue**: Storefront badge, Welcome accent, Blue NFC sonar wave (`#2563eb`).
  - 🟢 **Green**: Access Granted pill, gate threshold laser, Green ripple (`#059669`).
  - 🟡 **Yellow**: Gold NFC chip simulation, Guest pass badge, Yellow ripple (`#f59e0b`).
  - ⚫ **Black**: Bold typography (`text-slate-900`), turnstile posts.
  - 🔘 **Grey**: Background canvas (`#f8fafc`), card borders, muted labels.

---

### How to Run

```powershell
node server.cjs
```
Or open [`index.html`](file:///c:/Users/ASUS/Downloads/smartmartentry/index.html) in any mobile or desktop browser at **`http://localhost:5173/`**.
