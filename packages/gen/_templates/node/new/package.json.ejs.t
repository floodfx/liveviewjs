---
to: <%= h.changeCase.lower(name) %>/package.json
---
{
  "name": "<%= name %>",
  "version": "0.0.1",
  "description": "A starter project for LiveViewJS with NodeJS",
  "scripts": {
    "dev": "ts-node ./src/server/autorun.ts",
    "clean": "rm -rf build; rm -rf dist",
    "format": "prettier --write '**/*.{ts,js,json,html,css}'"
  },
  "keywords": [
    "liveviewjs",
    "liveview",
    "phoenix",
    "typescript",
    "javascript",
    "express"
  ],
  "dependencies": {
    "@liveviewjs/express": "*",
    "express": "^4.17.2",
    "express-session": "^1.17.2",
    "jsonwebtoken": "^8.5.1",
    "liveviewjs": "*",
    "nanoid": "^3.2.0",
    "ws": "^8.8.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.13",
    "@types/express-session": "^1.17.4",
    "@types/jsonwebtoken": "^8.5.8",
    "@types/node": "^18.7.8",
    "@types/nprogress": "^0.2.0",
    "@types/phoenix": "^1.5.4",
    "@types/phoenix_live_view": "^0.15.1",
    "@types/ws": "^8.5.3",
    "chalk": "^4.1.2",
    "esbuild": "^0.14.53",
    "nprogress": "^0.2.0",
    "phoenix": "^1.6.12",
    "phoenix_html": "^3.2.0",
    "phoenix_live_view": "^0.18.0",
    "tailwindcss": "^3.2.4",
    "ts-node": "^10.9.1",
    "typescript": "^4.5.4"
  }
}
