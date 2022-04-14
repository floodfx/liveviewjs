export type VehicleType = "gas" | "electric" | "hybrid" | "dontHave";

export const vehicleTypes: Record<VehicleType, string> = {
  gas: "🦕 Gas",
  electric: "🔌 Electric",
  hybrid: "🔋 Hybrid",
  dontHave: "🚎 Don't have",
};

export const vehicleCarbonFootprint: Record<VehicleType, number> = {
  gas: 8,
  hybrid: 4,
  electric: 1,
  dontHave: 0,
};

export type SpaceHeatingType = "gas" | "oil" | "electric" | "radiant" | "heatpump" | "other" | "notSure";

export const spaceHeatingTypes: Record<SpaceHeatingType, string> = {
  gas: "🔥 Furnace that burns gas",
  oil: "🦕 Furnace that burns fuel oil",
  electric: "🔌 Electric resistance heaters (wall or baseboard heaters)",
  radiant: "💧 Radiators or radiant floors",
  heatpump: "♨️ Heat pump",
  other: "🪵 Other",
  notSure: "🤷 Not sure",
};

export const spaceHeatingCarbonFootprint: Record<SpaceHeatingType, number> = {
  gas: 6,
  oil: 5,
  electric: 3,
  radiant: 3,
  heatpump: 1,
  other: 5,
  notSure: 5, // assume 5 is average
};

export type GridElectricityType = "grid" | "renewable" | "commSolar" | "notSure";

export const gridElectricityTypes: Record<GridElectricityType, string> = {
  grid: "🔌 Grid electricity",
  renewable: "☀️ Renewable plan from my utility",
  commSolar: "🤝 Community solar",
  notSure: "🤷 Not sure",
};

export const gridElectricityCarbonFootprint: Record<GridElectricityType, number> = {
  grid: 6,
  renewable: 2,
  commSolar: 2,
  notSure: 6, // assume 6 is average
};
