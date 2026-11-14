import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import type * as React from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/**
 * Sonner with the LIMA//CRT look. Sonner's bundled stylesheet is unlayered
 * and hardcodes its dark theme, so the design tokens are passed as inline
 * CSS variables (which always win) — index.css adds the couple of
 * higher-specificity rules the variables cannot reach.
 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      closeButton
      icons={{
        error: <OctagonXIcon className="size-4 text-destructive" />,
        info: <InfoIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
        success: <CircleCheckIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
      }}
      style={
        {
          '--border-radius': 'var(--radius)',
          '--normal-bg': 'var(--popover)',
          '--normal-border': 'var(--border)',
          '--normal-text': 'var(--popover-foreground)',
          fontFamily: 'var(--font-sans)',
        } as React.CSSProperties
      }
      theme="dark"
      {...props}
    />
  );
}

export { Toaster };
