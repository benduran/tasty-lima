import { Buffer } from 'node:buffer';
import type { Context, Hono } from 'hono';
import { getMimeType } from 'hono/utils/mime';
import { apiRoutes } from '../../shared/routes.ts';
import type { FakeFsEntry } from '../fake-fs/fake-fs.ts';
import type { CLIArgs } from '../schema.ts';
import type { ApiAuthOpts } from './api-auth.ts';
import { apiAuth } from './api-auth.ts';
import { WEBSOCKET_connect } from './WEBSOCKET_connect.ts';

const relPathToAbsolutePathFragment = (possibleRelPath: string) => {
  const replaced = possibleRelPath.replaceAll('\\', '/');
  // always produce an absolute fragment, so it can be compared against request paths
  return `/${replaced.replace(/^\.?\//, '')}`;
};

type BindAllOpts = Pick<CLIArgs, 'noUI'> & { auth: ApiAuthOpts };

export async function bindAll(server: Hono, { auth, noUI }: BindAllOpts) {
  server.use(`${apiRoutes.base()}/*`, apiAuth(auth));

  const handlers = [WEBSOCKET_connect];

  for (const bind of handlers) {
    bind(server);
  }

  if (!noUI) {
    const { FAKE_FS } = await import('../fake-fs/content.gen.ts');

    const entriesByPath = new Map(
      FAKE_FS.map(
        entry => [relPathToAbsolutePathFragment(entry.relPath), entry] as const,
      ),
    );

    server.get('*', ctx => {
      const entry = entriesByPath.get(ctx.req.path);

      if (!entry) {
        // the UI is a SPA; fall back to the html shell for extension-less deep
        // links (e.g. /instances/edit/foo), and 404 anything that looks like an asset
        const lastSegment = ctx.req.path.split('/').at(-1) ?? '';
        if (!lastSegment.includes('.')) {
          const indexEntry = entriesByPath.get('/index.html');
          if (indexEntry) {
            return serveFakeFsEntry(ctx, indexEntry);
          }
        }
        return ctx.notFound();
      }

      return serveFakeFsEntry(ctx, entry);
    });
  }
}

function serveFakeFsEntry(ctx: Context, entry: FakeFsEntry): Response {
  const isIndex = entry.relPath === 'index.html';

  return ctx.body(Buffer.from(entry.b64Contents, 'base64'), 200, {
    // vite content-hashes asset filenames, so those never change, but the html shell does
    'cache-control': isIndex
      ? 'no-cache'
      : 'public, max-age=31536000, immutable',
    'content-type': getMimeType(entry.relPath) ?? 'application/octet-stream',
  });
}
