export interface GenYargs {
    generator?: string;
    name?: string;
    quiet?: boolean;
    force?: boolean;
}
export declare const genYargs: (argv: string[]) => GenYargs;
export interface NodeProjectYargs {
    install?: boolean;
}
export declare const nodeYargs: (argv: string[]) => NodeProjectYargs;
