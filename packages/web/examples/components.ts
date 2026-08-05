import { html, safe, LiveViewTemplate } from "../../core/src";

// 1. Navigation Header Component
export function NavHeader(props: { currentPath: string }) {
  const { currentPath } = props;
  const linkClass = (path: string, activeClass: string) =>
    `px-4 py-2 rounded-lg font-semibold transition-all ${
      currentPath === path ? activeClass : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
    }`;

  return html`
    <nav class="flex items-center gap-2 mb-8 bg-slate-900/90 backdrop-blur-md px-4 py-3 rounded-full border border-slate-800 shadow-xl">
      <a id="nav-jsx" href="/jsx" class="${linkClass("/jsx", "text-sky-400 bg-slate-800/90 shadow-inner")}">⚛️ JSX: Thermostat</a>
      <a id="nav-tsx" href="/tsx" class="${linkClass("/tsx", "text-indigo-400 bg-slate-800/90 shadow-inner")}">📘 TSX: Task Tracker</a>
      <a id="nav-ttl" href="/ttl" class="${linkClass("/ttl", "text-rose-400 bg-slate-800/90 shadow-inner")}">🏷️ Tagged Template: Gradient Studio</a>
    </nav>
  `;
}

// 2. Universal Encapsulated Card Component (Function + Class prototype compatible)
export function Card(props: {
  title: string;
  subtitle?: string | LiveViewTemplate;
  badge?: LiveViewTemplate;
  colorClass?: string;
  children: any;
}) {
  if (new.target) {
    (this as any).props = props;
    return;
  }
  const { title, subtitle, badge, colorClass = "text-sky-400", children } = props;
  const subHtml = typeof subtitle === "string" ? safe(subtitle) : subtitle;
  const childrenHtml = Array.isArray(children)
    ? safe(
        children
          .map((c) => {
            if (c === undefined || c === null || c === "undefined") return "";
            if (typeof c === "string") return c;
            return c.toString ? c.toString() : "";
          })
          .join("")
      )
    : children;

  return html`
    <div class="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold ${colorClass}">${title}</h2>
          ${badge ? badge : ""}
        </div>
        ${subHtml ? html`<p class="text-xs text-slate-400 font-mono">${subHtml}</p>` : ""}
      </div>
      ${childrenHtml}
    </div>
  `;
}

Card.prototype.render = function () {
  return Card(this.props);
};

// 3. Status Badge Component
export function Badge(props: { label: string; variant?: "indigo" | "sky" | "rose" | "emerald" }) {
  const { label, variant = "indigo" } = props;
  const variantClasses = {
    indigo: "bg-indigo-950/80 text-indigo-300 border border-indigo-800/50",
    sky: "bg-sky-950/80 text-sky-300 border border-sky-800/50",
    rose: "bg-rose-950/80 text-rose-300 border border-rose-800/50",
    emerald: "bg-emerald-950/80 text-emerald-300 border border-emerald-800/50",
  };

  return html`
    <span class="px-3 py-1 text-xs font-semibold rounded-full ${variantClasses[variant]}">
      ${label}
    </span>
  `;
}

// 4. Action Button Component (always type="button")
export function Button(props: {
  id: string;
  phxClick: string;
  phxValueKey?: string;
  phxValueVal?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "sky" | "emerald";
  className?: string;
  children: string | LiveViewTemplate;
}) {
  const { id, phxClick, phxValueKey, phxValueVal, variant = "primary", className = "", children } = props;
  const phxValAttr = phxValueKey && phxValueVal ? safe(`phx-value-${phxValueKey}="${phxValueVal}"`) : "";

  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    sky: "bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30",
    emerald: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30",
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30",
    ghost: "bg-transparent text-slate-300 hover:bg-slate-800/50",
  };

  return html`
    <button
      id="${id}"
      type="button"
      phx-click="${phxClick}"
      ${phxValAttr}
      class="font-semibold transition-all duration-200 rounded-lg cursor-pointer ${variants[variant]} ${className}"
    >
      ${children}
    </button>
  `;
}

// 5. Input Field Component
export function Input(props: { id: string; name: string; type?: string; placeholder?: string; value?: string; className?: string }) {
  const { id, name, type = "text", placeholder = "", value = "", className = "" } = props;
  return html`
    <input
      id="${id}"
      type="${type}"
      name="${name}"
      placeholder="${placeholder}"
      value="${value}"
      class="bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all ${className}"
    />
  `;
}

// 6. Typography Label Component
export function Label(props: { children: string | LiveViewTemplate; className?: string }) {
  const { children, className = "" } = props;
  return html`<label class="text-sm font-medium text-slate-300 ${className}">${children}</label>`;
}
