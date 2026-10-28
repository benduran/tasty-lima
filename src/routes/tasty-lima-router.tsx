import { Redirect, Route, Switch } from 'wouter';
import { CloneDialogScreen } from '@/screens/clone-dialog-screen';
import { InstanceConfigScreen } from '@/screens/instance-config-screen';
import { InstanceLogsScreen } from '@/screens/instance-logs-screen';
import { InstanceSshScreen } from '@/screens/instance-ssh-screen';
import { InstancesScreen } from '@/screens/instances-screen';
import { NewVmFromTemplateScreen } from '@/screens/new-vm-from-template-screen';
import { NewVmScreen } from '@/screens/new-vm-screen';
import { ShareTemplateDialogScreen } from '@/screens/share-template-dialog-screen';
import { TemplatesEditorScreen } from '@/screens/templates-editor-screen';
import { TemplatesLibraryScreen } from '@/screens/templates-library-screen';
import { ThemeScreen } from '@/screens/theme-screen';
import { uiRoutes } from './ui';

export function TastyLimaRouter() {
  return (
    <Switch>
      <Route path={uiRoutes.home()}>
        <Redirect to={uiRoutes.instances()} />
      </Route>
      <Route path={uiRoutes.instances()}>
        <InstancesScreen />
      </Route>
      <Route path={uiRoutes.newVm()}>
        <NewVmScreen />
      </Route>
      <Route path={uiRoutes.instanceConfig(':name')}>
        <InstanceConfigScreen />
      </Route>
      <Route path={uiRoutes.instanceLogs(':name')}>
        <InstanceLogsScreen />
      </Route>
      <Route path={uiRoutes.instanceSsh(':name')}>
        <InstanceSshScreen />
      </Route>
      <Route path={uiRoutes.instanceClone(':name')}>
        <CloneDialogScreen />
      </Route>
      <Route path={uiRoutes.templates()}>
        <TemplatesLibraryScreen />
      </Route>
      <Route path={uiRoutes.templateEdit(':name')}>
        <TemplatesEditorScreen />
      </Route>
      <Route path={uiRoutes.templateShare(':name')}>
        <ShareTemplateDialogScreen />
      </Route>
      <Route path={uiRoutes.templateLaunch(':name')}>
        <NewVmFromTemplateScreen />
      </Route>
      <Route path={uiRoutes.theme()}>
        <ThemeScreen />
      </Route>
    </Switch>
  );
}
