import { execSync } from "child_process";
import fse from "fs-extra";
import * as path from "path";

export type CreateAppArgs = {
  projectDir: string;
  install: boolean;
  quiet?: boolean;
};

async function createApp({ projectDir, install, quiet }: CreateAppArgs) {
  let versions = process.versions;
  if (versions?.node && parseInt(versions.node) < 17) {
    console.log(`️🚨 Oops, Node v${versions.node} detected. LiveViewJS requires a Node version greater than 14.`);
    process.exit(1);
  }

  // Create the app directory
  let relativeProjectDir = path.relative(process.cwd(), projectDir);
  let projectDirIsCurrentDir = relativeProjectDir === "";
  if (!projectDirIsCurrentDir) {
    if (fse.existsSync(projectDir)) {
      console.log(`️🚨 Oops, "${relativeProjectDir}" already exists. Please try again with a different directory.`);
      process.exit(1);
    } else {
      await fse.mkdirp(projectDir);
    }
  }

  const excludes = ["node_modules", "dist"];
  // copy the project template
  let projectTemplate = path.resolve(__dirname, "templates", "liveviewjs-app");
  await fse.copy(projectTemplate, projectDir, {
    filter: (src, dest) => {
      // ensure excluding some files
      if (excludes.includes(path.basename(src))) return false;
      return true;
    },
  });

  // rename dotfiles
  let dotfiles = ["gitignore", "env"];
  await Promise.all(
    dotfiles.map(async (dotfile) => {
      if (fse.existsSync(path.join(projectDir, dotfile))) {
        return fse.rename(path.join(projectDir, dotfile), path.join(projectDir, `.${dotfile}`));
      }
    })
  );

  if (install) {
    execSync("npm install", { stdio: "inherit", cwd: projectDir });
  }

  if (!quiet) {
    let cdFirstMessage = "";
    if (!projectDirIsCurrentDir) {
      cdFirstMessage = `\`cd\` into "${path.relative(process.cwd(), projectDir)}". `;
    }
    let installMessage = "";
    if (!install) {
      installMessage = `Run \`npm install\` to install dependencies.`;
    }
    console.log(
      `⏩ LiveViewJS app created! ${cdFirstMessage} ${installMessage} Run \`npm run start\` to start your LiveViewJS project. Check out the README for more details!`
    );
  }
}

export { createApp };
