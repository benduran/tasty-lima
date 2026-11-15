import { Redirect, useRoute } from 'wouter';
import { VMSettingsForm } from '../components/vm-settings-form/vm-settings-form.tsx';
import { PageLayout } from '../layouts/PageLayout.tsx';
import { uiRoutes } from '../routes/ui.ts';

/* Edit VM: the VM settings form, loaded with an existing instance's parsed lima.yaml */
export function EditVmPage() {
  /** routing */
  const [route, params] = useRoute<{ name: string }>(uiRoutes.editVm(':name'));

  if (!route || !params) {
    return <Redirect to={uiRoutes.instances()} />;
  }

  return (
    <PageLayout
      subheader={{
        breadcrumbs: [
          { title: 'Instances', url: uiRoutes.instances() },
          { title: `Edit ${params.name}`, url: uiRoutes.editVm(params.name) },
        ],
        title: `Edit ${params.name}`,
      }}
    >
      <VMSettingsForm vmToEdit={params.name} />
    </PageLayout>
  );
}
