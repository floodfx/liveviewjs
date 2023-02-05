export interface GenYargs {
    generator?: string;
    name?: string;
    quiet?: boolean;
    force?: boolean;
}
export declare const genYargs: (argv: string[]) => GenYargs;
export interface ProjectYargs {
    install?: boolean;
}
export declare const projYargs: (argv: string[]) => ProjectYargs;
