# P2 — Topic Screen (Read-Only) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the read-only topic screen — the page a `TopicRow` click currently
goes nowhere from. A visitor can open a topic, read every question, expand one to
see its full markdown answer with auto-highlighted reference terms, click a term
to see its flashcard definition in a modal, and filter the question list by tag.

**Architecture:** One new route (`/topics/:topicId`) rendering `TopicPage`, which
loads the topic's `TopicModule`/`ReferencesModule` via the existing
`topicsConfig` registry (same pattern `LandingPage` already uses), then composes
`FilterChips` + a list of `QuestionCard`. Each `QuestionCard` renders its answer
through a new shared `AnswerBody` component (react-markdown + remark-gfm +
mermaid + reference-term highlighting), which both `QuestionCard` and
`ReferenceModal` reuse. No personal layer (no bookmarking, no ask-flow, no
notes) — that is P3.

**Tech Stack:** React 19, TypeScript (`strict: true`), Tailwind v4 token CSS
(no Tailwind utility classes — see Global Constraints), `react-router` v8,
`react-markdown` + `remark-gfm` (new), `mermaid` (new), Bun test +
`@testing-library/react`.

**Spec:** `docs/superpowers/specs/2026-09-14-prep-app-design.md` (§5 "P2 — Topic
screen, read-only" for scope; the rest of the spec for conventions). Design
source of truth for exact layout/values: `docs/design_handoff_prep_app/designs/Interview Prep App.dc.html`
— this is the full interactive prototype; P2 uses its `<aside>` (icon rail,
already built) + `<main>` (topic content) + the `flash` reference modal.
Everything else in that file (personal rail `<aside>`, `plus`/`ask` popovers,
bookmark icon, "Related" links, inline shipped notes) is out of scope — see
Scope Decisions below.

## Global Constraints

- No magic values: every color/font/space/radius/shadow/size/duration used in
  a `.css` file is a `var(--token)` defined in `src/styles/variables.css`.
  Reuse an existing token when the semantic and the value both match; add a
  new token (documented in the task below) when either differs — this
  repo already has near-duplicate tokens for visually-similar-but-distinct
  values (e.g. `--color-hairline` / `--color-hairline-alt`), so do not
  consolidate on your own judgment.
- No hardcoded user-facing text in JSX. Every string the user reads is a key
  in `src/translate/en.json`, resolved via `t(key, vars?)` from `@/utils/i18n`.
- Components are PascalCase folders (`ComponentName/ComponentName.tsx` +
  colocated `ComponentName.css`). Non-component TS files (utils, enums,
  types) are kebab-case.
- Enums live in their own `<name>.enum.ts` file as a `const` object + derived
  union type (no TS `enum` keyword — `erasableSyntaxOnly` is on).
- Readability over cleverness: named intermediate values, explicit loops,
  no one-liners doing multi-step work.
- Bun test + `@testing-library/react`; RTL cleanup is already global via
  `bunfig.toml`'s preload — no per-file cleanup needed.
- ULIDs for content IDs are hardcoded string literals in the seed files,
  never generated at module load. Generate them once with
  `bun -e "import('ulid').then(({ ulid }) => console.log(ulid()))"` and paste
  the literal string in.
- `topics/<id>.ts` and `references/<id>.ts` content is **verbatim** from the
  matching `data/<id>.md` question/answer text (formatting adapted to
  markdown syntax, wording untouched) — never paraphrased. Reference
  (flashcard) definitions are new authored content, same as `references/angular.ts`
  was — there is no glossary section in the source `.md` files.

## Scope Decisions

These resolve gaps between the full-app prototype (which shows the whole
personal-layer experience) and the spec's explicit P2 bullet list. Recorded
here instead of left ambiguous for the implementer:

1. **No bookmark button, no "Related" links, no inline shipped-note block.**
   The prototype's `QuestionCard` shows all three. Spec's P2 list is
   "`TopicPage` web layout, `QuestionCard` expand/collapse, filter chips,
   `ReferenceBadge` highlight-and-popover, reference modal" — bookmarking is
   explicitly P3 (`BookmarkButton`). "Related" links and shipped notes use
   `Question.related`/`Question.notes` fields that exist in the type but are
   empty/unset in every seeded question today (verified — zero content to
   render); building UI for a field with no data anywhere is speculative.
   Both are cheap to add in a later phase once content exists.
2. **Markdown + Mermaid installed now, not in P1.** The design spec says
   these are "needed starting P1 (answer text renders as markdown from the
   first screen with real content)" — but P1's only screen was the landing
   page, which never renders `Answer.text`. `TopicPage` is the actual first
   consumer, so Task 1 installs and wires them here.
3. **Filter tags are computed from the loaded topic's data, not hardcoded.**
   The prototype hardcodes `['All', 'reactivity', 'core', ...]` for the
   Angular demo. The real app derives the tag list from
   `topicModule.questions[].tags` at runtime (`'All'` prepended) so it works
   for any topic, including the new `nodejs` one this plan seeds.
4. **`ReferenceBadge` and `ReferenceModal` are separate components** even
   though the prototype inlines both into one file — this repo's convention
   (`ComponentName/ComponentName.tsx`) is one exported component per folder,
   already established by `IconRail`/`TopicRow`.

---

### Task 1: Install markdown/mermaid dependencies and add P2 design tokens

**Files:**
- Modify: `package.json` (via `bun add` / `bunx shadcn add`)
- Modify: `src/styles/variables.css`
- Create (CLI-generated): `src/components/ui/dialog.tsx`,
  `src/components/ui/toggle-group.tsx`

**Interfaces:**
- Produces: every token listed below, consumed by Tasks 2-8. The generated
  `ui/dialog.tsx` and `ui/toggle-group.tsx` are consumed by Task 3
  (`FilterChips`) and Task 5 (`ReferenceModal`).

- [ ] **Step 1: Install dependencies**

```bash
bun add react-markdown remark-gfm mermaid
bunx shadcn@latest add dialog toggle-group
```

`react-markdown` v9+ ships its own TypeScript types; no `@types/*` package
needed. Confirm `bun.lock` updated.

The shadcn CLI writes `src/components/ui/dialog.tsx` and
`src/components/ui/toggle-group.tsx`. This project's shadcn style
(`base-mira`, see `components.json`) is built on `@base-ui/react`, not
Radix — its exact exported component names differ from the Radix-based
examples in shadcn's own docs. **Read the generated files before using
them** (Tasks 3 and 5 below); adapt the usage shown there to whatever
those files actually export rather than assuming Radix naming.

- [ ] **Step 2: Add new tokens to `src/styles/variables.css`**

Insert each group next to its matching existing group (color tokens next to
`/* Color — ink */`, etc.) — do not create a new top-level section unless
noted. Every value below is transcribed from
`docs/design_handoff_prep_app/designs/Interview Prep App.dc.html`.

Add to the `/* Color — ink */` group:
```css
  --color-ink-muted: #8b9099; /* topic version tag, filter/tag secondary text */
  --color-ink-faint: #9aa0a8; /* question tag labels */
  --color-ink-blurb: #787d86; /* topic page blurb line */
```

Add to the `/* Color — reference pill, personal highlight */` group:
```css
  --color-code-bg: #f6f8fa;
  --color-code-ink: #39414a;
```

(Do not add a token for the prototype's shipped-note background — Scope
Decision 1 defers that UI entirely, and this plan adds only tokens its own
tasks consume.)

Add a new group after `/* Shadow */`:
```css
  /* Type scale — topic page */
  --text-topic-version: 12px;
  --text-card-ordinal: 12px;
  --text-tag: 11px;
```

Add to `/* Spacing */` group:
```css
  --space-topic-header: 10px;
  --space-card-pad-block: 20px;
  --space-card-pad-inline: 22px;
  --space-topic-content-bottom: 80px;
```

Add to `/* Radius */` group:
```css
  --radius-card-collapsed: 18px;
  --radius-card-open: 22px;
```

`--radius-chip` (999px), `--shadow-card-raised`
(`0 10px 34px rgba(33, 27, 47, 0.07)`), `--duration-pop` (0.2s),
`--color-hairline`, `--text-page-title` (28px), `--text-secondary` (13.5px),
`--text-question` (15.5px), `--font-mono`, `--font-ui`, `--font-reading`,
`--space-2xl` (26px), `--space-3xl` (30px), `--space-xl` (22px),
`--space-sm` (8px), `--space-md` (14px), `--space-lg` (18px) already exist —
reuse them directly, do not redefine.

- [ ] **Step 3: Verify build**

```bash
bun run build
```
Expected: succeeds (no unused-token lint exists, so an unconsumed token
would not fail the build — but there should be none after Step 2's
correction).

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock components.json src/components/ui src/styles/variables.css
git commit -m "feat: install markdown/mermaid/shadcn deps and add P2 design tokens"
```

---

### Task 2: `utils/reference-match.ts` — find reference-term spans in text

Pure function, no React. Given a plain string and the list of `Reference`
objects an answer is allowed to cite, finds every non-overlapping,
case-insensitive, word-boundary occurrence of each reference's `term`,
preferring longer terms over shorter ones when they overlap (e.g. "Worker
Threads" must win over a hypothetical "Worker").

**Files:**
- Create: `src/utils/reference-match.ts`
- Test: `src/utils/reference-match.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface ReferenceMatch {
    start: number
    end: number
    reference: Reference
  }
  export function findReferenceMatches(text: string, references: Reference[]): ReferenceMatch[]
  ```
  Consumed by Task 4 (`AnswerBody`).
- Consumes: `Reference` from `@/types/topic.types`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, test } from 'bun:test'
import { findReferenceMatches } from './reference-match'
import type { Reference } from '@/types/topic.types'

function ref(term: string): Reference {
  return { id: `id-${term}`, term, text: `definition of ${term}` }
}

describe('findReferenceMatches', () => {
  test('finds a single case-insensitive match', () => {
    const matches = findReferenceMatches('The Buffer type wraps raw memory.', [ref('buffer')])
    expect(matches).toEqual([{ start: 4, end: 10, reference: ref('buffer') }])
  })

  test('does not match inside a larger word', () => {
    const matches = findReferenceMatches('Buffering is not the same as a Buffer.', [ref('Buffer')])
    expect(matches).toHaveLength(1)
    expect(matches[0]!.start).toBe(32)
  })

  test('prefers the longer overlapping term', () => {
    const matches = findReferenceMatches('Reach for Worker Threads here.', [ref('Worker'), ref('Worker Threads')])
    expect(matches).toHaveLength(1)
    expect(matches[0]!.reference.term).toBe('Worker Threads')
  })

  test('finds multiple distinct terms in order', () => {
    const text = 'The Event Loop hands CPU work to libuv.'
    const matches = findReferenceMatches(text, [ref('Event Loop'), ref('libuv')])
    expect(matches.map((m) => m.reference.term)).toEqual(['Event Loop', 'libuv'])
  })

  test('returns nothing when no reference is cited', () => {
    expect(findReferenceMatches('Plain text with no terms.', [])).toEqual([])
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `bun test src/utils/reference-match.test.ts`
Expected: FAIL — `reference-match` module not found.

- [ ] **Step 3: Implement**

```ts
import type { Reference } from '@/types/topic.types'

export interface ReferenceMatch {
  start: number
  end: number
  reference: Reference
}

const WORD_CHAR = /[A-Za-z0-9_]/

function isWordChar(char: string | undefined): boolean {
  return char !== undefined && WORD_CHAR.test(char)
}

export function findReferenceMatches(text: string, references: Reference[]): ReferenceMatch[] {
  const lowerText = text.toLowerCase()
  const takenPositions = new Array<boolean>(text.length).fill(false)
  const referencesByLength = [...references].sort((a, b) => b.term.length - a.term.length)

  const matches: ReferenceMatch[] = []

  for (const reference of referencesByLength) {
    const lowerTerm = reference.term.toLowerCase()
    let searchFrom = 0

    while (searchFrom <= lowerText.length) {
      const start = lowerText.indexOf(lowerTerm, searchFrom)
      if (start === -1) {
        break
      }
      const end = start + lowerTerm.length
      searchFrom = end

      const hasWordBoundary = !isWordChar(lowerText[start - 1]) && !isWordChar(lowerText[end])
      if (!hasWordBoundary) {
        continue
      }

      let overlapsExistingMatch = false
      for (let position = start; position < end; position++) {
        if (takenPositions[position]) {
          overlapsExistingMatch = true
          break
        }
      }
      if (overlapsExistingMatch) {
        continue
      }

      for (let position = start; position < end; position++) {
        takenPositions[position] = true
      }
      matches.push({ start, end, reference })
    }
  }

  matches.sort((a, b) => a.start - b.start)
  return matches
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `bun test src/utils/reference-match.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/utils/reference-match.ts src/utils/reference-match.test.ts
git commit -m "feat: add reference-term matching util"
```

---

### Task 3: `ReferenceBadge` + `FilterChips` components

Batched as one implementer dispatch — both are small, independent,
presentational components with no shared code, reviewed together as one
unit (per `superpowers:subagent-driven-development`'s same-shape-small-work
guidance).

`ReferenceBadge` is the clickable inline highlighted span inside answer
text — presentational only, no matching logic of its own, no shadcn
primitive fits an inline text-flow badge so it stays hand-rolled.

`FilterChips` is a single-select tag filter — this is exactly what
shadcn's `ToggleGroup` (`type="single"`) is for, so it wraps that instead
of a hand-rolled button row.

**Files:**
- Create: `src/components/ReferenceBadge/ReferenceBadge.tsx`
- Create: `src/components/ReferenceBadge/ReferenceBadge.css`
- Create: `src/components/FilterChips/FilterChips.tsx`
- Create: `src/components/FilterChips/FilterChips.css`
- Test: `src/components/FilterChips/FilterChips.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  export interface ReferenceBadgeProps {
    label: string
    onSelect: () => void
  }
  export function ReferenceBadge({ label, onSelect }: ReferenceBadgeProps): JSX.Element

  export interface FilterChipsProps {
    tags: string[]
    active: string
    onSelect: (tag: string) => void
  }
  export function FilterChips({ tags, active, onSelect }: FilterChipsProps): JSX.Element
  ```
  `ReferenceBadge` consumed by Task 4 (`AnswerBody`). `FilterChips`
  consumed by Task 7 (`TopicPage`).
- Consumes (for `FilterChips`): whatever `src/components/ui/toggle-group.tsx`
  exports (generated by Task 1's `bunx shadcn add toggle-group` — **read
  that file first**, its root/item component names are Base UI-backed, not
  necessarily the Radix `ToggleGroup`/`ToggleGroupItem` names shadcn's own
  docs show).

#### `ReferenceBadge`

- [ ] **Step 1: Implement the component**

```tsx
import './ReferenceBadge.css'

export interface ReferenceBadgeProps {
  label: string
  onSelect: () => void
}

export function ReferenceBadge({ label, onSelect }: ReferenceBadgeProps) {
  return (
    <button type="button" className="reference-badge" onClick={onSelect}>
      {label}
    </button>
  )
}
```

- [ ] **Step 2: Write the CSS**

```css
.reference-badge {
  display: inline;
  border: none;
  background: var(--color-reference-pill-bg);
  color: var(--color-reference-pill-text);
  border-radius: var(--radius-xs);
  padding: 1px 4px;
  margin: 0 -1px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}
```

#### `FilterChips`

Built on the generated `src/components/ui/toggle-group.tsx` (single-select
mode). **Read that file first** — the import names below
(`ToggleGroup`/`ToggleGroupItem`) are shadcn's conventional export names;
if the generated file exports different names, use those instead and note
the substitution in the implementer report.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { FilterChips } from './FilterChips'

describe('FilterChips', () => {
  test('renders a toggle per tag and marks the active one pressed', () => {
    render(<FilterChips tags={['All', 'core']} active="core" onSelect={() => {}} />)

    const activeButton = screen.getByRole('radio', { name: 'core' })
    expect(activeButton.getAttribute('aria-checked')).toBe('true')
    const inactiveButton = screen.getByRole('radio', { name: 'All' })
    expect(inactiveButton.getAttribute('aria-checked')).toBe('false')
  })
})
```

`role="radio"`/`aria-checked` is Base UI's single-select `ToggleGroup`
accessibility mapping (a single-select group of toggles is a radio group
semantically). If the generated component instead exposes
`aria-pressed`/`role="button"` for single-select, adjust this test to match
— confirm by inspecting the rendered DOM once the component is wired, not
by guessing.

- [ ] **Step 2: Run to verify it fails**

Run: `bun test src/components/FilterChips/FilterChips.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import './FilterChips.css'

export interface FilterChipsProps {
  tags: string[]
  active: string
  onSelect: (tag: string) => void
}

export function FilterChips({ tags, active, onSelect }: FilterChipsProps) {
  return (
    <ToggleGroup
      type="single"
      className="filter-chips"
      value={active}
      onValueChange={(value) => {
        if (value) {
          onSelect(value)
        }
      }}
    >
      {tags.map((tag) => (
        <ToggleGroupItem key={tag} value={tag} className="filter-chips__chip">
          {tag}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
```

`onValueChange`'s exact signature (a single string vs. an array) and
whether re-selecting the active item can emit an empty value both depend
on the generated component — adjust the guard above once you've read its
source; the intent is "clicking the already-active chip is a no-op, never
clears the filter."

```css
.filter-chips {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.filter-chips__chip {
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-chip);
  border: none;
  background: transparent;
  color: var(--color-ink-tertiary);
  font-family: var(--font-ui);
  font-size: var(--text-mono-meta);
  font-weight: 600;
  cursor: pointer;
}

.filter-chips__chip[data-state='on'] {
  background: var(--color-surface);
  color: var(--color-ink);
}
```

`[data-state='on']` is the conventional shadcn/Base UI toggle selector for
"currently active." If the generated component marks state differently
(e.g. `aria-checked='true'`), use that attribute selector instead.

- [ ] **Step 4: Run to verify it passes**

Run: `bun test src/components/FilterChips/FilterChips.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit both components**

```bash
git add src/components/ReferenceBadge src/components/FilterChips
git commit -m "feat: add ReferenceBadge and FilterChips components"
```

---

### Task 4: `AnswerBody` component — markdown + mermaid + reference highlighting

The shared rendering surface for any `Reference`/`Answer` markdown text.
Used by `QuestionCard` (with the answer's cited references, for
highlighting) and `ReferenceModal` (with an empty reference list — a
flashcard's own body does not self-highlight).

**Files:**
- Create: `src/components/AnswerBody/AnswerBody.tsx`
- Create: `src/components/AnswerBody/AnswerBody.css`
- Test: `src/components/AnswerBody/AnswerBody.test.tsx`

**Interfaces:**
- Consumes: `findReferenceMatches` from `@/utils/reference-match` (Task 2),
  `ReferenceBadge` from `@/components/ReferenceBadge/ReferenceBadge` (Task 3),
  `Reference` from `@/types/topic.types`.
- Produces:
  ```ts
  export interface AnswerBodyProps {
    text: string
    references: Reference[]
    onReferenceSelect: (reference: Reference) => void
  }
  export function AnswerBody({ text, references, onReferenceSelect }: AnswerBodyProps): JSX.Element
  ```
  Consumed by Task 6 (`QuestionCard`) and Task 5 (`ReferenceModal`).

- [ ] **Step 1: Write the failing tests**

```tsx
import { describe, expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { AnswerBody } from './AnswerBody'
import type { Reference } from '@/types/topic.types'

const bufferRef: Reference = { id: 'r1', term: 'Buffer', text: 'A raw-memory container.' }

describe('AnswerBody', () => {
  test('renders markdown paragraphs', () => {
    render(<AnswerBody text="Plain **bold** text." references={[]} onReferenceSelect={() => {}} />)
    expect(screen.getByText('bold').tagName).toBe('STRONG')
  })

  test('renders a fenced code block', () => {
    render(<AnswerBody text={'```js\nconst x = 1;\n```'} references={[]} onReferenceSelect={() => {}} />)
    expect(screen.getByText('const x = 1;').closest('pre')).not.toBeNull()
  })

  test('highlights a cited reference term as a clickable badge', () => {
    render(
      <AnswerBody text="A Buffer holds raw bytes." references={[bufferRef]} onReferenceSelect={() => {}} />,
    )
    expect(screen.getByRole('button', { name: 'Buffer' })).toBeDefined()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `bun test src/components/AnswerBody/AnswerBody.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Reasoning for the approach: `react-markdown` gives each block-level element
(`p`, `li`) its rendered `children` as a mix of plain strings and nested
React nodes (for `**bold**`, inline `` `code` ``, etc). Reference-term
highlighting only needs to run over the plain-string children — a term
inside an already-nested element (e.g. inside inline code) is left alone.
This is a deliberate, documented limitation, not an oversight.

```tsx
import { type ReactNode, Fragment } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Reference } from '@/types/topic.types'
import { findReferenceMatches } from '@/utils/reference-match'
import { ReferenceBadge } from '@/components/ReferenceBadge/ReferenceBadge'
import './AnswerBody.css'

export interface AnswerBodyProps {
  text: string
  references: Reference[]
  onReferenceSelect: (reference: Reference) => void
}

function highlightNode(node: ReactNode, references: Reference[], onReferenceSelect: (reference: Reference) => void, keyPrefix: string): ReactNode {
  if (typeof node !== 'string' || references.length === 0) {
    return node
  }

  const matches = findReferenceMatches(node, references)
  if (matches.length === 0) {
    return node
  }

  const pieces: ReactNode[] = []
  let cursor = 0
  matches.forEach((match, index) => {
    if (match.start > cursor) {
      pieces.push(node.slice(cursor, match.start))
    }
    pieces.push(
      <ReferenceBadge
        key={`${keyPrefix}-${index}`}
        label={node.slice(match.start, match.end)}
        onSelect={() => onReferenceSelect(match.reference)}
      />,
    )
    cursor = match.end
  })
  if (cursor < node.length) {
    pieces.push(node.slice(cursor))
  }

  return <Fragment>{pieces}</Fragment>
}

function highlightChildren(children: ReactNode, references: Reference[], onReferenceSelect: (reference: Reference) => void, keyPrefix: string): ReactNode {
  const childArray = Array.isArray(children) ? children : [children]
  return childArray.map((child, index) => (
    <Fragment key={index}>{highlightNode(child, references, onReferenceSelect, `${keyPrefix}-${index}`)}</Fragment>
  ))
}

export function AnswerBody({ text, references, onReferenceSelect }: AnswerBodyProps) {
  const components: Components = {
    p: ({ children }) => <p className="answer-body__paragraph">{highlightChildren(children, references, onReferenceSelect, 'p')}</p>,
    li: ({ children }) => <li>{highlightChildren(children, references, onReferenceSelect, 'li')}</li>,
    code: ({ className, children, ...props }) => {
      const isBlock = Boolean(className)
      if (!isBlock) {
        return (
          <code className="answer-body__inline-code" {...props}>
            {children}
          </code>
        )
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    },
    pre: ({ children }) => <pre className="answer-body__code-block">{children}</pre>,
  }

  return (
    <div className="answer-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  )
}
```

- [ ] **Step 4: Write the CSS**

```css
.answer-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  font-family: var(--font-reading);
  font-size: var(--text-body-reading);
  line-height: 1.78;
  color: var(--color-ink-body);
}

.answer-body__paragraph {
  margin: 0;
}

.answer-body__inline-code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--color-code-bg);
  color: var(--color-code-ink);
  border-radius: var(--radius-xs);
  padding: 1px 5px;
}

.answer-body__code-block {
  margin: 0;
  background: var(--color-code-bg);
  color: var(--color-code-ink);
  border-radius: var(--radius-row);
  padding: var(--space-md) var(--space-base);
  font-family: var(--font-mono);
  font-size: var(--text-mono-meta);
  line-height: 1.7;
  overflow-x: auto;
  white-space: pre;
}

.answer-body__code-block code {
  background: none;
  padding: 0;
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `bun test src/components/AnswerBody/AnswerBody.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/AnswerBody
git commit -m "feat: add AnswerBody markdown renderer with reference highlighting"
```

**Mermaid note:** no seeded content currently contains a mermaid fence, so
this task does not wire mermaid rendering yet — doing so with zero content
to verify it against would be unverifiable, dead code. Task 8 (content seed)
re-checks `data/nodejs.md` for a mermaid fence; if one exists, add a
`language-mermaid` branch to the `code`/`pre` components above (dynamic
`import('mermaid')`, render into a ref'd `<div>` on mount) as part of that
task instead of here.

---

### Task 5: `ReferenceModal` component

**Files:**
- Create: `src/components/ReferenceModal/ReferenceModal.tsx`
- Create: `src/components/ReferenceModal/ReferenceModal.css`
- Test: `src/components/ReferenceModal/ReferenceModal.test.tsx`

Built on the generated `src/components/ui/dialog.tsx` — **read that file
first**. shadcn's Dialog gives this for free, over the hand-rolled
scrim/focus-trap/escape-key approach `ReferenceModal` would otherwise need:
click-outside-to-close, Escape-to-close, focus trap while open, focus
restored to the trigger on close, and portal rendering. `ReferenceModal`
only needs to supply the open/close state (driven by `reference`) and the
content.

**Interfaces:**
- Consumes: `AnswerBody` (Task 4), `Reference` from `@/types/topic.types`,
  `t` from `@/utils/i18n`, whatever `src/components/ui/dialog.tsx` exports
  (generated by Task 1 — conventionally `Dialog`/`DialogPortal`/
  `DialogBackdrop`or`DialogOverlay`/`DialogPopup`or`DialogContent`/
  `DialogClose`, but this style is Base UI-backed, not Radix — confirm the
  actual names in the generated file before importing them).
- Produces:
  ```ts
  export interface ReferenceModalProps {
    reference: Reference | null
    onClose: () => void
  }
  export function ReferenceModal({ reference, onClose }: ReferenceModalProps): JSX.Element | null
  ```
  Consumed by Task 7 (`TopicPage`).

- [ ] **Step 1: Add translation keys**

Add to `src/translate/en.json`:
```json
  "reference.eyebrow": "Reference",
  "reference.close": "Close"
```

- [ ] **Step 2: Write the failing test**

```tsx
import { describe, expect, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReferenceModal } from './ReferenceModal'
import type { Reference } from '@/types/topic.types'

const bufferRef: Reference = { id: 'r1', term: 'Buffer', text: 'A raw-memory container.' }

describe('ReferenceModal', () => {
  test('renders nothing when there is no reference', () => {
    const { container } = render(<ReferenceModal reference={null} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders the term and calls onClose from the close button', () => {
    const onClose = () => {
      closed = true
    }
    let closed = false
    render(<ReferenceModal reference={bufferRef} onClose={onClose} />)

    expect(screen.getByText('Buffer')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(closed).toBe(true)
  })

  test('closes on Escape', () => {
    let closed = false
    render(<ReferenceModal reference={bufferRef} onClose={() => (closed = true)} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(closed).toBe(true)
  })
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `bun test src/components/ReferenceModal/ReferenceModal.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement**

The exact import names come from `src/components/ui/dialog.tsx` — the code
below uses shadcn's conventional names as a structural guide (root,
portal+backdrop/overlay, popup/content, close). Substitute the file's real
exports; the shape (open driven by `reference !== null`, backdrop/overlay
and popup/content each take a `className` for our token-based styling,
`DialogClose`-equivalent wraps the close button) should hold regardless of
naming.

```tsx
import type { Reference } from '@/types/topic.types'
import { t } from '@/utils/i18n'
import { AnswerBody } from '@/components/AnswerBody/AnswerBody'
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog'
import './ReferenceModal.css'

export interface ReferenceModalProps {
  reference: Reference | null
  onClose: () => void
}

export function ReferenceModal({ reference, onClose }: ReferenceModalProps) {
  if (!reference) {
    return null
  }

  return (
    <Dialog open={reference !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="reference-modal__overlay" />
        <DialogContent className="reference-modal__content">
          <div className="reference-modal__header">
            <span className="reference-modal__eyebrow">{t('reference.eyebrow')}</span>
            <DialogClose className="reference-modal__close" aria-label={t('reference.close')}>
              ×
            </DialogClose>
          </div>
          <div className="reference-modal__term">{reference.term}</div>
          <AnswerBody text={reference.text} references={[]} onReferenceSelect={() => {}} />
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
```

If the generated `Dialog` requires an explicit `DialogTitle` for
accessibility (common in Radix/Base UI dialog implementations — check for
a console warning in the test run, or read the file for a required prop),
add a visually-hidden `DialogTitle` wrapping `{reference.term}` per that
file's own pattern rather than skip it silently.

- [ ] **Step 5: Write the CSS**

Class names below target whatever `className` props Step 4's elements
accept — same override approach as `FilterChips`' `[data-state='on']`.

```css
.reference-modal__overlay {
  position: fixed;
  inset: 0;
  background: var(--color-scrim);
  z-index: var(--z-modal);
}

.reference-modal__content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 440px;
  max-width: 86vw;
  max-height: 80vh;
  overflow-y: auto;
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: var(--space-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  box-shadow: var(--shadow-modal);
  z-index: var(--z-modal);
}

.reference-modal__header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.reference-modal__eyebrow {
  font-family: var(--font-ui);
  font-size: var(--text-label);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.reference-modal__close {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--color-ink-tertiary);
  cursor: pointer;
  font-size: var(--text-section-title);
  line-height: 1;
}

.reference-modal__term {
  font-family: var(--font-ui);
  font-size: var(--text-section-title);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}
```

If the generated `DialogContent` already centers itself (many shadcn
implementations position it via its own default classes rather than
leaving that to the consumer), drop the `position`/`top`/`left`/`transform`
lines above and keep only the box styling — check the generated file's
default className before deciding.

- [ ] **Step 6: Run to verify it passes**

Run: `bun test src/components/ReferenceModal/ReferenceModal.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 7: Commit**

```bash
git add src/translate/en.json src/components/ReferenceModal
git commit -m "feat: add ReferenceModal component"
```

---

### Task 6: `QuestionCard` component

The expand/collapse header stays a plain semantic `<button>` (as below)
rather than the generated `src/components/ui/button.tsx` — checked that
component's variants against this task's needs and it's a poor fit:
`buttonVariants` bakes in fixed heights and icon-sizing rules meant for
compact single-line controls, which fights the header's multi-line
ordinal+question+tags flex layout. A plain `<button>` with
`aria-expanded` already gives full semantics and keyboard access for free,
so wrapping it in `Button` would add an import with no behavioral gain and
a real layout fight — not worth it. (`Dialog` and `ToggleGroup` earn their
place elsewhere in this plan because they replace real hand-written
behavior — focus trap, Escape handling, radio-group semantics — not just a
class name.)

**Files:**
- Create: `src/components/QuestionCard/QuestionCard.tsx`
- Create: `src/components/QuestionCard/QuestionCard.css`
- Test: `src/components/QuestionCard/QuestionCard.test.tsx`

**Interfaces:**
- Consumes: `AnswerBody` (Task 4), `Question`/`Reference` from
  `@/types/topic.types`.
- Produces:
  ```ts
  export interface QuestionCardProps {
    ordinal: string
    question: Question
    references: Reference[] // full topic reference pool; card resolves question.answer.references against it
    open: boolean
    onToggle: () => void
    onReferenceSelect: (reference: Reference) => void
  }
  export function QuestionCard(props: QuestionCardProps): JSX.Element
  ```
  Consumed by Task 7 (`TopicPage`).

- [ ] **Step 1: Write the failing tests**

```tsx
import { describe, expect, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuestionCard } from './QuestionCard'
import type { Question, Reference } from '@/types/topic.types'

const question: Question = {
  id: 'q1',
  question: 'What is a Buffer?',
  tags: ['core'],
  answer: { id: 'a1', text: 'A Buffer holds raw bytes.', references: ['r1'], related: [] },
}
const references: Reference[] = [{ id: 'r1', term: 'Buffer', text: 'Raw memory container.' }]

describe('QuestionCard', () => {
  test('shows the question text and ordinal always', () => {
    render(<QuestionCard ordinal="01" question={question} references={references} open={false} onToggle={() => {}} onReferenceSelect={() => {}} />)
    expect(screen.getByText('01')).toBeDefined()
    expect(screen.getByText('What is a Buffer?')).toBeDefined()
    expect(screen.queryByText('A Buffer holds raw bytes.', { exact: false })).toBeNull()
  })

  test('shows the answer body only when open', () => {
    render(<QuestionCard ordinal="01" question={question} references={references} open={true} onToggle={() => {}} onReferenceSelect={() => {}} />)
    expect(screen.getByText('holds raw bytes.', { exact: false })).toBeDefined()
  })

  test('toggle button calls onToggle', () => {
    let toggled = false
    render(<QuestionCard ordinal="01" question={question} references={references} open={false} onToggle={() => (toggled = true)} onReferenceSelect={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'What is a Buffer?' }))
    expect(toggled).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `bun test src/components/QuestionCard/QuestionCard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```tsx
import type { Question, Reference } from '@/types/topic.types'
import { AnswerBody } from '@/components/AnswerBody/AnswerBody'
import './QuestionCard.css'

export interface QuestionCardProps {
  ordinal: string
  question: Question
  references: Reference[]
  open: boolean
  onToggle: () => void
  onReferenceSelect: (reference: Reference) => void
}

export function QuestionCard({ ordinal, question, references, open, onToggle, onReferenceSelect }: QuestionCardProps) {
  const citedReferences: Reference[] = []
  for (const referenceId of question.answer.references) {
    const reference = references.find((candidate) => candidate.id === referenceId)
    if (reference) {
      citedReferences.push(reference)
    }
  }

  return (
    <div className={open ? 'question-card question-card--open' : 'question-card'}>
      <button type="button" className="question-card__header" aria-expanded={open} onClick={onToggle}>
        <span className="question-card__ordinal">{ordinal}</span>
        <span className="question-card__label">
          <span className="question-card__question">{question.question}</span>
          {question.tags && question.tags.length > 0 ? (
            <span className="question-card__tags">
              {question.tags.map((tag) => (
                <span key={tag} className="question-card__tag">
                  {tag}
                </span>
              ))}
            </span>
          ) : null}
        </span>
        <span className="question-card__chevron" aria-hidden="true">
          ⌄
        </span>
      </button>
      {open ? (
        <div className="question-card__body">
          <AnswerBody text={question.answer.text} references={citedReferences} onReferenceSelect={onReferenceSelect} />
        </div>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 4: Write the CSS**

```css
.question-card {
  background: var(--color-surface);
  border-radius: var(--radius-card-collapsed);
  padding: var(--space-card-pad-block) var(--space-card-pad-inline);
  box-shadow: none;
  transition: box-shadow var(--duration-pop) ease;
}

.question-card--open {
  border-radius: var(--radius-card-open);
  box-shadow: var(--shadow-card-raised);
}

.question-card__header {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;
}

.question-card__ordinal {
  font-family: var(--font-mono);
  font-size: var(--text-card-ordinal);
  font-weight: 500;
  color: var(--color-ink-tertiary);
  padding-top: 3px;
}

.question-card--open .question-card__ordinal {
  color: var(--color-accent);
}

.question-card__label {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.question-card__question {
  font-family: var(--font-ui);
  font-size: var(--text-question);
  font-weight: 600;
  line-height: 1.45;
  letter-spacing: -0.01em;
  color: var(--color-ink);
}

.question-card__tags {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.question-card__tag {
  font-family: var(--font-ui);
  font-size: var(--text-tag);
  font-weight: 600;
  color: var(--color-ink-faint);
  letter-spacing: 0.02em;
}

.question-card__chevron {
  display: flex;
  padding: var(--space-xs);
  border-radius: var(--radius-xs);
  color: var(--color-ink-tertiary);
  transition: transform var(--duration-pop) ease;
}

.question-card--open .question-card__chevron {
  transform: rotate(180deg);
}

.question-card__body {
  padding-top: var(--space-lg);
  margin-top: var(--space-base);
  border-top: var(--size-hairline) solid var(--color-hairline);
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `bun test src/components/QuestionCard/QuestionCard.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/QuestionCard
git commit -m "feat: add QuestionCard component"
```

---

### Task 7: `TopicPage` + routing

Assembles everything: loads the topic by `:topicId`, derives the filter tag
list, tracks the open question and open reference modal.

**Files:**
- Create: `src/pages/TopicPage/TopicPage.tsx`
- Create: `src/pages/TopicPage/TopicPage.css`
- Modify: `src/App.tsx`
- Test: `src/pages/TopicPage/TopicPage.test.tsx`

**Interfaces:**
- Consumes: `topicsConfig` from `@/topics.config`, `IconRail` +
  `RailSection` (existing), `FilterChips` (Task 3), `QuestionCard` (Task 6),
  `ReferenceModal` (Task 5), `t` from `@/utils/i18n`, `useParams`/`Link` from
  `react-router`.

- [ ] **Step 1: Add translation keys**

Add to `src/translate/en.json`:
```json
  "topic.filterAll": "All",
  "topic.notFound": "Topic not found.",
  "topic.backToTopics": "Back to topics"
```

- [ ] **Step 2: Write the failing test**

```tsx
import { describe, expect, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { TopicPage } from './TopicPage'

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/topics/:topicId" element={<TopicPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TopicPage', () => {
  test('loads the topic and renders every question once', async () => {
    renderAt('/topics/angular')
    await screen.findByText('Angular')
    const questionButtons = await screen.findAllByRole('button', { name: /standalone/i })
    expect(questionButtons.length).toBeGreaterThan(0)
  })

  test('expanding a question shows its answer', async () => {
    renderAt('/topics/angular')
    const toggle = await screen.findByRole('button', { name: /standalone/i })
    fireEvent.click(toggle)
    expect(await screen.findByText(/imports array/i)).toBeDefined()
  })

  test('filtering by tag hides non-matching questions', async () => {
    renderAt('/topics/angular')
    await screen.findByText('Angular')
    const allButtons = await screen.findAllByRole('button')
    const initialCount = allButtons.filter((button) => button.className.includes('question-card__header')).length
    const architectureChip = screen.getByRole('button', { name: 'architecture' })
    fireEvent.click(architectureChip)
    const filteredButtons = screen.getAllByRole('button').filter((button) => button.className.includes('question-card__header'))
    expect(filteredButtons.length).toBeLessThan(initialCount)
  })

  test('shows a not-found message for an unknown topic id', async () => {
    renderAt('/topics/does-not-exist')
    expect(await screen.findByText('Topic not found.')).toBeDefined()
  })
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `bun test src/pages/TopicPage/TopicPage.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement**

```tsx
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { topicsConfig } from '@/topics.config'
import type { Question, Reference, Topic } from '@/types/topic.types'
import { t } from '@/utils/i18n'
import { IconRail } from '@/components/IconRail/IconRail'
import { RailSection } from '@/components/IconRail/rail-section.enum'
import { FilterChips } from '@/components/FilterChips/FilterChips'
import { QuestionCard } from '@/components/QuestionCard/QuestionCard'
import { ReferenceModal } from '@/components/ReferenceModal/ReferenceModal'
import './TopicPage.css'

function collectTags(questions: Question[]): string[] {
  const filterAll = t('topic.filterAll')
  const tags: string[] = [filterAll]
  const seen = new Set<string>([filterAll])

  for (const question of questions) {
    for (const tag of question.tags ?? []) {
      if (!seen.has(tag)) {
        seen.add(tag)
        tags.push(tag)
      }
    }
  }

  return tags
}

export function TopicPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [references, setReferences] = useState<Reference[]>([])
  const [notFound, setNotFound] = useState(false)
  const [activeFilter, setActiveFilter] = useState(() => t('topic.filterAll'))
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null)
  const [openReference, setOpenReference] = useState<Reference | null>(null)

  useEffect(() => {
    let cancelled = false
    setNotFound(false)
    setActiveFilter(t('topic.filterAll'))
    setOpenQuestionId(null)

    const entry = topicsConfig.find((config) => config.id === topicId)
    if (!entry) {
      setNotFound(true)
      return
    }

    async function loadTopic() {
      const [topicModule, referencesModule] = await Promise.all([entry!.load(), entry!.loadReferences()])
      if (cancelled) {
        return
      }
      setTopic(topicModule.topic)
      setQuestions(topicModule.questions)
      setReferences(referencesModule.references)
    }

    loadTopic()

    return () => {
      cancelled = true
    }
  }, [topicId])

  if (notFound) {
    return (
      <div className="topic-page">
        <IconRail activeSection={RailSection.Topics} />
        <div className="topic-page__not-found">
          <p>{t('topic.notFound')}</p>
          <Link to="/">{t('topic.backToTopics')}</Link>
        </div>
      </div>
    )
  }

  const visibleQuestions = questions.filter(
    (question) => activeFilter === t('topic.filterAll') || (question.tags ?? []).includes(activeFilter),
  )

  return (
    <div className="topic-page">
      <IconRail activeSection={RailSection.Topics} />
      <main className="topic-page__main">
        {topic ? (
          <div className="topic-page__content">
            <div className="topic-page__header">
              <div className="topic-page__title-row">
                <h1 className="topic-page__title">{topic.name}</h1>
              </div>
            </div>
            <FilterChips tags={collectTags(questions)} active={activeFilter} onSelect={setActiveFilter} />
            <div className="topic-page__cards">
              {visibleQuestions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  ordinal={String(index + 1).padStart(2, '0')}
                  question={question}
                  references={references}
                  open={openQuestionId === question.id}
                  onToggle={() => setOpenQuestionId(openQuestionId === question.id ? null : question.id)}
                  onReferenceSelect={setOpenReference}
                />
              ))}
            </div>
          </div>
        ) : null}
      </main>
      <ReferenceModal reference={openReference} onClose={() => setOpenReference(null)} />
    </div>
  )
}
```

- [ ] **Step 5: Write the CSS**

```css
.topic-page {
  display: flex;
  height: 100vh;
  background: var(--color-ground);
}

.topic-page__main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: var(--space-2xl) var(--space-3xl) var(--space-topic-content-bottom);
}

.topic-page__content {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.topic-page__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-topic-header);
  padding: 0 var(--space-2xs);
}

.topic-page__title-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.topic-page__title {
  margin: 0;
  font-family: var(--font-ui);
  font-size: var(--text-page-title);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}

.topic-page__cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-ms);
}

.topic-page__not-found {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  font-family: var(--font-ui);
  color: var(--color-ink-secondary);
}
```

- [ ] **Step 6: Wire the route in `src/App.tsx`**

```tsx
import { Route, Routes } from 'react-router'
import { LandingPage } from '@/pages/LandingPage/LandingPage'
import { TopicPage } from '@/pages/TopicPage/TopicPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/topics/:topicId" element={<TopicPage />} />
    </Routes>
  )
}
```

- [ ] **Step 7: Run to verify it passes**

Run: `bun test src/pages/TopicPage/TopicPage.test.tsx`
Expected: PASS, 4 tests. Then `bun test` (full suite) and `bun run build`.

- [ ] **Step 8: Commit**

```bash
git add src/translate/en.json src/pages/TopicPage src/App.tsx
git commit -m "feat: add TopicPage and wire /topics/:topicId route"
```

---

### Task 8: Seed `topics/nodejs.ts` + `references/nodejs.ts`

Second topic through the registry — proves `topics.config.ts` genuinely
supports more than one entry, and gives `TopicPage` a second real dataset
(different tag set, different content shape: numbered lists, code fences)
to exercise.

**Files:**
- Create: `src/references/nodejs.ts`
- Create: `src/topics/nodejs.ts`
- Modify: `src/topics.config.ts`

**Source:** `data/nodejs.md`. Seed **only** the 25 numbered questions in
sections 1-8 (`### Q1` through `### Q25`, file lines 9-165). Do **not**
seed section 9 ("System Design Integration" — prose, not a discrete
question), section 10 ("Practice: Predict the Output" — code-trace
exercises, a different content shape) or the trailing "Notes / gaps to fill
in later" section (author's own TODO list, not content).

Section → tag mapping (kebab-free, matches the style of existing angular
tags like `'reactivity'`, `'core'`):
| Section | Lines | Tag |
|---|---|---|
| 1. Event Loop & Async Internals | 9-62 | `event-loop` |
| 2. Modules: CommonJS vs ESM | 64-75 | `modules` |
| 3. Concurrency | 77-88 | `concurrency` |
| 4. Streams & Buffers | 90-101 | `streams` |
| 5. Memory & Performance | 103-118 | `performance` |
| 6. Error Handling & Resilience | 120-139 | `error-handling` |
| 7. Security | 141-154 | `security` |
| 8. Testing & Tooling | 156-165 | `testing` |

Every question also gets `'core'` as a second tag if it is the first
question in its section (mirrors angular.ts's pattern of a shared
cross-cutting tag); otherwise a single tag is fine.

**References** (new authored content — a Node.js analog to
`references/angular.ts`; not sourced from `data/nodejs.md`, which has no
glossary section):

```ts
import type { FileMeta, Reference } from '@/types/topic.types'

export const meta: FileMeta = {
  version: '1.0.0',
  cutOffTime: '2026-09-14T00:00:00.000Z',
  updatedAt: '2026-09-14T00:00:00.000Z',
}

export const references: Reference[] = [
  {
    id: '<GENERATE-ULID-1>',
    term: 'Event Loop',
    text: 'The single-threaded loop that drives Node — it repeatedly moves through six phases (timers, pending callbacks, idle/prepare, poll, check, close callbacks), running the callbacks queued for each. The nextTick and Promise microtask queues drain completely between every callback, not just between phases.',
  },
  {
    id: '<GENERATE-ULID-2>',
    term: 'libuv',
    text: 'The C library underneath Node that provides the event loop itself plus a thread pool (default size 4) for work the OS has no async API for — some filesystem calls, DNS lookups, and CPU-heavy crypto/zlib. Network I/O bypasses the pool entirely, going through the OS’s own async I/O.',
  },
  {
    id: '<GENERATE-ULID-3>',
    term: 'Cluster',
    text: 'The built-in `cluster` module forks multiple Node processes that share a listening port, letting a multi-core machine handle more concurrent connections. Each worker is a fully separate process with its own event loop and memory — it does not solve CPU-bound blocking within a single request; that still needs a worker thread or an offloaded service.',
  },
  {
    id: '<GENERATE-ULID-4>',
    term: 'Worker Threads',
    text: 'The `worker_threads` module runs JavaScript on a real OS thread inside the same process, with memory optionally shared via `SharedArrayBuffer`. Reach for it over `cluster` when the goal is offloading one CPU-bound computation, not scaling overall request throughput.',
  },
  {
    id: '<GENERATE-ULID-5>',
    term: 'Buffer',
    text: 'A fixed-length, raw-binary container outside the V8 heap. Node needs it separately from a JS string because strings are immutable and UTF-16 by default, which is the wrong shape for handling arbitrary binary data (file bytes, network packets) efficiently.',
  },
]
```

Replace each `<GENERATE-ULID-N>` with a freshly generated ULID (Global
Constraints — hardcoded, not generated at runtime).

**Topic file shape** — follow `src/topics/angular.ts` exactly: a
`const <name>Ref = references.find((r) => r.term === '<Term>')!` per cited
reference, a `topic: Topic = { id: 'nodejs', name: 'Node.js' }`, a `meta:
FileMeta`, one `const <name>Answer: Answer` per question referencing the
matched ref ids in its `references` array, and an exported
`questions: Question[]`. Two fully worked examples below — transcribe the
remaining 23 the same way, reading directly from `data/nodejs.md` (never
paraphrase; preserve inline `` `code` `` spans as markdown inline code and
the numbered-list phases in Q1 as a real markdown ordered list so
`AnswerBody`'s `li` highlighting renders it).

```ts
import type { Answer, FileMeta, Question, Topic } from '@/types/topic.types'
import { references } from '@/references/nodejs'

const eventLoopRef = references.find((r) => r.term === 'Event Loop')!
const libuvRef = references.find((r) => r.term === 'libuv')!
const clusterRef = references.find((r) => r.term === 'Cluster')!
const workerThreadsRef = references.find((r) => r.term === 'Worker Threads')!
const bufferRef = references.find((r) => r.term === 'Buffer')!

export const topic: Topic = {
  id: 'nodejs',
  name: 'Node.js',
}

export const meta: FileMeta = {
  version: '1.0.0',
  cutOffTime: '2026-09-14T00:00:00.000Z',
  updatedAt: '2026-09-14T00:00:00.000Z',
}

const eventLoopPhasesAnswer: Answer = {
  id: '<GENERATE-ULID>',
  text: "Each loop iteration (\"tick\") passes through six phases, run by libuv:\n\n1. **Timers** — runs expired `setTimeout`/`setInterval` callbacks.\n2. **Pending callbacks** — deferred system-level callbacks (e.g. some TCP errors).\n3. **Idle, prepare** — internal, not user-facing.\n4. **Poll** — retrieves new I/O events and runs their callbacks; blocks here if empty (unless something is scheduled for the check phase).\n5. **Check** — runs `setImmediate` callbacks.\n6. **Close callbacks** — e.g. `socket.on('close', ...)`.\n\nCritically: **microtasks are not a phase.** The nextTick queue and the Promise microtask queue drain completely between every single callback, not just between phases.",
  references: [libuvRef.id],
  related: [],
}

const clusterAnswer: Answer = {
  id: '<GENERATE-ULID>',
  text: 'The `cluster` module forks multiple worker processes that share a listening port, so incoming connections get spread across CPU cores instead of a single Node process handling all of them. Each worker still runs its own single-threaded event loop and has its own memory — clustering scales concurrent connection handling, but it does **not** solve a single request blocking the event loop with CPU-bound work; that still needs a worker thread or an offloaded service.',
  references: [clusterRef.id],
  related: [],
}

export const questions: Question[] = [
  {
    id: '<GENERATE-ULID>',
    question: 'What are the phases of the Node.js event loop, in order?',
    tags: ['event-loop', 'core'],
    answer: eventLoopPhasesAnswer,
  },
  // ... Q2-Q8 here, same pattern ...
  {
    id: '<GENERATE-ULID>',
    question: 'How does the `cluster` module improve performance, and what does it *not* solve?',
    tags: ['concurrency', 'core'],
    answer: clusterAnswer,
  },
  // ... Q10-Q25 here, same pattern ...
]
```

- [ ] **Step 1: Generate ULIDs**

Generate one ULID per reference (5) and per question/answer pair (25
questions × 2 ids each = 50), 55 total:
```bash
for i in $(seq 1 55); do bun -e "import('ulid').then(({ ulid }) => console.log(ulid()))"; done
```

- [ ] **Step 2: Write `src/references/nodejs.ts`**

Using the content given above, ULIDs substituted in.

- [ ] **Step 3: Write `src/topics/nodejs.ts`**

Transcribe all 25 questions from `data/nodejs.md` lines 9-165 verbatim,
following the two worked examples above and the section→tag table.

- [ ] **Step 4: Register in `src/topics.config.ts`**

```ts
export const topicsConfig: TopicConfigEntry[] = [
  {
    id: 'angular',
    name: 'Angular',
    load: () => import('@/topics/angular'),
    loadReferences: () => import('@/references/angular'),
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    load: () => import('@/topics/nodejs'),
    loadReferences: () => import('@/references/nodejs'),
  },
]
```

- [ ] **Step 5: Verify**

```bash
bun run build
bun test
```
Expected: build succeeds, full suite green. Manually diff every seeded
question/answer pair against `data/nodejs.md` lines 9-165 — this step is
mandatory and is re-checked independently by the task reviewer (see Task
review note below).

- [ ] **Step 6: Commit**

```bash
git add src/references/nodejs.ts src/topics/nodejs.ts src/topics.config.ts
git commit -m "feat: seed nodejs topic content (25 questions, 5 references)"
```

**Task review note:** this task's reviewer must independently re-read
`data/nodejs.md` lines 9-165 side by side with the produced
`topics/nodejs.ts` and confirm every question and answer is verbatim (not
paraphrased, no dropped sentences, code fences preserved) — this is the
same drift class of bug the P1 content-seed task review caught. Flag any
deviation as a blocking finding, not a nit.

---

### Task 9: Final whole-branch review

Follow `superpowers:subagent-driven-development`'s final-review step:
dispatch the most capable available model as a final code reviewer over
the full branch diff against `main`. Focus areas specific to this plan:

- Every new `.css` file uses only `var(--token)` values (no literals).
- `AnswerBody`'s highlighting only touches string children, as documented —
  confirm no attempt to recurse into nested markdown elements introduced a
  bug instead.
- `TopicPage`'s not-found path, filter-reset-on-topic-change, and
  open-question-reset-on-topic-change behave correctly (check the `useEffect`
  in Task 7 resets `activeFilter`/`openQuestionId` before the new topic's
  data lands, not after).
- `topics/nodejs.ts` content is verbatim against `data/nodejs.md` (spot-check
  several questions even if Task 8's review already passed).
- No component reaches into P3/P4 territory (no bookmark state, no
  localStorage, no flyout-panel responsive logic).

Address findings per the skill's fix-loop process. Once clean, proceed to
`superpowers:finishing-a-development-branch`.
