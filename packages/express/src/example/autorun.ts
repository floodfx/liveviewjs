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
  runner = spawn("node", [`${outdir}/index.js`]);
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

// Build / watch the client code
esbuild
  .build({
    entryPoints: ["src/client/index.ts"],
    outdir: "public/js",
    bundle: true,
    format: "esm",
    platform: "browser",
    sourcemap: true,
    watch: {
      onRebuild(error) {
        if (error) {
          console.error("client rebuild failed");
          console.error(error);
        } else {
          console.log(chalk.green("client build succeeded"));
        }
      },
    },
  })
  .then((result) => {
    if (result.errors.length > 0) {
      console.error(result.errors);
    } else {
      console.log(chalk.green("client build succeeded"));
    }
  });

// Build / watch the server code
esbuild
  .build({
    entryPoints: ["src/example/index.ts"],
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
