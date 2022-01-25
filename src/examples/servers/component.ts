import html from "../../server/templates";
import { LiveViewComponent, LiveViewContext, LiveViewExternalEventListener, LiveViewParamsHandler, LiveViewTemplate } from "../../server/types";
import { PhxSocket } from "../../server/socket/types";
import { WebSocket } from "ws";
import { listServers, Server } from "./data";
import { live_patch } from "../../server/templates/helpers/live_patch";

// Example of Phoenix "Live Navigation"

export interface ServersContext {
  servers: Server[]
  selectedServer: Server
}

const idToWs = new Map<string, WebSocket>();

export class ServersLiveViewComponent implements
  LiveViewComponent<ServersContext>,
  LiveViewParamsHandler<ServersContext, { id: string }> {


  mount(params: any, session: any, socket: PhxSocket): LiveViewContext<ServersContext> {
    const servers = listServers();
    const selectedServer = servers[0];
    return { data: { servers, selectedServer } };
  }

  handleParams(params: { id: string; }, url: string, socket: PhxSocket): LiveViewContext<ServersContext> {
    console.log("params", params);
    const servers = listServers();
    const selectedServer = servers.find(server => server.id === params.id) || servers[0];
    return { data: { servers, selectedServer } };
  }

  render(context: LiveViewContext<ServersContext>): LiveViewTemplate {
    const { servers, selectedServer } = context.data;
    console.log("rendering servers", servers, selectedServer);
    return html`
    <h1>Servers</h1>
    <div id="servers">
      <div class="sidebar">
        <nav>
          ${servers.map(server => {
      return live_patch(this.link_body(server), { to: { path: "/servers", params: { id: server.id } }, class: server.id === selectedServer.id ? "selected" : "" })
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
      🤖 ${server.name}
    `
  }

}
