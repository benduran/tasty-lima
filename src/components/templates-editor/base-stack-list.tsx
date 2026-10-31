import { Button } from '../ui/button.tsx';
import { Input } from '../ui/input.tsx';

export type QuickBase = {
  has?: boolean;
  loc: string;
};

export function BaseStackList({
  quickAdd,
  rows,
}: {
  quickAdd: readonly QuickBase[];
  rows: readonly string[];
}) {
  return (
    <>
      <p className="text-phosphor-dim">
        This template overrides its bases. Lists such as mounts and provision
        are combined; maps such as env merge key by key.
      </p>
      {rows.map((loc, i) => (
        <div
          className="grid grid-cols-[28px_minmax(0,1fr)_44px_44px_44px] items-center gap-2"
          key={loc}
        >
          <span className="text-phosphor-dim">{i + 1}.</span>
          <code className="flex min-h-11 items-center overflow-x-auto border border-phosphor-line px-3 whitespace-nowrap">
            {loc}
          </code>
          <Button
            aria-label={`Move ${loc} up`}
            className="w-11 px-0"
            disabled={i === 0}
            type="button"
            variant="outline"
          >
            ^
          </Button>
          <Button
            aria-label={`Move ${loc} down`}
            className="w-11 px-0"
            disabled={i === rows.length - 1}
            type="button"
            variant="outline"
          >
            v
          </Button>
          <Button
            aria-label={`Remove ${loc}`}
            className="w-11 px-0"
            type="button"
            variant="outline"
          >
            X
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Input
          aria-label="Base locator to add"
          className="w-auto flex-[1_1_320px]"
          placeholder="template:docker, github:..., ./base.yaml"
          spellCheck={false}
        />
        <Button type="button" variant="outline">
          + Add base
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-phosphor-dim">QUICK ADD</span>
        {quickAdd.map(quick => (
          <Button
            className="border-phosphor-line normal-case"
            disabled={quick.has}
            key={quick.loc}
            type="button"
            variant="ghost"
          >
            {quick.loc}
          </Button>
        ))}
      </div>
    </>
  );
}
