# tasty-lima

A quick and easy-to-use UI for creating and interacting with Lima VMs. For more information on Lima VMs, please head to https://lima-vm.io

## Development

### Bumping the lima version

`tasty-lima` only ever runs the `limactl` version pinned by `LIMA_VERSION` in [src/cli/constants.ts](src/cli/constants.ts), and its lima types are generated from that version's source.

1. Update `LIMA_VERSION`. `pnpm test:types` fails until the types are regenerated.
2. Run `pnpm gen:lima-types` (needs Go installed, ideally via [mise](https://mise.jdx.dev/). Go is defined in `.tool-versions`).
3. Review the diff of `src/cli/limactl/types.gen.ts` and fix any type errors. Never edit that file by hand.
