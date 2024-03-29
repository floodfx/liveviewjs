---
to: <%= h.changeCase.lower(name) %>/tsconfig-client.json
---
{
  "compilerOptions": {
    "module": "commonjs",
    "esModuleInterop": true,
    "noEmitOnError": true,
    "noFallthroughCasesInSwitch": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictPropertyInitialization": false,
    "declaration": true,
    "resolveJsonModule": true,
    "strict": true,
    "skipLibCheck": true,
    "target": "ES2020",
    "moduleResolution": "node",
    "lib": ["DOM"],
    "types": ["node"],
    "outDir": "./build",
    "baseUrl": "."
  },
  "include": ["./src/client/*"],
  "exclude": ["build", "node_modules", "./**/*.test.ts"]
}
