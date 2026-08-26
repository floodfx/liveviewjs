import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { assertFixtureMatches } from "./compare.mjs";
import { binaryRecord, normalizeTrace } from "./normalize.mjs";

const recorderRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(recorderRoot, "../..");
const phoenixRoot = resolve(repositoryRoot, "compatibility/phoenix");
const rawRoot = resolve(repositoryRoot, "compatibility/artifacts/raw");
const fixtureRoot = resolve(repositoryRoot, "compatibility/fixtures/phoenix-live-view");
const compatibility = readJson(resolve(repositoryRoot, "compatibility/liveview.json"));
const scenarioManifest = readJson(resolve(repositoryRoot, "compatibility/scenarios.json"));
const recorderPackage = readJson(resolve(recorderRoot, "package.json"));
const mode = process.argv[2] ?? "--check";
const port = Number.parseInt(process.env.COMPATIBILITY_PORT ?? "4102", 10);

assert.match(String(port), /^\d+$/, "COMPATIBILITY_PORT must be numeric");
assert.ok(["--check", "--write"].includes(mode), "usage: node src/record.mjs [--check|--write]");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function prettyJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function guardFixtures() {
  const relativePath = "compatibility/fixtures";
  const result = spawnSync("git", ["status", "--porcelain", "--", relativePath], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "", `refusing to regenerate while fixtures have uncommitted changes`);
}

async function waitForServer(baseUrl, process) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (process.exitCode !== null) throw new Error(`Phoenix exited before becoming ready (${process.exitCode})`);
    try {
      const response = await fetch(baseUrl, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {
      // The listener is not ready yet.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  throw new Error(`Phoenix did not become ready at ${baseUrl}`);
}

function selectedHeaders(headers, names) {
  const selected = {};
  for (const name of names) {
    if (headers[name] !== undefined) selected[name] = headers[name];
  }
  return selected;
}

function decodeFrame(payload) {
  if (typeof payload !== "string") return binaryRecord(payload);
  try {
    return { encoding: "text", payload: JSON.parse(payload) };
  } catch {
    return { encoding: "text", payload };
  }
}

async function redirectRecords(request) {
  const redirects = [];
  for (let previous = request.redirectedFrom(); previous; previous = previous.redirectedFrom()) {
    const response = await previous.response();
    const headers = response ? await response.allHeaders() : {};
    redirects.unshift({
      request: { method: previous.method(), url: previous.url() },
      response: {
        status: response?.status(),
        headers: selectedHeaders(headers, ["location", "set-cookie"]),
      },
    });
  }
  return redirects;
}

async function recordScenario(browser, baseUrl, scenario, metadata) {
  const disconnectedPage = await browser.newPage({ javaScriptEnabled: false });
  await disconnectedPage.goto(`${baseUrl}${scenario.path}`, { waitUntil: "domcontentloaded" });
  const disconnectedDom = await disconnectedPage.locator("html").evaluate((element) => element.outerHTML);
  await disconnectedPage.close();

  const page = await browser.newPage();
  const webSocket = { url: "", events: [] };
  let resolveSocketClosed;
  const socketClosed = new Promise((resolvePromise) => {
    resolveSocketClosed = resolvePromise;
  });
  let documentResponse;

  page.on("websocket", (socket) => {
    webSocket.url = socket.url();
    webSocket.events.push({ type: "open" });
    socket.on("framesent", (event) => webSocket.events.push({ direction: "client-to-server", ...decodeFrame(event.payload) }));
    socket.on("framereceived", (event) => webSocket.events.push({ direction: "server-to-client", ...decodeFrame(event.payload) }));
    socket.on("socketerror", (error) => webSocket.events.push({ type: "error", message: String(error) }));
    socket.on("close", () => {
      webSocket.events.push({ type: "close" });
      resolveSocketClosed();
    });
  });
  page.on("response", (response) => {
    if (response.request().resourceType() === "document" && response.url() === `${baseUrl}${scenario.path}`) {
      documentResponse = response;
    }
  });

  await page.goto(`${baseUrl}${scenario.path}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => document.querySelector("#connection-state")?.textContent?.trim() === "connected",
  );
  assert.ok(documentResponse, "the scenario document response was not captured");
  const connectedDom = await page.locator("html").evaluate((element) => element.outerHTML);
  const request = documentResponse.request();
  const responseHeaders = await documentResponse.allHeaders();
  const requestHeaders = await request.allHeaders();
  const responseHtml = await documentResponse.text();
  const cookies = await page.context().cookies(baseUrl);
  const redirects = await redirectRecords(request);
  const domCheckpoints = [
    { name: "before-connection", dom: disconnectedDom },
    { name: "after-connected-mount", dom: connectedDom },
  ];

  for (const action of scenario.actions) {
    assert.equal(action.type, "click", `unsupported action type: ${action.type}`);
    const beforeCount = await page.locator("#count").textContent();
    await page.locator(action.selector).click();
    await page.waitForFunction(
      (previous) => document.querySelector("#count")?.textContent !== previous,
      beforeCount,
    );
    domCheckpoints.push({
      name: action.checkpoint,
      dom: await page.locator("html").evaluate((element) => element.outerHTML),
    });
  }

  await page.evaluate(() => window.liveSocket.disconnect());
  await Promise.race([
    socketClosed,
    new Promise((resolvePromise) => setTimeout(resolvePromise, 1_000)),
  ]);
  await page.close();
  assert.ok(webSocket.url, "the Phoenix LiveView WebSocket was not opened");
  assert.equal(webSocket.events.at(-1)?.type, "close", "the WebSocket close event was not captured");
  const reportedLiveViewVersion = webSocket.events.find(
    (event) => event.direction === "server-to-client" && event.payload?.[3] === "phx_reply",
  )?.payload?.[4]?.response?.liveview_version;
  assert.equal(
    reportedLiveViewVersion,
    metadata.phoenixLiveViewVersion,
    `incompatible Phoenix LiveView protocol: expected server ${metadata.phoenixLiveViewVersion}, received ${reportedLiveViewVersion ?? "no version"}`,
  );

  return {
    schemaVersion: 1,
    scenarioId: scenario.id,
    capabilityId: scenario.capabilityId,
    capturedAt: new Date().toISOString(),
    metadata,
    http: {
      request: {
        method: request.method(),
        url: request.url(),
        headers: selectedHeaders(requestHeaders, ["accept", "cookie", "user-agent"]),
      },
      response: {
        status: documentResponse.status(),
        headers: selectedHeaders(responseHeaders, ["cache-control", "content-type", "date", "location", "set-cookie"]),
        html: responseHtml,
      },
      redirects,
      cookies: cookies.map((cookie) => ({
        name: cookie.name,
        cookieValue: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
      })),
    },
    webSocket,
    domCheckpoints,
  };
}

const baseUrl = `http://localhost:${port}`;
if (mode === "--write") guardFixtures();
const phoenixOutput = [];
const phoenix = spawn("mix", ["phx.server"], {
  cwd: phoenixRoot,
  env: { ...process.env, MIX_ENV: "test", PHX_SERVER: "true", PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});
phoenix.stdout.on("data", (chunk) => phoenixOutput.push(chunk.toString()));
phoenix.stderr.on("data", (chunk) => phoenixOutput.push(chunk.toString()));

let browser;
try {
  await waitForServer(baseUrl, phoenix);
  browser = await chromium.launch();
  const metadata = {
    phoenixVersion: compatibility.target.phoenixVersion,
    phoenixSourceChecksum: compatibility.target.phoenixSourceChecksum,
    phoenixLiveViewVersion: compatibility.target.phoenixLiveViewVersion,
    phoenixLiveViewSourceChecksum: compatibility.target.phoenixLiveViewSourceChecksum,
    phoenixClientVersion: compatibility.target.phoenixClientVersion,
    browser: "chromium",
    browserVersion: browser.version(),
    recorderVersion: recorderPackage.version,
    playwrightVersion: recorderPackage.dependencies.playwright,
    seed: scenarioManifest.seed,
  };

  for (const scenario of scenarioManifest.scenarios) {
    const raw = await recordScenario(browser, baseUrl, scenario, metadata);
    const normalized = normalizeTrace(raw);
    const rawPath = resolve(rawRoot, `${scenario.id}.json`);
    const fixturePath = resolve(
      fixtureRoot,
      compatibility.target.phoenixLiveViewVersion,
      `${scenario.id}.json`,
    );
    mkdirSync(dirname(rawPath), { recursive: true });
    writeFileSync(rawPath, prettyJson({ ...raw, serverOutput: phoenixOutput }), "utf8");

    if (mode === "--write") {
      mkdirSync(dirname(fixturePath), { recursive: true });
      writeFileSync(fixturePath, prettyJson(normalized), "utf8");
      console.log(`wrote ${fixturePath.slice(repositoryRoot.length + 1)}`);
    } else {
      assertFixtureMatches(normalized, readJson(fixturePath), scenario.id);
      console.log(`verified ${fixturePath.slice(repositoryRoot.length + 1)}`);
    }
  }
} catch (error) {
  console.error(phoenixOutput.join(""));
  throw error;
} finally {
  await browser?.close();
  phoenix.kill("SIGTERM");
}
