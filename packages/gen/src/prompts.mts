import { Prompt } from "enquirer";

// extract options type from Prompt constructor
type PromptOptions = NonNullable<ConstructorParameters<typeof Prompt>[0]>;

export const GeneratorTypes = ["node-project", "deno-project"] as const;
export type GeneratorType = typeof GeneratorTypes[number];

export const GeneratorTypePromptOptions: PromptOptions = {
  type: "select",
  name: "generator",
  message: "What LiveViewJS generator would you like to run?",
  choices: GeneratorTypes as unknown as string[],
};

export const NamePromptOptions: PromptOptions = {
  type: "input",
  name: "name",
  message: "What should we call this project?",
};

export const NpmInstallPromptOptions: PromptOptions = {
  type: "confirm",
  name: "install",
  message: "Should we run npm install for you?",
};
