import type { Nullish, PortForwardInput } from '../../shared/types.ts';
import { CrtSection } from '../crt.tsx';
import { PortsTable } from '../ports-table.tsx';

type PortOverridesSectionProps = {
  onAddPortForward: () => void;
  onChangePortForward: (index: number, portForward: PortForwardInput) => void;
  onRemovePortForward: (index: number) => void;
  portForwards: Nullish<PortForwardInput[]>;
};

export function PortOverridesSection({
  onAddPortForward,
  onChangePortForward,
  onRemovePortForward,
  portForwards,
}: PortOverridesSectionProps) {
  return (
    <CrtSection
      contentClassName="flex flex-col gap-4 p-5"
      title="[4] PORT OVERRIDES"
    >
      <PortsTable
        onAddPortForward={onAddPortForward}
        onChangePortForward={onChangePortForward}
        onRemovePortForward={onRemovePortForward}
        portForwards={portForwards ?? []}
      />
      <div className="text-phosphor-dim uppercase">
        <p>
          Lima already forwards guest ports to{' '}
          <span className="font-mono">127.0.0.1</span>.
        </p>
        <p>(Changes you make to this section will override that behaviour)</p>
      </div>
    </CrtSection>
  );
}
