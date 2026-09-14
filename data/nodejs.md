# Node.js Interview Questions & Answers (2026 Edition)

How Node.js interviews have shifted: junior-level "what is non-blocking I/O" questions have moved down to the resume-screen stage. At mid/senior level, interviewers now expect you to trace event-loop execution order line by line, diagnose a memory leak from a heap snapshot, defend a Cluster-vs-Worker-Threads choice, and open with a system-design prompt ("design a URL shortener," "design a chat backend") before drilling into implementation. TypeScript fluency is assumed, not a bonus.

This doc is organized so you can drill weak areas independently. Where a question has a "trace" example, cover the output and predict it before reading the answer.

---

## 1. Event Loop & Async Internals (heaviest-weighted topic)

### Q1. What are the phases of the Node.js event loop, in order?
**A:** Each loop iteration ("tick") passes through six phases, run by libuv:
1. **Timers** — runs expired `setTimeout`/`setInterval` callbacks.
2. **Pending callbacks** — deferred system-level callbacks (e.g. some TCP errors).
3. **Idle, prepare** — internal, not user-facing.
4. **Poll** — retrieves new I/O events and runs their callbacks; blocks here if empty (unless something is scheduled for the check phase).
5. **Check** — runs `setImmediate` callbacks.
6. **Close callbacks** — e.g. `socket.on('close', ...)`.

Critically: **microtasks are not a phase.** The nextTick queue and the Promise microtask queue drain completely *between every single callback*, not just between phases.

### Q2. What's the priority order between `process.nextTick`, Promise microtasks, and macrotasks (timers/I/O/setImmediate)?
**A:** `process.nextTick` queue → Promise microtask queue → current phase's macrotask callback → repeat. Both queues are drained *fully* before the loop proceeds, and callbacks added while draining still run in the same drain — which is exactly why a recursive `process.nextTick()` can starve the event loop entirely (I/O never gets a turn).

**Trace this:**
```js
console.log("1: sync start");
setTimeout(() => console.log("2: setTimeout"), 0);
setImmediate(() => console.log("3: setImmediate"));
Promise.resolve().then(() => console.log("4: promise"));
process.nextTick(() => console.log("5: nextTick"));
console.log("6: sync end");
```
**Answer:** `1, 6, 5, 4, 2, 3` — sync code first, then nextTick drains, then promise microtasks drain, then the loop proceeds to phases (timers before check, at the top level).

### Q3. `setImmediate` vs `setTimeout(fn, 0)` — which runs first?
**A:** At the top level, it's *not guaranteed* — it depends on process startup timing relative to the ~1ms timer resolution. But **inside an I/O callback, `setImmediate` always wins**, because the loop is already past the timers phase and reaches check (poll → check) before it would loop back around to timers.

```js
const fs = require("fs");
fs.readFile(__filename, () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
});
// Always: immediate → timeout
```

### Q4. Why is "Node.js is single-threaded" a half-truth?
**A:** The JS execution thread (your callback code) is single-threaded, but Node uses a libuv-managed **thread pool** (default size 4) for things the OS doesn't offer async APIs for — DNS lookups (`dns.lookup`), some filesystem operations, crypto (`pbkdf2`, `scrypt`), and zlib compression. Network I/O itself is handled by the OS's async I/O (epoll/kqueue/IOCP), not the thread pool.

### Q5. What's a good technique to avoid blocking the event loop with a large synchronous loop?
**A:** Break the work into chunks and yield control back to the loop between chunks, e.g. via `setImmediate`:
```js
function processChunk(items, i = 0) {
  const end = Math.min(i + 1000, items.length);
  for (; i < end; i++) heavyWork(items[i]);
  if (i < items.length) setImmediate(() => processChunk(items, i));
}
```
For genuinely CPU-bound work, prefer offloading to a worker thread (see §3) rather than chunking indefinitely.

---

## 2. Modules: CommonJS vs ESM

### Q6. Core differences between CommonJS and ES Modules?
**A:** CJS (`require`/`module.exports`) loads and evaluates modules **synchronously at runtime**, resolving `require()` calls dynamically. ESM (`import`/`export`) is **parsed statically before execution**, which is what enables top-level `await`, live bindings, better tree-shaking, and a shared module system with browsers.

### Q7. How does Node decide whether a `.js` file is CJS or ESM?
**A:** By extension first: `.mjs` is always ESM, `.cjs` is always CJS. For `.js`, Node looks at the nearest `package.json`'s `"type"` field (`"module"` → ESM, default/`"commonjs"` → CJS).

### Q8. Can you `require()` an ESM module, or `import` a CJS one?
**A:** CJS can `import()` (dynamic, async) an ESM module but not `require()` it directly (as of the LTS lines still in wide use). ESM can `import` a CJS module — it gets the CJS `module.exports` as the default export, with limited named-export interop via static analysis.

---

## 3. Concurrency: Cluster vs Worker Threads vs Child Process

### Q9. How does the `cluster` module improve performance, and what does it *not* solve?
**A:** `cluster` forks multiple **worker processes** that share the same server port (via round-robin or OS-level load balancing), so a single-threaded runtime can use multiple CPU cores for handling more concurrent connections, and supports rolling restarts with zero downtime. It does **not** give you shared memory — each worker has its own heap, event loop, and module cache, so in-memory caches/state must be externalized (Redis, etc.) or replicated per worker.

### Q10. When would you reach for `worker_threads` instead of `cluster`?
**A:** `worker_threads` run in the same process and can share memory via `SharedArrayBuffer`, making them the right tool for **CPU-bound work** (image processing, heavy parsing, crypto) that needs to run off the main thread without the overhead of a full process fork or losing shared state. `cluster`/multiple processes are better for **scaling request throughput** across cores for I/O-bound workloads.

### Q11. `child_process.fork()` vs `.spawn()`?
**A:** `spawn()` launches any command and streams stdout/stderr; it doesn't set up IPC by default. `fork()` is specifically for spawning new Node.js processes and automatically sets up an IPC channel so parent and child can `.send()` messages to each other — it's essentially `spawn()` specialized for Node-to-Node communication.

---

## 4. Streams & Buffers

### Q12. Why use streams instead of reading a whole file into memory?
**A:** Streams process data in chunks, so memory usage stays flat regardless of input size — critical for large files, video, or proxying HTTP responses. The four stream types: **Readable** (source, e.g. `fs.createReadStream`), **Writable** (sink), **Duplex** (both, e.g. a TCP socket), **Transform** (duplex that modifies data in transit, e.g. `zlib.createGzip()`).

### Q13. What does `.pipe()` handle for you that manual `.on('data')` doesn't?
**A:** **Backpressure.** If the writable side is slower than the readable side, `.pipe()` automatically pauses the readable stream until the writable's internal buffer drains, preventing unbounded memory growth. Manually wiring `data`/`write` events requires you to check the boolean return value of `.write()` and pause/resume yourself.

### Q14. What's a `Buffer`, and why does Node need it separately from a JS string?
**A:** A `Buffer` is a fixed-length chunk of raw binary memory allocated outside the V8 heap, used for handling binary data (file contents, TCP packets, image bytes) that isn't naturally representable as UTF-16 strings. Buffers avoid the encoding/decoding overhead and memory bloat of forcing binary data through the string type.

---

## 5. Memory Management & Performance Diagnostics

### Q15. How would you diagnose a memory leak in a long-running Node process?
**A:** Take heap snapshots at intervals — via `node --inspect` + Chrome DevTools' Memory tab, or the `heapdump` package — and compare them to spot objects whose retained size keeps growing across snapshots ("comparison view"). Common culprits:
- Unbounded in-memory caches (no TTL/eviction)
- Event listeners registered but never removed (`emitter.on` without `.off`, especially in per-request handlers)
- Closures unintentionally retaining large objects in scope
- Global arrays/maps used as ad-hoc queues that are never drained

### Q16. What does `process.memoryUsage()` tell you, and what's the difference between `rss` and `heapUsed`?
**A:** `rss` (Resident Set Size) is total memory allocated for the process including the V8 heap, C++ objects, and code — the number the OS sees. `heapUsed` is just the portion of the V8 JS heap actively in use. A leak that's growing `rss` but not `heapUsed` often points outside JS — native addons, Buffers, or the libuv thread pool.

### Q17. How do you profile CPU usage to find a hot path?
**A:** `node --prof app.js`, generate load, then `node --prof-process` on the resulting log to get a flame-graph-style breakdown, or use `0x`/Clinic.js for a visual flame graph directly. Look for functions with high **self time** (not just total time), which points to the actual bottleneck rather than a caller that's just waiting.

---

## 6. Error Handling & Process Resilience

### Q18. Difference between `uncaughtException` and `unhandledRejection`?
**A:** `uncaughtException` fires when a synchronous throw escapes all try/catch blocks; `unhandledRejection` fires when a Promise rejects with no `.catch()` attached. Neither should be used to "resume" normal operation — the process state is considered corrupted at that point. Best practice: log with full context, then exit gracefully (`process.exit(1)`) and let a process manager (PM2, Kubernetes) restart it.

### Q19. How do you implement graceful shutdown (e.g. on `SIGTERM` from Kubernetes)?
**A:** Listen for `SIGTERM`, stop accepting new connections (`server.close()`), let in-flight requests finish (with a timeout), close DB/Redis connections, then exit:
```js
process.on("SIGTERM", async () => {
  server.close(() => {
    db.close().then(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref(); // force-exit fallback
});
```

### Q20. Callback-based error handling vs async/await — what changes?
**A:** Callbacks use the "error-first" convention (`(err, data) => {}`), which nests badly ("callback hell") and makes error propagation manual. `async/await` lets you use ordinary `try/catch`, and errors propagate up the promise chain automatically — but a stray unawaited async call still produces an unhandled rejection, so consistent `await`ing (or explicit `.catch()`) matters.

---

## 7. Security

### Q21. How do you prevent XSS and CSRF in a Node/Express app?
**A:**
- **XSS:** escape/sanitize any user input rendered into HTML (templating engines auto-escape by default — don't disable it); set a `Content-Security-Policy` header (`helmet` package handles common headers).
- **CSRF:** use `SameSite=Strict/Lax` cookies, CSRF tokens on state-changing forms, and verify the `Origin`/`Referer` header on mutating requests. CSRF mainly matters for cookie-based auth; token-based auth (Bearer tokens not auto-sent by the browser) is inherently less exposed.

### Q22. What does `npm ci` do differently from `npm install`, and why does it matter for security/reproducibility?
**A:** `npm ci` deletes `node_modules` first and installs **exactly** what's in `package-lock.json`, failing if the lockfile is out of sync with `package.json` — no silent version drift. `npm install` can modify the lockfile. `ci` is the right choice for CI/CD pipelines and production builds where deterministic, auditable installs matter.

### Q23. How do you guard against SQL/NoSQL injection in Node?
**A:** Always use parameterized queries / prepared statements (never string-concatenate user input into a query), and for NoSQL (e.g. MongoDB) explicitly reject query operators from user input (`$where`, `$gt`, etc.) — libraries like `mongo-sanitize` strip keys starting with `$`.

---

## 8. Testing & Tooling

### Q24. How do you mock an external dependency (e.g. an HTTP call) in a unit test?
**A:** Inject the dependency (constructor/function param) so a test double can be substituted, or use a library-level mock (`nock` for HTTP, `jest.mock()`/`vi.mock()` for modules). The goal is isolating the unit under test from network/database flakiness and speed cost.

### Q25. Unit vs integration vs contract tests, in a Node microservices context?
**A:** **Unit** — a single function/class, all dependencies mocked, fast. **Integration** — real DB/queue via test containers, verifies your code + a real dependency interact correctly. **Contract** — verifies your service's request/response shape matches what a consumer service expects (e.g. Pact), catching breaking API changes without needing the consumer service running.

---

## 9. System Design Integration (how interviewers pull Node into HLD rounds)

Senior rounds increasingly open with a design prompt and expect you to justify Node-specific choices, not just draw generic boxes:
- **"Design a real-time chat backend"** → expect to defend WebSockets vs long-polling vs SSE, how you'd scale WebSocket connections across multiple Node instances (sticky sessions or a shared pub/sub like Redis to fan out messages across instances), and backpressure handling for slow consumers.
- **"Design a URL shortener" / rate limiter / notification service** → expect idempotency keys, pagination strategy, and how a single-threaded Node instance's I/O-bound strength maps to the read/write pattern of the system (Node is a strong fit for I/O-heavy, less so for CPU-heavy transformation at the request path — that's where you'd cite worker threads or an offloaded service).
- **General expectation:** be ready to say *why* Node specifically (vs a multi-threaded runtime) fits or doesn't fit the workload you're designing for, rather than defaulting to it.

---

## 10. Practice: Predict the Output

Cover the answers and work through these before checking.

**Exercise A:**
```js
console.log("A");
setTimeout(() => console.log("B"), 0);
new Promise((resolve) => {
  console.log("C");
  resolve();
}).then(() => console.log("D"));
console.log("E");
```
<details><summary>Answer</summary>
A, C, E, D, B — the Promise executor runs synchronously (C), then sync code finishes (E), then the microtask (D), then the timer (B).
</details>

**Exercise B:**
```js
process.nextTick(() => console.log("1"));
Promise.resolve().then(() => console.log("2"));
process.nextTick(() => console.log("3"));
Promise.resolve().then(() => console.log("4"));
```
<details><summary>Answer</summary>
1, 3, 2, 4 — the entire nextTick queue drains before the microtask queue starts draining, not interleaved.
</details>

**Exercise C:**
```js
const fs = require("fs");
fs.readFile(__filename, () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
  process.nextTick(() => console.log("nextTick"));
});
```
<details><summary>Answer</summary>
nextTick, immediate, timeout — nextTick always drains before anything else; then, since we're inside a poll-phase (I/O) callback, check (setImmediate) is reached before looping back to timers.
</details>

---

## Notes / gaps to fill in later
- Add: HTTP/2 vs HTTP/1.1 handling in Node (`http2` module) if a role leans network-heavy.
- Add: `AsyncLocalStorage` for request-scoped context (replacing manual context passing / older `cls-hooked` approaches) — increasingly asked given wider adoption.
- Add: specific TypeScript questions (generics, discriminated unions in API response types) if a JD explicitly lists TS.
