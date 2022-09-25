import { createLiveView, html, live_patch } from "liveviewjs";
import { listServers, Server } from "./data";

export const serversLiveView = createLiveView<
  // Define LiveView Context / State
  {
    servers: Server[];
    selectedServer: Server;
  },
  // Define LiveView External Events
  { type: "select"; id: string }
>({
  mount: (socket) => {
    const servers = listServers();
    const selectedServer = servers[0];

    socket.assign({
      servers,
      selectedServer,
    });
  },

  handleParams: (url, socket) => {
    const servers = listServers();
    const serverId = url.searchParams.get("id");
    const selectedServer = servers.find((server) => server.id === serverId) || servers[0];
    socket.pageTitle(selectedServer.name);
    socket.assign({
      servers,
      selectedServer,
    });
  },

  render: (context) => {
    const { servers, selectedServer } = context;
    return html`
      <h1>Servers</h1>
      <div id="servers">
        <div class="sidebar">
          <nav>
            ${servers.map((server) => {
              return live_patch(link_body(server, server.id === selectedServer.id), {
                to: { path: "/servers", params: { id: server.id } },
                className: server.id === selectedServer.id ? "selected" : "",
              });
            })}
          </nav>
        </div>
        <div class="main">
          <div class="wrapper">
            <div class="card">
              <div class="header">
                <h2>${selectedServer.name}</h2>
                <span class="${selectedServer.status}"> ${selectedServer.status} </span>
              </div>
              <div class="body">
                <div class="row">
                  <div class="deploys">
                    🚀
                    <span> ${selectedServer.deploy_count} deploys </span>
                  </div>
                  <span> ${selectedServer.size} MB </span>
                  <span> ${selectedServer.framework} </span>
                </div>
                <h3>Git Repo</h3>
                <div class="repo">${selectedServer.git_repo}</div>
                <h3>Last Commit</h3>
                <div class="commit">${selectedServer.last_commit_id}</div>
                <blockquote>${selectedServer.last_commit_message}</blockquote>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },
});

function link_body(server: Server, selected: boolean) {
  return html`<button style="margin-left: 12px; background-color: ${selected ? "blue" : "gray"}">
    🤖 ${server.name}
  </button>`;
}
