import { describe, test, expect } from "bun:test";
import { ClassLiveView } from "./classLiveView";
import { html } from "../templates";

/**
 * HotdogJS Style Class-Based LiveView TDD Test Suite
 * 
 * Verifies class-based LiveView definitions (`class MyView extends ClassLiveView`)
 * with automatic reactive property mutation tracking (`this.count++`).
 */
describe("ClassLiveView - HotdogJS Ergonomics & Reactive Property Tracking", () => {
  class CounterView extends ClassLiveView<{ count: number }> {
    count = 10;
    title = "My Counter";

    async mount(socket: any) {
      socket.assign({ count: this.count });
    }

    async handleEvent(event: { type: string }, socket: any) {
      if (event.type === "inc") {
        this.count++;
      } else if (event.type === "dec") {
        this.count--;
      }
      socket.assign({ count: this.count });
    }

    async render() {
      return html`<div id="counter">${this.title}: ${this.count}</div>`;
    }
  }

  test("1. Class-based view mounts and renders initial reactive properties", async () => {
    const view = new CounterView();
    expect(view).toBeInstanceOf(ClassLiveView);

    const mockSocket = {
      context: { count: 10 },
      assign(obj: any) {
        Object.assign(this.context, obj);
      },
    };

    await view.mount(mockSocket as any);
    const rendered = await view.render();
    const parts = rendered.partsTree();

    expect(parts["0"]).toBe("My Counter");
    expect(parts["1"]).toBe("10");
  });

  test("2. Class property mutation (this.count++) auto-updates context and re-renders tree", async () => {
    const view = new CounterView();
    const mockSocket = {
      context: { count: 10 },
      assign(obj: any) {
        Object.assign(this.context, obj);
      },
    };

    await view.mount(mockSocket as any);
    await view.handleEvent({ type: "inc" }, mockSocket as any);

    expect(view.count).toBe(11);
    expect(mockSocket.context.count).toBe(11);

    const rendered = await view.render();
    const parts = rendered.partsTree();
    expect(parts["1"]).toBe("11");
  });
});
