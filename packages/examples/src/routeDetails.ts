export interface RouteDetails {
  label: string;
  path: string;
  gitPath?: string;
  summary: string;
  tags: string[];
}

export const routeDetails: RouteDetails[] = [
  {
    label: "Counter",
    path: "/counter",
    summary: 'Standard "hello world" example.',
    tags: ["phx-click"],
  },
  {
    label: "Volume",
    path: "/volume",
    summary: "Control the volume using buttons or keys.",
    tags: ["phx-click", "phx-window-keydown", "phx-key", "flash"],
  },
  {
    label: "Prints",
    path: "/prints",
    summary: "Use a range input to calculate price of printing a photo of a cat.",
    tags: ["phx-change"],
  },
  {
    label: "Dashboard",
    path: "/dashboard",
    summary: "Real-time dashboard showing live order metrics updating every second.",
    tags: ["server-push"],
  },
  {
    label: "Search",
    path: "/search",
    gitPath: "/liveSearch",
    summary: "Search for businesses by zip code with live search results.",
    tags: ["phx-submit", "sendSelf"],
  },
  {
    label: "Autocomplete",
    path: "/autocomplete",
    gitPath: "/autoComplete",
    summary: "Autocomplete by city prefix with live search results and debouncing.",
    tags: ["phx-change", "phx-submit", "phx-debounce"],
  },
  {
    label: "Pagination",
    path: "/paginate",
    gitPath: "/pagination",
    summary: "Paginate a list of items with live navigation updating the list content and url params.",
    tags: ["phx-change", "push-patch"],
  },
  {
    label: "Sorting",
    path: "/sort",
    gitPath: "/sorting",
    summary: "Expand on the pagination example to sort the list of items using live navigation.",
    tags: ["phx-change", "phx-click", "push-patch"],
  },
  {
    label: "Servers",
    path: "/servers",
    summary: "Navigate between servers using live navigation updating the url params along with the content.",
    tags: ["live-patch"],
  },
  {
    label: "Volunteers",
    path: "/volunteers",
    summary: "Simulate signing up for a volunteer event.",
    tags: ["phx-submit", "phx-change", "phx-update", "phx-feedback-for", "phx-debounce"],
  },
  // {
  //   label: "AsyncFetch",
  //   path: "/asyncfetch",
  //   summary: "Example of using async fetch to fetch data from a server.  In this case, Xkcd comic data.",
  //   tags: ["live-patch", "async/await"],
  // },
  {
    label: "Decarbonize Calculator",
    path: "/decarbonize",
    summary: "Example of LiveComponents within a LiveView",
    tags: ["live_component"],
  },
  {
    label: "JS Commands",
    path: "/jscmds",
    summary: "Example of using JS commands to update the DOM",
    tags: ["js-cmds"],
  },
];
