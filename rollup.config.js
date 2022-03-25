import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: 'src/server/index.ts',
  output: {
    file: 'liveview.js',
    format: 'cjs'
  },
  output: {
    file: 'liveview.esm.js',
    format: 'esm'
  },
  plugins: [resolve(), typescript(), commonjs({
    namedExports: {
      "ws": ["WebSocket"]
    },
    include: [
      'node_modules/jsonwebtoken/index.js',
      'node_modules/ws/lib/websocket.js',
      'node_modules/express-session/index.js',
      'node_modules/express/index.js',
    ]
  })]
};