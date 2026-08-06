#!/bin/sh

set -eu

usage() {
  echo "사용법: deploy/build-image.sh <previous-image@sha256:digest> <vite-env-file> <target-image:commit-sha-tag>" >&2
}

fail() {
  echo "오류: $1" >&2
  exit 1
}

if [ "$#" -ne 3 ]; then
  usage
  exit 2
fi

previous_image=$1
vite_env_file=$2
target_image=$3

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repository_root=$(CDPATH= cd -- "${script_dir}/.." && pwd)

cd "$repository_root"

case "$previous_image" in
  *@sha256:*) ;;
  *) fail "직전 image는 tag가 아니라 sha256 digest로 고정해야 합니다." ;;
esac

previous_digest=${previous_image##*@sha256:}
if [ "${#previous_digest}" -ne 64 ]; then
  fail "직전 image의 sha256 digest 길이가 올바르지 않습니다."
fi
case "$previous_digest" in
  *[!0-9a-f]*) fail "직전 image의 sha256 digest 형식이 올바르지 않습니다." ;;
esac

if [ ! -f "$vite_env_file" ]; then
  fail "Vite 환경변수 파일을 찾을 수 없습니다."
fi

required_vite_variables="
VITE_WEBAPP_SUPABASE_URL
VITE_WEBAPP_SUPABASE_ANON_KEY
VITE_SERVER_API_URL
VITE_TOSS_PAYMENTS_CLIENT_KEY
VITE_MIXPANEL_TOKEN
"

for variable_name in $required_vite_variables; do
  if ! grep -Eq "^[[:space:]]*${variable_name}=.+$" "$vite_env_file"; then
    fail "${variable_name} 값이 Vite 환경변수 파일에 없습니다."
  fi
done

api_base_count=$(grep -Ec '^[[:space:]]*VITE_SERVER_API_URL[[:space:]]*=' "$vite_env_file" || true)
if [ "$api_base_count" -ne 1 ] || ! grep -qx 'VITE_SERVER_API_URL=/' "$vite_env_file"; then
  fail "Docker 배포의 VITE_SERVER_API_URL은 same-origin 경로(/)여야 합니다."
fi

if [ -n "$(git status --porcelain --untracked-files=all)" ]; then
  fail "commit되지 않은 tracked/untracked source가 있습니다."
fi

commit_sha=$(git rev-parse HEAD)
case "$target_image" in
  *:"$commit_sha"-prod-*) release_branch=main ;;
  *:"$commit_sha"-staging-*) release_branch=develop ;;
  *)
    fail "target image tag는 현재 SHA 뒤에 -prod- 또는 -staging- 환경 표식을 포함해야 합니다."
    ;;
esac

git fetch --quiet origin "$release_branch"
release_commit=$(git rev-parse "origin/${release_branch}")
if [ "$commit_sha" != "$release_commit" ]; then
  fail "현재 commit은 origin/${release_branch} HEAD가 아닙니다."
fi

docker build \
  --platform linux/amd64 \
  --pull \
  --no-cache \
  --build-arg "PREVIOUS_IMAGE=${previous_image}" \
  --secret "id=vite_env,src=${vite_env_file}" \
  --tag "$target_image" \
  .

image_platform=$(docker image inspect --format '{{.Os}}/{{.Architecture}}' "$target_image")
if [ "$image_platform" != "linux/amd64" ]; then
  fail "build된 image platform이 linux/amd64가 아닙니다: ${image_platform}"
fi

sh deploy/verify-image.sh "$target_image"

echo "검증 완료: ${target_image}"
