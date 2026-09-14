# Angular Interview Questions & Answers (Current — 2026)

Angular interviews have shifted noticeably since the standalone-components and Signals era began (v16–17 onward). Interviewers now weight **why Angular changed direction** and **trade-off reasoning** more heavily than rote lifecycle-hook trivia. This guide is organized so you can go deep on the areas that actually get probed today, with legacy fundamentals kept in for completeness since many production codebases are still NgModule/zone.js-based.

---

## 1. Fundamentals & Architecture

**Q: What's the difference between standalone components and NgModules, and why did Angular move away from NgModules?**
A: A standalone component declares its own dependencies (other components, directives, pipes) directly in its `@Component` decorator's `imports` array, instead of relying on an NgModule to provide that context. This removes a layer of indirection, cuts boilerplate, simplifies lazy loading (you can lazy-load a single component instead of a whole module), and makes the mental model closer to how other modern frameworks work. Since Angular 17, standalone is the default for new projects; NgModules still work and remain common in older/enterprise codebases, but new apps rarely start with them.

**Q: What is a component, and what are the core pieces of Angular's architecture?**
A: A component is a class decorated with `@Component` that controls a patch of the DOM via a template, styles, and logic. Around it, Angular's architecture consists of: components (UI), services (business logic/state, often shared via DI), directives (behavior/attribute manipulation), pipes (display transformation), and routing (URL-to-view mapping). Signals now sit alongside this as a state/reactivity primitive.

**Q: Explain Angular's component lifecycle hooks.**
A: In order: `ngOnChanges` (input-bound property changes), `ngOnInit` (once, after first `ngOnChanges`), `ngDoCheck` (custom change detection), `ngAfterContentInit`/`ngAfterContentChecked` (projected content), `ngAfterViewInit`/`ngAfterViewChecked` (component's own view and children), `ngOnDestroy` (cleanup — unsubscribe, detach listeners). Interviewers increasingly ask this as a stepping stone to a follow-up on *why* `ngOnDestroy` matters (subscription leaks).

**Q: One-way vs two-way data binding — what's actually happening under the hood with `[(ngModel)]`?**
A: `[(ngModel)]` is syntactic sugar combining property binding `[ngModel]` and event binding `(ngModelChange)` — Angular's "banana in a box" syntax. One-way binding (`[prop]` or `{{ }}`) pushes data one direction; two-way binding adds a listener that pushes changes back. It's the same pattern you'd hand-roll with any `[x]` + `(xChange)` pair on a custom component.

**Q: AOT vs JIT compilation — why does it matter?**
A: Ahead-of-Time (AOT) compiles templates to JavaScript during the build, catching template errors at build time and shipping a smaller runtime (no compiler needed in the browser) — this is the production default. Just-in-Time (JIT) compiles in the browser at runtime, useful mainly for certain dev scenarios. AOT is essentially always what's used in production.

---

## 2. Change Detection, Signals & Zone-less Angular

**Q: How does Angular's change detection traditionally work, and what's the problem with it?**
A: Angular has historically used Zone.js, which monkey-patches async browser APIs (setTimeout, promises, DOM events, XHR) so Angular knows *something* happened and runs change detection. The problem: it triggers a check of the entire component tree on almost any async event, which is wasteful at scale and adds real bundle weight (Zone.js is roughly ~70KB gzipped-adjacent overhead in discussions of this trade-off).

**Q: What are Signals, and how do they differ from Observables/RxJS?**
A: A Signal is a reactive container around a value that tracks exactly which template bindings read it. When it changes, Angular updates only those specific bindings — fine-grained reactivity — rather than walking the component tree. Observables model async *streams* over time (HTTP calls, WebSocket events, combining multiple sources); Signals model synchronous, glitch-free *state*. Rule of thumb interviewers like: use Signals for local/component state, RxJS for async orchestration — and `toSignal()`/`toObservable()` bridge the two when needed.

**Q: What is zone-less Angular, and what's the trade-off?**
A: Zone-less mode removes Zone.js entirely and relies on Signals (plus explicit APIs) to know when to re-render, rather than patching async APIs to detect "something happened." Benefit: smaller bundles, more predictable/performant updates. Trade-off: any state that changes outside Angular's knowledge (e.g., a third-party library mutating something) won't trigger a view update unless it's wired through a Signal or you manually trigger detection — so it demands more discipline about where state lives.

**Q: Explain `OnPush` change detection strategy.**
A: With `ChangeDetectionStrategy.OnPush`, a component only re-checks when: an `@Input()` reference changes, an event originates from within the component, an `Observable` bound with the `async` pipe emits, or a Signal it reads changes. It's the main lever for performance in large component trees, but requires immutable data patterns (replacing objects/arrays rather than mutating them) to work correctly — a very common interview follow-up: "why didn't my OnPush component update?"

**Q: Scenario: a dashboard component subscribes to three data streams and users report sluggish scrolling on low-end devices. What do you check first?**
A: This is a common senior-level scenario question. A strong answer walks through: (1) whether change detection is running excessively — check if the component is default (checks whole tree) vs OnPush; (2) whether subscriptions are properly cleaned up in `ngOnDestroy` (leaks compound over time); (3) whether the `async` pipe is used instead of manual subscribe+setState (avoids manual CD triggers); (4) profiling with Chrome DevTools' Performance tab or Angular DevTools to see change-detection cycle frequency; (5) whether `trackBy` is used on any `*ngFor`/`@for` rendering list items from those streams.

---

## 3. Dependency Injection

**Q: How does Angular's DI system work, and what's a provider?**
A: Angular maintains a hierarchical injector tree. A provider tells an injector how to create a value for a token (a class, `useValue`, `useFactory`, or `useExisting`). When a component/service asks for a dependency via constructor injection (or the newer `inject()` function), Angular walks up the injector hierarchy until it finds a matching provider. Providing something at the root (`providedIn: 'root'`) makes it a singleton app-wide; providing it in a component makes it scoped to that component and its children.

**Q: What's the difference between `providedIn: 'root'` and providing a service in a component's `providers` array?**
A: `providedIn: 'root'` creates one singleton shared by the whole app (and enables tree-shaking if unused). Providing in a component's own `providers` array creates a new instance for that component subtree — useful when you want isolated state per component instance (e.g., a wizard step, a modal).

**Q: What is the `inject()` function and why did Angular introduce it alongside constructor injection?**
A: `inject()` lets you retrieve a dependency without constructor parameters, which is essential for functional guards/resolvers/interceptors (plain functions, not classes) and makes DI usable in more contexts (e.g., field initializers). It's functionally equivalent to constructor injection but more flexible syntactically.

---

## 4. RxJS in Angular

**Q: Why does RxJS show up everywhere in Angular rather than being an optional library?**
A: Angular's `HttpClient` returns Observables, the Router's events and params are Observable-based, and reactive forms expose `valueChanges` as Observables. Historically this made RxJS unavoidable for anything async. Signals are narrowing that footprint for local state, but RxJS remains the tool for combining/transforming streams (`combineLatest`, `switchMap`, `debounceTime`, etc.).

**Q: `switchMap` vs `mergeMap` vs `concatMap` vs `exhaustMap` — when do you use each?**
A: `switchMap` cancels the previous inner observable when a new value arrives (classic use: typeahead search — cancel the stale request). `mergeMap` runs all inner observables concurrently (use when order doesn't matter and you want everything to complete). `concatMap` queues them, running one at a time in order (use when order matters, e.g., sequential writes). `exhaustMap` ignores new emissions while an inner observable is still active (classic use: preventing double-submit on a button click).

**Q: Why must you unsubscribe from Observables, and what are the common ways to handle it in Angular?**
A: An unmanaged subscription keeps a reference alive past the component's lifetime, causing memory leaks and, in the worst case, callbacks firing against a destroyed component. Common patterns: the `async` pipe (Angular manages subscribe/unsubscribe automatically — the generally preferred approach), `takeUntilDestroyed()` (newer, ties to the component's `DestroyRef`), or manually tracking subscriptions and calling `.unsubscribe()` in `ngOnDestroy`.

---

## 5. Modern Template Syntax

**Q: What changed with `@if` / `@for` / `@switch` compared to `*ngIf` / `*ngFor` / `*ngSwitch`?**
A: The new built-in control-flow syntax (introduced in v17) is compiled directly rather than relying on structural directives, giving better type-checking, clearer syntax (no more `*` micro-syntax or `<ng-template>` desugaring to understand), and reportedly better runtime performance. `@for` also requires an explicit `track` expression (Angular's answer to the old easily-forgotten `trackBy` function), which forces you to think about list identity.

**Q: What is a `@defer` block and what problem does it solve?**
A: `@defer` lets you lazily load and render part of a template based on a trigger (viewport visibility, interaction, idle time, or a timer), splitting that chunk into a separate JS bundle automatically. It's Angular's built-in answer to shipping less JS up front — commonly asked about in performance-focused interviews as an alternative/complement to route-level lazy loading.

---

## 6. Forms

**Q: Reactive forms vs template-driven forms — how do you choose?**
A: Reactive forms build the form model in the component class (`FormGroup`/`FormControl`), giving synchronous access, easier unit testing, and better support for dynamic/complex forms. Template-driven forms build the model implicitly via directives in the template (`ngModel`), which is quicker for simple forms but harder to test and less predictable at scale. Most production/enterprise interviews expect reactive forms as the default answer, with template-driven acknowledged for simple cases.

**Q: How do you implement cross-field validation (e.g., password confirmation)?**
A: Attach a custom validator function to the parent `FormGroup` (not the individual controls), since it needs access to sibling controls' values — e.g., comparing `password` and `confirmPassword` and returning a validation error object on the group if they don't match.

---

## 7. Routing

**Q: What are functional guards, and how do they differ from class-based guards?**
A: Functional guards are plain functions (e.g., `CanActivateFn`) that use `inject()` to pull in dependencies, replacing the older pattern of implementing a `CanActivate` interface on an injectable class. They're less boilerplate-heavy and align with the standalone-components direction of the framework.

**Q: How does lazy loading work at the route level, and why does it matter for performance?**
A: Routes can point to `loadComponent` (standalone) or `loadChildren` (route groups), which tells the bundler to split that code into a separate chunk fetched only when the user navigates there. This keeps the initial bundle small — a frequent performance-question anchor point, often paired with a question about analyzing bundle size with visualizers to find what's bloating the initial chunk.

---

## 8. Performance

**Q: Name concrete techniques to improve an Angular app's performance.**
A: Common list interviewers expect: `OnPush` change detection + immutable data; `track` expressions on `@for`; route-level lazy loading and `@defer` blocks; the `async` pipe over manual subscriptions; avoiding function calls in templates (they re-run every CD cycle — use a Signal/pipe/pure computation instead); virtual scrolling (`cdk-virtual-scroll`) for long lists; analyzing bundle size to trim heavy dependencies; and, at the architecture level, moving toward Signals/zone-less to reduce unnecessary CD cycles.

**Q: Why is calling a method directly in a template (e.g., `{{ getTotal() }}`) considered an anti-pattern?**
A: Every change-detection cycle re-evaluates template expressions, so a method call there re-executes on every cycle — potentially many times per second — even if its inputs haven't changed. The fix is a pure `pipe`, a memoized `computed()` Signal, or precomputing the value and binding to a property instead.

---

## 9. SSR & Hydration

**Q: What is hydration, and why did Angular invest in "non-destructive" hydration?**
A: Server-side rendering (SSR) sends fully-rendered HTML to the browser for fast first paint and SEO. Older Angular hydration would discard that server-rendered DOM and re-render from scratch on the client, causing visible flicker. Non-destructive hydration (introduced ~v16-17, improved since) reuses the existing DOM nodes and just attaches event listeners/reactivity to them, eliminating the flicker and reducing load time.

**Q: What's the trade-off consideration between CSR, SSR, and SSG for an Angular app?**
A: CSR (client-side rendering) is simplest but slower first paint and weaker SEO. SSR gives fast first paint and good SEO at the cost of server infrastructure and complexity (and needs hydration handled correctly). SSG (static generation, via Angular's prerendering) is fastest and cheapest to host for content that doesn't change per-request, but isn't suitable for highly personalized/dynamic pages.

---

## 10. Testing

**Q: How do you test a component with a dependency, and what's `TestBed` for?**
A: `TestBed` configures a testing module (or standalone component's testing environment) so Angular can create the component with its dependencies resolved — real or mocked. Typical pattern: provide a mock/stub for services via `TestBed.configureTestingModule({ providers: [{ provide: RealService, useValue: mockService }] })`, then assert on the component's rendered output or emitted events.

**Q: How would you unit test a Signal-based component vs an Observable-based one?**
A: A Signal's current value is read synchronously (`mySignal()`), so assertions are direct — no async handling needed for the signal itself, though you still need `fixture.detectChanges()` to flush template updates. An Observable-based test typically needs `fakeAsync`/`tick()`, `waitForAsync`, or subscribing in the test and asserting inside the callback, since the value arrives asynchronously.

---

## 11. State Management

**Q: When would you reach for NgRx (or similar) instead of just services + Signals?**
A: NgRx applies a Redux-style pattern — unidirectional data flow, immutable state, actions as the sole way to trigger state change, effects for side effects — which pays off at scale: predictable state transitions, time-travel debugging, and a clear audit trail of what changed and why. For small-to-medium apps, a well-organized service with Signals often covers the need with far less boilerplate; the honest interview answer is that it's a scale/complexity trade-off, not a default choice.

---

## 12. Senior/Scenario-Style Questions (increasingly common)

Interviewers are shifting from definition recall to trade-off reasoning. Be ready to talk through, out loud, a debugging story rather than a textbook definition:

- "Describe a real performance problem you diagnosed in an Angular app — what did you find, and what did you change?"
- "Your team is migrating a large NgModule-based app toward standalone components — how do you sequence that migration safely?"
- "When would you deliberately *not* use Signals, even in a green-field v18+ app?"
- "A component re-renders 40 times a second on a production dashboard — walk through your investigation."
- "How do you decide what should live in a Signal vs an Observable vs NgRx store in a medium-sized app?"

For these, structure your answer as: symptom → hypothesis → tool used to confirm → fix → how you'd prevent recurrence. Interviewers are explicitly listening for whether you can reason about *why*, not just recite the fix.

---

*Note: version numbers above (e.g., "Signals in v16," "@defer in v17") reflect the general timeline as of major recent Angular releases — always sanity-check exact version attribution against the Angular changelog if a question hinges on precise versioning, since minor releases ship features continuously.*
