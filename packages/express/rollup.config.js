// import typescript from "rollup-plugin-typescript2";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

const packageName = "express";

const external = ["express", "express-session", "jsonwebtoken", "liveviewjs", "nanoid", "redis", "ws", "zod"];

export default [
  // build the commonjs module
  {
    external,
    input: "./src/index.ts",
    output: {
      file: `./build/liveviewjs-${packageName}.js`,
      format: "cjs",
    },
    plugins: [
      resolve({
        preferBuiltins: true,
      }),
      typescript({ tsconfig: "./tsconfig.json", declarationDir: "./rollup", declaration: true, module: "esnext" }),
      commonjs(),
    ],
  },
  // build the .mjs (ES Module) version of the library
  {
    external,
    input: "./src/index.ts",
    output: {
      file: `./build/liveviewjs-${packageName}.mjs`,
      format: "esm",
    },
    plugins: [
      {
        banner() {
          // add typescript types to the javascript bundle
          return '/// <reference types="./liveview.d.ts" />';
        },
      },
      resolve({
        preferBuiltins: true,
      }),
      typescript({ tsconfig: "./tsconfig.json", declarationDir: "./rollup", declaration: true, module: "esnext" }),
      commonjs(),
    ],
  },
  // combine all the typescript types into a single file
  {
    external,
    input: "./build/rollup/node/index.d.ts",
    output: {
      file: `./build/liveviewjs-${packageName}.d.ts`,
      format: "esm",
    },
    plugins: [dts()],
  },
];
