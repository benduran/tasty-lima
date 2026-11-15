import { Redirect, Route, Switch } from 'wouter';
import { EditVmPage } from '../pages/edit-vm-page.tsx';
import { InstancesPage } from '../pages/instances-page.tsx';
import { NewVmPage } from '../pages/new-vm-page.tsx';
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
      <Route path={uiRoutes.editVm(':name')}>
        <EditVmPage />
      </Route>
      {/* <Route path={uiRoutes.templates()}>
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
      </Route> */}
      <Route path={uiRoutes.theme()}>
        <ThemePage />
      </Route>
    </Switch>
  );
}
