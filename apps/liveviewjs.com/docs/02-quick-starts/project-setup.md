---
sidebar_position: 1
---

# Setup

Building a LiveView is easy with **LiveViewJS**.  You can get started in just a few minutes.

## Generate a new LiveView Project

**LiveViewJS** has a project generation tool that will scaffold the project structure and install the required dependencies for either `node` or `deno`. 

:::info

**LiveViewJS** supports both `node` and `deno` runtimes.  You should choose the runtime that best fits your experience and project goals.

:::

Let's get started by generating a new project.

For a `node` project:
```bash
npx --yes @liveviewjs/gen@latest --generator node --name my-liveviewjs-proj --install
```
or for a `deno` project:
```bash
npx --yes @liveviewjs/gen@latest --generator deno --name my-liveviewjs-proj --install
```

:::info

More documentation on the `@liveviewjs/gen` package and CLI tool can be found at [code generation documentation](gen-package).

:::


## Run the project

Once the project has been generated for you, you should change to the project directory and run the project.

For a `node` Project:

```bash
cd my-liveviewjs-proj
npm run dev
```
should output something like this:
```bash
client build succeeded
build succeeded
my-liveviewjs-proj is listening at: http://localhost:4001
```

:::note

If you are running Node 16 you might see a warning about LiveViewJS's use of the `Fetch API` which is technically experimental. It looks like this:

```bash
(node:28218) ExperimentalWarning: The Fetch API is an experimental feature. This feature could change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
```

**This warning can be safely ignored.**

:::

For a `deno` project:

```bash
cd my-liveviewjs-proj
deno run --allow-run --allow-read --allow-write --allow-net --allow-env  src/server/autorun.ts
```
should output something like this:
```bash
Watcher Process started.
client build succeeded
LiveViewJS (Deno) is listening at: http://localhost:9001
```

## Open your browser

Congrats your LiveViewJS project is running!  Now open your browser and navigate to the URL that was output when you ran the project.

You should see a pretty simple page with a button that toggles some text between "👋 [your project name]" and "Hello [your project name]".

## Open Your IDE

Now that you have a running project, point your favorite IDE at the project directory and take a look at the code.  The code for the liveview is in `src/server/liveview/hello.ts`.  Feel free to make changes to the code and see how they affect the project (which should automatically recompile).

## Congrats and next steps

Congrats!  You've just built your first LiveViewJS project and your first liveview!  Now that we have a project up and running, let's take a look at how to add a slightly more complex liveview to the project.


