import { describe, test, expect, mock } from "bun:test";
import { ClassLiveView } from "./classLiveView";
import { html } from "../templates";

/**
 * ClassLiveView Exhaustive API & Corner Case Unit Test Suite
 */
describe("ClassLiveView - Exhaustive API & Edge Case Coverage", () => {
  class ComprehensiveView extends ClassLiveView<{
    count: number;
    queryParam: string;
    infoMsg: string;
    isShutdown: boolean;
  }> {
    count = 0;
    queryParam = "";
    infoMsg = "";
    isShutdown = false;

    async mount(socket: any) {
      socket.assign({
        count: this.count,
        queryParam: this.queryParam,
        infoMsg: this.infoMsg,
      });
    }

    async handleParams(url: URL, socket: any) {
      this.queryParam = url.searchParams.get("filter") ?? "all";
      socket.assign({ queryParam: this.queryParam });
    }

    async handleEvent(event: { type: string; val?: number }, socket: any) {
      if (event.type === "set") {
        this.count = event.val ?? 0;
      } else if (event.type === "patch") {
        socket.pushPatch("/new-path");
      } else if (event.type === "redirect") {
        socket.pushRedirect("/login");
      }
      socket.assign({ count: this.count });
    }

    async handleInfo(info: { type: string; text: string }, socket: any) {
      if (info.type === "update_info") {
        this.infoMsg = info.text;
      }
      socket.assign({ infoMsg: this.infoMsg });
    }

    async shutdown() {
      this.isShutdown = true;
    }

    async render() {
      return html`<div id="view">
        <p id="count">${this.count}</p>
        <p id="filter">${this.queryParam}</p>
        <p id="info">${this.infoMsg}</p>
      </div>`;
    }
  }

  test("1. handleParams extracts URL query parameters and updates state", async () => {
    const view = new ComprehensiveView();
    const mockSocket = {
      context: {},
      assign(obj: any) {
        Object.assign(this.context, obj);
      },
    };

    await view.mount(mockSocket as any);
    await view.handleParams(new URL("http://localhost:3000/test?filter=active"), mockSocket as any);

    expect(view.queryParam).toBe("active");
    expect(mockSocket.context.queryParam).toBe("active");

    const parts = (await view.render()).partsTree();
    expect(parts["1"]).toBe("active");
  });

  test("2. handleInfo processes internal pubsub/info messages", async () => {
    const view = new ComprehensiveView();
    const mockSocket = {
      context: {},
      assign(obj: any) {
        Object.assign(this.context, obj);
      },
    };

    await view.mount(mockSocket as any);
    await view.handleInfo({ type: "update_info", text: "pubsub-message" }, mockSocket as any);

    expect(view.infoMsg).toBe("pubsub-message");
    expect(mockSocket.context.infoMsg).toBe("pubsub-message");

    const parts = (await view.render()).partsTree();
    expect(parts["2"]).toBe("pubsub-message");
  });

  test("3. pushPatch and pushRedirect navigation triggers on socket", async () => {
    const view = new ComprehensiveView();
    const pushPatchSpy = mock();
    const pushRedirectSpy = mock();

    const mockSocket = {
      context: {},
      assign(obj: any) {
        Object.assign(this.context, obj);
      },
      pushPatch: pushPatchSpy,
      pushRedirect: pushRedirectSpy,
    };

    await view.mount(mockSocket as any);

    await view.handleEvent({ type: "patch" }, mockSocket as any);
    expect(pushPatchSpy).toHaveBeenCalledWith("/new-path");

    await view.handleEvent({ type: "redirect" }, mockSocket as any);
    expect(pushRedirectSpy).toHaveBeenCalledWith("/login");
  });

  test("4. shutdown hook is executed cleanly on disconnection", async () => {
    const view = new ComprehensiveView();
    expect(view.isShutdown).toBe(false);

    await view.shutdown();
    expect(view.isShutdown).toBe(true);
  });
});
