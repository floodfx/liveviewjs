import { AnyLiveEvent, createLiveView, html } from "liveviewjs";
import { calcLiveComponent, footprintLiveComponent } from "./liveComponent";

// define the info this LiveView will receive from the child LiveComponent
export type FootprintData = {
  vehicleCO2Tons: number;
  spaceHeatingCO2Tons: number;
  gridElectricityCO2Tons: number;
};

export type FootprintUpdateInfo = {
  type: "update";
  footprintData: FootprintData;
};

export const decarbLiveView = createLiveView<
  {
    footprintData?: FootprintData;
  },
  AnyLiveEvent,
  FootprintUpdateInfo
>({
  mount: (socket) => {
    socket.pageTitle("Decarbonize Calculator");
  },

  // receive the info from the stateful child LiveComponent
  handleInfo: (info, socket) => {
    const { footprintData } = info;
    socket.assign({ footprintData });
  },
  render: async (context, meta) => {
    // use the live_component helper to render a `LiveComponent`
    const { footprintData } = context;
    const { live_component } = meta;
    return html`
      <h1>Decarbonize Calculator</h1>
      <div>
        ${await live_component(calcLiveComponent, {
          vehicle: "gas",
          spaceHeating: "gas",
          gridElectricity: "grid",
          id: 1,
        })}
      </div>
      <div>
        ${await live_component(footprintLiveComponent, {
          data: footprintData,
        })}
      </div>
    `;
  },
});
