---
sidebar_position: 2
---

# NodeJS - Run the Examples

**LiveViewJS** ships with over a dozen example LiveViews that show everything from simple button-based events to
real-time, multi-player views. It takes approximately ⏱ 1 minute to get these examples up and running and is a good way
to get a feel for the user experience of a LiveView. Let's get started!

## Prerequisite

[Node.js](https://nodejs.org/en/download/) version 18.x or above.

:::note We rely on the NodeJS Fetch API, which is only available in 18+. :::

If you haven't already, [download the **LiveViewJS** repo](get-liveviewjs-repo).

## Run the Examples

First, load the NPM dependencies:

```bash
# install the NPM dependencies
npm install
```

Then, start the express server with the examples:

```bash
# run the examples
npm run start -w packages/express
```

Point your browser to [http://localhost:4001](http://localhost:4001)

## Explore the Examples

You should see something like the screenshot below including a list of examples with a brief description, a link to the
running LiveView, and a link to the source code for each example.

![LiveViewJS Examples Screenshot](/img/screenshots/liveviewjs_examples_rec.gif)
