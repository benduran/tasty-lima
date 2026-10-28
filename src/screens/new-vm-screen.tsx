import { Link } from 'wouter';
import { AppFooter } from '@/components/app-footers.tsx';
import {
  CrtCells,
  CrtCursor,
  CrtFieldset,
  CrtOption,
  CrtSection,
} from '@/components/crt.tsx';
import { Button, buttonVariants } from '@/components/ui/button.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Input } from '@/components/ui/input.tsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx';
import { cn } from '@/lib/utils.ts';
import { uiRoutes } from '@/routes/ui.ts';

const TEMPLATES = [
  { desc: 'Ubuntu, Lima defaults', id: 'default' },
  { desc: 'Ubuntu LTS', id: 'ubuntu-lts' },
  { desc: 'Debian stable', id: 'debian' },
  { desc: 'Fedora Cloud', id: 'fedora' },
  { desc: 'Arch Linux', id: 'archlinux' },
  { desc: 'Alpine, smallest image', id: 'alpine' },
  { desc: 'Ubuntu + rootless Docker', id: 'docker' },
  { desc: 'Ubuntu + k3s', id: 'k3s' },
] as const;

const MOUNTS = [
  { guest: '', host: '~', n: 1, writable: false },
  { guest: '', host: '~/src', n: 2, writable: true },
] as const;

const YAML_PREVIEW = `# ~/.lima/dev-box/lima.yaml
# from template:ubuntu-lts
vmType: vz
arch: aarch64
cpus: 4
memory: 8GiB
disk: 100GiB
mountType: virtiofs
mounts:
- location: "~"
  writable: false
- location: "~/src"
  writable: true
ssh:
  forwardAgent: true`;

const EQUIVALENT_CMD = `limactl start --name=dev-box \\
  --vm-type=vz --arch=aarch64 \\
  --cpus=4 --memory=8 --disk=100 \\
  --mount-type=virtiofs \\
  --set='.mounts=[{"location":"~"},{"location":"~/src","writable":true}]' \\
  --set='.ssh.forwardAgent=true' \\
  template:ubuntu-lts`;

/* New VM: the create form with a live lima.yaml preview aside. */
export function NewVmScreen() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-1.5">
          <p className="text-phosphor-dim">
            <Link href={uiRoutes.instances()}>INSTANCES</Link> / NEW
          </p>
          <h1 className="text-6xl">
            NEW VM
            <CrtCursor />
          </h1>
        </div>

        <div className="flex flex-wrap items-start gap-6">
          <form className="flex min-w-0 flex-[999_1_620px] flex-col gap-6">
            <CrtSection
              contentClassName="flex flex-col gap-5 p-5"
              title="[1] IMAGE"
            >
              <div className="flex max-w-105 flex-col gap-1.5">
                <label
                  className="tracking-[0.08em] text-phosphor-dim"
                  htmlFor="vm-name"
                >
                  INSTANCE NAME
                </label>
                <Input
                  autoComplete="off"
                  defaultValue="dev-box"
                  id="vm-name"
                  spellCheck={false}
                />
                <p>OK -&gt; ~/.lima/dev-box</p>
              </div>
              <CrtFieldset legend="TEMPLATE">
                <RadioGroup
                  className="grid grid-cols-[repeat(auto-fit,minmax(min(190px,100%),1fr))] gap-2"
                  defaultValue="ubuntu-lts"
                >
                  {TEMPLATES.map(tpl => (
                    <CrtOption
                      className="items-start py-2.5"
                      key={tpl.id}
                      sel={tpl.id === 'ubuntu-lts'}
                    >
                      <RadioGroupItem value={tpl.id} />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[22px]">{tpl.id}</span>
                        <span className="text-phosphor-dim">{tpl.desc}</span>
                      </span>
                    </CrtOption>
                  ))}
                </RadioGroup>
              </CrtFieldset>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-x-5 gap-y-5">
                <CrtFieldset legend="ARCH">
                  <RadioGroup
                    className="flex flex-col gap-2"
                    defaultValue="aarch64"
                  >
                    <CrtOption sel>
                      <RadioGroupItem value="aarch64" />
                      <span>aarch64</span>
                      <span className="ml-auto text-phosphor-dim">native</span>
                    </CrtOption>
                    <CrtOption>
                      <RadioGroupItem value="x86_64" />
                      <span>x86_64</span>
                      <span className="ml-auto text-phosphor-dim">
                        emulated
                      </span>
                    </CrtOption>
                  </RadioGroup>
                </CrtFieldset>
                <CrtFieldset legend="VM TYPE">
                  <RadioGroup className="flex flex-col gap-2" defaultValue="vz">
                    <CrtOption sel>
                      <RadioGroupItem value="vz" />
                      <span>vz</span>
                      <span className="ml-auto text-phosphor-dim">
                        Apple Virtualization
                      </span>
                    </CrtOption>
                    <CrtOption>
                      <RadioGroupItem value="qemu" />
                      <span>qemu</span>
                      <span className="ml-auto text-phosphor-dim">QEMU</span>
                    </CrtOption>
                  </RadioGroup>
                </CrtFieldset>
              </div>
            </CrtSection>

            <CrtSection
              contentClassName="flex flex-col gap-4 p-5"
              title="[2] RESOURCES"
            >
              <div className="overflow-x-auto">
                <div className="grid min-w-135 grid-cols-[80px_44px_auto_44px_minmax(160px,1fr)] items-center gap-3">
                  <span>CPUS</span>
                  <Button
                    aria-label="Fewer CPUs"
                    className="w-11 px-0"
                    type="button"
                    variant="outline"
                  >
                    -
                  </Button>
                  <CrtCells on={4} total={10} />
                  <Button
                    aria-label="More CPUs"
                    className="w-11 px-0"
                    type="button"
                    variant="outline"
                  >
                    +
                  </Button>
                  <output className="text-xl">
                    4 <span className="text-phosphor-dim">vCPU / 10</span>
                  </output>
                  <span>MEMORY</span>
                  <Button
                    aria-label="Less memory"
                    className="w-11 px-0"
                    type="button"
                    variant="outline"
                  >
                    -
                  </Button>
                  <CrtCells on={4} total={16} />
                  <Button
                    aria-label="More memory"
                    className="w-11 px-0"
                    type="button"
                    variant="outline"
                  >
                    +
                  </Button>
                  <output className="text-xl">
                    8 <span className="text-phosphor-dim">GiB / 32</span>
                  </output>
                  <span>DISK</span>
                  <Button
                    aria-label="Smaller disk"
                    className="w-11 px-0"
                    type="button"
                    variant="outline"
                  >
                    -
                  </Button>
                  <CrtCells on={2} total={10} />
                  <Button
                    aria-label="Bigger disk"
                    className="w-11 px-0"
                    type="button"
                    variant="outline"
                  >
                    +
                  </Button>
                  <output className="text-xl">
                    100 <span className="text-phosphor-dim">GiB sparse</span>
                  </output>
                </div>
              </div>
              <p className="text-phosphor-dim">
                RUNNING VMS USE 8 CPU / 12 GiB. WITH THIS ONE: 12 CPU / 20 GiB
                (CPU MAY OVERCOMMIT)
              </p>
            </CrtSection>

            <CrtSection
              contentClassName="flex flex-col gap-4 p-5"
              title="[3] MOUNTS"
            >
              <CrtFieldset legend="MOUNT TYPE">
                <RadioGroup
                  className="flex flex-wrap gap-2"
                  defaultValue="virtiofs"
                >
                  <CrtOption sel>
                    <RadioGroupItem value="virtiofs" />
                    <span>virtiofs</span>
                  </CrtOption>
                  <CrtOption>
                    <RadioGroupItem value="reverse-sshfs" />
                    <span>reverse-sshfs</span>
                  </CrtOption>
                </RadioGroup>
              </CrtFieldset>
              <div className="flex flex-col gap-2">
                <div
                  aria-hidden="true"
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_76px_44px] gap-2 tracking-[0.08em] text-phosphor-dim"
                >
                  <span>HOST PATH</span>
                  <span>GUEST PATH</span>
                  <span>ACCESS</span>
                  <span />
                </div>
                {MOUNTS.map(mount => (
                  <div
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_76px_44px] items-center gap-2"
                    key={mount.n}
                  >
                    <Input
                      aria-label={`Host path ${mount.n}`}
                      defaultValue={mount.host}
                      spellCheck={false}
                    />
                    <Input
                      aria-label={`Guest path ${mount.n}`}
                      defaultValue={mount.guest}
                      placeholder="same as host"
                      spellCheck={false}
                    />
                    <span className="flex min-h-11 cursor-pointer items-center gap-2">
                      <Checkbox defaultChecked={mount.writable} />
                      <span>RW</span>
                    </span>
                    <Button
                      aria-label={`Remove mount ${mount.n}`}
                      className="w-11 px-0"
                      type="button"
                      variant="outline"
                    >
                      X
                    </Button>
                  </div>
                ))}
                <div>
                  <Button type="button" variant="outline">
                    + Add mount
                  </Button>
                </div>
              </div>
            </CrtSection>

            <CrtSection
              contentClassName="flex flex-wrap gap-x-8 gap-y-3 p-5"
              title="[4] SSH"
            >
              <span className="flex min-h-11 cursor-pointer items-center gap-2.5">
                <Checkbox defaultChecked />
                <span>FORWARD SSH AGENT</span>
              </span>
              <p className="flex items-center text-phosphor-dim">
                USER ben · PORT AUTO · KEY ~/.lima/_config/user
              </p>
            </CrtSection>
          </form>

          <aside className="flex min-w-0 flex-[1_1_400px] flex-col border border-phosphor-dim">
            <h2 className="flex justify-between gap-3 bg-primary px-3 py-0.5 text-[20px] tracking-[0.08em] text-primary-foreground text-shadow-none">
              <span>PREVIEW</span>
              <span>lima.yaml</span>
            </h2>
            <pre className="overflow-x-auto p-4 leading-tight whitespace-pre">
              {YAML_PREVIEW}
            </pre>
            <div className="flex items-center justify-between gap-3 border-t border-phosphor-line px-4 pt-2">
              <span className="tracking-[0.08em] text-phosphor-dim">
                EQUIVALENT COMMAND
              </span>
              <Button aria-label="Copy command" type="button" variant="ghost">
                Copy
              </Button>
            </div>
            <pre className="overflow-x-auto px-4 pt-2 pb-4 leading-tight whitespace-pre">
              {EQUIVALENT_CMD}
            </pre>
            <div className="flex flex-col gap-3 border-t border-phosphor-line p-4">
              <span className="flex min-h-11 cursor-pointer items-center gap-2.5">
                <Checkbox defaultChecked />
                <span>START AFTER CREATE</span>
              </span>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="min-h-13 flex-1 text-[24px]"
                  type="button"
                  variant="default"
                >
                  Create + start
                </Button>
                <Link
                  className={cn(
                    buttonVariants({ size: 'lg', variant: 'outline' }),
                  )}
                  href={uiRoutes.instances()}
                >
                  Cancel
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <AppFooter
        keys={[
          ['TAB', 'NEXT FIELD'],
          ['ENTER', 'CREATE'],
          ['ESC', 'CANCEL'],
        ]}
        note="limactl ok · ~/.lima"
      />
    </>
  );
}
