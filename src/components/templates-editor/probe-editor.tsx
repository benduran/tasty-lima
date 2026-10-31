import { Button } from '../ui/button.tsx';
import { Input } from '../ui/input.tsx';
import { Textarea } from '../ui/textarea.tsx';

export type Probe = {
  description: string;
  hint: string;
  script: string;
};

export function ProbeEditor({ probe }: { probe: Probe }) {
  return (
    <div className="flex flex-col gap-2 border border-phosphor-line p-3">
      <div className="grid grid-cols-[minmax(0,1fr)_44px] gap-2">
        <Input
          aria-label="Probe 1 description"
          defaultValue={probe.description}
        />
        <Button
          aria-label="Remove probe 1"
          className="w-11 px-0"
          type="button"
          variant="outline"
        >
          X
        </Button>
      </div>
      <Textarea
        aria-label="Probe 1 script"
        defaultValue={probe.script}
        rows={3}
        spellCheck={false}
      />
      <Input
        aria-label="Probe 1 hint"
        defaultValue={probe.hint}
        placeholder="Hint shown if the probe fails"
      />
    </div>
  );
}
