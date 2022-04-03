import {
  changeset,
  createVolunteer,
  getVolunteer,
  listVolunteers,
  updateVolunteer,
  Volunteer,
  VolunteerSchema,
} from "./data";

describe("test volunteers", () => {
  it("valid volunteer", () => {
    const volunteer = {
      id: "1",
      name: "John Doe",
      phone: "123-456-7890",
      checked_out: false,
    } as Volunteer;
    expect(VolunteerSchema.safeParse(volunteer).success).toBe(true);
  });

  it("invalid volunteer, name too short", () => {
    const volunteer = {
      id: "1",
      name: "J",
      phone: "123-456-7890",
      checked_out: false,
    } as Volunteer;
    const result = VolunteerSchema.safeParse(volunteer);
    expect(result.success).toBe(false);
    if (result.success === false) {
      const formatted = result.error.format();
      expect(result.error.isEmpty).toBe(false);
      expect(result.error.issues.length).toBe(1);
      expect(result.error.issues[0].message).toBe("Should be at least 2 characters");
    }
  });

  it("invalid volunteer, phone invalid", () => {
    const volunteer = {
      id: "1",
      name: "John Doe",
      phone: "123",
      checked_out: false,
    } as Volunteer;
    const result = VolunteerSchema.safeParse(volunteer);
    expect(result.success).toBe(false);
    if (result.success === false) {
      expect(result.error.isEmpty).toBe(false);
      expect(result.error.issues.length).toBe(1);
      expect(result.error.issues[0].message).toBe("Should be a valid phone number");
    }
  });

  it("valid volunteer, default id, checkout out", () => {
    const volunteer = {
      name: "Jane Doe",
      phone: "123-456-7890",
    } as Volunteer;
    const result = VolunteerSchema.safeParse(volunteer);
    expect(result.success).toBe(true);
  });

  it("invalid volunteer, phone and name invalid", () => {
    const volunteer = {
      name: "J",
      phone: "123",
    } as Volunteer;
    const result = VolunteerSchema.safeParse(volunteer);
    expect(result.success).toBe(false);
    if (result.success === false) {
      expect(result.error.isEmpty).toBe(false);
      expect(result.error.issues.length).toBe(2);
      const formatted = result.error.format();
      expect(formatted.name).not.toBeUndefined();
      expect(formatted.phone).not.toBeUndefined();
    }
  });

  it("createVolunteer with valid volunteer updates in memory list", () => {
    const numVolunteers = listVolunteers().length;
    const createChangeset = createVolunteer({ name: "Jane Doe", phone: "123-456-7890" });
    expect(createChangeset.valid).toBe(true);
    expect(listVolunteers().length).toBe(numVolunteers + 1);
    expect(listVolunteers()[0].name).toBe("Jane Doe");
    expect(listVolunteers()[0].phone).toBe("123-456-7890");
    const v = getVolunteer(createChangeset.data.id!);
    expect(v!.name).toBe("Jane Doe");
    expect(v!.phone).toBe("123-456-7890");
  });

  it("createVolunteer with invalid volunteer does not update in memeory list", () => {
    const numVolunteers = listVolunteers().length;
    const createChangeset = createVolunteer({ name: "J", phone: "123-456-7890" });
    expect(createChangeset.valid).toBe(false);
    expect(listVolunteers().length).toBe(numVolunteers);
  });

  it("update with valid volunteer updates in memory list", () => {
    const numVolunteers = listVolunteers().length;
    const createChangeset = createVolunteer({ name: "Jane Doe", phone: "123-456-7890" });
    expect(createChangeset.valid).toBe(true);
    expect(listVolunteers().length).toBe(numVolunteers + 1);

    const v = getVolunteer(createChangeset.data.id!);
    expect(v!.checked_out).toBe(false);

    const updateChangeset = updateVolunteer(v!, { checked_out: true });
    expect(updateChangeset.valid).toBe(true);

    const v2 = getVolunteer(createChangeset.data.id!);
    expect(v2!.checked_out).toBe(true);
  });

  it("updateVolunteer with invalid volunteer does not update in memeory list", () => {
    const numVolunteers = listVolunteers().length;
    const createChangeset = createVolunteer({ name: "Jane Doe", phone: "123-456-7890" });
    expect(createChangeset.valid).toBe(true);
    expect(listVolunteers().length).toBe(numVolunteers + 1);

    const v = getVolunteer(createChangeset.data.id!);
    expect(v!.name).toBe("Jane Doe");

    const updateChangeset = updateVolunteer(v!, { name: "J" });
    expect(updateChangeset.valid).toBe(false);

    const v2 = getVolunteer(createChangeset.data.id!);
    expect(v2!.name).toBe("Jane Doe");
  });

  it("valid changeset returns undefined errors", () => {
    const cs = changeset({}, { name: "Jane Doe", phone: "123-456-7890" });
    expect(cs.valid).toBe(true);
    expect(cs.errors).toBeUndefined();
  });

  it("invalid changeset returns errors", () => {
    const cs = changeset({}, { name: "", phone: "123-456-7890" });
    expect(cs.valid).toBe(false);
    expect(cs.errors!.name).not.toBeUndefined();
  });
});
