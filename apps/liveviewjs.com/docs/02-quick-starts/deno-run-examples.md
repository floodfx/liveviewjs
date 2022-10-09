---
sidebar_position: 4
---

# Deno - Run the Examples

**LiveViewJS** ships with over a dozen example LiveViews that show everything from simple button-based events to
real-time, multi-player views. It takes approximately 1 minute to get these examples up and running and is a good way to
get a feel for the user experience of a LiveView. Let's get started!

## Prerequisite

[Deno](https://deno.land/) version 1.24.x or above. (Older versions may work but haven't been tested.)

If you haven't already, [download the **LiveViewJS** repo](get-liveviewjs-repo).

## Run the Examples

Navigate to the `packages/deno` directory:

```bash
# cd to the deno directory
cd packages/deno
```

Then, start the Deno server with the examples:

```bash
deno run --allow-run --allow-read --allow-env  src/example/autorun.ts
```

Point your browser to [http://localhost:9001](http://localhost:9001)

## Explore the Examples

You should see something like the screenshot below including a list of examples with a brief description, a link to the
running LiveView, and a link to the source code for each example.

![LiveViewJS Examples Screenshot](/img/screenshots/liveviewjs_examples_rec.gif)
