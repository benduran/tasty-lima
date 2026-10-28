import { Link, useLocation } from 'wouter';
import { buttonVariants } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils.ts';

const PRIMARY_NAV = [
  {
    href: '/instances',
    label: 'F1 Instances',
    match: (loc: string) =>
      loc === '/instances' ||
      (loc.startsWith('/instances/') && loc !== '/instances/new'),
  },
  {
    href: '/instances/new',
    label: 'F2 New VM',
    match: (loc: string) => loc === '/instances/new',
  },
  {
    href: '/templates',
    label: 'F3 Templates',
    match: (loc: string) => loc.startsWith('/templates'),
  },
  {
    href: '/theme',
    label: 'F9 Theme',
    match: (loc: string) => loc === '/theme',
  },
] as const;

export function AppHeader() {
  const [location] = useLocation();

  return (
    <header className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b-[3px] border-double border-phosphor-dim px-6 py-3">
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
      <p className="ml-auto text-phosphor-dim">
        darwin/arm64 · 10 CPU · 32 GiB
      </p>
    </header>
  );
}
