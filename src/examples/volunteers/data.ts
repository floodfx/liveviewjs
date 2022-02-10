import { z } from 'zod';
import { nanoid } from 'nanoid';
import { LiveViewChangeset } from '../../server/component/types';
import { newChangesetFactory } from '../../server/component/changeset';

const phoneRegex = /^\d{3}[\s-.]?\d{3}[\s-.]?\d{4}$/

// Use Zod to define the schema for the Volunteer model
// More on Zod - https://github.com/colinhacks/zod
export const VolunteerSchema = z.object({
  id: z.string().default(nanoid),
  name: z.string().min(2).max(100),
  phone: z.string().regex(phoneRegex, 'Should be a valid phone number'),
  checked_out: z.boolean().default(false),
})

// infer the Volunteer model from the Zod Schema
export type Volunteer = z.infer<typeof VolunteerSchema>;

// in memory data store
const volunteers: Record<string, Volunteer> = {}

export const listVolunteers = (): Volunteer[] => {
  return Object.values(volunteers)
}

export const getVolunteer = (id: string): Volunteer | undefined => {
  return volunteers[id]
}

export const changeset = newChangesetFactory<Volunteer>(VolunteerSchema)

export const createVolunteer = (newVolunteer: Partial<Volunteer>): LiveViewChangeset<Volunteer> => {
  const result = changeset({}, newVolunteer, 'create');
  if (result.valid) {
    const v = result.data as Volunteer;
    volunteers[v.id] = v;
  }
  return result;
}

export const updateVolunteer = (volunteer: Volunteer, updated: Partial<Volunteer>): LiveViewChangeset<Volunteer> => {
  const result = changeset(volunteer, updated, 'update');
  if (result.valid) {
    const v = result.data as Volunteer;
    volunteers[v.id] = v;
  }
  return result;
}

