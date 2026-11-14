import { kebabCase } from 'change-case';
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

export const PortNumberSchema = z
  .string()
  .regex(/^\d{1,5}$/, {
    error: 'please specify a port number',
  })
  .transform(Number)
  .pipe(z.int().min(1).max(65_535));
export type PortNumber = z.infer<typeof PortNumberSchema>;

export const UserNameSchema = z.string().regex(/^[a-z_][a-z0-9_-]{0,31}$/, {
  error: 'please specify a valid unix username',
});

/**
 * A port forward as `limactl create` reads it: the ranges are optional and
 * left off for single-port forwards.
 */
export const PortForwardInputSchema = LimaPortForwardSchema.extend({
  guestPortRange: z.tuple([z.int(), z.int()]).optional(),
  hostPortRange: z.tuple([z.int(), z.int()]).optional(),
});
export type PortForwardInput = z.infer<typeof PortForwardInputSchema>;

/**
 * A LimaYAML that `limactl create` accepts: the generated LimaYAML with only
 * the port-forward ranges relaxed.
 */
export const LimaYAMLInputSchema = LimaYAMLSchema.extend({
  portForwards: z.array(PortForwardInputSchema).optional(),
});
export type LimaYAMLInput = z.infer<typeof LimaYAMLInputSchema>;

export const CreateLimaVMSchema = z.object({
  config: LimaYAMLInputSchema,
  name: z.string().refine(
    val => {
      const trimmed = val.trim();
      if (!trimmed) return false;
      const changed = kebabCase(val);
      return changed === val;
    },
    { error: 'instance name must be in kebab case e.g. "my-ubuntu-vm"' },
  ),
  startAfterCreate: z.boolean(),
});
export type CreateLimaVM = z.infer<typeof CreateLimaVMSchema>;
