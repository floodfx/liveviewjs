import { listStores, searchByCity, searchByZip } from "./data";

describe("test stores", () => {
  it("stores list", () => {
    const stores = listStores();
    expect(stores.length).toBe(7);
  });

  it("stores searchByZip", () => {
    const stores = searchByZip("80204");
    expect(stores.length).toBe(4);
  });

  it("stores searchByCity", () => {
    const stores = searchByCity("Denver, CO");
    expect(stores.length).toBe(4);
  });
});
