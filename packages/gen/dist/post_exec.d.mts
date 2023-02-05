import { GeneratorType } from "./prompts.mjs";
export declare function changeDirMsg(type: GeneratorType, name: string): string | undefined;
export declare function installMsg(type: GeneratorType, install: boolean): "Run `npm install` to install node dependencies." | undefined;
export declare function runMsg(type: GeneratorType): "Run `npm run dev` to start your LiveViewJS project.\"" | "Run `deno run --allow-run --allow-read --allow-write --allow-net --allow-env  src/server/autorun.ts` to start your LiveViewJS project.\"" | undefined;
