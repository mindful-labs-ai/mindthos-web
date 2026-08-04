FROM node:22.13.1-alpine AS build

WORKDIR /app
RUN npm install --global pnpm@10.3.0

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN --mount=type=secret,id=vite_env,target=/app/.env.production,required=true \
    pnpm build

FROM nginx:1.27-alpine

ENV MINDTHOS_API_PROXY_TARGET=https://gateway.mindthos.com \
    NGINX_ENVSUBST_FILTER=MINDTHOS_API_PROXY_TARGET

COPY deploy/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health >/dev/null || exit 1
