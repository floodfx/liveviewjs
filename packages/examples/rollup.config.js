// import typescript from "rollup-plugin-typescript2";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

const external = ["liveviewjs", "zod", "nanoid", "node-fetch"];

export default [
  // build the common js rollup
  {
    external,
    input: "./src/rollupEntry.ts",
    output: {
      file: "./build/liveviewjs-examples.js",
      format: "cjs",
    },
    plugins: [
      resolve(),
      typescript({ tsconfig: "./tsconfig.json", declarationDir: "./rollup", declaration: true }),
      commonjs({
        exclude: "node_modules/**",
      }),
    ],
  },
  // build the esm rollup
  {
    external,
    input: "./src/rollupEntry.ts",
    output: {
      file: "./build/liveviewjs-examples.mjs",
      format: "esm",
    },
    plugins: [
      {
        banner() {
          // add typescript types to the javascript bundle
          return '/// <reference types="./liveviewjs-examples.d.ts" />';
        },
      },
      resolve(),
      typescript({ tsconfig: "./tsconfig.json", declarationDir: "./rollup", declaration: true }),
      commonjs(),
    ],
  },
  // bundle all the *.d.ts typescript definitions into a single d.ts file
  {
    external,
    input: "./build/rollup/rollupEntry.d.ts",
    output: {
      file: "./build/liveviewjs-examples.d.ts",
      format: "esm",
    },
    plugins: [dts()],
  },
];
