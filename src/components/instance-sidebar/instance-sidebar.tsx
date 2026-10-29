import { useLayoutEffect } from 'react';
import { useInstancesStore } from '../../stores/instances-store.ts';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '../ui/drawer.tsx';
import { VMInstance } from '../vm-instance.tsx';

export function InstanceSidebar() {
  /** hooks */
  const [selected, setSelected] = useInstancesStore('selected');

  /** effects */
  useLayoutEffect(() => () => setSelected(null), [setSelected]);

  return (
    <Drawer
      onOpenChange={open => !open && setSelected(null)}
      open={Boolean(selected)}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Instance: {selected?.name}</DrawerTitle>
          {selected && <VMInstance instance={selected} />}
        </DrawerHeader>
        <DrawerFooter>Stuff</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
