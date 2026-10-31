import { Link } from 'wouter';
import { cn } from '../../lib/utils.ts';
import { uiRoutes } from '../../routes/ui.ts';
import { CopyCommandRow } from '../command-preview.tsx';
import { CrtKey } from '../crt.tsx';
import { Panel } from '../panel.tsx';
import { PressButtonGroup } from '../press-button-group.tsx';
import { Button, buttonVariants } from '../ui/button.tsx';

export type TemplateParameter = {
  k: string;
  v: string;
};

export function TemplateDetailPanel({
  baseStack,
  className,
  defines,
  description,
  locator,
  name,
  parameters,
  source,
  yaml,
}: {
  baseStack: readonly string[];
  className?: string;
  defines: readonly string[];
  description: string;
  locator: string;
  name: string;
  parameters: readonly TemplateParameter[];
  source: string;
  yaml: string;
}) {
  return (
    <Panel className={className} meta={source} title={`TEMPLATE: ${name}`}>
      <div className="flex flex-1 flex-col gap-4.5 p-5">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <span className="text-[44px] leading-none">{name}</span>
          <span className="text-phosphor-dim">{description}</span>
        </div>

        <CopyCommandRow copyLabel="Copy locator">{locator}</CopyCommandRow>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-x-8 gap-y-4">
          <div className="flex flex-col gap-1.5">
            <h3 className="tracking-[0.08em] text-phosphor-dim">BASE STACK</h3>
            {baseStack.map((loc, i) => (
              <p className="wrap-anywhere" key={loc}>
                <span className="text-phosphor-dim">{i + 1}.</span> {loc}
              </p>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <h3 className="tracking-[0.08em] text-phosphor-dim">PARAMETERS</h3>
            {parameters.map(param => (
              <p className="flex justify-between gap-3" key={param.k}>
                <span>{param.k}</span>
                <span className="text-right text-phosphor-dim wrap-anywhere">
                  {param.v}
                </span>
              </p>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <h3 className="tracking-[0.08em] text-phosphor-dim">DEFINES</h3>
            {defines.map(def => (
              <p key={def}>{def}</p>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border border-phosphor-line px-3 py-2">
          <CrtKey>VALID</CrtKey>
          <span className="wrap-anywhere">Template parses and resolves.</span>
          <span className="ml-auto text-phosphor-dim">
            limactl template validate
          </span>
        </div>

        <div className="flex flex-col border border-phosphor-line">
          <div className="flex flex-wrap items-center gap-2 border-b border-phosphor-line px-2 py-1.5">
            <PressButtonGroup
              aria-label="YAML view"
              className="gap-1.5"
              items={[
                { id: 'written', label: 'As written', selected: true },
                { id: 'resolved', label: 'Resolved' },
              ]}
            />
            <span className="ml-auto text-phosphor-dim">as saved</span>
          </div>
          <pre className="h-90 overflow-auto px-3.5 py-3 leading-tight whitespace-pre">
            {yaml}
          </pre>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-phosphor-line px-5 py-3.5">
        <Link
          className={cn(buttonVariants({ size: 'lg', variant: 'default' }))}
          href={uiRoutes.templateLaunch(name)}
        >
          New VM from this
        </Link>
        <Link
          className={cn(buttonVariants({ variant: 'outline' }))}
          href={uiRoutes.templateEdit(name)}
        >
          Edit
        </Link>
        <Link
          className={cn(buttonVariants({ variant: 'outline' }))}
          href={uiRoutes.templateShare(name)}
        >
          Share
        </Link>
        <Button type="button" variant="outline">
          Duplicate
        </Button>
        <Button className="ml-auto" type="button" variant="outline">
          Delete
        </Button>
      </div>
    </Panel>
  );
}
