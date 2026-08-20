# Contributing to LiveViewJS

LiveViewJS aims to track the latest stable Phoenix LiveView protocol and browser
client while providing an equivalent, idiomatic TypeScript and JavaScript
developer experience. Start with the [roadmap](docs/roadmap/README.md) and the
[verification decision](docs/architecture/verification-first-parity.md).

## Before opening an issue

Use the appropriate issue form and include enough information to reproduce or
evaluate the request. Compatibility reports must name the LiveViewJS version or
commit, Phoenix LiveView client version, runtime, browser, expected behavior,
actual behavior, and upstream reference when one exists.

Feature proposals should say whether they address:

- protocol/client compatibility;
- Phoenix LiveView capability parity; or
- TypeScript/JavaScript-specific developer experience.

## Pull requests

Link a tracked issue and, when applicable, a capability ID from
`compatibility/capabilities.json`. Describe the public behavior and provide
evidence at every applicable layer:

- public API and type-level tests;
- unit tests;
- HTTP/WebSocket integration or conformance tests;
- packed-package smoke tests;
- real-browser tests;
- Node, Bun, and Deno execution;
- documentation, examples, cleanup, errors, and security behavior.

Marking a layer not applicable requires a short explanation. Documentation-only
and administrative changes do not need invented runtime evidence.

Run the relevant package tests and:

```sh
npm run verify:roadmap
```

If you change `compatibility/capabilities.json`, regenerate its documentation:

```sh
npm run roadmap:write
npm run verify:roadmap
```

Do not edit `docs/roadmap/capabilities.md` directly.

## Definition of done

An issue is complete when its observable acceptance criteria and applicable
evidence pass on the default branch. Work present only on a feature or
integration branch is not delivered. A capability can be marked `supported`
only when the roadmap validator can resolve every required evidence category.

Breaking changes, security implications, runtime limitations, and deliberate
differences from Phoenix LiveView must be documented in the pull request, the
capability ledger, and release notes as appropriate.
