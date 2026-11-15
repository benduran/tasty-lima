import { z } from 'zod';

export const FakeFsEntrySchema = z.object({
  b64Contents: z.base64().nonempty(),
  filename: z.string().nonempty(),
  relPath: z.string().nonempty(),
});
export type FakeFsEntry = z.infer<typeof FakeFsEntrySchema>;
