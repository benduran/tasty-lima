import { useMemo, useState } from 'react';
import type {
  LimaTemplateSummary,
  MachineInfo,
  Nullish,
} from '../shared/types.ts';
import { isNullOrUndefined } from '../shared/util.ts';
import type { AutocompleteItem } from './autocomplete.tsx';
import { Autocomplete } from './autocomplete.tsx';
import { CheckboxRow } from './checkbox-row.tsx';
import { CrtFieldset } from './crt.tsx';

function templateUnavailableReason(
  name: string,
  machineInfo: Nullish<MachineInfo>,
): Nullish<string> {
  if (!machineInfo) return null;

  if (/^macos(-|$)/.test(name)) {
    return machineInfo.platform === 'darwin' && machineInfo.arch === 'arm64'
      ? null
      : 'needs a macOS host on Apple silicon';
  }

  if (name === 'experimental/wsl2') {
    return machineInfo.platform === 'win32' ? null : 'needs a Windows host';
  }

  return null;
}

type TemplatePickerProps = {
  isPending: boolean;
  machineInfo: Nullish<MachineInfo>;
  onSelect: (name: string) => void;
  selected: Nullish<string>;
  templates: Nullish<LimaTemplateSummary[]>;
};

export function TemplatePicker({
  isPending,
  machineInfo,
  onSelect,
  selected,
  templates,
}: TemplatePickerProps) {
  /** state */
  const [showExperimental, setShowExperimental] = useState(false);

  /** memos */
  const options = useMemo<AutocompleteItem<string>[]>(
    () =>
      templates
        ?.filter(t => showExperimental || !t.experimental)
        .map(t => {
          const unavailableReason = templateUnavailableReason(
            t.name,
            machineInfo,
          );

          return {
            id: t.name,
            label: (
              <div className="flex flex-col gap-1">
                {t.name}
                {unavailableReason && (
                  <span className="text-phosphor-dim pl-4">
                    {unavailableReason}
                  </span>
                )}
              </div>
            ),
            value: t.name,
          };
        }) ?? [],
    [templates, showExperimental, machineInfo],
  );

  const selectedOpt = useMemo(() => {
    if (isNullOrUndefined(selected)) return null;
    return options.find(opt => opt.value === selected) ?? null;
  }, [options, selected]);

  return (
    <CrtFieldset
      legend={
        <>
          TEMPLATE
          {selected && <span className="text-phosphor-dim"> · {selected}</span>}
        </>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Autocomplete
          items={options}
          loading={isPending}
          onChange={s => onSelect(s?.value || '')}
          value={selectedOpt}
        />
        <CheckboxRow
          checked={showExperimental}
          className="gap-2.5"
          label="SHOW EXPERIMENTAL"
          onCheckedChange={setShowExperimental}
        />
      </div>
    </CrtFieldset>
  );
}
