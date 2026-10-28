import { AppFooter } from '../components/app-footers.tsx';
import { CrtCursor, CrtSection } from '../components/crt.tsx';
import { InstancePage } from '../components/instance-page.tsx';
import { Button } from '../components/ui/button.tsx';
import { Checkbox } from '../components/ui/checkbox.tsx';
import { Input } from '../components/ui/input.tsx';
import { cn } from '../lib/utils.ts';

const LOG_SOURCES = [
  { active: true, file: 'ha.stderr.log' },
  { active: false, file: 'ha.stdout.log' },
  { active: false, file: 'serialv.log' },
] as const;

const LEVELS = [
  { active: true, count: 20, id: 'all', label: 'All' },
  { active: false, count: 18, id: 'info', label: 'Info' },
  { active: false, count: 1, id: 'warn', label: 'Warn' },
  { active: false, count: 1, id: 'error', label: 'Error' },
] as const;

const LOG_LINES = [
  {
    level: 'info',
    msg: 'Starting the instance "default" with VM driver "vz"',
    t: '10-18 08:01:12',
  },
  {
    level: 'info',
    msg: '[hostagent] hostagent socket created at /Users/ben/.lima/default/ha.sock',
    t: '10-18 08:01:13',
  },
  {
    level: 'info',
    msg: '[hostagent] Starting VZ (hint: to watch the boot progress, see "/Users/ben/.lima/default/serialv.log")',
    t: '10-18 08:01:13',
  },
  {
    level: 'info',
    msg: '[hostagent] [VZ] - vm state change: running',
    t: '10-18 08:01:15',
  },
  {
    level: 'info',
    msg: '[hostagent] Started vsock forwarder: 127.0.0.1:60022 -> vsock:22 on VM',
    t: '10-18 08:01:24',
  },
  {
    level: 'info',
    msg: 'Waiting for the essential requirement 1 of 2: "ssh"',
    t: '10-18 08:01:25',
  },
  {
    level: 'info',
    msg: 'The essential requirement 1 of 2 is satisfied',
    t: '10-18 08:01:34',
  },
  {
    level: 'info',
    msg: 'Waiting for the essential requirement 2 of 2: "user session is ready for ssh"',
    t: '10-18 08:01:34',
  },
  {
    level: 'info',
    msg: 'The essential requirement 2 of 2 is satisfied',
    t: '10-18 08:01:35',
  },
  {
    level: 'info',
    msg: '[hostagent] Waiting for the guest agent to be running',
    t: '10-18 08:01:52',
  },
  {
    level: 'info',
    msg: '[hostagent] Guest agent is running',
    t: '10-18 08:01:52',
  },
  {
    level: 'info',
    msg: 'Waiting for the final requirement 1 of 1: "boot scripts must have finished"',
    t: '10-18 08:01:53',
  },
  {
    level: 'info',
    msg: 'The final requirement 1 of 1 is satisfied',
    t: '10-18 08:02:01',
  },
  {
    level: 'info',
    msg: 'READY. Run `limactl shell default` to open the shell.',
    t: '10-18 08:02:01',
  },
  {
    level: 'info',
    msg: '[hostagent] Forwarding TCP from 127.0.0.1:5173 to 127.0.0.1:5173',
    t: '10-21 10:44:09',
  },
  {
    level: 'warn',
    msg: '[hostagent] failed to set up forwarding tcp port 5432 (negligible if already forwarded)',
    t: '10-21 10:44:09',
  },
  {
    level: 'info',
    msg: '[hostagent] Stopping forwarding TCP from 127.0.0.1:5173 to 127.0.0.1:5173',
    t: '10-21 11:58:40',
  },
  {
    level: 'error',
    msg: '[hostagent] guest agent events closed unexpectedly',
    t: '10-21 12:07:55',
  },
  {
    level: 'info',
    msg: '[hostagent] Waiting for the guest agent to be running',
    t: '10-21 12:07:56',
  },
  {
    level: 'info',
    msg: '[hostagent] Guest agent is running',
    t: '10-21 12:07:58',
  },
] as const;

const LEVEL_LABELS = {
  error: 'ERROR',
  info: 'INFO',
  warn: 'WARN',
} as const;

const LEVEL_STYLES = {
  error:
    'justify-self-start bg-primary px-1 text-primary-foreground text-shadow-none',
  info: 'text-phosphor-dim',
  warn: 'justify-self-start px-1 outline outline-1 -outline-offset-1',
} as const;

/* Instance / Logs: hostagent + serial logs with grep and level filters. */
export function InstanceLogsScreen() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-5 p-6">
        <InstancePage active="logs" />

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div
            aria-label="Log file"
            className="flex flex-wrap gap-2"
            role="group"
          >
            {LOG_SOURCES.map(source => (
              <Button
                aria-pressed={source.active}
                className="normal-case"
                key={source.file}
                type="button"
                variant={source.active ? 'default' : 'outline'}
              >
                {source.file}
              </Button>
            ))}
          </div>
          <div aria-label="Level" className="flex flex-wrap gap-2" role="group">
            {LEVELS.map(level => (
              <Button
                aria-pressed={level.active}
                key={level.id}
                type="button"
                variant={level.active ? 'default' : 'outline'}
              >
                {level.label} {level.count}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <label
            className="flex max-w-130 flex-1 basis-[320px] items-center gap-2.5"
            htmlFor="grep"
          >
            <span>GREP&gt;</span>
            <Input
              id="grep"
              placeholder="forwarding, requirement, error..."
              spellCheck={false}
              type="search"
            />
          </label>
          <span className="flex min-h-11 cursor-pointer items-center gap-2.5">
            <Checkbox defaultChecked />
            <span>FOLLOW</span>
          </span>
          <span className="flex min-h-11 cursor-pointer items-center gap-2.5">
            <Checkbox />
            <span>RAW JSON</span>
          </span>
          <Button className="ml-auto" type="button" variant="outline">
            Copy path
          </Button>
        </div>

        <CrtSection
          contentClassName="h-[560px] overflow-auto py-2"
          label="20 / 20 LINES"
          title="~/.lima/default/ha.stderr.log"
        >
          <div aria-label="Log output" role="log">
            {LOG_LINES.map(line => (
              <div
                className="grid grid-cols-[150px_72px_minmax(0,1fr)] gap-x-4 px-4 py-px hover:bg-phosphor-faint"
                key={`${line.t} ${line.msg}`}
              >
                <span className="whitespace-nowrap text-phosphor-dim">
                  {line.t}
                </span>
                <span className={cn(LEVEL_STYLES[line.level])}>
                  {LEVEL_LABELS[line.level]}
                </span>
                <span className="whitespace-pre-wrap wrap-anywhere">
                  {line.msg}
                </span>
              </div>
            ))}
            <p className="px-4 pt-2 pb-1 text-phosphor-dim">
              FOLLOWING
              <CrtCursor />
            </p>
          </div>
        </CrtSection>
      </main>
      <AppFooter
        keys={[
          ['/', 'GREP'],
          ['F', 'FOLLOW'],
          ['G', 'JUMP TO END'],
          ['F4', 'CONFIG'],
          ['F7', 'SSH'],
        ]}
        note="$ tail -f ~/.lima/default/ha.stderr.log"
      />
    </>
  );
}
