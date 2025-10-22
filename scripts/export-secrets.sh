#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${VAULT_ADDR:-}" || -z "${VAULT_TOKEN:-}" ]]; then
  echo "VAULT_ADDR and VAULT_TOKEN must be set" >&2
  exit 1
fi

ENVIRONMENT="${1:-production}"
MOUNT_PATH="kv/polliwall/${ENVIRONMENT}"
OUTPUT_DIR="${2:-.secrets}" 
mkdir -p "${OUTPUT_DIR}"

secrets_json=$(vault kv get -format=json "${MOUNT_PATH}")

echo "Exporting secrets from ${MOUNT_PATH}"

printf '%s\n' "${secrets_json}" | jq '.data.data' > "${OUTPUT_DIR}/runtime-config.json"

jq -r '.data.data | "GEMINI_API_KEY=\(.GEMINI_API_KEY)\nGA4_MEASUREMENT_ID=\(.GA4_MEASUREMENT_ID)\nSENTRY_DSN=\(.SENTRY_DSN)"' <<<"${secrets_json}" > "${OUTPUT_DIR}/vercel.env"

echo "Secrets exported to ${OUTPUT_DIR}" 
