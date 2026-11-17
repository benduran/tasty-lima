import copyToClipboard from 'copy-to-clipboard';
import { CheckIcon, CopyIcon } from 'lucide-react';
import type { ComponentProps, PropsWithChildren } from 'react';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { AppFooter } from '../components/app-footer.tsx';
import { Disc } from '../components/disc.tsx';
import { Subheader } from '../components/subheader.tsx';
import { Button } from '../components/ui/button.tsx';
import { Skeleton } from '../components/ui/skeleton.tsx';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../components/ui/tooltip.tsx';
import { useCopiedFlag } from '../hooks/use-copied-flag.ts';
import { useQueryLimaBin } from '../hooks/use-query-lima-bin.ts';
import { LIMA_VERSION, TASTY_LIMA_VERSION } from '../shared/constants.ts';

type PageLayoutProps = PropsWithChildren & {
  subheader?: ComponentProps<typeof Subheader>;
};

export function PageLayout({ children, subheader }: PageLayoutProps) {
  /** queries */
  const { data, isPending } = useQueryLimaBin();

  /** hooks */
  const [copied, setCopied] = useCopiedFlag();

  /** callbacks */
  const handleCopyBinPath = useCallback(() => {
    if (!data?.binPath) return;
    copyToClipboard(data.binPath)
      .then(() => {
        toast.success('lima bin path copied');
        setCopied(true);
      })
      .catch(err =>
        toast.error('failed to copy lima bin path', {
          description: err instanceof Error ? err.message : String(err),
        }),
      );
  }, [data?.binPath, setCopied]);

  return (
    <>
      <main className="min-h-0 flex w-full grow flex-col gap-6 p-6 overflow-y-auto">
        <div className="w-full max-w-360 mx-auto flex flex-col min-h-0">
          {subheader && <Subheader {...subheader} />}
          {children}
        </div>
      </main>
      <AppFooter
        left={
          <>
            {isPending && <Skeleton className="h-4 w-20" />}
            {!isPending && (
              <span className="text-muted-foreground">
                {data?.binPath ? (
                  <span className="flex items-center gap-1">
                    <b>Lima bin:</b> <span>{data.binPath}</span>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            onClick={handleCopyBinPath}
                            size="icon-xs"
                            variant="ghost"
                          >
                            {copied ? <CheckIcon /> : <CopyIcon />}
                          </Button>
                        }
                      />
                      <TooltipContent>Copy lima bin path</TooltipContent>
                    </Tooltip>
                  </span>
                ) : (
                  <>lima bin path unknown</>
                )}
              </span>
            )}
          </>
        }
        right={
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
