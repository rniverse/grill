# Interview Prep App — Rolling Spec

Living document. Update as decisions change — this isn't a one-time handoff, it's meant to be edited alongside the project.

---

## 1. Idea

An interactive, self-hosted interview-prep tool. Starts with Angular, built so new topics (system design, other frameworks, etc.) are just additional data files — the app code shouldn't need to change to add a topic.

Core interaction model:
- Browse questions per topic, expand for the full answer.
- Terms inside an answer that have a **Reference** entry auto-highlight; clicking one pops up a flashcard-style explanation of that term.
- Anything still confusing — select the text, hit **+**, type what you actually want to know. Saved locally as a personal, dated question tied to that exact selection; the selected text gets its own highlight/badge so you remember you asked.
- Questions and references can carry **Notes** — pre-authored ("internal") depth from the shipped data, or your own ("external"/personal) notes you write and edit yourself.
- **Bookmarks** for quick-return items.
- Periodically: export what you've personally added (asked questions, personal notes) and fold the useful ones back into the shipped data files, bumping that file's version.

The shipped content and your personal annotations are deliberately kept in separate storage (data files vs. localStorage) so the app's source stays clean and the personal layer stays exportable/mergeable rather than trapped in the browser.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Runtime / package manager | Bun |
| Build tool | Vite |
| UI framework | React + TypeScript |
| Styling | Tailwind v4 (CSS-based `@theme` config) |
| Component library | shadcn/ui (latest) |
| Theming | Single `theme.css` — colors, fonts, spacing, radius as `@theme` tokens; shadcn components consume these |
| Markdown — display (shipped content) | Lightweight renderer (e.g. react-markdown + remark-gfm) |
| Markdown — editing (personal notes) | MDXEditor |
| Diagrams | Mermaid, wired into whichever renderer displays `answer.text` / `note.text` / `reference.text` |
| IDs | ULID — one shared generator, unique project-wide |
| Persistence (personal layer) | Browser localStorage |

**Rendering split rationale:** MDXEditor is a full editor — worth it where you're actually writing (personal notes), too heavy to mount on every shipped answer/reference in a list. Shipped content stays read-only via the lightweight renderer.

---

## 3. Data Models

### Shared

```ts
type ID = string; // ULID

interface FileMeta {
  version: string;      // bumped whenever this file's content changes
  cutOffTime: string;   // ISO — latest locally-asked question already folded into this version
  updatedAt: string;    // ISO — last edit to this file
}
```

### Shipped — `topics/<topic>.ts`

```ts
interface Topic {
  id: string;   // slug, e.g. "angular"
  name: string;
}

interface Answer {
  id: ID;
  text: string;          // markdown, may include mermaid fences
  references: ID[];        // Reference ids cited in this answer
  related: ID[];             // other Question ids worth reading alongside this one
}

interface Question {
  id: ID;
  question: string;
  answer: Answer;
  notes?: string;         // single shipped note, markdown — no array, no type flag.
                            // there's only ever one; "internal" vs "external" is implicit
                            // in whether it lives here or in PersonalNote below
  tags?: string[];
}

// file exports:
// export const topic: Topic
// export const meta: FileMeta
// export const questions: Question[]
```

### Shipped — `references/<topic>.ts`

```ts
interface Reference {
  id: ID;       // what Answer.references points to
  term: string;   // display label + auto-highlight match string in answer text
  text: string;    // markdown — the flashcard content shown on click
  notes?: string;   // same single-note treatment as Question
}

// file exports:
// export const meta: FileMeta
// export const references: Reference[]
```

### Personal layer — localStorage only, never shipped

```ts
interface Selection {
  text: string;
  range: { start: number; end: number };
}

interface LocalTargetRef {
  topic: { name: string; version: string };            // snapshot at creation time
  target: { kind: 'question' | 'reference'; id: ID };
}

interface PendingQuestion extends LocalTargetRef {
  id: ID;
  selection: Selection;
  ask: string;
  createdAt: string;
}

interface PersonalNote extends LocalTargetRef {
  id: ID;
  text: string;
  createdAt: string;
  updatedAt: string;
}

interface Bookmark extends LocalTargetRef {
  id: ID;
  createdAt: string;
}
```

`PendingQuestion`, `PersonalNote`, and `Bookmark` all share the same `{ topic, target }` scaffolding now — a pending question adds a selection and the ask text, a note adds text and an edit timestamp, a bookmark is just the fact of existing.

---

## 4. Rendering & Matching Rules

- **Note inline vs. button:** render inline if the note is **≤100 words AND ≤1000 characters**; otherwise show a button that opens it in a larger markdown viewer. Both must pass for inline — whichever limit is hit first forces the button.
- **Reference auto-highlighting, overlapping terms:** when scanning answer text against the known reference terms (e.g. both "Signal" and "Signal Input" exist), match greedily and longest-first, and don't re-scan text already claimed by an earlier match — so a broader term doesn't get partially swallowed.
- **Re-locating a past selection (`PendingQuestion.selection`):** applies whether the target is a question's answer or a reference's text. On render, first check whether the text at the stored `range` still equals `selection.text` (fast path). If not, fall back to a full-text search for `selection.text` within that target's content. If neither finds it, the source content changed since the question was asked — surface it in a "needs review" subsection of the Pending Questions panel rather than guessing at a position. Expected to be rare.

---

## 5. Folder Structure

```
src/
  topics/
    angular.ts
    system-design.ts        # future topic — just another file
  references/
    angular.ts
    system-design.ts
  topics.config.ts           # registry: id → name → dynamic import loaders (code-split per topic)
  theme.css                   # Tailwind v4 @theme tokens
  lib/
    id.ts                      # shared ULID generator
    localStorage.ts             # CRUD + export/import for PendingQuestion, PersonalNote, Bookmark
    textSelection.ts             # selection + range helpers
    highlightMatch.ts             # substring-based re-highlighting for references + past selections
  components/
    ui/                            # shadcn components
    QuestionCard.tsx
    ReferenceBadge.tsx               # auto-highlighted term → flashcard popover
    SelectionPlusButton.tsx           # floating "+" on text select
    AskQuestionPopover.tsx             # "explain more about this" textarea
    PendingHighlight.tsx                # asked-but-unresolved highlight + hover + clear
    PendingQuestionsPanel.tsx            # "My Questions" review/clear view
    NoteView.tsx                          # inline vs. expand-button rendering by length
    NoteEditor.tsx                         # MDXEditor wrapper, personal notes only
    BookmarkButton.tsx
  App.tsx
```

---

## 6. Content Update Workflow

Applies uniformly to questions, references, and notes — same process regardless of which one changed.

1. Use the app; ask questions via selection (`PendingQuestion`), write personal notes (`PersonalNote`), bookmark things.
2. Export the personal layer (JSON) when ready to revisit.
3. Review exports; fold the useful ones into the actual `topics/<topic>.ts` / `references/<topic>.ts` files — new questions, expanded answers, new references, or an updated `notes` field. In every case: **load the file's current content first, then patch the update on top of what's already there** — never a blind overwrite.
4. On each such update: bump that file's `meta.version`, set `meta.cutOffTime` to the `createdAt` of the latest pending item addressed, refresh `meta.updatedAt`.
5. Once a topic version advances past a given `PendingQuestion.createdAt`, it's a candidate to clear from the panel (not automatic — you review and clear manually).

---

## 7. Next Steps

- Scaffold the Bun + Vite + React + TS project (Tailwind v4, shadcn, MDXEditor, ULID) — good candidate for Claude Code given ongoing iteration.
- Seed `topics/angular.ts` from the existing Angular Q&A reference doc, splitting content into the `Question` / `Answer` / `Reference` shapes above.
