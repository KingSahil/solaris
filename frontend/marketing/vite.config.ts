import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react-swc';
import { loadEnv, searchForWorkspaceRoot, type Plugin, type ProxyOptions } from 'vite';
import { defineConfig } from 'vitest/config';
import { headTags, NOT_FOUND, PAGES, pageFor } from './src/content/pages';

const MARK = '<!--page-head-->';

/**
 * Each page gets its own HTML file with its title, description and link-preview tags, so a link shared to /about
 * previews as About without running the site's JavaScript. The app keeps them up to date as the visitor moves
 * around (src/lib/pageMeta.ts). 404.html is for hosts that serve it for unknown paths.
 */
function pageHeads(): Plugin {
  let template = '';
  return {
    name: 'solaris-page-heads',
    // After Vite's own HTML step, which runs the post transform below and so hands over the finished template.
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (ctx.server) return html.replace(MARK, headTags(pageFor(ctx.originalUrl ?? '/')));
        template = html;
        return html.replace(MARK, headTags(pageFor('/')));
      },
    },
    generateBundle() {
      if (!template) return;
      for (const page of [...PAGES.filter(p => p.path !== '/'), NOT_FOUND]) {
        const fileName = page === NOT_FOUND ? '404.html' : `${page.path.slice(1)}/index.html`;
        this.emitFile({ type: 'asset', fileName, source: template.replace(MARK, headTags(page)) });
      }
    },
  };
}

const brand = fileURLToPath(new URL('../brand', import.meta.url));

export default defineConfig(({ mode }) => {
  const { API_PROXY_TARGET = 'http://localhost:5228' } = loadEnv(mode, process.cwd(), '');
  const proxy: Record<string, ProxyOptions> = {
    '/api': {
      target: API_PROXY_TARGET,
      configure: server => server.on('error', (_error, _request, response) => {
        if ('writeHead' in response && !response.headersSent)
          response.writeHead(502, { 'Content-Type': 'text/plain' }).end(`The API isn't answering at ${API_PROXY_TARGET}.`);
      }),
    },
  };

  return {
    plugins: [react(), pageHeads()],
    server: {
      proxy,
      // The tokens, fonts and logo live in ../brand, shared with the staff app.
      fs: { allow: [searchForWorkspaceRoot(process.cwd()), brand] },
    },
    preview: { proxy },
    test: {
      include: ['src/**/*.test.ts'],
      environment: 'node',
    },
  };
});
