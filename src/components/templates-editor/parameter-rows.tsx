import { Button } from '../ui/button.tsx';
import { Input } from '../ui/input.tsx';

export type ParameterRow = {
  k: string;
  usage: string;
  v: string;
};

export function ParameterRows({ params }: { params: readonly ParameterRow[] }) {
  return (
    <>
      <div
        aria-hidden="true"
        className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_44px] gap-2 tracking-[0.08em] text-phosphor-dim"
      >
        <span>KEY</span>
        <span>DEFAULT VALUE</span>
        <span />
      </div>
      {params.map(param => (
        <div className="flex flex-col gap-1" key={param.k}>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_44px] items-center gap-2">
            <Input
              aria-label={`Parameter ${param.k} key`}
              defaultValue={param.k}
              spellCheck={false}
            />
            <Input
              aria-label={`Parameter ${param.k} default`}
              defaultValue={param.v}
              spellCheck={false}
            />
            <Button
              aria-label={`Remove parameter ${param.k}`}
              className="w-11 px-0"
              type="button"
              variant="outline"
            >
              X
            </Button>
          </div>
          <p className="wrap-anywhere text-phosphor-dim">{param.usage}</p>
        </div>
      ))}
    </>
  );
}
