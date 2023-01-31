#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const enquirer_1 = require("enquirer");
const hygen_1 = require("hygen");
const path_1 = __importDefault(require("path"));
const run = async () => {
    // first ask what generator to run
    const { generator } = (await (0, enquirer_1.prompt)({
        type: "select",
        name: "generator",
        message: "What LiveViewJS generator would you like to run?",
        choices: ["node-project"], // "deno-project"],
    }));
    const defaultTemplates = path_1.default.join(__dirname, "../_templates");
    // run hygen
    const result = await (0, hygen_1.runner)([generator, "new"], {
        templates: defaultTemplates,
        cwd: process.cwd(),
        logger: new hygen_1.Logger(console.log.bind(console)),
        debug: !!process.env.DEBUG,
        exec: (action, body) => {
            console.log("Executing command: ", action, body);
            const res = (0, child_process_1.exec)(action + " " + body);
            if (res.exitCode !== 0) {
                console.error("Command failed.");
                return;
            }
            console.log("Command done.");
        },
        createPrompter: () => require("enquirer"),
    });
    if (result.failure) {
        console.error("Failed to run generator: ", result.failure);
        process.exit(1);
    }
    process.exit(result.success ? 0 : 1);
};
run();
