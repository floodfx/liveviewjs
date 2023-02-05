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
import { GeneratorTypePromptOptions, NamePromptOptions, NpmInstallPromptOptions } from "./prompts.mjs";
import { genYargs, projYargs } from "./yargs.mjs";
const { prompt } = enquirer;
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const templates = path.join(__dirname, "../_templates");
async function runHygen(args, quiet) {
    return await runner(args, {
        templates,
        cwd: process.cwd(),
        logger: quiet ? new NullLogger() : new Logger(console.log.bind(console)),
        debug: !!process.env.DEBUG,
        exec: () => { },
        createPrompter: () => {
            return {
                prompt: async (questions) => {
                    return await prompt(questions);
                },
            };
        },
    });
}
async function runExeca(action) {
    const { stderr, stdout, failed, exitCode } = await execa(action[0], action.slice(1));
    console.log(stdout);
    if (failed) {
        console.error(stderr);
        process.exit(exitCode);
    }
}
const run = async () => {
    try {
        const hygenArgs = [];
        const postExec = [];
        const msgs = [];
        // check for common args
        const gyargs = genYargs(process.argv.slice(2));
        let generator = gyargs.generator;
        if (!generator) {
            generator = (await prompt(GeneratorTypePromptOptions)).generator;
        }
        hygenArgs.push(generator, "new");
        if (!gyargs.name) {
            gyargs.name = (await prompt(NamePromptOptions)).name;
        }
        msgs.push(changeDirMsg(generator, gyargs.name));
        hygenArgs.push("--name", gyargs.name);
        if (gyargs.force) {
            // force hygen to overwrite files
            process.env.HYGEN_OVERWRITE = "1";
        }
        // depending on generator parse args
        if (generator === "node-project" || generator === "deno-project") {
            const yargs = projYargs(process.argv.slice(2));
            if (yargs.install === undefined) {
                // change prompt message based on generator type
                let message = NpmInstallPromptOptions.message;
                if (generator === "deno-project") {
                    message += " (required for client-side javascript)";
                }
                yargs.install = (await prompt({ ...NpmInstallPromptOptions, message })).install;
            }
            msgs.push(installMsg(generator, yargs.install));
            if (yargs.install) {
                postExec.push(async () => {
                    const spinner = cliSpinners.squareCorners;
                    let i = 0;
                    const ref = setInterval(() => {
                        const { frames } = spinner;
                        logUpdate(frames[(i = ++i % frames.length)] + " Running npm install...");
                    }, spinner.interval);
                    process.chdir(path.join(process.cwd(), gyargs.name));
                    await runExeca(["npm", "install"]);
                    clearInterval(ref);
                });
            }
        }
        msgs.push(runMsg(generator));
        const result = await runHygen(hygenArgs, !!gyargs.quiet);
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
        console.log(chalk.green(`\n\nSuccess! Created "${gyargs.name}" LiveViewJS project! ${msg}`));
    }
    catch (e) {
        console.error("Error: ", e);
        process.exit(1);
    }
};
run();
