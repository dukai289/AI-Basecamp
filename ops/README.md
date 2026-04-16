# Ops

这里记录 AI-Basecamp 的运维配置、自动构建和访问统计相关说明。

## 主要文件

| 文件 | 说明 |
| --- | --- |
| `ops/cron/cron_ai-basecamp.sh` | 定时任务 shell 脚本：检查代码更新、按需构建站点、刷新 GoAccess 访问统计报表 |
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
- 有新 commit 时自动拉取代码并重新构建站点。
- 无论代码是否更新，都刷新 GoAccess 访问统计报表。

执行效果：

- 如果远端没有更新：跳过 `git pull` 和 `npm run build`，只刷新访问统计报表。
- 如果远端有更新：执行 `git pull --ff-only`，再执行 `npm run build`，最后刷新访问统计报表。
- 如果服务器工作区和远端分叉，`git pull --ff-only` 会失败，避免自动产生 merge commit。
- 如果没有匹配到 Nginx access log，GoAccess 报表生成会失败并写入日志。

执行流程：

1. 进入项目目录 `/home/dukai/WorkSpace/ai-basecamp`。
2. `git fetch --quiet origin` 获取远端状态。
3. 比较本地 `HEAD` 和远端跟踪分支。
4. 按条件决定是否执行 `git pull --ff-only` 和 `npm run build`。
5. 创建 `build/admin/` 目录。
6. 读取 `/var/log/nginx/ai-basecamp.access.log*`。
7. 生成 `build/admin/report_goaccess.tmp.html`。
8. 成功后替换为 `build/admin/report_goaccess.html`。

GoAccess 放在构建之后执行，因为 Docusaurus 构建会重写 `build/` 目录。如果先生成报表再构建，报表可能会被删除。

## 日志与报表

| 类型 | 位置 |
| --- | --- |
| 定时任务运行日志 | `/tmp/ai-basecamp-cron.log` |
| Nginx access log | `/var/log/nginx/ai-basecamp.access.log` |
| Nginx error log | `/var/log/nginx/ai-basecamp.error.log` |
| GoAccess 报表文件 | `/home/dukai/WorkSpace/ai-basecamp/build/admin/report_goaccess.html` |
| GoAccess 报表访问路径 | `/admin/report_goaccess.html` |

查看定时任务日志：

```bash
tail -f /tmp/ai-basecamp-cron.log
```

## 注意事项

- 服务器项目目录是 `/home/dukai/WorkSpace/ai-basecamp`。
- 服务器工作区不要直接改文件，避免 `git pull --ff-only` 失败。
- `build/` 是 Docusaurus 生成目录，不要手动维护。
- GoAccess 报表页面由 Nginx Basic Auth 保护。
- 不要把真实密码、token、`.htpasswd` 内容或服务器私有日志提交到仓库。
