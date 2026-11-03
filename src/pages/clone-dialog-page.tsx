import { Link } from 'wouter';
import { CheckboxRow } from '../components/checkbox-row.tsx';
import { CommandBlock } from '../components/command-preview.tsx';
import { CrtDot, CrtKey } from '../components/crt.tsx';
import { CrtDialog } from '../components/crt-dialog.tsx';
import { LabeledField } from '../components/labeled-field.tsx';
import { ResourceMeter } from '../components/resource-meter.tsx';
import { Button, buttonVariants } from '../components/ui/button.tsx';
import { Input } from '../components/ui/input.tsx';
import { cn } from '../lib/utils.ts';
import { uiRoutes } from '../routes/ui.ts';

const CLONE_CMD = '$ limactl clone k3s-lab k3s-lab-2 --start';

export function CloneDialogPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-10">
      <CrtDialog
        className="max-w-180"
        footer={
          <>
            <Link
              className={cn(buttonVariants({ variant: 'ghost' }))}
              href={uiRoutes.instances()}
            >
              Cancel
            </Link>
            <Button
              className="min-w-40 text-[22px]"
              type="button"
              variant="default"
            >
              Clone
            </Button>
          </>
        }
        title="CLONE INSTANCE"
      >
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
          <span className="w-22.5 tracking-[0.08em] text-phosphor-dim">
            SOURCE
          </span>
          <CrtDot variant="stop" />
          <span className="text-[30px] leading-none">k3s-lab</span>
          <span className="text-phosphor-dim">
            STOPPED · 2 CPU · 4 GiB · 50 GiB
          </span>
          <span className="ml-auto">
            <CrtKey>OK</CrtKey>
          </span>
        </div>

        <LabeledField
          htmlFor="clone-name"
          label="NEW NAME"
          message="OK -> ~/.lima/k3s-lab-2"
          messageId="clone-msg"
        >
          <Input
            aria-describedby="clone-msg"
            autoComplete="off"
            defaultValue="k3s-lab-2"
            id="clone-name"
            spellCheck={false}
          />
        </LabeledField>

        <div className="flex flex-col gap-2.5">
          <p className="tracking-[0.08em] text-phosphor-dim">
            RESOURCES (OPTIONAL OVERRIDE)
          </p>
          <div className="grid grid-cols-[70px_auto_1fr] items-center gap-2.5">
            <ResourceMeter
              decLabel="Fewer CPUs"
              incLabel="More CPUs"
              label="CPUS"
              on={2}
              total={10}
            >
              2 vCPU
            </ResourceMeter>
            <ResourceMeter
              decLabel="Less memory"
              incLabel="More memory"
              label="MEM"
              on={2}
              total={16}
            >
              4 GiB
            </ResourceMeter>
          </div>
        </div>

        <CheckboxRow defaultChecked label="START AFTER CLONE" />

        <p className="text-phosphor-dim">
          Copies lima.yaml and the disk. The clone gets its own SSH port.
        </p>

        <CommandBlock>{CLONE_CMD}</CommandBlock>
      </CrtDialog>
    </main>
  );
}
