// import typescript from "rollup-plugin-typescript2";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default [
  {
    external: ['liveviewjs', "zod"],
    input: './src/nodeRollupEntry.ts',
    output: {
      file: './build/liveviewjs-examples.js',
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
    external: ['liveviewjs', "zod"],
    input: './src/nodeRollupEntry.ts',
    output: {
      file: './build/liveviewjs-examples.mjs',
      format: 'esm',
    },
    plugins: [
      {
        banner() {
          // add typescript types to the javascript bundle
          return '/// <reference types="./liveviewjs-examples.d.ts" />';
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
    external: ['liveviewjs', "zod"],
    input: './build/rollup/nodeRollupEntry.d.ts',
    output: {
      file: './build/liveviewjs-examples.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
  }
];