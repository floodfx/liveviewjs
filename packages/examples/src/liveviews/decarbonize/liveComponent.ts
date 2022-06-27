import { createLiveComponent, html } from "liveviewjs";
import { FootprintData, FootprintUpdateInfo } from ".";
import {
  gridElectricityCO2Tons,
  GridElectricityType,
  gridElectricityTypeLabels,
  gridElectricityTypeValues,
  spaceHeatingCO2Tons,
  SpaceHeatingType,
  spaceHeatingTypeLabels,
  spaceHeatingTypeValues,
  vehicleCO2Tons,
  VehicleType,
  vehicleTypeLabels,
  vehicleTypeValues,
} from "./data";

/**
 * "Stateful" `LiveComponet` that calculates the tons of CO2 based on the type of
 * vehicle, space heating and grid electricity.
 *
 * "Stateful" means that it has an "id" attribute which allows it to keep track of it's local state
 * and receive events from user input and handle them in "handleEvent" function.
 *
 */
export const calcLiveComponent = createLiveComponent<
  {
    vehicle: VehicleType;
    spaceHeating: SpaceHeatingType;
    gridElectricity: GridElectricityType;
  },
  {
    type: "calculate";
    vehicle: VehicleType;
    spaceHeating: SpaceHeatingType;
    gridElectricity: GridElectricityType;
  },
  FootprintUpdateInfo
>({
  handleEvent(event, socket) {
    const { vehicle, spaceHeating, gridElectricity } = event;
    // calculate footprint
    const vTons = vehicleCO2Tons[vehicle];
    const shTons = spaceHeatingCO2Tons[spaceHeating];
    const geTons = gridElectricityCO2Tons[gridElectricity];

    const footprintData: FootprintData = {
      vehicleCO2Tons: vTons,
      spaceHeatingCO2Tons: shTons,
      gridElectricityCO2Tons: geTons,
    };

    // send parent the new state
    socket.sendParentInfo({ type: "update", footprintData });

    // update context
    socket.assign({
      vehicle,
      spaceHeating,
      gridElectricity,
    });
  },

  render: (context, meta) => {
    const { vehicle, spaceHeating, gridElectricity } = context;
    const { myself } = meta;
    return html`
      <div id="calc_${myself}">
        <form phx-change="calculate" phx-target="${myself}">
          <div>
            <label>Vehicle</label>
            <select name="vehicle" autocomplete="off">
              <option disabled>Select</option>
              ${vehicleTypeValues.map((type) => {
                const selected = type === vehicle ? "selected" : "";
                return html`<option value="${type}" ${selected}>${vehicleTypeLabels[type]}</option>`;
              })}
            </select>
          </div>

          <div>
            <label>Space Heating</label>
            <select name="spaceHeating" autocomplete="off">
              <option disabled>Select</option>
              ${spaceHeatingTypeValues.map((type) => {
                const selected = type === spaceHeating ? "selected" : "";
                return html`<option value="${type}" ${selected}>${spaceHeatingTypeLabels[type]}</option>`;
              })}
            </select>
          </div>

          <div>
            <label>Grid Electricity Source</label>
            <select name="gridElectricity" autocomplete="off">
              <option disabled>Select</option>
              ${gridElectricityTypeValues.map((type) => {
                const selected = type === gridElectricity ? "selected" : "";
                return html`<option value="${type}" ${selected}>${gridElectricityTypeLabels[type]}</option>`;
              })}
            </select>
          </div>
        </form>
      </div>
    `;
  },
});

/**
 * "Stateless" `LiveComponent` which shows the carbon footprint based on the
 * provided data.
 */
export const footprintLiveComponent = createLiveComponent<{ data?: FootprintData }>({
  render: (context) => {
    const { data } = context;
    if (!data) {
      return html``;
    }
    const { vehicleCO2Tons, spaceHeatingCO2Tons, gridElectricityCO2Tons } = data;
    const totalCO2Tons = vehicleCO2Tons + spaceHeatingCO2Tons + gridElectricityCO2Tons;
    return html`
      <div>
        <h3>Carbon Footprint 👣</h3>
        <p>${totalCO2Tons} tons of CO2</p>
      </div>
    `;
  },
});
