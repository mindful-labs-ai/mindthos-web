ARG PREVIOUS_IMAGE=nginx:1.30.4-alpine@sha256:97d490c12ba55b4946b01546d1c3ed324e8d41ab1c9fcb2a616aa470620e5b46

FROM ${PREVIOUS_IMAGE} AS previous

USER root
RUN mkdir -p /usr/share/nginx/html/assets

FROM node:22.13.1-alpine AS build

WORKDIR /app
RUN npm install --global pnpm@10.3.0

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN --mount=type=secret,id=vite_env,target=/app/.env.production,required=true \
    test "$(grep -Ec '^[[:space:]]*VITE_SERVER_API_URL[[:space:]]*=' /app/.env.production)" -eq 1 && \
    grep -qx 'VITE_SERVER_API_URL=/' /app/.env.production && \
    pnpm build

FROM nginx:1.30.4-alpine@sha256:97d490c12ba55b4946b01546d1c3ed324e8d41ab1c9fcb2a616aa470620e5b46

ENV MINDTHOS_API_PROXY_TARGET=http://server:3000 \
    NGINX_ENVSUBST_FILTER=MINDTHOS_API_PROXY_TARGET

COPY --chmod=755 deploy/15-validate-api-proxy-target.sh /docker-entrypoint.d/15-validate-api-proxy-target.sh
COPY deploy/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=previous /usr/share/nginx/html/assets/ /usr/share/nginx/previous-assets/
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health >/dev/null || exit 1
