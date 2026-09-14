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
  id: '01M2G5XCKG86Y3JZHN07PTJ9R9',
  text: "Each loop iteration (\"tick\") passes through six phases, run by libuv:\n\n1. **Timers** — runs expired `setTimeout`/`setInterval` callbacks.\n2. **Pending callbacks** — deferred system-level callbacks (e.g. some TCP errors).\n3. **Idle, prepare** — internal, not user-facing.\n4. **Poll** — retrieves new I/O events and runs their callbacks; blocks here if empty (unless something is scheduled for the check phase).\n5. **Check** — runs `setImmediate` callbacks.\n6. **Close callbacks** — e.g. `socket.on('close', ...)`.\n\nCritically: **microtasks are not a phase.** The nextTick queue and the Promise microtask queue drain completely *between every single callback*, not just between phases.",
  references: [eventLoopRef.id, libuvRef.id],
  related: [],
}

const nextTickPriorityAnswer: Answer = {
  id: '01M2G5XCM09ZBNZ53SXYPJ4ZTZ',
  text: "`process.nextTick` queue → Promise microtask queue → current phase's macrotask callback → repeat. Both queues are drained *fully* before the loop proceeds, and callbacks added while draining still run in the same drain — which is exactly why a recursive `process.nextTick()` can starve the event loop entirely (I/O never gets a turn).\n\n**Trace this:**\n```js\nconsole.log(\"1: sync start\");\nsetTimeout(() => console.log(\"2: setTimeout\"), 0);\nsetImmediate(() => console.log(\"3: setImmediate\"));\nPromise.resolve().then(() => console.log(\"4: promise\"));\nprocess.nextTick(() => console.log(\"5: nextTick\"));\nconsole.log(\"6: sync end\");\n```\n**Answer:** `1, 6, 5, 4, 2, 3` — sync code first, then nextTick drains, then promise microtasks drain, then the loop proceeds to phases (timers before check, at the top level).",
  references: [],
  related: [],
}

const setImmediateVsSetTimeoutAnswer: Answer = {
  id: '01M2G5XCMF1KQ9S03VB9NCC8M2',
  text: "At the top level, it's *not guaranteed* — it depends on process startup timing relative to the ~1ms timer resolution. But **inside an I/O callback, `setImmediate` always wins**, because the loop is already past the timers phase and reaches check (poll → check) before it would loop back around to timers.\n\n```js\nconst fs = require(\"fs\");\nfs.readFile(__filename, () => {\n  setTimeout(() => console.log(\"timeout\"), 0);\n  setImmediate(() => console.log(\"immediate\"));\n});\n// Always: immediate → timeout\n```",
  references: [],
  related: [],
}

const singleThreadedHalfTruthAnswer: Answer = {
  id: '01M2G5XCMYGRQ8VJD6NCHKM757',
  text: "The JS execution thread (your callback code) is single-threaded, but Node uses a libuv-managed **thread pool** (default size 4) for things the OS doesn't offer async APIs for — DNS lookups (`dns.lookup`), some filesystem operations, crypto (`pbkdf2`, `scrypt`), and zlib compression. Network I/O itself is handled by the OS's async I/O (epoll/kqueue/IOCP), not the thread pool.",
  references: [libuvRef.id],
  related: [],
}

const avoidBlockingLoopAnswer: Answer = {
  id: '01M2G5XCNDTG1X0WSW0AYTSMN2',
  text: "Break the work into chunks and yield control back to the loop between chunks, e.g. via `setImmediate`:\n\n```js\nfunction processChunk(items, i = 0) {\n  const end = Math.min(i + 1000, items.length);\n  for (; i < end; i++) heavyWork(items[i]);\n  if (i < items.length) setImmediate(() => processChunk(items, i));\n}\n```\n\nFor genuinely CPU-bound work, prefer offloading to a worker thread (see §3) rather than chunking indefinitely.",
  references: [workerThreadsRef.id],
  related: [],
}

const cjsVsEsmAnswer: Answer = {
  id: '01M2G5XCNW5F38T4TRDMSZCQS1',
  text: 'CJS (`require`/`module.exports`) loads and evaluates modules **synchronously at runtime**, resolving `require()` calls dynamically. ESM (`import`/`export`) is **parsed statically before execution**, which is what enables top-level `await`, live bindings, better tree-shaking, and a shared module system with browsers.',
  references: [],
  related: [],
}

const moduleTypeDetectionAnswer: Answer = {
  id: '01M2G5XCPB59NAFF95YT38FDQA',
  text: "By extension first: `.mjs` is always ESM, `.cjs` is always CJS. For `.js`, Node looks at the nearest `package.json`'s `\"type\"` field (`\"module\"` → ESM, default/`\"commonjs\"` → CJS).",
  references: [],
  related: [],
}

const requireEsmAnswer: Answer = {
  id: '01M2G5XCPTH9W61MVJ20HE3QFC',
  text: "CJS can `import()` (dynamic, async) an ESM module but not `require()` it directly (as of the LTS lines still in wide use). ESM can `import` a CJS module — it gets the CJS `module.exports` as the default export, with limited named-export interop via static analysis.",
  references: [],
  related: [],
}

const clusterAnswer: Answer = {
  id: '01M2G5XCQ8HGMHJBF3YET9YFAZ',
  text: "`cluster` forks multiple **worker processes** that share the same server port (via round-robin or OS-level load balancing), so a single-threaded runtime can use multiple CPU cores for handling more concurrent connections, and supports rolling restarts with zero downtime. It does **not** give you shared memory — each worker has its own heap, event loop, and module cache, so in-memory caches/state must be externalized (Redis, etc.) or replicated per worker.",
  references: [clusterRef.id],
  related: [],
}

const workerThreadsVsClusterAnswer: Answer = {
  id: '01M2G5XCQQK9TVR8J2GMS6AAG9',
  text: "`worker_threads` run in the same process and can share memory via `SharedArrayBuffer`, making them the right tool for **CPU-bound work** (image processing, heavy parsing, crypto) that needs to run off the main thread without the overhead of a full process fork or losing shared state. `cluster`/multiple processes are better for **scaling request throughput** across cores for I/O-bound workloads.",
  references: [workerThreadsRef.id, clusterRef.id],
  related: [],
}

const forkVsSpawnAnswer: Answer = {
  id: '01M2G5XCR6AS0DSDFNWXXHPP52',
  text: "`spawn()` launches any command and streams stdout/stderr; it doesn't set up IPC by default. `fork()` is specifically for spawning new Node.js processes and automatically sets up an IPC channel so parent and child can `.send()` messages to each other — it's essentially `spawn()` specialized for Node-to-Node communication.",
  references: [],
  related: [],
}

const streamsVsMemoryAnswer: Answer = {
  id: '01M2G5XCRN2J82DK2Q9CV17Y28',
  text: "Streams process data in chunks, so memory usage stays flat regardless of input size — critical for large files, video, or proxying HTTP responses. The four stream types: **Readable** (source, e.g. `fs.createReadStream`), **Writable** (sink), **Duplex** (both, e.g. a TCP socket), **Transform** (duplex that modifies data in transit, e.g. `zlib.createGzip()`).",
  references: [],
  related: [],
}

const pipeBackpressureAnswer: Answer = {
  id: '01M2G5XCS47QRAK9F6N2KQ6KN8',
  text: "**Backpressure.** If the writable side is slower than the readable side, `.pipe()` automatically pauses the readable stream until the writable's internal buffer drains, preventing unbounded memory growth. Manually wiring `data`/`write` events requires you to check the boolean return value of `.write()` and pause/resume yourself.",
  references: [],
  related: [],
}

const bufferAnswer: Answer = {
  id: '01M2G5XCSKH22NGT6KANK3KQEY',
  text: "A `Buffer` is a fixed-length chunk of raw binary memory allocated outside the V8 heap, used for handling binary data (file contents, TCP packets, image bytes) that isn't naturally representable as UTF-16 strings. Buffers avoid the encoding/decoding overhead and memory bloat of forcing binary data through the string type.",
  references: [bufferRef.id],
  related: [],
}

const memoryLeakDiagnosisAnswer: Answer = {
  id: '01M2G5XCT2PA3CXZJJ836JQCBM',
  text: "Take heap snapshots at intervals — via `node --inspect` + Chrome DevTools' Memory tab, or the `heapdump` package — and compare them to spot objects whose retained size keeps growing across snapshots (\"comparison view\"). Common culprits:\n\n- Unbounded in-memory caches (no TTL/eviction)\n- Event listeners registered but never removed (`emitter.on` without `.off`, especially in per-request handlers)\n- Closures unintentionally retaining large objects in scope\n- Global arrays/maps used as ad-hoc queues that are never drained",
  references: [],
  related: [],
}

const memoryUsageAnswer: Answer = {
  id: '01M2G5XCTHB06A6R2S60QHCC25',
  text: "`rss` (Resident Set Size) is total memory allocated for the process including the V8 heap, C++ objects, and code — the number the OS sees. `heapUsed` is just the portion of the V8 JS heap actively in use. A leak that's growing `rss` but not `heapUsed` often points outside JS — native addons, Buffers, or the libuv thread pool.",
  references: [bufferRef.id, libuvRef.id],
  related: [],
}

const cpuProfilingAnswer: Answer = {
  id: '01M2G5XCV02ZFNSFH5CQ10GWXF',
  text: "`node --prof app.js`, generate load, then `node --prof-process` on the resulting log to get a flame-graph-style breakdown, or use `0x`/Clinic.js for a visual flame graph directly. Look for functions with high **self time** (not just total time), which points to the actual bottleneck rather than a caller that's just waiting.",
  references: [],
  related: [],
}

const uncaughtVsUnhandledAnswer: Answer = {
  id: '01M2G5XCVFK2SD3XS6GB0HPG3P',
  text: "`uncaughtException` fires when a synchronous throw escapes all try/catch blocks; `unhandledRejection` fires when a Promise rejects with no `.catch()` attached. Neither should be used to \"resume\" normal operation — the process state is considered corrupted at that point. Best practice: log with full context, then exit gracefully (`process.exit(1)`) and let a process manager (PM2, Kubernetes) restart it.",
  references: [],
  related: [],
}

const gracefulShutdownAnswer: Answer = {
  id: '01M2G5XCVXTT0G4P27DRGK4DF1',
  text: "Listen for `SIGTERM`, stop accepting new connections (`server.close()`), let in-flight requests finish (with a timeout), close DB/Redis connections, then exit:\n\n```js\nprocess.on(\"SIGTERM\", async () => {\n  server.close(() => {\n    db.close().then(() => process.exit(0));\n  });\n  setTimeout(() => process.exit(1), 10_000).unref(); // force-exit fallback\n});\n```",
  references: [],
  related: [],
}

const callbackVsAsyncAwaitAnswer: Answer = {
  id: '01M2G5XCWCP8M4P6MMRGFP49MX',
  text: "Callbacks use the \"error-first\" convention (`(err, data) => {}`), which nests badly (\"callback hell\") and makes error propagation manual. `async/await` lets you use ordinary `try/catch`, and errors propagate up the promise chain automatically — but a stray unawaited async call still produces an unhandled rejection, so consistent `await`ing (or explicit `.catch()`) matters.",
  references: [],
  related: [],
}

const xssCsrfAnswer: Answer = {
  id: '01M2G5XCWV7YCVX7SZH66FZY5H',
  text: "- **XSS:** escape/sanitize any user input rendered into HTML (templating engines auto-escape by default — don't disable it); set a `Content-Security-Policy` header (`helmet` package handles common headers).\n- **CSRF:** use `SameSite=Strict/Lax` cookies, CSRF tokens on state-changing forms, and verify the `Origin`/`Referer` header on mutating requests. CSRF mainly matters for cookie-based auth; token-based auth (Bearer tokens not auto-sent by the browser) is inherently less exposed.",
  references: [],
  related: [],
}

const npmCiAnswer: Answer = {
  id: '01M2G5XCXBVF66GRYYV2AH9MFA',
  text: "`npm ci` deletes `node_modules` first and installs **exactly** what's in `package-lock.json`, failing if the lockfile is out of sync with `package.json` — no silent version drift. `npm install` can modify the lockfile. `ci` is the right choice for CI/CD pipelines and production builds where deterministic, auditable installs matter.",
  references: [],
  related: [],
}

const injectionGuardAnswer: Answer = {
  id: '01M2G5XCXTJCBTZQH4F6VSYV27',
  text: 'Always use parameterized queries / prepared statements (never string-concatenate user input into a query), and for NoSQL (e.g. MongoDB) explicitly reject query operators from user input (`$where`, `$gt`, etc.) — libraries like `mongo-sanitize` strip keys starting with `$`.',
  references: [],
  related: [],
}

const mockDependencyAnswer: Answer = {
  id: '01M2G5XCY95JPM55GZFD0G346C',
  text: "Inject the dependency (constructor/function param) so a test double can be substituted, or use a library-level mock (`nock` for HTTP, `jest.mock()`/`vi.mock()` for modules). The goal is isolating the unit under test from network/database flakiness and speed cost.",
  references: [],
  related: [],
}

const testTypesAnswer: Answer = {
  id: '01M2G5XCYR28YDS0HADZHJHTY5',
  text: "**Unit** — a single function/class, all dependencies mocked, fast. **Integration** — real DB/queue via test containers, verifies your code + a real dependency interact correctly. **Contract** — verifies your service's request/response shape matches what a consumer service expects (e.g. Pact), catching breaking API changes without needing the consumer service running.",
  references: [],
  related: [],
}

export const questions: Question[] = [
  {
    id: '01M2G5XCKS8H9PB0W3430X53F1',
    question: 'What are the phases of the Node.js event loop, in order?',
    tags: ['event-loop', 'core'],
    answer: eventLoopPhasesAnswer,
  },
  {
    id: '01M2G5XCM87YVVRMCFRM5TDXW0',
    question: "What's the priority order between `process.nextTick`, Promise microtasks, and macrotasks (timers/I/O/setImmediate)?",
    tags: ['event-loop'],
    answer: nextTickPriorityAnswer,
  },
  {
    id: '01M2G5XCMQGWXEQZW7ZJGGNM6G',
    question: '`setImmediate` vs `setTimeout(fn, 0)` — which runs first?',
    tags: ['event-loop'],
    answer: setImmediateVsSetTimeoutAnswer,
  },
  {
    id: '01M2G5XCN652W4KXJ9X1G74NSD',
    question: 'Why is "Node.js is single-threaded" a half-truth?',
    tags: ['event-loop'],
    answer: singleThreadedHalfTruthAnswer,
  },
  {
    id: '01M2G5XCNN61E5ETCM0BDJ01GF',
    question: "What's a good technique to avoid blocking the event loop with a large synchronous loop?",
    tags: ['event-loop'],
    answer: avoidBlockingLoopAnswer,
  },
  {
    id: '01M2G5XCP3YY8HP5XG01CHKHC1',
    question: 'Core differences between CommonJS and ES Modules?',
    tags: ['modules', 'core'],
    answer: cjsVsEsmAnswer,
  },
  {
    id: '01M2G5XCPJYH7RR31NVT0EJPND',
    question: 'How does Node decide whether a `.js` file is CJS or ESM?',
    tags: ['modules'],
    answer: moduleTypeDetectionAnswer,
  },
  {
    id: '01M2G5XCQ1H4BBB26D1K5C14Z3',
    question: 'Can you `require()` an ESM module, or `import` a CJS one?',
    tags: ['modules'],
    answer: requireEsmAnswer,
  },
  {
    id: '01M2G5XCQGJFFMECQJ6F274S05',
    question: 'How does the `cluster` module improve performance, and what does it *not* solve?',
    tags: ['concurrency', 'core'],
    answer: clusterAnswer,
  },
  {
    id: '01M2G5XCQZXPPTQQFN7HBVQPWY',
    question: 'When would you reach for `worker_threads` instead of `cluster`?',
    tags: ['concurrency'],
    answer: workerThreadsVsClusterAnswer,
  },
  {
    id: '01M2G5XCRE2H17WKQPFMJCT7GH',
    question: '`child_process.fork()` vs `.spawn()`?',
    tags: ['concurrency'],
    answer: forkVsSpawnAnswer,
  },
  {
    id: '01M2G5XCRW3175E4RABHE2274K',
    question: 'Why use streams instead of reading a whole file into memory?',
    tags: ['streams', 'core'],
    answer: streamsVsMemoryAnswer,
  },
  {
    id: '01M2G5XCSBB2JA2ZD1G5EAYMNK',
    question: "What does `.pipe()` handle for you that manual `.on('data')` doesn't?",
    tags: ['streams'],
    answer: pipeBackpressureAnswer,
  },
  {
    id: '01M2G5XCSTFRWACPFNMFZNPG0C',
    question: "What's a `Buffer`, and why does Node need it separately from a JS string?",
    tags: ['streams'],
    answer: bufferAnswer,
  },
  {
    id: '01M2G5XCT9K57HQZWWQ765M20Q',
    question: 'How would you diagnose a memory leak in a long-running Node process?',
    tags: ['performance', 'core'],
    answer: memoryLeakDiagnosisAnswer,
  },
  {
    id: '01M2G5XCTR8HT7C97J5BW7WWXQ',
    question: "What does `process.memoryUsage()` tell you, and what's the difference between `rss` and `heapUsed`?",
    tags: ['performance'],
    answer: memoryUsageAnswer,
  },
  {
    id: '01M2G5XCV7G53QHPT500WTX85C',
    question: 'How do you profile CPU usage to find a hot path?',
    tags: ['performance'],
    answer: cpuProfilingAnswer,
  },
  {
    id: '01M2G5XCVPCJQM1CNS1HNSKMNR',
    question: 'Difference between `uncaughtException` and `unhandledRejection`?',
    tags: ['error-handling', 'core'],
    answer: uncaughtVsUnhandledAnswer,
  },
  {
    id: '01M2G5XCW5P46QP8VH4AA46BNW',
    question: 'How do you implement graceful shutdown (e.g. on `SIGTERM` from Kubernetes)?',
    tags: ['error-handling'],
    answer: gracefulShutdownAnswer,
  },
  {
    id: '01M2G5XCWMHB5VZ3VYEN8ZF7MT',
    question: 'Callback-based error handling vs async/await — what changes?',
    tags: ['error-handling'],
    answer: callbackVsAsyncAwaitAnswer,
  },
  {
    id: '01M2G5XCX3495DGR7Y16SA9PYT',
    question: 'How do you prevent XSS and CSRF in a Node/Express app?',
    tags: ['security', 'core'],
    answer: xssCsrfAnswer,
  },
  {
    id: '01M2G5XCXK6VK1SVZ52G1GEQCY',
    question: 'What does `npm ci` do differently from `npm install`, and why does it matter for security/reproducibility?',
    tags: ['security'],
    answer: npmCiAnswer,
  },
  {
    id: '01M2G5XCY2JDNEEFC2ZC61TB5A',
    question: 'How do you guard against SQL/NoSQL injection in Node?',
    tags: ['security'],
    answer: injectionGuardAnswer,
  },
  {
    id: '01M2G5XCYHDTAGT95F9WVWTHJG',
    question: 'How do you mock an external dependency (e.g. an HTTP call) in a unit test?',
    tags: ['testing', 'core'],
    answer: mockDependencyAnswer,
  },
  {
    id: '01M2G5XCZ0TCQ2SX544RNVWR4T',
    question: 'Unit vs integration vs contract tests, in a Node microservices context?',
    tags: ['testing'],
    answer: testTypesAnswer,
  },
]
