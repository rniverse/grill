# Interview Prep App — Design Spec

Status: approved pending final user sign-off. Builds on `docs/rolling-spec.md`
(idea, tech stack, data models, folder structure, content workflow — unchanged
here except where this doc says otherwise) and
`docs/design_handoff_prep_app/README.md` (visual system, screens,
interactions, design tokens). Read both before implementing; this doc doesn't
repeat what they already settle.

---

## 1. What this doc adds

The rolling spec and design handoff answer "what to build." This doc answers
four things they leave open:

1. How the CSS/design-token system is structured (user requirement: no magic
   values anywhere — every color/space/font/radius/shadow/duration/breakpoint
   is a named token in one place, consumed everywhere else).
2. How icons and user-facing text are sourced (single icon-library boundary;
   no hardcoded strings, everything through an i18n key).
3. The concrete folder layout, updated for that token system and for pieces
   the design handoff introduced that the original rolling-spec folder list
   (§5) didn't have (nav rail, flyout panel, landing page).
4. Build phasing and content-seeding approach, so the first implementation
   plan has a bounded scope instead of the whole app at once.

---

## 2. CSS & Design Token Architecture

Four files under `src/styles/`, each with one job:

| File | Contains |
|---|---|
| `variables.css` | Raw tokens only, as `:root` custom properties. Every color, font family/size/weight/letter-spacing/line-height, spacing step, radius step, shadow, easing curve, animation duration, breakpoint (px), z-index layer. Nothing else — no selectors, no component rules. |
| `themes.css` | Tailwind v4's `@theme inline { ... }` block, mapping `variables.css` tokens to Tailwind theme keys (`--color-*`, `--font-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--breakpoint-*`) so they're usable as ordinary Tailwind utility classes (`bg-ink`, `rounded-card`, `nav:hidden`). Also where a future dark theme's overrides would live (not built now — see §5). |
| `global.css` | Rules shared across ≥2 components: `html`/`body` base, shared `@keyframes` (`popIn`, `fadeIn`, `slideIn`, `sheetUp` — each used by multiple components per the design handoff), scrollbar resets. |
| `main.css` | Imports only — `variables.css`, `themes.css`, `global.css`, `tailwindcss`, `tw-animate-css`, shadcn's base css. No rules of its own. Replaces the current all-in-one `src/styles/main.css`. |

`src/index.css` keeps its current single line (`@import "./styles/main.css"`).

**Component-local styles:** every component is a folder,
`components/Foo/Foo.tsx` + `components/Foo/Foo.css`, imported by the
component file. Default to Tailwind utility classes built on the mapped
theme tokens (`p-[var(--space-md)]`, `text-[13px]` → `text-meta` once
sized as a token, etc.). Drop into `Foo.css` only for what utilities can't
express cleanly — keyframe animation usage, `box-decoration-break`,
multi-state pseudo-selector chains. Even there, values are `var(--token)`
references, never literals. shadcn's own `components/ui/*` primitives are
left as shadcn generates them (flat, no colocated `.css`) — they're
generated/updated via the shadcn CLI, not hand-maintained like the rest.

**Breakpoints as tokens:** Tailwind v4 accepts `--breakpoint-*` as theme
keys, which is what makes the three breakpoints from the nav spec
(`700px`, `980px`, `1140px`) expressible as ordinary responsive utility
variants instead of hand-written `@media (min-width: 980px)` blocks copied
into multiple component files. `variables.css` defines the raw px values;
`themes.css` maps them to named breakpoints (e.g. `--breakpoint-nav-panel`,
`--breakpoint-personal-rail`); components use the generated variant
(`nav-panel:static`, `personal-rail:flex`) rather than a literal media
query. A hand-written `@media` in a component `.css` file is a last resort,
and if used must reference the matching `variables.css` value in a comment
so the two can't silently drift.

**Naming convention:** `--<category>-<role>[-<state>]`, e.g.
`--color-ink`, `--color-ink-secondary`, `--color-accent`,
`--color-accent-hover`, `--space-3` (the 4px-scale steps from the design
handoff: 4·6·8·10·14·16·18·22·26·30·44), `--radius-card`, `--radius-chip`,
`--shadow-card-raised`, `--ease-pop`, `--duration-pop`. The design
handoff's "Design Tokens" table (colour/type/spacing/radius/shadow) is the
canonical source for the first pass; any additional one-off value found
while implementing a screen (the handoff has more distinct greys than its
summary table lists, e.g. per-component text colors called out in prose)
gets added to `variables.css` under this same convention rather than
inlined — the table is a floor, not a ceiling.

**Icons:** switch `components.json` `iconLibrary` from `hugeicons` to
`lucide`; install `lucide-react`; remove `@hugeicons/react` and
`@hugeicons/core-free-icons`. `src/lib/icons.ts` re-exports every icon
actually used, under our own names (`export { Search as SearchIcon } from
'lucide-react'`, etc. — or thin wrapper components if per-icon sizing
becomes repetitive). Every component imports icons from `lib/icons.ts`
only, never from `lucide-react` directly — one file to touch if the icon
library ever changes, matching how `lib/` already isolates other external
surfaces (ULID gen, localStorage). Icon list per the design handoff's
Assets section.

**Fonts:** install `@fontsource-variable/manrope`,
`@fontsource-variable/newsreader`, `@fontsource-variable/jetbrains-mono`;
remove `@fontsource-variable/inter`. Font-family tokens
(`--font-ui`, `--font-reading`, `--font-mono`) live in `variables.css`,
mapped in `themes.css` to `--font-sans`/`--font-serif`/`--font-mono` (or
equivalent named Tailwind theme keys) — no component references a font
family by name directly.

---

## 2a. Internationalization

`src/translate/en.json` — a flat `{ "key": "text" }` map, dot-namespaced
keys (`"landing.contents"`, `"nav.export"`, `"ask.cancel"`). `src/lib/i18n.ts`
exposes `t(key: TranslationKey, vars?: Record<string, string | number>)`,
default/only locale `en` for now. A value needing a runtime value uses
`{{placeholder}}` tokens (`"landing.summary": "{{topics}} topics ·
{{questions}} questions · {{references}} references"`), substituted by
`t()`. No JSX/TSX file contains a literal user-facing string — every label,
button, placeholder, empty state, aria-label goes through `t()`. Adding a
language later is adding `translate/<locale>.json` and a locale switch in
`lib/i18n.ts`; no component changes needed.

`TranslationKey` is a union type generated from `en.json`'s keys (e.g. via
`keyof typeof en`) so a typo'd or removed key is a compile error, not a
runtime blank string.

---

## 3. Folder Structure

Extends rolling-spec §5. Everything not listed here is unchanged from that
doc.

```
src/
  styles/
    variables.css
    themes.css
    global.css
    main.css
  topics/
    angular.ts
    nodejs.ts
  references/
    angular.ts
    nodejs.ts
  topics.config.ts
  translate/
    en.json
  lib/
    id.ts
    icons.ts
    i18n.ts
    localStorage.ts
    textSelection.ts
    highlightMatch.ts
  components/
    ui/                        # shadcn-generated primitives, untouched pattern
    IconRail/
      IconRail.tsx
      IconRail.css
    FlyoutPanel/
      FlyoutPanel.tsx
      FlyoutPanel.css
    TopicRow/                  # landing page row
      TopicRow.tsx
      TopicRow.css
    QuestionCard/
      QuestionCard.tsx
      QuestionCard.css
    ReferenceBadge/
      ReferenceBadge.tsx
      ReferenceBadge.css
    SelectionPlusButton/
      SelectionPlusButton.tsx
      SelectionPlusButton.css
    AskQuestionPopover/
      AskQuestionPopover.tsx
      AskQuestionPopover.css
    PendingHighlight/
      PendingHighlight.tsx
      PendingHighlight.css
    PendingQuestionsPanel/
      PendingQuestionsPanel.tsx
      PendingQuestionsPanel.css
    NoteView/
      NoteView.tsx
      NoteView.css
    NoteEditor/
      NoteEditor.tsx
      NoteEditor.css
    BookmarkButton/
      BookmarkButton.tsx
      BookmarkButton.css
  pages/
    LandingPage/
      LandingPage.tsx
      LandingPage.css
    TopicPage/
      TopicPage.tsx
      TopicPage.css
  App.tsx                      # route table (react-router)
  main.tsx
  index.css
```

Routes: `/` → `LandingPage` (topic index), `/topics/:topicId` → `TopicPage`.

---

## 4. Content Seeding

Source docs found at repo root `data/angular.md` and `data/nodejs.md` — real
Q&A content, two different markdown conventions (angular.md: `**Q:**`/`A:`
pairs under `## N. Section` headings; nodejs.md: `### QN.` headers, some
`**A:**` bold, some answers wrapped in `<details>`, code fences throughout).

This is a one-time hand-authoring pass, not runtime parsing: read each
source file, write the corresponding `topics/<id>.ts` /
`references/<id>.ts` typed data files per the rolling-spec §3 shapes. No
markdown-to-TS conversion script — the two source docs are structured too
differently to make a shared parser worth it for a one-time job, and
hand-authoring lets tags/related-question links/reference associations get
set deliberately rather than guessed.

**References gap:** neither source doc marks glossary terms explicitly.
`references/<topic>.ts` will be a curated subset — terms worth their own
flashcard, chosen while transcribing each topic (e.g. for Angular: Signal,
OnPush, Zone.js, hydration, NgRx; for Node.js: event loop, libuv,
process.nextTick, Worker Threads, Cluster). Not exhaustive on the first
pass — more references can be added in later content-update passes per
rolling-spec §6.

---

## 5. Build Phases

Each phase is independently reviewable/shippable, per user direction.

- **P1 — Foundation.** `variables.css`/`themes.css`/`global.css`/`main.css`
  token system; font + icon swap; `lib/id.ts` (ULID); `lib/icons.ts`;
  `lib/i18n.ts` + `translate/en.json`; `topics.config.ts`; seed
  `topics/angular.ts` + `references/angular.ts` (one topic first, proves the
  shape before repeating for nodejs); `LandingPage` (web `5b` layout only —
  mobile `5m` deferred to P4); `IconRail` (icons + active state, no flyout
  panel logic yet).
- **P2 — Topic screen, read-only.** `TopicPage` web layout, `QuestionCard`
  expand/collapse, filter chips, `ReferenceBadge` highlight-and-popover,
  reference modal. Seed `topics/nodejs.ts` + `references/nodejs.ts`. No
  personal layer yet — no ask-flow, no notes, no bookmarks.
- **P3 — Personal layer.** `lib/localStorage.ts`, `lib/textSelection.ts`,
  `lib/highlightMatch.ts`; `SelectionPlusButton` → `AskQuestionPopover` →
  `PendingHighlight` flow; `PersonalNote` via `NoteEditor` (MDXEditor);
  `BookmarkButton`; personal rail on `TopicPage`; `PendingQuestionsPanel`;
  export/import JSON.
- **P4 — Mobile + nav polish.** Mobile layouts for landing (`5m`) and topic
  screen (`1a`/`1d`), `FlyoutPanel` + responsive collapse rules, drawer.

Markdown rendering (`react-markdown` + `remark-gfm`) and Mermaid are needed
starting P1 (answer text renders as markdown from the first screen with
real content) — installed in P1, not deferred. MDXEditor is P3-only
(personal notes are the only thing it edits).

---

## 6. Out of scope (per design handoff)

Dark mode, note editor for curated content (curated notes are read-only per
rolling-spec §3), search results UI, export/merge workflow beyond its entry
points (download/import buttons wired, the merge-back-into-source-files
step is a manual workflow per rolling-spec §6, not app UI).
