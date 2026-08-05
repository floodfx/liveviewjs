import { html, safe, LiveViewTemplate } from "../../core/src";

// Shared Navigation Header Component
export function NavHeader(props: { currentPath: string }) {
  const { currentPath } = props;
  return html`
    <nav style="display: flex; gap: 1rem; margin-bottom: 2rem; background: #1e293b; padding: 0.75rem 1.5rem; border-radius: 9999px; border: 1px solid #334155; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
      <a id="nav-jsx" href="/jsx" style="color: ${currentPath === "/jsx" ? "#38bdf8" : "#94a3b8"}; text-decoration: none; font-weight: bold; padding: 0.5rem 1rem; border-radius: 0.5rem; background: ${currentPath === "/jsx" ? "#0f172a" : "transparent"};">⚛️ JSX: Thermostat</a>
      <a id="nav-tsx" href="/tsx" style="color: ${currentPath === "/tsx" ? "#818cf8" : "#94a3b8"}; text-decoration: none; font-weight: bold; padding: 0.5rem 1rem; border-radius: 0.5rem; background: ${currentPath === "/tsx" ? "#0f172a" : "transparent"};">📘 TSX: Task Tracker</a>
      <a id="nav-ttl" href="/ttl" style="color: ${currentPath === "/ttl" ? "#f43f5e" : "#94a3b8"}; text-decoration: none; font-weight: bold; padding: 0.5rem 1rem; border-radius: 0.5rem; background: ${currentPath === "/ttl" ? "#0f172a" : "transparent"};">🏷️ Tagged Template: Gradient Studio</a>
    </nav>
  `;
}

// Reusable Glassmorphism Card Container
export function Card(props: { title: string; subtitle?: string | LiveViewTemplate; color: string; width?: string; children: LiveViewTemplate }) {
  const { title, subtitle, color, width = "400px", children } = props;
  const subHtml = typeof subtitle === "string" ? safe(subtitle) : subtitle;

  return html`
    <div style="background: #1e293b; border: 1px solid #334155; border-radius: 1rem; padding: 2rem; width: ${width}; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
      <h2 style="margin: 0; color: ${color}; font-size: 1.5rem;">${title}</h2>
      ${subHtml ? html`<p style="color: #94a3b8; font-size: 0.875rem; margin-bottom: 1.5rem;">${subHtml}</p>` : ""}
      ${children}
    </div>
  `;
}

// Reusable Badge / Counter Pill
export function Badge(props: { label: string; bg?: string; color?: string }) {
  const { label, bg = "#312e81", color = "#c7d2fe" } = props;
  return html`
    <span style="background: ${bg}; color: ${color}; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: bold;">
      ${label}
    </span>
  `;
}

// Reusable Action Button Component with explicit type="button"
export function ActionButton(props: {
  id: string;
  phxClick: string;
  phxValueKey?: string;
  phxValueVal?: string;
  bg?: string;
  color?: string;
  style?: string;
  children: string | LiveViewTemplate;
}) {
  const { id, phxClick, phxValueKey, phxValueVal, bg = "#334155", color = "#f8fafc", style = "", children } = props;
  const phxValAttr = phxValueKey && phxValueVal ? safe(`phx-value-${phxValueKey}="${phxValueVal}"`) : "";

  return html`
    <button id="${id}" type="button" phx-click="${phxClick}" ${phxValAttr} style="background: ${bg}; color: ${color}; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: bold; ${style}">
      ${children}
    </button>
  `;
}
