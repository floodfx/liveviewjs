import { z } from 'zod';
import { nanoid } from 'nanoid';
import { LiveViewChangeset, LiveViewComponent, LiveViewExternalEventListener, LiveViewInternalEventListener, LiveViewSocket } from '../../server/component/types';
import { newChangesetFactory } from '../../server/component/changeset';
import { createPubSub } from '../../server/pubsub/SingleProcessPubSub';
import { VolunteerComponent } from './component';

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

// pubsub
const volunteerPubSub = createPubSub<VolunteerData>();

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
    const volunteer = result.data as Volunteer;
    volunteers[volunteer.id] = volunteer;
    broadcast('created', volunteer);
  }
  return result;
}

export const updateVolunteer = (currentVolunteer: Volunteer, updated: Partial<Volunteer>): LiveViewChangeset<Volunteer> => {
  const result = changeset(currentVolunteer, updated, 'update');
  if (result.valid) {
    const volunteer = result.data as Volunteer;
    volunteers[volunteer.id] = volunteer;
    broadcast('updated', volunteer);
  }
  return result;
}

function broadcast(event: VolunteerEvent, volunteer: Volunteer) {
  volunteerPubSub.broadcast('volunteer', {
    event,
    volunteer,
  });
}

type VolunteerEvent = 'created' | 'updated';

export interface VolunteerData {
  event: VolunteerEvent,
  volunteer: Volunteer
}

export function subscribe(socket: LiveViewSocket<unknown>): void {
  volunteerPubSub.subscribe('volunteer', (data: VolunteerData) => {
    socket.sendInternal(data)
  });
}

