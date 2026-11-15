import type { MachineInfo, Nullish } from '../../shared/types.ts';
import { CheckboxRow } from '../checkbox-row.tsx';
import { CrtSection } from '../crt.tsx';
import { ResourceMeter } from '../resource-meter.tsx';

type ResourcesSectionProps = {
  cpus: Nullish<number>;
  disk: Nullish<string>;
  machineInfo: Nullish<MachineInfo>;
  nestedVirtualization: boolean;
  onCpusChange: (newVal: number) => void;
  onDiskMeterChange: (newVal: number) => void;
  onNestedVirtualizationChange: (checked: boolean) => void;
  onRamMeterChange: (newVal: number) => void;
  ram: Nullish<string>;
};

export function ResourcesSection({
  cpus,
  disk,
  machineInfo,
  nestedVirtualization,
  onCpusChange,
  onDiskMeterChange,
  onNestedVirtualizationChange,
  onRamMeterChange,
  ram,
}: ResourcesSectionProps) {
  return (
    <CrtSection
      contentClassName="flex flex-col gap-4 p-5"
      title="[2] RESOURCES"
    >
      <div className="overflow-x-auto">
        <div className="grid min-w-135 grid-cols-[80px_auto_minmax(160px,1fr)] items-center gap-3">
          <ResourceMeter
            decLabel="Fewer CPUs"
            incLabel="More CPUs"
            label="CPUS"
            on={cpus ?? 0}
            onChange={onCpusChange}
            outputClassName="text-xl"
            total={machineInfo?.cpus ?? 1}
          >
            {cpus ?? 1}{' '}
            <span className="text-phosphor-dim">
              vCPU / {machineInfo?.cpus}
            </span>
          </ResourceMeter>
          <ResourceMeter
            decLabel="Less memory"
            incLabel="More memory"
            label="MEMORY"
            on={Number(ram ?? 1)}
            onChange={onRamMeterChange}
            outputClassName="text-xl"
            total={machineInfo?.ram ?? 1}
          >
            {ram ?? 1}{' '}
            <span className="text-phosphor-dim">GiB / {machineInfo?.ram}</span>
          </ResourceMeter>
          <ResourceMeter
            decLabel="Smaller disk"
            incLabel="Bigger disk"
            label="DISK"
            on={Number(disk ?? 100)}
            onChange={onDiskMeterChange}
            outputClassName="text-xl"
            step={10}
            total={machineInfo?.diskSpace ?? 100}
          >
            {disk} <span className="text-phosphor-dim">GiB</span>
          </ResourceMeter>
        </div>
      </div>
      <CheckboxRow
        checked={nestedVirtualization}
        className="gap-2.5"
        hint="lets this VM run VMs of its own"
        label="NESTED VIRTUALIZATION"
        onCheckedChange={onNestedVirtualizationChange}
      />
    </CrtSection>
  );
}
