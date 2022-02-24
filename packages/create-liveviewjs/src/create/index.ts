import * as path from "path";
import { execSync } from "child_process";
import fse from "fs-extra";


export type CreateAppArgs = {
  projectDir: string;
  install: boolean;
  quiet?: boolean;
}

async function createApp({
  projectDir,
  install,
  quiet,
}: CreateAppArgs) {
  let versions = process.versions;
  if (versions?.node && parseInt(versions.node) < 17) {
    console.log(
      `️🚨 Oops, Node v${versions.node} detected. LiveViewJS requires a Node version greater than 14.`
    );
    process.exit(1);
  }

  // Create the app directory
  let relativeProjectDir = path.relative(process.cwd(), projectDir);
  let projectDirIsCurrentDir = relativeProjectDir === "";
  if (!projectDirIsCurrentDir) {
    if (fse.existsSync(projectDir)) {
      console.log(
        `️🚨 Oops, "${relativeProjectDir}" already exists. Please try again with a different directory.`
      );
      process.exit(1);
    } else {
      await fse.mkdirp(projectDir);
    }
  }

  // copy the project template
  let projectTemplate = path.resolve(__dirname, "templates", "liveviewjs-app");
  await fse.copy(projectTemplate, projectDir);

  // rename dotfiles
  let dotfiles = ["gitignore", "env.example"];
  await Promise.all(
    dotfiles.map(async dotfile => {
      if (fse.existsSync(path.join(projectDir, dotfile))) {
        return fse.rename(
          path.join(projectDir, dotfile),
          path.join(projectDir, `.${dotfile}`)
        );
      }
    })
  );

  if (install) {
    execSync("npm install", { stdio: "inherit", cwd: projectDir });
  }

  if (!quiet) {
    let cdFirstMessage = "";
    if (!projectDirIsCurrentDir) {
      cdFirstMessage = `\`cd\` into "${path.relative(
        process.cwd(),
        projectDir
      )}". `
    }
    console.log(
      `⏩ LiveViewJS app created! ${cdFirstMessage}Check out the README for details on how to run!`
    );
  }
}

export { createApp };