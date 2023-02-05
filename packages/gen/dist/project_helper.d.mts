export type CreateAppArgs = {
    projectType: "node-project" | "deno-project";
    projectDir?: string;
    install?: boolean;
    quiet?: boolean;
};
declare function createApp({ projectType, projectDir, install, quiet }: CreateAppArgs): Promise<void>;
export { createApp };
