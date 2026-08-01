import { describe, test, expect } from "bun:test";
import { transformJsxToLiveViewHtml } from "./jsx";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

describe("jsx2ttl Transpilation on Actual .tsx File Source Code", () => {
  test("1. jsx2ttl transforms actual .tsx file contents into LiveViewJS html`...` tagged template literal code", () => {
    const tsxFilePath = join(currentDir, "./fixtures/sampleView.tsx");
    const tsxFileContent = readFileSync(tsxFilePath, "utf-8");

    const transpiledCode = transformJsxToLiveViewHtml(tsxFileContent);

    expect(transpiledCode).toContain('import { html } from "@liveviewjs/core";');
    expect(transpiledCode).toContain('html`<div id="tsx-card" className="card">');
    expect(transpiledCode).toContain("${this.count}");
  });
});
