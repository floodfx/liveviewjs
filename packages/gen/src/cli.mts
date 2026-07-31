#!/usr/bin/env node

import chalk from "chalk";
import cliSpinners from "cli-spinners";
import enquirer from "enquirer";
import { execa } from "execa";
import { Logger, runner } from "hygen";
import logUpdate from "log-update";
import path from "path";
import * as url from "url";
import { NullLogger } from "./null_logger.mjs";
import { changeDirMsg, installMsg, runMsg } from "./post_exec.mjs";
import {
  GeneratorType,
  GeneratorTypePromptOptions,
  NamePromptOptions,
  NpmInstallPromptOptions,
  RoutePrompt,
  RuntimePrompt,
  RuntimeType,
  TemplatePrompt,
  TemplateType,
} from "./prompts.mjs";
import { genYargs, lvYargs, projYargs } from "./yargs.mjs";
const { prompt } = enquirer;
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const templates = path.join(__dirname, "../_templates");
async function runHygen(args: string[], quiet: boolean) {
  return await runner(args, {
    templates,
    cwd: process.cwd(),
    logger: quiet ? new NullLogger() : new Logger(console.log.bind(console)), // eslint-disable-line no-console
    debug: !!process.env.DEBUG,
    exec: () => {}, // ignore hygen shell actions
    createPrompter: <Q, T>() => {
      return {
        prompt: async (questions: Q): Promise<T> => {
          return await prompt(questions as any);
        },
      };
    },
  });
}

async function runExeca(action: string[]) {
  const { stderr, stdout, failed, exitCode } = await execa(action[0], action.slice(1));
  console.log(stdout);
  if (failed) {
    console.error(chalk.red(stderr));
    process.exit(exitCode);
  }
}

const run = async () => {
  try {
    const hygenArgs: string[] = [];
    const postExec: Function[] = [];
    const msgs: (string | undefined)[] = [];

    let generatorTemplate = "new";

    // check for common args
    const gyargs = genYargs(process.argv.slice(2));
    let generator: GeneratorType | undefined = gyargs.generator as GeneratorType | undefined;
    if (!generator) {
      generator = ((await prompt(GeneratorTypePromptOptions)) as { generator: GeneratorType }).generator;
    }

    // need name?
    if (!gyargs.name) {
      gyargs.name = ((await prompt(NamePromptOptions)) as { name: string }).name;
    }
    msgs.push(changeDirMsg(generator as GeneratorType, gyargs.name!));
    hygenArgs.push("--name", gyargs.name);
    if (gyargs.force) {
      // force hygen to overwrite files
      process.env.HYGEN_OVERWRITE = "1";
    }

    // depending on generator parse args
    if (generator === "node" || generator === "deno") {
      const yargs = projYargs(process.argv.slice(2));
      if (yargs.install === undefined) {
        // change prompt message based on generator type
        let message = NpmInstallPromptOptions.message;
        if (generator === "deno") {
          message += " (required for client-side javascript)";
        }
        yargs.install = ((await prompt({ ...NpmInstallPromptOptions, message })) as { install: boolean }).install;
      }
      msgs.push(installMsg(generator as GeneratorType, yargs.install));
      if (yargs.install) {
        postExec.push(async () => {
          const spinner = cliSpinners.point;
          let i = 0;
          const ref = setInterval(() => {
            const { frames } = spinner;
            logUpdate(frames[(i = ++i % frames.length)] + " Running npm install...");
          }, spinner.interval);
          process.chdir(path.join(process.cwd(), gyargs.name!));
          await runExeca(["npm", "install"]);
          clearInterval(ref);
        });
      }
    } else if (generator === "liveview") {
      // parse args to see if we need to prompt more
      const yargs = lvYargs(process.argv.slice(2));

      // need route?
      if (!yargs.route) {
        yargs.route = ((await prompt(RoutePrompt)) as { route: string }).route;
      }
      hygenArgs.push("--route", yargs.route);

      // need template?
      if (!yargs.template) {
        yargs.template = ((await prompt(TemplatePrompt)) as { template: TemplateType }).template;
      }
      generatorTemplate = yargs.template;

      // need runtime?
      if (!yargs.runtime) {
        yargs.runtime = ((await prompt(RuntimePrompt)) as { runtime: RuntimeType }).runtime;
      }
      hygenArgs.push("--runtime", yargs.runtime);
    }

    msgs.push(runMsg(generator as GeneratorType));

    const result = await runHygen([generator, generatorTemplate, ...hygenArgs], !!gyargs.quiet);
    // exit if we have errors
    if (result.failure || !result.success) {
      console.error("Error: ", result.failure ?? "unknown error");
      process.exit(1);
    }

    // run post template actions
    for (const action of postExec) {
      await action();
    }

    // print success message
    const msg = msgs
      .filter((m) => m !== undefined)
      .reduce((m, val) => {
        m += `\n\t- ${val}`;
        return m;
      }, "");
    console.log(chalk.cyanBright(`\n\nSuccess! Created "${gyargs.name}"! ${msg}`));
  } catch (e) {
    console.error("Error: ", e);
    process.exit(1);
  }
};

run();
