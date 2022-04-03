// import typescript from "rollup-plugin-typescript2";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default [
  {
    input: './src/nodeRollupEntry.ts',
    output: {
      file: './build/liveview-examples.js',
      format: 'cjs'
    },
    plugins: [
      resolve(),
      typescript({ tsconfig: './tsconfig.json',
        declarationDir: "./rollup",
        declaration: true,
      }),
      commonjs({
        exclude: 'node_modules/**'
      }),
    ],
  },
  {
    input: './src/nodeRollupEntry.ts',
    output: {
      file: './build/liveview-examples.mjs',
      format: 'esm',
    },
    plugins: [
      {
        banner() {
          // add typescript types to the javascript bundle
          return '/// <reference types="./liveview-examples.d.ts" />';
        }
      },
      resolve(),
      typescript({ tsconfig: './tsconfig.json',
        declarationDir: "./rollup",
        declaration: true,
      }),
      commonjs(),
    ]
  },
  {
    input: './build/rollup/nodeRollupEntry.d.ts',
    output: {
      file: './build/liveview-examples.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
  }
];