import { SessionData } from "express-session";
import { BaseLiveView, html, LiveViewContext, LiveViewMountParams, LiveViewSocket, LiveViewTemplate, live_patch } from "../../server";
import { listServers, Server } from "./data";

// Example of Phoenix "Live Navigation"

export interface ServersContext extends LiveViewContext {
  servers: Server[]
  selectedServer: Server
}

export class ServersLiveViewComponent extends BaseLiveView<ServersContext, { id: string }> {


  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<ServersContext>) {
    const servers = listServers();
    const selectedServer = servers[0];

    socket.assign({
      servers,
      selectedServer
    })
  }

  handleParams(params: { id: string; }, url: string, socket: LiveViewSocket<ServersContext>) {
    const servers = listServers();
    const selectedServer = servers.find(server => server.id === params.id) || servers[0];
    socket.pageTitle(selectedServer.name);
    socket.assign({
      servers,
      selectedServer
    })
  }

  render(context: ServersContext): LiveViewTemplate {
    const { servers, selectedServer } = context;
    return html`
    <h1>Servers</h1>
    <div id="servers">
      <div class="sidebar">
        <nav>
          ${servers.map(server => {
      return live_patch(this.link_body(server), { to: { path: "/servers", params: { id: server.id } }, className: server.id === selectedServer.id ? "selected" : "" })
    })}
        </nav>
      </div>
      <div class="main">
        <div class="wrapper">
          <div class="card">
            <div class="header">
              <h2>${selectedServer.name}</h2>
              <span class="${selectedServer.status}">
                ${selectedServer.status}
              </span>
            </div>
            <div class="body">
              <div class="row">
                <div class="deploys">
                  🚀
                  <span>
                    ${selectedServer.deploy_count} deploys
                  </span>
                </div>
                <span>
                  ${selectedServer.size} MB
                </span>
                <span>
                  ${selectedServer.framework}
                </span>
              </div>
              <h3>Git Repo</h3>
              <div class="repo">
                ${selectedServer.git_repo}
              </div>
              <h3>Last Commit</h3>
              <div class="commit">
                ${selectedServer.last_commit_id}
              </div>
              <blockquote>
                ${selectedServer.last_commit_message}
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </div>
    `
  }

  private link_body(server: Server) {
    return html`
      <button>🤖 ${server.name}</button>
    `
  }

}
