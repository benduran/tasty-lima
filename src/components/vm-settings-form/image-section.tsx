import { kebabCase } from 'change-case';
import type { ChangeEvent, FocusEvent } from 'react';
import type { LimaTemplateSummary } from '../../shared/codecs.ts';
import type {
  LimaArch,
  LimaVMType,
  MachineInfo,
  Nullish,
} from '../../shared/types.ts';
import { LimaArchSchema } from '../../shared/types.ts';
import { CrtFieldset, CrtOption, CrtSection } from '../crt.tsx';
import { LabeledField } from '../labeled-field.tsx';
import { TemplatePicker } from '../template-picker.tsx';
import { Input } from '../ui/input.tsx';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group.tsx';

type ImageSectionProps = {
  arch: Nullish<LimaArch>;
  currentMachineArch: Nullish<LimaArch>;
  editing: boolean;
  machineInfo: Nullish<MachineInfo>;
  name: Nullish<string>;
  onArchChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onTemplateSelect: (templateName: string) => void;
  onVmTypeChange: (value: string) => void;
  selectedTemplate: Nullish<string>;
  templates: Nullish<LimaTemplateSummary[]>;
  templatesPending: boolean;
  vmType: Nullish<LimaVMType>;
  vmTypes: Array<{ desc: string; value: LimaVMType }>;
  vzOff: boolean;
};

export function ImageSection({
  arch,
  currentMachineArch,
  editing,
  machineInfo,
  name,
  onArchChange,
  onNameChange,
  onTemplateSelect,
  onVmTypeChange,
  selectedTemplate,
  templates,
  templatesPending,
  vmType,
  vmTypes,
  vzOff,
}: ImageSectionProps) {
  return (
    <CrtSection contentClassName="flex flex-col gap-5 p-5" title="[1] IMAGE">
      <LabeledField
        className="max-w-105"
        htmlFor="vm-name"
        label="INSTANCE NAME"
      >
        <Input
          autoComplete="off"
          disabled={editing}
          id="vm-name"
          onBlur={(event: FocusEvent<HTMLInputElement>) =>
            onNameChange(kebabCase(event.currentTarget.value))
          }
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onNameChange(event.target.value)
          }
          placeholder="eg. dev-box, ubuntu-24"
          spellCheck={false}
          value={name || ''}
        />
      </LabeledField>
      {!editing && (
        <TemplatePicker
          isPending={templatesPending}
          machineInfo={machineInfo}
          onSelect={onTemplateSelect}
          selected={selectedTemplate}
          templates={templates}
          vmType={vmType}
        />
      )}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-x-5 gap-y-5">
        <CrtFieldset legend="ARCH">
          <RadioGroup
            className="flex flex-col gap-2"
            disabled={editing}
            onValueChange={onArchChange}
            value={arch ?? ''}
          >
            {LimaArchSchema.options.map(archOpt => (
              <CrtOption key={archOpt} sel={archOpt === arch}>
                <RadioGroupItem value={archOpt} />
                <span>{archOpt}</span>
                <span className="ml-auto text-phosphor-dim">
                  {currentMachineArch === archOpt ? 'native' : 'emulated'}
                </span>
              </CrtOption>
            ))}
          </RadioGroup>
        </CrtFieldset>
        <CrtFieldset legend="VM TYPE">
          <RadioGroup
            className="flex flex-col gap-2"
            onValueChange={onVmTypeChange}
            value={vmType ?? ''}
          >
            {vmTypes.map(vmTypeOpt => (
              <CrtOption
                key={vmTypeOpt.value}
                off={vmTypeOpt.value === 'vz' && vzOff}
                sel={vmTypeOpt.value === vmType}
              >
                <RadioGroupItem
                  disabled={vmTypeOpt.value === 'vz' && vzOff}
                  value={vmTypeOpt.value}
                />
                <span>{vmTypeOpt.value}</span>
                <span className="ml-auto text-phosphor-dim">
                  {vmTypeOpt.desc}
                </span>
              </CrtOption>
            ))}
          </RadioGroup>
        </CrtFieldset>
      </div>
    </CrtSection>
  );
}
