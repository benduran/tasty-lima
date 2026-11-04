import { CheckboxRow } from '../components/checkbox-row.tsx';
import { CrtCursor, CrtSection } from '../components/crt.tsx';
import { InstanceHeader } from '../components/instance-header.tsx';
import type { LogLine } from '../components/instance-logs/log-viewer.tsx';
import { LogViewer } from '../components/instance-logs/log-viewer.tsx';
import type { PressItem } from '../components/press-button-group.tsx';
import { PressButtonGroup } from '../components/press-button-group.tsx';
import { PromptSearch } from '../components/prompt-search.tsx';
import { Button } from '../components/ui/button.tsx';
import { PageLayout } from '../layouts/PageLayout.tsx';

const LOG_SOURCES: readonly PressItem[] = [
  { id: 'ha.stderr.log', label: 'ha.stderr.log', selected: true },
  { id: 'ha.stdout.log', label: 'ha.stdout.log' },
  { id: 'serialv.log', label: 'serialv.log' },
];

const LEVELS: readonly PressItem[] = [
  { count: 20, id: 'all', label: 'All', selected: true },
  { count: 18, id: 'info', label: 'Info' },
  { count: 1, id: 'warn', label: 'Warn' },
  { count: 1, id: 'error', label: 'Error' },
];

const LOG_LINES: readonly LogLine[] = [
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
];

export function InstanceLogsPage() {
  return (
    <>
      <PageLayout>
        <InstanceHeader active="logs" />

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <PressButtonGroup
            aria-label="Log file"
            itemClassName="normal-case"
            items={LOG_SOURCES}
          />
          <PressButtonGroup aria-label="Level" items={LEVELS} />
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <PromptSearch
            className="max-w-130 basis-[320px]"
            htmlFor="grep"
            placeholder="forwarding, requirement, error..."
            prompt="GREP>"
          />
          <CheckboxRow className="gap-2.5" defaultChecked label="FOLLOW" />
          <CheckboxRow className="gap-2.5" label="RAW JSON" />
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
            <LogViewer lines={LOG_LINES} />
            <p className="px-4 pt-2 pb-1 text-phosphor-dim">
              FOLLOWING
              <CrtCursor />
            </p>
          </div>
        </CrtSection>
      </PageLayout>
    </>
  );
}
