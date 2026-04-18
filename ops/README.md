# Ops

这里记录 AI-Basecamp 的运维配置、自动构建和访问统计相关说明。

## 主要文件

| 文件 | 说明 |
| --- | --- |
| `ops/cron/cron_ai-basecamp.sh` | 定时任务 shell 脚本：检查代码更新、按需安装依赖、在独立 worktree 构建、同步覆盖线上 `build/`、刷新 GoAccess 访问统计报表 |
| `ops/cron/crontab.template` | crontab 配置模板：每 30 分钟执行一次定时任务脚本 |
| `ops/nginx/ai-basecamp.sparkhub.space.conf` | 线上 Nginx 配置：HTTPS、静态站点、访问日志、GoAccess 报表访问认证 |
| `ops/nginx/ai-basecamp.local.conf` | 本地或测试 Nginx 配置 |

## 定时任务

定时任务每 30 分钟执行一次：

```cron
0,30 * * * * /home/dukai/WorkSpace/ai-basecamp/ops/cron/cron_ai-basecamp.sh
```

主要目的：

- 自动检查远端仓库是否有新 commit。
- 有新 commit 时自动拉取代码，必要时安装依赖，并在独立构建 worktree 中执行原始的 `npm run build`。
- 构建成功后再把构建产物同步覆盖到线上 `build/`，避免构建期间清空线上目录。
- 无论代码是否更新，都刷新 GoAccess 访问统计报表。

执行效果：

- 如果远端没有更新，且 `build/index.html` 已存在：跳过 `git pull`、依赖安装和构建，只刷新访问统计报表。
- 如果远端没有更新，但 `build/index.html` 不存在：构建当前 commit 并发布到 `build/`。这用于首次部署或线上目录缺失后的自恢复。
- 如果远端有更新：执行 `git pull --ff-only`；然后在 `/home/dukai/WorkSpace/ai-basecamp-build-worktree` 切到同一个 commit；如果构建 worktree 的 `node_modules` 不存在，或本次更新修改了 `package.json` / `package-lock.json`，先在构建 worktree 执行 `npm ci`；然后在构建 worktree 执行原始的 `npm run build`，构建成功后把构建 worktree 的 `build/` 同步覆盖到线上 `build/`，最后刷新访问统计报表。
- 如果服务器工作区和远端分叉，`git pull --ff-only` 会失败，避免自动产生 merge commit。
- 如果没有匹配到 Nginx access log，GoAccess 报表生成会失败并写入日志。
- 如果上一次 cron 还在运行，本次 cron 会通过 `/tmp/ai-basecamp-cron.lock` 跳过，避免两个构建流程重叠。

执行流程：

1. 进入项目目录 `/home/dukai/WorkSpace/ai-basecamp`。
2. `git fetch --quiet origin` 获取远端状态。
3. 比较本地 `HEAD` 和远端跟踪分支。
4. 按条件决定是否执行 `git pull --ff-only`。
5. 主项目目录不执行 `npm ci`；依赖安装只在构建 worktree 中进行。
6. 准备构建 worktree：`/home/dukai/WorkSpace/ai-basecamp-build-worktree`。
7. 在构建 worktree 切到当前线上项目的 `HEAD`。
8. 必要时在构建 worktree 执行 `npm ci`。
9. 在构建 worktree 执行 `npm run build`，让 Docusaurus 按默认行为生成构建 worktree 内部的 `build/`。
10. 确认构建 worktree 内的 `build/index.html` 存在。
11. 使用 `rsync` 把构建 worktree 的 `build/` 同步到线上项目的 `build/`，但排除 `index.html` 和 GoAccess 报表。
12. 最后用 `cp` + `mv` 替换线上 `build/index.html`，让入口页尽量最后切换。
13. 创建 `build/admin/` 目录。
14. 读取 `/var/log/nginx/ai-basecamp.access.log*`。
15. 生成 `build/admin/report_goaccess.tmp.html`。
16. 成功后替换为 `build/admin/report_goaccess.html`。

Docusaurus 仍然按默认方式写 `build/`，但写的是构建 worktree 内部的 `build/`，不是线上 Nginx 正在服务的 `build/`。只有构建成功后，脚本才把产物同步覆盖到线上 `build/`，并且最后替换 `index.html`，因此主站不会因为构建时间变长而长时间不可访问。

## 构建目录

线上 Nginx 继续指向：

```nginx
root /home/dukai/WorkSpace/ai-basecamp/build;
```

目录结构示例：

```text
/home/dukai/WorkSpace/ai-basecamp/
├── build/                  # Nginx 正在服务的线上静态目录
└── ops/

/home/dukai/WorkSpace/ai-basecamp-build-worktree/
├── build/                  # 临时构建目录，构建成功后同步到线上 build/
└── node_modules/
```

构建 worktree 是脚本管理的目录，不是线上服务目录。不要手动在该目录改内容。

## 日志与报表

| 类型 | 位置 |
| --- | --- |
| 定时任务运行日志 | `/tmp/ai-basecamp-cron.log` |
| 定时任务锁文件 | `/tmp/ai-basecamp-cron.lock` |
| Nginx access log | `/var/log/nginx/ai-basecamp.access.log` |
| Nginx error log | `/var/log/nginx/ai-basecamp.error.log` |
| 当前站点目录 | `/home/dukai/WorkSpace/ai-basecamp/build` |
| 构建 worktree | `/home/dukai/WorkSpace/ai-basecamp-build-worktree` |
| GoAccess 报表文件 | `/home/dukai/WorkSpace/ai-basecamp/build/admin/report_goaccess.html` |
| GoAccess 报表访问路径 | `/admin/report_goaccess.html` |

查看定时任务日志：

```bash
tail -f /tmp/ai-basecamp-cron.log
```

## 注意事项

- 服务器项目目录是 `/home/dukai/WorkSpace/ai-basecamp`。
- 服务器需要安装 `rsync`，部署脚本用它把构建 worktree 的产物同步到线上 `build/`。
- 服务器工作区不要直接改文件，避免 `git pull --ff-only` 失败。
- 依赖安装使用 `npm ci`，要求 `package-lock.json` 和 `package.json` 保持一致；不要在服务器上直接运行会改写 lockfile 的 `npm install`。
- 新增或升级 npm 依赖时，应在本地更新并提交 `package.json` 和 `package-lock.json`，服务器定时任务会在拉取到这些变化后自动执行 `npm ci`。
- `build/` 是 Nginx 正在服务的线上目录，不要在服务器项目目录里手动运行会清空 `build/` 的命令。
- 如果需要手动验证构建，优先在 `/home/dukai/WorkSpace/ai-basecamp-build-worktree` 中执行 `npm run build`。
- 构建 worktree 由脚本通过 `git worktree` 管理，不要在里面长期保留手工修改。
- GoAccess 报表页面由 Nginx Basic Auth 保护。
- 不要把真实密码、token、`.htpasswd` 内容或服务器私有日志提交到仓库。
