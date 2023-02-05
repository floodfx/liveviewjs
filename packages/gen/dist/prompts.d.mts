import { Prompt } from "enquirer";
type PromptOptions = NonNullable<ConstructorParameters<typeof Prompt>[0]>;
export declare const GeneratorTypes: readonly ["node-project", "deno-project"];
export type GeneratorType = typeof GeneratorTypes[number];
export declare const GeneratorTypePromptOptions: PromptOptions;
export declare const NamePromptOptions: PromptOptions;
export declare const NpmInstallPromptOptions: PromptOptions;
export {};
