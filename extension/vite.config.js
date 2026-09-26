import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json' with { type: "json" };

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const manifestCopy = JSON.parse(JSON.stringify(manifest));

  if (env.VITE_BASE_FRONTEND_URL) {
    const frontendUrl = env.VITE_BASE_FRONTEND_URL.replace(/\/$/, '') + '/*';
    if (!manifestCopy.content_scripts[0].matches.includes(frontendUrl)) {
      manifestCopy.content_scripts[0].matches.push(frontendUrl);
    }
  }

  return {
    plugins: [react(), crx({ manifest: manifestCopy })],
  };
});
