import { AppFooter } from '../components/app-footers.tsx';
import { CrtCell, CrtSection } from '../components/crt.tsx';
import { InstanceHeader } from '../components/instance-header.tsx';
import type { MountRow } from '../components/mounts-table.tsx';
import { MountsTable } from '../components/mounts-table.tsx';
import { Panel } from '../components/panel.tsx';
import { ResourceMeter } from '../components/resource-meter.tsx';
import { Button } from '../components/ui/button.tsx';
import { PageLayout } from '../layouts/PageLayout.tsx';

const MOUNTS: readonly MountRow[] = [
  { guest: '', host: '~', writable: false },
  { guest: '', host: '/tmp/lima', writable: true },
];

const EDIT_CMD = `limactl edit default \\
  --cpus=6 \\
  --memory=8`;

export function InstanceConfigPage() {
  return (
    <>
      <PageLayout>
        <InstanceHeader active="config" />

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
                  <ResourceMeter
                    decLabel="Fewer CPUs"
                    incLabel="More CPUs"
                    label="CPUS"
                    on={6}
                    outputClassName="text-xl"
                    total={10}
                    was={4}
                  >
                    6 <span className="text-phosphor-dim">vCPU (WAS 4)</span>
                  </ResourceMeter>
                  <ResourceMeter
                    decLabel="Less memory"
                    incLabel="More memory"
                    label="MEMORY"
                    on={4}
                    outputClassName="text-xl"
                    total={16}
                    was={2}
                  >
                    8 <span className="text-phosphor-dim">GiB (WAS 4)</span>
                  </ResourceMeter>
                  <ResourceMeter
                    decDescribedBy="disk-note"
                    decDisabled
                    decLabel="Smaller disk"
                    incLabel="Bigger disk"
                    label="DISK"
                    on={2}
                    outputClassName="text-xl"
                    total={10}
                  >
                    100 <span className="text-phosphor-dim">GiB</span>
                  </ResourceMeter>
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
              <MountsTable mounts={MOUNTS} />
            </CrtSection>
          </form>

          <Panel
            as="aside"
            className="flex-[1_1_420px]"
            meta="2 CHANGES"
            title="PENDING CHANGES"
          >
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
          </Panel>
        </div>
      </PageLayout>
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
