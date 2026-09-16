# Remote Content Sources — Design

## Overview

Topic and reference data currently ships bundled with the app as local JSON
(`src/topics/*.json`, `src/references/*.json`), loaded via a hardcoded slug
list in `src/topics.config.ts` and `import()`. This design replaces that
with a fetch-from-URL model: a small config of named sources, each pointing
at a topic JSON URL and/or a references JSON URL, fetched at runtime,
validated against a schema, and cached in `localStorage`. The immediate use
is the app's own two seed topics (Angular, Node.js), served from this same
repo's raw GitHub content instead of bundled imports — this is also the
foundation a later pass can build on to let a user register their own
source by URL.

## Goals

- Fetch topic/reference JSON from a URL instead of bundling it.
- Validate the fetched JSON at runtime (not just a TypeScript cast) using
  Valibot, so a malformed or unexpected response fails cleanly instead of
  crashing deeper in the app.
- Cache fetched data in `localStorage`, keyed by source, so repeat visits
  don't require a network round trip before rendering.
- Show the two seed sources (and their fetch/validation health) in the
  Preferences page.
- Keep every page currently consuming `topicsConfig` working, migrated to
  the new loading path.

## Non-goals (this pass)

- Adding/editing/removing sources from the Preferences UI. This pass seeds
  the two sources into storage and displays them; a later pass adds CRUD.
- Live-updating an already-open page when a background refresh finds newer
  data. The refreshed data is picked up on the next mount.
- A generic "import a source by URL" flow for end users. That's the future
  use case this groundwork enables, not built here.

## Data model

```ts
// src/config/content-sources.ts
export interface ContentSourceConfig {
  id: string
  name: string
  source: {
    topic?: string
    references?: string
  }
  validation?: {
    topic?: SourceValidation
    references?: SourceValidation
  }
}

interface SourceValidation {
  status: 'success' | 'failed'
  at: string // ISO timestamp
  error?: { message: string; meta?: unknown }
}
```

A source with `source.topic` unset never appears in topic lists; a source
with `source.references` unset never appears in reference lists. Both can
be set, as they are for the two seed sources today.

`validation` reflects the outcome of the most recent **foreground** load
attempt for that half of the source (see Cache & validation policy below).
It is absent until a foreground attempt has happened at least once.

### Seed data

```ts
export const CONTENT_SOURCES: ContentSourceConfig[] = [
  {
    id: 'angular',
    name: 'Angular',
    source: {
      topic: 'https://raw.githubusercontent.com/rniverse/grill/refs/heads/main/src/topics/angular.json',
      references: 'https://raw.githubusercontent.com/rniverse/grill/refs/heads/main/src/references/angular.json',
    },
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    source: {
      topic: 'https://raw.githubusercontent.com/rniverse/grill/refs/heads/main/src/topics/nodejs.json',
      references: 'https://raw.githubusercontent.com/rniverse/grill/refs/heads/main/src/references/nodejs.json',
    },
  },
]
```

(Corrects a copy-paste slip in the original draft, where both `nodejs`
rows pointed at `angular.json`.)

The local files at `src/topics/*.json` / `src/references/*.json` are not
deleted — they remain in the repo, and once pushed to `main` they are what
these URLs actually serve. They also continue to serve as test fixtures.

## Modules

### `src/config/content-sources.ts`

Exports `ContentSourceConfig`, `SourceValidation`, and the `CONTENT_SOURCES`
seed array. Pure data, no logic.

### `src/schemas/content.schema.ts`

Valibot schemas mirroring the on-disk content shape already implicit in
today's `RawTopicFile`/`RawReferencesFile`/`RawContentMeta` types: schemas
for `RichText`, `Question`, `Reference`, `FileMeta`-plus-`type`/`name`, and
the two top-level file schemas. Exports a validate function per shape that
returns a Valibot result (success with parsed data, or failure with
issues) — no throwing; callers decide how to turn a failure into a
`SourceResult`.

### `src/services/content.ts`

The fetch + cache + validate engine. Exports a single grouped object:

```ts
export const content = {
  load: {
    topic: (row: ContentSourceConfig, opts?: { force?: boolean }) => Promise<SourceResult<TopicModule>>,
    references: (row: ContentSourceConfig, opts?: { force?: boolean }) => Promise<SourceResult<ReferencesModule>>,
  },
}

export type SourceResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'error'; error: { message: string; meta?: unknown } }
```

`TopicModule`/`ReferencesModule` (the already-adapted, app-shaped types)
move here from the retired `topics.config.ts`, unchanged in shape. Adapting
from the raw validated shape to these happens inside `content.load.*`,
replacing today's `adaptTopic`/`adaptReferences` (kept as internal helpers,
grouped as `adapt.topic`/`adapt.references`, mirroring the existing style).

### Cache

`localStorage`, one entry per source id + kind (`topic` / `references`),
holding only the last known-good payload:

```
grill-prep:content-cache:topic:<id>       -> { data: RawTopicFile, version: string, fetchedAt: string }
grill-prep:content-cache:references:<id>  -> { data: RawReferencesFile, version: string, fetchedAt: string }
```

No entry exists until a load for that source+kind has succeeded at least
once.

## Cache & validation-write policy

This is the one piece with real behavioral nuance, confirmed directly with
the user:

**Cache miss (no entry for this source+kind yet):** a foreground, blocking
fetch. Fetch → validate with Valibot → on success: write the cache entry,
write `validation` on the `ContentSourceConfig` row as `{status: 'success',
at: now}`, return `{status: 'ok', data}`. On failure (network error or
schema validation failure): write `validation` as `{status: 'failed', at:
now, error: {message, meta}}`, return `{status: 'error', error}`. This is
the path a first-ever visit to a topic takes, and it mirrors the shape of
today's already-async `entry.load.topics()` — no new loading-state work
needed in consuming pages.

**Cache hit (entry exists):** return the cached data immediately as
`{status: 'ok', data}`. Fire-and-forget a background fetch: validate,
compare `meta.version` to the cached `version`; if different, overwrite
the cache entry. **The background refresh never writes `validation`,
whether it succeeds or fails.** A cached copy is already serving the app
fine; a transient background failure (offline blip, rate limit) must not
flip a working source to "failed" in Preferences. Only a foreground
attempt updates `validation`.

**Force (`opts.force: true`, used by the Preferences "Validate" button):**
always a foreground, blocking fetch — behaves exactly like a cache miss
(fetch, validate, write cache on success, write `validation` either way)
regardless of whether a cache entry already existed. This is the "clean up
and update everything" action: a full, real re-check, not just a read of
whatever's cached.

Net effect: `validation` on a row only ever changes because of (a) that
source's very first load, or (b) an explicit Validate click. Silent
background refreshes keep data fresh without ever alarming the user.

## `storage.ts` reorganization

Existing flat exports (`listBookmarks`, `listPersonalNotes`,
`savePersonalNote`, `updatePersonalNote`, `deletePersonalNote`,
`listPendingQuestions`, `savePendingQuestion`, `deletePendingQuestion`,
`toggleBookmark`, `isBookmarked`, `exportPersonalLayer`,
`importPersonalLayer`) are reorganized into one namespaced `storage`
object:

```ts
export const storage = {
  list: {
    personal: {
      bookmarks: () => Bookmark[],
      notes: () => PersonalNote[],
      questions: () => PendingQuestion[],
    },
    sources: () => ContentSourceConfig[], // seeds from CONTENT_SOURCES on first read
  },
  create: {
    note: (text: string, ref?: LocalTargetRef) => PersonalNote,
    question: (input: Omit<PendingQuestion, 'id' | 'createdAt'>) => PendingQuestion,
  },
  update: {
    note: (id: ID, text: string) => PersonalNote | undefined,
    sourceValidation: (id: string, kind: 'topic' | 'references', result: SourceValidation) => void,
  },
  delete: {
    note: (id: ID) => void,
    question: (id: ID) => void,
  },
  toggle: {
    bookmark: (target: LocalTargetRef['target'], topic: LocalTargetRef['topic']) => void,
  },
  check: {
    bookmarked: (target: LocalTargetRef['target']) => boolean,
  },
  personalLayer: {
    export: () => string,
    import: (json: string) => void,
  },
}
```

Behavior is unchanged; this is a call-site rename, not a logic change.
`storage.list.sources()` is the seeding entry point: on first call, if
`localStorage` has no `grill-prep:content-sources` entry, it writes
`CONTENT_SOURCES` there and returns it; subsequent calls just read it back.
`storage.update.sourceValidation` is what `content.load.*` calls to
persist a foreground attempt's outcome onto the matching row.

This touches every current call site of the flat functions: `NotesPage`,
`NoteDetailPage`, `QuestionCard`, `BookmarksPage`, `QuestionsPage`,
`ReferenceModal`, `AskQuestionPopover`, `PendingHighlight`, `TopicPage`,
and `storage.test.ts`. Mechanical (import + call-site rename), but real
scope — its own implementation task.

## Consumer migration

`src/topics.config.ts` and `src/topics.config.test.ts` are deleted. Every
page currently doing `topicsConfig.find()` / `.map()` plus
`entry.load.topics()` / `entry.load.references()` switches to:

```ts
const sources = storage.list.sources()
// ...
const result = await content.load.topic(source)
if (result.status === 'ok') { /* use result.data */ }
```

filtering to `status === 'ok'` results when building a list, same as a
source with an empty `source.topic`/`source.references` is filtered out
before ever calling `load`. Affected files: `TopicPage`, `BookmarksPage`,
`QuestionsPage`, `NoteDetailPage`, `ReferencesPage`, `LandingPage`,
`MobileNav`.

## Preferences page

Restructured into sections (it currently has one flat block with just the
ID generator). For this pass:

- **Section: Sources.** One card per `storage.list.sources()` row:
  - `id`, `name`
  - Topic source: the URL, or "—" if unset
  - References source: the URL, or "—" if unset
  - A **Validate** button, calling `content.load.topic(row, {force: true})`
    and/or `content.load.references(row, {force: true})` for whichever
    half is set on that row.
  - Below the button, when `row.validation` is present for a half: the
    status (success/failed), the failure reason if failed, and the `at`
    timestamp.
- **Section: Developer.** The existing ID generator (`Generate ID`
  button), moved into its own section rather than loose page content.

No add/edit/remove controls this pass — display plus the Validate action
only.

## Error handling

- Network failure (fetch rejects, or a non-2xx response): `error.message`
  is the underlying error's message (or `HTTP <status>` for a non-2xx
  response); `error.meta` carries `{ url }`.
- Schema validation failure: `error.message` is a fixed string ("response
  did not match the expected content schema"); `error.meta` carries the
  Valibot issues array, for debugging.
- A source that fails to load (cache miss + foreground failure) is simply
  excluded from whatever list is being built (topic list, reference list).
  No blocking error screen — this matches how an empty topic list already
  renders today.
- No fetch timeout is added in this pass. `fetch()` has no built-in
  timeout; a genuinely hung request blocks that source's foreground load
  indefinitely. Flagged as a known gap, not fixed here — worth revisiting
  if it proves to be a real problem, but out of scope for the current ask.

## Testing

- `content.schema.test.ts`: a valid fixture (the existing local
  `angular.json` shape) passes; fixtures with a missing/wrong-typed field
  fail per case.
- `content.test.ts`: mocked `global.fetch` —
  - cache miss + success: writes cache, writes `validation: success`,
    returns `ok`.
  - cache miss + network failure: no cache write, writes `validation:
    failed`, returns `error`.
  - cache miss + schema failure: same, with a schema-shaped error.
  - cache hit: returns cached data without waiting on the background
    fetch; does not write `validation` regardless of what the background
    fetch later does.
  - cache hit + background fetch changes `meta.version`: cache entry is
    overwritten (verified by a subsequent call returning the new data).
  - `force: true`: always fetches even with a cache hit, and writes
    `validation` on both success and failure.
- `storage.test.ts`: extended for the `storage.list.sources` /
  `storage.update.sourceValidation` additions; existing tests updated for
  the new call shape (`storage.list.personal.notes()` instead of
  `listPersonalNotes()`, etc.) — behavior assertions unchanged.
- Every page test that currently loads topic data through a real
  `@/topics/*.json` import (via the old `topicsConfig`) needs a
  `global.fetch` mock returning that same fixture content, plus
  `localStorage.clear()` in `beforeEach` so cached data from one test
  doesn't leak into the next. This is the single largest mechanical cost
  in the whole change — roughly 7-9 test files touched.

## Open risk, named not solved here

No fetch timeout (see Error handling). Acceptable for now given the
source URLs are this same repo's own GitHub raw content, not arbitrary
user-supplied URLs yet — revisit when user-supplied sources are built.
