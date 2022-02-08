export interface RouteDetails {
  label: string;
  path: string;
  summary: string
  tags: string[];
}

export const routeDetails: RouteDetails[] = [
  {
    label: "Light",
    path: "/light",
    summary: "Control the brightness of a porch light using buttons.",
    tags: ["phx-click", "phx-window-keydown", "phx-key"]
  },
  {
    label: "License",
    path: "/license",
    summary: "Use a range input to calculate the licensing costs based on number of seats.",
    tags: ["phx-change"]
  },
  {
    label: "Sales Dashboard",
    path: "/sales-dashboard",
    summary: "Real-time sales metrics dashboard updating every second.",
    tags: ["server-push"]
  },
  {
    label: "Search",
    path: "/search",
    summary: "Search for businesses by zip code with live search results.",
    tags: ["phx-submit", "sendSelf"]
  },
  {
    label: "Autocomplete",
    path: "/autocomplete",
    summary: "Autocomplete by city prefix with live search results and debouncing.",
    tags: ["phx-change", "phx-submit", "phx-debounce"]
  },
  {
    label: "Pagination",
    path: "/paginate",
    summary: "Paginate a list of items with live navigation updating the list content and url params.",
    tags: ["phx-change", "push-patch"]
  },
  {
    label: "Sorting",
    path: "/sort",
    summary: "Expand on the pagination example to sort the list of items using live navigation.",
    tags: ["phx-change", "phx-click", "push-patch"]
  },
  {
    label: "Servers",
    path: "/servers",
    summary: "Navigate between servers using live navigation updating the url params along with the content.",
    tags: ["live-patch"]
  },
  {
    label: "Volunteers",
    path: "/volunteers",
    summary: "Simulate signing up for a volunteer event.",
    tags: ["phx-submit", "phx-change", "phx-update", "phx-feedback-for", "phx-debounce"]
  }
]