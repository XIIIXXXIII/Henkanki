#!/bin/sh
# Thin Unix bootstrap; conversions stay in Henkanki and its explicitly discovered local adapters.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
if ! command -v node >/dev/null 2>&1; then
  echo "Henkanki requires Node.js 20 or newer for the JavaScript CLI." >&2
  exit 1
fi
exec node "$ROOT/apps/cli/henkanki.mjs" doctor "$@"
