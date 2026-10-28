import { Link } from 'wouter';
import { CrtDot } from '@/components/crt.tsx';
import { Button, buttonVariants } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils.ts';
import { uiRoutes } from '@/routes/ui.ts';

const INSTANCE_TABS = [
  { id: 'config', label: 'Config' },
  { id: 'logs', label: 'Logs' },
  { id: 'ssh', label: 'SSH' },
] as const;

export type InstanceTab = (typeof INSTANCE_TABS)[number]['id'];

const TAB_HREFS = {
  config: uiRoutes.instanceConfig('TODO'),
  logs: uiRoutes.instanceLogs('TODO'),
  ssh: uiRoutes.instanceSsh('TODO'),
} as const;

/*
  Shared chrome for the instance screens (Config / Logs / SSH): crumb,
  instance title row with power actions, and the Overview/Config/Logs/SSH
  tab strip. Content is placeholder data for the `default` instance.
*/
export function InstancePage({ active }: { active: InstanceTab }) {
  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-phosphor-dim">
        <Link href={uiRoutes.instances()}>INSTANCES</Link> / default
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <CrtDot variant="run" />
        <h1 className="text-6xl">default</h1>
        <p className="text-phosphor-dim">
          RUNNING · UP 3d 04:12 · vz/aarch64 · Ubuntu 24.04 LTS
        </p>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button type="button" variant="outline">
            Stop
          </Button>
          <Button type="button" variant="outline">
            Restart
          </Button>
          <Button disabled type="button" variant="outline">
            Clone
          </Button>
          <Button type="button" variant="outline">
            Delete
          </Button>
        </div>
      </div>
      <nav
        aria-label="Instance"
        className="flex flex-wrap gap-1 border-b border-phosphor-dim"
      >
        <Link
          className={cn(buttonVariants({ variant: 'ghost' }))}
          href={uiRoutes.instances()}
        >
          Overview
        </Link>
        {INSTANCE_TABS.map(tab => (
          <Link
            aria-current={tab.id === active ? 'page' : undefined}
            className={cn(
              buttonVariants({
                variant: tab.id === active ? 'default' : 'ghost',
              }),
            )}
            href={TAB_HREFS[tab.id]}
            key={tab.id}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
