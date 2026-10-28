import type { PropsWithChildren } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip.tsx';

export function TastyLimaProviders({ children }: PropsWithChildren) {
  return <TooltipProvider>{children}</TooltipProvider>;
}
