import yargs from "yargs/yargs";

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

export interface NodeProjectYargs {
  install?: boolean;
}

export const nodeYargs = (argv: string[]): NodeProjectYargs => {
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
