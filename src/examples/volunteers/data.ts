import { z } from 'zod';
import { nanoid } from 'nanoid';
import { updatedDiff } from 'deep-object-diff'
import { LiveViewChangeset, LiveViewChangesetErrors } from '../../server/types';

const phoneRegex = /^\d{3}[\s-.]?\d{3}[\s-.]?\d{4}$/

// Use Zod to define the schema for the Volunteer model
// More on Zod - https://github.com/colinhacks/zod
export const VolunteerSchema = z.object({
  id: z.string().default(nanoid()),
  name: z.string().min(2).max(100),
  phone: z.string().regex(phoneRegex, 'Should be a valid phone number'),
  checked_out: z.boolean().default(false),
})

// infer the Volunteer model from the Zod Schema
export type Volunteer = z.infer<typeof VolunteerSchema>;

// in memory data store
export const volunteers: Record<string, Volunteer> = {}

export const changeset = (volunteer: Partial<Volunteer>, attrs: Partial<Volunteer>, action?: string): LiveViewChangeset<Volunteer> => {
  const merged = { ...volunteer, ...attrs };
  const result = VolunteerSchema.safeParse(merged);
  let errors;
  if (result.success === false) {
    errors = result.error.issues.reduce((acc, issue) => {
      // @ts-ignore
      acc[issue.path[0]] = issue.message;
      return acc;
    }, {} as LiveViewChangesetErrors<Volunteer>)
  }
  return {
    action,
    changes: updatedDiff(volunteer, merged),
    data: result.success ? result.data : merged,
    valid: result.success,
    errors
  } as LiveViewChangeset<Volunteer>
}

export const create_volunteer = (newVolunteer: Partial<Volunteer>): LiveViewChangeset<Volunteer> => {
  const result = changeset({}, newVolunteer, 'create');
  if (result.valid) {
    const v = result.data as Volunteer;
    volunteers[v.id] = v;
  }
  return result;
}

export const update_volunteer = (volunteer: Volunteer, updated: Partial<Volunteer>): LiveViewChangeset<Volunteer> => {
  const result = changeset(volunteer, updated, 'update');
  if (result.valid) {
    const v = result.data as Volunteer;
    volunteers[v.id] = v;
  }
  return result;
}

