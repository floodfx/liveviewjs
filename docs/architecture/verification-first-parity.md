# Verification-first Phoenix LiveView parity

- Status: accepted
- Date: 2026-08-19
- Tracking: [#188](https://github.com/floodfx/liveviewjs/issues/188)

## Context

LiveViewJS has historically described support through APIs, examples, and unit
tests spread across multiple packages. Those signals are useful but cannot prove
that a published package interoperates with the current Phoenix LiveView browser
client or behaves consistently under Node, Bun, and Deno.

Protocol compatibility and framework capability parity are related but distinct:

- Protocol compatibility means the pinned Phoenix client can communicate with
  LiveViewJS across the complete HTTP and WebSocket lifecycle.
- Capability parity means developers can build equivalent applications with
  documented, idiomatic TypeScript and JavaScript APIs.

Both claims need reproducible evidence.

## Decision

The repository owns three versioned sources of truth:

1. `compatibility/liveview.json` records the exact upstream target, the versions
   claimed by a LiveViewJS release, runtime policy, and client versions currently
   present in the repository.
2. `compatibility/capabilities.json` records capability status, upstream
   references, issue ownership, gaps, and evidence identifiers.
3. `docs/roadmap/capabilities.md` is generated from the capability manifest for
   humans and must never be edited directly.

The validator fails when these sources drift, when an implementation or
scaffold-template dependency changes without updating the baseline, or when a
capability is marked `supported` without resolvable evidence in every required
category. Evidence uses `repository/path#optional-marker`; the file must exist,
and a supplied marker must occur in it.

## Verification ladder

Evidence becomes progressively more representative:

1. Type checks prove the public TypeScript contract.
2. Unit tests prove deterministic algorithms and edge cases.
3. Protocol and integration tests cross real HTTP and WebSocket boundaries.
4. Conformance fixtures compare behavior with the pinned Phoenix release.
5. Package smoke tests install packed artifacts rather than workspace imports.
6. Playwright drives the pinned real browser client against Node, Bun, and Deno
   server processes.
7. Nightly browser/runtime and load matrices increase breadth without making
   every pull request prohibitively expensive.
8. Release-candidate tests install packages in an external consumer project.

No lower layer substitutes for a higher layer when the higher layer applies.

## Browser/runtime architecture

Playwright runs as a dedicated Node-based controller. It launches the same
reference server under each target runtime and treats the server as a black box.
This separates the browser-driver runtime from the application runtime and keeps
all assertions identical.

Required pull-request coverage begins with:

| Browser | Server runtime |
| --- | --- |
| Chromium | Node 24 |
| Chromium | Bun |
| Chromium | Deno |
| Firefox | reference Node |
| WebKit | reference Node |

Nightly and manual workflows expand to the full browser/runtime matrix and
longer reconnect, upload, and load scenarios.

Required lanes use zero retries. A separate non-blocking diagnostic rerun may
collect traces, screenshots, video, browser console, network and WebSocket
traffic, server logs, versions, and the deterministic seed.

## Merge and release policy

The stable required check names are defined in
[#172](https://github.com/floodfx/liveviewjs/issues/172). Matrix jobs feed stable
aggregate checks so branch protection does not depend on generated job names.
Required checks are enabled only after their workflows have succeeded on the
default branch at least once.

A capability or roadmap issue closes only after its implementation reaches the
default branch with its evidence. A merge to an integration branch is progress,
not delivery. Release notes identify the exact Phoenix LiveView version and all
partial, missing, or intentionally different capabilities.

## Consequences

- Compatibility and parity claims become inspectable and reviewable in a commit.
- Adding a capability requires more than implementation and unit coverage.
- Changing upstream targets creates an explicit review rather than a silent
  client upgrade.
- Early manifests will show many partial or missing capabilities. This is
  intentional: the ledger describes demonstrated reality, not aspiration.
