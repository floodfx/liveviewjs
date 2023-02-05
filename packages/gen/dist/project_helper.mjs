import { execSync } from "child_process";
import * as path from "path";
const MIN_VERSION = 16;
async function createApp({ projectType, projectDir, install, quiet }) {
    let versions = process.versions;
    if (projectType === "node-project" && versions?.node && parseInt(versions.node) < MIN_VERSION) {
        console.log(`️🚨 Oops, Node v${versions.node} detected. LiveViewJS requires a Node version greater than ${MIN_VERSION}.`);
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
        if (projectType === "node-project" && !install) {
            installMessage = `Run \`npm install\` to install dependencies.`;
        }
        let runMessage = "";
        if (projectType === "node-project") {
            runMessage = ` Run \`npm run dev\` to start your LiveViewJS project.`;
        }
        if (projectType === "deno-project") {
            runMessage = ` Run \`deno run --allow-run --allow-read --allow-write --allow-net --allow-env  src/server/autorun.ts\` to start your LiveViewJS project.`;
        }
        console.log(`🖼 LiveViewJS app created!${cdFirstMessage}${installMessage}${runMessage} Check out the README for more details!`);
    }
}
export { createApp };
