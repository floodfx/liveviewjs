import { ClassLiveView, html, LiveViewMeta } from "../../core/src";
import { Card, Badge, Button, Input } from "./components";

export interface Task {
  id: string;
  title: string;
  done: boolean;
}

export class TaskTrackerLiveView extends ClassLiveView<{ tasks: Task[]; newTaskTitle: string }> {
  async mount(socket: any) {
    socket.assign({
      tasks: [
        { id: "1", title: "Verify data-phx-static deduplication", done: true },
        { id: "2", title: "Test TSX LiveView rendering", done: false },
        { id: "3", title: "Add interactive gradient studio", done: false },
      ],
      newTaskTitle: "",
    });
  }

  async handleEvent(event: { type: string; value?: any; id?: string; title?: string }, socket: any) {
    let tasks: Task[] = socket.context.tasks ? [...socket.context.tasks] : [];

    if (event.type === "add_task") {
      const title = (event.title ?? event.value?.title ?? (typeof event.value === "string" ? event.value : "")).trim();
      if (title) {
        tasks = [...tasks, { id: String(Date.now()), title, done: false }];
      }
    } else if (event.type === "toggle_task") {
      const taskId = String(event.id ?? event.value?.id ?? event.value);
      tasks = tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t));
    } else if (event.type === "delete_task") {
      const taskId = String(event.id ?? event.value?.id ?? event.value);
      tasks = tasks.filter((t) => t.id !== taskId);
    }
    socket.assign({ tasks, newTaskTitle: "" });
  }

  async render(context: TaskContext, meta: LiveViewMeta): Promise<LiveViewTemplate> {
    const { tasks } = context;
    const completedCount = tasks.filter((t) => t.done).length;

    return Card({
      title: "📘 Task Tracker (TSX)",
      colorClass: "text-indigo-400",
      badge: Badge({ label: `${completedCount}/${tasks.length} Done`, variant: "indigo" }),
      children: html`
        <form id="add-task-form" phx-submit="add_task" class="flex gap-2">
          <input type="hidden" name="_csrf_token" value="${meta.csrfToken}" />
          ${Input({ id: "new-task-input", name: "title", placeholder: "Add a new task...", className: "flex-1" })}
          <button id="add-task-btn" type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-lg shadow-lg shadow-indigo-600/30 transition-all cursor-pointer">
            Add
          </button>
        </form>

        <div class="flex flex-col gap-2">
          ${tasks.map(
            (task) => html`
              <div id="task-item-${task.id}" class="flex items-center justify-between bg-slate-950 p-3 rounded-xl border ${task.done ? "border-emerald-800/60" : "border-slate-800"} transition-all">
                ${Button({
                  id: `toggle-btn-${task.id}`,
                  phxClick: "toggle_task",
                  phxValueKey: "id",
                  phxValueVal: task.id,
                  variant: "ghost",
                  className: `flex-1 text-left ${task.done ? "line-through text-slate-500" : "text-slate-100 font-medium"}`,
                  children: `${task.done ? "✅ " : "⏳ "} ${task.title}`,
                })}
                ${Button({
                  id: `delete-btn-${task.id}`,
                  phxClick: "delete_task",
                  phxValueKey: "id",
                  phxValueVal: task.id,
                  variant: "ghost",
                  className: "text-rose-400 hover:text-rose-300 p-1 text-lg",
                  children: "🗑️",
                })}
              </div>
            `
          )}
        </div>
      `,
    });
  }
}
