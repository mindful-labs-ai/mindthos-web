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

if ! git diff --quiet || ! git diff --cached --quiet; then
  fail "commit되지 않은 tracked source가 있습니다."
fi

commit_sha=$(git rev-parse HEAD)
case "$target_image" in
  *:"$commit_sha" | *:"$commit_sha"-*) ;;
  *) fail "target image tag에는 현재 commit SHA ${commit_sha}가 포함되어야 합니다." ;;
esac

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

echo "검증 완료: ${target_image}"
