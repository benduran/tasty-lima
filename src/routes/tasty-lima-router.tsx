import { Redirect, Route, Switch } from 'wouter';
import { CloneDialogPage } from '../pages/clone-dialog-page.tsx';
import { InstanceConfigPage } from '../pages/instance-config-page.tsx';
import { InstanceLogsPage } from '../pages/instance-logs-page.tsx';
import { InstanceSshPage } from '../pages/instance-ssh-page.tsx';
import { InstancesPage } from '../pages/instances-page.tsx';
import { NewVmFromTemplatePage } from '../pages/new-vm-from-template-page.tsx';
import { NewVmPage } from '../pages/new-vm-page.tsx';
import { ShareTemplateDialogPage } from '../pages/share-template-dialog-page.tsx';
import { TemplatesEditorPage } from '../pages/templates-editor-page.tsx';
import { TemplatesLibraryPage } from '../pages/templates-library-page.tsx';
import { ThemePage } from '../pages/theme-page.tsx';
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
        <NewVmPage />
      </Route>
      <Route path={uiRoutes.instanceConfig(':name')}>
        <InstanceConfigPage />
      </Route>
      <Route path={uiRoutes.instanceLogs(':name')}>
        <InstanceLogsPage />
      </Route>
      <Route path={uiRoutes.instanceSsh(':name')}>
        <InstanceSshPage />
      </Route>
      <Route path={uiRoutes.instanceClone(':name')}>
        <CloneDialogPage />
      </Route>
      <Route path={uiRoutes.templates()}>
        <TemplatesLibraryPage />
      </Route>
      <Route path={uiRoutes.templateEdit(':name')}>
        <TemplatesEditorPage />
      </Route>
      <Route path={uiRoutes.templateShare(':name')}>
        <ShareTemplateDialogPage />
      </Route>
      <Route path={uiRoutes.templateLaunch(':name')}>
        <NewVmFromTemplatePage />
      </Route>
      <Route path={uiRoutes.theme()}>
        <ThemePage />
      </Route>
    </Switch>
  );
}
