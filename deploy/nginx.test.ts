/// <reference types="node" />

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const nginxConfig = readFileSync(
  join(projectRoot, 'deploy/nginx.conf'),
  'utf8'
);
const dockerfile = readFileSync(join(projectRoot, 'Dockerfile'), 'utf8');
const buildScript = readFileSync(
  join(projectRoot, 'deploy/build-image.sh'),
  'utf8'
);

describe('ECS nginx runtime boundary', () => {
  it('현재 asset 다음에 직전 image asset만 조회하고 HTML로 fallback하지 않는다', () => {
    expect(nginxConfig).toContain('location ^~ /assets/');
    expect(nginxConfig).toContain('try_files $uri @previous_asset;');
    expect(nginxConfig).toContain('root /usr/share/nginx/previous-assets;');
    expect(nginxConfig).toContain('try_files $uri @asset_not_found;');
    expect(nginxConfig).toContain('location @asset_not_found');
    expect(nginxConfig).toContain(
      'add_header Cache-Control "no-store" always;'
    );
    expect(
      nginxConfig.match(
        /add_header Strict-Transport-Security "max-age=63072000" always;/g
      )
    ).toHaveLength(8);
    expect(dockerfile).toContain('ARG PREVIOUS_IMAGE=');
    expect(dockerfile).toContain(
      'COPY --from=previous /usr/share/nginx/html/assets/ /usr/share/nginx/previous-assets/'
    );
    expect(buildScript).toContain('*@sha256:*');
    expect(buildScript).toContain('git diff --quiet');
    expect(buildScript).toContain('--platform linux/amd64');
    expect(buildScript).toContain('--no-cache');
    expect(buildScript).toContain('commit SHA');
  });

  it('legacy Vercel API와 알 수 없는 API를 SPA 응답으로 위장하지 않는다', () => {
    expect(nginxConfig).toContain('location = /api/session/create');
    expect(nginxConfig).toContain('return 410');
    expect(nginxConfig).toContain('location ^~ /api/');
    expect(nginxConfig).toContain('return 404');
  });
});
