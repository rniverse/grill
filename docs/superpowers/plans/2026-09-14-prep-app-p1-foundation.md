# Interview Prep App — P1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the design-token/CSS system, icon and i18n boundaries, ULID
helper, topic registry, one real seeded topic (Angular), and a working
`LandingPage` (web-only) rendered through `IconRail` — P1 of the phased build
in the design spec.

**Architecture:** Tailwind v4 CSS-native theming (`variables.css` → raw
tokens, `themes.css` → `@theme inline` mapping, `global.css` → shared rules,
`main.css` → imports only), React function components colocated with their
`.css`, a typed content-registry (`topics.config.ts`) that code-splits topic
data via dynamic `import()`, and two isolation boundaries (`utils/icons.ts`
for the icon library, `utils/i18n.ts` for all user-facing text).

**Tech Stack:** Bun + Vite + React 19 + TypeScript (`erasableSyntaxOnly`,
`verbatimModuleSyntax`, strict unused-locals/params), Tailwind v4,
react-router, lucide-react, ulid, `bun test` + `@testing-library/react` +
`@happy-dom/global-registrator` for component tests.

**Spec:** `docs/superpowers/specs/2026-09-14-prep-app-design.md` (read
alongside `docs/rolling-spec.md` §3 for data shapes and
`docs/design_handoff_prep_app/README.md` for the visual system). This plan
implements the spec's P1 scope only.

## Global Constraints

- No magic CSS values anywhere: every color/space/font/radius/shadow/
  duration/breakpoint is a named custom property in `variables.css`,
  consumed via Tailwind utilities (mapped in `themes.css`) or `var(--token)`.
- No hardcoded user-facing string in any JSX/TSX — every label/placeholder/
  aria-label goes through `t('key')` from `utils/i18n.ts`, resolving
  `src/translate/en.json`.
- Icons only via `utils/icons.ts` — never `import ... from 'lucide-react'`
  in a component.
- Non-component TypeScript files: kebab-case, single word preferred
  (`storage.ts`, not `local-storage.ts`). Components: PascalCase
  folder + file (`QuestionCard/QuestionCard.tsx`), unchanged React
  convention.
- `utils/` = pure, stateless, no external lifecycle. `services/` = external
  system boundary with a lifecycle. No catch-all `lib/`.
- Real TS `enum` is a compile error (`erasableSyntaxOnly: true`). Any enum
  is a `const` object + derived union type in its own `<domain>.enum.ts`
  file, colocated with the module that owns it.
- Clean, named-variable loops over compressed one-liners — readability
  wins the trade every time.
- `bun test` for pure logic; `@testing-library/react` + happy-dom for
  interactive components. A task isn't done until its test passes.

---

### Task 1: Component test infrastructure

**Files:**
- Create: `happy-dom-registrator.ts` (repo root)
- Create: `bunfig.toml`
- Modify: `package.json` (add `test` script, devDependencies)

**Interfaces:**
- Produces: `bun test` runs with a registered DOM (`document`, `window`)
  available to every test file, and React Testing Library's `render`/
  `screen` work inside `bun test`.

- [ ] **Step 1: Install test dependencies**

```bash
bun add -d @happy-dom/global-registrator @testing-library/react @testing-library/dom
```

- [ ] **Step 2: Register happy-dom globals**

Create `happy-dom-registrator.ts`:

```ts
import { GlobalRegistrator } from '@happy-dom/global-registrator'

GlobalRegistrator.register()
```

- [ ] **Step 3: Preload it for every test run**

Create `bunfig.toml`:

```toml
[test]
preload = ["./happy-dom-registrator.ts"]
```

- [ ] **Step 4: Add the `test` script**

In `package.json` `scripts`, add:

```json
"test": "bun test"
```

- [ ] **Step 5: Prove it works with a throwaway smoke test**

Create `src/smoke.test.tsx` temporarily:

```tsx
import { describe, expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'

describe('test infrastructure', () => {
  test('renders into a real DOM', () => {
    render(<div>hello</div>)
    expect(screen.getByText('hello')).toBeDefined()
  })
})
```

Run: `bun test`
Expected: 1 pass.

- [ ] **Step 6: Delete the smoke test and commit**

```bash
rm src/smoke.test.tsx
git add happy-dom-registrator.ts bunfig.toml package.json bun.lock
git commit -m "chore: add bun test + testing-library component test setup"
```

---

### Task 2: Shared content types

**Files:**
- Create: `src/types/topic.types.ts`

**Interfaces:**
- Produces: `ID`, `FileMeta`, `Topic`, `Answer`, `Question`, `Reference` —
  every later task that touches `topics/*`, `references/*`, or
  `topics.config.ts` imports from here.

- [ ] **Step 1: Write the shared shipped-content types**

Per rolling-spec §3 ("Shared" + "Shipped" sections) — this file has no
runtime logic, so no test; it's exercised transitively by Task 6/7's tests.

```ts
export type ID = string // ULID

export interface FileMeta {
  version: string // bumped whenever this file's content changes
  cutOffTime: string // ISO — latest locally-asked question already folded into this version
  updatedAt: string // ISO — last edit to this file
}

export interface Topic {
  id: string // slug, e.g. "angular"
  name: string
}

export interface Answer {
  id: ID
  text: string // markdown, may include mermaid fences
  references: ID[] // Reference ids cited in this answer
  related: ID[] // other Question ids worth reading alongside this one
}

export interface Question {
  id: ID
  question: string
  answer: Answer
  notes?: string // single shipped note, markdown
  tags?: string[]
}

export interface Reference {
  id: ID // what Answer.references points to
  term: string // display label + auto-highlight match string in answer text
  text: string // markdown — the flashcard content shown on click
  notes?: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/topic.types.ts
git commit -m "feat: add shared content types for topics and references"
```

---

### Task 3: Design tokens — `variables.css`

**Files:**
- Create: `src/styles/variables.css`

**Interfaces:**
- Produces: every custom property Tasks 4–13 reference by name.

- [ ] **Step 1: Write the raw token file**

Values transcribed from `docs/design_handoff_prep_app/README.md`'s Design
Tokens table and the chosen `5b`/`3a` design files. Spacing/radius keys use
semantic suffixes (not Tailwind's default numeric spacing scale) so they
add utilities (`p-lg`, `gap-2xs`) without overriding Tailwind's own `p-1`,
`p-2`, etc.

```css
:root {
  /* Color — ground & surface */
  --color-ground: #f4f6f8;
  --color-surface: #ffffff;
  --color-surface-recessed: #fafbfc;
  --color-surface-tinted: #eaf0f6;
  --color-surface-tinted-alt: #eef2f6;

  /* Color — ink */
  --color-ink: #1c1d22;
  --color-ink-body: #3d424b;
  --color-ink-secondary: #6b727b;
  --color-ink-tertiary: #a8b4c0;

  /* Color — accent */
  --color-accent: #82a4bd;
  --color-accent-icon: #5c7d9e;
  --color-accent-text: #3f6285;
  --color-accent-link: #4a7fb5;
  --color-accent-link-hover: #2f5d86;

  /* Color — reference pill, personal highlight */
  --color-reference-pill-bg: #e9f0f7;
  --color-reference-pill-text: #3c6c96;
  --color-personal-highlight: #f7f0dc;
  --color-personal-highlight-alt: #faf6e9;

  /* Color — hairlines & scrim */
  --color-hairline: #eef1f4;
  --color-hairline-alt: #f0f3f6;
  --color-hairline-mobile: #e6eaee;
  --color-scrim: rgba(28, 29, 34, 0.16);

  /* Font families (fontsource-variable naming convention) */
  --font-ui: 'Manrope Variable', system-ui, sans-serif;
  --font-reading: 'Newsreader Variable', Georgia, serif;
  --font-mono: 'JetBrains Mono Variable', monospace;

  /* Type scale */
  --text-page-title: 28px;
  --text-section-title: 22px;
  --text-question: 15.5px;
  --text-body-reading: 16.5px;
  --text-body-reading-mobile: 15.5px;
  --text-secondary: 13.5px;
  --text-meta: 13px;
  --text-label: 11px;
  --text-mono-meta: 12.5px;

  /* Spacing (4px-scale steps from the design handoff) */
  --space-2xs: 4px;
  --space-xs: 6px;
  --space-sm: 8px;
  --space-ms: 10px;
  --space-md: 14px;
  --space-base: 16px;
  --space-lg: 18px;
  --space-xl: 22px;
  --space-2xl: 26px;
  --space-3xl: 30px;
  --space-4xl: 44px;

  /* Radius */
  --radius-xs: 6px;
  --radius-logo-tile: 11px;
  --radius-icon: 13px;
  --radius-control: 14px;
  --radius-row: 16px;
  --radius-card: 24px;
  --radius-chip: 999px;

  /* Shadow */
  --shadow-card-raised: 0 10px 34px rgba(33, 27, 47, 0.07);
  --shadow-popup: 0 6px 20px rgba(33, 27, 47, 0.08);
  --shadow-modal: 0 24px 60px rgba(33, 27, 47, 0.16);
  --shadow-drawer: 14px 0 38px rgba(33, 27, 47, 0.14);

  /* Easing & duration */
  --ease-pop: cubic-bezier(0.2, 0.8, 0.3, 1);
  --duration-pop: 0.2s;
  --duration-fade: 0.18s;
  --duration-slide: 0.24s;
  --duration-sheet: 0.26s;

  /* Breakpoints (px) — nav rail responsive rules */
  --bp-mobile: 700px;
  --bp-nav-panel: 980px;
  --bp-personal-rail: 1140px;

  /* Z-index */
  --z-overlay: 40;
  --z-drawer: 50;
  --z-popup: 60;
  --z-modal: 70;
}
```

- [ ] **Step 2: Verify with a value check**

Run:

```bash
grep -c -- "--color-ink:" src/styles/variables.css
```

Expected: `1`.

- [ ] **Step 3: Commit**

```bash
git add src/styles/variables.css
git commit -m "feat: add design token variables.css"
```

---

### Task 4: Theme mapping — `themes.css`

**Files:**
- Create: `src/styles/themes.css`

**Interfaces:**
- Consumes: every `--color-*`/`--font-*`/`--space-*`/`--radius-*`/
  `--shadow-*`/`--bp-*` token from Task 3.
- Produces: Tailwind utilities (`bg-ground`, `text-ink`, `font-ui`,
  `p-lg`, `rounded-row`, `shadow-card-raised`, `nav-panel:hidden`) usable
  by every component task.

- [ ] **Step 1: Write the `@theme inline` mapping**

Keeps shadcn's existing semantic tokens (`--background`, `--primary`,
etc., defined further down in `main.css`'s carried-over `:root`/`.dark`
blocks — untouched, still used by `components/ui/*`) separate from this
project's own design tokens; this file only maps the latter.

```css
@theme inline {
  --color-ground: var(--color-ground);
  --color-surface: var(--color-surface);
  --color-surface-recessed: var(--color-surface-recessed);
  --color-surface-tinted: var(--color-surface-tinted);
  --color-surface-tinted-alt: var(--color-surface-tinted-alt);
  --color-ink: var(--color-ink);
  --color-ink-body: var(--color-ink-body);
  --color-ink-secondary: var(--color-ink-secondary);
  --color-ink-tertiary: var(--color-ink-tertiary);
  --color-accent: var(--color-accent);
  --color-accent-icon: var(--color-accent-icon);
  --color-accent-text: var(--color-accent-text);
  --color-accent-link: var(--color-accent-link);
  --color-accent-link-hover: var(--color-accent-link-hover);
  --color-reference-pill-bg: var(--color-reference-pill-bg);
  --color-reference-pill-text: var(--color-reference-pill-text);
  --color-personal-highlight: var(--color-personal-highlight);
  --color-personal-highlight-alt: var(--color-personal-highlight-alt);
  --color-hairline: var(--color-hairline);
  --color-hairline-alt: var(--color-hairline-alt);
  --color-hairline-mobile: var(--color-hairline-mobile);
  --color-scrim: var(--color-scrim);

  --font-ui: var(--font-ui);
  --font-reading: var(--font-reading);
  --font-mono: var(--font-mono);

  --text-page-title: var(--text-page-title);
  --text-section-title: var(--text-section-title);
  --text-question: var(--text-question);
  --text-body-reading: var(--text-body-reading);
  --text-body-reading-mobile: var(--text-body-reading-mobile);
  --text-secondary: var(--text-secondary);
  --text-meta: var(--text-meta);
  --text-label: var(--text-label);
  --text-mono-meta: var(--text-mono-meta);

  --spacing-2xs: var(--space-2xs);
  --spacing-xs: var(--space-xs);
  --spacing-sm: var(--space-sm);
  --spacing-ms: var(--space-ms);
  --spacing-md: var(--space-md);
  --spacing-base: var(--space-base);
  --spacing-lg: var(--space-lg);
  --spacing-xl: var(--space-xl);
  --spacing-2xl: var(--space-2xl);
  --spacing-3xl: var(--space-3xl);
  --spacing-4xl: var(--space-4xl);

  --radius-xs: var(--radius-xs);
  --radius-logo-tile: var(--radius-logo-tile);
  --radius-icon: var(--radius-icon);
  --radius-control: var(--radius-control);
  --radius-row: var(--radius-row);
  --radius-card: var(--radius-card);
  --radius-chip: var(--radius-chip);

  --shadow-card-raised: var(--shadow-card-raised);
  --shadow-popup: var(--shadow-popup);
  --shadow-modal: var(--shadow-modal);
  --shadow-drawer: var(--shadow-drawer);

  --breakpoint-mobile: var(--bp-mobile);
  --breakpoint-nav-panel: var(--bp-nav-panel);
  --breakpoint-personal-rail: var(--bp-personal-rail);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/themes.css
git commit -m "feat: map design tokens into Tailwind theme"
```

---

### Task 5: Shared rules — `global.css`

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Write base rules and shared keyframes**

The four keyframes from the design handoff, each used by ≥2 components in
later phases (popup open, generic fades, the nav drawer, the mobile
sheet) — defined once here rather than per-component.

```css
html {
  font-family: var(--font-ui);
}

body {
  margin: 0;
  background: var(--color-ground);
  color: var(--color-ink);
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes sheetUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add shared base rules and keyframes"
```

---

### Task 6: Font swap + `main.css` assembly

**Files:**
- Modify: `package.json` (font deps)
- Modify: `src/styles/main.css` (full rewrite)

**Interfaces:**
- Consumes: `variables.css`, `themes.css`, `global.css` (Tasks 3–5).

- [ ] **Step 1: Swap font packages**

```bash
bun remove @fontsource-variable/inter
bun add @fontsource-variable/manrope @fontsource-variable/newsreader @fontsource-variable/jetbrains-mono
```

- [ ] **Step 2: Rewrite `main.css` to imports only**

Replace the entire contents of `src/styles/main.css`:

```css
@import 'tailwindcss';
@import 'tw-animate-css';
@import 'shadcn/tailwind.css';
@import '@fontsource-variable/manrope';
@import '@fontsource-variable/newsreader';
@import '@fontsource-variable/jetbrains-mono';
@import './variables.css';
@import './themes.css';
@import './global.css';

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@theme inline {
  --font-heading: var(--font-ui);
  --font-sans: var(--font-ui);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --color-foreground: var(--foreground);
  --color-background: var(--background);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}
```

Note: shadcn's own semantic tokens (`--background`/`--primary`/etc.) and
`--font-sans` are kept as-is — nothing in P1 uses shadcn's `Button`, so
repointing shadcn's palette to this project's design system is out of
scope here (do it when a shadcn component is actually styled against the
design, later phase). `--font-heading`/`--font-sans` are repointed to
`--font-ui` since Manrope replaces Inter as the UI typeface.

- [ ] **Step 3: Verify the build**

```bash
bun run build
```

Expected: exits 0, no CSS or TS errors.

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock src/styles/main.css
git commit -m "feat: swap Inter for Manrope/Newsreader/JetBrains Mono, assemble main.css"
```

---

### Task 7: Icon library boundary

**Files:**
- Modify: `package.json` (icon deps)
- Modify: `components.json` (`iconLibrary`)
- Create: `src/utils/icons.ts`
- Test: `src/utils/icons.test.ts`

**Interfaces:**
- Produces: named icon exports — `LogoIcon`, `TopicsIcon`,
  `ReferencesIcon`, `BookmarksIcon`, `QuestionsIcon`, `NotesIcon`,
  `ExportIcon`, `SearchIcon`, `ImportIcon` — every later component imports
  icons only from here.

- [ ] **Step 1: Swap icon packages**

```bash
bun remove @hugeicons/react @hugeicons/core-free-icons
bun add lucide-react
```

- [ ] **Step 2: Update `components.json`**

In `components.json`, change:

```json
"iconLibrary": "hugeicons",
```

to:

```json
"iconLibrary": "lucide",
```

- [ ] **Step 3: Write the failing test**

Create `src/utils/icons.test.ts`:

```ts
import { describe, expect, test } from 'bun:test'
import * as icons from './icons'

describe('icons', () => {
  test('exports every icon P1 needs', () => {
    const expectedNames = [
      'LogoIcon',
      'TopicsIcon',
      'ReferencesIcon',
      'BookmarksIcon',
      'QuestionsIcon',
      'NotesIcon',
      'ExportIcon',
      'SearchIcon',
      'ImportIcon',
    ]

    for (const name of expectedNames) {
      expect(icons[name as keyof typeof icons]).toBeDefined()
    }
  })
})
```

- [ ] **Step 4: Run test, verify it fails**

Run: `bun test src/utils/icons.test.ts`
Expected: FAIL — `./icons` module doesn't exist yet.

- [ ] **Step 5: Write `utils/icons.ts`**

Names match the icon rail's rows (design handoff Navigation section:
`layers` logo, `layout-grid` Topics, `library` References, `bookmark`
Bookmarks, `message-circle-question` My questions, `pencil` My notes,
`download` export) plus the landing page's `search`/`import` controls.

```ts
export {
  Layers as LogoIcon,
  LayoutGrid as TopicsIcon,
  Library as ReferencesIcon,
  Bookmark as BookmarksIcon,
  MessageCircleQuestion as QuestionsIcon,
  Pencil as NotesIcon,
  Download as ExportIcon,
  Search as SearchIcon,
  Import as ImportIcon,
} from 'lucide-react'
```

- [ ] **Step 6: Run test, verify it passes**

Run: `bun test src/utils/icons.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add package.json bun.lock components.json src/utils/icons.ts src/utils/icons.test.ts
git commit -m "feat: switch icon library from hugeicons to lucide"
```

---

### Task 8: `utils/id.ts` — ULID generator

**Files:**
- Create: `src/utils/id.ts`
- Test: `src/utils/id.test.ts`

**Interfaces:**
- Produces: `generateId(): ID` — the one place anything in this app mints
  a new ID.

- [ ] **Step 1: Install ulid**

```bash
bun add ulid
```

- [ ] **Step 2: Write the failing test**

Create `src/utils/id.test.ts`:

```ts
import { describe, expect, test } from 'bun:test'
import { generateId } from './id'

describe('generateId', () => {
  test('returns a 26-character ULID', () => {
    const id = generateId()
    expect(id).toHaveLength(26)
  })

  test('returns a different id on each call', () => {
    const first = generateId()
    const second = generateId()
    expect(first).not.toBe(second)
  })
})
```

- [ ] **Step 3: Run test, verify it fails**

Run: `bun test src/utils/id.test.ts`
Expected: FAIL — `./id` module doesn't exist.

- [ ] **Step 4: Write `utils/id.ts`**

```ts
import { ulid } from 'ulid'
import type { ID } from '@/types/topic.types'

export function generateId(): ID {
  return ulid()
}
```

- [ ] **Step 5: Run test, verify it passes**

Run: `bun test src/utils/id.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json bun.lock src/utils/id.ts src/utils/id.test.ts
git commit -m "feat: add shared ULID generator"
```

---

### Task 9: `utils/i18n.ts` + `translate/en.json`

**Files:**
- Create: `src/translate/en.json`
- Create: `src/utils/i18n.ts`
- Test: `src/utils/i18n.test.ts`

**Interfaces:**
- Produces: `t(key: TranslationKey, vars?: Record<string, string | number>): string`
  and the `TranslationKey` union type. Every later component task's
  strings are added here first.

- [ ] **Step 1: Write the initial translation keys**

Only what P1's `LandingPage`/`IconRail` need — later tasks/phases add
more keys to this same file, never inline strings.

Create `src/translate/en.json`:

```json
{
  "landing.contents": "Contents",
  "landing.summary": "{{topics}} topics · {{questions}} questions · {{references}} references",
  "landing.search": "Search",
  "landing.import": "Import",
  "nav.topics": "Topics",
  "nav.references": "References",
  "nav.bookmarks": "Bookmarks",
  "nav.myQuestions": "My questions",
  "nav.myNotes": "My notes",
  "nav.export": "Export personal layer"
}
```

- [ ] **Step 2: Write the failing test**

Create `src/utils/i18n.test.ts`:

```ts
import { describe, expect, test } from 'bun:test'
import { t } from './i18n'

describe('t', () => {
  test('resolves a plain key', () => {
    expect(t('landing.contents')).toBe('Contents')
  })

  test('interpolates placeholders from vars', () => {
    const result = t('landing.summary', { topics: 1, questions: 30, references: 5 })
    expect(result).toBe('1 topics · 30 questions · 5 references')
  })
})
```

- [ ] **Step 3: Run test, verify it fails**

Run: `bun test src/utils/i18n.test.ts`
Expected: FAIL — `./i18n` module doesn't exist.

- [ ] **Step 4: Write `utils/i18n.ts`**

```ts
import en from '@/translate/en.json'

export type TranslationKey = keyof typeof en

type TranslationVars = Record<string, string | number>

export function t(key: TranslationKey, vars?: TranslationVars): string {
  const template = en[key]

  if (!vars) {
    return template
  }

  let result = template
  for (const [name, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${name}}}`, String(value))
  }
  return result
}
```

- [ ] **Step 5: Run test, verify it passes**

Run: `bun test src/utils/i18n.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/translate/en.json src/utils/i18n.ts src/utils/i18n.test.ts
git commit -m "feat: add i18n lookup and initial translation keys"
```

---

### Task 10: `topics.config.ts` — topic registry

**Files:**
- Create: `src/topics.config.ts`
- Test: `src/topics.config.test.ts`

**Interfaces:**
- Consumes: `Topic`, `FileMeta`, `Question` (Task 2); `topics/angular.ts`
  (Task 11, code-split via dynamic `import()`).
- Produces: `topicsConfig: TopicConfigEntry[]`, `TopicModule` type — the
  registry `LandingPage` (Task 13) reads to list topics.

- [ ] **Step 1: Write the failing test**

Create `src/topics.config.test.ts`. This exercises the real dynamic
`import()`, not a mock — the whole point of the registry is that the
loader actually resolves.

```ts
import { describe, expect, test } from 'bun:test'
import { topicsConfig } from './topics.config'

describe('topicsConfig', () => {
  test('has one entry for angular', () => {
    expect(topicsConfig).toHaveLength(1)
    expect(topicsConfig[0].id).toBe('angular')
    expect(topicsConfig[0].name).toBe('Angular')
  })

  test('load() resolves the real topic module', async () => {
    const entry = topicsConfig[0]
    const loaded = await entry.load()

    expect(loaded.topic.id).toBe('angular')
    expect(typeof loaded.meta.version).toBe('string')
    expect(loaded.questions.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `bun test src/topics.config.test.ts`
Expected: FAIL — `./topics.config` doesn't exist yet (this task depends on
Task 11's `topics/angular.ts` existing too; do Task 11 first if executing
out of order, or expect this test to stay red until both land).

- [ ] **Step 3: Write `topics.config.ts`**

```ts
import type { FileMeta, Question, Topic } from '@/types/topic.types'

export interface TopicModule {
  topic: Topic
  meta: FileMeta
  questions: Question[]
}

export interface TopicConfigEntry {
  id: string
  name: string
  load: () => Promise<TopicModule>
}

export const topicsConfig: TopicConfigEntry[] = [
  {
    id: 'angular',
    name: 'Angular',
    load: () => import('@/topics/angular'),
  },
]
```

- [ ] **Step 4: Run test, verify it passes**

Run: `bun test src/topics.config.test.ts`
Expected: PASS (once Task 11 has also landed).

- [ ] **Step 5: Commit**

```bash
git add src/topics.config.ts src/topics.config.test.ts
git commit -m "feat: add topic registry with code-split loaders"
```

---

### Task 11: Seed `topics/angular.ts` + `references/angular.ts`

**Files:**
- Create: `src/topics/angular.ts`
- Create: `src/references/angular.ts`
- Test: `src/topics/angular.test.ts`

**Interfaces:**
- Consumes: `Topic`, `FileMeta`, `Question`, `Answer`, `Reference` (Task 2).
- Produces: `topic: Topic`, `meta: FileMeta`, `questions: Question[]` from
  `topics/angular.ts`; `meta: FileMeta`, `references: Reference[]` from
  `references/angular.ts` — consumed by Task 10's registry and Task 13's
  `LandingPage`.

This is a one-time hand-authoring pass (design spec §4) — not a parser.
Source: `data/angular.md` (152 lines, `**Q:**`/`A:` pairs under `## N.
Section` headings, 12 sections, ~30 Q&A pairs). IDs are ULIDs generated
*once* and hardcoded as string literals — they must stay stable across
future edits since personal-layer data (later phases) references them by
id, so never call `generateId()` inline inside these files.

- [ ] **Step 1: Generate stable IDs**

Run once per question and once per reference, pasting each result as a
literal string in the files below (don't run this at import time):

```bash
bun -e "import { ulid } from 'ulid'; console.log(ulid())"
```

- [ ] **Step 2: Write `references/angular.ts`**

Five curated glossary terms (design spec §4's curated list), text
summarized from `data/angular.md`'s own explanations. Replace the
placeholder id strings below with IDs generated in Step 1 (kept here as
readable placeholders only so the pattern is unambiguous — an executor
must replace all five before this compiles-and-passes, since the test in
Step 5 checks for 26-character ULIDs, not these literal strings):

```ts
import type { FileMeta, Reference } from '@/types/topic.types'

export const meta: FileMeta = {
  version: '1.0.0',
  cutOffTime: '2026-09-14T00:00:00.000Z',
  updatedAt: '2026-09-14T00:00:00.000Z',
}

export const references: Reference[] = [
  {
    id: '01JAREFSIGNAL00000000000',
    term: 'Signal',
    text: 'A reactive container around a value that tracks exactly which template bindings read it. When it changes, Angular updates only those specific bindings — fine-grained reactivity — instead of walking the whole component tree.',
  },
  {
    id: '01JAREFONPUSH0000000000',
    term: 'OnPush',
    text: 'A change-detection strategy (`ChangeDetectionStrategy.OnPush`) where a component only re-checks when an `@Input()` reference changes, an event originates inside it, a bound `Observable` emits via the `async` pipe, or a Signal it reads changes. Requires immutable data patterns to work correctly.',
  },
  {
    id: '01JAREFZONEJS000000000',
    term: 'Zone.js',
    text: "Monkey-patches async browser APIs (setTimeout, promises, DOM events, XHR) so Angular knows something happened and runs change detection. Historically Angular's default change-detection trigger; zone-less mode removes it in favor of Signals.",
  },
  {
    id: '01JAREFHYDRATION00000000',
    term: 'Hydration',
    text: 'Reuses server-rendered DOM nodes on the client and attaches event listeners/reactivity to them, instead of discarding and re-rendering from scratch — eliminates the flicker older Angular SSR had.',
  },
  {
    id: '01JAREFNGRX000000000000',
    term: 'NgRx',
    text: 'A Redux-style state management library for Angular — unidirectional data flow, immutable state, actions as the sole trigger for state change, effects for side effects. Pays off at scale; a well-organized service with Signals often covers small-to-medium apps with less boilerplate.',
  },
]
```

- [ ] **Step 3: Write `topics/angular.ts` (worked example — first 3 questions)**

Establishes the exact pattern: `tags` carries the source section name,
`references` links to the glossary ids from Step 2 where a term from
`data/angular.md:9-19` actually appears in that answer's text.

```ts
import type { Answer, FileMeta, Question, Topic } from '@/types/topic.types'
import { references } from '@/references/angular'

const signalRef = references.find((r) => r.term === 'Signal')!
const onPushRef = references.find((r) => r.term === 'OnPush')!
const zoneJsRef = references.find((r) => r.term === 'Zone.js')!

export const topic: Topic = {
  id: 'angular',
  name: 'Angular',
}

export const meta: FileMeta = {
  version: '1.0.0',
  cutOffTime: '2026-09-14T00:00:00.000Z',
  updatedAt: '2026-09-14T00:00:00.000Z',
}

const standaloneAnswer: Answer = {
  id: '01JAQANSSTANDALONE00000',
  text: "A standalone component declares its own dependencies (other components, directives, pipes) directly in its `@Component` decorator's `imports` array, instead of relying on an NgModule to provide that context. This removes a layer of indirection, cuts boilerplate, simplifies lazy loading (you can lazy-load a single component instead of a whole module), and makes the mental model closer to how other modern frameworks work. Since Angular 17, standalone is the default for new projects; NgModules still work and remain common in older/enterprise codebases, but new apps rarely start with them.",
  references: [],
  related: [],
}

const lifecycleAnswer: Answer = {
  id: '01JAQANSLIFECYCLE00000',
  text: "In order: `ngOnChanges` (input-bound property changes), `ngOnInit` (once, after first `ngOnChanges`), `ngDoCheck` (custom change detection), `ngAfterContentInit`/`ngAfterContentChecked` (projected content), `ngAfterViewInit`/`ngAfterViewChecked` (component's own view and children), `ngOnDestroy` (cleanup — unsubscribe, detach listeners). Interviewers increasingly ask this as a stepping stone to a follow-up on *why* `ngOnDestroy` matters (subscription leaks).",
  references: [],
  related: [],
}

const signalsAnswer: Answer = {
  id: '01JAQANSSIGNALS0000000',
  text: 'A Signal is a reactive container around a value that tracks exactly which template bindings read it. When it changes, Angular updates only those specific bindings — fine-grained reactivity — rather than walking the component tree. Observables model async streams over time; Signals model synchronous, glitch-free state. Rule of thumb: use Signals for local/component state, RxJS for async orchestration.',
  references: [signalRef.id],
  related: [],
}

export const questions: Question[] = [
  {
    id: '01JAQSTANDALONE0000000',
    question: "What's the difference between standalone components and NgModules, and why did Angular move away from NgModules?",
    answer: standaloneAnswer,
    tags: ['Fundamentals & Architecture'],
  },
  {
    id: '01JAQLIFECYCLE00000000',
    question: "Explain Angular's component lifecycle hooks.",
    answer: lifecycleAnswer,
    tags: ['Fundamentals & Architecture'],
  },
  {
    id: '01JAQSIGNALS000000000',
    question: 'What are Signals, and how do they differ from Observables/RxJS?',
    answer: signalsAnswer,
    tags: ['Change Detection, Signals & Zone-less Angular'],
  },
]
```

- [ ] **Step 4: Continue the same pattern for the remaining questions**

`data/angular.md` has 12 sections and ~30 Q&A pairs total. Read the file,
and for each remaining `**Q:**`/`A:` pair not yet covered: generate a
fresh ULID (Step 1's command) for the `Answer.id` and `Question.id`, copy
the question text verbatim, copy the answer text verbatim (markdown/code
spans as-is), set `tags: ['<section name>']` from the `## N. Section`
heading it's under, and set `Answer.references` to any of the five
glossary ids (Step 2) whose term appears in that answer's text (e.g. the
zone-less-Angular and OnPush questions in
`data/angular.md:26-42` should link `zoneJsRef.id`/`onPushRef.id`; the
hydration question near the file's end should link the hydration
reference; the NgRx question should link the NgRx reference). Append each
to the `questions` array in the same shape as Step 3's three examples.

- [ ] **Step 5: Write the content-integrity test**

Create `src/topics/angular.test.ts`:

```ts
import { describe, expect, test } from 'bun:test'
import { meta, questions, topic } from './angular'
import { references } from '@/references/angular'

describe('angular topic content', () => {
  test('topic id is angular', () => {
    expect(topic.id).toBe('angular')
  })

  test('meta has valid ISO timestamps', () => {
    expect(Number.isNaN(Date.parse(meta.cutOffTime))).toBe(false)
    expect(Number.isNaN(Date.parse(meta.updatedAt))).toBe(false)
  })

  test('every question id is unique', () => {
    const seenIds = new Set<string>()
    for (const question of questions) {
      expect(seenIds.has(question.id)).toBe(false)
      seenIds.add(question.id)
    }
  })

  test('every reference id is a real 26-character ULID', () => {
    for (const reference of references) {
      expect(reference.id).toHaveLength(26)
    }
  })

  test('every Answer.references id resolves to a real reference', () => {
    const referenceIds = new Set(references.map((r) => r.id))
    for (const question of questions) {
      for (const referenceId of question.answer.references) {
        expect(referenceIds.has(referenceId)).toBe(true)
      }
    }
  })

  test('has at least the three worked-example questions', () => {
    expect(questions.length).toBeGreaterThanOrEqual(3)
  })
})
```

- [ ] **Step 6: Run tests, verify they pass**

Run: `bun test src/topics/angular.test.ts`
Expected: all PASS. If the reference-id-length test fails, the Step-1
placeholder IDs weren't replaced with real generated ULIDs — fix and
rerun.

- [ ] **Step 7: Commit**

```bash
git add src/topics/angular.ts src/references/angular.ts src/topics/angular.test.ts
git commit -m "feat: seed Angular topic and reference content from data/angular.md"
```

---

### Task 12: `IconRail` component

**Files:**
- Create: `src/components/IconRail/rail-section.enum.ts`
- Create: `src/components/IconRail/IconRail.tsx`
- Create: `src/components/IconRail/IconRail.css`
- Test: `src/components/IconRail/IconRail.test.tsx`

**Interfaces:**
- Consumes: icons from `utils/icons.ts` (Task 7), `t()` from `utils/i18n.ts`
  (Task 9) for accessible labels.
- Produces: `<IconRail activeSection={RailSection.Topics} />`, exported
  `RailSection` — later phases (P2+) pass a real active section and wire
  click handlers; P1 renders icons + active-state styling only, no flyout
  panel.

- [ ] **Step 1: Write the rail-section enum**

`erasableSyntaxOnly` forbids the `enum` keyword — this is the project's
standard substitute (design spec §2b).

```ts
export const RailSection = {
  Topics: 'topics',
  References: 'references',
  Bookmarks: 'bookmarks',
  Questions: 'questions',
  Notes: 'notes',
} as const

export type RailSection = (typeof RailSection)[keyof typeof RailSection]
```

- [ ] **Step 2: Write the failing test**

Create `src/components/IconRail/IconRail.test.tsx`:

```tsx
import { describe, expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { IconRail } from './IconRail'
import { RailSection } from './rail-section.enum'

describe('IconRail', () => {
  test('marks the active section button', () => {
    render(<IconRail activeSection={RailSection.Topics} />)

    const topicsButton = screen.getByRole('button', { name: 'Topics' })
    expect(topicsButton.getAttribute('aria-current')).toBe('true')

    const referencesButton = screen.getByRole('button', { name: 'References' })
    expect(referencesButton.getAttribute('aria-current')).toBeNull()
  })

  test('renders one button per rail section plus export', () => {
    render(<IconRail activeSection={RailSection.Topics} />)

    expect(screen.getByRole('button', { name: 'Topics' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'References' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Bookmarks' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'My questions' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'My notes' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Export personal layer' })).toBeDefined()
  })
})
```

- [ ] **Step 3: Run test, verify it fails**

Run: `bun test src/components/IconRail/IconRail.test.tsx`
Expected: FAIL — `./IconRail` doesn't exist.

- [ ] **Step 4: Write `IconRail.css`**

Values from the design handoff's Navigation section and the `3a`/`5b`
design files' rail markup: 60px width, 22px vertical / centered padding,
8px gap between icon buttons, 32px logo tile.

```css
.icon-rail {
  width: 60px;
  padding: var(--space-xl) 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  background: var(--color-ground);
}

.icon-rail__logo {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-logo-tile);
  background: var(--color-accent);
  color: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-ms);
}

.icon-rail__button {
  display: flex;
  padding: var(--space-ms);
  border-radius: var(--radius-icon);
  color: var(--color-ink-tertiary);
  background: transparent;
  border: none;
  cursor: pointer;
}

.icon-rail__button[aria-current='true'] {
  background: var(--color-surface);
  color: var(--color-accent-icon);
}

.icon-rail__export {
  margin-top: auto;
  display: flex;
  padding: var(--space-ms);
  border-radius: var(--radius-icon);
  color: var(--color-ink-tertiary);
  background: transparent;
  border: none;
  cursor: pointer;
}
```

- [ ] **Step 5: Write `IconRail.tsx`**

```tsx
import {
  BookmarksIcon,
  ExportIcon,
  LogoIcon,
  NotesIcon,
  QuestionsIcon,
  ReferencesIcon,
  TopicsIcon,
} from '@/utils/icons'
import { t } from '@/utils/i18n'
import { RailSection } from './rail-section.enum'
import './IconRail.css'

interface RailSectionButton {
  section: RailSection
  label: string
  Icon: typeof TopicsIcon
}

const railSectionButtons: RailSectionButton[] = [
  { section: RailSection.Topics, label: t('nav.topics'), Icon: TopicsIcon },
  { section: RailSection.References, label: t('nav.references'), Icon: ReferencesIcon },
  { section: RailSection.Bookmarks, label: t('nav.bookmarks'), Icon: BookmarksIcon },
  { section: RailSection.Questions, label: t('nav.myQuestions'), Icon: QuestionsIcon },
  { section: RailSection.Notes, label: t('nav.myNotes'), Icon: NotesIcon },
]

export interface IconRailProps {
  activeSection: RailSection
}

export function IconRail({ activeSection }: IconRailProps) {
  return (
    <nav className="icon-rail">
      <div className="icon-rail__logo">
        <LogoIcon size={17} />
      </div>

      {railSectionButtons.map(({ section, label, Icon }) => (
        <button
          key={section}
          type="button"
          className="icon-rail__button"
          aria-label={label}
          aria-current={section === activeSection ? 'true' : undefined}
        >
          <Icon size={18} />
        </button>
      ))}

      <button type="button" className="icon-rail__export" aria-label={t('nav.export')}>
        <ExportIcon size={18} />
      </button>
    </nav>
  )
}
```

- [ ] **Step 6: Run test, verify it passes**

Run: `bun test src/components/IconRail/IconRail.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/IconRail
git commit -m "feat: add IconRail component"
```

---

### Task 13: `LandingPage` (web `5b` only)

**Files:**
- Create: `src/pages/LandingPage/LandingPage.tsx`
- Create: `src/pages/LandingPage/LandingPage.css`
- Create: `src/components/TopicRow/TopicRow.tsx`
- Create: `src/components/TopicRow/TopicRow.css`
- Test: `src/pages/LandingPage/LandingPage.test.tsx`

**Interfaces:**
- Consumes: `topicsConfig` (Task 10), `IconRail`/`RailSection` (Task 12),
  `t()` (Task 9), icons (Task 7).
- Produces: `<LandingPage />` — the app's `/` route (wired in Task 14).

- [ ] **Step 1: Write the failing test**

Loads the real `topicsConfig` (real dynamic import of the seeded Angular
data, not a mock) and asserts the row and summary render from it.

```tsx
import { describe, expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { LandingPage } from './LandingPage'

describe('LandingPage', () => {
  test('renders a row for each configured topic once loaded', async () => {
    render(<LandingPage />)

    const angularRow = await screen.findByText('Angular')
    expect(angularRow).toBeDefined()
  })

  test('renders the CONTENTS label and search/import controls', async () => {
    render(<LandingPage />)

    await screen.findByText('Angular')
    expect(screen.getByText('Contents')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Search' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Import' })).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `bun test src/pages/LandingPage/LandingPage.test.tsx`
Expected: FAIL — `./LandingPage` doesn't exist.

- [ ] **Step 3: Write `TopicRow.css`**

Values from `docs/design_handoff_prep_app/designs/Home Explorations.dc.html`'s
`5b` variant (`mode: 'stacked'`) — fixed 82px height regardless of whether
a description exists, per the design handoff's explicit requirement.

```css
.topic-row {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  height: 82px;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-row);
  overflow: hidden;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}

.topic-row:hover {
  background: var(--color-surface-recessed);
}

.topic-row__ordinal {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-ink-secondary);
  width: 26px;
  flex: 0 0 26px;
}

.topic-row__label {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.topic-row__name {
  font-family: var(--font-ui);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.3;
  color: var(--color-ink);
}

.topic-row__blurb {
  font-family: var(--font-reading);
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--color-ink-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.topic-row__leader {
  flex: 1;
  min-width: 20px;
  height: 1px;
  background: var(--color-hairline-alt);
}

.topic-row__count {
  font-family: var(--font-mono);
  font-size: var(--text-mono-meta);
  color: var(--color-accent-text);
  width: 34px;
  text-align: right;
}
```

- [ ] **Step 4: Write `TopicRow.tsx`**

```tsx
import { Link } from 'react-router'
import './TopicRow.css'

export interface TopicRowProps {
  ordinal: string
  topicId: string
  name: string
  blurb?: string
  questionCount: number
}

export function TopicRow({ ordinal, topicId, name, blurb, questionCount }: TopicRowProps) {
  return (
    <Link to={`/topics/${topicId}`} className="topic-row">
      <span className="topic-row__ordinal">{ordinal}</span>
      <span className="topic-row__label">
        <span className="topic-row__name">{name}</span>
        {blurb ? <span className="topic-row__blurb">{blurb}</span> : null}
      </span>
      <span className="topic-row__leader" />
      <span className="topic-row__count">{questionCount}</span>
    </Link>
  )
}
```

- [ ] **Step 5: Write `LandingPage.css`**

Values from the same `5b` design file: 60px rail + content column with
`20px 20px 20px 6px` padding, white card `24px` radius / `44px 58px`
padding.

```css
.landing-page {
  display: flex;
  height: 100vh;
  background: var(--color-ground);
}

.landing-page__content {
  flex: 1;
  min-width: 0;
  padding: var(--space-xl) var(--space-xl) var(--space-xl) var(--space-sm);
}

.landing-page__card {
  height: 100%;
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: var(--space-4xl) 58px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.landing-page__header {
  display: flex;
  align-items: center;
  gap: var(--space-base);
}

.landing-page__label {
  font-family: var(--font-ui);
  font-size: var(--text-meta);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-tertiary);
}

.landing-page__summary {
  font-family: var(--font-ui);
  font-size: var(--text-meta);
  color: var(--color-ink-secondary);
}

.landing-page__control {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-ms);
  padding: var(--space-ms) var(--space-base);
  border-radius: var(--radius-control);
  background: var(--color-ground);
  color: var(--color-ink-secondary);
  font-size: var(--text-meta);
  border: none;
  cursor: pointer;
}

.landing-page__rows {
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 6: Write `LandingPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { topicsConfig, type TopicModule } from '@/topics.config'
import { t } from '@/utils/i18n'
import { SearchIcon, ImportIcon } from '@/utils/icons'
import { IconRail } from '@/components/IconRail/IconRail'
import { RailSection } from '@/components/IconRail/rail-section.enum'
import { TopicRow } from '@/components/TopicRow/TopicRow'
import './LandingPage.css'

interface LoadedTopic {
  id: string
  name: string
  questionCount: number
  blurb?: string
}

export function LandingPage() {
  const [loadedTopics, setLoadedTopics] = useState<LoadedTopic[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadAllTopics() {
      const modules: TopicModule[] = []
      for (const entry of topicsConfig) {
        const topicModule = await entry.load()
        modules.push(topicModule)
      }

      if (cancelled) {
        return
      }

      const nextLoadedTopics = modules.map((topicModule) => ({
        id: topicModule.topic.id,
        name: topicModule.topic.name,
        questionCount: topicModule.questions.length,
      }))
      setLoadedTopics(nextLoadedTopics)
    }

    loadAllTopics()

    return () => {
      cancelled = true
    }
  }, [])

  const totalQuestions = loadedTopics.reduce((sum, topic) => sum + topic.questionCount, 0)

  return (
    <div className="landing-page">
      <IconRail activeSection={RailSection.Topics} />
      <div className="landing-page__content">
        <div className="landing-page__card">
          <div className="landing-page__header">
            <span className="landing-page__label">{t('landing.contents')}</span>
            <span className="landing-page__summary">
              {t('landing.summary', {
                topics: loadedTopics.length,
                questions: totalQuestions,
                references: 0,
              })}
            </span>
            <button type="button" className="landing-page__control">
              <SearchIcon size={15} />
              <span>{t('landing.search')}</span>
            </button>
            <button type="button" className="landing-page__control">
              <ImportIcon size={15} />
              <span>{t('landing.import')}</span>
            </button>
          </div>
          <div className="landing-page__rows">
            {loadedTopics.map((topic, index) => (
              <TopicRow
                key={topic.id}
                ordinal={String(index + 1).padStart(2, '0')}
                topicId={topic.id}
                name={topic.name}
                blurb={topic.blurb}
                questionCount={topic.questionCount}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Run test, verify it passes**

Run: `bun test src/pages/LandingPage/LandingPage.test.tsx`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/pages/LandingPage src/components/TopicRow
git commit -m "feat: add LandingPage (web 5b) with TopicRow"
```

---

### Task 14: Wire routing in `App.tsx`

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `LandingPage` (Task 13).
- Produces: the mounted route tree — Task for P2 adds the
  `/topics/:topicId` route's real `TopicPage` here.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { App } from './App'

describe('App', () => {
  test('renders LandingPage at /', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    await screen.findByText('Angular')
    expect(screen.getByText('Contents')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `bun test src/App.test.tsx`
Expected: FAIL — `App` isn't a router-aware named export yet.

- [ ] **Step 3: Rewrite `App.tsx`**

```tsx
import { Route, Routes } from 'react-router'
import { LandingPage } from '@/pages/LandingPage/LandingPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
    </Routes>
  )
}
```

- [ ] **Step 4: Wrap the app in a router in `main.tsx`**

Read `src/main.tsx` first to match its exact current structure, then wrap
the existing render tree's root element with `BrowserRouter` and switch
the `App` import to the named export:

```tsx
import { BrowserRouter } from 'react-router'
import { App } from './App'
```

```tsx
<BrowserRouter>
  <App />
</BrowserRouter>
```

- [ ] **Step 5: Run test, verify it passes**

Run: `bun test src/App.test.tsx`
Expected: PASS.

- [ ] **Step 6: Full verification pass**

```bash
bun test
bun run build
```

Expected: every test passes, build exits 0.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/main.tsx src/App.test.tsx
git commit -m "feat: wire LandingPage into router"
```

---

## Plan Self-Review Notes

- **Spec coverage:** all P1 bullet points from the design spec §5 are
  covered — token system (Tasks 3–6), font swap (Task 6), icon swap
  (Task 7), `utils/id.ts` (Task 8), `utils/i18n.ts` + `translate/en.json`
  (Task 9), `topics.config.ts` (Task 10), seeded `topics/angular.ts` +
  `references/angular.ts` (Task 11), `LandingPage` web-only (Task 13),
  `IconRail` icons+active-state (Task 12). Markdown rendering
  (`react-markdown`+`remark-gfm`) and Mermaid, listed in the spec as
  "installed in P1, not deferred," are **not** included here — nothing in
  P1's actual UI (`LandingPage`, `IconRail`) renders question/answer
  markdown yet (that starts in P2's `QuestionCard`). Installing them now
  with no consumer would be dead weight; deferred to the start of P2's
  plan instead, where they're first used.
- **Type consistency:** `TopicModule`/`TopicConfigEntry` (Task 10) match
  the type `LandingPage` (Task 13) destructures (`topic`, `meta`,
  `questions`). `RailSection` (Task 12) is imported with the same name by
  `LandingPage`. Icon export names (Task 7) match every import site (Tasks
  12–13).
- **Two known follow-ups for P2**, not P1 defects: `LandingPage`'s
  `blurb` is always `undefined` (real topic blurb text isn't part of the
  rolling-spec `Topic` shape yet — the design's blurb is decorative copy,
  not modeled data); and clicking a `TopicRow` navigates to
  `/topics/angular`, which has no matching route until P2 adds
  `TopicPage` (React Router renders nothing for an unmatched route,
  not an error — acceptable for a foundation phase).
