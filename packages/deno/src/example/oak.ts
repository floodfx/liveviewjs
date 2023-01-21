import { Context, LiveViewRouter, send } from "../deps.ts";

export function logRequests(
  liveRouter: LiveViewRouter
): (ctx: Context<Record<string, unknown>>, next: () => Promise<unknown>) => void {
  return async (ctx: Context<Record<string, unknown>>, next: () => Promise<unknown>) => {
    const { request } = ctx;
    const { url, method } = request;
    const path = url.pathname;
    const isLiveView = liveRouter[path] !== undefined;
    console.log(`${method} ${isLiveView ? "LiveView" : ""} ${url} - ${new Date().toISOString()}`);
    await next();
  };
}

export const serveStatic = async (ctx: Context<Record<string, unknown>>) => {
  const path = ctx.request.url.pathname;
  await send(ctx, path, {
    root: "./public/",
  });
};
