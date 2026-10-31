import type { ComponentProps, PropsWithChildren } from 'react';
import { AppFooter } from '../components/app-footers.tsx';
import { Disc } from '../components/disc.tsx';
import { Subheader } from '../components/subheader.tsx';
import { LIMA_VERSION, TASTY_LIMA_VERSION } from '../shared/constants.ts';

type PageLayoutProps = PropsWithChildren & {
  subheader?: ComponentProps<typeof Subheader>;
};

export function PageLayout({ children, subheader }: PageLayoutProps) {
  return (
    <>
      <main className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-6 p-6">
        {subheader && <Subheader {...subheader} />}
        {children}
      </main>
      <AppFooter
        note={
          <span className="inline-flex gap-2 items-center">
            <span>tasty-lima {TASTY_LIMA_VERSION}</span>
            <Disc />
            <span>limactl {LIMA_VERSION}</span>
          </span>
        }
      />
    </>
  );
}
