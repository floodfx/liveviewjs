---
sidebar_position: 1
---

# Let's Build a LiveView

Building a LiveView is easy with **LiveViewJS**.  You can get started in just a few minutes.

## Create a New Project

**LiveViewJS** has a project generation tool that will setup the project structure and install the required dependencies for either NodeJS or Deno.

Run:
```bash
npx @liveviewjs/gen
```

You will be prompted to select the type of project you want to create and a couple other questions.  Then, voilà, you will have a new project that runs out of the box!


# Download the Repo

The fastest way to run the example or build your own LiveView is by downloading the **LiveViewJS** repo. This repo
contains all the examples and configured webserver code for Express (NodeJS) and Oak (Deno).

## Get the Code

Either use `git clone` or `degit` to get the **LiveViewJS** GitHub repository.

:::info 

`degit` is a lightweight way to clone a repo without the .git parts.
[More info](https://github.com/Rich-Harris/degit).

:::

### Clone the **LiveViewJS** GitHub repository:

```bash
# clone the LiveViewJS repo
git clone https://github.com/floodfx/liveviewjs.git
```

### OR fetch with `degit`:

```bash
# copy the LiveViewJS repo
npx degit floodfx/liveviewjs liveviewjs
```

## Change to the LiveViewJS Directory

```bash
# cd to the LiveViewJS directory
cd liveviewjs
```

## Node or Deno?

**LiveViewJS** runs on both Node and Deno, but you'll probably want to start down one path or the other depending on what
runtime you are more familiar with or are already using.

:::note

The **LiveViewJS** library APIs are the same so you can build your LiveViews on one platform and run them on the
other unless you are using Deno or Node-specific APIs in your LiveView implementation.

:::

### Node

- [NodeJS - Run the Examples](nodejs-run-examples)
- [NodeJS - Build your First LiveView](nodejs-build-first-liveview)

### Deno

- [Deno - Run the Examples](deno-run-examples)
- [Deno - Build your First LiveView](deno-build-first-liveview)
