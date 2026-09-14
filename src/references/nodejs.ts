import type { FileMeta, Reference } from '@/types/topic.types'

export const meta: FileMeta = {
  version: '1.0.0',
  cutOffTime: '2026-09-14T00:00:00.000Z',
  updatedAt: '2026-09-14T00:00:00.000Z',
}

export const references: Reference[] = [
  {
    id: '01M2G5XCJ3NN7MVZYX1RC8XB02',
    term: 'Event Loop',
    text: 'The single-threaded loop that drives Node — it repeatedly moves through six phases (timers, pending callbacks, idle/prepare, poll, check, close callbacks), running the callbacks queued for each. The nextTick and Promise microtask queues drain completely between every callback, not just between phases.',
  },
  {
    id: '01M2G5XCJEN180SC80MJVXRDNR',
    term: 'libuv',
    text: 'The C library underneath Node that provides the event loop itself plus a thread pool (default size 4) for work the OS has no async API for — some filesystem calls, DNS lookups, and CPU-heavy crypto/zlib. Network I/O bypasses the pool entirely, going through the OS’s own async I/O.',
  },
  {
    id: '01M2G5XCJQM0N5E76H9TTDQYM2',
    term: 'Cluster',
    text: 'The built-in `cluster` module forks multiple Node processes that share a listening port, letting a multi-core machine handle more concurrent connections. Each worker is a fully separate process with its own event loop and memory — it does not solve CPU-bound blocking within a single request; that still needs a worker thread or an offloaded service.',
  },
  {
    id: '01M2G5XCK05PJA75EX2K3Y4Y40',
    term: 'Worker Threads',
    text: 'The `worker_threads` module runs JavaScript on a real OS thread inside the same process, with memory optionally shared via `SharedArrayBuffer`. Reach for it over `cluster` when the goal is offloading one CPU-bound computation, not scaling overall request throughput.',
  },
  {
    id: '01M2G5XCK8WHHB7SQ8T2CPGPSS',
    term: 'Buffer',
    text: 'A fixed-length, raw-binary container outside the V8 heap. Node needs it separately from a JS string because strings are immutable and UTF-16 by default, which is the wrong shape for handling arbitrary binary data (file bytes, network packets) efficiently.',
  },
]
