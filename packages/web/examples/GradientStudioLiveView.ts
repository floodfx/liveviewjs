import { ClassLiveView, html, LiveViewMeta } from "../../core/src";
import { Card, Button, Label, Input } from "./components";

export class GradientStudioLiveView extends ClassLiveView<{ color1: string; color2: string; angle: number }> {
  async mount(socket: any) {
    socket.assign({ color1: "#f43f5e", color2: "#8b5cf6", angle: 135 });
  }

  async handleEvent(event: { type: string; value?: any; angle?: any; color1?: string; color2?: string }, socket: any) {
    let color1 = socket.context.color1 || "#f43f5e";
    let color2 = socket.context.color2 || "#8b5cf6";
    let angle = socket.context.angle ?? 135;

    if (event.type === "randomize") {
      const hex = () => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
      color1 = hex();
      color2 = hex();
      angle = Math.floor(Math.random() * 360);
    } else if (event.type === "change_color") {
      const valColor1 = event.color1 ?? event.value?.color1;
      const valColor2 = event.color2 ?? event.value?.color2;
      const valAngle = event.angle ?? event.value?.angle;

      if (valColor1) color1 = valColor1;
      if (valColor2) color2 = valColor2;
      if (valAngle !== undefined) angle = Number(valAngle);
    }
    socket.assign({ color1, color2, angle });
  }

  async render(context: { color1: string; color2: string; angle: number }, meta: LiveViewMeta) {
    const color1 = context.color1 || "#f43f5e";
    const color2 = context.color2 || "#8b5cf6";
    const angle = context.angle ?? 135;
    const gradientCss = `linear-gradient(${angle}deg, ${color1}, ${color2})`;

    return Card({
      title: "🏷️ Gradient Studio (TTL)",
      colorClass: "text-rose-400",
      children: html`
        <div id="gradient-preview" class="h-36 rounded-xl border-2 border-slate-800 shadow-inner flex items-center justify-center transition-all duration-300" style="background: ${gradientCss};">
          <span id="gradient-css-text" class="bg-slate-950/70 backdrop-blur-md text-slate-100 px-3 py-1.5 rounded-lg font-mono text-xs border border-slate-700/50">
            ${gradientCss}
          </span>
        </div>

        <form id="gradient-form" phx-change="change_color" class="flex flex-col gap-4">
          <input type="hidden" name="_csrf_token" value="${meta.csrfToken}" />
          <div class="flex justify-around items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div class="flex items-center gap-2">
              ${Label({ children: "Color 1:" })}
              ${Input({ id: "color1-input", name: "color1", type: "color", value: color1, className: "w-8 h-8 p-0 bg-transparent border-0 cursor-pointer" })}
            </div>
            <div class="flex items-center gap-2">
              ${Label({ children: "Color 2:" })}
              ${Input({ id: "color2-input", name: "color2", type: "color", value: color2, className: "w-8 h-8 p-0 bg-transparent border-0 cursor-pointer" })}
            </div>
          </div>
          <div class="space-y-1 text-left">
            <div class="flex justify-between items-center">
              ${Label({ children: `Angle: ${angle}°` })}
            </div>
            <input id="angle-input" type="range" name="angle" min="0" max="360" value="${angle}" class="w-full accent-rose-500 cursor-pointer" />
          </div>
        </form>

        ${Button({
          id: "randomize-btn",
          phxClick: "randomize",
          variant: "danger",
          className: "w-full py-3 text-base shadow-rose-600/30",
          children: "🎲 Randomize Colors",
        })}
      `,
    });
  }
}
