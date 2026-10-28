import type { PropsWithChildren } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';

export function TastyLimaProviders({ children }: PropsWithChildren) {
  return <TooltipProvider>{children}</TooltipProvider>;
}
