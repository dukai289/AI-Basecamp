#!/usr/bin/env bash
set -Eeuo pipefail

# =========================
# Environment
# =========================
export SHELL=/bin/bash
export PATH=/usr/local/bin:/usr/bin:/bin

# =========================
# Project
# =========================
PROJECT_NAME="ai-basecamp"
PROJECT_DIR="/home/dukai/WorkSpace/${PROJECT_NAME}"
OPS_DIR="${PROJECT_DIR}/ops"
BUILD_DIR="${PROJECT_DIR}/build"
ADMIN_DIR="${BUILD_DIR}/admin"

# =========================
# Git / Node
# =========================
GIT_BIN="/usr/bin/git"
NPM_BIN="/usr/bin/npm"

# =========================
# GoAccess / Logs
# =========================
ZCAT_BIN="/usr/bin/zcat"
GOACCESS_BIN="/usr/bin/goaccess"
NGINX_LOG_GLOB="/var/log/nginx/${PROJECT_NAME}.access.log*"
GOACCESS_LOG_FORMAT="COMBINED"

# =========================
# Output files
# =========================
REPORT_FILENAME="report_goaccess.html"
REPORT_FILE="${ADMIN_DIR}/${REPORT_FILENAME}"
TMP_REPORT_FILE="${ADMIN_DIR}/${REPORT_FILENAME}.tmp"

# =========================
# Runtime logs
# =========================
RUNTIME_LOG_DIR="/tmp"
RUNTIME_LOG_FILE="${RUNTIME_LOG_DIR}/${PROJECT_NAME}-cron.log"

# =========================
# Helpers
# =========================
timestamp() {
  date '+%F %T'
}

log() {
  echo "[$(timestamp)] $*" >> "${RUNTIME_LOG_FILE}"
}

on_error() {
  local exit_code=$?
  local line_no=$1
  log "ERROR: command failed at line ${line_no}, exit_code=${exit_code}"
  exit "${exit_code}"
}

trap 'on_error ${LINENO}' ERR

# =========================
# Build
# =========================
log "===== start git pull + build ====="

cd "${PROJECT_DIR}"
"${GIT_BIN}" pull >> "${RUNTIME_LOG_FILE}" 2>&1
"${NPM_BIN}" run build >> "${RUNTIME_LOG_FILE}" 2>&1

log "===== build done ====="

# =========================
# GoAccess report
# =========================
log "===== start goaccess ====="

mkdir -p "${ADMIN_DIR}"

shopt -s nullglob
NGINX_LOG_FILES=( ${NGINX_LOG_GLOB} )
shopt -u nullglob

if (( ${#NGINX_LOG_FILES[@]} == 0 )); then
  log "ERROR: no nginx access logs matched ${NGINX_LOG_GLOB}"
  exit 1
fi

log "Using nginx logs: ${NGINX_LOG_FILES[*]}"

{
  "${ZCAT_BIN}" -f "${NGINX_LOG_FILES[@]}" \
    | "${GOACCESS_BIN}" - \
        --log-format="${GOACCESS_LOG_FORMAT}" \
        -o "${TMP_REPORT_FILE}"
} >> "${RUNTIME_LOG_FILE}" 2>&1

mv -f "${TMP_REPORT_FILE}" "${REPORT_FILE}"

log "===== goaccess done ====="
