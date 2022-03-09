import { BaseLiveComponent, html, LiveComponentMeta, LiveComponentSocket, LiveViewTemplate } from "../../server";

type VehicleType = "gas" | "electric" | "hybrid" | "dontHave";

const vehicleTypes: Record<VehicleType, string> = {
  gas: "🦕 Gas",
  electric: "🔌 Electric",
  hybrid: "🔋 Hybrid",
  dontHave: "🚎 Don't have"
}

const vehicleCarbonFootprint: Record<VehicleType, number> = {
  gas: 8,
  hybrid: 4,
  electric: 1,
  dontHave: 0
}

type SpaceHeatingType = "gas" | "oil" | "electric" | "radiant" | "heatpump" | "other" | "notSure";

const spaceHeatingTypes: Record<SpaceHeatingType, string> = {
  gas: "🔥 Furnace that burns gas",
  oil: "🦕 Furnace that burns fuel oil",
  electric: "🔌 Electric resistance heaters (wall or baseboard heaters)",
  radiant: "💧 Radiators or radiant floors",
  heatpump: "♨️ Heat pump",
  other: "🪵 Other",
  notSure: "🤷 Not sure"
}

const spaceHeatingCarbonFootprint: Record<SpaceHeatingType, number> = {
  gas: 6,
  oil: 5,
  electric: 3,
  radiant: 3,
  heatpump: 1,
  other: 5,
  notSure: 5 // assume 5 is average
}

type GridElectricityType = "grid" | "renewable" | "commSolar" | "notSure";

const gridElectricityTypes: Record<GridElectricityType, string> = {
  grid: "🔌 Grid electricity",
  renewable: "☀️ Renewable plan from my utility",
  commSolar: "🤝 Community solar",
  notSure: "🤷 Not sure"
}

const gridElectricityCarbonFootprint: Record<GridElectricityType, number> = {
  grid: 6,
  renewable: 2,
  commSolar: 2,
  notSure: 6 // assume 6 is average
}

export interface DecarboinizeCalculatorContext {
  vehicle1: VehicleType;
  vehicle2: VehicleType;
  spaceHeating: SpaceHeatingType;
  gridElectricity: GridElectricityType;
  carbonFootprintTons: number;
}

export class DecarboinizeCalculator extends BaseLiveComponent<DecarboinizeCalculatorContext> {

  render(context: DecarboinizeCalculatorContext, meta: LiveComponentMeta): LiveViewTemplate {
    const { vehicle1, vehicle2, spaceHeating, gridElectricity, carbonFootprintTons } = context;
    const { myself } = meta;
    return html`
      <div id="calc_${myself}">
        <form phx-change="calculate" phx-target="${myself}">

          <div>
            <label>Vehicle 1</label>
            <select name="vehicle1" autocomplete="off">
              <option>Select</option>
              ${Object.keys(vehicleTypes).map(vehicle => html`<option value="${vehicle}" ${vehicle1 === vehicle ? "selected" : ""}>${vehicleTypes[vehicle as VehicleType]}</option>`)}
            </select>
          </div>

          <div>
            <label>Vehicle 2</label>
            <select name="vehicle2" autocomplete="off">
              <option>Select</option>
              ${Object.keys(vehicleTypes).map(vehicle => html`<option value="${vehicle}" ${vehicle2 === vehicle ? "selected" : ""}>${vehicleTypes[vehicle as VehicleType]}</option>`)}
            </select>
          </div>

          <div>
            <label>Space Heating</label>
            <select name="spaceHeating" autocomplete="off">
              <option>Select</option>
              ${Object.keys(spaceHeatingTypes).map(sh => html`<option value="${sh}" ${spaceHeating === sh ? "selected" : ""}>${spaceHeatingTypes[sh as SpaceHeatingType]}</option>`)}
            </select>
          </div>

          <div>
            <label>Grid Electricity Source</label>
            <select name="gridElectricity" autocomplete="off" value="${gridElectricity}">
              <option>Select</option>
              ${Object.keys(gridElectricityTypes).map(grid => html`<option value="${grid}" ${gridElectricity === grid ? "selected" : ""}>${gridElectricityTypes[grid as GridElectricityType]}</option>`)}
            </select>
          </div>

        </form>

        ${carbonFootprintTons > 0 ? this.renderFootprint(carbonFootprintTons, myself || 0) : ""}

      </div>
    `;
  }

  renderFootprint(carbonFootprintTons: number, myself: number) {
    return html`
      <div id="footprint_${myself}">
        <h3>Carbon Footprint 👣</h3>
        <p>${carbonFootprintTons} tons of CO2</p>
      </div>
    `;
  }

  handleEvent(event: string, params: Record<string, string>, socket: LiveComponentSocket<DecarboinizeCalculatorContext>): Partial<DecarboinizeCalculatorContext> {

      // calculate footprint
      const { vehicle1, vehicle2, spaceHeating, gridElectricity} = params;
      const v1Tons = vehicleCarbonFootprint[vehicle1 as VehicleType];
      const v2Tons = vehicleCarbonFootprint[vehicle2 as VehicleType];
      const shTons = spaceHeatingCarbonFootprint[spaceHeating as SpaceHeatingType];
      const geTons = gridElectricityCarbonFootprint[gridElectricity as GridElectricityType];

      const carbonFootprintTons = v1Tons + v2Tons + shTons + geTons;
      return {
        ...params,
        carbonFootprintTons
      };
  }

}