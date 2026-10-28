import { AppFooter } from '@/components/app-footers';
import { CrtCell, CrtCells, CrtSection } from '@/components/crt';
import { InstancePage } from '@/components/instance-page';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

const MOUNTS = [
  { guest: '', host: '~', n: 1, writable: false },
  { guest: '', host: '/tmp/lima', n: 2, writable: true },
] as const;

const EDIT_CMD = `limactl edit default \\
  --cpus=6 \\
  --memory=8`;

/* Instance / Config: edit resources + mounts, with a pending diff aside. */
export function InstanceConfigScreen() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-6 p-6">
        <InstancePage active="config" />

        <p
          className="flex flex-wrap gap-x-3 gap-y-2 bg-primary px-3.5 py-2.5 text-primary-foreground text-shadow-none"
          role="status"
        >
          <span>[!] INSTANCE IS RUNNING.</span>
          <span>RESOURCE AND MOUNT CHANGES TAKE EFFECT AFTER A RESTART.</span>
        </p>

        <div className="flex flex-wrap items-start gap-6">
          <form className="flex min-w-0 flex-[999_1_620px] flex-col gap-6">
            <CrtSection
              contentClassName="flex flex-col gap-4 p-5"
              title="RESOURCES"
            >
              <div className="overflow-x-auto">
                <div className="grid min-w-145 grid-cols-[80px_44px_auto_44px_minmax(200px,1fr)] items-center gap-3">
                  <span>CPUS</span>
                  <Button
                    aria-label="Fewer CPUs"
                    className="w-11 px-0"
                    type="button"
                    variant="outline"
                  >
                    -
                  </Button>
                  <CrtCells on={6} total={10} was={4} />
                  <Button
                    aria-label="More CPUs"
                    className="w-11 px-0"
                    type="button"
                    variant="outline"
                  >
                    +
                  </Button>
                  <output className="text-xl">
                    6 <span className="text-phosphor-dim">vCPU (WAS 4)</span>
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
                  <CrtCells on={4} total={16} was={2} />
                  <Button
                    aria-label="More memory"
                    className="w-11 px-0"
                    type="button"
                    variant="outline"
                  >
                    +
                  </Button>
                  <output className="text-xl">
                    8 <span className="text-phosphor-dim">GiB (WAS 4)</span>
                  </output>
                  <span>DISK</span>
                  <Button
                    aria-describedby="disk-note"
                    aria-label="Smaller disk"
                    className="w-11 px-0"
                    disabled
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
                    100 <span className="text-phosphor-dim">GiB</span>
                  </output>
                </div>
              </div>
              <p className="text-phosphor-dim" id="disk-note">
                DISK CAN GROW BUT NEVER SHRINK. CURRENT SIZE 100 GiB IS THE
                MINIMUM.
              </p>
              <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-phosphor-dim">
                <span className="inline-flex items-center gap-1.5">
                  <CrtCell state="on" /> CURRENT
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CrtCell state="new" /> ADDED
                </span>
              </p>
            </CrtSection>

            <CrtSection
              contentClassName="flex flex-col gap-2 p-5"
              label="virtiofs"
              title="MOUNTS"
            >
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
            </CrtSection>
          </form>

          <aside className="flex min-w-0 flex-[1_1_420px] flex-col border border-phosphor-dim">
            <h2 className="flex justify-between gap-3 bg-primary px-3 py-0.5 text-[20px] tracking-[0.08em] text-primary-foreground text-shadow-none">
              <span>PENDING CHANGES</span>
              <span>2 CHANGES</span>
            </h2>
            <div className="flex flex-col gap-0.5 overflow-x-auto p-4">
              <p className="whitespace-pre text-phosphor-dim">
                --- ~/.lima/default/lima.yaml
              </p>
              <p className="mb-2 whitespace-pre text-phosphor-dim">
                +++ edited
              </p>
              <p className="whitespace-pre text-phosphor-dim line-through">
                - cpus: 4
              </p>
              <p className="whitespace-pre">+ cpus: 6</p>
              <p className="whitespace-pre text-phosphor-dim line-through">
                - memory: 4GiB
              </p>
              <p className="whitespace-pre">+ memory: 8GiB</p>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-phosphor-line px-4 pt-2">
              <span className="tracking-[0.08em] text-phosphor-dim">
                EQUIVALENT COMMAND
              </span>
              <Button aria-label="Copy command" type="button" variant="ghost">
                Copy
              </Button>
            </div>
            <pre className="overflow-x-auto px-4 pt-2 pb-4 leading-tight whitespace-pre">
              {EDIT_CMD}
            </pre>
            <div className="flex flex-wrap gap-2 border-t border-phosphor-line p-4">
              <Button
                className="min-h-13 flex-1 text-[24px]"
                type="button"
                variant="default"
              >
                Apply + restart
              </Button>
              <Button
                className="min-h-13 flex-1"
                type="button"
                variant="outline"
              >
                Save for next start
              </Button>
              <Button className="min-h-13" type="button" variant="ghost">
                Discard
              </Button>
            </div>
          </aside>
        </div>
      </main>
      <AppFooter
        keys={[
          ['F5', 'STOP'],
          ['F6', 'LOGS'],
          ['F7', 'SSH'],
          ['^S', 'SAVE'],
          ['ESC', 'DISCARD'],
        ]}
        note="~/.lima/default/lima.yaml"
      />
    </>
  );
}
