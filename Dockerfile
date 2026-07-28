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
    pnpm build

FROM nginx:1.30.4-alpine@sha256:97d490c12ba55b4946b01546d1c3ed324e8d41ab1c9fcb2a616aa470620e5b46

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=previous /usr/share/nginx/html/assets/ /usr/share/nginx/previous-assets/
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health >/dev/null || exit 1
