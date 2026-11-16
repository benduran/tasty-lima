import { Link } from 'wouter';
import { cn } from '../lib/index.ts';
import { uiRoutes } from '../routes/index.ts';
import type { LimaInstance } from '../shared/types.ts';
import { CrtCells, CrtDot, CrtSection } from './crt.tsx';
import { Button, buttonVariants } from './ui/button.tsx';

type VMInstanceProps = {
  instance: LimaInstance;
};

export function VMInstance({ instance: _instance }: VMInstanceProps) {
  return (
    <CrtSection label="RUNNING" title="INSTANCE: default">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-x-10 gap-y-6 p-5">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-3">
            <CrtDot variant="run" />
            <span className="text-[44px] leading-none">default</span>
          </div>
          <p className="text-phosphor-dim">Ubuntu 24.04 LTS</p>
          <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1">
            <dt className="text-phosphor-dim">STATUS</dt>
            <dd>RUNNING</dd>
            <dt className="text-phosphor-dim">UPTIME</dt>
            <dd>3d 04:12</dd>
            <dt className="text-phosphor-dim">TEMPLATE</dt>
            <dd>template:ubuntu-lts</dd>
            <dt className="text-phosphor-dim">VM TYPE</dt>
            <dd>vz / aarch64</dd>
            <dt className="text-phosphor-dim">DIR</dt>
            <dd>~/.lima/default</dd>
          </dl>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <h3 className="tracking-[0.08em] text-phosphor-dim">RESOURCES</h3>
          <div className="grid grid-cols-[52px_auto_1fr] items-center gap-x-3 gap-y-2.5">
            <span className="text-phosphor-dim">CPU</span>
            <CrtCells on={4} total={10} />
            <span>4 vCPU</span>
            <span className="text-phosphor-dim">MEM</span>
            <CrtCells on={2} total={16} />
            <span>4 GiB</span>
            <span className="text-phosphor-dim">DISK</span>
            <span className="col-span-2">100 GiB max (sparse)</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <h3 className="tracking-[0.08em] text-phosphor-dim">MOUNTS</h3>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between gap-3">
              <span>~ -&gt; /Users/ben</span>
              <span className="text-phosphor-dim">RO</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>/tmp/lima -&gt; /tmp/lima</span>
              <span className="text-phosphor-dim">RW</span>
            </div>
          </div>
          <h3 className="mt-2 tracking-[0.08em] text-phosphor-dim">ACCESS</h3>
          <div className="flex items-stretch gap-2">
            <code className="flex min-w-0 flex-1 items-center overflow-x-auto border border-dashed border-phosphor-dim px-3 whitespace-nowrap">
              $ limactl shell default
            </code>
            <Button
              aria-label="Copy shell command"
              type="button"
              variant="outline"
            >
              Copy
            </Button>
          </div>
          <p className="text-phosphor-dim">SSH LISTENING ON 127.0.0.1:60022</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-phosphor-line px-5 py-3.5">
        <Button type="button" variant="outline">
          Stop
        </Button>
        <Button type="button" variant="outline">
          Restart
        </Button>
        <Link
          className={cn(buttonVariants({ variant: 'outline' }))}
          href={uiRoutes.editVm('TODO')}
        >
          Config
        </Link>
        <Button
          aria-describedby="clone-hint"
          disabled
          type="button"
          variant="outline"
        >
          Clone
        </Button>
        <span className="text-phosphor-dim" id="clone-hint">
          STOP TO CLONE
        </span>
        <Button className="ml-auto" type="button" variant="outline">
          Delete
        </Button>
      </div>
    </CrtSection>
  );
}
