import { ClassLiveView } from "../../core/src/index";
import { Card } from "./components";

export class ThermostatLiveView extends ClassLiveView {
  async mount(socket) {
    socket.assign({ temp: 72, mode: "heat" });
  }

  async handleEvent(event, socket) {
    let temp = socket.context.temp ?? 72;
    let mode = socket.context.mode ?? "heat";

    if (event.type === "temp_up") {
      temp = Math.min(85, temp + 1);
    } else if (event.type === "temp_down") {
      temp = Math.max(60, temp - 1);
    } else if (event.type === "set_mode") {
      mode = event.mode || event.value?.mode || event.value || "heat";
    }
    socket.assign({ temp, mode });
  }

  async render(context, meta) {
    return (
      <Card title="🌡️ Smart Thermostat (JSX)" colorClass="text-sky-400">
        <div class="relative w-40 h-40 mx-auto rounded-full bg-slate-950 border-4 border-sky-500 shadow-lg shadow-sky-500/20 flex flex-col items-center justify-center">
          <span id="temp-display" class="text-5xl font-black text-slate-100">{context.temp}°</span>
          <span id="mode-display" class="text-xs font-bold uppercase tracking-widest text-sky-400 mt-1">{context.mode}</span>
        </div>

        <div class="flex justify-center gap-4">
          <button id="btn-temp-down" type="button" phx-click="temp_down" class="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xl flex items-center justify-center transition-all border border-slate-700 shadow-md">-</button>
          <button id="btn-temp-up" type="button" phx-click="temp_up" class="w-12 h-12 rounded-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-xl flex items-center justify-center transition-all shadow-lg shadow-sky-600/30">+</button>
        </div>

        <div class="flex justify-between bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button id="mode-heat" type="button" phx-click="set_mode" phx-value-mode="heat" class={context.mode === 'heat' ? 'flex-1 py-2 text-xs font-bold rounded-lg transition-all bg-orange-600 text-white shadow-md' : 'flex-1 py-2 text-xs font-bold rounded-lg transition-all text-slate-400 hover:text-slate-200'}>🔥 Heat</button>
          <button id="mode-cool" type="button" phx-click="set_mode" phx-value-mode="cool" class={context.mode === 'cool' ? 'flex-1 py-2 text-xs font-bold rounded-lg transition-all bg-cyan-600 text-white shadow-md' : 'flex-1 py-2 text-xs font-bold rounded-lg transition-all text-slate-400 hover:text-slate-200'}>❄️ Cool</button>
          <button id="mode-eco" type="button" phx-click="set_mode" phx-value-mode="eco" class={context.mode === 'eco' ? 'flex-1 py-2 text-xs font-bold rounded-lg transition-all bg-emerald-600 text-white shadow-md' : 'flex-1 py-2 text-xs font-bold rounded-lg transition-all text-slate-400 hover:text-slate-200'}>🌱 Eco</button>
        </div>
      </Card>
    );
  }
}
