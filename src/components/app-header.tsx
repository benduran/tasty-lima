import { Link, useLocation } from 'wouter';
import { useQueryMachineInfo } from '../hooks/use-query-machine-info.ts';
import { cn } from '../lib/utils.ts';
import { MachineInfo } from './machine-info.tsx';
import { buttonVariants } from './ui/button.tsx';

const PRIMARY_NAV = [
  {
    href: '/instances',
    label: 'Instances',
    match: (loc: string) =>
      loc === '/instances' ||
      (loc.startsWith('/instances/') && loc !== '/instances/new'),
  },
  {
    href: '/instances/new',
    label: 'New VM',
    match: (loc: string) => loc === '/instances/new',
  },
  {
    href: '/theme',
    label: 'Theme',
    match: (loc: string) => loc === '/theme',
  },
] as const;

export function AppHeader() {
  /** routing */
  const [location] = useLocation();

  /** queries */
  const { data: machineInfo, isPending: machineInfoLoading } =
    useQueryMachineInfo();

  return (
    <header className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b-[3px] border-double border-phosphor-dim px-6 py-3 shrink-0">
      <Link
        className="text-[40px] leading-none tracking-[0.06em] no-underline"
        href="/"
      >
        LIMA{'//'}CTL
      </Link>
      <nav aria-label="Primary" className="flex flex-wrap gap-2">
        {PRIMARY_NAV.map(item => {
          const active = item.match(location);
          return (
            <Link
              aria-current={active ? 'page' : undefined}
              className={cn(
                buttonVariants({ variant: active ? 'default' : 'ghost' }),
              )}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <span className="ml-auto">
        <MachineInfo info={machineInfo} loading={machineInfoLoading} />
      </span>
    </header>
  );
}
