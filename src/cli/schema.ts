import { z } from 'zod';

export const CLIArgsSchema = z.object({
  hostname: z.hostname(),
  noUI: z.boolean(),
  port: z.number().min(1).max(65_535),
});
export type CLIArgs = z.infer<typeof CLIArgsSchema>;
