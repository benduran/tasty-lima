import { useEffect, useState } from 'react';

const RESET_DELAY_MS = 3000;

type UseCopiedFlagOpts = Partial<{ delay: number }>;
export function useCopiedFlag(opts?: UseCopiedFlagOpts) {
  /** props */
  const resetDelay = opts?.delay ?? RESET_DELAY_MS;

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = setTimeout(() => setCopied(false), resetDelay);
    return () => clearTimeout(timeout);
  }, [copied, resetDelay]);

  return [copied, setCopied] as const;
}
