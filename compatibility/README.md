# Phoenix LiveView compatibility

This directory contains the executable reference oracle for tracking the exact
Phoenix LiveView release declared in `liveview.json`.

## Pinned inputs

- `phoenix/mix.exs` and `phoenix/mix.lock` pin the Phoenix server and Phoenix
  LiveView packages.
- `phoenix/assets/package.json` and its lockfile pin the locally served Phoenix
  JavaScript clients. When the selected client has a transitive morphdom
  dependency, its lockfile must resolve an immutable upstream commit over
  HTTPS. The oracle never loads client code from a CDN or a mutable branch.
- `liveviewjs/package.json` and its lockfile independently pin the same browser
  client for the differential target and bundle the repository sources under
  review.
- `recorder/package.json` and its lockfile pin Playwright and the recorder.
- The repository `.tool-versions` pins Erlang, Elixir, and Node for local runs.

The static roadmap validator rejects version or source-checksum drift between
these inputs and `liveview.json`.

`liveview.json` also publishes the compatibility policy. At present 1.2.10 is
tested against both the Phoenix oracle and the basic LiveViewJS differential
target, but is not yet declared fully verified against LiveViewJS. Older clients
are untested and unlisted clients are rejected. The recorder fails with an
explicit expected/received version diagnostic when either server's join reply
omits or reports a different LiveView version.

## Scenarios and traces

`scenarios.json` gives each scenario a stable ID and links it to a capability
in `capabilities.json`. Both `phoenix/` and `liveviewjs/` implement that shared
manifest. The Playwright recorder retains raw HTTP, WebSocket, and DOM captures
under implementation-specific directories in `artifacts/raw/`; CI uploads that
ignored directory for diagnosis. Reviewed normalized traces live in
`fixtures/phoenix-live-view/<version>/` and `fixtures/liveviewjs/<version>/`.

Each DOM checkpoint also records a stable browser outcome: location, title,
focus, scenario state, controls, forms, and hooks. The differential check
requires those outcomes to match while allowing each server to use its own HTML
wrapper and wire-level implementation.

The recorder also compares the ordered WebSocket lifecycle across targets. Join
and message references, topics, event envelopes, reply status, advertised
version, rendered trees, and diff trees must match. Each full frame body is also
regression-checked against its implementation's own normalized fixture.

Normalization replaces only deployment-local values. It keeps every field and
maps correlated CSRF tokens, signed sessions/statics, cookies, LiveView topics,
join references, message references, hosts, ports, and timestamps to stable
symbols. The platform-specific user-agent is normalized while the exact browser
and Playwright versions remain in trace metadata. Binary frames retain encoding,
byte length, and SHA-256. Arrays retain protocol order; JSON object members are
sorted because their wire order is not semantically significant.

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
