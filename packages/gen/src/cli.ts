#!/usr/bin/env node

import { exec } from "child_process";
import { prompt } from "enquirer";
import { Logger, runner } from "hygen";
import path from "path";

const run = async () => {
  // first ask what generator to run
  const { generator } = (await prompt({
    type: "select",
    name: "generator",
    message: "What LiveViewJS generator would you like to run?",
    choices: ["node-project"], // "deno-project"],
  })) as { generator: string };

  const defaultTemplates = path.join(__dirname, "../_templates");

  // run hygen
  const result = await runner([generator, "new"], {
    templates: defaultTemplates,
    cwd: process.cwd(),
    logger: new Logger(console.log.bind(console)), // eslint-disable-line no-console
    debug: !!process.env.DEBUG,
    exec: (action, body) => {
      console.log("Executing command: ", action, body);
      const res = exec(action + " " + body);
      if (res.exitCode !== 0) {
        console.error("Command failed.");
        return;
      }
      console.log("Command done.");
    },
    createPrompter: () => require("enquirer"),
  });
  if (result.failure) {
    console.error("Failed to run generator: ", result.failure);
    process.exit(1);
  }
  process.exit(result.success ? 0 : 1);
};

run();
