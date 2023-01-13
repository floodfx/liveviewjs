import { createLiveView, html } from "liveviewjs";
import { favorites, scores } from "./data";

type CatCtx = {
  cat: string;
  fav: boolean;
  score: number;
};

type CatEvent =
  | {
      type: "change-score";
      value: number;
    }
  | {
      type: "toggle-favorite";
    };

// LiveView Native Tutorial -
// https://liveviewnative.github.io/liveview-client-swiftui/tutorials/phoenixliveviewnative/01-initial-list/
export const catLive = createLiveView<CatCtx, CatEvent>({
  mount: (socket, _, params) => {
    console.log("params", params);
    const cat = params.cat as string;
    const fav = favorites[cat] ?? false;
    const score = scores[cat] ?? 0;
    socket.assign({ cat, fav, score });
  },
  handleEvent: (event, socket) => {
    console.log("event", event);
    switch (event.type) {
      case "change-score":
        scores.cat = event.value;
        socket.assign({ score: event.value });
        break;
      case "toggle-favorite":
        favorites.cat = !favorites.cat;
        socket.assign({ fav: favorites.cat });
        break;
    }
  },
  render: (ctx) => {
    const { cat, fav, score } = ctx;
    return html`
      <vstack navigation-title="${cat}" nav-favorite="${fav}">
        <asyncimage src="/images/cats/${cat}.jpg" frame='{"width": 300, "height": 300}' />
        <cat-rating score="${score}" />
      </vstack>
    `;
  },
});
