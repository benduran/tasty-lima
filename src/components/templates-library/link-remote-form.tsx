import { Button } from '../ui/button.tsx';
import { Input } from '../ui/input.tsx';

export function LinkRemoteForm({
  defaultValue,
  hint,
  placeholder,
}: {
  defaultValue?: string;
  hint: string;
  placeholder?: string;
}) {
  return (
    <section className="flex flex-col gap-2 border border-dashed border-phosphor-dim p-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex-none" htmlFor="imp-url">
          LINK REMOTE&gt;
        </label>
        <Input
          autoComplete="off"
          className="w-auto flex-[1_1_360px]"
          defaultValue={defaultValue}
          id="imp-url"
          placeholder={placeholder}
          spellCheck={false}
        />
        <Button type="button" variant="outline">
          Link
        </Button>
      </div>
      <p className="wrap-anywhere text-phosphor-dim">{hint}</p>
    </section>
  );
}
