import { Redirect, Route, Switch } from 'wouter';
import { InstancesPage } from '../pages/instances-page.tsx';
import { CloneDialogScreen } from '../screens/clone-dialog-screen.tsx';
import { InstanceConfigScreen } from '../screens/instance-config-screen.tsx';
import { InstanceLogsScreen } from '../screens/instance-logs-screen.tsx';
import { InstanceSshScreen } from '../screens/instance-ssh-screen.tsx';
import { NewVmFromTemplateScreen } from '../screens/new-vm-from-template-screen.tsx';
import { NewVmScreen } from '../screens/new-vm-screen.tsx';
import { ShareTemplateDialogScreen } from '../screens/share-template-dialog-screen.tsx';
import { TemplatesEditorScreen } from '../screens/templates-editor-screen.tsx';
import { TemplatesLibraryScreen } from '../screens/templates-library-screen.tsx';
import { ThemeScreen } from '../screens/theme-screen.tsx';
import { uiRoutes } from './ui.ts';

export function TastyLimaRouter() {
  return (
    <Switch>
      <Route path={uiRoutes.home()}>
        <Redirect to={uiRoutes.instances()} />
      </Route>
      <Route path={uiRoutes.instances()}>
        <InstancesPage />
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
