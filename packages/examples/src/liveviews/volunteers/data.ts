import { nanoid } from "nanoid";
import { z } from "zod";
import { LiveViewChangeset, newChangesetFactory, SingleProcessPubSub } from "liveviewjs";

const phoneRegex = /^\d{3}[\s-.]?\d{3}[\s-.]?\d{4}$/;

// Use Zod to define the schema for the Volunteer model
// More on Zod - https://github.com/colinhacks/zod
export const VolunteerSchema = z.object({
  id: z.string().default(nanoid),
  name: z.string().min(2).max(100),
  phone: z.string().regex(phoneRegex, "Should be a valid phone number"),
  checked_out: z.boolean().default(false),
});

// infer the Volunteer model from the Zod Schema
export type Volunteer = z.infer<typeof VolunteerSchema>;

// in memory data store
const volunteers: Record<string, Volunteer> = {};

export const listVolunteers = (): Volunteer[] => {
  return Object.values(volunteers);
};

export const getVolunteer = (id: string): Volunteer | undefined => {
  return volunteers[id];
};

export const changeset = newChangesetFactory<Volunteer>(VolunteerSchema);

export const createVolunteer = (newVolunteer: Partial<Volunteer>): LiveViewChangeset<Volunteer> => {
  const result = changeset({}, newVolunteer, "create");
  if (result.valid) {
    const volunteer = result.data as Volunteer;
    volunteers[volunteer.id] = volunteer;
    broadcast({ type: "created", volunteer });
  }
  return result;
};

export const updateVolunteer = (
  currentVolunteer: Volunteer,
  updated: Partial<Volunteer>
): LiveViewChangeset<Volunteer> => {
  const result = changeset(currentVolunteer, updated, "update");
  if (result.valid) {
    const volunteer = result.data as Volunteer;
    volunteers[volunteer.id] = volunteer;
    broadcast({ type: "updated", volunteer });
  }
  return result;
};

const pubSub = new SingleProcessPubSub();
function broadcast(event: VolunteerMutationInfo) {
  pubSub.broadcast("volunteer", event);
}

export type VolunteerMutationInfo =
  | { type: "created"; volunteer: Volunteer }
  | { type: "updated"; volunteer: Volunteer };
