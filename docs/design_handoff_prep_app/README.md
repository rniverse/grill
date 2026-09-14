# Handoff: Interview Prep App

## Overview

A personal interview-preparation reference app. Curated question-and-answer content is organised into topics; on top of it sits a **personal layer** the user owns — questions they ask about a specific sentence, notes, and bookmarks — stored separately from the curated content so the curated content can be updated or re-imported without losing personal work.

Two form factors are designed: a **web/desktop** screen (icon rail + content + optional personal rail) and a **mobile** screen (header + list, with a slide-in drawer). Both share one visual system.

## About the Design Files

The files in `designs/` are **design references created in HTML** — prototypes showing intended look and behaviour. They are not production code to copy. The task is to **recreate these designs in the target codebase's environment** using its established patterns and libraries. If no codebase exists yet, choose an appropriate stack (the original spec describes a Bun + Vite + React app with localStorage persistence) and implement the designs there.

Each `.dc.html` file opens directly in a browser. They rely on a small runtime (`designs/support.js`) — treat that as scaffolding for viewing the prototypes, not as something to port.

## Fidelity

**High-fidelity.** Colours, typography, spacing, radii and interaction behaviour are final and should be reproduced closely. Content is placeholder text about front-end topics; real content comes from the user's own files.

---

## Screens / Views

### 1. Landing — topic index (chosen direction: `5b`)

File: `designs/Home Explorations.dc.html`, option `5b` (web) and `5m` (mobile). Options `4a`/`4b`/`4c`/`5a`/`5c` are rejected alternatives kept for reference.

**Purpose:** pick a topic. Nothing else — no progress tracking, no dashboard, no recent activity.

**Web layout**
- Page ground `#f4f6f8`. Left icon rail 60px (see Navigation below). Content area: `padding: 20px 20px 20px 6px`, containing one white card `border-radius: 24px; padding: 44px 58px`.
- Card header row: `display:flex; align-items:center; gap:16px`
  - "CONTENTS" — 13px/700, `letter-spacing: 0.1em`, uppercase, `#a8b4c0`
  - Summary line — 13px, `#6b727b`, e.g. `6 topics · 100 questions · 6 references`
  - Pushed right: Search control and Import control — `padding: 10px 16px; border-radius: 14px; background: #f4f6f8; color: #6b727b; font-size: 13px`, each with a 15px Lucide icon (`search`, `import`); Search also shows a `⌘K` badge in JetBrains Mono 11px `#6b727b`.
- Rows container: `display:flex; flex-direction:column` (no gap — rows are self-spacing).

**Topic row (the key component)**
- `display:flex; align-items:center; gap:18px; height:82px; padding:8px 14px; border-radius:16px; overflow:hidden; cursor:pointer`
- **Height is fixed at 82px whether or not the topic has a description.** This was an explicit requirement. Do not use `min-height` — a two-line row's natural content exceeds it and the rhythm breaks.
- Ordinal: JetBrains Mono 12px, `#6b727b`, fixed `width: 26px`
- Label column: `display:flex; flex-direction:column; gap:3px`
  - Name — Manrope 18px/700, `letter-spacing: -0.02em`, `line-height: 1.3`, `#1c1d22`
  - Description (optional) — Newsreader 14.5px/400, `line-height: 1.5`, `#6b727b`, clamped to **one line** (`-webkit-line-clamp: 1`). Omitted entirely when the topic has no description.
- Leader line: `flex:1; height:1px; background:#f0f3f6`
- Count: JetBrains Mono 12.5px, `#3f6285`, `width: 34px`, right-aligned
- Hover: `background: #fafbfc`

**Mobile layout (`5m`)**
- White ground. Header: logo tile 30px (`#82a4bd`, radius 10, white `layers` icon), "Contents" 22px/700 `letter-spacing:-0.025em`, and two icon buttons pushed right (`import`, `search`) — `padding:9px; border-radius:13px; background:#f4f6f8; color:#5c626b`. Summary line 12.5px `#6b727b` below.
- Rows: `height:82px; padding:8px; gap:14px; border-radius:14px`. Ordinal 11.5px width 22px; name 16.5px/700; description Newsreader 14px clamped to one line; count JetBrains Mono 12px `#3f6285` (no leader line).

---

### 2. Web topic screen — browse and read

File: `designs/Interview Prep App.dc.html`.

**Purpose:** read a topic's questions, expand answers, ask about a selected passage, open reference cards.

**Shell:** `display:flex; height:100vh; background:#f4f6f8`
1. Icon rail + optional panel (see Navigation)
2. `<main>` — `flex:1; overflow-y:auto; padding: 26px 30px 80px`; inner column `max-width: 760px; margin: 0 auto; gap: 22px`
3. Personal rail — `width: 330px`, hidden below 1140px

**Topic header:** title Manrope 28px/700 `letter-spacing:-0.02em`; version JetBrains Mono 12px/600 `#8b9099`; blurb 13.5px `#787d86`.

**Filter chips:** `padding:7px 14px; border-radius:999px; font-size:12.5px; font-weight:600`. Active `background:#ffffff; color:#1c1d22`; inactive transparent, `#8b9099`.

**Question card**
- Collapsed: `background:#ffffff; border-radius:18px; padding:20px 22px`, no shadow.
- Expanded: `border-radius:22px; box-shadow:0 10px 34px rgba(33,27,47,0.07)`.
- Header row: ordinal (JetBrains Mono 12px; `#82a4bd` when open, `#c2c7ce` closed) · question (15.5px/600, `line-height:1.45`) · tags (11px/600 `#9aa0a8`) · bookmark icon · chevron rotating 180° over `.2s`.
- Body appears under a `1px solid #eef1f4` divider, `padding-top:18px; margin-top:16px`.
  - Paragraphs: **Newsreader 16.5px, `line-height: 1.78`, `#3d424b`**, `margin-bottom: 15px`.
  - Code blocks: `background:#f6f8fa; border-radius:14px; padding:14px 16px`, JetBrains Mono 12.5px, `line-height:1.7`, `#39414a`.
  - Note block: `border-radius:16px; padding:14px 16px`. Curated note `background:#f3f7fa`; user's own note `background:#faf6e9`. Label 11px/700 uppercase `letter-spacing:0.07em`; body Newsreader 15.5px `#4a5560`.
  - Related links: 12.5px/600 `#4a7fb5`, hover `#2f5d86`.

**Personal rail (right):** white card `border-radius:22px; padding:20px 18px`. Segmented tabs (Questions / Bookmarks / Notes) in a `#f4f6f8` track, active pill white. Items: `background:#fafbfc; border-radius:16px; padding:14px`, with a kind badge (10.5px/700 uppercase), date in JetBrains Mono 11px, quote chip on `#faf6e9`, and an `x` remove control.

---

### 3. Mobile topic screen

File: `designs/Mobile Explorations.dc.html`, option `1a` (browse) and `1d` (ask). Options `1b`, `1c`, `1e`, `1f` are rejected alternatives.

- Ground `#f4f6f8`. Header: menu button (opens drawer), topic name 17px/700 with `v1.2.0 · 24 questions` in JetBrains Mono 11px below; right side: `library` (references), `bookmark` (filter), `search` — each `padding:9px; border-radius:13px; background:#ffffff`.
- Filter chip row (All + tags + a "Saved" bookmark chip), horizontally scrollable, same chip spec as web.
- Question rows: `padding:16px 0`, separated by `1px solid #e6eaee` (the divider is transparent while that row is expanded). Ordinal, question 15px/600, tag 11px/600, chevron.
- Expanded answer: `padding:14px 0 4px 30px`, Newsreader 15.5px, `line-height:1.75`, `#3d424b`.
- **References screen:** replaces the list when the `library` icon is active — a heading (`REFERENCES · 6`) and a wrapped field of chips: `padding:10px 16px; border-radius:999px; background:#ffffff; font-size:13.5px; font-weight:600; color:#40688c`. Tapping a chip opens the reference card.
- **Drawer:** slides from the left over a `rgba(28,29,34,0.16)` scrim; `width:274px; background:#ffffff; border-radius:40px 28px 28px 40px; padding:28px 18px`; animation `slideIn .24s cubic-bezier(.2,.8,.3,1)`. Contains Topics, then a "Yours" group (References, Bookmarks, My questions, My notes) with counts, then an "Export personal layer" button.

---

## Navigation (chosen direction: `3a`)

File: `designs/Web Nav Explorations.dc.html`, option `3a`. Options `3b` (command-led) and `3c` (outline-as-nav) are rejected alternatives.

**Icon rail** — `width: 60px; padding: 22px 0`, centred column, `gap: 8px`.
- Logo tile 32px, `border-radius:11px; background:#82a4bd`, white `layers` icon.
- Section icons, each `padding:10px; border-radius:13px`, 18px Lucide glyph:
  `layout-grid` Topics · `library` References · `bookmark` Bookmarks · `message-circle-question` My questions · `pencil` My notes.
  Active: `background:#ffffff; color:#5c7d9e`. Inactive: transparent, `#a8b4c0`.
- Below them: `search`. Pinned to the bottom: `download` (export).

**Flyout panel** — lists the contents of the selected section. Title 13px/700, a `chevrons-left` collapse control, then rows: `padding:10px 12px; border-radius:13px; font-size:13.5px; font-weight:600`, count right-aligned in JetBrains Mono 11.5px `#b4bcc4`. Empty state: 12.5px `#b4bcc4`.

**Responsive rules (important — these were bug sources):**
- `≥ 980px`: panel is inline, `width: 232px`, part of the flex row. Defaults to open.
- `< 980px`: panel becomes an overlay — `position:absolute; left:60px; top:0; bottom:0; width:236px; background:#ffffff; border-radius:0 22px 22px 0; box-shadow:14px 0 38px rgba(33,27,47,0.14)`, above a `rgba(28,29,34,0.14)` scrim that dismisses it. **It must default to closed at these widths**, otherwise the scrim swallows every click in the content column on load.
- `< 700px`: rail hidden entirely (mobile layout takes over).
- Right personal rail hidden `< 1140px`.
- Clicking the active section icon collapses the panel; clicking another switches section and keeps it open. The active icon stays marked whether or not the panel is showing.

---

## Interactions & Behaviour

**Expand / collapse an answer** — one open at a time. Chevron rotates 180° (`transform .2s ease`); the card gains its shadow and larger radius.

**Reference terms inside answers** — curated glossary terms are detected in answer text and rendered as inline pills: `background:#e9f0f7; color:#3c6c96; border-radius:6px; padding:1px 3px; margin:0 -1px; font-weight:600`, with `box-decoration-break: clone` so wrapped pills look right. Matching rules that matter:
- Match on **word boundaries only** (so "track" does not match inside "tracked").
- A trailing plural `s` is absorbed into the pill ("Signals" highlights whole).
- Longest term wins; a character already claimed by one match cannot be claimed again.
- Clicking a pill opens the reference card (modal on web, sheet on mobile) with the term, its body text, and Bookmark / Add note actions.

**Ask about a passage** (chosen direction: `1d`) — the core interaction.
1. User selects text in an answer (web: real text selection; mobile: tap a sentence).
2. A small plus button appears just above/right of the selection: `28px; border-radius:10px; background:#ffffff; color:#82a4bd; box-shadow:0 4px 14px rgba(33,27,47,0.12)`. Deliberately quiet — an earlier, heavier accent-filled button was rejected.
3. Tapping it opens the composer popup: `width:342px; background:#ffffff; border-radius:16px; padding:12px; gap:8px; box-shadow:0 6px 20px rgba(33,27,47,0.08)`.
   - Quoted selection — 12px, `#a0a5ad`, clamped to **2 lines** with ellipsis.
   - A `1px #eef1f4` separator.
   - A bare textarea — no background, no padding, no border; `min-height:104px`, 13.5px, `line-height:1.6`. The field should feel like paper, not a form control.
   - Actions right-aligned, **text only**: "Cancel" `#b4b9c0`, "Save" `#5c8bab`, both 12.5px/600. Filled buttons were explicitly rejected as too dominant.
4. On save, the selection stays highlighted in `#f7f0dc` permanently.
5. Tapping a highlighted passage again reopens the popup in **read-only** mode: quote, the saved question text, a `pencil` icon to re-enter edit mode, and the date.
6. Clicking anywhere outside the popup closes it (via a transparent full-frame catcher beneath the popup).

**Bookmarks** — toggle on any question or reference; icon swaps `bookmark` ⇄ `bookmark-check` and takes the accent colour.

**Animations**
- `popIn`: `opacity 0 → 1`, `translateY(6–10px) → 0`, `.16–.22s cubic-bezier(.2,.8,.3,1)`
- `fadeIn`: `.18s ease`
- `slideIn` (drawer): `translateX(-100%) → 0`, `.24s cubic-bezier(.2,.8,.3,1)`
- `sheetUp` (mobile sheet): `translateY(100%) → 0`, `.26s cubic-bezier(.2,.8,.3,1)`

---

## State Management

Per the original spec, curated content is read-only and the personal layer is user-owned; keep them in separate stores so content can be re-imported without touching personal data.

**Curated (read-only):** topics (`id`, `name`, `description?`, `version`, `questionCount`), questions (`id`, `topicId`, `question`, `answer`, `tags[]`, `relatedIds[]`, `note?`), references (`id`, `term`, `label`, `text`).

**Personal (persisted — localStorage in the prototype):**
- `askedQuestions`: `{ id, questionId, quote, text, createdAt, updatedAt }` — `quote` is the exact selected substring, used to re-highlight and to re-open in read-only mode.
- `notes`: `{ id, targetType: 'question'|'reference', targetId, text, updatedAt }`
- `bookmarks`: `{ id, targetType, targetId, createdAt }`

**UI state:** selected topic · open question id · active filter chip · active rail section · panel open/closed · personal-rail tab · ask popup phase (`idle` → `plus` → `compose` → `view`) · current selection text and coordinates · open reference.

**Export / import:** the personal layer serialises to JSON. Import merges by `questionId` + `quote`. The rail's bottom `download` icon and the landing page's Import control are the entry points.

---

## Design Tokens

**Colour**
| Token | Value | Use |
|---|---|---|
| Page ground | `#f4f6f8` | app background |
| Surface | `#ffffff` | cards, panels, drawer |
| Surface, recessed | `#fafbfc` | list items inside white cards |
| Surface, tinted | `#eaf0f6` / `#eef2f6` | callouts, icon tiles |
| Ink | `#1c1d22` | headings, primary UI text |
| Ink, body | `#3d424b` | answer prose |
| Ink, secondary | `#6b727b` | descriptions, metadata (minimum for readable text) |
| Ink, tertiary | `#a8b4c0` | section labels only, never body text |
| Accent | `#82a4bd` | logo, active states, plus button |
| Accent, text | `#3f6285` | counts and accent-coloured text (passes 4.5:1) |
| Accent, link | `#4a7fb5` → `#2f5d86` hover | inline links |
| Reference pill | bg `#e9f0f7`, text `#3c6c96` | glossary terms |
| Personal highlight | `#f7f0dc` / `#faf6e9` | user-asked passages, user notes |
| Hairline | `#eef1f4` / `#f0f3f6` / `#e6eaee` | dividers, leader lines |
| Scrim | `rgba(28,29,34,0.14–0.20)` | overlays, often with `backdrop-filter: blur(3px)` |

**Type** — Google Fonts.
- UI: **Manrope** 400/500/600/700/800.
- Reading: **Newsreader** 400/500/600 — all answer prose, reference bodies, notes, topic descriptions. This split was chosen deliberately: Manrope is a display sans and tiring over paragraphs.
- Mono: **JetBrains Mono** 400/500 — versions, counts, dates, code.
- Scale: page title 28 · card/section title 20–22 · question 15–15.5 · body 16.5 (web) / 15.5 (mobile) · secondary 13–13.5 · label 11 uppercase `letter-spacing: 0.07–0.1em` · mono meta 11–12.5.
- Headings use `letter-spacing: -0.02em`; prose uses `text-wrap: pretty`.

**Spacing** — 4px base: 4 · 6 · 8 · 10 · 14 · 16 · 18 · 22 · 26 · 30 · 44.

**Radius** — 6 (inline pill) · 9–11 (icon button) · 13–14 (small control) · 16–18 (list item, popup) · 20–24 (card, panel) · 26–28 (modal, frame) · 40 (phone shell) · 999 (chip).

**Shadow**
- Card, raised: `0 10px 34px rgba(33,27,47,0.07)`
- Popup: `0 6px 20px rgba(33,27,47,0.08)`
- Modal: `0 24px 60px rgba(33,27,47,0.16)`
- Drawer: `14px 0 38px rgba(33,27,47,0.14)`

**Rules the design must keep**
- No outlines or borders as decoration. Separation comes from colour, space, and — only where genuinely needed — a 1px hairline.
- Rounded corners everywhere; nothing sharp unless unavoidable.
- Body-size text must clear 4.5:1 against its ground. `#a8b4c0` and lighter are for uppercase section labels only.
- Fixed row heights on the landing index regardless of whether a description exists.

---

## Assets

- **Icons:** [Lucide](https://lucide.dev) — `layers`, `layout-grid`, `library`, `bookmark`, `bookmark-check`, `message-circle-question`, `pencil`, `search`, `download`, `import`, `plus`, `x`, `chevron-down`, `chevrons-left`, `chevrons-up-down`, `sticky-note`, `component`, `braces`, `network`, `file-code`, `binary`, `messages-square`. Sizes 13–20px, matched to control size.
- **Fonts:** Google Fonts — Manrope, Newsreader, JetBrains Mono.
- No images, illustrations or emoji anywhere in the design.

## Files

| File | Contains |
|---|---|
| `designs/Home Explorations.dc.html` | Landing page. **`5b`** (web) and **`5m`** (mobile) are the chosen directions; `4a`/`4b`/`4c`/`5a`/`5c` are alternatives. |
| `designs/Interview Prep App.dc.html` | Full web topic screen — rail, question list, expanded answers, reference modal, ask flow, personal rail. |
| `designs/Mobile Explorations.dc.html` | Mobile screens. **`1a`** (browse, filters, references, drawer) and **`1d`** (ask flow) are chosen; `1b`/`1c`/`1e`/`1f` are alternatives. |
| `designs/Web Nav Explorations.dc.html` | Navigation studies. **`3a`** is the chosen direction. |
| `designs/Type Explorations.dc.html` | Typography studies. **`2a`** (Manrope + Newsreader) is the chosen pairing. |
| `designs/support.js` | Runtime needed to open the prototypes in a browser. Not part of the implementation. |

### Screenshots

| File | Shows |
|---|---|
| `screenshots/01-landing-web-5b.png` | Landing index, web (`5b`) |
| `screenshots/02-landing-mobile-5m.png` | Landing index, mobile (`5m`) |
| `screenshots/03-topic-web.png` | Web topic screen — rail, expanded answer, reference pills, personal rail |
| `screenshots/04-topic-mobile-1a.png` | Mobile topic screen — filters, list, expanded answer (`1a`) |
| `screenshots/05-ask-flow-mobile-1d.png` | Ask-about-a-passage flow (`1d`) |
| `screenshots/06-nav-rail-3a.png` | Icon rail with flyout panel (`3a`) |

## Not yet designed

Dark mode, note editor, search results, and the export/merge workflow beyond its entry points.
