# Phoenix LiveView compatibility

This directory contains the executable reference oracle for tracking the exact
Phoenix LiveView release declared in `liveview.json`.

## Pinned inputs

- `phoenix/mix.exs` and `phoenix/mix.lock` pin the Phoenix server and Phoenix
  LiveView packages.
- `phoenix/assets/package.json` and its lockfile pin the locally served Phoenix
  JavaScript clients. The transitive morphdom dependency is overridden to the
  exact upstream commit over HTTPS. The oracle never loads client code from a
  CDN or a mutable branch.
- `recorder/package.json` and its lockfile pin Playwright and the recorder.
- The repository `.tool-versions` pins Erlang, Elixir, and Node for local runs.

The static roadmap validator rejects version or source-checksum drift between
these inputs and `liveview.json`.

`liveview.json` also publishes the compatibility policy. At present 1.2.9 is
tested against the Phoenix oracle but is not yet verified against LiveViewJS;
older clients are untested and unlisted clients are rejected. The recorder
fails with an explicit expected/received version diagnostic when the oracle's
join reply omits or reports a different LiveView version.

## Scenarios and traces

`scenarios.json` gives each scenario a stable ID and links it to a capability
in `capabilities.json`. The Playwright recorder retains raw HTTP, WebSocket, and
DOM captures in `artifacts/raw/`; CI uploads that ignored directory for
diagnosis. Reviewed normalized traces live in
`fixtures/phoenix-live-view/<version>/`.

Normalization replaces only deployment-local values. It keeps every field and
maps correlated CSRF tokens, signed sessions/statics, cookies, LiveView topics,
join references, message references, hosts, ports, and timestamps to stable
symbols. The platform-specific user-agent is normalized while the exact browser
and Playwright versions remain in trace metadata. Binary frames retain encoding,
byte length, and SHA-256.

## Commands

Install the pinned dependencies and build the local client bundle:

```sh
npm run compatibility:setup
npm --prefix compatibility/recorder exec playwright install chromium
```

Regenerate fixtures after an upstream review:

```sh
npm run compatibility:record
```

Regeneration refuses to overwrite a fixture that already has uncommitted
changes. Inspect the fixture diff and raw artifact before accepting it.

Reproduce the committed fixture:

```sh
npm run compatibility:check
```

The deterministic seed is declared in `scenarios.json`. The recorder uses a
fixed default port and normalizes it, so `COMPATIBILITY_PORT` may override the
port without changing the fixture.

## Upstream updates

Dependabot checks the Phoenix Mix application, the locally served npm clients,
and Playwright every week. A dependency pull request is expected to fail the
static pin check until a maintainer deliberately updates `liveview.json`, runs
the recorder, reviews the normalized protocol/DOM diff and raw trace, and then
runs both `npm run verify:roadmap` and `npm run compatibility:check`. Fixture
changes are never accepted automatically.
