# ECS 정적 runtime

`Dockerfile`은 현재 build와 직전 ECS image의 asset을 함께 제공한다. rolling
deployment 중 HTML과 hashed asset이 서로 다른 task에서 응답되더라도 직전
release 파일을 찾을 수 있게 하기 위함이다.

production image는 누락과 가변 tag를 방지하는 검증 script로 build한다.

```sh
deploy/build-image.sh \
  <ecr-repository>@sha256:<current-image-digest> \
  <production-env-file> \
  <ecr-repository>:<current-git-commit-sha>-<release-suffix>
```

script는 직전 image의 digest 고정, 필수 Vite 환경변수, clean tracked source,
현재 commit SHA가 포함된 immutable tag를 확인한 뒤 `--pull --no-cache`로
build한다. Apple Silicon에서도 ECS runtime과 같은 `linux/amd64`를 강제하며
환경변수 파일의 값은 출력하지 않는다.

새 image는 직전 image의 `/usr/share/nginx/html/assets`만
`/usr/share/nginx/previous-assets`에 복사한다. 직전 image의 호환 asset까지
재귀적으로 복사하지 않으므로 image에는 현재 release와 직전 release 두 세대만
남는다.

Nginx routing 경계:

- 현재 `/assets/*`를 먼저 찾고, 없으면 직전 release asset을 찾은 뒤 404를
  반환한다. 존재하지 않는 JavaScript 요청에 `index.html`을 반환하지 않는다.
- 직전 release보다 오래된 탭에서 Vite lazy chunk가 실패하면
  `vite:preloadError` handler가 30초당 한 번만 페이지를 새로고침한다.
- 폐기된 Vercel `/api/session/create`는 `410 Gone`을 반환한다. 현재 Web의
  세션 생성은 `https://gateway.mindthos.com/v1/sessions`를 사용한다.
- 그 밖의 `/api/*`는 JSON 404를 반환하며 SPA fallback에 들어가지 않는다.

Nginx access log는 CloudWatch로 전달되는 JSON 한 줄 형식이다.

- 최초 요청 경로는 `$request_uri`에서 query string을 제거한 `path`로 기록한다.
  SPA fallback이 내부적으로 `/index.html`로 바뀌어도 사용자가 요청한 경로를
  유지한다.
- 결제 callback의 인증값, OAuth code 등 민감한 query string과 referrer,
  클라이언트 IP는 기록하지 않는다.
- 장애 분석에 필요한 시각, method, path, status, 응답 크기·시간, host,
  Cloudflare Ray ID, User-Agent만 기록한다.
- 운영 티켓이나 메신저에 CloudWatch 원문을 붙여 넣지 않고 필요한 필드만
  최소한으로 공유한다.
