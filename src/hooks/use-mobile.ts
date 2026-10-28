import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const isMobilePredicate = (win: Window) =>
      win.innerWidth < MOBILE_BREAKPOINT;

    const onChange = () => {
      setIsMobile(isMobilePredicate(window));
    };
    mql.addEventListener('change', onChange);
    setIsMobile(isMobilePredicate(window));
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return Boolean(isMobile);
}
