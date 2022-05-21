// These numbers are completely made up!

export const vehicleTypeValues = ["gas", "electric", "hybrid", "dontHave"] as const;

export type VehicleType = typeof vehicleTypeValues[number];

export const vehicleTypeLabels: Record<VehicleType, string> = {
  gas: "🦕 Gas",
  electric: "🔌 Electric",
  hybrid: "🔋 Hybrid",
  dontHave: "🚎 Don't have",
};

export const vehicleCO2Tons: Record<VehicleType, number> = {
  gas: 8,
  hybrid: 4,
  electric: 1,
  dontHave: 0,
};

export const spaceHeatingTypeValues = ["gas", "oil", "electric", "heatpump", "notsure"] as const;

export type SpaceHeatingType = typeof spaceHeatingTypeValues[number];

export const spaceHeatingTypeLabels: Record<SpaceHeatingType, string> = {
  gas: "🔥 Furnace that burns gas",
  oil: "🦕 Furnace that burns fuel oil",
  electric: "🔌 Electric resistance heaters (wall or baseboard heaters)",
  heatpump: "♨️ Heat pump",
  notsure: "🤷 Not sure",
};

export const spaceHeatingCO2Tons: Record<SpaceHeatingType, number> = {
  gas: 6,
  oil: 5,
  electric: 3,
  heatpump: 1,
  notsure: 5, // assume 5 is average
};

export const gridElectricityTypeValues = ["grid", "renewable", "solar", "notsure"] as const;

export type GridElectricityType = typeof gridElectricityTypeValues[number];

export const gridElectricityTypeLabels: Record<GridElectricityType, string> = {
  grid: "🔌 Grid electricity",
  renewable: "☀️ Renewable plan from my utility",
  solar: "🤝 Community solar",
  notsure: "🤷 Not sure",
};

export const gridElectricityCO2Tons: Record<GridElectricityType, number> = {
  grid: 6,
  renewable: 2,
  solar: 2,
  notsure: 6, // assume 6 is average
};
