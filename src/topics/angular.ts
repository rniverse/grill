import type { Answer, FileMeta, Question, Topic } from '@/types/topic.types'
import { references } from '@/references/angular'

const signalRef = references.find((r) => r.term === 'Signal')!
const onPushRef = references.find((r) => r.term === 'OnPush')!
const zoneJsRef = references.find((r) => r.term === 'Zone.js')!
const hydrationRef = references.find((r) => r.term === 'Hydration')!
const ngrxRef = references.find((r) => r.term === 'NgRx')!

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
  id: '01M2FC6B5AXH4X9FV19EVA9RD9',
  text: "A standalone component declares its own dependencies (other components, directives, pipes) directly in its `@Component` decorator's `imports` array, instead of relying on an NgModule to provide that context. This removes a layer of indirection, cuts boilerplate, simplifies lazy loading (you can lazy-load a single component instead of a whole module), and makes the mental model closer to how other modern frameworks work. Since Angular 17, standalone is the default for new projects; NgModules still work and remain common in older/enterprise codebases, but new apps rarely start with them.",
  references: [],
  related: [],
}

const lifecycleAnswer: Answer = {
  id: '01M2FC6B5CX5BSM9WXC9XMPMGQ',
  text: "In order: `ngOnChanges` (input-bound property changes), `ngOnInit` (once, after first `ngOnChanges`), `ngDoCheck` (custom change detection), `ngAfterContentInit`/`ngAfterContentChecked` (projected content), `ngAfterViewInit`/`ngAfterViewChecked` (component's own view and children), `ngOnDestroy` (cleanup — unsubscribe, detach listeners). Interviewers increasingly ask this as a stepping stone to a follow-up on *why* `ngOnDestroy` matters (subscription leaks).",
  references: [],
  related: [],
}

const signalsAnswer: Answer = {
  id: '01M2FC6B5CG3GM162HVK0X2R8Q',
  text: 'A Signal is a reactive container around a value that tracks exactly which template bindings read it. When it changes, Angular updates only those specific bindings — fine-grained reactivity — rather than walking the component tree. Observables model async streams over time; Signals model synchronous, glitch-free state. Rule of thumb: use Signals for local/component state, RxJS for async orchestration.',
  references: [signalRef.id],
  related: [],
}

const architectureAnswer: Answer = {
  id: '01M2FC6B5CBVDYGQH6YDZH0MR5',
  text: "A component is a class decorated with `@Component` that controls a patch of the DOM via a template, styles, and logic. Around it, Angular's architecture consists of: components (UI), services (business logic/state, often shared via DI), directives (behavior/attribute manipulation), pipes (display transformation), and routing (URL-to-view mapping). Signals now sit alongside this as a state/reactivity primitive.",
  references: [signalRef.id],
  related: [],
}

const bindingAnswer: Answer = {
  id: '01M2FC6B5CVH412HYWJ7TAP8G3',
  text: '`[(ngModel)]` is syntactic sugar combining property binding `[ngModel]` and event binding `(ngModelChange)` — Angular\'s "banana in a box" syntax. One-way binding (`[prop]` or `{{ }}`) pushes data one direction; two-way binding adds a listener that pushes changes back. It\'s the same pattern you\'d hand-roll with any `[x]` + `(xChange)` pair on a custom component.',
  references: [],
  related: [],
}

const aotJitAnswer: Answer = {
  id: '01M2FC6B5C08GH5T36R8EVKFC9',
  text: 'Ahead-of-Time (AOT) compiles templates to JavaScript during the build, catching template errors at build time and shipping a smaller runtime (no compiler needed in the browser) — this is the production default. Just-in-Time (JIT) compiles in the browser at runtime, useful mainly for certain dev scenarios. AOT is essentially always what\'s used in production.',
  references: [],
  related: [],
}

const changeDetectionZoneJsAnswer: Answer = {
  id: '01M2FC6B5CDR8ZW0ECYPWHWJPM',
  text: 'Angular has historically used Zone.js, which monkey-patches async browser APIs (setTimeout, promises, DOM events, XHR) so Angular knows *something* happened and runs change detection. The problem: it triggers a check of the entire component tree on almost any async event, which is wasteful at scale and adds real bundle weight (Zone.js is roughly ~70KB gzipped-adjacent overhead in discussions of this trade-off).',
  references: [zoneJsRef.id],
  related: [],
}

const zonelessAnswer: Answer = {
  id: '01M2FC6B5C96G5KYJ9HQGV5PF4',
  text: 'Zone-less mode removes Zone.js entirely and relies on Signals (plus explicit APIs) to know when to re-render, rather than patching async APIs to detect "something happened." Benefit: smaller bundles, more predictable/performant updates. Trade-off: any state that changes outside Angular\'s knowledge (e.g., a third-party library mutating something) won\'t trigger a view update unless it\'s wired through a Signal or you manually trigger detection — so it demands more discipline about where state lives.',
  references: [zoneJsRef.id, signalRef.id],
  related: [],
}

const onPushAnswer: Answer = {
  id: '01M2FC6B5CKPAQ936BV64F1QTS',
  text: 'With `ChangeDetectionStrategy.OnPush`, a component only re-checks when: an `@Input()` reference changes, an event originates from within the component, an `Observable` bound with the `async` pipe emits, or a Signal it reads changes. It\'s the main lever for performance in large component trees, but requires immutable data patterns (replacing objects/arrays rather than mutating them) to work correctly — a very common interview follow-up: "why didn\'t my OnPush component update?"',
  references: [onPushRef.id, signalRef.id],
  related: [],
}

const scenarioDashboardAnswer: Answer = {
  id: '01M2FC6B5D328Q9GRSCZY62MZ9',
  text: "This is a common senior-level scenario question. A strong answer walks through: (1) whether change detection is running excessively — check if the component is default (checks whole tree) vs OnPush; (2) whether subscriptions are properly cleaned up in `ngOnDestroy` (leaks compound over time); (3) whether the `async` pipe is used instead of manual subscribe+setState (avoids manual CD triggers); (4) profiling with Chrome DevTools' Performance tab or Angular DevTools to see change-detection cycle frequency; (5) whether `trackBy` is used on any `*ngFor`/`@for` rendering list items from those streams.",
  references: [onPushRef.id],
  related: [],
}

const diProviderAnswer: Answer = {
  id: '01M2FC6B5DRR0N2HA9PQWZDG8S',
  text: "Angular maintains a hierarchical injector tree. A provider tells an injector how to create a value for a token (a class, `useValue`, `useFactory`, or `useExisting`). When a component/service asks for a dependency via constructor injection (or the newer `inject()` function), Angular walks up the injector hierarchy until it finds a matching provider. Providing something at the root (`providedIn: 'root'`) makes it a singleton app-wide; providing it in a component makes it scoped to that component and its children.",
  references: [],
  related: [],
}

const providedInAnswer: Answer = {
  id: '01M2FC6B5DN11TDA347357JN93',
  text: "`providedIn: 'root'` creates one singleton shared by the whole app (and enables tree-shaking if unused). Providing in a component's own `providers` array creates a new instance for that component subtree — useful when you want isolated state per component instance (e.g., a wizard step, a modal).",
  references: [],
  related: [],
}

const injectFnAnswer: Answer = {
  id: '01M2FC6B5DE5DDN67ZND32K0NV',
  text: "`inject()` lets you retrieve a dependency without constructor parameters, which is essential for functional guards/resolvers/interceptors (plain functions, not classes) and makes DI usable in more contexts (e.g., field initializers). It's functionally equivalent to constructor injection but more flexible syntactically.",
  references: [],
  related: [],
}

const whyRxjsAnswer: Answer = {
  id: '01M2FC6B5DMJJT5184CRT46EY1',
  text: "Angular's `HttpClient` returns Observables, the Router's events and params are Observable-based, and reactive forms expose `valueChanges` as Observables. Historically this made RxJS unavoidable for anything async. Signals are narrowing that footprint for local state, but RxJS remains the tool for combining/transforming streams (`combineLatest`, `switchMap`, `debounceTime`, etc.).",
  references: [signalRef.id],
  related: [],
}

const rxjsOperatorsAnswer: Answer = {
  id: '01M2FC6B5DF1P326J29KCWQRMR',
  text: '`switchMap` cancels the previous inner observable when a new value arrives (classic use: typeahead search — cancel the stale request). `mergeMap` runs all inner observables concurrently (use when order doesn\'t matter and you want everything to complete). `concatMap` queues them, running one at a time in order (use when order matters, e.g., sequential writes). `exhaustMap` ignores new emissions while an inner observable is still active (classic use: preventing double-submit on a button click).',
  references: [],
  related: [],
}

const unsubscribeAnswer: Answer = {
  id: '01M2FC6B5DG9KYQ4HW9Y8KK1S9',
  text: "An unmanaged subscription keeps a reference alive past the component's lifetime, causing memory leaks and, in the worst case, callbacks firing against a destroyed component. Common patterns: the `async` pipe (Angular manages subscribe/unsubscribe automatically — the generally preferred approach), `takeUntilDestroyed()` (newer, ties to the component's `DestroyRef`), or manually tracking subscriptions and calling `.unsubscribe()` in `ngOnDestroy`.",
  references: [],
  related: [],
}

const controlFlowAnswer: Answer = {
  id: '01M2FC6B5DJAA3P0GRS7HS2HFY',
  text: 'The new built-in control-flow syntax (introduced in v17) is compiled directly rather than relying on structural directives, giving better type-checking, clearer syntax (no more `*` micro-syntax or `<ng-template>` desugaring to understand), and reportedly better runtime performance. `@for` also requires an explicit `track` expression (Angular\'s answer to the old easily-forgotten `trackBy` function), which forces you to think about list identity.',
  references: [],
  related: [],
}

const deferAnswer: Answer = {
  id: '01M2FC6B5DNGDKR860Z4Z9AF8V',
  text: "`@defer` lets you lazily load and render part of a template based on a trigger (viewport visibility, interaction, idle time, or a timer), splitting that chunk into a separate JS bundle automatically. It's Angular's built-in answer to shipping less JS up front — commonly asked about in performance-focused interviews as an alternative/complement to route-level lazy loading.",
  references: [],
  related: [],
}

const formsChoiceAnswer: Answer = {
  id: '01M2FC6B5DZY7DWJCFW12660Y6',
  text: 'Reactive forms build the form model in the component class (`FormGroup`/`FormControl`), giving synchronous access, easier unit testing, and better support for dynamic/complex forms. Template-driven forms build the model implicitly via directives in the template (`ngModel`), which is quicker for simple forms but harder to test and less predictable at scale. Most production/enterprise interviews expect reactive forms as the default answer, with template-driven acknowledged for simple cases.',
  references: [],
  related: [],
}

const crossFieldValidationAnswer: Answer = {
  id: '01M2FC6B5DJD6Y5HKQPPVRTPBS',
  text: "Attach a custom validator function to the parent `FormGroup` (not the individual controls), since it needs access to sibling controls' values — e.g., comparing `password` and `confirmPassword` and returning a validation error object on the group if they don't match.",
  references: [],
  related: [],
}

const functionalGuardsAnswer: Answer = {
  id: '01M2FC6B5DVADCM300XBQV8PN9',
  text: "Functional guards are plain functions (e.g., `CanActivateFn`) that use `inject()` to pull in dependencies, replacing the older pattern of implementing a `CanActivate` interface on an injectable class. They're less boilerplate-heavy and align with the standalone-components direction of the framework.",
  references: [],
  related: [],
}

const lazyLoadingRoutesAnswer: Answer = {
  id: '01M2FC6B5D9N58H5E78VP2VAY7',
  text: 'Routes can point to `loadComponent` (standalone) or `loadChildren` (route groups), which tells the bundler to split that code into a separate chunk fetched only when the user navigates there. This keeps the initial bundle small — a frequent performance-question anchor point, often paired with a question about analyzing bundle size with visualizers to find what\'s bloating the initial chunk.',
  references: [],
  related: [],
}

const perfTechniquesAnswer: Answer = {
  id: '01M2FC6B5DFWRW86NCNH9K4G8B',
  text: 'Common list interviewers expect: `OnPush` change detection + immutable data; `track` expressions on `@for`; route-level lazy loading and `@defer` blocks; the `async` pipe over manual subscriptions; avoiding function calls in templates (they re-run every CD cycle — use a Signal/pipe/pure computation instead); virtual scrolling (`cdk-virtual-scroll`) for long lists; analyzing bundle size to trim heavy dependencies; and, at the architecture level, moving toward Signals/zone-less to reduce unnecessary CD cycles.',
  references: [onPushRef.id, signalRef.id],
  related: [],
}

const methodInTemplateAnswer: Answer = {
  id: '01M2FC6B5DVE9J6SX1QPTKEJHV',
  text: "Every change-detection cycle re-evaluates template expressions, so a method call there re-executes on every cycle — potentially many times per second — even if its inputs haven't changed. The fix is a pure `pipe`, a memoized `computed()` Signal, or precomputing the value and binding to a property instead.",
  references: [signalRef.id],
  related: [],
}

const hydrationAnswer: Answer = {
  id: '01M2FC6B5DZE06707P5M4V9FWH',
  text: 'Server-side rendering (SSR) sends fully-rendered HTML to the browser for fast first paint and SEO. Older Angular hydration would discard that server-rendered DOM and re-render from scratch on the client, causing visible flicker. Non-destructive hydration (introduced ~v16-17, improved since) reuses the existing DOM nodes and just attaches event listeners/reactivity to them, eliminating the flicker and reducing load time.',
  references: [hydrationRef.id],
  related: [],
}

const csrSsrSsgAnswer: Answer = {
  id: '01M2FC6B5D7ERJX8VDM3H6A882',
  text: "CSR (client-side rendering) is simplest but slower first paint and weaker SEO. SSR gives fast first paint and good SEO at the cost of server infrastructure and complexity (and needs hydration handled correctly). SSG (static generation, via Angular's prerendering) is fastest and cheapest to host for content that doesn't change per-request, but isn't suitable for highly personalized/dynamic pages.",
  references: [],
  related: [],
}

const testBedAnswer: Answer = {
  id: '01M2FC6B5DJ8W5W6V52CMYQ01K',
  text: "`TestBed` configures a testing module (or standalone component's testing environment) so Angular can create the component with its dependencies resolved — real or mocked. Typical pattern: provide a mock/stub for services via `TestBed.configureTestingModule({ providers: [{ provide: RealService, useValue: mockService }] })`, then assert on the component's rendered output or emitted events.",
  references: [],
  related: [],
}

const signalVsObservableTestAnswer: Answer = {
  id: '01M2FC6B5DVWS4THFT7EBEJQRK',
  text: "A Signal's current value is read synchronously (`mySignal()`), so assertions are direct — no async handling needed for the signal itself, though you still need `fixture.detectChanges()` to flush template updates. An Observable-based test typically needs `fakeAsync`/`tick()`, `waitForAsync`, or subscribing in the test and asserting inside the callback, since the value arrives asynchronously.",
  references: [signalRef.id],
  related: [],
}

const ngrxAnswer: Answer = {
  id: '01M2FC6B5DKGTN481RZV44SY37',
  text: "NgRx applies a Redux-style pattern — unidirectional data flow, immutable state, actions as the sole way to trigger state change, effects for side effects — which pays off at scale: predictable state transitions, time-travel debugging, and a clear audit trail of what changed and why. For small-to-medium apps, a well-organized service with Signals often covers the need with far less boilerplate; the honest interview answer is that it's a scale/complexity trade-off, not a default choice.",
  references: [ngrxRef.id, signalRef.id],
  related: [],
}

// Section 12 ("Senior/Scenario-Style Questions") departs from the **Q:**/A:
// pattern used elsewhere in data/angular.md — it's a bullet list of prompts
// with one shared framing for how to structure an answer, not discrete
// per-item answers. Each bullet is transcribed as its own question, paired
// with that shared framing text (quoted verbatim from the source) as the
// answer, rather than inventing a distinct answer per bullet.
const scenarioFramingText =
  "Interviewers are shifting from definition recall to trade-off reasoning. Be ready to talk through, out loud, a debugging story rather than a textbook definition. Structure your answer as: symptom → hypothesis → tool used to confirm → fix → how you'd prevent recurrence. Interviewers are explicitly listening for whether you can reason about *why*, not just recite the fix."

const perfDiagnosedAnswer: Answer = {
  id: '01M2FC6B5DSBG0TXXMT4BH0G86',
  text: scenarioFramingText,
  references: [],
  related: [],
}

const standaloneMigrationAnswer: Answer = {
  id: '01M2FC6B5DVGQ8PKN1CYNAY19K',
  text: scenarioFramingText,
  references: [],
  related: [],
}

const whenNotSignalsAnswer: Answer = {
  id: '01M2FC6B5DGCKK7P43Q8XXT3B6',
  text: scenarioFramingText,
  references: [],
  related: [],
}

const rerenders40xAnswer: Answer = {
  id: '01M2FC6B5DK2RR5X8J1XXAJPTC',
  text: scenarioFramingText,
  references: [],
  related: [],
}

const signalVsObservableVsNgrxStoreAnswer: Answer = {
  id: '01M2FC6Q71JX5CHB05W6TX6Q1N',
  text: scenarioFramingText,
  references: [],
  related: [],
}

export const questions: Question[] = [
  {
    id: '01M2FC6B5AX3YR4B01W09KGJHX',
    question: "What's the difference between standalone components and NgModules, and why did Angular move away from NgModules?",
    answer: standaloneAnswer,
    tags: ['Fundamentals & Architecture'],
  },
  {
    id: '01M2FC6B5C429XYATV4GRY4E02',
    question: "Explain Angular's component lifecycle hooks.",
    answer: lifecycleAnswer,
    tags: ['Fundamentals & Architecture'],
  },
  {
    id: '01M2FC6B5CW2G0WQ55T2502SDJ',
    question: 'What are Signals, and how do they differ from Observables/RxJS?',
    answer: signalsAnswer,
    tags: ['Change Detection, Signals & Zone-less Angular'],
  },
  {
    id: '01M2FC6B5CD1NXDVVB3NW88MG0',
    question: "What is a component, and what are the core pieces of Angular's architecture?",
    answer: architectureAnswer,
    tags: ['Fundamentals & Architecture'],
  },
  {
    id: '01M2FC6B5C31MA6DAKC4EANV22',
    question: "One-way vs two-way data binding — what's actually happening under the hood with `[(ngModel)]`?",
    answer: bindingAnswer,
    tags: ['Fundamentals & Architecture'],
  },
  {
    id: '01M2FC6B5C5JN808EZYP38XJHW',
    question: 'AOT vs JIT compilation — why does it matter?',
    answer: aotJitAnswer,
    tags: ['Fundamentals & Architecture'],
  },
  {
    id: '01M2FC6B5CGMCMRRSZ23QHHYQP',
    question: "How does Angular's change detection traditionally work, and what's the problem with it?",
    answer: changeDetectionZoneJsAnswer,
    tags: ['Change Detection, Signals & Zone-less Angular'],
  },
  {
    id: '01M2FC6B5CBK7D9MG0C7GAX8P6',
    question: "What is zone-less Angular, and what's the trade-off?",
    answer: zonelessAnswer,
    tags: ['Change Detection, Signals & Zone-less Angular'],
  },
  {
    id: '01M2FC6B5D42T0HEXBZ5MENS23',
    question: 'Explain `OnPush` change detection strategy.',
    answer: onPushAnswer,
    tags: ['Change Detection, Signals & Zone-less Angular'],
  },
  {
    id: '01M2FC6B5DW33W9VGMTXT55AZ8',
    question: 'Scenario: a dashboard component subscribes to three data streams and users report sluggish scrolling on low-end devices. What do you check first?',
    answer: scenarioDashboardAnswer,
    tags: ['Change Detection, Signals & Zone-less Angular'],
  },
  {
    id: '01M2FC6B5D9TFHH81KE6MZSKAY',
    question: "How does Angular's DI system work, and what's a provider?",
    answer: diProviderAnswer,
    tags: ['Dependency Injection'],
  },
  {
    id: '01M2FC6B5DE6KAYSGAJ3SD624H',
    question: "What's the difference between `providedIn: 'root'` and providing a service in a component's `providers` array?",
    answer: providedInAnswer,
    tags: ['Dependency Injection'],
  },
  {
    id: '01M2FC6B5DXQ4KXAAPDQSRX9JG',
    question: 'What is the `inject()` function and why did Angular introduce it alongside constructor injection?',
    answer: injectFnAnswer,
    tags: ['Dependency Injection'],
  },
  {
    id: '01M2FC6B5DWMX9EC4B890R7Q0P',
    question: 'Why does RxJS show up everywhere in Angular rather than being an optional library?',
    answer: whyRxjsAnswer,
    tags: ['RxJS in Angular'],
  },
  {
    id: '01M2FC6B5DHAZEAB7EVV7DG5GP',
    question: '`switchMap` vs `mergeMap` vs `concatMap` vs `exhaustMap` — when do you use each?',
    answer: rxjsOperatorsAnswer,
    tags: ['RxJS in Angular'],
  },
  {
    id: '01M2FC6B5DGDN2TECYW1DYK0MC',
    question: 'Why must you unsubscribe from Observables, and what are the common ways to handle it in Angular?',
    answer: unsubscribeAnswer,
    tags: ['RxJS in Angular'],
  },
  {
    id: '01M2FC6B5D1MTYCXFNYX25XBHW',
    question: 'What changed with `@if` / `@for` / `@switch` compared to `*ngIf` / `*ngFor` / `*ngSwitch`?',
    answer: controlFlowAnswer,
    tags: ['Modern Template Syntax'],
  },
  {
    id: '01M2FC6B5D2G5CNG92YQHVZTGE',
    question: 'What is a `@defer` block and what problem does it solve?',
    answer: deferAnswer,
    tags: ['Modern Template Syntax'],
  },
  {
    id: '01M2FC6B5D83Z78C68CHASAYVQ',
    question: 'Reactive forms vs template-driven forms — how do you choose?',
    answer: formsChoiceAnswer,
    tags: ['Forms'],
  },
  {
    id: '01M2FC6B5DZHJVZHPP5RP61347',
    question: 'How do you implement cross-field validation (e.g., password confirmation)?',
    answer: crossFieldValidationAnswer,
    tags: ['Forms'],
  },
  {
    id: '01M2FC6B5DBHEXSKF0J13XVV35',
    question: 'What are functional guards, and how do they differ from class-based guards?',
    answer: functionalGuardsAnswer,
    tags: ['Routing'],
  },
  {
    id: '01M2FC6B5DERFVSG2PY1F3W7RZ',
    question: 'How does lazy loading work at the route level, and why does it matter for performance?',
    answer: lazyLoadingRoutesAnswer,
    tags: ['Routing'],
  },
  {
    id: '01M2FC6B5DZ03G456AZC4TC6PT',
    question: "Name concrete techniques to improve an Angular app's performance.",
    answer: perfTechniquesAnswer,
    tags: ['Performance'],
  },
  {
    id: '01M2FC6B5D55HGN39CJJ2MWGSQ',
    question: 'Why is calling a method directly in a template (e.g., `{{ getTotal() }}`) considered an anti-pattern?',
    answer: methodInTemplateAnswer,
    tags: ['Performance'],
  },
  {
    id: '01M2FC6B5DW4EMZKK58V0DSDJB',
    question: 'What is hydration, and why did Angular invest in "non-destructive" hydration?',
    answer: hydrationAnswer,
    tags: ['SSR & Hydration'],
  },
  {
    id: '01M2FC6B5DQM31WDGB6EPMAKS2',
    question: "What's the trade-off consideration between CSR, SSR, and SSG for an Angular app?",
    answer: csrSsrSsgAnswer,
    tags: ['SSR & Hydration'],
  },
  {
    id: '01M2FC6B5DM6Y9E4WNTH47TQAQ',
    question: "How do you test a component with a dependency, and what's `TestBed` for?",
    answer: testBedAnswer,
    tags: ['Testing'],
  },
  {
    id: '01M2FC6B5DCKD99FRKH3HHYYD4',
    question: 'How would you unit test a Signal-based component vs an Observable-based one?',
    answer: signalVsObservableTestAnswer,
    tags: ['Testing'],
  },
  {
    id: '01M2FC6B5D6XBD8X6HCPH89GVP',
    question: 'When would you reach for NgRx (or similar) instead of just services + Signals?',
    answer: ngrxAnswer,
    tags: ['State Management'],
  },
  {
    id: '01M2FC6B5DXS4QYQRAZX76TY9T',
    question: 'Describe a real performance problem you diagnosed in an Angular app — what did you find, and what did you change?',
    answer: perfDiagnosedAnswer,
    tags: ['Senior/Scenario-Style Questions (increasingly common)'],
  },
  {
    id: '01M2FC6B5DYR78GYXCZR1JESC6',
    question: 'Your team is migrating a large NgModule-based app toward standalone components — how do you sequence that migration safely?',
    answer: standaloneMigrationAnswer,
    tags: ['Senior/Scenario-Style Questions (increasingly common)'],
  },
  {
    id: '01M2FC6B5DTQAQ46Z7RCDM21P9',
    question: 'When would you deliberately *not* use Signals, even in a green-field v18+ app?',
    answer: whenNotSignalsAnswer,
    tags: ['Senior/Scenario-Style Questions (increasingly common)'],
  },
  {
    id: '01M2FC6Q71YHREZMTY3Q2F5JYX',
    question: 'A component re-renders 40 times a second on a production dashboard — walk through your investigation.',
    answer: rerenders40xAnswer,
    tags: ['Senior/Scenario-Style Questions (increasingly common)'],
  },
  {
    id: '01M2FC6Q71QNQQFAE7PVC4DSM4',
    question: 'How do you decide what should live in a Signal vs an Observable vs NgRx store in a medium-sized app?',
    answer: signalVsObservableVsNgrxStoreAnswer,
    tags: ['Senior/Scenario-Style Questions (increasingly common)'],
  },
]
