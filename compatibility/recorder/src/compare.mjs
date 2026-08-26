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
