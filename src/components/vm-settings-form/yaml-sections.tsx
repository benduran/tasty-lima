import type { Nullish } from '../../shared/types.ts';
import { LIMA_TYPES_VERSION } from '../../shared/types.ts';
import { CrtKey, CrtSection } from '../crt.tsx';
import { LabeledField } from '../labeled-field.tsx';
import { Input } from '../ui/input.tsx';
import { Textarea } from '../ui/textarea.tsx';

type YamlNameSectionProps = {
  name: Nullish<string>;
  onNameChange: (value: string) => void;
};

export function YamlNameSection({ name, onNameChange }: YamlNameSectionProps) {
  return (
    <CrtSection contentClassName="flex flex-col gap-5 p-5" title="[1] NAME">
      <LabeledField
        className="max-w-105"
        htmlFor="vm-name"
        label="INSTANCE NAME"
      >
        <Input
          autoComplete="off"
          id="vm-name"
          onChange={e => onNameChange(e.target.value)}
          placeholder="eg. dev-box, ubuntu-24"
          spellCheck={false}
          value={name || ''}
        />
      </LabeledField>
    </CrtSection>
  );
}

type YamlValidationSectionProps = {
  /** prettified zod error from decoding the raw YAML, or null when it parses */
  error: Nullish<string>;
};

export function YamlValidationSection({ error }: YamlValidationSectionProps) {
  return (
    <CrtSection
      contentClassName="flex flex-col gap-3 p-5"
      label={error ? 'ERR' : 'OK'}
      title="VALIDATE"
    >
      {error ? (
        <p className="text-destructive whitespace-pre-wrap" role="status">
          {error}
        </p>
      ) : (
        <p role="status">
          <CrtKey>OK</CrtKey> conforms to lima {LIMA_TYPES_VERSION}
        </p>
      )}
    </CrtSection>
  );
}

type RawYamlSectionProps = {
  onRawYamlChange: (yaml: string) => void;
  rawYaml: Nullish<string>;
};

export function RawYamlSection({
  onRawYamlChange,
  rawYaml,
}: RawYamlSectionProps) {
  return (
    <CrtSection
      contentClassName="flex flex-col gap-3 p-5"
      title="RAW LIMA.YAML"
    >
      <Textarea
        aria-label="Raw lima.yaml config"
        className="min-h-150 text-sm"
        id="raw-yaml"
        onChange={e => onRawYamlChange(e.currentTarget.value)}
        spellCheck={false}
        value={rawYaml ?? ''}
        wrap="off"
      />
      <p className="text-phosphor-dim">
        YAML may use anything lima v{LIMA_TYPES_VERSION} accepts. Create stays
        disabled until it validates.
      </p>
    </CrtSection>
  );
}
