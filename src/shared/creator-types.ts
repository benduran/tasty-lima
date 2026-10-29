import { z } from 'zod';
import { LimaPortForwardSchema, LimaYAMLSchema } from './limactl-types.gen.ts';

/**
 * Schemas for the LimaYAML a VM creator sends to `limactl create`, layered on
 * the generated schemas in limactl-types.gen.ts. The generated file describes
 * the JSON `limactl list --json` writes back out, and the two shapes match
 * everywhere except port-forward ranges: input omits them for single ports,
 * but encoding/json always writes the [2]int arrays, so the generated schema
 * has them required.
 *
 * Two conventions keep a draft valid input without more types here:
 * - emit the expanded object form lima accepts, never its plain-string
 *   shorthands (`base: 'template:_images/ubuntu'`,
 *   `additionalDisks: ['data']`, `provision[].file: 'https://example.sh'`)
 * - an omitted key means lima fills in its default, so `{}` is a valid
 *   starting draft
 */

/**
 * A port forward as `limactl create` reads it: the ranges are optional and
 * left off for single-port forwards.
 */
export const PortForwardInputSchema = LimaPortForwardSchema.extend({
  guestPortRange: z.tuple([z.int(), z.int()]).optional(),
  hostPortRange: z.tuple([z.int(), z.int()]).optional(),
});

/**
 * A LimaYAML that `limactl create` accepts: the generated LimaYAML with only
 * the port-forward ranges relaxed.
 */
export const LimaYAMLInputSchema = LimaYAMLSchema.extend({
  portForwards: z.array(PortForwardInputSchema).optional(),
});
export type LimaYAMLInput = z.infer<typeof LimaYAMLInputSchema>;
