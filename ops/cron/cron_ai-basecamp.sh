#!/usr/bin/env bash
set -Euo pipefail

# =========================
# 脚本流程说明
# =========================
# 这个脚本设计为由 cron 每 30 分钟执行一次。
#
# 这个脚本里有两类任务，它们的触发规则不同：
# 1. 站点部署：
#    - 先检查当前跟踪的远端分支是否有新 commit。
#    - 如果没有新 commit，就跳过 `git pull` 和 `npm run build`。
#    - 如果有新 commit，就执行 `git pull --ff-only`，然后重新构建站点。
#    - 这里故意使用 `--ff-only`：如果服务器上的工作区和远端产生分叉，
#      脚本应该直接失败并写日志，而不是自动创建不可控的 merge commit。
#
# 2. GoAccess 报表：
#    - 无论代码有没有更新，每次 cron 执行都要刷新访问报表。
#    - GoAccess 必须放在可选的 build 之后执行。Docusaurus 构建会重写整个
#      `build/` 目录，如果先生成报表再 build，新生成的
#      `build/admin/report_goaccess.html` 可能会被删除。
#
# 所有运行日志统一写入：
#   /tmp/ai-basecamp-cron.log
#
# 报表采用“先写临时文件，再替换正式文件”的方式生成：
#   build/admin/report_goaccess.tmp.html -> build/admin/report_goaccess.html
# 注意：临时文件也必须以 `.html` 结尾，因为 GoAccess 会校验输出文件扩展名，
# 像 `report_goaccess.html.tmp` 这种文件名会被 GoAccess 拒绝。

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
TMP_REPORT_FILE="${ADMIN_DIR}/report_goaccess.tmp.html"

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

run_deploy() {
  set -Eeuo pipefail
  trap 'log "ERROR: deploy command failed at line ${LINENO}, exit_code=$?"' ERR

  # =========================
  # Project root
  # =========================
  cd "${PROJECT_DIR}"

  # =========================
  # Git / Build
  # =========================
  log "===== check git updates ====="

  "${GIT_BIN}" fetch --quiet origin

  LOCAL_COMMIT=$("${GIT_BIN}" rev-parse HEAD)
  REMOTE_COMMIT=$("${GIT_BIN}" rev-parse '@{u}')

  if [[ "${LOCAL_COMMIT}" == "${REMOTE_COMMIT}" ]]; then
    log "No git updates, skip pull + build."
  else
    log "Git updates found: ${LOCAL_COMMIT} -> ${REMOTE_COMMIT}"
    log "===== start git pull + build ====="

    "${GIT_BIN}" pull --ff-only >> "${RUNTIME_LOG_FILE}" 2>&1

    if [[ ! -d node_modules ]] || "${GIT_BIN}" diff --name-only "${LOCAL_COMMIT}" HEAD -- package.json package-lock.json | grep -q .; then
      log "Dependency files changed or node_modules missing, run npm ci."
      "${NPM_BIN}" ci >> "${RUNTIME_LOG_FILE}" 2>&1
    else
      log "Dependencies unchanged, skip npm ci."
    fi

    "${NPM_BIN}" run build >> "${RUNTIME_LOG_FILE}" 2>&1

    log "===== build done ====="
  fi
}

DEPLOY_EXIT_CODE=0
( run_deploy ) || DEPLOY_EXIT_CODE=$?

if (( DEPLOY_EXIT_CODE != 0 )); then
  log "Deploy step failed with exit_code=${DEPLOY_EXIT_CODE}; continue to GoAccess report."
fi

# =========================
# GoAccess report
# =========================
log "===== start goaccess ====="

if ! mkdir -p "${ADMIN_DIR}"; then
  log "ERROR: failed to create admin dir: ${ADMIN_DIR}"
  exit 1
fi

shopt -s nullglob
NGINX_LOG_FILES=( ${NGINX_LOG_GLOB} )
shopt -u nullglob

if (( ${#NGINX_LOG_FILES[@]} == 0 )); then
  log "ERROR: no nginx access logs matched ${NGINX_LOG_GLOB}"
  exit 1
fi

log "Using nginx logs: ${NGINX_LOG_FILES[*]}"

if ! {
  "${ZCAT_BIN}" -f "${NGINX_LOG_FILES[@]}" \
    | "${GOACCESS_BIN}" - \
        --log-format="${GOACCESS_LOG_FORMAT}" \
        -o "${TMP_REPORT_FILE}"
} >> "${RUNTIME_LOG_FILE}" 2>&1; then
  log "ERROR: goaccess report generation failed"
  exit 1
fi

if ! mv -f "${TMP_REPORT_FILE}" "${REPORT_FILE}"; then
  log "ERROR: failed to move report into place: ${TMP_REPORT_FILE} -> ${REPORT_FILE}"
  exit 1
fi

log "===== goaccess done ====="

if (( DEPLOY_EXIT_CODE != 0 )); then
  exit "${DEPLOY_EXIT_CODE}"
fi
