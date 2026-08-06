#!/bin/sh

set -eu

usage() {
  echo "사용법: deploy/verify-image.sh <image:tag>" >&2
}

fail() {
  echo "오류: $1" >&2
  exit 1
}

if [ "$#" -ne 1 ]; then
  usage
  exit 2
fi

target_image=$1
suffix=$$
network_name="mindthos-web-verify-${suffix}"
upstream_container="mindthos-web-upstream-${suffix}"
web_container="mindthos-web-runtime-${suffix}"

cleanup() {
  docker rm --force "$web_container" "$upstream_container" >/dev/null 2>&1 || true
  docker network rm "$network_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

default_proxy_target=$(
  docker image inspect \
    --format '{{range .Config.Env}}{{println .}}{{end}}' \
    "$target_image" |
    grep '^MINDTHOS_API_PROXY_TARGET=' || true
)
if [ "$default_proxy_target" != 'MINDTHOS_API_PROXY_TARGET=http://server:3000' ]; then
  fail "image 기본 API upstream이 Service Connect server:3000이 아닙니다."
fi

if docker run --rm \
  --platform linux/amd64 \
  --env MINDTHOS_API_PROXY_TARGET=https://gateway.mindthos.com \
  "$target_image" nginx -t >/dev/null 2>&1; then
  fail "외부 HTTPS API upstream이 runtime 검증을 통과했습니다."
fi

docker network create "$network_name" >/dev/null

docker run --detach --rm \
  --platform linux/amd64 \
  --name "$upstream_container" \
  --network "$network_name" \
  --network-alias server \
  node:22.13.1-alpine \
  node -e '
    const http = require("http");
    http.createServer((request, response) => {
      let bytes = 0;
      request.on("data", (chunk) => { bytes += chunk.length; });
      request.on("end", () => {
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({
          method: request.method,
          url: request.url,
          bytes,
          host: request.headers.host,
        }));
      });
    }).listen(3000, "0.0.0.0");
  ' >/dev/null

docker run --detach --rm \
  --platform linux/amd64 \
  --name "$web_container" \
  --network "$network_name" \
  "$target_image" >/dev/null

attempt=0
until docker exec "$web_container" wget -qO- http://127.0.0.1:8080/health >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 50 ]; then
    docker logs "$web_container" >&2 || true
    fail "nginx health check가 준비되지 않았습니다."
  fi
  sleep 0.1
done

attempt=0
until docker exec "$web_container" wget -qO- http://server:3000/health >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 50 ]; then
    docker logs "$upstream_container" >&2 || true
    fail "mock upstream이 준비되지 않았습니다."
  fi
  sleep 0.1
done

proxy_response=$(
  docker exec --env "WEB_HOST=${web_container}" "$upstream_container" node -e '
    const http = require("http");
    const body = Buffer.alloc(2 * 1024 * 1024);
    const request = http.request({
      hostname: process.env.WEB_HOST,
      port: 8080,
      path: "/v1/shared-documents/client-1/sent-1/token-secret/response?code=query-secret",
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": body.length,
      },
    }, (response) => {
      let responseBody = "";
      response.on("data", (chunk) => { responseBody += chunk; });
      response.on("end", () => {
        process.stdout.write(JSON.stringify({
          cacheControl: response.headers["cache-control"],
          strictTransportSecurity: response.headers["strict-transport-security"],
          upstream: JSON.parse(responseBody),
        }));
        if (response.statusCode !== 200) process.exitCode = 1;
      });
    });
    request.on("error", (error) => { throw error; });
    request.end(body);
  '
)

printf '%s\n' "$proxy_response" | grep -Fq '"method":"POST"' ||
  fail "same-origin proxy가 POST method를 보존하지 않았습니다."
printf '%s\n' "$proxy_response" | grep -Fq '"url":"/v1/shared-documents/client-1/sent-1/token-secret/response?code=query-secret"' ||
  fail "same-origin proxy가 path 또는 query string을 보존하지 않았습니다."
printf '%s\n' "$proxy_response" | grep -Fq '"bytes":2097152' ||
  fail "nginx가 정상 범위의 2MB request body를 upstream에 전달하지 않았습니다."
printf '%s\n' "$proxy_response" | grep -Fq '"cacheControl":"no-store"' ||
  fail "same-origin API 응답에 Cache-Control: no-store가 없습니다."
printf '%s\n' "$proxy_response" | grep -Fq \
  '"strictTransportSecurity":"max-age=63072000"' ||
  fail "same-origin API 응답에 HSTS가 없습니다."

oversized_status=$(
  docker exec --env "WEB_HOST=${web_container}" "$upstream_container" node -e '
    const http = require("http");
    const body = Buffer.alloc(4 * 1024 * 1024);
    const request = http.request({
      hostname: process.env.WEB_HOST,
      port: 8080,
      path: "/v1/shared-documents/client-1/sent-1/oversized-token/response",
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": body.length,
      },
    }, (response) => {
      response.resume();
      response.on("end", () => { process.stdout.write(String(response.statusCode)); });
    });
    request.on("error", (error) => { throw error; });
    request.end(body);
  '
)
if [ "$oversized_status" != "413" ]; then
  fail "nginx의 4MB request 응답이 413이 아닙니다: ${oversized_status}"
fi

access_logs=$(docker logs "$web_container" 2>&1)
printf '%s\n' "$access_logs" | grep -Fq \
  '"path":"/v1/shared-documents/client-1/sent-1/[REDACTED]/response"' ||
  fail "공유문서 access token이 nginx log에서 마스킹되지 않았습니다."
if printf '%s\n' "$access_logs" | grep -Eq 'token-secret|oversized-token|query-secret'; then
  fail "공유문서 token 또는 query string이 nginx log에 노출됐습니다."
fi

echo "runtime 검증 완료: same-origin proxy, 3MB limit, token redaction, internal upstream"
