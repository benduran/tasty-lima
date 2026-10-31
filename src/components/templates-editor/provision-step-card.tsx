import { CrtKey, CrtOption } from '../crt.tsx';
import { PressButtonGroup } from '../press-button-group.tsx';
import { Button } from '../ui/button.tsx';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group.tsx';
import { Textarea } from '../ui/textarea.tsx';

export type ProvisionStep = {
  caret: string;
  mode: string;
  n: number;
  open?: boolean;
  summary: string;
};

export function ProvisionStepCard({
  isLast,
  modes,
  script,
  step,
}: {
  isLast?: boolean;
  modes: readonly string[];
  script: string;
  step: ProvisionStep;
}) {
  return (
    <div className="border border-phosphor-line">
      <div className="flex flex-wrap items-center gap-2 px-2 py-1.5">
        <Button
          aria-expanded={step.open}
          className="normal-case"
          type="button"
          variant="ghost"
        >
          {step.caret} STEP {step.n}
        </Button>
        <CrtKey>{step.mode}</CrtKey>
        <span className="min-w-0 flex-1 basis-50 wrap-anywhere text-phosphor-dim">
          {step.summary}
        </span>
        <Button
          aria-label={`Move step ${step.n} up`}
          className="w-11 px-0"
          disabled={step.n === 1}
          type="button"
          variant="outline"
        >
          ^
        </Button>
        <Button
          aria-label={`Move step ${step.n} down`}
          className="w-11 px-0"
          disabled={isLast}
          type="button"
          variant="outline"
        >
          v
        </Button>
        <Button
          aria-label={`Remove step ${step.n}`}
          className="w-11 px-0"
          type="button"
          variant="outline"
        >
          X
        </Button>
      </div>
      {step.open && (
        <div className="flex flex-col gap-3 border-t border-phosphor-line p-3">
          <PressButtonGroup
            aria-label={`Step ${step.n} mode`}
            className="gap-1.5"
            itemClassName="normal-case"
            items={modes.map(mode => ({ id: mode, label: mode }))}
            value={step.mode}
          />
          <p className="text-phosphor-dim">
            Runs as root on every boot. Must be idempotent.
          </p>
          <div className="flex flex-col gap-2.5">
            <RadioGroup
              className="flex flex-wrap gap-2"
              defaultValue={`inline-${step.n}`}
            >
              <CrtOption sel>
                <RadioGroupItem value={`inline-${step.n}`} />
                <span>INLINE SCRIPT</span>
              </CrtOption>
              <CrtOption>
                <RadioGroupItem value={`file-${step.n}`} />
                <span>FROM FILE</span>
              </CrtOption>
            </RadioGroup>
            <Textarea
              aria-label={`Step ${step.n} script`}
              defaultValue={script}
              rows={8}
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
