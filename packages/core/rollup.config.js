// import typescript from "rollup-plugin-typescript2";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

// packages that will be loaded externally
const external = ["zod", "nanoid", "path-to-regexp"];

export default [
  {
    external,
    input: "./src/index.ts",
    output: {
      file: "./build/liveview.js",
      format: "cjs",
    },
    plugins: [
      resolve({
        preferBuiltins: true,
      }),
      typescript({ tsconfig: "./tsconfig.json", declarationDir: "./rollup", declaration: true }),
      commonjs(),
    ],
  },
  {
    external,
    input: "./src/index.ts",
    output: {
      file: "./build/liveview.mjs",
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
      typescript({ tsconfig: "./tsconfig.json", declarationDir: "./rollup", declaration: true }),
      commonjs(),
    ],
  },
  {
    external,
    input: "./build/rollup/server/index.d.ts",
    output: {
      file: "./build/liveview.d.ts",
      format: "esm",
    },
    plugins: [dts()],
  },
];
