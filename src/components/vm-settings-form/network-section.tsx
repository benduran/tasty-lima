import { CheckboxRow } from '../checkbox-row.tsx';
import { CrtSection } from '../crt.tsx';

type NetworkSectionProps = {
  allowHostLoopback: boolean;
  hostLoopbackBlockable: boolean;
  onAllowHostLoopbackChange: (allow: boolean) => void;
};

export function NetworkSection({
  allowHostLoopback,
  hostLoopbackBlockable,
  onAllowHostLoopbackChange,
}: NetworkSectionProps) {
  return (
    <CrtSection contentClassName="flex flex-col gap-4 p-5" title="[5] NETWORK">
      <CheckboxRow
        checked={allowHostLoopback}
        className="gap-2.5"
        disabled={!hostLoopbackBlockable}
        label="LET THIS VM CONNECT TO APPS RUNNING ON YOUR COMPUTER"
        onCheckedChange={onAllowHostLoopbackChange}
      />
      <p className="text-phosphor-dim text-xs tracking-[0.08em] uppercase">
        {hostLoopbackBlockable ? (
          <>
            when this is off, nothing inside the vm can talk to apps running on
            your computer, like a local database, a dev server or a proxy.
            <br />
            leave it off unless the vm needs one of those.
          </>
        ) : (
          <>
            this vm can connect to apps running on your computer, like a local
            database or a dev server.
            <br />
            lima can only switch that off for apple virtualization vms on a mac.
          </>
        )}
      </p>
    </CrtSection>
  );
}
