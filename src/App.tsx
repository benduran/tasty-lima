import { MissingTokenNotice } from './components/missing-token-notice.tsx';
import { AppShell } from './layouts/AppShell.tsx';
import { apiToken } from './lib/api-token.ts';
import { TastyLimaProviders } from './providers/index.ts';
import { TastyLimaRouter } from './routes/index.ts';

export function App() {
  if (!apiToken) return <MissingTokenNotice />;

  return (
    <TastyLimaProviders>
      <AppShell>
        <TastyLimaRouter />
      </AppShell>
    </TastyLimaProviders>
  );
}
