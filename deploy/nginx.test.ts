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
const runtimeGuard = readFileSync(
  join(projectRoot, 'deploy/15-validate-api-proxy-target.sh'),
  'utf8'
);
const imageVerifier = readFileSync(
  join(projectRoot, 'deploy/verify-image.sh'),
  'utf8'
);
const envExample = readFileSync(join(projectRoot, '.env.example'), 'utf8');

describe('ECS nginx runtime boundary', () => {
  it('query string과 불필요한 개인정보성 header를 access log에 남기지 않는다', () => {
    expect(nginxConfig).toContain('map $request_uri $mindthos_request_path');
    expect(nginxConfig).toContain(
      '$mindthos_shared_document_path/[REDACTED]$mindthos_shared_document_suffix'
    );
    expect(nginxConfig).toContain('/(?:v1/)?shared-documents/');
    expect(nginxConfig).toContain('~^([^?]*) $1;');
    expect(nginxConfig).toContain('log_format mindthos_json escape=json');
    expect(nginxConfig).toContain('error_log /dev/stderr crit;');
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
    ).toHaveLength(9);
    expect(dockerfile).toContain('ARG PREVIOUS_IMAGE=');
    expect(dockerfile).toContain(
      'COPY --from=previous /usr/share/nginx/html/assets/ /usr/share/nginx/previous-assets/'
    );
    expect(buildScript).toContain('*@sha256:*');
    expect(buildScript).toContain(
      'git status --porcelain --untracked-files=all'
    );
    expect(buildScript).toContain('release_branch=main');
    expect(buildScript).toContain('release_branch=develop');
    expect(buildScript).toContain('git fetch --quiet origin "$release_branch"');
    expect(buildScript).toContain('--platform linux/amd64');
    expect(buildScript).toContain('--no-cache');
    expect(buildScript).toContain('commit_sha=$(git rev-parse HEAD)');
  });

  it('legacy Vercel API와 알 수 없는 API를 SPA 응답으로 위장하지 않는다', () => {
    expect(nginxConfig).toContain('location = /api/session/create');
    expect(nginxConfig).toContain('return 410');
    expect(nginxConfig).toContain('location ^~ /api/');
    expect(nginxConfig).toContain('return 404');
  });

  it('server API를 내부 upstream으로만 same-origin proxy한다', () => {
    expect(nginxConfig).toContain('location ~ ^/v1(?:/|$)');
    expect(nginxConfig).toContain('client_max_body_size 3m;');
    expect(nginxConfig).toContain('proxy_pass ${MINDTHOS_API_PROXY_TARGET};');
    expect(nginxConfig).toContain('proxy_set_header Host $proxy_host;');
    expect(nginxConfig).toContain('proxy_set_header X-Forwarded-Host $host;');
    expect(nginxConfig).toContain('proxy_hide_header Cache-Control;');
    expect(dockerfile).toContain(
      'MINDTHOS_API_PROXY_TARGET=http://server:3000'
    );
    expect(dockerfile).toContain(
      'NGINX_ENVSUBST_FILTER=MINDTHOS_API_PROXY_TARGET'
    );
    expect(dockerfile).toContain(
      'COPY deploy/nginx.conf /etc/nginx/templates/default.conf.template'
    );
    expect(dockerfile).toContain(
      'deploy/15-validate-api-proxy-target.sh /docker-entrypoint.d/15-validate-api-proxy-target.sh'
    );
    expect(runtimeGuard).toContain(
      'MINDTHOS_API_PROXY_TARGET은 http://server:3000이어야 합니다.'
    );
    expect(imageVerifier).toContain('--network-alias server');
    expect(dockerfile).toContain("grep -qx 'VITE_SERVER_API_URL=/'");
    expect(dockerfile).toContain('VITE_SERVER_API_URL[[:space:]]*=');
    expect(buildScript).toContain("grep -qx 'VITE_SERVER_API_URL=/'");
    expect(buildScript).toContain('api_base_count');
    expect(buildScript).toContain('sh deploy/verify-image.sh "$target_image"');
    expect(imageVerifier).toContain('"bytes":2097152');
    expect(imageVerifier).toContain('Buffer.alloc(4 * 1024 * 1024)');
    expect(imageVerifier).toContain('"cacheControl":"no-store"');
    expect(imageVerifier).toContain(
      'token-secret|oversized-token|query-secret'
    );
    expect(envExample).toContain('VITE_SERVER_API_URL=/');
  });
});
