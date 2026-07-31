/* eventually ,"form", "upload", "example-01",... */
export const TemplateTypes = ["min", "max"];
export const RuntimeTypes = ["node", "deno"];
export const GeneratorTypes = [...RuntimeTypes, "liveview"];
export const GeneratorTypePromptOptions = {
    type: "select",
    name: "generator",
    message: "What LiveViewJS generator would you like to run?",
    choices: GeneratorTypes,
};
export const NamePromptOptions = {
    type: "input",
    name: "name",
    message: "What should we call it?",
};
export const NpmInstallPromptOptions = {
    type: "confirm",
    name: "install",
    message: "Should we run npm install for you?",
};
export const RoutePrompt = {
    type: "input",
    name: "route",
    message: "What route should load this LiveView?",
};
export const RuntimePrompt = {
    type: "select",
    name: "runtime",
    message: "What runtime should we target?",
    choices: RuntimeTypes,
};
export const TemplatePrompt = {
    type: "select",
    name: "template",
    message: "What liveview template should we create?",
    choices: TemplateTypes,
};
