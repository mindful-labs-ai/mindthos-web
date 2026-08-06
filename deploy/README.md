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

script는 직전 image의 digest 고정, 필수 Vite 환경변수, clean
tracked/untracked source, 현재 commit SHA가 포함된 immutable tag를 확인한다.
`-prod-` tag는 `origin/main`, `-staging-` tag는 `origin/develop`의 정확한 HEAD에서만
허용한다. 그 뒤 `--pull --no-cache`로 build한다. Apple Silicon에서도 ECS
runtime과 같은 `linux/amd64`를 강제하며 환경변수 파일의 값은 출력하지 않는다.
build 직후 실제 image를 임시 Docker network에서 mock upstream과 연결해 다음
항목까지 통과해야 성공한다.

- API upstream을 Service Connect `http://server:3000` 하나로 고정
- `/v1/*`의 method·path·query string·2MB request body 보존
- 서버의 3MB body 계약을 넘는 4MB 요청 차단
- 공유문서 URL token과 query string의 access log 비노출

새 image는 직전 image의 `/usr/share/nginx/html/assets`만
`/usr/share/nginx/previous-assets`에 복사한다. 직전 image의 호환 asset까지
재귀적으로 복사하지 않으므로 image에는 현재 release와 직전 release 두 세대만
남는다.

Nginx routing 경계:

- `/v1/*`는 `MINDTHOS_API_PROXY_TARGET`으로 전달한다. staging과 production
  ECS는 `http://server:3000`(Service Connect)을 주입하고 모든 Docker build는
  `VITE_SERVER_API_URL=/`를 사용한다. 브라우저가 `gateway*.mindthos.com`을
  cross-origin으로 직접 호출하지 않으므로 별도의 CORS preflight가 없다. image
  기본 upstream도 `http://server:3000`이며 다른 값은 기동 단계에서 거부한다.
- `/v1/*` request body는 서버와 같은 3MB까지 허용한다. nginx 기본값 1MB를 쓰면
  base64 서명이 포함된 정상 공개문서 제출이 `413`으로 차단될 수 있다.
- `/v1/*` 응답은 `Cache-Control: no-store`로 고정해 인증·문서 응답이 browser나
  Cloudflare edge cache에 저장되지 않게 한다.
- 현재 `/assets/*`를 먼저 찾고, 없으면 직전 release asset을 찾은 뒤 404를
  반환한다. 존재하지 않는 JavaScript 요청에 `index.html`을 반환하지 않는다.
- 직전 release보다 오래된 탭에서 Vite lazy chunk가 실패하면
  `vite:preloadError` handler가 30초당 한 번만 페이지를 새로고침한다.
- 폐기된 Vercel `/api/session/create`는 `410 Gone`을 반환한다. 현재 Web의
  세션 생성은 same-origin `/v1/sessions`를 사용한다.
- 그 밖의 `/api/*`는 JSON 404를 반환하며 SPA fallback에 들어가지 않는다.

Nginx access log는 CloudWatch로 전달되는 JSON 한 줄 형식이다.

- 최초 요청 경로는 `$request_uri`에서 query string을 제거한 `path`로 기록한다.
  SPA fallback이 내부적으로 `/index.html`로 바뀌어도 사용자가 요청한 경로를
  유지한다.
- `/shared-documents/*`와 `/v1/shared-documents/*`의 URL access token은
  `[REDACTED]`로 바꿔 기록한다.
- 결제 callback의 인증값, OAuth code 등 민감한 query string과 referrer,
  클라이언트 IP는 기록하지 않는다.
- nginx 기본 error log는 body buffering·413·upstream 오류에 raw request target을
  포함하므로 server 범위에서 `crit`만 stderr로 보낸다. 요청 실패는 token을
  마스킹한 structured access log의 status·latency와 server/Service Connect
  로그로 진단한다.
- 장애 분석에 필요한 시각, method, path, status, 응답 크기·시간, host,
  Cloudflare Ray ID, User-Agent만 기록한다.
- 운영 티켓이나 메신저에 CloudWatch 원문을 붙여 넣지 않고 필요한 필드만
  최소한으로 공유한다.
