import { listCities, suggest } from "./data";

describe("test cities", () => {
  it("cities list", () => {
    const cities = listCities;
    expect(cities.length).toBe(1001);
  });

  it("suggest cities by prefix", () => {
    const cities = suggest("d");
    expect(cities.length).toBe(39);
  });

  it("suggest cities by empty prefix returns empty", () => {
    const cities = suggest("");
    expect(cities.length).toBe(0);
  });
});
