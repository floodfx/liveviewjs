#!/usr/bin/env node

import inquirer from "inquirer";
import meow from "meow";
import * as path from "path";
import { createApp, CreateAppArgs } from ".";

const help = `
  Usage:
    $ npx create-liveviewjs [flags...] [<dir>]

  If <dir> is not provided up front you will be prompted for it.

  Flags:
    --help, -h          Show this help message
    --version, -v       Show the version of this script
`;

run().then(
  () => {
    process.exit(0);
  },
  (error) => {
    console.error(error);
    process.exit(1);
  }
);

async function run() {
  let { input, flags, showHelp, showVersion, pkg } = meow(help, {
    flags: {
      help: { type: "boolean", default: false, alias: "h" },
      version: { type: "boolean", default: false, alias: "v" },
    },
  });

  if (flags.help) showHelp();
  if (flags.version) showVersion();

  console.log("⏩ Welcome to LiveViewJS! Let's get you set up with a new project.");
  console.log();

  // Figure out the app directory
  let projectDir = path.resolve(
    process.cwd(),
    input.length > 0
      ? input[0]
      : (
          await inquirer.prompt<{ dir: string }>([
            {
              type: "input",
              name: "dir",
              message: "Where would you like to create your LiveViewJS app?",
              default: "./my-liveviewjs-app",
            },
          ])
        ).dir
  );

  let answers = await inquirer.prompt<CreateAppArgs>([
    {
      name: "install",
      type: "confirm",
      message: "Do you want us to run `npm install`?",
      default: true,
    },
  ]);

  await createApp({
    projectDir,
    install: answers.install,
  });
}
