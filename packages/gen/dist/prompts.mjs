export const GeneratorTypes = ["node-project", "deno-project"];
export const GeneratorTypePromptOptions = {
    type: "select",
    name: "generator",
    message: "What LiveViewJS generator would you like to run?",
    choices: GeneratorTypes,
};
export const NamePromptOptions = {
    type: "input",
    name: "name",
    message: "What should we call this project?",
};
export const NpmInstallPromptOptions = {
    type: "confirm",
    name: "install",
    message: "Should we run npm install for you?",
};
