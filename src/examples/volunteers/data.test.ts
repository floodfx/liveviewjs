
import { Volunteer, VolunteerSchema } from './data';

describe("test volunteers", () => {
  it("valid volunteer", () => {
    const volunteer = {
      id: '1',
      name: 'John Doe',
      phone: '123-456-7890',
      checked_out: false
    } as Volunteer;
    expect(VolunteerSchema.safeParse(volunteer).success).toBe(true);
  });

  it("invalid volunteer, name too short", () => {
    const volunteer = {
      id: '1',
      name: 'J',
      phone: '123-456-7890',
      checked_out: false
    } as Volunteer;
    const result = VolunteerSchema.safeParse(volunteer);
    expect(result.success).toBe(false);
    if (result.success === false) {
      const formatted = result.error.format();
      expect(result.error.isEmpty).toBe(false);
      expect(result.error.issues.length).toBe(1);
      expect(result.error.issues[0].message).toBe('Should be at least 2 characters');
    }
  });

  it("invalid volunteer, phone invalid", () => {
    const volunteer = {
      id: '1',
      name: 'John Doe',
      phone: '123',
      checked_out: false
    } as Volunteer;
    const result = VolunteerSchema.safeParse(volunteer);
    expect(result.success).toBe(false);
    if (result.success === false) {
      expect(result.error.isEmpty).toBe(false);
      expect(result.error.issues.length).toBe(1);
      expect(result.error.issues[0].message).toBe('Should be a valid phone number');
    }
  });

  it("valid volunteer, default id, checkout out", () => {
    const volunteer = {
      name: 'Jane Doe',
      phone: '123-456-7890',
    } as Volunteer;
    const result = VolunteerSchema.safeParse(volunteer);
    expect(result.success).toBe(true);
  });

  it("invalid volunteer, phone and name invalid", () => {
    const volunteer = {
      name: 'J',
      phone: '123',
    } as Volunteer;
    const result = VolunteerSchema.safeParse(volunteer);
    expect(result.success).toBe(false);
    if (result.success === false) {
      expect(result.error.isEmpty).toBe(false);
      expect(result.error.issues.length).toBe(2);
      const formatted = result.error.format();
      expect(formatted.name).not.toBeUndefined()
      expect(formatted.phone).not.toBeUndefined()
    }
  });

});