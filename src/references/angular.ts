import type { FileMeta, Reference } from '@/types/topic.types'

export const meta: FileMeta = {
  version: '1.0.0',
  cutOffTime: '2026-09-14T00:00:00.000Z',
  updatedAt: '2026-09-14T00:00:00.000Z',
}

export const references: Reference[] = [
  {
    id: '01M2FC6B5A47Q3M1JDNPG5RVJ1',
    term: 'Signal',
    text: {
      type: 'markdown.text',
      value:
        'A reactive container around a value that tracks exactly which template bindings read it. When it changes, Angular updates only those specific bindings — fine-grained reactivity — instead of walking the whole component tree.',
    },
  },
  {
    id: '01M2FC6B5AMGZT78QZZ0M9C1W9',
    term: 'OnPush',
    text: {
      type: 'markdown.text',
      value:
        'A change-detection strategy (`ChangeDetectionStrategy.OnPush`) where a component only re-checks when an `@Input()` reference changes, an event originates inside it, a bound `Observable` emits via the `async` pipe, or a Signal it reads changes. Requires immutable data patterns to work correctly.',
    },
  },
  {
    id: '01M2FC6B5AKYM9N2D2CRQ0VV66',
    term: 'Zone.js',
    text: {
      type: 'markdown.text',
      value:
        "Monkey-patches async browser APIs (setTimeout, promises, DOM events, XHR) so Angular knows something happened and runs change detection. Historically Angular's default change-detection trigger; zone-less mode removes it in favor of Signals.",
    },
  },
  {
    id: '01M2FC6B5A9TT6T39V9R5FTH36',
    term: 'Hydration',
    text: {
      type: 'markdown.text',
      value:
        'Reuses server-rendered DOM nodes on the client and attaches event listeners/reactivity to them, instead of discarding and re-rendering from scratch — eliminates the flicker older Angular SSR had.',
    },
  },
  {
    id: '01M2FC6B5A0J79R3NEQ6YTFWW3',
    term: 'NgRx',
    text: {
      type: 'markdown.text',
      value:
        'A Redux-style state management library for Angular — unidirectional data flow, immutable state, actions as the sole trigger for state change, effects for side effects. Pays off at scale; a well-organized service with Signals often covers small-to-medium apps with less boilerplate.',
    },
  },
]
