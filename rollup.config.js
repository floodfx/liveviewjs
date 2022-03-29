// import typescript from "rollup-plugin-typescript2";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default [
  // build for commonjs format
  {
    input: './src/index.ts',
    output: {
      file: './build/liveview.js',
      format: 'cjs'
    },
    plugins: [
      resolve(),
      typescript({ tsconfig: './tsconfig.json',
        declarationDir: "./rollup",
        declaration: true,
      }),
      commonjs(),
    ]
  },
  // build for esm module formalt
  {
    input: './src/index.ts',
    output: {
      file: './build/liveview.mjs',
      format: 'esm',
    },
    plugins: [
      {
        banner() {
          // add typescript types to the javascript bundle
          return '/// <reference types="./liveview.d.ts" />';
        }
      },
      resolve(),
      typescript({ tsconfig: './tsconfig.json',
        declarationDir: "./rollup",
        declaration: true,
      }),
    ]
  },
  // consolidate d.ts files into a single file
  {
    input: './build/rollup/server/index.d.ts',
    output: {
      file: './build/liveview.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
  }
];