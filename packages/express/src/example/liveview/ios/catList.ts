import { createLiveView, html } from "liveviewjs";
import { cats, favorites } from "./data";

// LiveView Native Tutorial -
// https://liveviewnative.github.io/liveview-client-swiftui/tutorials/phoenixliveviewnative/01-initial-list/
export const catListLive = createLiveView({
  mount: (socket) => {
    socket.assign({ cats });
  },
  handleEvent: (event, socket) => {
    console.log("event", event);
    switch (event.type) {
      case "toggle-favorite":
        favorites[event.name] = !favorites[event.name];
        break;
    }
  },
  render: (_, meta) => {
    return html` <list navigation-title="Cats!">
      ${cats.map((cat) => {
        return html`
          <navigationlink
            id="${cat}"
            data-phx-link="redirect"
            data-phx-link-state="push"
            data-phx-href="${buildHref({ to: { path: "/cats/" + cat } })}">
            <hstack>
              <asyncimage src="/images/cats/${cat}.jpg" frame-width="100" frame-height="100" />
              <text>${cat}</text>
              <spacer />
              <button phx-click="toggle-favorite" phx-value-name=${cat}>
                <image
                  system-name=${favorites[cat] ? "star.fill" : "star"}
                  symbol-color=${favorites[cat] ? "#f3c51a" : "#000000"} />
              </button>
            </hstack>
          </navigationlink>
        `;
      })}
    </list>`;
  },
});

function buildHref(options: {
  to: {
    path: string;
    params?: Record<string, string>;
  };
}) {
  const { path, params } = options.to;
  const urlParams = new URLSearchParams(params);
  if (urlParams.toString().length > 0) {
    return `${path}?${urlParams.toString()}`;
  } else {
    return path;
  }
}
