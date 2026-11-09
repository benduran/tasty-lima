import { VMSettingsForm } from '../components/vm-settings-form/vm-settings-form.tsx';
import { PageLayout } from '../layouts/PageLayout.tsx';
import { uiRoutes } from '../routes/ui.ts';

/* New VM: the create form with a live lima.yaml preview aside. */
export function NewVmPage() {
  return (
    <PageLayout
      subheader={{
        breadcrumbs: [
          { title: 'Instances', url: uiRoutes.instances() },
          { title: 'New', url: uiRoutes.newVm() },
        ],
        title: 'New VM',
      }}
    >
      <VMSettingsForm />
    </PageLayout>
  );
}
