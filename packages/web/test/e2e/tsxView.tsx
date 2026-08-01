import { ClassLiveView } from "../../../core/src/index";

export class TsxCounterView extends ClassLiveView<{ count: number }> {
  count = 10;

  async mount(socket: any) {
    socket.assign({ count: this.count });
  }

  async handleEvent(event: { type: string }, socket: any) {
    if (event.type === "inc") {
      this.count++;
    }
    socket.assign({ count: this.count });
  }

  async render() {
    return (
      <div id="tsx-card" className="card">
        <h1>⚡ Real TSX File LiveView Counter</h1>
        <div id="count-val" className="count-display">{this.count}</div>
        <button id="inc-btn" phx-click="inc">+ Increment</button>
      </div>
    );
  }
}
