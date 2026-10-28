import { Link } from 'wouter';
import { CrtCells, CrtDot, CrtKey } from '../components/crt.tsx';
import { CrtDialog } from '../components/crt-dialog.tsx';
import { Button, buttonVariants } from '../components/ui/button.tsx';
import { Checkbox } from '../components/ui/checkbox.tsx';
import { Input } from '../components/ui/input.tsx';
import { cn } from '../lib/utils.ts';
import { uiRoutes } from '../routes/ui.ts';

const CLONE_CMD = '$ limactl clone k3s-lab k3s-lab-2 --start';

export function CloneDialogScreen() {
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

        <div className="flex flex-col gap-1.5">
          <label
            className="tracking-[0.08em] text-phosphor-dim"
            htmlFor="clone-name"
          >
            NEW NAME
          </label>
          <Input
            aria-describedby="clone-msg"
            autoComplete="off"
            defaultValue="k3s-lab-2"
            id="clone-name"
            spellCheck={false}
          />
          <p id="clone-msg">OK -&gt; ~/.lima/k3s-lab-2</p>
        </div>

        <div className="flex flex-col gap-2.5">
          <p className="tracking-[0.08em] text-phosphor-dim">
            RESOURCES (OPTIONAL OVERRIDE)
          </p>
          <div className="grid grid-cols-[70px_44px_auto_44px_1fr] items-center gap-2.5">
            <span>CPUS</span>
            <Button
              aria-label="Fewer CPUs"
              className="w-11 px-0"
              type="button"
              variant="outline"
            >
              -
            </Button>
            <CrtCells on={2} total={10} />
            <Button
              aria-label="More CPUs"
              className="w-11 px-0"
              type="button"
              variant="outline"
            >
              +
            </Button>
            <output>2 vCPU</output>
            <span>MEM</span>
            <Button
              aria-label="Less memory"
              className="w-11 px-0"
              type="button"
              variant="outline"
            >
              -
            </Button>
            <CrtCells on={2} total={16} />
            <Button
              aria-label="More memory"
              className="w-11 px-0"
              type="button"
              variant="outline"
            >
              +
            </Button>
            <output>4 GiB</output>
          </div>
        </div>

        <span className="flex min-h-11 cursor-pointer items-center gap-3">
          <Checkbox defaultChecked />
          <span>START AFTER CLONE</span>
        </span>

        <p className="text-phosphor-dim">
          Copies lima.yaml and the disk. The clone gets its own SSH port.
        </p>

        <pre className="overflow-x-auto border border-dashed border-phosphor-dim px-3 py-2.5 whitespace-pre">
          {CLONE_CMD}
        </pre>
      </CrtDialog>
    </main>
  );
}
