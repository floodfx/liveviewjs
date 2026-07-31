import { Prompt } from "enquirer";

// extract options type from Prompt constructor
type PromptOptions = NonNullable<ConstructorParameters<typeof Prompt>[0]>;

/* eventually ,"form", "upload", "example-01",... */
export const TemplateTypes = ["min", "max"] as const;
export type TemplateType = typeof TemplateTypes[number];

export const RuntimeTypes = ["node", "deno"] as const;
export type RuntimeType = typeof RuntimeTypes[number];

export const GeneratorTypes = [...RuntimeTypes, "liveview"] as const;
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
  message: "What should we call it?",
};

export const NpmInstallPromptOptions: PromptOptions = {
  type: "confirm",
  name: "install",
  message: "Should we run npm install for you?",
};

export const RoutePrompt: PromptOptions = {
  type: "input",
  name: "route",
  message: "What route should load this LiveView?",
};

export const RuntimePrompt: PromptOptions = {
  type: "select",
  name: "runtime",
  message: "What runtime should we target?",
  choices: RuntimeTypes as unknown as string[],
};

export const TemplatePrompt: PromptOptions = {
  type: "select",
  name: "template",
  message: "What liveview template should we create?",
  choices: TemplateTypes as unknown as string[],
};
