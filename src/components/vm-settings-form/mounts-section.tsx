import { Fragment } from 'react';
import type { LimaMount, LimaMountType, Nullish } from '../../shared/types.ts';
import { LimaMountTypeSchema } from '../../shared/types.ts';
import { CrtFieldset, CrtOption, CrtSection } from '../crt.tsx';
import { MountsTable } from '../mounts-table.tsx';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group.tsx';

type MountsSectionProps = {
  mountType: Nullish<LimaMountType>;
  mounts: LimaMount[];
  onAddMount: () => void;
  onChangeMount: (index: number, mount: LimaMount) => void;
  onMountTypeChange: (value: string) => void;
  onRemoveMount: (index: number) => void;
};

export function MountsSection({
  mountType,
  mounts,
  onAddMount,
  onChangeMount,
  onMountTypeChange,
  onRemoveMount,
}: MountsSectionProps) {
  return (
    <CrtSection contentClassName="flex flex-col gap-4 p-5" title="[3] MOUNTS">
      <CrtFieldset legend="MOUNT TYPE">
        <RadioGroup
          onValueChange={onMountTypeChange}
          value={mountType ?? 'auto'}
        >
          <CrtOption sel>
            <Fragment key="auto">
              <RadioGroupItem id="auto" value="auto" />
              <label className="hover:cursor-pointer" htmlFor="auto">
                auto
              </label>
            </Fragment>
            {LimaMountTypeSchema.options.map(mountTypeOpt => (
              <Fragment key={mountTypeOpt}>
                <RadioGroupItem
                  className="not-first:ml-4"
                  id={mountTypeOpt}
                  value={mountTypeOpt}
                />
                <label className="hover:cursor-pointer" htmlFor={mountTypeOpt}>
                  {mountTypeOpt}
                </label>
              </Fragment>
            ))}
          </CrtOption>
        </RadioGroup>
      </CrtFieldset>
      <MountsTable
        mounts={mounts}
        onAddMount={onAddMount}
        onChangeMount={onChangeMount}
        onRemoveMount={onRemoveMount}
      />
    </CrtSection>
  );
}
