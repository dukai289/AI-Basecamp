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
BUILD_LOG_FILE="${RUNTIME_LOG_DIR}/${PROJECT_NAME}-build.log"
GOACCESS_LOG_FILE="${RUNTIME_LOG_DIR}/${PROJECT_NAME}-goaccess.log"

# =========================
# Helpers
# =========================
timestamp() {
  date '+%F %T'
}

log_build() {
  echo "[$(timestamp)] $*" >> "${BUILD_LOG_FILE}"
}

log_goaccess() {
  echo "[$(timestamp)] $*" >> "${GOACCESS_LOG_FILE}"
}

# =========================
# Build
# =========================
log_build "===== start git pull + build ====="

cd "${PROJECT_DIR}"
"${GIT_BIN}" pull >> "${BUILD_LOG_FILE}" 2>&1
"${NPM_BIN}" run build >> "${BUILD_LOG_FILE}" 2>&1

log_build "===== build done ====="

# =========================
# GoAccess report
# =========================
mkdir -p "${ADMIN_DIR}"

log_goaccess "===== start goaccess ====="

"${ZCAT_BIN}" -f ${NGINX_LOG_GLOB} \
  | "${GOACCESS_BIN}" - \
      --log-format="${GOACCESS_LOG_FORMAT}" \
      -o "${TMP_REPORT_FILE}" >> "${GOACCESS_LOG_FILE}" 2>&1

mv -f "${TMP_REPORT_FILE}" "${REPORT_FILE}"

log_goaccess "===== goaccess done ====="
