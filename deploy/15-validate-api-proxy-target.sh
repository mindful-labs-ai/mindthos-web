#!/bin/sh

set -eu

target=${MINDTHOS_API_PROXY_TARGET:-}

if [ "$target" != 'http://server:3000' ]; then
  echo "오류: MINDTHOS_API_PROXY_TARGET은 http://server:3000이어야 합니다." >&2
  exit 1
fi
