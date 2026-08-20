# LiveViewJS roadmap

## North star

LiveViewJS tracks the latest stable Phoenix LiveView protocol and browser
client and gives TypeScript and JavaScript developers equivalent capabilities
through idiomatic, strongly typed APIs.

Each LiveViewJS release pins an exact Phoenix LiveView version. The default
branch follows new stable upstream releases through an explicit compatibility
review; applications never depend on an unbounded "latest" client.

The current target and implementation gap are recorded in
[`compatibility/liveview.json`](../../compatibility/liveview.json). The
machine-readable capability inventory lives in
[`compatibility/capabilities.json`](../../compatibility/capabilities.json), and
the [human-readable parity ledger](capabilities.md) is generated from it.

GitHub issue [#188](https://github.com/floodfx/liveviewjs/issues/188) is the
status and navigation surface. These committed files are the durable source of
truth.

## Definition of done

A capability is not complete merely because unit tests pass. A `supported`
capability must provide applicable evidence for:

1. Public APIs and type-level behavior.
2. Deterministic unit tests and edge cases.
3. HTTP and WebSocket integration behavior.
4. Upstream-generated conformance fixtures or a documented semantic comparison.
5. Black-box browser tests using the pinned Phoenix LiveView client.
6. Node, Bun, and Deno execution for runtime-neutral behavior.
7. Documentation, maintained examples, cleanup, errors, and security behavior.
8. Packed packages installed outside the workspace.

Evidence is referenced from the capability manifest as a repository-relative
path, optionally followed by `#` and a test or documentation marker. The
roadmap validator rejects a `supported` status when an evidence category is
empty or a reference cannot be resolved.

## Phases

### Phase 0: Verifiable foundation

Exit gate: the project can prove what it supports.

- [#187](https://github.com/floodfx/liveviewjs/issues/187): capability and developer-experience parity ledger
- [#182](https://github.com/floodfx/liveviewjs/issues/182): pinned protocol and client compatibility contract
- [#183](https://github.com/floodfx/liveviewjs/issues/183): package, export-map, install, and publish smoke tests
- [#184](https://github.com/floodfx/liveviewjs/issues/184): cross-runtime real-browser E2E harness
- [#172](https://github.com/floodfx/liveviewjs/issues/172): required CI and merge gates
- [#173](https://github.com/floodfx/liveviewjs/issues/173): releases, changelogs, provenance, and publishing
- [#189](https://github.com/floodfx/liveviewjs/issues/189): evidence-based contribution templates

### Phase 1: Runtime correctness

Exit gate: production-safe behavior is demonstrated across the supported
runtimes.

- [#160](https://github.com/floodfx/liveviewjs/issues/160): production runtime adapters
- [#185](https://github.com/floodfx/liveviewjs/issues/185): sessions, origins, uploads, and adapter security
- [#163](https://github.com/floodfx/liveviewjs/issues/163): typed router, layouts, and runtime integration
- [#177](https://github.com/floodfx/liveviewjs/issues/177): signed template statics and deduplication
- [#42](https://github.com/floodfx/liveviewjs/issues/42): tracked static assets

### Phase 2: LiveView parity

Exit gate: high-value missing capabilities conform to the pinned upstream
release. The capability ledger can add work to this phase.

- [#164](https://github.com/floodfx/liveviewjs/issues/164): streams
- [#165](https://github.com/floodfx/liveviewjs/issues/165): async operations and cancellation
- [#166](https://github.com/floodfx/liveviewjs/issues/166): JS commands

### Phase 3: Developer experience

Exit gate: released packages provide a coherent build, development,
scaffolding, examples, and documentation experience.

- [#167](https://github.com/floodfx/liveviewjs/issues/167): Vite TSX transform and HMR
- [#168](https://github.com/floodfx/liveviewjs/issues/168): cross-runtime scaffolding
- [#169](https://github.com/floodfx/liveviewjs/issues/169): tested examples and versioned documentation

### Phase 4: Performance and release

Exit gate: a measured release candidate installs outside the monorepo and is
ready for a stable channel.

- [#170](https://github.com/floodfx/liveviewjs/issues/170): performance and load baselines
- [#186](https://github.com/floodfx/liveviewjs/issues/186): versioning, migration, and release gates

## Maintenance rules

- Review the baseline and capability ledger whenever Phoenix LiveView publishes
  a stable release.
- Every roadmap issue has one milestone, a priority, and observable acceptance
  criteria.
- Close an issue only when its result is on the default branch and all required
  evidence passes.
- Record intentional differences from Phoenix LiveView in the capability
  manifest and release notes.
- Run `npm run verify:roadmap` before submitting a change to this contract.
- Run `npm run roadmap:write` after changing the capability manifest.
