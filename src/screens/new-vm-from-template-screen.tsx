import { Link } from 'wouter';
import { CrtKey } from '@/components/crt';
import { CrtDialog } from '@/components/crt-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { uiRoutes } from '@/routes/ui';

const PARAMS = [
  {
    changed: true,
    hint: 'default: 1.25.0',
    id: 'prm-goVersion',
    k: 'goVersion',
    v: '1.24.6',
  },
  {
    changed: false,
    hint: 'used by provision step 2 ($PARAM_dotfiles)',
    id: 'prm-dotfiles',
    k: 'dotfiles',
    v: 'https://github.com/ben/dotfiles',
  },
] as const;

const LAUNCH_CMD = `limactl start --name=devbox \\
  --param goVersion=1.24.6 \\
  template:devbox`;

/* New VM from template dialog: name, parameters and optional overrides. */
export function NewVmFromTemplateScreen() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <CrtDialog
        className="max-w-180"
        footer={
          <>
            <Link
              className={cn(buttonVariants({ variant: 'ghost' }))}
              href={uiRoutes.templates()}
            >
              Cancel
            </Link>
            <Button
              className="min-w-50 text-[22px]"
              type="button"
              variant="default"
            >
              Create + start
            </Button>
          </>
        }
        title="NEW VM FROM TEMPLATE"
      >
        <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5">
          <span className="w-24 tracking-[0.08em] text-phosphor-dim">
            TEMPLATE
          </span>
          <span className="text-[30px] leading-none">template:devbox</span>
          <span className="text-phosphor-dim">
            ubuntu · 4 CPU · 8 GiB · 3 STEPS
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            className="tracking-[0.08em] text-phosphor-dim"
            htmlFor="ln-name"
          >
            VM NAME
          </label>
          <Input
            aria-describedby="ln-msg"
            autoComplete="off"
            defaultValue="devbox"
            id="ln-name"
            spellCheck={false}
          />
          <p id="ln-msg">OK -&gt; ~/.lima/devbox</p>
        </div>

        <div className="flex flex-col gap-2.5">
          <p className="flex justify-between tracking-[0.08em] text-phosphor-dim">
            <span>PARAMETERS</span>
            <span>1 CHANGED</span>
          </p>
          {PARAMS.map(param => (
            <div
              className="grid grid-cols-[130px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2"
              key={param.k}
            >
              <label htmlFor={param.id}>{param.k}</label>
              <Input
                autoComplete="off"
                defaultValue={param.v}
                id={param.id}
                spellCheck={false}
              />
              <Button
                aria-label={`Reset ${param.k} to default`}
                disabled={!param.changed}
                type="button"
                variant="ghost"
              >
                Reset
              </Button>
              <span />
              <p className="col-span-2 wrap-anywhere">
                {param.changed ? (
                  <CrtKey>CHANGED</CrtKey>
                ) : (
                  <span className="px-1.25 text-phosphor-dim whitespace-nowrap">
                    DEFAULT
                  </span>
                )}{' '}
                <span className="text-phosphor-dim">{param.hint}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="flex min-h-11 cursor-pointer items-center gap-3">
            <Checkbox />
            <span>OVERRIDE RESOURCES</span>
            <span className="text-phosphor-dim">TEMPLATE: 4 CPU · 8 GiB</span>
          </span>
        </div>

        <span className="flex min-h-11 cursor-pointer items-center gap-3">
          <Checkbox defaultChecked />
          <span>START AFTER CREATE</span>
        </span>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="tracking-[0.08em] text-phosphor-dim">
              EQUIVALENT COMMAND
            </span>
            <Button aria-label="Copy command" type="button" variant="ghost">
              Copy
            </Button>
          </div>
          <pre className="overflow-x-auto border border-dashed border-phosphor-dim px-3 py-2.5 leading-tight whitespace-pre">
            {LAUNCH_CMD}
          </pre>
        </div>
      </CrtDialog>
    </main>
  );
}
