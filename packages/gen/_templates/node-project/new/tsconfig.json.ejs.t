---
to: <%= h.changeCase.lower(name) %>/tsconfig.json
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
    "target": "es2019",
    "moduleResolution": "node",
    "lib": ["es2019", "esnext.asynciterable"],
    "types": ["node"],
    "outDir": "./build",
    "baseUrl": "."
  },
  "include": ["./src/**/*"],
  "exclude": ["build", "node_modules", "./**/*.test.ts", "./src/client/**/*"]
}
