import chalk from "chalk";
import { ChildProcess, spawn } from "child_process";
import esbuild from "esbuild";

const outdir = "build";
let runner: ChildProcess;

function maybe_stop_child() {
  if (runner) {
    runner.kill();
  }
}

function run_child() {
  maybe_stop_child();
  runner = spawn("node", [`${outdir}/ios.js`]);
  runner.stdout!.on("data", (data) => process.stdout.write(chalk.blue(data.toString())));
  runner.stderr!.on("data", (data) => process.stderr.write(chalk.red(data.toString())));
}

function build_success() {
  console.log(chalk.green("build succeeded"));
  run_child();
}

function build_failure(error: unknown) {
  console.error(chalk.red("build failed"));
  console.error(error);
  maybe_stop_child();
}

esbuild
  .build({
    entryPoints: ["src/example/ios.ts"],
    outdir,
    bundle: true,
    format: "cjs",
    platform: "node",
    watch: {
      onRebuild(error) {
        if (error) {
          build_failure(error);
        } else {
          build_success();
        }
      },
    },
  })
  .then((result) => {
    if (result.errors.length > 0) {
      build_failure(result);
    } else {
      build_success();
    }
  });
