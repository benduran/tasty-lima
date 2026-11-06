import { CrtSection } from '../components/crt.tsx';
import { InstanceSidebar } from '../components/instance-sidebar/instance-sidebar.tsx';
import { InstancesGrid } from '../components/instances-grid/instances-grid.tsx';
import { useQueryInstances } from '../hooks/use-query-instances.ts';
import { PageLayout } from '../layouts/PageLayout.tsx';

/* Instances: the fleet table plus the selected instance detail panel. */
export function InstancesPage() {
  /** queries */
  const { data: instances, isPending } = useQueryInstances();

  return (
    <>
      <PageLayout subheader={{ title: 'Instances' }}>
        <CrtSection title="INSTANCES">
          <InstancesGrid instances={instances} loading={isPending} />
        </CrtSection>
      </PageLayout>
      <InstanceSidebar />
    </>
  );
}
