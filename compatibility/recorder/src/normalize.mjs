import { createHash } from "node:crypto";

function symbolTable(prefix) {
  const values = new Map();
  return (value) => {
    if (!values.has(value)) values.set(value, `${prefix}_${values.size + 1}`);
    return values.get(value);
  };
}

export function binaryRecord(value) {
  const bytes = Buffer.from(value);
  return {
    encoding: "binary",
    length: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

export function normalizeTrace(raw) {
  const csrf = symbolTable("CSRF");
  const sessions = symbolTable("SESSION");
  const statics = symbolTable("STATIC");
  const cookies = symbolTable("COOKIE");
  const views = symbolTable("VIEW");
  const joins = symbolTable("JOIN");
  const refs = symbolTable("REF");

  function normalizeUrl(value) {
    return value.replace(/(https?|wss?):\/\/(127\.0\.0\.1|localhost):\d+/g, "$1://HOST:PORT");
  }

  function normalizeWebSocketUrl(value) {
    const parsed = new URL(value);
    const query = new URLSearchParams();
    for (const [name, entry] of parsed.searchParams) {
      if (name === "_csrf_token") query.append(name, csrf(entry));
      else query.append(name, normalizeUrl(entry));
    }
    return `${parsed.protocol}//HOST:PORT${parsed.pathname}?${query}`;
  }

  function normalizeHtml(value) {
    return normalizeUrl(value)
      .replace(/(<meta[^>]+name="csrf-token"[^>]+content=")([^"]+)(")/g, (_all, before, token, after) => `${before}${csrf(token)}${after}`)
      .replace(/(data-phx-session=")([^"]+)(")/g, (_all, before, token, after) => `${before}${sessions(token)}${after}`)
      .replace(/(data-phx-static=")([^"]*)(")/g, (_all, before, token, after) => `${before}${statics(token)}${after}`)
      .replace(/((?:id|data-phx-root-id)=")(phx-[^"]+)(")/g, (_all, before, token, after) => `${before}${views(token)}${after}`);
  }

  function normalizeCookieHeader(value) {
    return value.replace(/(^|,\s*)([^=;,]+)=([^;,]*)/g, (_all, prefix, name, token) => `${prefix}${name}=${cookies(token)}`);
  }

  function normalizeString(key, value) {
    if (key === "_csrf_token") return csrf(value);
    if (key === "session") return sessions(value);
    if (key === "static") return statics(value);
    if (key === "cookieValue") return cookies(value);
    if (key === "set-cookie") return normalizeCookieHeader(value);
    if (key === "date") return "TIMESTAMP_1";
    if (key === "user-agent") return "BROWSER_USER_AGENT_1";
    if (key === "webSocketUrl") return normalizeWebSocketUrl(value);
    if (key === "url") return normalizeUrl(value);
    if (key === "html" || key === "dom") return normalizeHtml(value);
    if (/^lv:phx-/.test(value)) return `lv:${views(value.slice(3))}`;
    if (/^phx-[A-Za-z0-9_-]+$/.test(value)) return views(value);
    return normalizeUrl(value);
  }

  function normalizeValue(value, key = "") {
    if (typeof value === "string") return normalizeString(key, value);
    if (Array.isArray(value)) return value.map((entry) => normalizeValue(entry));
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([childKey, childValue]) => [childKey, normalizeValue(childValue, childKey)]),
      );
    }
    return value;
  }

  function normalizeFrame(frame) {
    if (frame.encoding !== "text" || !Array.isArray(frame.payload)) return normalizeValue(frame);
    const payload = normalizeValue(frame.payload);
    if (typeof frame.payload[0] === "string") payload[0] = joins(frame.payload[0]);
    if (typeof frame.payload[1] === "string") payload[1] = refs(frame.payload[1]);
    return { ...frame, payload };
  }

  return canonicalize({
    schemaVersion: raw.schemaVersion,
    scenarioId: raw.scenarioId,
    capabilityId: raw.capabilityId,
    metadata: raw.metadata,
    http: normalizeValue(raw.http),
    webSocket: {
      url: normalizeString("webSocketUrl", raw.webSocket.url),
      events: raw.webSocket.events.map(normalizeFrame),
    },
    domCheckpoints: raw.domCheckpoints.map((checkpoint) => normalizeValue(checkpoint)),
  });
}
