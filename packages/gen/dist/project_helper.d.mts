import { RuntimeType } from "./prompts.mjs";
export type CreateAppArgs = {
    projectType: RuntimeType;
    projectDir?: string;
    install?: boolean;
    quiet?: boolean;
};
declare function createApp({ projectType, projectDir, install, quiet }: CreateAppArgs): Promise<void>;
export { createApp };
