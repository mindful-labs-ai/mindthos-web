import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const dockerfile = readFileSync('Dockerfile', 'utf8');
const envExample = readFileSync('.env.example', 'utf8');
const nginxConfig = readFileSync('deploy/nginx.conf', 'utf8');
const indexHtml = readFileSync('index.html', 'utf8');

describe('staging same-origin deployment boundary', () => {
  it('proxies server API requests to the runtime upstream', () => {
    expect(nginxConfig).toContain('location ~ ^/v1(?:/|$)');
    expect(nginxConfig).toContain('proxy_pass ${MINDTHOS_API_PROXY_TARGET};');
    expect(dockerfile).toContain(
      'NGINX_ENVSUBST_FILTER=MINDTHOS_API_PROXY_TARGET'
    );
    expect(dockerfile).toContain(
      'COPY deploy/nginx.conf /etc/nginx/templates/default.conf.template'
    );
    expect(dockerfile).toContain("grep -qx 'VITE_SERVER_API_URL=/'");
    expect(envExample).toContain('VITE_SERVER_API_URL=/');
  });

  it('sends the Cloudflare Access cookie when loading the manifest', () => {
    expect(indexHtml).toContain('crossorigin="use-credentials"');
  });
});
