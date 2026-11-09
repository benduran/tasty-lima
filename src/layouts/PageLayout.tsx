import type { ComponentProps, PropsWithChildren } from 'react';
import { AppFooter } from '../components/app-footer.tsx';
import { Disc } from '../components/disc.tsx';
import { Subheader } from '../components/subheader.tsx';
import { LIMA_VERSION, TASTY_LIMA_VERSION } from '../shared/constants.ts';

type PageLayoutProps = PropsWithChildren & {
  subheader?: ComponentProps<typeof Subheader>;
};

export function PageLayout({ children, subheader }: PageLayoutProps) {
  return (
    <>
      <main className="min-h-0 flex w-full grow flex-col gap-6 p-6 overflow-y-auto">
        <div className="w-full max-w-360 mx-auto flex flex-col min-h-0">
          {subheader && <Subheader {...subheader} />}
          {children}
        </div>
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
