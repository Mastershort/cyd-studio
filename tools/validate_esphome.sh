#!/usr/bin/env bash
# Validate every golden file with ESPHome.
#   tools/validate_esphome.sh           -> esphome config  (fast, every PR)
#   tools/validate_esphome.sh compile   -> esphome compile (slow, nightly / release)
#   tools/validate_esphome.sh compile a.yaml b.yaml -> only these golden files
# Uses the official Docker image ESPHOME_IMAGE unless ESPHOME_BIN points to a local esphome.
set -euo pipefail

MODE="${1:-config}"
shift || true
ONLY=("$@")
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$ROOT/tests/esphome"
ESPHOME_IMAGE="${ESPHOME_IMAGE:-ghcr.io/esphome/esphome:2026.9.0}"

mkdir -p "$WORK"
cp "$ROOT"/tests/golden/*.yaml "$WORK"/

run() {
  if [[ -n "${ESPHOME_BIN:-}" ]]; then
    (cd "$WORK" && "$ESPHOME_BIN" "$MODE" "$1")
  else
    # the cache volume keeps the toolchain between the files of one run
    docker run --rm -v "$WORK":/config -v "$ROOT/.esphome-cache":/cache "$ESPHOME_IMAGE" "$MODE" "/config/$1"
  fi
}

failed=0
for file in "$WORK"/*.yaml; do
  name="$(basename "$file")"
  [[ "$name" == "secrets.yaml" ]] && continue
  if [[ ${#ONLY[@]} -gt 0 && ! " ${ONLY[*]} " =~ " $name " ]]; then continue; fi
  echo "::group::esphome $MODE $name"
  if run "$name"; then
    echo "OK  $name"
  else
    echo "FAIL $name"
    failed=1
  fi
  echo "::endgroup::"
done
exit $failed
