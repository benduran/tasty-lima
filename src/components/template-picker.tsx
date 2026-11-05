import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import type {
  LimaTemplateSummary,
  MachineInfo,
  Nullish,
} from '../shared/types.ts';
import { arrayHasItems } from '../shared/util.ts';
import { CheckboxRow } from './checkbox-row.tsx';
import { CrtFieldset, CrtOption } from './crt.tsx';
import { PromptSearch } from './prompt-search.tsx';
import { RadioGroup, RadioGroupItem } from './ui/radio-group.tsx';

export function templateUnavailableReason(
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
  error: Nullish<Error>;
  isPending: boolean;
  machineInfo: Nullish<MachineInfo>;
  onSelect: (name: string) => void;
  selected: Nullish<string>;
  templates: Nullish<LimaTemplateSummary[]>;
};

export function TemplatePicker({
  error,
  isPending,
  machineInfo,
  onSelect,
  selected,
  templates,
}: TemplatePickerProps) {
  /** state */
  const [filter, setFilter] = useState('');
  const [showExperimental, setShowExperimental] = useState(false);

  /** memos */
  const visible = useMemo(() => {
    const lowerFilter = filter.trim().toLowerCase();

    return templates?.filter(tpl => {
      if (tpl.experimental && !showExperimental && tpl.name !== selected) {
        return false;
      }
      return tpl.name.toLowerCase().includes(lowerFilter);
    });
  }, [filter, selected, showExperimental, templates]);

  let body: ReactNode;
  if (isPending) {
    body = <p className="text-phosphor-dim">LOADING TEMPLATES...</p>;
  } else if (error) {
    body = (
      <p className="text-destructive">
        COULD NOT LIST TEMPLATES: {error.message}
      </p>
    );
  } else if (!arrayHasItems(visible)) {
    body = <p className="text-phosphor-dim uppercase">NO TEMPLATES MATCH</p>;
  } else {
    body = (
      <RadioGroup
        className="grid max-h-90 grid-cols-[repeat(auto-fill,minmax(min(220px,100%),1fr))] gap-2 overflow-y-auto pr-1"
        onValueChange={val => {
          if (typeof val === 'string') onSelect(val);
        }}
        value={selected ?? ''}
      >
        {visible.map(tpl => {
          const reason = templateUnavailableReason(tpl.name, machineInfo);

          return (
            <CrtOption
              className="items-start py-2.5"
              key={tpl.name}
              off={Boolean(reason)}
              sel={tpl.name === selected}
            >
              <RadioGroupItem
                className="mt-1.5"
                disabled={Boolean(reason)}
                value={tpl.name}
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[22px] wrap-anywhere">{tpl.name}</span>
                {reason && <span className="text-phosphor-dim">{reason}</span>}
              </span>
            </CrtOption>
          );
        })}
      </RadioGroup>
    );
  }

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
        <PromptSearch
          htmlFor="template-filter"
          onChange={e => setFilter(e.currentTarget.value)}
          placeholder="ubuntu, docker, k8s..."
          prompt="FIND>"
          value={filter}
        />
        <CheckboxRow
          checked={showExperimental}
          className="gap-2.5"
          label="SHOW EXPERIMENTAL"
          onCheckedChange={setShowExperimental}
        />
      </div>
      {body}
    </CrtFieldset>
  );
}
