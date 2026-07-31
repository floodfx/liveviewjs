export function changeDirMsg(type, name) {
    switch (type) {
        case "node":
        case "deno":
            return `cd ${name.toLowerCase()}`;
        default:
            return undefined;
    }
}
export function installMsg(type, install) {
    switch (type) {
        case "node":
            return install ? undefined : "Run `npm install` to install node dependencies.";
        case "deno":
            return install ? undefined : "Run `npm install` to install node dependencies for client-side javascript.";
        default:
            return undefined;
    }
}
export function runMsg(type) {
    switch (type) {
        case "node":
            return 'Run `npm run dev` to start your LiveViewJS project."';
        case "deno":
            return 'Run `deno run --allow-run --allow-read --allow-write --allow-net --allow-env  src/server/autorun.ts` to start your LiveViewJS project."';
        default:
            return undefined;
    }
}
