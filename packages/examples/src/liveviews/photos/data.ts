import { newChangesetFactory } from "liveviewjs";
import { nanoid } from "nanoid";
import { z } from "zod";

export const PhotoSchema = z.object({
  id: z.string().default(nanoid),
  name: z.string().optional(),
  url: z.string().optional(),
});

export type Photo = z.infer<typeof PhotoSchema>;

export const changeset = newChangesetFactory<Photo>(PhotoSchema);
