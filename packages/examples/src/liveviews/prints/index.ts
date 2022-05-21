import { html, createLiveView } from "liveviewjs";
import { numberToCurrency } from "../utils";

type PhotoSize = "4x6" | "5x7" | "8x10" | "10x13" | "11x14";

const photoSizes: PhotoSize[] = ["4x6", "5x7", "8x10", "10x13", "11x14"];

export const printLiveView = createLiveView<
  {
    photoSizeIndex: number;
    photoSize: PhotoSize;
    cost: number;
  },
  { type: "update"; photoSizeIndex: string }
>({
  mount: (socket) => {
    const photoSizeIndex = 1;
    const photoSize = photoSizeByIndex(photoSizeIndex);
    const cost = calculateCost(photoSize);
    socket.assign({ photoSize, photoSizeIndex, cost });
  },

  handleEvent: (event, socket) => {
    const { photoSizeIndex } = event;
    const photoSize = photoSizeByIndex(Number(photoSizeIndex));
    const cost = calculateCost(photoSize);
    socket.assign({ photoSize, cost });
  },

  render: (context, meta) => {
    const { photoSize, photoSizeIndex, cost } = context;
    // pull apart dimensions
    const [width, _] = photoSize.split("x");
    return html`
      <h1>Photo Print Pricing</h1>
      <div id="size_cost_control">
        <h4>Size: ${photoSize}</h4>
        <h4>Cost: ${numberToCurrency(cost)}</h4>
        <p>Move the slider to see the cost of each print size</p>
        <form phx-change="update">
          <input type="hidden" name="_csrf_token" value="${meta.csrfToken}" />
          <input type="range" min="0" max="4" name="photoSizeIndex" value="${photoSizeIndex}" />
        </form>

        <img
          width="${Number(width) * 15 * 3}"
          height="${Number(width) * 15 * 2}"
          src="https://placekitten.com/2400/1200" />
      </div>
    `;
  },
});

function photoSizeByIndex(index: number): PhotoSize {
  if (index >= 0 && index < photoSizes.length) {
    return photoSizes[index];
  }
  return photoSizes[0];
}

function calculateCost(photSize: PhotoSize): number {
  switch (photSize) {
    case "4x6":
      return 10;
    case "5x7":
      return 12;
    case "8x10":
      return 15;
    case "10x13":
      return 24;
    case "11x14":
      return 36;
  }
}
