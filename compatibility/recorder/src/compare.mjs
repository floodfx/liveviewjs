function firstDifference(actual, expected, path = "trace") {
  if (Object.is(actual, expected)) return undefined;
  if (typeof actual !== typeof expected || actual === null || expected === null) return path;

  if (Array.isArray(actual) || Array.isArray(expected)) {
    if (!Array.isArray(actual) || !Array.isArray(expected) || actual.length !== expected.length) return `${path}.length`;
    for (let index = 0; index < actual.length; index += 1) {
      const difference = firstDifference(actual[index], expected[index], `${path}[${index}]`);
      if (difference) return difference;
    }
    return undefined;
  }

  if (typeof actual === "object") {
    const actualKeys = Object.keys(actual).sort();
    const expectedKeys = Object.keys(expected).sort();
    if (actualKeys.join("\0") !== expectedKeys.join("\0")) return `${path}.keys`;
    for (const key of actualKeys) {
      const difference = firstDifference(actual[key], expected[key], `${path}.${key}`);
      if (difference) return difference;
    }
    return undefined;
  }
  return path;
}

export function assertFixtureMatches(actual, expected, scenarioId) {
  const difference = firstDifference(actual, expected);
  if (difference) throw new Error(`fixture drift: ${scenarioId} at ${difference}`);
}

export function assertBrowserOutcomesMatch(actualCheckpoints, oracleCheckpoints, scenarioId) {
  const actual = actualCheckpoints.map(({ name, outcome }) => ({ name, outcome }));
  const oracle = oracleCheckpoints.map(({ name, outcome }) => ({ name, outcome }));
  const difference = firstDifference(actual, oracle, "outcomes");
  if (difference) throw new Error(`browser outcome drift: ${scenarioId} at ${difference}`);
}

function protocolLifecycle(events) {
  return events.map((frame) => {
    if (!frame.payload) return { type: frame.type };
    const [joinRef, msgRef, topic, event, payload] = frame.payload;
    const lifecycle = {
      direction: frame.direction,
      joinRef,
      msgRef,
      topic,
      event,
    };

    if (event === "phx_join") {
      lifecycle.payload = {
        keys: Object.keys(payload).sort(),
        parameterKeys: Object.keys(payload.params ?? {}).sort(),
      };
    } else if (event === "event") {
      lifecycle.payload = {
        event: payload.event,
        type: payload.type,
        valueKeys: Object.keys(payload.value ?? {}).sort(),
      };
    } else if (event === "phx_reply") {
      lifecycle.payload = {
        status: payload.status,
        responseKeys: Object.keys(payload.response ?? {}).sort(),
        liveViewVersion: payload.response?.liveview_version,
        tree: payload.response?.rendered ?? payload.response?.diff,
      };
    }

    return lifecycle;
  });
}

export function assertProtocolLifecycleMatches(actualEvents, oracleEvents, scenarioId) {
  const difference = firstDifference(
    protocolLifecycle(actualEvents),
    protocolLifecycle(oracleEvents),
    "protocolLifecycle",
  );
  if (difference) throw new Error(`protocol lifecycle drift: ${scenarioId} at ${difference}`);
}
