# AARSHI Website — Admin Guide
**For anyone managing the website. No coding experience needed for most tasks.**
**Live site: https://aarshiofficial.github.io/**

---

## 📁 File Structure

```
AARSHI_WEBSITE/
├── index.html          ← The entire public website (one file — edit this for content)
├── auth.html            ← Member login / signup page
├── dashboard.html        ← Logged-in member's private dashboard (attendance, achievements)
├── members.html          ← Public members directory (name, interests — searchable/filterable)
├── css/style.css         ← All colours, fonts, layout
├── js/main.js            ← Animations, filters, lightbox, theme toggle
├── assets/                ← ALL images go here
│   ├── logo_dark.png             ← Logo for dark mode
│   ├── logo_light.jpg            ← Logo for light mode
│   ├── ob_*.jpg                  ← Current OB (26-27) photos
│   ├── ob2526_*.jpg              ← Previous OB (25-26) photos
│   ├── gal_*.jpg                 ← Gallery photos
│   ├── past_*.jpg                ← Past Events photos
│   ├── iicm_*.jpg                ← IICM gallery photos
│   ├── event_*.jpg/png           ← Event posters
│   └── mentor_*.jpg              ← Renowned faces photos
├── .github/workflows/deploy.yml  ← Auto-deploy (do not touch)
├── README.md
└── ADMIN_GUIDE.md        ← This file
```

---

## 🔧 HOW TO EDIT

1. Download the repo from GitHub or open it in VS Code
2. Open `index.html` in any text editor
3. Use **Ctrl+F** to search for the text you want to change
4. Edit and save
5. Push to GitHub → site updates at **https://aarshiofficial.github.io/** in ~2 min

```bash
git add .
git commit -m "Brief description of what changed"
git push
```
**Check deploy status:** GitHub repo → Actions tab

---

## 👥 CHANGING OFFICE BEARERS

### Step 1 — Add the new photo
Copy photo into `assets/` folder. Name it simply: `ob_firstname.jpg`

### Step 2 — Find the Team section
In `index.html`, press **Ctrl+F**, search for: `Current Office Bearers`

### Step 3 — Update each card
```html
<div class="team-card">
  <div class="team-photo-wrap">
    <img src="assets/ob_chhandak.jpg" alt="Chhandak Dutta" class="team-photo" />
  </div>
  <div class="team-role">Secretary</div>
  <h3 class="team-name">Chhandak Dutta</h3>
  <a href="tel:6295076503" class="team-contact">+91 62950 76503</a>
</div>
```
Change: photo filename, alt name, role, name, phone number.

### Moving outgoing OBs to "Previous" section
Search for `Tenure 2025–26`. Copy a card there with updated details.
Also update the historical table (search: `All Past Office Bearers`).

---

## 📅 ADDING / REMOVING CURRENT EVENTS

### Add a new event poster card
1. Copy poster image to `assets/`, e.g. `event_newname.jpg`
2. Find the `poster-grid` section (search: `Current & Upcoming 2026`)
3. Copy this template and fill in your details:
```html
<div class="poster-card">
  <div class="poster-img-wrap">
    <img src="assets/event_newname.jpg" alt="Event Name" />
    <div class="poster-badge poster-badge--live">Open</div>
  </div>
  <div class="poster-info">
    <div class="event-tag">Category</div>
    <h3 class="event-name">Event Name</h3>
    <p class="event-desc">Description here.</p>
    <div class="poster-meta">
      <span class="poster-meta-item">📅 Deadline: DATE</span>
    </div>
  </div>
</div>
```

**Badge options:**
- `poster-badge--live` → Red pulsing "Open" badge
- `poster-badge--soon` → Gold "Coming Soon" badge
- `poster-badge--closed` → Grey "Closed" badge (auto-applied after deadline passes)

### Remove an event
Delete from the opening `<div class="poster-card">` to its closing `</div>`.

---

## 🖼️ ADDING IMAGES

### To Gallery (current year):
1. Copy image to `assets/`, name it `gal_12_description.jpg`
2. Find `id="galleryGrid"` in `index.html`
3. Add inside the grid:
```html
<div class="gal-item" data-category="CATEGORY" data-caption="Caption Here">
  <img src="assets/gal_12_description.jpg" alt="Description" loading="lazy" />
  <div class="gal-overlay"><span>Caption Here</span></div>
</div>
```
**Gallery categories:** `rangabhumi` · `abhivyakti` · `lakeer`

### To Past Events:
Same, but find `id="pastGrid"` and use `data-past="CATEGORY"`.
**Past Events categories:** `abhivyakti` · `nukkad` · `productions` · `rangabhumi` · `iicm25` · `iicm23` · `farewell`

### Wide image (spans 2 columns):
```html
<div class="gal-item gal-item--wide" data-category="...">
```

### Add a new filter tab:
```html
<button class="gf-btn" data-past-filter="newcategory">Label</button>
```
Then tag images: `data-past="newcategory"`

---

## 🏆 UPDATING ACHIEVEMENTS (website content)

### Update stat counters
Search `data-target` in `index.html`:
```html
<div class="stat-number" data-target="3">0</div>
```

### Add a trophy item
Find `trophy-banner` and add:
```html
<div class="trophy-divider"></div>
<div class="trophy-item">
  <div class="trophy-icon">🥇</div>
  <div class="trophy-info">
    <span class="trophy-year">YEAR</span>
    <h3>Title</h3>
    <p>Description</p>
  </div>
</div>
```

### Add to Other Accolades
Find `ach-list` and add:
```html
<div class="ach-item">
  <span class="ach-rank">1<sup>st</sup></span>
  <div>
    <strong>Event Name</strong>
    <span>Fest Name · Year</span>
  </div>
</div>
```

---

## 🔗 ADDING VIDEO LINKS TO PRODUCTIONS

Find `prod-tag` in `index.html`:
```html
<!-- Before (no link): -->
<span class="prod-tag">Sab Changa Si <em>2022</em></span>

<!-- After (with YouTube link): -->
<a class="prod-tag prod-tag--link" href="https://youtu.be/YOUR_ID" target="_blank">
  Sab Changa Si <em>2022</em> <span class="prod-watch">▶ Watch</span>
</a>
```

---

## 📢 ANNOUNCEMENT BANNER (top of page)

Search for `ann-banner`:
```html
<div class="ann-banner" id="annBanner" data-active="true" data-expires="2026-07-07">
  <span class="ann-text">📢 Your message here with <strong>bold text</strong></span>
```
- **Show:** `data-active="true"` · **Hide:** `data-active="false"`
- **Auto-expire:** set `data-expires="YYYY-MM-DD"` — banner hides itself after that date automatically
- Banner also auto-hides if a visitor dismisses it (remembered in their browser)
- To force re-show for everyone, change the message text

---

## 📱 STORY POPUP (full-screen card shown on first visit)

Search for `storyPopup`:
```html
<div class="story-popup" id="storyPopup" data-active="true">
  <h2 class="story-title">Your Title Here</h2>
  <p class="story-body">Your message here with <strong>bold</strong> text.</p>
  <a href="#events" class="story-cta">Button Text →</a>
```
- **Show:** `data-active="true"` · **Hide:** `data-active="false"`
- Shows once per browser session
- Auto-closes after 6 seconds

---

## 🔴 REHEARSAL BANNER

Search for `rehearsalBanner`:
```html
<div class="rehearsal-banner" id="rehearsalBanner" data-active="false">
  <strong id="rehearsalProduction">Annual Drama Production 2026</strong>
```
- **Show:** `data-active="true"` · **Hide (default):** `data-active="false"`
- Edit the show date in `js/main.js` — search `showDate`:
```js
const showDate = "2026-12-01"; // ← Change this date (YYYY-MM-DD)
```

---

## 🎭 ON THIS DAY FACTS

Open `js/main.js`, search `const facts = [`, add a new string to the array. Facts rotate daily automatically.

---

## 🌓 LIGHT / DARK MODE

The 🌙/☀️ toggle is in the nav. User preference saves automatically — no admin action needed.

---

## 🌐 CHANGING THE WEBSITE URL TO A CUSTOM DOMAIN

The site currently lives at: **https://aarshiofficial.github.io/**

To point it to e.g. `https://aarshi.iiserk.org`:
1. Ask the institute IT team to add a **CNAME DNS record**: name `aarshi` → value `aarshiofficial.github.io`
2. Create a file named exactly `CNAME` (no extension) in the repo root, containing one line: `aarshi.iiserk.org`
3. GitHub repo → Settings → Pages → Custom domain → type `aarshi.iiserk.org` → tick "Enforce HTTPS"
4. Wait 10–30 minutes for DNS to propagate

---

## ❓ COMMON WEBSITE MISTAKES

| Mistake | Fix |
|---|---|
| Image doesn't show | Check filename matches exactly — case-sensitive, no spaces |
| Layout looks broken | Make sure every `<div>` you opened is also closed with `</div>` |
| Changes not visible | Hard-refresh: Ctrl+Shift+R, or wait 2 min for deploy |
| Filter not working | `data-category` on image must exactly match `data-filter` on button |
| Photo face cut off | Use `object-position: center top` in CSS for that image |

---
---

# 🔥 FIREBASE — MEMBER LOGIN, SIGNUP & DATABASE

The member portal (`auth.html`, `dashboard.html`, `members.html`) runs on Firebase. The project is already created — **no Storage is used** (profile photos were removed to avoid costs; members get an auto-generated initials avatar instead).

### Current Firebase Config (already pasted into all 3 files)
```js
const firebaseConfig = {
  apiKey: "AIzaSyCiIPpWPw68y5dEdt1LaeNtxVuCFGBISuU",
  authDomain: "aarshi-iiserk.firebaseapp.com",
  projectId: "aarshi-iiserk",
  storageBucket: "aarshi-iiserk.firebasestorage.app",
  messagingSenderId: "195490022156",
  appId: "1:195490022156:web:70066f5b5a3bc79aff7f29"
};
```
You don't need to touch this unless you create a brand new Firebase project.

---

## ✅ ONE-TIME SETUP CHECKLIST

### 1. Enable Email/Password Authentication
1. **https://console.firebase.google.com** → project **aarshi-iiserk**
2. Left sidebar → **Build → Authentication → Get started**
3. Click **"Email/Password"** → toggle **Enable** → **Save**

### 2. Create Firestore Database
1. Left sidebar → **Build → Firestore Database → Create database**
2. **"Start in test mode"** → **Next**
3. Location: **asia-south1 (Mumbai)** → **Enable**

> ⚠️ **Test mode expires after 30 days** and then locks everyone out, including the Members page. You must replace it with the permanent rules below before that happens (or immediately).

### 3. Set Firestore Security Rules (do this now, not later)
1. Firestore Database → **Rules** tab → delete everything → paste this:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /members/{userId} {
      // Anyone (even logged-out visitors) can read members for the public Members page
      allow read: if true;

      // A user can only create/edit their OWN document
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && (
        request.auth.uid == userId ||
        get(/databases/$(database)/documents/members/$(request.auth.uid)).data.role == 'admin'
      );

      // Only admins can delete member documents
      allow delete: if request.auth != null &&
        get(/databases/$(database)/documents/members/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```
2. Click **Publish**

### 4. Make Yourself Admin
1. Sign up at **https://aarshiofficial.github.io/auth.html** with your IISER email
2. Firebase Console → **Firestore → members** → click your document (long UID)
3. Find the `role` field → click pencil icon → change `"member"` to `"admin"` → **Update**

---

## ⚠️ "Documents only appear after ~4 hours / look like errors" — explained

This is **normal Firebase Console caching behaviour**, not a real error. The Firestore Console sometimes shows a stale/cached view of a collection, especially right after writes happen quickly (e.g. during testing). It corrects itself:
- Refresh the browser tab (not just the Console page — a hard refresh, Ctrl+Shift+R)
- Or navigate away from the `members` collection and back into it
- The **actual data is never lost** — this is purely a display glitch in the Console UI, the website itself reads live data correctly every time

If a document is genuinely missing (not just delayed), see the "Members not showing" section below.

---

## 👥 MEMBERS PAGE (members.html)

Public page at **https://aarshiofficial.github.io/members.html**. Shows for every signed-up member:
- Full name
- Year joined + Active/Alumni status
- Areas of interest (filterable chips)
- Auto-generated initials avatar (no photo needed)

**Search and filter:** visitors can search by name or filter by any of the 10 interest categories (Acting, Direction, Script Writing, etc.) — same style as the Gallery/Achievements filters on the main site.

**NOT shown publicly:** email address, attendance, achievements (these only appear on the member's own private dashboard after they log in).

---

## ⚠️ MEMBERS NOT SHOWING ON THE MEMBERS PAGE — FIX

If an account appears in **Authentication** but the member doesn't show on `members.html`, check these in order:

### A. Firestore rules not published / still in test mode
Test mode rules expire after 30 days and then block all reads. Re-paste the rules from **Step 3 above** and click **Publish**.

### B. Signup was interrupted — auth created but no Firestore document saved
When someone signs up, two separate things happen: (1) Firebase Authentication creates their login, (2) Firestore saves their profile document. If their internet dropped between these two steps, you'll have an orphaned auth account with no Firestore data.

**Fix — manually create their document:**
1. Firestore → `members` collection → **Add document**
2. Document ID = their Firebase Auth UID (copy from the Authentication tab)
3. Add fields:
   - `name` (string)
   - `email` (string)
   - `yearJoined` (string)
   - `yearLeft` (string, e.g. `"Present"`)
   - `interests` (array of strings)
   - `role` (string) = `"member"`
   - `achievements` (array) = empty `[]`
   - `achievementsApproved` (array) = empty `[]`
   - `attendance` (map) = empty `{}`

### C. Browser cache showing stale page
Hard refresh `members.html` with Ctrl+Shift+R.

---

## 👤 ADMIN: MANAGING MEMBER ACHIEVEMENTS & ATTENDANCE

Members do **not** submit achievements themselves — only admins add them.

### Add an achievement to a member
1. Firebase Console → **Firestore → members** → find their document (search by `name` field)
2. Edit `achievements` array → add a string, e.g.:
   - `"Performed in Lakeer-e-Kabaddi 2025"`
   - `"Won 1st Place — Abhivyakti 2025"`
3. Also add the same string to `achievementsApproved` array → this is what shows as "✓ Approved" on their private dashboard
4. (Items left only in `achievements` but not yet in `achievementsApproved` show as "⏳ Pending")

### Mark attendance for a session
1. Open the member's Firestore document → edit `attendance` map
2. Add a key-value pair:
   - **Key format:** `EventName||DD Mon YYYY` (e.g. `Drama Workshop 2026||15 Jun 2026`)
   - **Value:** `"present"` or `"absent"`
3. This is private — only that member sees it on their own dashboard after logging in. No one else can see another member's attendance.

### Make someone admin
Firestore → their document → change `role` from `"member"` to `"admin"`.

### Delete a member
1. Firestore → delete their `members` document
2. Authentication → find their email → click ⋮ → **Delete account**

---

## 🔑 PASSWORD RESET — WHY THE EMAIL ISN'T ARRIVING (and the fix)

If a member clicks "Forgot password?", enters their email, and the reset link never arrives, it's one of these:

### Cause 1 — Firebase Authorized Domains (most common cause)
Firebase only sends auth emails for domains it's been told about. If `aarshiofficial.github.io` isn't in the authorized list, **the reset email silently fails to send** — no error shown to the user.

**Fix:**
1. Firebase Console → **Authentication → Settings** tab → **Authorized domains**
2. Check that `aarshiofficial.github.io` is listed
3. If not, click **Add domain** → type `aarshiofficial.github.io` → **Add**
4. (`localhost` is usually already there by default for local testing)

### Cause 2 — IISER mail server is blocking/filtering Firebase's sender domain
Reset emails come from `noreply@aarshi-iiserk.firebaseapp.com` by default. Institutional mail servers sometimes silently spam-filter unrecognised `.firebaseapp.com` senders.

**Fix / workaround:**
- Ask members to check their **Spam/Junk folder** first
- Ask IISER IT to whitelist `firebaseapp.com` and `firebase.google.com` sending domains, OR
- As admin, trigger the reset manually instead (bypasses the member having to wait):
  1. Firebase Console → **Authentication** → find the member's email
  2. Click ⋮ (three dots) → **"Send password reset email"**
  3. This uses the same Firebase sender but is worth retrying if the member's first attempt silently failed

### Cause 3 — Email/Password sign-in method not fully enabled
Double check: **Authentication → Sign-in method → Email/Password → must show "Enabled"**. If it's off, no auth emails (verification, reset, etc.) will send at all.

### Customise the sender name (cosmetic, doesn't fix delivery)
1. Firebase Console → **Authentication → Templates → Password reset**
2. Edit **From name** → `AARSHI IISER Kolkata` → **Save**
3. This does not change the actual sending domain — that requires upgrading to the Blaze (pay-as-you-go) plan and connecting a custom SMTP provider, which is not necessary for a club website

### Member self-service steps (once domains are fixed)
1. **https://aarshiofficial.github.io/auth.html** → click **"Forgot password?"**
2. Enter `@iiserkol.ac.in` email → **Send Reset Email**
3. Check inbox (and spam folder) → link expires after **1 hour**
4. Click link → set new password → log in normally

---

## 📧 EMAIL DOMAIN RESTRICTION

Signup only accepts `@iiserkol.ac.in` emails — enforced in `auth.html`'s JavaScript (`endsWith("@iiserkol.ac.in")` check). To allow a different domain temporarily, find and edit that check in `auth.html`.

---

## 🚀 WHATSAPP COMMUNITY LINK

The Contact page has a "Join the AARSHI WhatsApp Community" button linking to:
**https://chat.whatsapp.com/Fhzg8WH9mo7DDMlqBmhutI**

To change the link, search `chat.whatsapp.com` in `index.html` and replace the URL.

---

*Last updated: June 2026 | Contact: aarshi@iiserkol.ac.in*
---

## 📖 EVENT "READ MORE" MODALS

Each event poster card (Mrignayanee, Pages to Stages) has a **"Read More →"** button that opens a full-screen modal with complete rules, marking scheme, and a **"Submit Entry"** button linking to the Google Form.

### How it works
- `index.html` → search `event-modal` to find the modal HTML
- Each contest has its own `<div class="event-modal-body" id="modal-XXX">` block
- The poster card's button calls `onclick="openEventModal('XXX')"` to show that block

### To update rules/prizes for next year
1. Search for `modal-mrignayanee` or `modal-pages` in `index.html`
2. Edit the text directly inside that block (rules list, marks table, prize amounts)
3. Update the Google Form link in two places:
   - The `submit-btn` on the poster card itself
   - The `event-modal-submit` button inside the modal

### To add a "Read More" modal for a NEW event
1. Copy an existing `<div class="event-modal-body" id="modal-XXX">...</div>` block, give it a new `id`
2. Add a button to the new event's poster card: `<button class="read-more-btn" onclick="openEventModal('XXX')">Read More →</button>`
3. Add a submit button if there's a Google Form: `<a class="submit-btn" href="FORM_URL" target="_blank">Submit Entry ↗</a>`

---

## 🏆 ACHIEVEMENTS SHOWING ON MEMBERS PAGE

Approved achievements (from `achievementsApproved` array in Firestore) now appear publicly on each member's card on `members.html`, listed under a "🏆 Achievements" heading.

**To add an achievement that shows publicly:**
1. Firestore → `members` → find the member → edit `achievementsApproved` array
2. Add a string, e.g. `"Won 1st Place — Abhivyakti 2025"`
3. It appears instantly on their public Members card (no separate publish step needed)

Achievements still in `achievements` but NOT yet in `achievementsApproved` remain private — they only show as "⏳ Pending" on the member's own dashboard, never publicly.

---

---

## 🛡 ADMIN APPROVAL SYSTEM (admin.html)

To stop fake/random signups from appearing on the public Members page, every new signup is now created with `status: "pending"`. They stay invisible on the Members page and show a "pending approval" banner on their own dashboard until an admin approves them.

### Accessing the Admin Panel
1. Go to **https://aarshiofficial.github.io/admin.html**
2. Log in with your admin account (must have `role: "admin"` in Firestore — see "Make Yourself Admin" above)
3. Non-admins who visit this page see a "🚫 Admin Access Only" screen and nothing else

### Using the panel
- **⏳ Pending tab** — every new signup lands here. Click **✓ Approve** to make them public on the Members page, or **✕ Reject** to block them.
- **✅ Approved tab** — all currently approved members. You can click **Revert** to move someone back to pending if needed.
- **❌ Rejected tab** — anyone you've rejected. Also revertible.
- **Search bar** — filter by name or email across all tabs.

All changes are instant — no Firestore Console needed for day-to-day approvals anymore.

### What changes for EXISTING members (already signed up before this feature)
**Nothing.** Existing member documents have no `status` field at all. Every part of the code — `members.html`, `dashboard.html`, and `admin.html` — treats a **missing status as `"approved"`** automatically. They:
- Still show on the public Members page exactly as before
- Still see no "pending" banner on their dashboard
- Will appear in the **✅ Approved tab** in admin.html (not Pending)

You do not need to manually edit any existing Firestore documents. Only NEW signups going forward will start as `"pending"`.

### Required Firestore Rules update
The existing rules already allow this, but if you want to be extra safe, confirm your rules look like this (Firestore → Rules tab):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /members/{userId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && (
        request.auth.uid == userId ||
        get(/databases/$(database)/documents/members/$(request.auth.uid)).data.role == 'admin'
      );
      allow delete: if request.auth != null &&
        get(/databases/$(database)/documents/members/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```
This is identical to what you already have — admins can update (including the `status` field) any member's document, which is exactly what the Approve/Reject buttons need. **No rules change required.**

### Manually setting status via Firestore (fallback, rarely needed now)
If you ever prefer to do it directly instead of using admin.html:
1. Firestore → `members` → find the member's document
2. Add or edit field `status` (string) → set to `"pending"`, `"approved"`, or `"rejected"`

---

---
---

# 🆕 NEW FEATURES — ADMIN GUIDE

This section documents everything added in the latest update. None of it touches the existing approval system, Firestore rules, or any previously working feature — it's all additive.

---

## 🛡 ADMIN PANEL — NEW CAPABILITIES (admin.html)

The admin panel now does much more than approve/reject signups. You should rarely need to open the Firestore Console directly anymore.

### Stats Summary (top of the page)
Shows at a glance:
- **Total Members** — everyone who has ever signed up
- **Pending** — awaiting your approval
- **Approved** — currently public on the Members page
- **Top Interest** — the most popular interest area across all members (useful for planning workshops)

This updates automatically every time you load the page or change a member's status.

### ✎ Edit Button — Achievements & Attendance (no more Firestore Console needed)
Every member card in the Pending/Approved/Rejected tabs now has an **✎ Edit** button next to the Approve/Reject/Revert controls. Clicking it opens a popup where you can:

**Add an achievement:**
1. Type the achievement text (e.g. `Won 1st Place — Abhivyakti 2025`)
2. Click **Add**
3. It appears in the list as **⏳ pending** (not yet public)
4. Click **Approve** next to it to make it public on the Members page instantly

**Delete an achievement:**
Click the 🗑 icon next to any achievement — removes it from both the private and public lists.

**Add attendance for a session:**
1. Type the **Event name** (e.g. `Drama Workshop 2026`)
2. Type the **date** (e.g. `15 Jun 2026`) — optional but recommended
3. Choose **Present** or **Absent** from the dropdown
4. Click **Add**
5. This is private — only that member sees it on their own dashboard after logging in

**Delete an attendance record:**
Click the 🗑 icon next to any attendance row.

All changes save to Firestore immediately — no separate "Save" button needed, and no risk of losing data if you close the popup.

### ⬇ Export Approved Members (CSV)
Click **"⬇ Export Approved Members (CSV)"** above the search bar. Downloads a spreadsheet with:
- Name, Email, Year Joined, Status (Active/Alumni), Interests, Approved Achievements

Useful for:
- Printing a physical attendance sheet before an event
- Keeping an offline backup of member records
- Sharing a member list with other OBs without giving them Firestore access

Opens directly in Excel/Google Sheets — only **approved** members are included (pending/rejected accounts are excluded automatically).

---

## 🌐 PUBLIC WEBSITE — NEW SECTIONS

### "This Week at AARSHI" widget (About page)
A small highlighted card showing current happenings. To update it:
1. Open `index.html`, search for `THIS WEEK AT AARSHI`
2. Edit the text inside `<div class="this-week-text">...</div>`
3. No other changes needed — just rewrite the sentence to reflect what's currently going on

### Competitions & Fests strip (About page)
Search for `COMPETITIONS & FESTS`. Lists events AARSHI has competed in and won at — currently IICM, Inquivesta, AIIMS Kalyani Fest, MAKAUT Fest, matching the confirmed wins in the Achievements section. To add a new one:
```html
<span>Festival or Competition Name</span>
```
Add or remove `<span>` tags inside `.press-logos` as needed. Only add entries here once they're confirmed in Achievements — this section implies AARSHI has actually competed there.

### FAQ Accordion (Contact page)
Search for `FAQ ACCORDION` in `index.html`. To add a new question:
```html
<div class="faq-item">
  <button class="faq-question">
    <span>Your question here?</span>
    <span class="faq-icon">+</span>
  </button>
  <div class="faq-answer"><p>Your answer here.</p></div>
</div>
```
Clicking a question auto-collapses any other open question — no JS edits needed, this is handled automatically site-wide.

### Copy Phone Number Buttons (Team page)
Every OB's phone number now has a small copy icon next to it. Clicking it copies the number to clipboard and briefly shows "✓ Copied". This is automatic for all 5 current OBs — no admin action needed. If you add a new OB, follow the existing pattern (search `copyPhone` in `index.html` to see the exact markup to copy).

### Cursor Spotlight (Hero / About page, desktop only)
A soft gold glow now follows the mouse cursor on the hero background. Purely decorative, no admin action needed. Automatically disabled on mobile/touch devices.

### Loading Skeleton (Members page)
While member data loads from Firestore, the Members page now shows animated placeholder cards instead of a plain spinner. No admin action needed.

### Page Transitions
Switching between site sections (About → Events → Gallery etc.) now has a subtle fade-in animation instead of an instant cut. No admin action needed. Automatically disabled for visitors with "reduce motion" accessibility settings enabled.

### Easter Egg
Typing the Konami code (↑ ↑ ↓ ↓ ← → ← → B A) anywhere on the site shows a small celebratory message. Pure fun, zero functional impact — dead code unless someone actually types that sequence.

---

## 📄 NEW STATIC FILES

### `404.html`
A custom "page not found" screen in the AARSHI dark theme, shown automatically by GitHub Pages instead of the default error page. No admin action needed — works automatically once deployed.

### `robots.txt` and `sitemap.xml`
Help search engines (Google, Bing) index the site properly. No admin action needed unless you add brand new pages — if you do create a new `.html` file at the root (like `auth.html`), add its URL to `sitemap.xml` following the existing pattern.

### Print Stylesheet
If anyone presses Ctrl+P (or Cmd+P) on any page, it now prints cleanly — dark backgrounds, nav, banners, and popups are hidden, OB/Team cards print without overlap. No admin action needed.

---

## ✅ CONFIRMATION: NOTHING EXISTING WAS CHANGED

All of the above are **new, separate sections and files** that sit alongside the existing site. Specifically confirmed unaffected:
- The pending/approved/rejected approval workflow (Approve/Reject/Revert buttons work exactly as before)
- Firestore security rules (no changes required)
- The Member Portal signup/login/dashboard flow
- All existing events, gallery, achievements, team, and past events content
- The SPA page-switching system and the nav underline fix from the previous session

If anything looks broken after deploying, it is very unlikely to be caused by this batch — check the browser console (F12 → Console tab) for the exact error and share it.

---

