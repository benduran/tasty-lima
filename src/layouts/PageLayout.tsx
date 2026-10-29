import type { ComponentProps, PropsWithChildren } from 'react';
import { Subheader } from '../components/subheader.tsx';

type PageLayoutProps = PropsWithChildren & {
  subheader: ComponentProps<typeof Subheader>;
};

export function PageLayout({ children, subheader }: PageLayoutProps) {
  return (
    <main className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-6 p-6">
      <Subheader {...subheader} />
      {children}
    </main>
  );
}
