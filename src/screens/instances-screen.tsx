import { Link } from 'wouter';
import { AppFooter } from '@/components/app-footers';
import { CrtCells, CrtCursor, CrtDot, CrtSection } from '@/components/crt';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { uiRoutes } from '@/routes/ui';

const TABLE_COLS =
  'grid-cols-[20px_minmax(150px,1.5fr)_100px_120px_56px_90px_48px_72px_80px_minmax(170px,1.2fr)]';

const VMS = [
  {
    arch: 'aarch64',
    cpus: '4',
    disk: '100 GiB',
    dot: 'run',
    mem: '4 GiB',
    name: 'default',
    selected: true,
    ssh: '127.0.0.1:60022',
    status: 'RUNNING',
    type: 'vz',
    uptime: '3d 04:12',
  },
  {
    arch: 'aarch64',
    cpus: '4',
    disk: '100 GiB',
    dot: 'run',
    mem: '8 GiB',
    name: 'docker',
    selected: false,
    ssh: '127.0.0.1:60906',
    status: 'RUNNING',
    type: 'vz',
    uptime: '0d 06:47',
  },
  {
    arch: 'aarch64',
    cpus: '2',
    disk: '50 GiB',
    dot: 'stop',
    mem: '4 GiB',
    name: 'k3s-lab',
    selected: false,
    ssh: '-',
    status: 'STOPPED',
    type: 'vz',
    uptime: '-',
  },
  {
    arch: 'x86_64',
    cpus: '2',
    disk: '30 GiB',
    dot: 'stop',
    mem: '2 GiB',
    name: 'fedora-test',
    selected: false,
    ssh: '-',
    status: 'STOPPED',
    type: 'qemu',
    uptime: '-',
  },
  {
    arch: 'aarch64',
    cpus: '1',
    disk: '20 GiB',
    dot: 'err',
    mem: '1 GiB',
    name: 'alpine-build',
    selected: false,
    ssh: '-',
    status: 'BROKEN',
    type: 'qemu',
    uptime: '-',
  },
] as const;

const STATUS_FILTERS = [
  { count: 5, id: 'all', label: 'All' },
  { count: 2, id: 'running', label: 'Running' },
  { count: 2, id: 'stopped', label: 'Stopped' },
  { count: 1, id: 'broken', label: 'Broken' },
] as const;

/* Instances: the fleet table plus the selected instance detail panel. */
export function InstancesScreen() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-6xl">
              INSTANCES
              <CrtCursor />
            </h1>
            <p className="text-phosphor-dim">
              5 DEFINED · 2 RUNNING · 2 STOPPED · 1 BROKEN
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
            <div className="flex flex-col gap-1.5">
              <p className="tracking-[0.06em] text-phosphor-dim">
                ALLOCATED TO RUNNING VMS
              </p>
              <div className="grid grid-cols-[44px_auto_auto] items-center gap-x-3 gap-y-1.5">
                <span className="text-phosphor-dim">CPU</span>
                <CrtCells on={8} total={10} />
                <span>8/10</span>
                <span className="text-phosphor-dim">MEM</span>
                <CrtCells on={6} total={16} />
                <span>12/32 GiB</span>
              </div>
            </div>
            <Link
              className={cn(
                buttonVariants({ size: 'lg', variant: 'default' }),
                'px-5.5',
              )}
              href={uiRoutes.newVm()}
            >
              + New VM
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <label
            className="flex max-w-105 flex-1 basis-70 items-center gap-2.5"
            htmlFor="q"
          >
            <span>FILTER&gt;</span>
            <Input id="q" placeholder="name..." type="search" />
          </label>
          <div
            aria-label="Filter by status"
            className="flex flex-wrap gap-2"
            role="group"
          >
            {STATUS_FILTERS.map(filter => (
              <Button
                aria-pressed={filter.id === 'all'}
                key={filter.id}
                type="button"
                variant={filter.id === 'all' ? 'default' : 'outline'}
              >
                {filter.label} {filter.count}
              </Button>
            ))}
          </div>
        </div>

        <CrtSection
          contentClassName="overflow-x-auto"
          label="~/.lima"
          title="INSTANCES"
        >
          <div className="min-w-250">
            <div
              aria-hidden="true"
              className={cn(
                'grid gap-x-3 border-b border-phosphor-line px-3 py-2 tracking-[0.06em] text-phosphor-dim',
                TABLE_COLS,
              )}
            >
              <span />
              <span>NAME</span>
              <span>STATUS</span>
              <span>UPTIME</span>
              <span>TYPE</span>
              <span>ARCH</span>
              <span>CPU</span>
              <span>MEM</span>
              <span>DISK</span>
              <span>SSH</span>
            </div>
            {VMS.map(vm => (
              <button
                aria-pressed={vm.selected}
                className={cn(
                  'grid w-full min-h-12 items-center gap-x-3 border-b border-phosphor-line px-3 text-left hover:bg-phosphor-faint',
                  TABLE_COLS,
                  vm.selected &&
                    'bg-phosphor-faint text-shadow-(--glow) outline-1 -outline-offset-1 outline-primary',
                )}
                key={vm.name}
                type="button"
              >
                <CrtDot variant={vm.dot} />
                <span className="text-[23px]">{vm.name}</span>
                <span>{vm.status}</span>
                <span>{vm.uptime}</span>
                <span>{vm.type}</span>
                <span>{vm.arch}</span>
                <span>{vm.cpus}</span>
                <span>{vm.mem}</span>
                <span>{vm.disk}</span>
                <span>{vm.ssh}</span>
              </button>
            ))}
          </div>
        </CrtSection>

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
              <h3 className="mt-2 tracking-[0.08em] text-phosphor-dim">
                ACCESS
              </h3>
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
              <p className="text-phosphor-dim">
                SSH LISTENING ON 127.0.0.1:60022
              </p>
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
              href={uiRoutes.instanceConfig('TODO')}
            >
              Config
            </Link>
            <Link
              className={cn(buttonVariants({ variant: 'outline' }))}
              href={uiRoutes.instanceLogs('TODO')}
            >
              Logs
            </Link>
            <Link
              className={cn(buttonVariants({ variant: 'outline' }))}
              href={uiRoutes.instanceSsh('TODO')}
            >
              SSH
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
      </main>
      <AppFooter
        keys={[
          ['F2', 'NEW'],
          ['F10', 'CLONE'],
          ['F4', 'CONFIG'],
          ['F5', 'START/STOP'],
          ['F6', 'LOGS'],
          ['F7', 'SSH'],
          ['F8', 'DELETE'],
        ]}
        note="limactl ok · ~/.lima"
      />
    </>
  );
}
