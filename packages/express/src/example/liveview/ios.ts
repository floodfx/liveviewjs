import { createLiveView, html } from "liveviewjs";

// LiveView Native Tutorial -
// https://liveviewnative.github.io/liveview-client-swiftui/tutorials/phoenixliveviewnative/01-initial-list/
export const iosLiveView = createLiveView({
  mount: (socket) => {
    socket.assign({ cats });
  },
  handleEvent: (event, socket) => {
    console.log("event", event);
    switch (event.type) {
      case "toggle-favorite":
        favorites[event.name as Cat] = !favorites[event.name as Cat];
        break;
    }
  },
  render: (ctx) => {
    return html` <list>
      ${cats.map((cat) => {
        return html`
          <hstack id=${cat}>
            <asyncimage src="/images/cats/${cat}.jpg" frame-width="100" frame-height="100" />
            <text>${cat}</text>
            <spacer />
            <button phx-click="toggle-favorite" phx-value-name=${cat}>
              <image
                system-name=${favorites[cat] ? "star.fill" : "star"}
                symbol-color=${favorites[cat] ? "#f3c51a" : "#000000"} />
            </button>
          </hstack>
        `;
      })}
    </list>`;
  },
});

const cats = [
  "Clenil",
  "Flippers",
  "Jorts",
  "Kipper",
  "Lemmy",
  "Lissy",
  "Mikkel",
  "Minka",
  "Misty",
  "Nelly",
  "Ninj",
  "Pollito",
  "Siegfried",
  "Truman",
  "Washy",
] as const;

type Cat = typeof cats[number];

const favorites = {} as Record<Cat, boolean>;
