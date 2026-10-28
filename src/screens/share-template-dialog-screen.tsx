import { Link } from 'wouter';
import { CrtFieldset, CrtKey, CrtOption } from '@/components/crt.tsx';
import { CrtDialog } from '@/components/crt-dialog.tsx';
import { Button, buttonVariants } from '@/components/ui/button.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Input } from '@/components/ui/input.tsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx';
import { cn } from '@/lib/utils.ts';
import { uiRoutes } from '@/routes/ui.ts';

const RUN_CMD = '$ limactl start github:ben/lima-templates/devbox@v1.0.0';

const SHARE_STEPS = `limactl template validate template:devbox
limactl template copy --embed-all template:devbox devbox.yaml
git -C lima-templates commit -m "devbox template" devbox.yaml
git -C lima-templates tag v1.0.0 && git push --tags`;

/* Share template dialog: publish a template to GitHub or as one file. */
export function ShareTemplateDialogScreen() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <CrtDialog
        className="max-w-190"
        footer={
          <>
            <span className="mr-auto text-phosphor-dim">
              Publishes with your gh login
            </span>
            <Link
              className={cn(buttonVariants({ variant: 'ghost' }))}
              href={uiRoutes.templates()}
            >
              Close
            </Link>
            <Button
              className="min-w-50 text-[22px]"
              type="button"
              variant="default"
            >
              Publish
            </Button>
          </>
        }
        title="SHARE TEMPLATE: devbox"
      >
        <CrtFieldset legend="HOW">
          <RadioGroup className="grid grid-cols-2 gap-2" defaultValue="github">
            <CrtOption className="items-start py-2.5" sel>
              <RadioGroupItem value="github" />
              <span className="flex flex-col gap-0.5">
                <span className="text-[24px]">GITHUB LINK</span>
                <span className="text-phosphor-dim">
                  Short github: locator. Lima 2.0+, experimental.
                </span>
              </span>
            </CrtOption>
            <CrtOption className="items-start py-2.5">
              <RadioGroupItem value="file" />
              <span className="flex flex-col gap-0.5">
                <span className="text-[24px]">SINGLE FILE</span>
                <span className="text-phosphor-dim">
                  One .yaml to send or host anywhere.
                </span>
              </span>
            </CrtOption>
          </RadioGroup>
        </CrtFieldset>

        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                className="tracking-[0.08em] text-phosphor-dim"
                htmlFor="sh-repo"
              >
                REPOSITORY
              </label>
              <Input
                autoComplete="off"
                defaultValue="ben/lima-templates"
                id="sh-repo"
                spellCheck={false}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="tracking-[0.08em] text-phosphor-dim"
                htmlFor="sh-path"
              >
                PATH (.yaml ADDED)
              </label>
              <Input
                autoComplete="off"
                defaultValue="devbox"
                id="sh-path"
                spellCheck={false}
              />
            </div>
          </div>
          <span className="flex min-h-11 cursor-pointer items-center gap-3">
            <Checkbox />
            <span>PUBLISH AS THE REPO DEFAULT (.lima.yaml)</span>
          </span>
          <CrtFieldset legend="VERSION">
            <RadioGroup
              className="flex flex-wrap items-center gap-2"
              defaultValue="tag"
            >
              <CrtOption>
                <RadioGroupItem value="latest" />
                <span>DEFAULT BRANCH</span>
              </CrtOption>
              <CrtOption sel>
                <RadioGroupItem value="tag" />
                <span>TAG</span>
              </CrtOption>
              <Input
                aria-label="Tag"
                className="w-35"
                defaultValue="v1.0.0"
                spellCheck={false}
              />
            </RadioGroup>
          </CrtFieldset>
        </div>

        <span className="flex cursor-pointer items-start gap-3 py-1">
          <Checkbox defaultChecked />
          <span className="flex flex-col gap-0.5">
            <span>EMBED BASE TEMPLATES TOO (--embed-all)</span>
            <span className="text-phosphor-dim">
              Inlines template:_images/ubuntu and template:_default/mounts, so
              it behaves the same on any Lima version.
            </span>
          </span>
        </span>

        <div className="flex flex-col gap-1.5">
          <span className="tracking-[0.08em] text-phosphor-dim">
            RECIPIENTS RUN
          </span>
          <div className="flex items-stretch gap-2">
            <code className="flex min-w-0 flex-1 items-center overflow-x-auto border border-primary px-3 text-[22px] whitespace-nowrap">
              {RUN_CMD}
            </code>
            <Button
              aria-label="Copy recipient command"
              type="button"
              variant="outline"
            >
              Copy
            </Button>
          </div>
          <p className="wrap-anywhere text-phosphor-dim">
            RESOLVES TO
            https://raw.githubusercontent.com/ben/lima-templates/v1.0.0/devbox.yaml
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="tracking-[0.08em] text-phosphor-dim">
            THIS WILL RUN
          </span>
          <pre className="overflow-x-auto border border-dashed border-phosphor-dim px-3 py-2.5 leading-tight whitespace-pre">
            {SHARE_STEPS}
          </pre>
        </div>

        <p className="border border-phosphor-line px-3 py-2">
          <CrtKey>NOTE</CrtKey> Provision scripts run as root in the recipient's
          VM. Ask people to read a template before starting it.
        </p>
      </CrtDialog>
    </main>
  );
}
