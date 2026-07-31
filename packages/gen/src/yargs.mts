import yargs from "yargs/yargs";
import { RuntimeTypes, TemplateTypes } from "./prompts.mjs";

export interface GenYargs {
  generator?: string;
  name?: string;
  quiet?: boolean;
  force?: boolean;
}

export const genYargs = (argv: string[]): GenYargs => {
  return yargs(argv)
    .options({
      generator: {
        type: "string",
        alias: "g",
        description: "Generator to run",
      },
      name: {
        type: "string",
        alias: "n",
        description: "Name of the project",
      },
      quiet: {
        type: "boolean",
        alias: "q",
        description: "Suppress all output",
      },
      force: {
        type: "boolean",
        alias: "f",
        description: "Overwrite existing files",
      },
    })
    .parseSync();
};

export interface ProjectYargs {
  install?: boolean;
}

export const projYargs = (argv: string[]): ProjectYargs => {
  return yargs(argv)
    .usage("Usage: $0 [generator] [args]")
    .options({
      install: {
        type: "boolean",
        alias: "i",
        description: "Run npm install",
      },
    })
    .parseSync();
};

export interface LiveViewYargs {
  route?: string;
  runtime?: string;
  template?: string;
}

export const lvYargs = (argv: string[]): LiveViewYargs => {
  return yargs(argv)
    .usage("Usage: $0 [generator] [args]")
    .options({
      route: {
        type: "string",
        alias: "r",
        description: "Route to load LiveView",
      },
      runtime: {
        type: "string",
        alias: "n",
        description: `Target runtime: ${RuntimeTypes.join(", ")}`,
        choices: RuntimeTypes,
      },
      template: {
        type: "string",
        alias: "t",
        description: `Template to use: ${TemplateTypes.join(", ")}`,
        choices: TemplateTypes,
      },
    })
    .parseSync();
};
