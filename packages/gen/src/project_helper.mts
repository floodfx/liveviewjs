import { execSync } from "child_process";
import * as path from "path";
import { RuntimeType } from "./prompts.mjs";

const MIN_VERSION = 16;

export type CreateAppArgs = {
  projectType: RuntimeType;
  projectDir?: string;
  install?: boolean;
  quiet?: boolean;
};

async function createApp({ projectType, projectDir, install, quiet }: CreateAppArgs) {
  let versions = process.versions;

  if (projectType === "node" && versions?.node && parseInt(versions.node) < MIN_VERSION) {
    console.log(
      `️🚨 Oops, Node v${versions.node} detected. LiveViewJS requires a Node version greater than ${MIN_VERSION}.`
    );
    process.exit(1);
  }

  // Create the app directory
  const relativeProjectDir = path.relative(process.cwd(), projectDir ?? "");
  console.log("cwd", process.cwd(), "rel", relativeProjectDir);
  const projectDirIsCurrentDir = relativeProjectDir === "";

  if (install) {
    execSync("npm install", { stdio: "inherit", cwd: process.cwd() });
  }

  if (!quiet) {
    let cdFirstMessage = "";
    if (!projectDirIsCurrentDir) {
      cdFirstMessage = ` \`cd\` into "${path.relative(process.cwd(), projectDir ?? "")}". `;
    }
    let installMessage = "";
    if (projectType === "node" && !install) {
      installMessage = `Run \`npm install\` to install dependencies.`;
    }
    let runMessage = "";
    if (projectType === "node") {
      runMessage = ` Run \`npm run dev\` to start your LiveViewJS project.`;
    }
    if (projectType === "deno") {
      runMessage = ` Run \`deno run --allow-run --allow-read --allow-write --allow-net --allow-env  src/server/autorun.ts\` to start your LiveViewJS project.`;
    }
    console.log(
      `🖼 LiveViewJS app created!${cdFirstMessage}${installMessage}${runMessage} Check out the README for more details!`
    );
  }
}

export { createApp };
