import { useLayoutEffect } from 'react';
import { useInstancesStore } from '../../stores/instances-store.ts';

export function InstanceSidebar() {
  /** hooks */
  const [selected, setSelected] = useInstancesStore('selected');

  /** effects */
  useLayoutEffect(() => () => setSelected(null), [setSelected]);

  return <aside>Stuff and things here</aside>;
}
