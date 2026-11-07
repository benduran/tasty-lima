import type { ReactNode } from 'react';
import { useMemo } from 'react';
import {
  BOOT_SCRIPT_EXAMPLE,
  SYSTEM_SCRIPT_EXAMPLE,
} from '../shared/lima-yaml.ts';
import type { LimaProvision } from '../shared/types.ts';
import { Button } from './ui/button.tsx';
import { Textarea } from './ui/textarea.tsx';

type ProvisionScriptsTableProps = {
  onAddScript: (isBoot: boolean) => void;
  onChangeScript: (index: number, script: string) => void;
  onRemoveScript: (index: number) => void;
  provision: LimaProvision[];
};

export function ProvisionScriptsTable({
  onAddScript,
  onChangeScript,
  onRemoveScript,
  provision,
}: ProvisionScriptsTableProps) {
  /** memos */
  const { boot, external, system } = useMemo(() => {
    const out: Record<
      'boot' | 'external' | 'system',
      { entry: LimaProvision; index: number }[]
    > = {
      boot: [],
      external: [],
      system: [],
    };

    provision.forEach((entry, index) => {
      const toPush = { entry, index };
      if (typeof entry.script !== 'string') {
        out.external.push(toPush);
      } else if (entry.mode === 'boot') {
        out.boot.push(toPush);
      } else {
        out.system.push(toPush);
      }
    });

    return out;
  }, [provision]);

  return (
    <div className="flex flex-col gap-5">
      <ScriptGroup
        example={BOOT_SCRIPT_EXAMPLE}
        hint="Runs on every boot, early, as /bin/sh"
        onAdd={() => onAddScript(true)}
        onChange={onChangeScript}
        onRemove={onRemoveScript}
        rows={boot}
        title="PRE-VM-BOOT"
      />
      <ScriptGroup
        example={SYSTEM_SCRIPT_EXAMPLE}
        hint="Runs as root on every boot, after Lima's packages"
        onAdd={() => onAddScript(false)}
        onChange={onChangeScript}
        onRemove={onRemoveScript}
        rows={system}
        title="POST-BOOT (FIRST-USE SETUP)"
      />
      {external.map(({ entry, index }) => (
        <div className="text-phosphor-dim" key={`external-${index}`}>
          ENTRY {index}: non-inline provision script (
          {entry.file ? 'file' : 'other'}) is kept as-is
        </div>
      ))}
    </div>
  );
}

type ScriptGroupProps = {
  example: string;
  fieldLabel?: ReactNode;
  hint: string;
  onAdd: () => void;
  onChange: (index: number, script: string) => void;
  onRemove: (index: number) => void;
  rows: Array<{ entry: LimaProvision; index: number }>;
  title: string;
};

function ScriptGroup({
  example,
  fieldLabel,
  hint,
  onAdd,
  onChange,
  onRemove,
  rows,
  title,
}: ScriptGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between tracking-[0.08em]">
        <span>{title}</span>
        <span className="text-sm text-phosphor-dim">{hint}</span>
      </div>
      {rows.map(({ entry, index }) => (
        <div className="flex items-start gap-2" key={`provision-${index}`}>
          {fieldLabel && (
            <span
              aria-hidden="true"
              className="pt-3.5 tracking-[0.08em] text-phosphor-dim"
            >
              {fieldLabel}
            </span>
          )}
          <Textarea
            aria-label={`${title} script ${index + 1}`}
            className="min-h-26"
            onChange={e => onChange(index, e.currentTarget.value)}
            placeholder={example}
            spellCheck={false}
            value={entry.script ?? ''}
          />
          <Button
            aria-label={`Remove ${title.toLowerCase()} script ${index + 1}`}
            className="w-11 px-0"
            onClick={() => onRemove(index)}
            type="button"
            variant="outline"
          >
            X
          </Button>
        </div>
      ))}
      <div>
        <Button onClick={onAdd} type="button" variant="outline">
          + Add script
        </Button>
      </div>
    </div>
  );
}

export function isPlaceholderProvision(entry: LimaProvision): boolean {
  const trimmed = entry.script?.trim();
  return (
    !trimmed ||
    trimmed === BOOT_SCRIPT_EXAMPLE ||
    trimmed === SYSTEM_SCRIPT_EXAMPLE
  );
}
