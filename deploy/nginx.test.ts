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
const envExample = readFileSync(join(projectRoot, '.env.example'), 'utf8');
const indexHtml = readFileSync(join(projectRoot, 'index.html'), 'utf8');

describe('ECS nginx runtime boundary', () => {
  it('query string과 불필요한 개인정보성 header를 access log에 남기지 않는다', () => {
    expect(nginxConfig).toContain('map $request_uri $mindthos_request_path');
    expect(nginxConfig).toContain('~^([^?]*) $1;');
    expect(nginxConfig).toContain('log_format mindthos_json escape=json');
    expect(nginxConfig).toContain('access_log /dev/stdout mindthos_json;');
    expect(nginxConfig).toContain('"path":"$mindthos_request_path"');
    expect(nginxConfig).toContain('"cf_ray":"$http_cf_ray"');
    expect(nginxConfig).not.toContain('"$request"');
    expect(nginxConfig).not.toContain('$args');
    expect(nginxConfig).not.toContain('$query_string');
    expect(nginxConfig).not.toContain('$http_referer');
    expect(nginxConfig).not.toContain('$http_cf_connecting_ip');
    expect(nginxConfig).not.toContain('$http_x_forwarded_for');
  });

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

  it('server API를 환경별 upstream으로 same-origin proxy한다', () => {
    expect(nginxConfig).toContain('location ~ ^/v1(?:/|$)');
    expect(nginxConfig).toContain('proxy_pass ${MINDTHOS_API_PROXY_TARGET};');
    expect(nginxConfig).toContain('proxy_set_header Host $proxy_host;');
    expect(nginxConfig).toContain('proxy_set_header X-Forwarded-Host $host;');
    expect(dockerfile).toContain(
      'MINDTHOS_API_PROXY_TARGET=https://gateway.mindthos.com'
    );
    expect(dockerfile).toContain(
      'NGINX_ENVSUBST_FILTER=MINDTHOS_API_PROXY_TARGET'
    );
    expect(dockerfile).toContain(
      'COPY deploy/nginx.conf /etc/nginx/templates/default.conf.template'
    );
    expect(dockerfile).toContain("grep -qx 'VITE_SERVER_API_URL=/'");
    expect(envExample).toContain('VITE_SERVER_API_URL=/');
  });

  it('manifest를 불러올 때 Cloudflare Access cookie를 전달한다', () => {
    expect(indexHtml).toContain('crossorigin="use-credentials"');
  });
});
